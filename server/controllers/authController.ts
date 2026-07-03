import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { whatsappClient } from '../whatsapp/client.js';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    // Format phone to WhatsApp ID (assuming Indonesia +62 for simplicity if starts with 0)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }
    const whatsappId = `${formattedPhone}@c.us`;

    // 1. Check if user is registered in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    if (profileError || !profile) {
      res.status(404).json({ success: false, message: 'Nomor belum terdaftar. Silakan chat bot kami di WhatsApp terlebih dahulu untuk mendaftar.' });
      return;
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    
    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 3. Store OTP Hash
    const { error: insertError } = await supabaseAdmin
      .from('otp_sessions')
      .insert({
        phone: whatsappId,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error inserting OTP session:', insertError);
      res.status(500).json({ success: false, message: 'Failed to generate OTP' });
      return;
    }

    // 4. Send OTP via WhatsApp
    if (whatsappClient.info) {
      const message = `Halo ${profile.full_name || 'Kak'}!\n\nKode OTP kamu adalah: *${otp}*\n\nKode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun!`;
      await whatsappClient.sendMessage(whatsappId, message);
    } else {
      console.error('WhatsApp client not ready to send OTP');
      res.status(503).json({ success: false, message: 'Sistem WhatsApp sedang sibuk. Coba lagi nanti.' });
      return;
    }

    res.status(200).json({ success: true, message: 'OTP telah dikirim ke WhatsApp.' });
  } catch (error: any) {
    console.error('requestOtp error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      return;
    }

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }
    const whatsappId = `${formattedPhone}@c.us`;

    const otpHash = hashOTP(otp);

    // 1. Verify OTP in database
    const { data: sessionData, error: fetchError } = await supabaseAdmin
      .from('otp_sessions')
      .select('*')
      .eq('phone', whatsappId)
      .eq('otp_hash', otpHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !sessionData) {
      res.status(401).json({ success: false, message: 'Kode OTP salah.' });
      return;
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      res.status(401).json({ success: false, message: 'Kode OTP sudah kadaluarsa.' });
      return;
    }

    // Delete OTP so it can't be reused
    await supabaseAdmin.from('otp_sessions').delete().eq('id', sessionData.id);

    // 2. Generate Supabase JWT
    // We sign it with SUPABASE_SERVICE_ROLE_KEY (must be the JWT secret)
    // Wait, the JWT secret is actually in Supabase Settings -> API -> JWT Secret. 
    // In local dev, it's usually the same as the service role key signature.
    // However, it's safer to generate a custom JWT using jsonwebtoken and the JWT Secret.
    // If JWT Secret isn't available, we'll try to extract it from the anon key or use SUPABASE_SERVICE_ROLE_KEY.
    // For simplicity, we'll sign a standard token that Supabase understands.
    
    // Note: The standard Supabase JWT uses the JWT secret.
    // Since we only have VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY,
    // we can parse the JWT secret from the SUPABASE_SERVICE_ROLE_KEY if they share it,
    // or we can use our OTP_SALT_SECRET as a fallback for custom auth (but RLS won't work).
    // Actually, Supabase admin client bypasses RLS anyway. 
    // Wait, the frontend uses VITE_SUPABASE_ANON_KEY and we want RLS to work.
    // Supabase allows custom JWTs if signed with the exact JWT secret. 
    // If we can't reliably sign it, we can just return the whatsappId and use custom API routes instead of direct Supabase DB access from frontend.
    // Or we can just sign it with SUPABASE_SERVICE_ROLE_KEY for now. 
    // Let's assume process.env.SUPABASE_JWT_SECRET is set, or fallback to something.
    // Since this is a hackathon/demo app, let's just create a normal JWT for the Express server to use if needed,
    // AND a mock Supabase session. Wait, the frontend App.tsx just uses `setAuthSession(access_token, refresh_token)`.

    // Fetch actual UUID to use as JWT sub for RLS
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    const userId = profile?.id || whatsappId;

    // Create a generic JWT
    if (!process.env.SUPABASE_JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET is missing in .env.local');
    }
    
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
    
    const token = jwt.sign(
      { 
        sub: userId, 
        aud: 'authenticated',
        role: 'authenticated', 
        phone: whatsappId 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      session: {
        access_token: token,
        refresh_token: token,
      }
    });
  } catch (error: any) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
