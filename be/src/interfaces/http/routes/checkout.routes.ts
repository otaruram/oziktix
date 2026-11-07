import { Router } from 'express';
import { checkoutController } from '../controllers/checkout.controller';
import { seatController } from '../controllers/seat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const checkoutRouter = Router();

checkoutRouter.post('/confirm', authMiddleware, checkoutController.confirm);

// Also attach ticket routes (/api/v1/tickets) here or in app.ts
export const ticketRouter = Router();
ticketRouter.get('/my-ticket', authMiddleware, checkoutController.getMyTickets);
ticketRouter.get('/my-tickets', authMiddleware, checkoutController.getMyTickets);
ticketRouter.get('/:id/qr-payload', authMiddleware, checkoutController.getRotatingQrPayload);
ticketRouter.post('/:id/swap', authMiddleware, seatController.swapSeat);

