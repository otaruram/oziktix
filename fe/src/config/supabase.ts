import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// Initialize Supabase client
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const signInWithGoogle = async (redirectTo?: string) => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

