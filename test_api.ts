import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userId = 'c94e60a0-13f6-4632-adad-87f72d842b3b';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
const token = jwt.sign(
  { sub: userId, aud: 'authenticated', role: 'authenticated', phone: '6281717715727@c.us' },
  jwtSecret,
  { expiresIn: '7d' }
);

async function run() {
  const res = await fetch('http://localhost:3000/api/dashboard/data', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  console.log("RESPONSE:", text);
}
run();
