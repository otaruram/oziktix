/**
 * OzikTix Environment Configuration
 * Supports both Vite (VITE_*) and Next.js (NEXT_PUBLIC_*) conventions
 */

const sanitizeEnvVal = (val: string, fallback: string): string => {
  const trimmed = val.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('oziktix-challenge-2026')) {
    return fallback;
  }
  // Auto-correct legacy service URL to actual live Render URL (https://oziktix.onrender.com)
  if (trimmed.includes('oziktix-backend.onrender.com')) {
    return 'https://oziktix.onrender.com';
  }
  return trimmed;
};

const getEnvVar = (viteKey: string, nextKey: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
    const val = String((import.meta as any).env[viteKey]);
    return sanitizeEnvVal(val, fallback);
  }
  if (typeof process !== 'undefined' && process.env?.[nextKey]) {
    const val = String(process.env[nextKey]);
    return sanitizeEnvVal(val, fallback);
  }
  return fallback;
};

// Hardcoded Real Production Endpoints & Supabase Public Credentials
export const LIVE_API_BASE_URL = 'https://oziktix.onrender.com';
export const LIVE_SUPABASE_URL = 'https://gnxrxocmvqmkibuthxtj.supabase.co';
export const LIVE_SUPABASE_ANON_KEY = 'sb_publishable_bU0qavcq-1xOH61N2Awxgg_k4tIkWwv';

export const ENV = {
  API_BASE_URL: getEnvVar(
    'VITE_API_BASE_URL',
    'NEXT_PUBLIC_API_BASE_URL',
    typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
      ? LIVE_API_BASE_URL
      : 'http://localhost:8080'
  ),
  SUPABASE_URL: getEnvVar(
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    LIVE_SUPABASE_URL
  ),
  SUPABASE_ANON_KEY: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    LIVE_SUPABASE_ANON_KEY
  ),
  DEMO_TOKENS: {
    VISITOR:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfanVkZ2VfdmlzaXRvcl8wMSIsImVtYWlsIjoiYnVkaS5oYXJ0b25vQHN1bW1hcmVjb24tZ2FsYS5pZCIsIm5hbWUiOiJCdWRpIEhhcnRvbm8gKEp1ZGdlIC8gQXR0ZW5kZWUpIiwicm9sZSI6IlZJU0lUT1IiLCJpYXQiOjE3MDAwMDAwMDB9.demo_signed_jwt',
    ADMIN:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYWRtaW5fcGFuaXRpYV8wMSIsImVtYWlsIjoiYWRtaW4ucGFuaXRpYUBzdW1tYXJlY29uLmNvbSIsIm5hbWUiOiJTaXRpIFJhaG1hd2F0aSAoTGVhZCBQYW5pdGlhKSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwMDAwMDAwMH0.demo_signed_jwt',
    GATE_OFFICER:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZ2F0ZV9vZmZpY2VyXzAxIiwiZW1haWwiOiJnYXRlMDFAc3VtbWFyZWNvbi1zZWN1cml0eS5pZCIsIm5hbWUiOiJBaG1hZCBGYXV6aSAoR2F0ZSBJbnNwZWN0b3IgMDEpIiwicm9sZSI6IkdBVEVfT0ZGSUNFUiIsImlhdCI6MTcwMDAwMDAwMH0.demo_signed_jwt',
  },
  DEMO_JWT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfanVkZ2VfdmlzaXRvcl8wMSIsImVtYWlsIjoiYnVkaS5oYXJ0b25vQHN1bW1hcmVjb24tZ2FsYS5pZCIsIm5hbWUiOiJCdWRpIEhhcnRvbm8iLCJyb2xlIjoiVklTSVRPUiJ9.demo_signed_jwt',
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oziktix_auth_token') || null;
};
