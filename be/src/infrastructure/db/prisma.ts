import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildTunedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;
  try {
    const hasQuery = rawUrl.includes('?');
    const params: string[] = [];
    if (!rawUrl.includes('connection_limit=')) {
      params.push('connection_limit=5');
    }
    if (!rawUrl.includes('pool_timeout=')) {
      params.push('pool_timeout=20');
    }
    if (!rawUrl.includes('connect_timeout=')) {
      params.push('connect_timeout=15');
    }
    if (rawUrl.includes(':6543') && !rawUrl.includes('pgbouncer=')) {
      params.push('pgbouncer=true');
    }
    if (params.length === 0) return rawUrl;
    return `${rawUrl}${hasQuery ? '&' : '?'}${params.join('&')}`;
  } catch {
    return rawUrl;
  }
}

const tunedUrl = buildTunedDatabaseUrl();

export const prisma =
  global.__prisma ||
  new PrismaClient({
    ...(tunedUrl ? { datasources: { db: { url: tunedUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

global.__prisma = prisma;

export default prisma;

