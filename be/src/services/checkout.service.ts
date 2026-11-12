import { prisma } from '../infrastructure/db/prisma';
import { AuthenticatedUser } from '../domain/types';
import { NotFoundError, BadRequestError, ConflictError } from '../domain/errors';
import { StatefulEngine } from '../infrastructure/crypto/statefulEngine';
import { Ticket, TicketStatus } from '@prisma/client';
import { seatService } from './seat.service';
import { ticketRepository } from '../repositories/ticket.repository';
import { pricingService } from './pricing.service';
import {
  CategoryCode,
  MAX_SEATS_PER_ORDER,
  PriceQuote,
  computeQuote,
  getPackage,
  packageForSeatCount,
} from '../domain/pricing';

export class CheckoutService {
  public async getUserTickets(userId: string): Promise<Ticket[]> {
    return ticketRepository.findByUser(userId);
  }

  /**
   * Konfirmasi order paket (Single / Couple / Group) — harga dihitung ulang di server.
   * Aturan: jumlah kursi == ukuran paket, semua kursi dalam 1 kategori, maks 3 kursi.
   */
  public async confirmOrder(
    seatIds: string[],
    attendeePhone: string,
    user: AuthenticatedUser,
    requestedPackage?: string
  ): Promise<{ tickets: Ticket[]; quote: PriceQuote; orderId: string }> {
    const uniqueSeatIds = Array.from(new Set(seatIds));
    if (uniqueSeatIds.length === 0) {
      throw new BadRequestError('Pilih minimal 1 kursi.');
    }
    if (uniqueSeatIds.length > MAX_SEATS_PER_ORDER) {
      throw new BadRequestError(`Maksimal ${MAX_SEATS_PER_ORDER} kursi per transaksi (paket Group).`);
    }

    const templates = await Promise.all(uniqueSeatIds.map((id) => seatService.findTemplateById(id)));
    const missing = uniqueSeatIds.filter((_, i) => !templates[i]);
    if (missing.length > 0) {
      throw new NotFoundError(`Kursi ${missing.join(', ')} tidak ditemukan.`);
    }

    const tiers = new Set(templates.map((t) => t!.tier));
    if (tiers.size > 1) {
      throw new BadRequestError('Semua kursi dalam satu paket harus berada di kategori yang sama.');
    }
    const category = templates[0]!.tier as CategoryCode;

    const config = await pricingService.getConfig();
    const pkg = requestedPackage
      ? getPackage(config, requestedPackage.toUpperCase())
      : packageForSeatCount(config, uniqueSeatIds.length);
    if (!pkg || !pkg.enabled) {
      throw new BadRequestError(`Paket ${requestedPackage || `${uniqueSeatIds.length} kursi`} tidak tersedia.`);
    }
    if (pkg.seats !== uniqueSeatIds.length) {
      throw new BadRequestError(
        `Paket ${pkg.name} membutuhkan tepat ${pkg.seats} kursi, Anda memilih ${uniqueSeatIds.length}.`
      );
    }

    const quote = computeQuote(config, category, pkg.code);
    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    // All-or-nothing pre-check: never issue a partial package if one seat is already owned
    const alreadyOwned = await prisma.$queryRaw<any[]>`
      SELECT "seatId" FROM "Ticket"
      WHERE "userId" = ${user.id}
        AND "seatId" = ANY(${uniqueSeatIds})
        AND "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus");
    `;
    if (alreadyOwned.length > 0) {
      throw new ConflictError(
        `Kursi ${alreadyOwned.map((r) => r.seatId).join(', ')} sudah dibeli. Pilih kursi lain.`
      );
    }

    // Distribute ticketTotal across seats so SUM(pricePaid) == ticketTotal exactly (no rounding drift)
    const n = uniqueSeatIds.length;
    const baseShare = Math.floor(quote.ticketTotal / n);
    const remainder = quote.ticketTotal - baseShare * n;

    try {
      await pricingService.ensureSchema();
    } catch {
      // Non-fatal: ticket still issued, pricing metadata just won't persist
    }

    const tickets: Ticket[] = [];
    for (let i = 0; i < n; i++) {
      const ticket = await this.confirmCheckout(uniqueSeatIds[i], attendeePhone, user);
      const pricePaid = baseShare + (i === 0 ? remainder : 0);
      try {
        await prisma.$executeRaw`
          UPDATE "Ticket"
          SET "pricePaid" = ${pricePaid}, "packageType" = ${pkg.code}, "orderId" = ${orderId}
          WHERE "id" = ${ticket.id};
        `;
      } catch {
        // Column may be unavailable on a cold DB; revenue falls back to seat base price
      }
      tickets.push({ ...ticket, pricePaid, packageType: pkg.code, orderId } as Ticket);
    }

    return { tickets, quote, orderId };
  }

