import { prisma } from '../infrastructure/db/prisma';
import { Seat, SeatStatus } from '@prisma/client';

// 60 Physical Venue Seats for Summarecon Mall Bandung Atrium
export function getInitial60VenueSeats(): Seat[] {
  const seats: Seat[] = [];
  const rows = [
    { row: 'A', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'B', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'C', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'D', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'E', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'F', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
  ];

  for (const r of rows) {
    for (let col = 1; col <= 10; col++) {
      const paddedCol = col.toString().padStart(2, '0');
      const id = `${r.prefix}-${r.row}${paddedCol}`;

      let status: SeatStatus = SeatStatus.AVAILABLE;
      let heldByUserId: string | null = null;
      let holdExpiresAt: Date | null = null;

      if (id === 'VIP-A03' || id === 'VIP-B05' || id === 'REG-C02' || id === 'REG-D08' || id === 'FEST-F04') {
        status = SeatStatus.SOLD;
      } else if (id === 'VIP-B07' || id === 'REG-D03') {
        status = SeatStatus.RESERVED;
        heldByUserId = 'usr_competing_buyer';
        holdExpiresAt = new Date(Date.now() + 180 * 1000);
      }

      seats.push({
        id,
        rowLabel: r.row,
        seatNumber: col,
        tier: r.tier,
        price: r.price,
        status,
        heldByUserId,
        heldByUserEmail: null,
        holdExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return seats;
}

let inMemorySeats: Seat[] = getInitial60VenueSeats();

export class SeatRepository {
  /**
   * Fetch all 60 physical seats
   */
  public async findAll(): Promise<Seat[]> {
    try {
      const seats = await prisma.seat.findMany({
        orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
      });
      if (seats.length > 0) return seats;
      return inMemorySeats;
    } catch {
      return inMemorySeats;
    }
  }

  public async findById(id: string): Promise<Seat | null> {
    try {
      return await prisma.seat.findUnique({ where: { id } });
    } catch {
      return inMemorySeats.find((s) => s.id === id) || null;
    }
  }

  /**
   * Count active holds for user (status = RESERVED and holdExpiresAt > NOW())
   */
  public async countActiveUserHolds(userId: string): Promise<number> {
    try {
      return await prisma.seat.count({
        where: {
          heldByUserId: userId,
          status: SeatStatus.RESERVED,
          holdExpiresAt: {
            gt: new Date(),
          },
        },
      });
    } catch {
      const now = new Date();
      return inMemorySeats.filter(
        (s) => s.heldByUserId === userId && s.status === SeatStatus.RESERVED && s.holdExpiresAt && s.holdExpiresAt > now
      ).length;
    }
  }

  /**
   * Atomic conditional SQL update to hold a seat (also refreshes hold if already held by the same user)
   */
  public async atomicHoldSeat(
    seatId: string,
    userId: string,
    userEmail: string
  ): Promise<Seat | null> {
    try {
      const rawResult: Seat[] = await prisma.$queryRaw`
        UPDATE "Seat"
        SET "status" = 'RESERVED'::"SeatStatus",
            "heldByUserId" = ${userId},
            "heldByUserEmail" = ${userEmail},
            "holdExpiresAt" = NOW() + INTERVAL '5 minutes',
            "updatedAt" = NOW()
        WHERE "id" = ${seatId}
          AND (
            "status" = 'AVAILABLE'::"SeatStatus"
            OR ("status" = 'RESERVED'::"SeatStatus" AND "holdExpiresAt" < NOW())
            OR ("status" = 'RESERVED'::"SeatStatus" AND "heldByUserId" = ${userId})
          )
        RETURNING *;
      `;

      if (rawResult.length > 0) return rawResult[0];
      return null;
    } catch {
      const idx = inMemorySeats.findIndex((s) => s.id === seatId);
      if (idx === -1) return null;
      const s = inMemorySeats[idx];
      const now = new Date();

      if (s.status === SeatStatus.SOLD) return null;
      if (s.status === SeatStatus.RESERVED && s.holdExpiresAt && s.holdExpiresAt > now && s.heldByUserId !== userId) {
        return null;
      }

      const updated: Seat = {
        ...s,
        status: SeatStatus.RESERVED,
        heldByUserId: userId,
        heldByUserEmail: userEmail,
        holdExpiresAt: new Date(Date.now() + 300 * 1000),
        updatedAt: new Date(),
      };
      inMemorySeats[idx] = updated;
      return updated;
    }
  }

  /**
   * Release all active holds for a user
   */
  public async releaseAllUserHolds(userId: string): Promise<void> {
    try {
      await prisma.seat.updateMany({
        where: {
          heldByUserId: userId,
          status: SeatStatus.RESERVED,
        },
        data: {
          status: SeatStatus.AVAILABLE,
          heldByUserId: null,
          heldByUserEmail: null,
          holdExpiresAt: null,
        },
      });
    } catch {
      inMemorySeats = inMemorySeats.map((s) =>
        s.heldByUserId === userId && s.status === SeatStatus.RESERVED
          ? {
              ...s,
              status: SeatStatus.AVAILABLE,
              heldByUserId: null,
              heldByUserEmail: null,
              holdExpiresAt: null,
              updatedAt: new Date(),
            }
          : s
      );
    }
  }

  /**
   * Release hold
   */
  public async releaseHold(seatId: string, userId: string): Promise<void> {
    try {
      await prisma.seat.updateMany({
        where: {
          id: seatId,
          heldByUserId: userId,
          status: SeatStatus.RESERVED,
        },
        data: {
          status: SeatStatus.AVAILABLE,
          heldByUserId: null,
          heldByUserEmail: null,
          holdExpiresAt: null,
        },
      });
    } catch {
      const idx = inMemorySeats.findIndex((s) => s.id === seatId);
      if (idx !== -1 && inMemorySeats[idx].heldByUserId === userId) {
        inMemorySeats[idx] = {
          ...inMemorySeats[idx],
          status: SeatStatus.AVAILABLE,
          heldByUserId: null,
          heldByUserEmail: null,
          holdExpiresAt: null,
          updatedAt: new Date(),
        };
      }
    }
  }

  /**
   * Atomic lock on target seat for atomic relocation / swap
   */
  public async atomicClaimForSwap(targetSeatId: string, userId: string): Promise<Seat | null> {
    try {
      const rawResult: Seat[] = await prisma.$queryRaw`
        UPDATE "Seat"
        SET "status" = 'SOLD'::"SeatStatus",
            "heldByUserId" = ${userId},
            "updatedAt" = NOW()
        WHERE "id" = ${targetSeatId}
          AND "status" = 'AVAILABLE'::"SeatStatus"
        RETURNING *;
      `;

      if (rawResult.length > 0) return rawResult[0];
      return null;
    } catch {
      const idx = inMemorySeats.findIndex((s) => s.id === targetSeatId);
      if (idx === -1 || inMemorySeats[idx].status !== SeatStatus.AVAILABLE) return null;

      const updated: Seat = {
        ...inMemorySeats[idx],
        status: SeatStatus.SOLD,
        heldByUserId: userId,
        updatedAt: new Date(),
      };
      inMemorySeats[idx] = updated;
      return updated;
    }
  }

  /**
   * Release old seat back to AVAILABLE
   */
  public async releaseOldSeat(oldSeatId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE "Seat"
        SET "status" = 'AVAILABLE'::"SeatStatus",
            "heldByUserId" = NULL,
            "holdExpiresAt" = NULL,
            "updatedAt" = NOW()
        WHERE "id" = ${oldSeatId};
      `;
    } catch {
      const idx = inMemorySeats.findIndex((s) => s.id === oldSeatId);
      if (idx !== -1) {
        inMemorySeats[idx] = {
          ...inMemorySeats[idx],
          status: SeatStatus.AVAILABLE,
          heldByUserId: null,
          heldByUserEmail: null,
          holdExpiresAt: null,
          updatedAt: new Date(),
        };
      }
    }
  }

  /**
   * Mark seat SOLD upon checkout confirmation
   */
  public async markSeatSold(seatId: string, userId: string): Promise<Seat> {
    try {
      return await prisma.seat.update({
        where: { id: seatId },
        data: {
          status: SeatStatus.SOLD,
          heldByUserId: userId,
          holdExpiresAt: null,
        },
      });
    } catch {
      const idx = inMemorySeats.findIndex((s) => s.id === seatId);
      if (idx !== -1) {
        inMemorySeats[idx] = {
          ...inMemorySeats[idx],
          status: SeatStatus.SOLD,
          heldByUserId: userId,
          holdExpiresAt: null,
          updatedAt: new Date(),
        };
        return inMemorySeats[idx];
      }
      throw new Error(`Seat ${seatId} not found`);
    }
  }
}

export const seatRepository = new SeatRepository();
