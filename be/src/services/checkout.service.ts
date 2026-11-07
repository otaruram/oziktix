import { prisma } from '../infrastructure/db/prisma';
import { AuthenticatedUser } from '../domain/types';
import { NotFoundError, BadRequestError, ConflictError } from '../domain/errors';
import { StatefulEngine } from '../infrastructure/crypto/statefulEngine';
import { Ticket, TicketStatus } from '@prisma/client';
import { seatService } from './seat.service';
import { ticketRepository } from '../repositories/ticket.repository';

export class CheckoutService {
  public async getUserTickets(userId: string): Promise<Ticket[]> {
    return ticketRepository.findByUser(userId);
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
