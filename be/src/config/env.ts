import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const LIVE_SUPABASE_URL = 'https://gnxrxocmvqmkibuthxtj.supabase.co';

const envSchema = z.object({
  DATABASE_URL: z.string().default(process.env.DATABASE_URL || ''),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().default(process.env.SUPABASE_URL || LIVE_SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''),
  HMAC_SECRET: z.string().default(process.env.HMAC_SECRET || 'OzikTix-Summarecon-Bandung-2026-SuperKey-HmacSha256-ProductionSeed'),
  PORT: z.string().default('8080').transform((v: string) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

export const ENV = envSchema.parse(process.env);
