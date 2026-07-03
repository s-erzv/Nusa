import { MessageCircle, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface OtpViewProps {
  state: 'idle' | 'requesting' | 'awaiting_otp' | 'verifying';
  phone: string;
  error: string | null;
  onRequestOtp: (phone: string) => Promise<void>;
  onVerifyOtp: (otp: string) => Promise<void>;
  onBack: () => void;
}

export const OtpView = ({ state, phone, error, onRequestOtp, onVerifyOtp, onBack }: OtpViewProps) => {
  const handleSubmitPhone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phone') as string;
    if (phoneNumber) {
      onRequestOtp(phoneNumber);
    }
  };

  const handleSubmitOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get('otp') as string;
    if (otpCode) {
      onVerifyOtp(otpCode);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-surface backdrop-blur-2xl border border-border shadow-2xl"
    >
      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-text-muted" />
      </button>

      <div className="flex flex-col items-center text-center space-y-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
          {state === 'idle' || state === 'requesting' ? (
            <MessageCircle className="w-8 h-8 text-white" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-white" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text tracking-tight">
            {state === 'idle' || state === 'requesting' ? 'Welcome Back' : 'Verify Identity'}
          </h2>
          <p className="text-text-muted">
            {state === 'idle' || state === 'requesting' 
              ? 'Enter your registered WhatsApp number' 
              : `We've sent a 6-digit code to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Phone Input */}
        {(state === 'idle' || state === 'requesting') && (
          <form onSubmit={handleSubmitPhone} className="w-full space-y-4">
            <div>
              <input
                type="tel"
                name="phone"
                defaultValue={phone}
                placeholder="08123456789"
                required
                disabled={state === 'requesting'}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'requesting'}
              className="w-full group relative flex items-center justify-center gap-2 px-6 py-3 bg-text text-background font-semibold rounded-xl hover:bg-text/90 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {state === 'requesting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send OTP via WhatsApp</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {(state === 'awaiting_otp' || state === 'verifying') && (
          <form onSubmit={handleSubmitOtp} className="w-full space-y-4">
            <div>
              <input
                type="text"
                name="otp"
                maxLength={6}
                placeholder="123456"
                required
                autoFocus
                disabled={state === 'verifying'}
                className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono rounded-xl bg-background border border-border text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'verifying'}
              className="w-full group relative flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
            >
              {state === 'verifying' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify & Login</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRequestOtp(phone)}
              className="text-sm text-primary hover:underline pt-2 block w-full"
            >
              Resend Code
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};
