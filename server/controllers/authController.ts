import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { whatsappClient } from '../whatsapp/client.js';

const generateLoginCode = (): string => {
  return `NUSA-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const initiateLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginCode = generateLoginCode();
    
    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_auth_sessions')
      .insert({
        login_code: loginCode,
        status: 'pending',
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error inserting login session:', insertError);
      res.status(500).json({ success: false, message: 'Failed to initiate login' });
      return;
    }

    res.status(200).json({
      success: true,
      loginCode,
    });
  } catch (error: any) {
    console.error('initiateLogin error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

export const loginStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ success: false, message: 'Code is required' });
      return;
    }

    const { data: sessionData, error: fetchError } = await supabaseAdmin
      .from('whatsapp_auth_sessions')
      .select('*')
      .eq('login_code', code)
      .limit(1)
      .single();

    if (fetchError || !sessionData) {
      // If code doesn't exist, we just say pending to prevent brute forcing existence
      res.status(404).json({ success: false, message: 'Session not found or expired' });
      return;
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Session expired', status: 'expired' });
      return;
    }

    if (sessionData.status === 'verified') {
      res.status(200).json({
        success: true,
        status: 'verified',
        session: {
          access_token: sessionData.session_jwt,
          refresh_token: sessionData.session_jwt,
        }
      });
      return;
    }

    // Still pending
    res.status(200).json({
      success: true,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('loginStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

export const getBotInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!whatsappClient.info || !whatsappClient.info.wid) {
      res.status(503).json({ success: false, message: 'Bot is not fully initialized yet.' });
      return;
    }
    
    // The user identifier is usually the phone number
    const botPhone = whatsappClient.info.wid.user;
    
    res.status(200).json({
      success: true,
      phone: botPhone,
    });
  } catch (error: any) {
    console.error('getBotInfo error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
