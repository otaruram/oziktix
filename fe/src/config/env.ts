/**
 * OzikTix Environment Configuration
 * Supports both Vite (VITE_*) and Next.js (NEXT_PUBLIC_*) conventions
 */

const getEnvVar = (viteKey: string, nextKey: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
    return (import.meta as any).env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env?.[nextKey]) {
    return process.env[nextKey] as string;
  }
  return fallback;
};

export const ENV = {
  API_BASE_URL: getEnvVar(
    'VITE_API_BASE_URL',
    'NEXT_PUBLIC_API_BASE_URL',
    'http://localhost:8080'
  ),
  SUPABASE_URL: getEnvVar(
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://oziktix-challenge-2026.supabase.co'
  ),
  SUPABASE_ANON_KEY: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aWt0aXgiLCJyb2xlIjoiYW5vbiJ9.dummy_anon_key_for_judge_evaluation'
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
