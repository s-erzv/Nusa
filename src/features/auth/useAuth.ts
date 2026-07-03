import { useState, useEffect, useRef } from 'react';
import { supabase, setAuthSession } from '../../lib/supabase';

type AuthState = 'idle' | 'generating' | 'waiting_for_wa' | 'authenticated';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>('idle');
  const [loginId, setLoginId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setState('authenticated');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setState('authenticated');
      else setState('idle');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const startMagicLogin = async () => {
    setState('generating');
    setError(null);
    const newLoginId = generateRandomId();
    setLoginId(newLoginId);

    try {
      const res = await fetch('http://localhost:3000/api/auth/magic/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: newLoginId }),
      });

      if (!res.ok) throw new Error('Failed to create auth session');
      
      setState('waiting_for_wa');
      
      // Start polling
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:3000/api/auth/magic/status/${newLoginId}`);
          const data = await statusRes.json();
          
          if (data.status === 'completed' && data.session) {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            await setAuthSession(data.session.access_token, data.session.refresh_token);
            setState('authenticated');
          } else if (data.status === 'expired') {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            setError('Sesi login kadaluarsa. Silakan request ulang.');
            setState('idle');
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 2000); // Poll every 2 seconds

    } catch (err: any) {
      setError(err.message || 'Gagal memulai sesi login.');
      setState('idle');
    }
  };

  const reset = async () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    setState('idle');
    setLoginId(null);
    setError(null);
    await supabase.auth.signOut();
  };

  return {
    state,
    loginId,
    error,
    startMagicLogin,
    reset,
  };
};
