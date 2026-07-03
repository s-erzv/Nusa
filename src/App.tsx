import { AnimatePresence } from 'framer-motion';
import { AuthLayout } from './features/auth/AuthLayout';
import { LoginView } from './features/auth/LoginView';
import { useAuth } from './features/auth/useAuth';

function App() {
  const auth = useAuth();

  if (auth.state === 'authenticated') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-text p-4">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome Inside!</h1>
        <p className="text-text-muted mb-8 text-center max-w-md">
          You have successfully authenticated via WhatsApp. Your session is active.
        </p>
        <button
          onClick={auth.reset}
          className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        <LoginView
          key="login"
          state={auth.state}
          loginCode={auth.loginCode}
          botPhone={auth.botPhone}
          error={auth.error}
          onStart={auth.startLogin}
        />
      </AnimatePresence>
    </AuthLayout>
  );
}

export default App;
