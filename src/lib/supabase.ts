import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Injects a JWT session received from the custom backend into the Supabase client.
 */
export const setAuthSession = async (token: string, refreshToken?: string) => {
  const { data, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: refreshToken || '',
  });

  if (error) {
    console.error('Error setting auth session:', error.message);
    throw error;
  }

  return data;
};
