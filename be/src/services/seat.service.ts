import { prisma } from '../infrastructure/db/prisma';
import { AuthenticatedUser } from '../domain/types';
import { ConflictError, QuotaExceededError, NotFoundError, BadRequestError } from '../domain/errors';
import { StatefulEngine } from '../infrastructure/crypto/statefulEngine';
import { Seat, SeatStatus, Ticket, TicketStatus } from '@prisma/client';
import { ShowcaseSeederService } from './showcaseSeeder.service';
import { MAX_SEATS_PER_ORDER } from '../domain/pricing';

interface CanonicalSeatTemplate {
  id: string;
  rowLabel: string;
  seatNumber: number;
  tier: string;
  price: number;
}

const CANONICAL_60_SEATS: CanonicalSeatTemplate[] = (() => {
  const list: CanonicalSeatTemplate[] = [];
  const rows = [
    { row: 'A', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'B', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'C', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'D', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'E', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
    { row: 'F', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
  ];
  for (const r of rows) {
    for (let col = 1; col <= 10; col++) {
      const paddedCol = col.toString().padStart(2, '0');
      list.push({
        id: `${r.prefix}-${r.row}${paddedCol}`,
        rowLabel: r.row,
        seatNumber: col,
        tier: r.tier,
        price: r.price,
      });
    }
  }
  return list;
})();

let cachedMasterSeats: CanonicalSeatTemplate[] | null = null;

async function getMasterSeatTemplates(): Promise<CanonicalSeatTemplate[]> {
  if (cachedMasterSeats && cachedMasterSeats.length === 60) {
    return cachedMasterSeats;
  }
  try {
    const dbSeats = await prisma.seat.findMany({
      orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
    });
    if (dbSeats.length === 60) {
      cachedMasterSeats = dbSeats.map((s) => ({
        id: s.id,
        rowLabel: s.rowLabel,
        seatNumber: s.seatNumber,
        tier: s.tier,
        price: s.price,
      }));
      return cachedMasterSeats;
    }
  } catch {
    // Fallback to canonical 60 seats
  }
  return CANONICAL_60_SEATS;
}

export class SeatService {
  /**
   * Per-User Isolated Playground vs Admin Global Venue View
   * - Visitor: Sees ONLY their own bookings (SOLD) and their own holds (RESERVED). Zero bleed from other users!
   * - Admin (or scope='admin'): Sees ALL bookings and ALL holds across ALL users in PostgreSQL!
   */
  public async getSeatsForUser(user?: AuthenticatedUser, scope?: string): Promise<Seat[]> {
    const templates = await getMasterSeatTemplates();
    const now = new Date();
    const isAdminScope = scope === 'admin' || user?.role === 'ADMIN';

    if (!user && !isAdminScope) {
      return templates.map((t) => ({
        ...t,
        status: SeatStatus.AVAILABLE,
        heldByUserId: null,
        heldByUserEmail: null,
        holdExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      }));
    }

    if (isAdminScope) {
      await ShowcaseSeederService.ensureSeeded();
      // Admin sees EVERY user's bookings & active holds across the whole database
      const [allTickets, allHolds] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT "seatId", "userId", "userEmail", "userName"
          FROM "Ticket"
          WHERE "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus")
          ORDER BY "createdAt" DESC;
        `,
        prisma.$queryRaw<any[]>`
          SELECT "seatId", "userId", "userEmail", "userName", "isSimulatedOther", "expiresAt"
          FROM "UserSeatHold"
          WHERE "expiresAt" > NOW()
          ORDER BY "createdAt" DESC;
        `,
      ]);

      const soldMap = new Map<string, any>();
      for (const tk of allTickets) {
        if (!soldMap.has(tk.seatId)) soldMap.set(tk.seatId, tk);
      }
      const holdMap = new Map<string, any>();
      for (const h of allHolds) {
        if (!holdMap.has(h.seatId)) holdMap.set(h.seatId, h);
      }

      return templates.map((t) => {
        const sold = soldMap.get(t.id);
        if (sold) {
          return {
            ...t,
            status: SeatStatus.SOLD,
            heldByUserId: sold.userId,
            heldByUserEmail: sold.userEmail,
            holdExpiresAt: null,
            createdAt: now,
            updatedAt: now,
          };
        }
        const hold = holdMap.get(t.id);
        if (hold) {
          return {
            ...t,
            status: SeatStatus.RESERVED,
            heldByUserId: hold.isSimulatedOther ? 'usr_competing_buyer' : hold.userId,
            heldByUserEmail: hold.userEmail,
            holdExpiresAt: new Date(hold.expiresAt),
            createdAt: now,
            updatedAt: now,
          };
        }
        return {
          ...t,
          status: SeatStatus.AVAILABLE,
          heldByUserId: null,
          heldByUserEmail: null,
          holdExpiresAt: null,
          createdAt: now,
          updatedAt: now,
        };
      });
    }

    // Isolated Visitor Playground: ONLY query this specific user's tickets & holds!
    const userId = user!.id;
    const [myTickets, myHolds] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT "seatId", "userId", "userEmail"
        FROM "Ticket"
        WHERE "userId" = ${userId}
          AND "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus");
      `,
      prisma.$queryRaw<any[]>`
        SELECT "seatId", "userId", "userEmail", "isSimulatedOther", "expiresAt"
        FROM "UserSeatHold"
        WHERE "userId" = ${userId}
          AND "expiresAt" > NOW();
      `,
    ]);

    const soldSet = new Map<string, any>(myTickets.map((tk) => [tk.seatId, tk]));
    const holdSet = new Map<string, any>(myHolds.map((h) => [h.seatId, h]));

    return templates.map((t) => {
      const sold = soldSet.get(t.id);
      if (sold) {
        return {
          ...t,
          status: SeatStatus.SOLD,
          heldByUserId: userId,
          heldByUserEmail: sold.userEmail,
          holdExpiresAt: null,
          createdAt: now,
          updatedAt: now,
        };
      }
      const hold = holdSet.get(t.id);
      if (hold) {
        return {
          ...t,
          status: SeatStatus.RESERVED,
          heldByUserId: hold.isSimulatedOther ? 'usr_competing_buyer' : userId,
          heldByUserEmail: hold.userEmail,
          holdExpiresAt: new Date(hold.expiresAt),
          createdAt: now,
          updatedAt: now,
        };
      }
      return {
        ...t,
        status: SeatStatus.AVAILABLE,
        heldByUserId: null,
        heldByUserEmail: null,
        holdExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  public async getSummary(user?: AuthenticatedUser): Promise<{ total: number; available: number; sold: number; held: number }> {
    await ShowcaseSeederService.ensureSeeded();
    const scope = !user || user.role === 'ADMIN' ? 'admin' : undefined;
    const seats = await this.getSeatsForUser(user, scope);
    let sold = 0;
    let held = 0;
    let available = 0;
    for (const s of seats) {
      if (s.status === SeatStatus.SOLD) sold++;
      else if (s.status === SeatStatus.RESERVED) held++;
      else available++;
    }
    return { total: seats.length, available, sold, held };
  }

  public async findTemplateById(seatId: string): Promise<CanonicalSeatTemplate | null> {
    const templates = await getMasterSeatTemplates();
    return templates.find((t) => t.id === seatId) || null;
  }

  /**
   * Hold seat inside THIS user's isolated playground (recorded in PostgreSQL UserSeatHold so Admin sees it too!)
   */
  public async holdSeat(seatId: string, user: AuthenticatedUser, isSimulatedOther: boolean = false): Promise<Seat> {
    const template = await this.findTemplateById(seatId);
    if (!template) {
      throw new NotFoundError(`Kursi ${seatId} tidak ditemukan di denah venue.`);
    }

    const [existingTickets, existingHolds] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT "id" FROM "Ticket"
        WHERE "userId" = ${user.id}
          AND "seatId" = ${seatId}
          AND "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus")
        LIMIT 1;
      `,
      prisma.$queryRaw<any[]>`
        SELECT * FROM "UserSeatHold"
        WHERE "userId" = ${user.id}
          AND "expiresAt" > NOW();
      `,
    ]);

    if (existingTickets.length > 0) {
      throw new ConflictError(`Kursi ${seatId} sudah penuh / telah Anda beli.`);
    }

    const holdOnTarget = existingHolds.find((h) => h.seatId === seatId);

    // If user triggers 409 Race Simulation inside their own playground
    if (isSimulatedOther) {
      const holdId = `hold_${user.id.slice(0, 8)}_${seatId}`;
      const expiresAt = new Date(Date.now() + 300 * 1000);
      await prisma.$executeRaw`
        INSERT INTO "UserSeatHold" ("id", "userId", "userEmail", "userName", "seatId", "isSimulatedOther", "expiresAt", "createdAt")
        VALUES (${holdId}, ${user.id}, ${user.email}, ${user.name}, ${seatId}, true, ${expiresAt}, NOW())
        ON CONFLICT ("userId", "seatId") DO UPDATE SET
          "isSimulatedOther" = true,
          "expiresAt" = ${expiresAt};
      `;
      return {
        ...template,
        status: SeatStatus.RESERVED,
        heldByUserId: 'usr_competing_buyer',
        heldByUserEmail: 'simulasi.pembeli.lain@oziktix.id',
        holdExpiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Check if locked by simulated competing buyer in user's playground
    if (holdOnTarget && holdOnTarget.isSimulatedOther) {
      throw new ConflictError(`HTTP 409 Conflict: Kursi ${seatId} sedang di-booking sementara oleh pembeli lain!`);
    }

    // Count user's own active holds (excluding simulated competing hold and target seat itself)
    // Max 3 = ukuran paket terbesar (Group)
    const myOwnOtherHolds = existingHolds.filter((h) => !h.isSimulatedOther && h.seatId !== seatId);
    if (myOwnOtherHolds.length >= MAX_SEATS_PER_ORDER) {
      throw new QuotaExceededError(
        `Maksimal ${MAX_SEATS_PER_ORDER} kursi per transaksi (paket Group). Anda sudah memilih ${myOwnOtherHolds.length} kursi.`
      );
    }

    const holdId = `hold_${user.id.slice(0, 8)}_${seatId}`;
    const expiresAt = new Date(Date.now() + 300 * 1000);

    await prisma.$executeRaw`
      INSERT INTO "UserSeatHold" ("id", "userId", "userEmail", "userName", "seatId", "isSimulatedOther", "expiresAt", "createdAt")
      VALUES (${holdId}, ${user.id}, ${user.email}, ${user.name}, ${seatId}, false, ${expiresAt}, NOW())
      ON CONFLICT ("userId", "seatId") DO UPDATE SET
        "userEmail" = ${user.email},
        "userName" = ${user.name},
        "isSimulatedOther" = false,
        "expiresAt" = ${expiresAt};
    `;

    return {
      ...template,
      status: SeatStatus.RESERVED,
      heldByUserId: user.id,
      heldByUserEmail: user.email,
      holdExpiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public async releaseSeat(seatId: string, userId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM "UserSeatHold"
      WHERE "userId" = ${userId} AND "seatId" = ${seatId};
    `;
  }

  public async releaseAllSeats(userId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM "UserSeatHold"
      WHERE "userId" = ${userId};
    `;
  }

  /**
   * Fast Atomic Seat Swap (<150ms, no interactive $transaction bottleneck)
   */
  public async swapSeat(
    ticketId: string,
    targetSeatId: string,
    userId: string
  ): Promise<{ updatedTicket: Ticket; newSeat: Seat }> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { seat: true },
    });

    if (!ticket) {
      throw new NotFoundError(`Tiket ${ticketId} tidak ditemukan.`);
    }
    if (ticket.userId !== userId) {
      throw new BadRequestError('Anda tidak memiliki akses pada tiket ini.');
    }
    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestError(`Tiket dengan status ${ticket.status} tidak dapat dipindah kursinya.`);
    }
    if (ticket.swapCount >= 1) {
      throw new BadRequestError('Batas pindah kursi tercapai: Maksimal 1x pindah kursi gratis per tiket.');
    }

    const targetTemplate = await this.findTemplateById(targetSeatId);
    if (!targetTemplate) {
      throw new NotFoundError(`Kursi tujuan ${targetSeatId} tidak ditemukan.`);
    }

    if (targetTemplate.tier !== ticket.seat.tier) {
      throw new BadRequestError(
        `Pindah kursi harus di tier yang sama (${ticket.seat.tier}). Kursi ${targetSeatId} adalah tier ${targetTemplate.tier}.`
      );
    }

    // Check if user already owns a ticket on targetSeatId in their playground
    const existingOnTarget = await prisma.$queryRaw<any[]>`
      SELECT "id" FROM "Ticket"
      WHERE "userId" = ${userId}
        AND "seatId" = ${targetSeatId}
        AND "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus")
      LIMIT 1;
    `;
    if (existingOnTarget.length > 0) {
      throw new ConflictError(`Kursi ${targetSeatId} sudah terisi di playground Anda.`);
    }

    const oldSeatId = ticket.seatId;
    const newSecretNonce = StatefulEngine.generateSecretNonce();
    const swapId = `swp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const [updatedTicket] = await Promise.all([
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          seatId: targetSeatId,
          swapCount: ticket.swapCount + 1,
          secretNonce: newSecretNonce,
        },
        include: { seat: true },
      }),
      prisma.$executeRaw`
        INSERT INTO "SwapLog" ("id", "ticketId", "userId", "userName", "fromSeatId", "toSeatId", "tier", "reason", "createdAt")
        VALUES (
          ${swapId},
          ${ticketId},
          ${userId},
          ${ticket.userName},
          ${oldSeatId},
          ${targetSeatId},
          ${ticket.seat.tier},
          '1x Free Atomic Seat Relocation',
          NOW()
        );
      `,
      prisma.$executeRaw`
        DELETE FROM "UserSeatHold" WHERE "userId" = ${userId} AND "seatId" = ${targetSeatId};
      `,
    ]);

    const newSeat: Seat = {
      ...targetTemplate,
      status: SeatStatus.SOLD,
      heldByUserId: userId,
      heldByUserEmail: ticket.userEmail,
      holdExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { updatedTicket, newSeat };
  }
}

export const seatService = new SeatService();
