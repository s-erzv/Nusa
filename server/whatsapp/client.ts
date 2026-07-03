import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

export const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

let isReady = false;

whatsappClient.on('qr', (qr: string) => {
  console.log('Scan the QR code below to authenticate WhatsApp Client:');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp Client is ready!');
  isReady = true;
});

whatsappClient.on('disconnected', (reason: any) => {
  console.warn('⚠️ WhatsApp Client disconnected:', reason);
  isReady = false;
});

export const initWhatsApp = () => {
  console.log('Initializing WhatsApp Client...');
  whatsappClient.initialize();
};

export const sendMessage = async (phone: string, text: string): Promise<boolean> => {
  if (!isReady) {
    console.error('Failed to send message: WhatsApp Client is not ready.');
    return false;
  }
  try {
    // whatsapp-web.js expects format: countrycode+phone@c.us
    // Clean phone number (strip non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    const chatId = `${cleanPhone}@c.us`;
    await whatsappClient.sendMessage(chatId, text);
    return true;
  } catch (error) {
    console.error(`Failed to send message to ${phone}:`, error);
    return false;
  }
};