  /**
   * Fast Confirm Payment & Issue Cryptographic Ticket (<150ms, no interactive $transaction bottleneck)
   * Isolated per user's playground while immediately visible in Admin Panitia Console!
   */
  public async confirmCheckout(
    seatId: string,
    attendeePhone: string,
    user: AuthenticatedUser
  ): Promise<Ticket> {
    const template = await seatService.findTemplateById(seatId);
    if (!template) {
      throw new NotFoundError(`Kursi ${seatId} tidak ditemukan.`);
    }

    // Check if THIS user already bought this exact seat in their playground
    const existing = await prisma.$queryRaw<any[]>`
      SELECT "id" FROM "Ticket"
      WHERE "userId" = ${user.id}
        AND "seatId" = ${seatId}
        AND "status" IN ('VALID'::"TicketStatus", 'CHECKED_IN'::"TicketStatus")
      LIMIT 1;
    `;
    if (existing.length > 0) {
      throw new ConflictError(`Kursi ${seatId} sudah penuh / telah dibeli di playground Anda.`);
    }

    const secretNonce = StatefulEngine.generateSecretNonce();

    // Create ticket and clear user's hold in parallel
    const [ticket] = await Promise.all([
      prisma.ticket.create({
        data: {
          seatId,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          userPhone: attendeePhone || user.phone || '+62 812-0000-0000',
          status: TicketStatus.VALID,
          swapCount: 0,
          secretNonce,
        },
        include: { seat: true },
      }),
      prisma.$executeRaw`
        DELETE FROM "UserSeatHold"
        WHERE "userId" = ${user.id} AND "seatId" = ${seatId};
      `,
    ]);

    return ticket;
  }

  /**
   * 30-Second Dynamic Rotating TOTP Payload (GET /api/v1/tickets/:id/qr-payload)
   */
  public async getRotatingQrPayload(ticketId: string, user: AuthenticatedUser) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { seat: true },
    });

    if (!ticket) {
      throw new NotFoundError(`Ticket ${ticketId} not found.`);
    }

    const timeWindow = StatefulEngine.getCurrentTimeWindow();
    const payloadString = StatefulEngine.constructPayloadString({
      ticketId: ticket.id,
      seatId: ticket.seatId,
      userId: ticket.userId,
      timeWindow,
      secretNonce: ticket.secretNonce,
    });

    const signature = StatefulEngine.computeHmac(payloadString);
    const displayNonce = StatefulEngine.computeTotpDisplayNonce(ticket.id, timeWindow);
    const secondsRemaining = StatefulEngine.getSecondsRemaining();

    return {
      ticketId: ticket.id,
      seatId: ticket.seatId,
      tier: ticket.seat?.tier || 'VIP',
      attendeeName: ticket.userName,
      userEmail: ticket.userEmail,
      timeWindow,
      displayNonce,
      signature,
      secondsRemaining,
      rawPayload: JSON.stringify({
        app: 'OZIKTIX',
        tid: ticket.id,
        seat: ticket.seatId,
        uid: ticket.userId,
        tw: timeWindow,
        totp: displayNonce,
        sig: signature,
        v: '2026.1',
      }),
    };
  }
}

export const checkoutService = new CheckoutService();
