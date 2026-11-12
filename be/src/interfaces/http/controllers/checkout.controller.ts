import { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../../../services/checkout.service';
import { BadRequestError } from '../../../domain/errors';

export class CheckoutController {
  public async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatId, seatIds, attendeePhone, packageType } = req.body;
      const targets: string[] = Array.isArray(seatIds) && seatIds.length > 0
        ? seatIds
        : seatId
        ? [seatId]
        : [];

      if (targets.length === 0) {
        throw new BadRequestError('seatId or seatIds is required for checkout confirmation.');
      }
      if (!req.user) {
        throw new BadRequestError('Unauthenticated user.');
      }

      const { tickets: issuedTickets, quote, orderId } = await checkoutService.confirmOrder(
        targets,
        attendeePhone,
        req.user,
        typeof packageType === 'string' ? packageType : undefined
      );

      res.status(201).json({
        success: true,
        message: `${issuedTickets.length} payment(s) confirmed & cryptographic pass(es) minted successfully.`,
        data: issuedTickets[0],
        ticket: issuedTickets[0],
        tickets: issuedTickets,
        quote,
        orderId,
      });
    } catch (e) {
      next(e);
    }
  }

  public async getRotatingQrPayload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      if (!ticketId) throw new BadRequestError('ticketId is required.');
      if (!req.user) throw new BadRequestError('Unauthenticated user.');

      const payload = await checkoutService.getRotatingQrPayload(ticketId, req.user);
      res.json({
        success: true,
        data: payload,
      });
    } catch (e) {
      next(e);
    }
  }

  public async getMyTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('Unauthenticated user.');
      const tickets = await checkoutService.getUserTickets(req.user.id);
      res.json({
        success: true,
        data: tickets,
        tickets,
      });
    } catch (e) {
      next(e);
    }
  }
}

export const checkoutController = new CheckoutController();

