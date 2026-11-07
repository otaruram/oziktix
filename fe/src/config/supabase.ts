import { createClient } from '@supabase/supabase-js';
import { ENV, LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY } from './env';

// Explicitly hardcoded to real production Supabase project (guarantees zero broken DNS or legacy dummy URLs)
const targetUrl = LIVE_SUPABASE_URL;
const targetKey = LIVE_SUPABASE_ANON_KEY;

// Initialize Supabase client
export const supabase = createClient(targetUrl, targetKey, {
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

