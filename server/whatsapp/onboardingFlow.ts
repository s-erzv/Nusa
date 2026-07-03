import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { extractNumber, extractWallets } from '../services/financeAiService.js';

export const handleOnboardingMessage = async (message: any, profile: any, text: string): Promise<void> => {
  const userId = profile.id;
  const status = profile.onboarding_status || 'pending';

  try {
    if (status === 'pending') {
      // Move to step_name
      await supabaseAdmin.from('profiles').update({ onboarding_status: 'step_name' }).eq('id', userId);
      await message.reply("Halo! Selamat datang di Nusa.\n\nBiar enak ngobrolnya, siapa nama panggilan kamu?");
      return;
    }

    if (status === 'step_name') {
      // Save name and move to step_budget
      const name = text.trim();
      await supabaseAdmin.from('profiles').update({ 
        full_name: name,
        onboarding_status: 'step_budget' 
      }).eq('id', userId);
      await message.reply(`Halo ${name}! Senang kenalan sama kamu.\n\nBiar aku bisa bantu jaga keuanganmu, kira-kira berapa target maksimal pengeluaran kamu dalam sebulan? (misalnya: 5 juta)`);
      return;
    }

    if (status === 'step_budget') {
      // Extract number
      const budget = await extractNumber(text);
      if (budget === null) {
        await message.reply("Hmm, angkanya kurang jelas nih. Boleh tolong sebutin nominalnya lagi? (contoh: 3 juta)");
        return;
      }

      await supabaseAdmin.from('profiles').update({ 
        monthly_budget: budget,
        onboarding_status: 'step_balance' 
      }).eq('id', userId);
      
      const formattedBudget = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(budget);
      await message.reply(`Sip! Target pengeluaran maksimal dicatat sebesar *${formattedBudget}*.\n\nTerakhir, di mana saja kamu menyimpan uangmu saat ini dan berapa saldonya?\n(contoh: BCA 5 juta, Gopay 500 ribu, Tunai 200 ribu)`);
      return;
    }

    if (status === 'step_balance') {
      const wallets = await extractWallets(text);
      if (!wallets || wallets.length === null || wallets.length === 0) {
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
          balance: w.balance
        };
      });

      // Insert all wallets
      const { error: walletsError } = await supabaseAdmin.from('wallets').insert(walletInserts);
      if (walletsError) {
        console.error('Error inserting wallets:', walletsError);
      }

      await supabaseAdmin.from('profiles').update({ 
        current_balance: totalBalance, // Still useful for quick overall balance
        onboarding_status: 'completed' 
      }).eq('id', userId);

      let walletsText = wallets.map(w => `- ${w.name}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(w.balance)}`).join('\n');
      
      await message.reply(`Mantap! Berikut rincian uangmu yang tercatat:\n${walletsText}\n\nSetup akun kamu sudah selesai!\nSekarang kamu bisa lapor ke aku tiap kali kamu jajan atau dapat pemasukan. Jangan lupa kasih tau juga bayarnya pakai apa ya!\n\nCoba ceritain pengeluaran pertamamu hari ini!`);
      return;
    }

  } catch (error) {
    console.error(`[Onboarding Error for ${userId}]:`, error);
    await message.reply("Maaf, terjadi kesalahan saat menyimpan data. Coba lagi ya.");
  }
};
