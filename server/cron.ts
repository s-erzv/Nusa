import cron from 'node-cron';
import { supabaseAdmin } from './config/supabaseAdmin.js';
import { sendMessage } from './whatsapp/client.js';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

export const startCronJobs = () => {
  console.log('Starting Cron Jobs...');

  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily routine expense reminder check...');
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const targetH1 = currentDay + 1;
      const targetH3 = currentDay + 3;

      // 1. Fetch all profiles that have a phone number registered
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, phone_number, full_name')
        .not('phone_number', 'is', null);

      if (profileError || !profiles) {
        console.error('[Cron] Failed to fetch profiles', profileError);
        return;
      }

      // 2. Check routine expenses for each profile
      for (const profile of profiles) {
        const { data: routines } = await supabaseAdmin
          .from('routine_expenses')
          .select('description, amount, due_date_day, type')
          .eq('user_id', profile.id)
          .in('due_date_day', [targetH1, targetH3]);

        if (routines && routines.length > 0) {
          let message = `Halo ${profile.full_name || ''}! Nusa mau ngingetin nih, ada tagihan yang mau jatuh tempo:\n\n`;
          
          let hasH1 = false;
          let hasH3 = false;

          routines.forEach(r => {
            const hStatus = r.due_date_day === targetH1 ? 'BESOK (H-1)' : 'H-3';
            if (r.due_date_day === targetH1) hasH1 = true;
            if (r.due_date_day === targetH3) hasH3 = true;
            
            message += `- ${r.description} (${hStatus}): ${formatIDR(Number(r.amount))}\n`;
          });

          message += `\nJangan lupa disiapin ya dananya biar nggak telat bayar! 💸`;

          await sendMessage(profile.phone_number, message);
          console.log(`[Cron] Sent reminder to ${profile.phone_number}`);
        }
      }
    } catch (error) {
      console.error('[Cron] Error in daily reminder job:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  // Run every day at 06:00 AM for Morning Briefing
  cron.schedule('0 6 * * *', async () => {
    console.log('[Cron] Running daily morning briefing...');
    try {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, phone_number, full_name, current_balance')
        .not('phone_number', 'is', null);

      if (profileError || !profiles) return;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();

      for (const profile of profiles) {
        // Calculate total balance from wallets
        const { data: wallets } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', profile.id);
        const totalBalance = (wallets || []).reduce((sum, w) => sum + Number(w.balance), 0);

        // Fetch last 7 days expenses
        const { data: recentTxs } = await supabaseAdmin
          .from('transactions')
          .select('amount, category')
          .eq('user_id', profile.id)
          .eq('type', 'expense')
          .gte('created_at', sevenDaysAgo);

        const totalExpense7Days = (recentTxs || []).reduce((sum, tx) => sum + Number(tx.amount), 0);

        // Calculate top category
        const catMap: Record<string, number> = {};
        (recentTxs || []).forEach(tx => {
          catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
        });
        const topCat = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0];

        let message = `🌅 Selamat Pagi ${profile.full_name || ''}!\nIni ringkasan keuanganmu hari ini:\n\n`;
        message += `Total Saldo Saat Ini: ${formatIDR(totalBalance)}\n`;
        
        if (totalExpense7Days > 0) {
          message += `\nDalam 7 hari terakhir, kamu udah keluarin uang sebesar ${formatIDR(totalExpense7Days)}.\n`;
          if (topCat) {
            message += `Pengeluaran paling besar buat: ${topCat} (${formatIDR(catMap[topCat])}).\n`;
          }
        } else {
          message += `\nWah, 7 hari terakhir kamu hemat banget, belum ada pengeluaran!\n`;
        }

        message += `\nSemangat jalanin harinya ya! 🚀`;

        await sendMessage(profile.phone_number, message);
        console.log(`[Cron] Sent morning briefing to ${profile.phone_number}`);
      }
    } catch (error) {
      console.error('[Cron] Error in morning briefing job:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });
};
