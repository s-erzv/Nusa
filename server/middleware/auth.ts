import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // will contain { sub: userId, phone: whatsappId, ... }
    next();
  } catch (err) {
    console.error('JWT Verification error:', err);
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    return;
  }
};
