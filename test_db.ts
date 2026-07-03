import { supabaseAdmin } from './server/config/supabaseAdmin.js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  console.log("PROFILES:", profiles);
  const { data: wallets } = await supabaseAdmin.from('wallets').select('*');
  console.log("WALLETS:", wallets);
}
run();
