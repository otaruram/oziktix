import { createClient } from '@supabase/supabase-js';
import { ENV, LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY } from './env';

const targetUrl = ENV.SUPABASE_URL && !ENV.SUPABASE_URL.includes('oziktix-challenge-2026')
  ? ENV.SUPABASE_URL
  : LIVE_SUPABASE_URL;

const targetKey = ENV.SUPABASE_ANON_KEY && !ENV.SUPABASE_ANON_KEY.includes('dummy')
  ? ENV.SUPABASE_ANON_KEY
  : LIVE_SUPABASE_ANON_KEY;

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

