import { prisma } from '../infrastructure/db/prisma';
import { Ticket, TicketStatus } from '@prisma/client';

let inMemoryTickets: Ticket[] = [];

export class TicketRepository {
  /**
   * Count active tickets owned by user (VALID or CHECKED_IN)
   */
  public async countActiveUserTickets(userId: string): Promise<number> {
    try {
      return await prisma.ticket.count({
        where: {
          userId,
          status: {
            in: [TicketStatus.VALID, TicketStatus.CHECKED_IN],
          },
        },
      });
    } catch {
      return inMemoryTickets.filter(
        (t) => t.userId === userId && (t.status === TicketStatus.VALID || t.status === TicketStatus.CHECKED_IN)
      ).length;
    }
  }

  public async findById(id: string): Promise<Ticket | null> {
    try {
      return await prisma.ticket.findUnique({
        where: { id },
        include: { seat: true },
      });
    } catch {
      return inMemoryTickets.find((t) => t.id === id) || null;
    }
  }

  public async findBySeatId(seatId: string): Promise<Ticket | null> {
    try {
      return await prisma.ticket.findUnique({
        where: { seatId },
        include: { seat: true },
      });
    } catch {
      return inMemoryTickets.find((t) => t.seatId === seatId) || null;
    }
  }

  public async findByUser(userId: string): Promise<Ticket[]> {
    try {
      return await prisma.ticket.findMany({
        where: { userId },
        include: { seat: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return inMemoryTickets.filter((t) => t.userId === userId);
    }
  }

  public async findAll(): Promise<Ticket[]> {
    try {
      return await prisma.ticket.findMany({
        include: { seat: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return inMemoryTickets;
    }
  }

  /**
   * Mint cryptographic ticket
   */
  public async createTicket(data: {
    seatId: string;
    userId: string;
    userEmail: string;
    userName: string;
    userPhone: string;
    secretNonce: string;
  }): Promise<Ticket> {
    try {
      return await prisma.ticket.create({
        data: {
          seatId: data.seatId,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          userPhone: data.userPhone,
          secretNonce: data.secretNonce,
          status: TicketStatus.VALID,
          swapCount: 0,
        },
        include: { seat: true },
      });
    } catch {
      const newTicket: Ticket = {
        id: `OZT-${Date.now().toString(36).toUpperCase()}-${data.seatId}`,
        seatId: data.seatId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userPhone: data.userPhone,
        status: TicketStatus.VALID,
        swapCount: 0,
        secretNonce: data.secretNonce,
        checkedInAt: null,
        checkedInGate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryTickets.push(newTicket);
      return newTicket;
    }
  }

  /**
   * Update ticket on atomic swap
   */
  public async updateForSwap(
    ticketId: string,
    newSeatId: string,
    newSecretNonce: string
  ): Promise<Ticket> {
    try {
      return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          seatId: newSeatId,
          swapCount: { increment: 1 },
          secretNonce: newSecretNonce,
        },
        include: { seat: true },
      });
    } catch {
      const idx = inMemoryTickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        inMemoryTickets[idx] = {
          ...inMemoryTickets[idx],
          seatId: newSeatId,
          swapCount: inMemoryTickets[idx].swapCount + 1,
          secretNonce: newSecretNonce,
          updatedAt: new Date(),
        };
        return inMemoryTickets[idx];
      }
      throw new Error(`Ticket ${ticketId} not found`);
    }
  }

  /**
   * Mark ticket as CHECKED_IN at physical gate
   */
  public async markCheckedIn(ticketId: string, gateName: string): Promise<Ticket> {
    try {
      return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.CHECKED_IN,
          checkedInAt: new Date(),
          checkedInGate: gateName,
        },
        include: { seat: true },
      });
    } catch {
      const idx = inMemoryTickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        inMemoryTickets[idx] = {
          ...inMemoryTickets[idx],
          status: TicketStatus.CHECKED_IN,
          checkedInAt: new Date(),
          checkedInGate: gateName,
          updatedAt: new Date(),
        };
        return inMemoryTickets[idx];
      }
      throw new Error(`Ticket ${ticketId} not found`);
    }
  }

  /**
   * Mark ticket as REFUNDED
   */
  public async markRefunded(ticketId: string): Promise<Ticket> {
    try {
      return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.REFUNDED,
        },
        include: { seat: true },
      });
    } catch {
      const idx = inMemoryTickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        inMemoryTickets[idx] = {
          ...inMemoryTickets[idx],
          status: TicketStatus.REFUNDED,
          updatedAt: new Date(),
        };
        return inMemoryTickets[idx];
      }
      throw new Error(`Ticket ${ticketId} not found`);
    }
  }
}

export const ticketRepository = new TicketRepository();
