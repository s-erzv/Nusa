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
      // If the message is a login code (e.g. Login Nusa: 123456)
      const authMatch = text.match(/^Login Nusa:\s*(.+)$/i);
      if (authMatch) {
        const loginCode = authMatch[1].trim();
        
        // Find if this code is pending in the DB
        const { data: sessionInfo } = await supabaseAdmin
          .from('auth_requests')
          .select('id, status, expires_at')
          .eq('login_id', loginCode)
          .single();

        if (sessionInfo && sessionInfo.status === 'pending' && new Date(sessionInfo.expires_at) >= new Date()) {
          // Verify and assign the session
          const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
          
          const payload = {
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
            sub: userId,
            phone: realPhone,
            role: 'authenticated',
          };
          const token = jwt.sign(payload, jwtSecret);

          await supabaseAdmin
            .from('auth_requests')
            .update({
              status: 'completed',
              phone_number: realPhone,
              access_token: token,
              refresh_token: token,
            })
            .eq('id', sessionInfo.id);

          await message.reply('Login berhasil! Silakan kembali ke browser.');
          
          // Auto-trigger onboarding if they haven't completed it
          const status = profile?.onboarding_status || 'pending';
          if (status !== 'completed') {
            await handleOnboardingMessage(message, profile || { id: userId, onboarding_status: 'pending' }, '');
          }
          return; // Stop processing, this was an auth message
        }
        
        // If code is expired or invalid, fall through or send error
        if (sessionInfo) {
          await message.reply('Kode login tidak valid atau sudah kadaluarsa. Silakan request ulang di website.');
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

        // ──────────────────────────────────────────────
        // STEP 1: Check if there's a pending action awaiting confirmation
        // This must run BEFORE the AI call so "iya" doesn't get sent to AI
        // ──────────────────────────────────────────────
        const pendingAction = getPendingAction(userId);
        if (pendingAction) {
          addUserMessage(userId, text);
          
          if (isConfirmation(text)) {
            clearPendingAction(userId);

            if (pendingAction.type === 'delete_transaction' && pendingAction.transactionId) {
              // Revert wallet balance
              const { data: walletToRevert } = await supabaseAdmin
                .from('wallets').select('id, balance').eq('user_id', userId)
                .ilike('name', pendingAction.transactionPaymentMethod || '').maybeSingle();

              if (walletToRevert) {
                const revertedBalance = pendingAction.transactionType === 'expense'
                  ? Number(walletToRevert.balance) + Number(pendingAction.transactionAmount)
                  : Number(walletToRevert.balance) - Number(pendingAction.transactionAmount);
                await supabaseAdmin.from('wallets').update({ balance: revertedBalance }).eq('id', walletToRevert.id);
              }
              
              await supabaseAdmin.from('transactions').delete().eq('id', pendingAction.transactionId);
              await reply(message, userId, `Oke, transaksi "${pendingAction.transactionDescription}" (${formatIDR(pendingAction.transactionAmount || 0)}) sudah dihapus dan saldo wallet dikembalikan.`);

            } else if (pendingAction.type === 'add_wallets' && pendingAction.wallets) {
              const inserts = pendingAction.wallets.map(w => ({ user_id: userId, ...w }));
              const { error } = await supabaseAdmin.from('wallets').insert(inserts);
              if (error) {
                await reply(message, userId, "Gagal menyimpan wallet. Coba lagi ya.");
              } else {
                const lines = pendingAction.wallets.map(w => `- ${w.name}: ${formatIDR(w.balance)}`).join('\n');
                await reply(message, userId, `Wallet berhasil ditambahkan:\n${lines}`);
              }
            }

            return; // Done, don't send to AI
          }
          
          if (isRejection(text)) {
            clearPendingAction(userId);
            await reply(message, userId, "Oke, dibatalin. Ada yang lain?");
            return;
          }

          // Not a clear confirmation or rejection, fall through to AI with context
        }

        // Store user message in conversation memory
        addUserMessage(userId, text);
        const history = getConversationHistory(userId);

        const financeResponse = await processFinanceChat(userId, text, history) as any;
        
        if (!financeResponse) {
          await reply(message, userId, "Lagi ada gangguan teknis nih. Coba lagi nanti ya.");
          return;
        }

                // Loop through the actions parsed by AI
        for (const action of financeResponse.actions) {
          
          if (action.type === 'IDLE_CONFIRMATION') {
            await reply(message, userId, action.replyMessage || "Sip, sudah dicatat!");
          }
          
          else if (action.type === 'UPDATE_BALANCE') {
            const { walletName, amount } = action;
            if (!walletName || amount === undefined) {
              await reply(message, userId, "Mau update saldo wallet apa dan jadi berapa?");
              continue;
            }
            const { data: wallet } = await supabaseAdmin.from('wallets').select('id, name').eq('user_id', userId).ilike('name', walletName).maybeSingle();
            if (!wallet) {
              await reply(message, userId, `Wallet "${walletName}" ga ketemu.`);
              continue;
            }
            await supabaseAdmin.from('wallets').update({ balance: amount }).eq('id', wallet.id);
            await reply(message, userId, `Transaksi sudah diupdate! Saldo ${wallet.name} berhasil direset menjadi ${formatIDR(amount)}.`);
          }
          
          else if (action.type === 'ADD_ROUTINE_EXPENSE') {
            const { description, amount, due_date_day, transaction_type } = action;
            if (!description || !amount || !due_date_day) {
              await reply(message, userId, "Data langganan/cicilan kurang lengkap.");
              continue;
            }
            await supabaseAdmin.from('routine_expenses').insert({
              user_id: userId,
              description,
              amount,
              due_date_day,
              type: transaction_type || 'expense'
            });
            await reply(message, userId, `Sip! Pengeluaran rutin "${description}" sebesar ${formatIDR(amount)} setiap tanggal ${due_date_day} sudah ditambahkan ke jadwal.`);
          }
          
          else if (action.type === 'ADD_DEBT') {
            const { person_name, amount } = action;
            if (!person_name || !amount) {
              await reply(message, userId, "Siapa yang diutangin dan berapa jumlahnya?");
              continue;
            }
            await supabaseAdmin.from('debts').insert({
              user_id: userId, person_name, type: 'payable', amount
            });
            await reply(message, userId, `Catatan utang ke ${person_name} sebesar ${formatIDR(amount)} berhasil disimpan.`);
          }

          else if (action.type === 'ADD_RECEIVABLE') {
            const { person_name, amount } = action;
            if (!person_name || !amount) {
              await reply(message, userId, "Siapa yang ngutang ke kamu dan berapa jumlahnya?");
              continue;
            }
            await supabaseAdmin.from('debts').insert({
              user_id: userId, person_name, type: 'receivable', amount
            });
            await reply(message, userId, `Catatan piutang dari ${person_name} sebesar ${formatIDR(amount)} berhasil disimpan.`);
          }

          else if (action.type === 'PAY_DEBT') {
            const { person_name, amount, walletName } = action;
            if (!person_name || !amount || !walletName) {
              await reply(message, userId, "Siapa yang dibayar, berapa jumlahnya, dan pakai wallet apa?");
              continue;
            }
            const { data: debt } = await supabaseAdmin.from('debts').select('*').eq('user_id', userId).eq('type', 'payable').eq('status', 'unpaid').ilike('person_name', `%${person_name}%`).order('created_at', { ascending: true }).limit(1).maybeSingle();
            if (debt) {
              const newDebtAmt = Number(debt.amount) - amount;
              if (newDebtAmt <= 0) await supabaseAdmin.from('debts').update({ status: 'paid', amount: 0 }).eq('id', debt.id);
              else await supabaseAdmin.from('debts').update({ amount: newDebtAmt }).eq('id', debt.id);
            }
            const { data: wallet } = await supabaseAdmin.from('wallets').select('id, balance, name').eq('user_id', userId).ilike('name', walletName).maybeSingle();
            if (wallet) {
              await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) - amount }).eq('id', wallet.id);
              await supabaseAdmin.from('transactions').insert({ user_id: userId, amount, type: 'expense', category: 'Bayar Utang', description: `Bayar utang ke ${person_name}`, payment_method: wallet.name });
            }
            await reply(message, userId, `Sip, pembayaran utang ke ${person_name} sebesar ${formatIDR(amount)} pakai ${wallet ? wallet.name : walletName} sudah dicatat.`);
          }

          else if (action.type === 'RECEIVE_DEBT_PAYMENT') {
            const { person_name, amount, walletName } = action;
            if (!person_name || !amount || !walletName) {
              await reply(message, userId, "Siapa yang bayar, berapa jumlahnya, dan masuk ke wallet mana?");
              continue;
            }
            const { data: debt } = await supabaseAdmin.from('debts').select('*').eq('user_id', userId).eq('type', 'receivable').eq('status', 'unpaid').ilike('person_name', `%${person_name}%`).order('created_at', { ascending: true }).limit(1).maybeSingle();
            if (debt) {
              const newDebtAmt = Number(debt.amount) - amount;
              if (newDebtAmt <= 0) await supabaseAdmin.from('debts').update({ status: 'paid', amount: 0 }).eq('id', debt.id);
              else await supabaseAdmin.from('debts').update({ amount: newDebtAmt }).eq('id', debt.id);
            }
            const { data: wallet } = await supabaseAdmin.from('wallets').select('id, balance, name').eq('user_id', userId).ilike('name', walletName).maybeSingle();
            if (wallet) {
              await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + amount }).eq('id', wallet.id);
              await supabaseAdmin.from('transactions').insert({ user_id: userId, amount, type: 'income', category: 'Piutang Dibayar', description: `${person_name} bayar utang`, payment_method: wallet.name });
            }
            await reply(message, userId, `Sip, uang masuk dari pembayaran utang ${person_name} sebesar ${formatIDR(amount)} ke ${wallet ? wallet.name : walletName} sudah dicatat.`);
          }

          else if (action.type === 'RECORD_TRANSACTION') {
            const { amount, transaction_type, category, description, payment_method } = action;
            if (!amount || !category || !description || !payment_method || !transaction_type) {
              await reply(message, userId, "Tunggu, ada info yang kurang (jumlah, untuk apa, atau pakai dompet apa). Bisa diperjelas?");
              continue;
            }

            const { error: insertError } = await supabaseAdmin.from('transactions').insert({
              user_id: userId, amount, type: transaction_type, category, description, payment_method
            });
            if (insertError) {
              await reply(message, userId, "Waduh, ada error pas nyimpen datanya nih. Coba lagi nanti ya.");
              continue;
            }

            // Update wallet balance
            const { data: wallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', userId).ilike('name', payment_method).maybeSingle();
            let currentTotalBalance = 0;
            if (wallet) {
              const newBalance = transaction_type === 'expense' ? Number(wallet.balance) - amount : Number(wallet.balance) + amount;
              await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
            }

            // Get total balance for alerts
            const { data: allWallets } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId);
            currentTotalBalance = (allWallets || []).reduce((sum, w) => sum + Number(w.balance), 0);

            let replyText = `Berhasil dicatat!

Kategori: ${category}
Jumlah: ${formatIDR(amount)}
Metode: ${payment_method}
Catatan: ${description}`;

            if (transaction_type === 'expense') {
              if (amount > 0.3 * currentTotalBalance) {
                replyText += `

💸 Wah, transaksi gede banget nih (>30% dari saldomu)! Beneran dari kantong yang sesuai kan? Jangan sampai mengganggu arus kas ya!`;
              }
            }
            await reply(message, userId, replyText);
          }
          
          else if (action.type === 'INCOMPLETE_TRANSACTION') {
            await reply(message, userId, action.replyMessage || "Bisa diperjelas lagi detail transaksinya?");
          }
          
          else if (action.type === 'BALANCE_INQUIRY') {
            if (action.walletName) {
              const { data: wallet } = await supabaseAdmin.from('wallets').select('name, balance').eq('user_id', userId).ilike('name', action.walletName).maybeSingle();
              if (wallet) await reply(message, userId, `Saldo ${wallet.name} kamu saat ini ${formatIDR(Number(wallet.balance))}.`);
              else await reply(message, userId, `Hmm, aku ga nemu wallet dengan nama "${action.walletName}".`);
            } else {
              const { data: wallets } = await supabaseAdmin.from('wallets').select('name, balance').eq('user_id', userId);
              if (wallets && wallets.length > 0) {
                let total = 0;
                const breakdown = wallets.map(w => { total += Number(w.balance); return `- ${w.name}: ${formatIDR(Number(w.balance))}`; }).join('\n');
                await reply(message, userId, `Total saldo kamu: ${formatIDR(total)}\n\nRincian:\n${breakdown}`);
              } else {
                await reply(message, userId, "Kamu belum punya wallet yang tercatat.");
              }
            }
          }
          
          else if (action.type === 'ANALYSIS_INQUIRY') {
            await reply(message, userId, "Sebentar ya, aku lagi baca catatan keuanganmu...");
            const { data: wallets } = await supabaseAdmin.from('wallets').select('name, type, balance').eq('user_id', userId);
            const { data: transactions } = await supabaseAdmin.from('transactions').select('amount, type, category, created_at, payment_method, description').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
            const analysis = await analyzeFinances(userId, transactions || [], wallets || []);
            await reply(message, userId, analysis);
          }

          else if (action.type === 'TRANSACTION_HISTORY') {
            const { walletName } = action;
            let query = supabaseAdmin.from('transactions').select('amount, type, category, created_at, payment_method, description').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
            
            if (walletName) {
              query = query.ilike('payment_method', `%${walletName}%`);
            }
            
            const { data: transactions } = await query;
            if (!transactions || transactions.length === 0) {
              await reply(message, userId, `Belum ada catatan transaksi${walletName ? ` untuk dompet ${walletName}` : ''}.`);
              continue;
            }
            
            const txLines = transactions.map(tx => {
              const sign = tx.type === 'expense' ? '-' : '+';
              const date = new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              return `[${date}] ${tx.description || tx.category}: ${sign}${formatIDR(Number(tx.amount))} (${tx.payment_method})`;
            }).join('\n');
            
            await reply(message, userId, `Riwayat Transaksi Terakhir${walletName ? ` (${walletName})` : ''}:\n\n${txLines}`);
          }
          
          else if (action.type === 'DELETE_REQUEST') {
            const { data: lastTx } = await supabaseAdmin.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (!lastTx) { await reply(message, userId, "Kamu belum punya transaksi yang bisa dihapus."); continue; }
            setPendingAction(userId, { type: 'delete_transaction', transactionId: lastTx.id, transactionDescription: lastTx.description, transactionAmount: Number(lastTx.amount), transactionPaymentMethod: lastTx.payment_method, transactionType: lastTx.type });
            await reply(message, userId, `Oke, mau hapus transaksi ini?
- ${lastTx.description || lastTx.category} (${formatIDR(Number(lastTx.amount))} via ${lastTx.payment_method})

Balas "iya" untuk konfirmasi, atau "ga" untuk batal.`);
          }
          
          else if (action.type === 'TRANSFER') {
            const { fromWallet, toWallet, amount, adminFee } = action;
            if (!fromWallet || !toWallet || !amount) {
              await reply(message, userId, "Detail transfernya kurang lengkap.");
              continue;
            }
            const { data: srcWallet } = await supabaseAdmin.from('wallets').select('id, name, balance').eq('user_id', userId).ilike('name', fromWallet).maybeSingle();
            const { data: dstWallet } = await supabaseAdmin.from('wallets').select('id, name, balance').eq('user_id', userId).ilike('name', toWallet).maybeSingle();
            if (!srcWallet || !dstWallet) {
              await reply(message, userId, "Wallet asal atau tujuan tidak ditemukan.");
              continue;
            }
            const totalDeduction = amount + (adminFee || 0);
            if (Number(srcWallet.balance) < totalDeduction) {
              await reply(message, userId, `Saldo ${srcWallet.name} ga cukup buat transfer.`);
              continue;
            }
            await supabaseAdmin.from('wallets').update({ balance: Number(srcWallet.balance) - totalDeduction }).eq('id', srcWallet.id);
            await supabaseAdmin.from('wallets').update({ balance: Number(dstWallet.balance) + amount }).eq('id', dstWallet.id);
            if (adminFee && adminFee > 0) {
              await supabaseAdmin.from('transactions').insert({ user_id: userId, amount: adminFee, type: 'expense', category: 'Biaya Admin', description: `Admin transfer ke ${dstWallet.name}`, payment_method: srcWallet.name });
            }
            let replyMsg = `Transfer berhasil!

${srcWallet.name}: ${formatIDR(Number(srcWallet.balance) - totalDeduction)}
${dstWallet.name}: ${formatIDR(Number(dstWallet.balance) + amount)}`;
            if (adminFee) replyMsg += `

(Termasuk potongan biaya admin ${formatIDR(adminFee)})`;
            await reply(message, userId, replyMsg);
          }
          
          else if (action.type === 'GENERAL_CHAT') {
            await reply(message, userId, action.replyMessage || "Ada yang bisa dibantu?");
          }
        }
      }

    } catch (error) {
      console.error(`[WhatsApp] Error handling message from ${realPhone}:`, error);
    }
  });
};
