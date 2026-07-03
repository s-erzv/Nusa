import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const router = Router();

// Endpoint to create a new auth request session
router.post('/create', async (req, res) => {
  const { login_id } = req.body;
  if (!login_id) {
    return res.status(400).json({ error: 'login_id is required' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('auth_requests')
      .insert([{ login_id, status: 'pending' }]);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error creating magic auth request:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for frontend to poll status
router.get('/status/:login_id', async (req, res) => {
  const { login_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('auth_requests')
      .select('*')
      .eq('login_id', login_id)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Auth request not found' });
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      return res.json({ status: 'expired' });
    }

    if (data.status === 'completed') {
      // If completed, return tokens and delete the request for security (one-time use)
      await supabaseAdmin.from('auth_requests').delete().eq('id', data.id);
      
      return res.json({
        status: 'completed',
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        }
      });
    }

    res.json({ status: data.status });
  } catch (err: any) {
    console.error('Error polling magic auth status:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
