import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const router = Router();

router.get('/data', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.sub;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Invalid token payload' });
      return;
    }

    // Use supabaseAdmin to bypass RLS and fetch the user's data
    const [walletsResponse, transactionsResponse, categoryBudgetsResponse] = await Promise.all([
      supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('category_budgets')
        .select('*')
        .eq('user_id', userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        wallets: walletsResponse.data || [],
        transactions: transactionsResponse.data || [],
        categoryBudgets: categoryBudgetsResponse.data || []
      }
    });
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

router.post('/category-budgets', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Invalid token payload' });
      return;
    }

    const { category, amount } = req.body;
    if (!category || amount === undefined) {
      res.status(400).json({ success: false, message: 'Missing category or amount' });
      return;
    }

    // Upsert the category budget
    const { data, error } = await supabaseAdmin
      .from('category_budgets')
      .upsert(
        { user_id: userId, category, amount },
        { onConflict: 'user_id, category' }
      )
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Category budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to save category budget' });
  }
});

export default router;
