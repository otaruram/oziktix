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
            ...parsed,
            role: parsed.role || cached.role || 'VISITOR',
          };
        }
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
        userMemoryCache.set(userObj.id, userObj);
        return userObj;
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
        if (userMemoryCache.has(decoded.sub)) {
          return userMemoryCache.get(decoded.sub)!;
        }
        if (DEMO_USERS_MAP[decoded.sub]) {
          return DEMO_USERS_MAP[decoded.sub];
        }
        // If it's a real Supabase Google JWT, check DB or build user from JWT claims directly
        try {
          const dbUsers: any[] = await prisma.$queryRaw`
            SELECT * FROM "User" WHERE "id" = ${decoded.sub} LIMIT 1;
          `;
          if (dbUsers.length > 0) {
            const dbUser = dbUsers[0];
            const mapped: AuthenticatedUser = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.fullName,
              nik: dbUser.nik,
              phone: dbUser.phone,
              avatarUrl:
                dbUser.avatarUrl ||
                decoded.user_metadata?.avatar_url ||
                decoded.user_metadata?.picture ||
                '',
              address: dbUser.address || 'Bandung, Jawa Barat',
              role: (dbUser.role as any) || 'VISITOR',
              kycStatus: dbUser.kycStatus || 'SUBMITTED_TO_ADMIN',
              isOnboarded: Boolean(dbUser.isOnboarded),
            };
            userMemoryCache.set(mapped.id, mapped);
            return mapped;
          }
        } catch {
          // Ignore DB lookup failure
        }

        const googleUser: AuthenticatedUser = {
          id: decoded.sub,
          email: decoded.email || 'user@gmail.com',
          name:
            decoded.user_metadata?.full_name ||
            decoded.user_metadata?.name ||
            decoded.email?.split('@')[0] ||
            'Google Attendee',
          nik: decoded.user_metadata?.nik || '3273010000000000',
          phone: decoded.phone || '+62 812-0000-0000',
          avatarUrl: decoded.user_metadata?.avatar_url || decoded.user_metadata?.picture || '',
          address: 'Bandung, Jawa Barat',
          role: (decoded.app_metadata?.role as any) || (decoded.user_metadata?.role as any) || 'VISITOR',
          kycStatus: 'PENDING_SUBMISSION',
          isOnboarded: false,
        };
        userMemoryCache.set(googleUser.id, googleUser);
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
    if (cached) {
      return cached;
    }

    // Check database User record
    try {
      const dbUsers: any[] = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE "id" = ${user.id} LIMIT 1;
      `;
      if (dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        const mapped: AuthenticatedUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.fullName,
          nik: dbUser.nik,
          phone: dbUser.phone,
          avatarUrl: dbUser.avatarUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          address: dbUser.address || '',
          role: (dbUser.role as any) || 'VISITOR',
          kycStatus: dbUser.kycStatus,
          isOnboarded: dbUser.isOnboarded,
        };
        userMemoryCache.set(mapped.id, mapped);
        return mapped;
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
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
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
