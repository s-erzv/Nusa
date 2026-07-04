import { MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginViewProps {
  state: 'idle' | 'initiating' | 'waiting';
  loginCode: string | null;
  botPhone: string | null;
  error: string | null;
  onStart: () => Promise<{phone: string, code: string} | null>;
}

export const LoginView = ({ state, loginCode, botPhone, error, onStart }: LoginViewProps) => {
  const getWhatsAppLink = () => {
    // Format the bot phone to strip any non-digit chars
    const phone = botPhone ? botPhone.replace(/\D/g, '') : '';
    // If no phone is returned (testing mode), we omit it and let user pick contact
    return `https://wa.me/${phone}?text=${encodeURIComponent(loginCode || '')}`;
  };

  const handleStart = async () => {
    const result = await onStart();
    if (result) {
      const phone = result.phone.replace(/\D/g, '');
      const text = encodeURIComponent(result.code);
      const waLink = `https://api.whatsapp.com/send/?phone=${phone}&text=${text}&type=phone_number&app_absent=0`;
      
      // Open in same tab or new tab. New tab is better.
      window.open(waLink, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-surface/50 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Login to Nusa</h2>
          <p className="text-white/60">
            {state === 'waiting' 
              ? 'Send the magic code to our WhatsApp bot to securely log in.' 
              : 'Passwordless authentication via WhatsApp.'}
          </p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {state === 'idle' && (
          <button
            onClick={handleStart}
            className="w-full group relative flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-[0.98]"
          >
            <span>Continue with WhatsApp</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {state === 'initiating' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <p className="text-white/60 animate-pulse">Generating your magic code...</p>
          </div>
        )}

        {state === 'waiting' && loginCode && (
          <div className="w-full space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="p-6 rounded-xl bg-black/40 border border-white/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600 opacity-50" />
              <p className="text-sm font-medium text-white/60 uppercase tracking-widest">Your Magic Code</p>
              <p className="text-4xl font-black text-white tracking-widest">{loginCode}</p>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group relative flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-400 transition-all duration-200 shadow-lg shadow-green-500/20 active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Send Code via WhatsApp</span>
            </a>

            <div className="flex items-center justify-center gap-2 text-sm text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Waiting for you to send the message...</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
