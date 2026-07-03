import { useState, useEffect, useRef } from 'react';
import { initiateLogin, checkLoginStatus, getBotInfo } from '../../services/apiClient';
import { setAuthSession } from '../../lib/supabase';

type AuthState = 'idle' | 'initiating' | 'waiting' | 'authenticated';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>('idle');
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [botPhone, setBotPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startLogin = async () => {
    setState('initiating');
    setError(null);
    try {
      // Get Bot Phone Number
      const botRes = await getBotInfo();
      const phone = botRes.phone || '';

      // Generate Login Code
      const res = await initiateLogin();
      if (res.loginCode) {
        setLoginCode(res.loginCode);
        setState('waiting');
        return { phone, code: res.loginCode };
      } else {
        throw new Error('No login code returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate login.');
      setState('idle');
      return null;
    }
  };

  useEffect(() => {
    if (state === 'waiting' && loginCode) {
      // Start polling every 2 seconds
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkLoginStatus(loginCode);
          if (res.status === 'verified' && res.session) {
            // Success!
            if (pollingRef.current) clearInterval(pollingRef.current);
            await setAuthSession(res.session.access_token, res.session.refresh_token);
            setState('authenticated');
          } else if (res.status === 'expired') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError('Login session expired. Please try again.');
            setState('idle');
            setLoginCode(null);
          }
        } catch (err) {
          console.error('Polling error', err);
          // Don't kill polling on transient network errors, just log it.
        }
      }, 2000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [state, loginCode]);

  const reset = () => {
    setState('idle');
    setLoginCode(null);
    setError(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  return {
    state,
    loginCode,
    botPhone,
    error,
    startLogin,
    reset,
  };
};
