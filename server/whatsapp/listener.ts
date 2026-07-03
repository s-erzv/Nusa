import { whatsappClient, sendMessage } from './client.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { processFinanceChat, analyzeFinances } from '../services/financeAiService.js';
import { addUserMessage, addAssistantMessage, getConversationHistory, setPendingAction, getPendingAction, clearPendingAction, isConfirmation, isRejection } from '../services/conversationStore.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { handleOnboardingMessage } from './onboardingFlow.js';

// Helper: format IDR currency
const formatIDR = (amount: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

// Helper: send reply and store in conversation memory
const reply = async (message: any, userId: string, text: string) => {
  await message.reply(text);
  addAssistantMessage(userId, text);
};

export const setupWhatsAppListener = () => {
  whatsappClient.on('message', async (message: any) => {
    // Ignore status broadcasts and group messages
    if (message.isStatus || message.from.includes('@g.us')) return;
    
    // Extracted sender ID (LID)
    const lid = message.from.split('@')[0];
    const text = message.body.trim();
    
    if (!text) return;

    // Retrieve real contact information to get actual phone number
    const contact = await message.getContact();
    
    // DEBUG: Let's see what WhatsApp actually gives us
    console.log(`[WhatsApp DEBUG] Contact payload:`, JSON.stringify(contact, null, 2));

    // Fix: whatsapp-web.js sometimes puts the LID in `contact.number` and the real phone in `contact.id.user`!
    const realPhone = contact?.id?.user || contact.number || lid; 
    
    console.log(`[WhatsApp] Received message from ${realPhone} (LID: ${lid}): ${text}`);

    try {
      // 1. Check if user exists in profiles table
      let { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, phone_number, onboarding_status, monthly_budget')
        .eq('phone_number', realPhone)
        .maybeSingle();
        
      let userId = profile?.id;

      // 2. Auto-register if not exists
      if (!profile) {
        console.log(`[WhatsApp] Auto-registering new user: ${realPhone}`);
        // Create user in auth.users
        const randomPassword = crypto.randomBytes(16).toString('hex');
        
        let authUser = null;
        const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          phone: `+${realPhone}`, 
          password: randomPassword,
          phone_confirm: true,
        });

        if (authError) {
          if (authError.code === 'phone_exists' || authError.status === 422) {
            // User already exists in auth.users but not in profiles. Let's find them.
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            authUser = usersData.users.find(u => u.phone === `+${realPhone}` || u.phone === realPhone);
            if (!authUser) {
               await message.reply('Sorry, your account is in a locked state. Please contact support.');
               return;
            }
          } else {
            console.error(`[WhatsApp] Failed to auto-register auth user:`, authError);
            await message.reply('Sorry, we encountered an error setting up your account.');
            return;
          }
        } else {
          authUser = createData.user;
        }

        userId = authUser.id;

        // Insert into profiles
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            phone_number: realPhone, // Real number
            phone: lid, // LID
          });
          
        if (profileError) {
          console.error(`[WhatsApp] Failed to insert profile for ${realPhone}:`, profileError);
        }
      }

      // 3. MAGIC MESSAGE AUTH INTERCEPTOR
      // If the message is a login code (e.g. NUSA-1234)
      const authMatch = text.match(/^NUSA-\d{4}$/i);
      if (authMatch) {
        const loginCode = authMatch[0].toUpperCase();
        
        // Find if this code is pending in the DB
        const { data: sessionInfo } = await supabaseAdmin
          .from('whatsapp_auth_sessions')
          .select('id, status, expires_at')
          .eq('login_code', loginCode)
          .single();

        if (sessionInfo && sessionInfo.status === 'pending' && new Date(sessionInfo.expires_at) >= new Date()) {
          // Verify and assign the session
          const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
          
          const payload = {
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
            sub: userId,
            phone: realPhone,
            role: 'authenticated',
          };
          const token = jwt.sign(payload, jwtSecret);

          await supabaseAdmin
            .from('whatsapp_auth_sessions')
            .update({
              status: 'verified',
              phone: realPhone,
              session_jwt: token,
            })
            .eq('id', sessionInfo.id);

          await message.reply('Login successful!');
          
          // Auto-trigger onboarding if they haven't completed it
          const status = profile?.onboarding_status || 'pending';
          if (status !== 'completed') {
            await handleOnboardingMessage(message, profile || { id: userId, onboarding_status: 'pending' }, '');
          }
          return; // Stop processing, this was an auth message
        }
        
        // If code is expired or invalid, fall through or send error (we'll just send an error here)
        if (sessionInfo) {
          await message.reply('Login code expired or already used. Please request a new one on the website.');
          return;
        }
      }

      // 4. Onboarding or Pass to Groq AI Service
      if (userId) {
        // Check onboarding status
        const status = profile?.onboarding_status || 'pending';
        if (status !== 'completed') {
          await handleOnboardingMessage(message, profile || { id: userId }, text);
          return;
        }

        // Optional: simulate typing state
        const chat = await message.getChat();
        if (chat.sendStateTyping) {
          await chat.sendStateTyping();
        }

        // Store user message in conversation memory
        addUserMessage(userId, text);
        const history = getConversationHistory(userId);

        const financeResponse = await processFinanceChat(userId, text, history) as any;
        
        if (!financeResponse) {
          await reply(message, userId, "Lagi ada gangguan teknis nih. Coba lagi nanti ya.");
          return;
        }

        // ──────────────────────────────────────────────
        // INTENT: Complete Transaction
        // ──────────────────────────────────────────────
        if (financeResponse.isFinanceRecord && financeResponse.isComplete && financeResponse.data) {
          const { amount, type, category, description, payment_method } = financeResponse.data;
          
          // Save to transactions table
          const { error: insertError } = await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            amount,
            type,
            category,
            description,
            payment_method
          });

          if (insertError) {
            console.error(`[WhatsApp] Failed to insert transaction for ${userId}:`, insertError);
            await reply(message, userId, "Waduh, ada error pas nyimpen datanya nih. Coba lagi nanti ya.");
            return;
          }

          // Auto-update wallet balance
          const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .ilike('name', payment_method)
            .maybeSingle();

          if (wallet) {
            const newBalance = type === 'expense' 
              ? Number(wallet.balance) - amount 
              : Number(wallet.balance) + amount;
            await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
          }

          const formattedAmount = formatIDR(amount);
          let replyText = `Berhasil dicatat!\n\nKategori: ${category}\nJumlah: ${formattedAmount}\nMetode: ${payment_method}\nCatatan: ${description}`;

          // Budget alert check
          if (type === 'expense' && profile?.monthly_budget) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            const { data: monthlyTxs } = await supabaseAdmin
              .from('transactions')
              .select('amount')
              .eq('user_id', userId)
              .eq('type', 'expense')
              .gte('created_at', startOfMonth);

            const totalExpenseThisMonth = (monthlyTxs || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
            const budget = Number(profile.monthly_budget);
            const percentage = Math.round((totalExpenseThisMonth / budget) * 100);

            if (totalExpenseThisMonth >= budget) {
              replyText += `\n\n-- Peringatan --\nKamu sudah melewati batas pengeluaran bulan ini (${percentage}% dari budget ${formatIDR(budget)}). Hati-hati ya!`;
            } else if (percentage >= 80) {
              replyText += `\n\n-- Perhatian --\nPengeluaranmu bulan ini sudah ${percentage}% dari budget ${formatIDR(budget)}. Mulai hati-hati ya.`;
            }
          }

          await reply(message, userId, replyText);

        // ──────────────────────────────────────────────
        // INTENT: Balance Inquiry (total or per-wallet)
        // ──────────────────────────────────────────────
        } else if (financeResponse.isBalanceInquiry) {
          const walletName = financeResponse.walletName;
          
          if (walletName) {
            // Per-wallet balance
            const { data: wallet } = await supabaseAdmin
              .from('wallets')
              .select('name, balance')
              .eq('user_id', userId)
              .ilike('name', walletName)
              .maybeSingle();

            if (wallet) {
              await reply(message, userId, `Saldo ${wallet.name} kamu saat ini ${formatIDR(Number(wallet.balance))}.`);
            } else {
              await reply(message, userId, `Hmm, aku ga nemu wallet dengan nama "${walletName}". Coba cek lagi nama walletnya.`);
            }
          } else {
            // Total balance across all wallets
            const { data: wallets } = await supabaseAdmin
              .from('wallets')
              .select('name, balance')
              .eq('user_id', userId);

            if (wallets && wallets.length > 0) {
              let total = 0;
              const breakdown = wallets.map(w => {
                total += Number(w.balance);
                return `- ${w.name}: ${formatIDR(Number(w.balance))}`;
              }).join('\n');
              
              await reply(message, userId, `Total saldo kamu: ${formatIDR(total)}\n\nRincian:\n${breakdown}`);
            } else {
              await reply(message, userId, "Kamu belum punya wallet yang tercatat. Coba tambahkan dulu ya.");
            }
          }

        // ──────────────────────────────────────────────
        // INTENT: Analysis Inquiry
        // ──────────────────────────────────────────────
        } else if (financeResponse.isAnalysisInquiry) {
          await reply(message, userId, "Sebentar ya, aku lagi baca catatan keuanganmu...");
          
          const { data: wallets } = await supabaseAdmin.from('wallets').select('name, type, balance').eq('user_id', userId);
          const { data: transactions } = await supabaseAdmin.from('transactions').select('amount, type, category, created_at, payment_method, description').eq('user_id', userId).order('created_at', { ascending: false });
          
          const analysis = await analyzeFinances(userId, transactions || [], wallets || []);
          await reply(message, userId, analysis);

        // ──────────────────────────────────────────────
        // INTENT: Delete Last Transaction
        // ──────────────────────────────────────────────
        } else if (financeResponse.isDeleteRequest) {
          // Find last transaction
          const { data: lastTx } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!lastTx) {
            await reply(message, userId, "Kamu belum punya transaksi yang bisa dihapus.");
            return;
          }

          // Revert wallet balance
          const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .ilike('name', lastTx.payment_method || '')
            .maybeSingle();

          if (wallet) {
            const revertedBalance = lastTx.type === 'expense'
              ? Number(wallet.balance) + Number(lastTx.amount)
              : Number(wallet.balance) - Number(lastTx.amount);
            await supabaseAdmin.from('wallets').update({ balance: revertedBalance }).eq('id', wallet.id);
          }

          // Delete the transaction
          await supabaseAdmin.from('transactions').delete().eq('id', lastTx.id);

          await reply(message, userId, `Transaksi terakhir sudah dihapus:\n- ${lastTx.description} (${formatIDR(Number(lastTx.amount))} via ${lastTx.payment_method})\n\nSaldo wallet sudah dikembalikan.`);

        // ──────────────────────────────────────────────
        // INTENT: Edit Last Transaction
        // ──────────────────────────────────────────────
        } else if (financeResponse.isEditRequest) {
          const { data: lastTx } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!lastTx) {
            await reply(message, userId, "Kamu belum punya transaksi yang bisa diedit.");
            return;
          }

          const editData = financeResponse.editData;
          if (!editData || !editData.field) {
            await reply(message, userId, financeResponse.replyMessage || "Mau diedit bagian apanya? (nominal, kategori, atau metode pembayaran)");
            return;
          }

          const updatePayload: any = {};
          let diffAmount = 0;

          if (editData.field === 'amount' && typeof editData.newValue === 'number') {
            diffAmount = editData.newValue - Number(lastTx.amount);
            updatePayload.amount = editData.newValue;
          } else if (editData.field === 'category') {
            updatePayload.category = editData.newValue;
          } else if (editData.field === 'payment_method') {
            updatePayload.payment_method = editData.newValue;
          }

          await supabaseAdmin.from('transactions').update(updatePayload).eq('id', lastTx.id);

          // Adjust wallet balance if amount changed
          if (diffAmount !== 0 && lastTx.payment_method) {
            const { data: wallet } = await supabaseAdmin
              .from('wallets')
              .select('id, balance')
              .eq('user_id', userId)
              .ilike('name', lastTx.payment_method)
              .maybeSingle();

            if (wallet) {
              const adjustment = lastTx.type === 'expense' ? -diffAmount : diffAmount;
              await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + adjustment }).eq('id', wallet.id);
            }
          }

          await reply(message, userId, `Transaksi sudah diupdate!\n${financeResponse.replyMessage || ''}`);

        // ──────────────────────────────────────────────
        // INTENT: Transfer Between Wallets
        // ──────────────────────────────────────────────
        } else if (financeResponse.isTransfer) {
          const { fromWallet, toWallet, amount } = financeResponse;

          if (!fromWallet || !toWallet || !amount) {
            await reply(message, userId, "Detail transfernya kurang lengkap. Coba bilang lagi, contoh: 'pindahin 500rb dari BCA ke GoPay'");
            return;
          }

          // Find both wallets
          const { data: srcWallet } = await supabaseAdmin.from('wallets').select('id, name, balance').eq('user_id', userId).ilike('name', fromWallet).maybeSingle();
          const { data: dstWallet } = await supabaseAdmin.from('wallets').select('id, name, balance').eq('user_id', userId).ilike('name', toWallet).maybeSingle();

          if (!srcWallet) {
            await reply(message, userId, `Wallet "${fromWallet}" ga ketemu nih. Coba cek lagi nama walletnya.`);
            return;
          }
          if (!dstWallet) {
            await reply(message, userId, `Wallet "${toWallet}" ga ketemu nih. Coba cek lagi nama walletnya.`);
            return;
          }

          if (Number(srcWallet.balance) < amount) {
            await reply(message, userId, `Saldo ${srcWallet.name} kamu cuma ${formatIDR(Number(srcWallet.balance))}, ga cukup buat transfer ${formatIDR(amount)}.`);
            return;
          }

          // Execute transfer
          await supabaseAdmin.from('wallets').update({ balance: Number(srcWallet.balance) - amount }).eq('id', srcWallet.id);
          await supabaseAdmin.from('wallets').update({ balance: Number(dstWallet.balance) + amount }).eq('id', dstWallet.id);

          await reply(message, userId, `Transfer berhasil!\n\n${srcWallet.name}: ${formatIDR(Number(srcWallet.balance) - amount)}\n${dstWallet.name}: ${formatIDR(Number(dstWallet.balance) + amount)}`);

        // ──────────────────────────────────────────────
        // INTENT: Wallet Management (add/remove/rename)
        // ──────────────────────────────────────────────
        } else if (financeResponse.isWalletManagement) {
          const { action, walletName, walletType, newName, balance } = financeResponse;

          if (action === 'add') {
            const { error } = await supabaseAdmin.from('wallets').insert({
              user_id: userId,
              name: walletName,
              type: walletType || 'cash',
              balance: balance || 0,
            });
            if (error) {
              await reply(message, userId, "Gagal menambahkan wallet. Coba lagi nanti ya.");
            } else {
              await reply(message, userId, `Wallet "${walletName}" berhasil ditambahkan${balance ? ` dengan saldo awal ${formatIDR(balance)}` : ''}.`);
            }

          } else if (action === 'remove') {
            const { data: existing } = await supabaseAdmin.from('wallets').select('id').eq('user_id', userId).ilike('name', walletName).maybeSingle();
            if (!existing) {
              await reply(message, userId, `Wallet "${walletName}" ga ketemu.`);
            } else {
              await supabaseAdmin.from('wallets').delete().eq('id', existing.id);
              await reply(message, userId, `Wallet "${walletName}" sudah dihapus.`);
            }

          } else if (action === 'rename') {
            const { data: existing } = await supabaseAdmin.from('wallets').select('id').eq('user_id', userId).ilike('name', walletName).maybeSingle();
            if (!existing) {
              await reply(message, userId, `Wallet "${walletName}" ga ketemu.`);
            } else {
              await supabaseAdmin.from('wallets').update({ name: newName }).eq('id', existing.id);
              await reply(message, userId, `Wallet "${walletName}" sudah diganti namanya jadi "${newName}".`);
            }
          }

        // ──────────────────────────────────────────────
        // INTENT: Incomplete Transaction (follow-up needed)
        // ──────────────────────────────────────────────
        } else if (financeResponse.isFinanceRecord && !financeResponse.isComplete) {
          await reply(message, userId, financeResponse.replyMessage || "Bisa diperjelas lagi detail transaksinya?");

        // ──────────────────────────────────────────────
        // INTENT: General Chat / Fallback
        // ──────────────────────────────────────────────
        } else if (financeResponse.replyMessage) {
          await reply(message, userId, financeResponse.replyMessage);
        } else {
          await reply(message, userId, "Maaf, aku kurang paham maksud kamu. Bisa diulangi?");
        }
      }

    } catch (error) {
      console.error(`[WhatsApp] Error handling message from ${realPhone}:`, error);
    }
  });
};
