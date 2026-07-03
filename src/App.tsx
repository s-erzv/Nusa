import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthLayout } from './features/auth/AuthLayout';
import { LandingView } from './features/auth/LandingView';
import { MagicLoginView } from './features/auth/MagicLoginView';
import { useAuth } from './features/auth/useAuth';
import { Dashboard } from './features/dashboard/Dashboard';

type AppState = 'landing' | 'login' | 'dashboard';

function App() {
  const auth = useAuth();
  const [appState, setAppState] = useState<AppState>('landing');

  // If authenticated, override state to dashboard
  if (auth.state === 'authenticated') {
    return <Dashboard onSignOut={() => { auth.reset(); setAppState('landing'); }} />;
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {appState === 'landing' && (
          <LandingView 
            key="landing" 
            onLoginClick={() => setAppState('login')} 
          />
        )}
        
        {appState === 'login' && (
          <MagicLoginView
            key="login"
            state={auth.state as any}
            loginId={auth.loginId}
            error={auth.error}
            onStartMagicLogin={auth.startMagicLogin}
            onBack={() => { auth.reset(); setAppState('landing'); }}
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

export default App;
