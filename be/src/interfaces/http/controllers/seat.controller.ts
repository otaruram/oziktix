import { Request, Response, NextFunction } from 'express';
import { seatService } from '../../../services/seat.service';
import { BadRequestError } from '../../../domain/errors';
import { verifySupabaseToken } from '../../../infrastructure/auth/supabaseAuth';

export class SeatController {
  public async getSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let user = req.user;
      if (!user && req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        user = (await verifySupabaseToken(token)) || undefined;
      }
      const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
      const seats = await seatService.getSeatsForUser(user, scope);
      res.json({ success: true, data: seats });
    } catch (e) {
      next(e);
    }
  }

  public async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let user = req.user;
      if (!user && req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        user = (await verifySupabaseToken(token)) || undefined;
      }
      const summary = await seatService.getSummary(user);
      res.json({ success: true, data: summary, summary });
    } catch (e) {
      next(e);
    }
  }

  public async holdSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      if (!id) throw new BadRequestError('Seat ID is required.');
      if (!req.user) throw new BadRequestError('Unauthenticated user.');

      const isSimulatedOther =
        req.body?.userId === 'usr_competing_buyer' || Boolean(req.body?.isSimulatedOther);

      const heldSeat = await seatService.holdSeat(id, req.user, isSimulatedOther);
      res.status(200).json({
        success: true,
        message: `Seat ${id} successfully locked for 5:00 minutes.`,
        data: heldSeat,
        seat: heldSeat,
      });
    } catch (e) {
      next(e);
    }
  }

  public async releaseSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      if (!id) throw new BadRequestError('Seat ID is required.');
      if (!req.user) throw new BadRequestError('Unauthenticated user.');

      await seatService.releaseSeat(id, req.user.id);
      res.json({ success: true, message: `Seat ${id} released.` });
    } catch (e) {
      next(e);
    }
  }

  public async releaseAllSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('Unauthenticated user.');
      await seatService.releaseAllSeats(req.user.id);
      res.json({ success: true, message: 'All active seat holds for user released.' });
    } catch (e) {
      next(e);
    }
  }

  public async swapSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const { targetSeatId } = req.body;

      if (!ticketId || !targetSeatId) {
        throw new BadRequestError('ticketId and targetSeatId are required.');
      }
      if (!req.user) throw new BadRequestError('Unauthenticated user.');

      const result = await seatService.swapSeat(ticketId, targetSeatId, req.user.id);
      res.json({
        success: true,
        message: `Seat successfully relocated to ${targetSeatId}. Previous QR hash revoked.`,
        data: result.updatedTicket,
        ticket: result.updatedTicket,
        newSeat: result.newSeat,
      });
    } catch (e) {
      next(e);
    }
  }
}

export const seatController = new SeatController();
