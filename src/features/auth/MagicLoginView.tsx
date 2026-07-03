import { Smartphone, ArrowRight, Loader2, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface MagicLoginViewProps {
  state: 'idle' | 'generating' | 'waiting_for_wa';
  loginId: string | null;
  error: string | null;
  onStartMagicLogin: () => Promise<void>;
  onBack: () => void;
}

export const MagicLoginView = ({ state, loginId, error, onStartMagicLogin, onBack }: MagicLoginViewProps) => {
  // Auto-start on mount if idle
  useEffect(() => {
    if (state === 'idle' && !error) {
      onStartMagicLogin();
    }
  }, [state, error, onStartMagicLogin]);

  const botNumber = "6287762407811"; // Make sure this matches your bot's number
  const waLink = `https://wa.me/${botNumber}?text=Login%20Nusa%3A%20${loginId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-surface backdrop-blur-2xl border border-border shadow-2xl relative"
    >
      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-text-muted" />
      </button>

      <div className="flex flex-col items-center text-center space-y-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <Smartphone className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text tracking-tight">
            Continue with WhatsApp
          </h2>
          <p className="text-text-muted">
            Kirimkan kode unik di bawah ini ke bot Nusa untuk verifikasi instan.
          </p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {(state === 'idle' || state === 'generating') ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-text-muted">Menyiapkan sesi aman...</p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="bg-background border border-border rounded-xl p-6 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-bold">Kode Login Kamu</p>
              <div className="text-3xl font-mono tracking-[0.2em] font-extrabold text-primary">
                {loginId}
              </div>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full group relative flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20b858] transition-all duration-200 shadow-lg shadow-green-500/20 active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              <span>Kirim via WhatsApp</span>
            </a>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              <p className="text-sm text-text-muted font-medium">Menunggu persetujuan dari WhatsApp...</p>
            </div>
            
            <button
              onClick={onStartMagicLogin}
              className="text-xs text-text-muted hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
            >
              Request kode baru
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
