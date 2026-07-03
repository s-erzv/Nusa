import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { 
  extractIncomeInfo, 
  extractRoutineExpenses, 
  extractWallets, 
  extractEnvelopeBudgets, 
  extractInvestments, 
  extractGoals 
} from '../services/financeAiService.js';

export const handleOnboardingMessage = async (message: any, profile: any, text: string): Promise<void> => {
  const userId = profile.id;
  const status = profile.onboarding_status || 'pending';

  try {
    if (status === 'pending') {
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'step_name' }).eq('id', userId);
      await message.reply("Halo! Selamat datang di Nusa.\n\nBiar enak ngobrolnya, siapa nama panggilan kamu?");
      return;
    }

    if (status === 'step_name') {
      const name = text.trim();
      await supabaseAdmin.from('profiles').update({ 
        full_name: name,
        onboarding_status: 'step_income' 
      }).eq('id', userId);
      await message.reply(`Halo ${name}! Senang kenalan sama kamu.\n\nKita mulai setup profil keuanganmu ya.\n\nPertama, kira-kira berapa pemasukan tetap kamu per bulan? (Boleh jawab "nggak ada" atau "nggak tentu").\n\nKalau nggak tetap, kira-kira rata-ratanya berapa? Terus, biasanya tanggal berapa kamu gajian?`);
      return;
    }

    if (status === 'step_income') {
      const income = await extractIncomeInfo(text);
      if (income && income.amount) {
        await supabaseAdmin.from('profiles').update({ 
          income_amount: income.amount,
          income_type: income.is_fixed ? 'fixed' : 'variable',
          pay_date: income.pay_date || null,
          onboarding_status: 'step_expense_routine' 
        }).eq('id', userId);
        await message.reply(`Sip, pemasukanmu udah dicatat! 💰\n\nSekarang, apa aja pengeluaran rutin kamu tiap bulan yang sifatnya wajib atau langganan?\n\nMisalnya: Kos 1.5jt tgl 10, Netflix 150rb tgl 5, Cicilan paylater 500rb tgl 1, BPJS 150rb. Sebutin semuanya sekalian ya! (Jawab "nggak ada" kalau emang nggak ada).`);
      } else {
        // If couldn't parse, just proceed without income or ask again. Let's just proceed.
        await supabaseAdmin.from('profiles').update({ 
          onboarding_status: 'step_expense_routine' 
        }).eq('id', userId);
        await message.reply(`Oke, nggak masalah.\n\nSekarang, apa aja pengeluaran rutin kamu tiap bulan yang sifatnya wajib atau langganan?\n\nMisalnya: Kos 1.5jt tgl 10, Netflix 150rb tgl 5, Cicilan paylater 500rb tgl 1, BPJS 150rb. Sebutin semuanya sekalian ya! (Jawab "nggak ada" kalau emang nggak ada).`);
      }
      return;
    }

    if (status === 'step_expense_routine') {
      const routines = await extractRoutineExpenses(text);
      if (routines.length > 0) {
        const inserts = routines.map(r => ({
          user_id: userId,
          description: r.description,
          amount: r.amount,
          due_date_day: r.due_date_day,
          type: r.type
        }));
        await supabaseAdmin.from('routine_expenses').insert(inserts);
      }
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'step_wallets' }).eq('id', userId);
      await message.reply(`Noted! Tagihan rutin udah aman. 💸\n\nSekarang, di mana aja kamu simpan uangmu dan berapa saldonya saat ini? (Misal: BCA 5jt, Gopay 500rb, Tunai 200rb).\n\nJangan lupa sebutin juga mana yang jadi rekening utama buat jajan sehari-hari!`);
      return;
    }

    if (status === 'step_wallets') {
      const wallets = await extractWallets(text);
      if (!wallets || wallets.length === 0) {
        await message.reply("Waduh, aku kurang paham nih rincian dompetnya. Bisa diketik ulang yang jelas nama tempat dan nominalnya?");
        return;
      }
      let totalBalance = 0;
      const walletInserts = wallets.map(w => {
        totalBalance += w.balance;
        return {
          user_id: userId,
          name: w.name,
          type: w.type,
          balance: w.balance,
          is_main: w.is_main || false
        };
      });
      await supabaseAdmin.from('wallets').insert(walletInserts);
      await supabaseAdmin.from('profiles').update({ 
        current_balance: totalBalance,
        onboarding_status: 'step_budgets' 
      }).eq('id', userId);
      await message.reply(`Mantap, total saldo tercatat! 💳\n\nBiar pengeluaran terkontrol, kamu mau pisahin budget (kantong) per kategori nggak?\n\nMisal: Makan 2jt, Transport 500rb, Hiburan 300rb. Sebutin nominal target per kategorinya ya! (Jawab "nggak usah" kalau mau dilewati).`);
      return;
    }

    if (status === 'step_budgets') {
      const budgets = await extractEnvelopeBudgets(text);
      if (budgets.length > 0) {
        const inserts = budgets.map(b => ({
          user_id: userId,
          category: b.category,
          amount: b.amount
        }));
        await supabaseAdmin.from('category_budgets').insert(inserts);
      }
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'step_investments' }).eq('id', userId);
      await message.reply(`Kantong budget udah disiapkan! 🗂️\n\nApakah kamu punya instrumen investasi? (Reksadana, saham, kripto, emas, dll).\n\nBerapa kira-kira total nilainya sekarang? (Misal: Reksadana Bibit 2.5jt, Saham 10jt). Jawab "skip" kalau belum ada.`);
      return;
    }

    if (status === 'step_investments') {
      const investments = await extractInvestments(text);
      if (investments.length > 0) {
        const inserts = investments.map(i => ({
          user_id: userId,
          type: i.type,
          value: i.value,
          notes: i.notes
        }));
        await supabaseAdmin.from('investments').insert(inserts);
      }
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'step_goals' }).eq('id', userId);
      await message.reply(`Wah keren! 📈\n\nTerakhir nih, kamu lagi nabung buat tujuan apa?\n\nMisal: Gadget 15jt, Nikah 50jt, DP Rumah 100jt. Kalau ada target waktunya sebutin juga ya! (Jawab "belum ada" kalau mau skip).`);
      return;
    }

    if (status === 'step_goals') {
      const goals = await extractGoals(text);
      if (goals.length > 0) {
        const inserts = goals.map(g => ({
          user_id: userId,
          name: g.name,
          target_amount: g.target_amount,
          target_date: g.target_date
        }));
        await supabaseAdmin.from('financial_goals').insert(inserts);
      }
      
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'completed' }).eq('id', userId);
      await message.reply(`Setup selesai 100%! 🎉\n\nAku udah nyimpen data pola gajian, tagihan rutin, saldo, sampai tujuan finansialmu.\n\nKe depannya aku bakal bantu ngingetin tagihan, cek sisa uang, dan pantau kantong budget kamu!\n\nYuk mulai nyatet! Kasih tau aku kalau ada transaksi hari ini.`);
      return;
    }

  } catch (error) {
    console.error(`[Onboarding Error for ${userId}]:`, error);
    await message.reply("Maaf, terjadi kesalahan saat memproses data. Coba lagi ya.");
  }
};
