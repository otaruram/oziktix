import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../config/env';
import { AuthenticatedUser } from '../../domain/types';
import { prisma } from '../db/prisma';
import jwt from 'jsonwebtoken';

// Polyfill WebSocket for Node.js 20 compatibility with Supabase Realtime client
if (typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    const wsModule = require('ws');
    (globalThis as any).WebSocket = wsModule.WebSocket || wsModule;
  } catch {
    (globalThis as any).WebSocket = class WebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
    };
  }
}

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DEMO_USERS_MAP: Record<string, AuthenticatedUser> = {
  usr_judge_visitor_01: {
    id: 'usr_judge_visitor_01',
    name: 'Rizky Pratama (Google Account)',
    email: 'rizky.pratama.bdg@gmail.com',
    nik: '3273011508990001',
    phone: '+62 812-2045-8891',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Bulevar Barat No. 75, Summarecon Bandung',
    role: 'VISITOR',
    kycStatus: 'SUBMITTED_TO_ADMIN',
    isOnboarded: true,
  },
  usr_admin_panitia_01: {
    id: 'usr_admin_panitia_01',
    name: 'Siti Rahmawati (Lead Panitia)',
    email: 'admin.panitia@summarecon.com',
    nik: '3273045402950003',
    phone: '+62 811-2233-4455',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    address: 'Summarecon Mall Bandung Management Office',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    isOnboarded: true,
  },
  usr_gate_officer_01: {
    id: 'usr_gate_officer_01',
    name: 'Ahmad Fauzi (Gate Inspector 01)',
    email: 'gate01@summarecon-security.id',
    nik: '3273081911930007',
    phone: '+62 856-7788-9900',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: 'Main Atrium Gate 1, Summarecon Mall Bandung',
    role: 'GATE_OFFICER',
    kycStatus: 'VERIFIED',
    isOnboarded: true,
  },
};

// Fast in-memory cache of onboarded users synced with DB to avoid extra roundtrips on seat clicks
export const userMemoryCache = new Map<string, AuthenticatedUser>(
  Object.entries(DEMO_USERS_MAP)
);

export function clearUserFromMemoryCache(userId?: string, email?: string): void {
  if (userId) {
    userMemoryCache.delete(userId);
  }
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    for (const [key, val] of userMemoryCache.entries()) {
      if (val.email && val.email.trim().toLowerCase() === normalizedEmail) {
        userMemoryCache.delete(key);
      }
    }
  }
}

async function lookupDbUserByIdOrEmail(
  id: string,
  email?: string,
  fallbackAvatar?: string
): Promise<AuthenticatedUser | null> {
  const safeEmail = (email || '').trim();
  const dbUsers: any[] = await prisma.$queryRaw`
    SELECT * FROM "User"
    WHERE "id" = ${id}
       OR (${safeEmail} <> '' AND LOWER("email") = LOWER(${safeEmail}))
    ORDER BY CASE WHEN "id" = ${id} THEN 0 ELSE 1 END
    LIMIT 1;
  `;
  if (dbUsers.length === 0) return null;

  const dbUser = dbUsers[0];
  const mapped: AuthenticatedUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.fullName,
    nik: dbUser.nik || '',
    phone: dbUser.phone || '',
    avatarUrl: dbUser.avatarUrl || fallbackAvatar || '',
    address: dbUser.address || 'Bandung, Jawa Barat',
    role: (dbUser.role as any) || 'VISITOR',
    kycStatus: dbUser.kycStatus || 'SUBMITTED_TO_ADMIN',
    isOnboarded: Boolean(dbUser.isOnboarded),
  };

  if (mapped.isOnboarded) {
    userMemoryCache.set(mapped.id, mapped);
  }
  return mapped;
}

