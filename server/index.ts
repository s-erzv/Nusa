import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env before other imports that might depend on it
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import authRoutes from './routes/auth.js';
import authMagicRoutes from './routes/authMagic.js';
import dashboardRoutes from './routes/dashboard.js';
import { initWhatsApp } from './whatsapp/client.js';
import { setupWhatsAppListener } from './whatsapp/listener.js';
import { startCronJobs } from './cron.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS config (simplified for demo)
app.use((req: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/magic', authMagicRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server is booting on port ${PORT}...`);
  
  // Bootstrap WhatsApp Client and Listener
  initWhatsApp();
  setupWhatsAppListener();

  // Start Cron Jobs
  startCronJobs();
});

// Graceful shutdown to prevent orphaned Chrome processes
process.on('SIGINT', async () => {
  console.log('\nShutting down server gently...');
  try {
    const { whatsappClient } = await import('./whatsapp/client.js');
    await whatsappClient.destroy();
  } catch (e) {
    console.error('Error during shutdown', e);
  }
  process.exit(0);
});
