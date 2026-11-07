import { prisma } from '../infrastructure/db/prisma';
import {
  userMemoryCache,
  clearUserFromMemoryCache,
  DEMO_USERS_MAP,
} from '../infrastructure/auth/supabaseAuth';

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
  /**
   * Look up a registered user in PostgreSQL by ID or Email (case-insensitive).
   * Optionally syncs their ID if they signed in with Google OAuth under a new Auth UUID for an existing email.
   */
  public async findByIdOrEmail(
    id?: string,
    email?: string,
    syncAuthId: boolean = false
  ): Promise<DbUser | null> {
    const safeId = (id || '').trim();
    const safeEmail = (email || '').trim();

    try {
      const rows: DbUser[] = await prisma.$queryRaw`
        SELECT * FROM "User"
        WHERE (${safeId} <> '' AND "id" = ${safeId})
           OR (${safeEmail} <> '' AND LOWER("email") = LOWER(${safeEmail}))
        ORDER BY CASE WHEN "id" = ${safeId} THEN 0 ELSE 1 END
        LIMIT 1;
      `;

      if (rows.length > 0) {
        let u = rows[0];

        // If matched by email and caller provided a newer real Auth UUID, synchronize IDs seamlessly
        if (syncAuthId && safeId && u.id !== safeId && !DEMO_USERS_MAP[safeId]) {
          const oldId = u.id;
          try {
            const updatedRows: DbUser[] = await prisma.$queryRaw`
              UPDATE "User"
              SET "id" = ${safeId}, "updatedAt" = NOW()
              WHERE "id" = ${oldId}
              RETURNING *;
            `;
            if (updatedRows.length > 0) {
              u = updatedRows[0];
              await prisma.$executeRaw`UPDATE "Ticket" SET "userId" = ${safeId} WHERE "userId" = ${oldId};`.catch(() => {});
              await prisma.$executeRaw`UPDATE "SwapLog" SET "userId" = ${safeId} WHERE "userId" = ${oldId};`.catch(() => {});
              await prisma.$executeRaw`UPDATE "Seat" SET "heldByUserId" = ${safeId} WHERE "heldByUserId" = ${oldId};`.catch(() => {});
              await prisma.$executeRaw`UPDATE "UserSeatHold" SET "userId" = ${safeId} WHERE "userId" = ${oldId};`.catch(() => {});
              clearUserFromMemoryCache(oldId);
            }
          } catch {
            // Keep existing u.id if update skipped
          }
        }

        if (u.isOnboarded) {
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
        }
        return u;
      }
    } catch {
      // Fallback check for cached onboarded user if DB transiently unreachable
      if (safeId && userMemoryCache.has(safeId)) {
        const cached = userMemoryCache.get(safeId)!;
        if (cached.isOnboarded) {
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
            isOnboarded: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }
    }

    // Support built-in competition demo accounts
    if (safeId && DEMO_USERS_MAP[safeId]) {
      const demo = DEMO_USERS_MAP[safeId];
      return {
        id: demo.id,
        email: demo.email,
        fullName: demo.name,
        nik: demo.nik || '',
        phone: demo.phone || '',
        avatarUrl: demo.avatarUrl || null,
        address: demo.address || 'Bandung, Jawa Barat',
        role: demo.role,
        kycStatus: demo.kycStatus || 'VERIFIED',
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return null;
  }

  public async findById(id: string): Promise<DbUser | null> {
    return this.findByIdOrEmail(id, undefined, false);
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

    clearUserFromMemoryCache(params.id, params.email);

    try {
      // If a user row already exists with the same email under an older ID, align its ID first
      const existingByEmail: DbUser[] = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE LOWER("email") = LOWER(${params.email}) LIMIT 1;
      `;
      if (existingByEmail.length > 0 && existingByEmail[0].id !== params.id) {
        const oldId = existingByEmail[0].id;
        await prisma.$executeRaw`UPDATE "User" SET "id" = ${params.id} WHERE "id" = ${oldId};`.catch(() => {});
        await prisma.$executeRaw`UPDATE "Ticket" SET "userId" = ${params.id} WHERE "userId" = ${oldId};`.catch(() => {});
        await prisma.$executeRaw`UPDATE "SwapLog" SET "userId" = ${params.id} WHERE "userId" = ${oldId};`.catch(() => {});
        await prisma.$executeRaw`UPDATE "Seat" SET "heldByUserId" = ${params.id} WHERE "heldByUserId" = ${oldId};`.catch(() => {});
        await prisma.$executeRaw`UPDATE "UserSeatHold" SET "userId" = ${params.id} WHERE "userId" = ${oldId};`.catch(() => {});
      }

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
      if (rows.length > 0) {
        const saved = rows[0];
        if (saved.isOnboarded) {
          userMemoryCache.set(saved.id, {
            id: saved.id,
            email: saved.email,
            name: saved.fullName,
            nik: saved.nik,
            phone: saved.phone,
            avatarUrl: saved.avatarUrl || '',
            address: saved.address || 'Bandung, Jawa Barat',
            role: saved.role,
            kycStatus: saved.kycStatus,
            isOnboarded: saved.isOnboarded,
          });
        }
        return saved;
      }
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
          WHERE LOWER("email") = LOWER(${params.email})
          RETURNING *;
        `;
        if (rowsByEmail.length > 0) {
          const saved = rowsByEmail[0];
          userMemoryCache.set(saved.id, {
            id: saved.id,
            email: saved.email,
            name: saved.fullName,
            nik: saved.nik,
            phone: saved.phone,
            avatarUrl: saved.avatarUrl || '',
            address: saved.address || 'Bandung, Jawa Barat',
            role: saved.role,
            kycStatus: saved.kycStatus,
            isOnboarded: saved.isOnboarded,
          });
          return saved;
        }
      } catch {
        // Ignore
      }
    }

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
    await prisma.$executeRaw`DELETE FROM "UserSeatHold" WHERE "userId" = ${userId};`.catch(() => {});
    await prisma.$executeRaw`DELETE FROM "SwapLog" WHERE "userId" = ${userId};`.catch(() => {});
    await prisma.$executeRaw`
      DELETE FROM "GateLog"
      WHERE "ticketId" IN (SELECT "id" FROM "Ticket" WHERE "userId" = ${userId});
    `.catch(() => {});
    await prisma.$executeRaw`DELETE FROM "Ticket" WHERE "userId" = ${userId};`.catch(() => {});
    await prisma.$executeRaw`
      UPDATE "Seat"
      SET "status" = 'AVAILABLE'::"SeatStatus",
          "heldByUserId" = NULL,
          "heldByUserEmail" = NULL,
          "holdExpiresAt" = NULL,
          "updatedAt" = NOW()
      WHERE "heldByUserId" = ${userId};
    `.catch(() => {});
  }

  /**
   * Permanently and totally delete a user's account, KYC data, holds, tickets, gate logs, swap logs,
   * memory cache, and auth.users record!
   */
  public async deleteAccountTotally(userId: string, email?: string): Promise<{ deletedIds: string[]; email: string }> {
    const safeId = (userId || '').trim();
    let safeEmail = (email || '').trim();

    clearUserFromMemoryCache(safeId, safeEmail);

    const idsToDelete = new Set<string>();
    if (safeId) idsToDelete.add(safeId);

    try {
      const matchedUsers: DbUser[] = await prisma.$queryRaw`
        SELECT * FROM "User"
        WHERE (${safeId} <> '' AND "id" = ${safeId})
           OR (${safeEmail} <> '' AND LOWER("email") = LOWER(${safeEmail}));
      `;
      for (const u of matchedUsers) {
        idsToDelete.add(u.id);
        if (!safeEmail && u.email) {
          safeEmail = u.email;
        }
        clearUserFromMemoryCache(u.id, u.email);
      }
    } catch {
      // Ignore lookup error
    }

    const idList = Array.from(idsToDelete);

    // 1. Release physical Seat holds/purchases associated with this user
    for (const uid of idList) {
      await prisma.$executeRaw`
        UPDATE "Seat"
        SET "status" = 'AVAILABLE'::"SeatStatus",
            "heldByUserId" = NULL,
            "heldByUserEmail" = NULL,
            "holdExpiresAt" = NULL,
            "updatedAt" = NOW()
        WHERE "heldByUserId" = ${uid};
      `.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`
        UPDATE "Seat"
        SET "status" = 'AVAILABLE'::"SeatStatus",
            "heldByUserId" = NULL,
            "heldByUserEmail" = NULL,
            "holdExpiresAt" = NULL,
            "updatedAt" = NOW()
        WHERE LOWER("heldByUserEmail") = LOWER(${safeEmail});
      `.catch(() => {});
    }

    // 2. Delete UserSeatHold rows
    for (const uid of idList) {
      await prisma.$executeRaw`DELETE FROM "UserSeatHold" WHERE "userId" = ${uid};`.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`DELETE FROM "UserSeatHold" WHERE LOWER("userEmail") = LOWER(${safeEmail});`.catch(() => {});
    }

    // 3. Delete GateLog rows referencing this user's tickets
    for (const uid of idList) {
      await prisma.$executeRaw`
        DELETE FROM "GateLog"
        WHERE "ticketId" IN (SELECT "id" FROM "Ticket" WHERE "userId" = ${uid});
      `.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`
        DELETE FROM "GateLog"
        WHERE "ticketId" IN (SELECT "id" FROM "Ticket" WHERE LOWER("userEmail") = LOWER(${safeEmail}));
      `.catch(() => {});
    }

    // 4. Delete SwapLog rows
    for (const uid of idList) {
      await prisma.$executeRaw`DELETE FROM "SwapLog" WHERE "userId" = ${uid};`.catch(() => {});
    }

    // 5. Delete Ticket rows
    for (const uid of idList) {
      await prisma.$executeRaw`DELETE FROM "Ticket" WHERE "userId" = ${uid};`.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`DELETE FROM "Ticket" WHERE LOWER("userEmail") = LOWER(${safeEmail});`.catch(() => {});
    }

    // 6. Delete User row(s) in public."User"
    for (const uid of idList) {
      await prisma.$executeRaw`DELETE FROM "User" WHERE "id" = ${uid};`.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`DELETE FROM "User" WHERE LOWER("email") = LOWER(${safeEmail});`.catch(() => {});
    }

    // 7. Also purge from Supabase auth.users directly via PostgreSQL if DB role permits
    for (const uid of idList) {
      await prisma.$executeRaw`DELETE FROM auth.users WHERE id::text = ${uid};`.catch(() => {});
    }
    if (safeEmail) {
      await prisma.$executeRaw`DELETE FROM auth.users WHERE LOWER(email) = LOWER(${safeEmail});`.catch(() => {});
    }

    return { deletedIds: idList, email: safeEmail };
  }
}

export const userRepository = new UserRepository();
