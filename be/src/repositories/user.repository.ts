import { prisma } from '../infrastructure/db/prisma';
import { userMemoryCache } from '../infrastructure/auth/supabaseAuth';

export interface DbUser {
  id: string;
  email: string;
  fullName: string;
  nik: string;
  phone: string;
  avatarUrl: string | null;
  address: string | null;
  role: 'VISITOR' | 'ADMIN' | 'GATE_OFFICER';
  kycStatus: string;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  public async findById(id: string): Promise<DbUser | null> {
    try {
      const rows: DbUser[] = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE "id" = ${id} LIMIT 1;
      `;
      if (rows.length > 0) {
        const u = rows[0];
        userMemoryCache.set(u.id, {
          id: u.id,
          email: u.email,
          name: u.fullName,
          nik: u.nik,
          phone: u.phone,
          avatarUrl: u.avatarUrl || '',
          address: u.address || 'Bandung, Jawa Barat',
          role: u.role,
          kycStatus: u.kycStatus,
          isOnboarded: u.isOnboarded,
        });
        return u;
      }
    } catch {
      // Fallback to memory cache
    }
    const cached = userMemoryCache.get(id);
    if (cached) {
      return {
        id: cached.id,
        email: cached.email,
        fullName: cached.name,
        nik: cached.nik || '',
        phone: cached.phone || '',
        avatarUrl: cached.avatarUrl || null,
        address: cached.address || 'Bandung, Jawa Barat',
        role: cached.role,
        kycStatus: cached.kycStatus || 'SUBMITTED_TO_ADMIN',
        isOnboarded: Boolean(cached.isOnboarded),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return null;
  }

  public async upsertUser(params: {
    id: string;
    email: string;
    fullName: string;
    nik: string;
    phone: string;
    avatarUrl?: string;
    address?: string;
    role: 'VISITOR' | 'ADMIN' | 'GATE_OFFICER';
    kycStatus: string;
    isOnboarded: boolean;
  }): Promise<DbUser> {
    const now = new Date();
    const avatar = params.avatarUrl || '';
    const addr = params.address || 'Bandung, Jawa Barat';

    userMemoryCache.set(params.id, {
      id: params.id,
      email: params.email,
      name: params.fullName,
      nik: params.nik,
      phone: params.phone,
      avatarUrl: avatar,
      address: addr,
      role: params.role,
      kycStatus: params.kycStatus,
      isOnboarded: params.isOnboarded,
    });

    try {
      const rows: DbUser[] = await prisma.$queryRaw`
        INSERT INTO "User" (
          "id", "email", "fullName", "nik", "phone", "avatarUrl", "address", "role", "kycStatus", "isOnboarded", "createdAt", "updatedAt"
        )
        VALUES (
          ${params.id},
          ${params.email},
          ${params.fullName},
          ${params.nik},
          ${params.phone},
          ${avatar},
          ${addr},
          ${params.role},
          ${params.kycStatus},
          ${params.isOnboarded},
          NOW(),
          NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "email" = EXCLUDED."email",
          "fullName" = EXCLUDED."fullName",
          "nik" = EXCLUDED."nik",
          "phone" = EXCLUDED."phone",
          "avatarUrl" = CASE WHEN EXCLUDED."avatarUrl" <> '' THEN EXCLUDED."avatarUrl" ELSE "User"."avatarUrl" END,
          "address" = EXCLUDED."address",
          "role" = EXCLUDED."role",
          "kycStatus" = EXCLUDED."kycStatus",
          "isOnboarded" = EXCLUDED."isOnboarded",
          "updatedAt" = NOW()
        RETURNING *;
      `;
      if (rows.length > 0) return rows[0];
    } catch {
      try {
        const rowsByEmail: DbUser[] = await prisma.$queryRaw`
          UPDATE "User"
          SET "fullName" = ${params.fullName},
              "nik" = ${params.nik},
              "phone" = ${params.phone},
              "avatarUrl" = CASE WHEN ${avatar} <> '' THEN ${avatar} ELSE "avatarUrl" END,
              "address" = ${addr},
              "role" = ${params.role},
              "kycStatus" = ${params.kycStatus},
              "isOnboarded" = ${params.isOnboarded},
              "updatedAt" = NOW()
          WHERE "email" = ${params.email}
          RETURNING *;
        `;
        if (rowsByEmail.length > 0) return rowsByEmail[0];
      } catch {
        // Ignore
      }
    }

    return {
      id: params.id,
      email: params.email,
      fullName: params.fullName,
      nik: params.nik,
      phone: params.phone,
      avatarUrl: avatar,
      address: addr,
      role: params.role,
      kycStatus: params.kycStatus,
      isOnboarded: params.isOnboarded,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async findAllUsers(): Promise<DbUser[]> {
    try {
      const rows: DbUser[] = await prisma.$queryRaw`
        SELECT * FROM "User" ORDER BY "updatedAt" DESC;
      `;
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Reset ONLY this specific user's isolated simulation playground back to 0!
   * Does NOT touch any other user's bookings, tickets, or KYC profile.
   */
  public async resetUserPlayground(userId: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM "UserSeatHold" WHERE "userId" = ${userId};`;
    await prisma.$executeRaw`DELETE FROM "SwapLog" WHERE "userId" = ${userId};`;
    await prisma.$executeRaw`
      DELETE FROM "GateLog"
      WHERE "ticketId" IN (SELECT "id" FROM "Ticket" WHERE "userId" = ${userId});
    `;
    await prisma.$executeRaw`DELETE FROM "Ticket" WHERE "userId" = ${userId};`;
  }
}

export const userRepository = new UserRepository();
