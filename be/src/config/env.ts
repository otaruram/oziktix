import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/oziktix?schema=public'),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().default('https://oziktix-challenge-2026.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(process.env.SUPABASE_SECRET_KEY || 'dummy_service_role_key_for_judge_evaluation'),
  HMAC_SECRET: z.string().default('OzikTix-Summarecon-Bandung-2026-SuperKey-HmacSha256-ProductionSeed'),
  PORT: z.string().default('8080').transform((v: string) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const ENV = envSchema.parse(process.env);