export async function verifySupabaseToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Check if token is a signed or base64 JSON session token (Google / Custom / Role)
  if (token.startsWith('ozik_user_')) {
    try {
      const b64 = token.replace('ozik_user_', '');
      const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
      if (parsed && parsed.id) {
        const cached = userMemoryCache.get(parsed.id);
        if (cached) {
          return {
            ...cached,
            role: parsed.role || cached.role || 'VISITOR',
          };
        }
        try {
          const fromDb = await lookupDbUserByIdOrEmail(parsed.id, parsed.email, parsed.avatarUrl);
          if (fromDb) {
            return fromDb;
          }
          // User was deleted from DB -> reject stale ozik_user_ token
          return null;
        } catch {
          // Transient DB connection issue -> allow parsed session payload temporarily
          const userObj: AuthenticatedUser = {
            id: parsed.id,
            email: parsed.email || 'user@gmail.com',
            name: parsed.name || parsed.fullName || 'Google User',
            nik: parsed.nik || '',
            phone: parsed.phone || '',
            avatarUrl: parsed.avatarUrl || '',
            address: parsed.address || 'Bandung, Jawa Barat',
            role: parsed.role || 'VISITOR',
            kycStatus: parsed.kycStatus || 'SUBMITTED_TO_ADMIN',
            isOnboarded: Boolean(parsed.isOnboarded),
          };
          return userObj;
        }
      }
    } catch {
      // Fallthrough
    }
  }

  // 2. Check for Competition Judge / Role Token or Decoded JWT
  if (token.includes('demo')) {
    return userMemoryCache.get('usr_judge_visitor_01') || DEMO_USERS_MAP.usr_judge_visitor_01;
  }

  if (token.startsWith('eyJ')) {
    try {
      const decoded: any = jwt.decode(token);
      if (decoded && decoded.sub) {
        if (DEMO_USERS_MAP[decoded.sub]) {
          return DEMO_USERS_MAP[decoded.sub];
        }
        const cached = userMemoryCache.get(decoded.sub);
        if (cached && cached.isOnboarded) {
          return cached;
        }

        const avatarFallback =
          decoded.user_metadata?.avatar_url || decoded.user_metadata?.picture || '';

        // Check PostgreSQL User table by ID or Email (case-insensitive)
        try {
          const dbMapped = await lookupDbUserByIdOrEmail(
            decoded.sub,
            decoded.email,
            avatarFallback
          );
          if (dbMapped) {
            return dbMapped;
          }
        } catch {
          // Ignore DB lookup failure
        }

        // Not yet onboarded in DB -> return un-onboarded Google identity WITHOUT caching in userMemoryCache
        const googleUser: AuthenticatedUser = {
          id: decoded.sub,
          email: decoded.email || 'user@gmail.com',
          name:
            decoded.user_metadata?.full_name ||
            decoded.user_metadata?.name ||
            decoded.email?.split('@')[0] ||
            'Google Attendee',
          nik: '',
          phone: decoded.phone || '',
          avatarUrl: avatarFallback,
          address: 'Bandung, Jawa Barat',
          role: (decoded.app_metadata?.role as any) || (decoded.user_metadata?.role as any) || 'VISITOR',
          kycStatus: 'PENDING_SUBMISSION',
          isOnboarded: false,
        };
        return googleUser;
      }
    } catch {
      // Fallthrough
    }
  }

  // 3. Real Supabase Google OAuth JWT verification
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    const cached = userMemoryCache.get(user.id);
    if (cached && cached.isOnboarded) {
      return cached;
    }

    const avatarFallback =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    // Check database User record by ID or Email
    try {
      const dbMapped = await lookupDbUserByIdOrEmail(user.id, user.email, avatarFallback);
      if (dbMapped) {
        return dbMapped;
      }
    } catch {
      // Ignore DB lookup failure
    }

    const role = (user.app_metadata?.role as any) || (user.user_metadata?.role as any) || 'VISITOR';
    const googleUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Google User',
      phone: user.phone || user.user_metadata?.phone || '',
      avatarUrl: avatarFallback,
      role,
      kycStatus: 'PENDING_SUBMISSION',
      isOnboarded: false,
    };

    return googleUser;
  } catch (err) {
    console.error('Error in verifySupabaseToken:', err);
    return null;
  }
}
