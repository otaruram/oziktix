import { Router } from 'express';
import { seatController } from '../controllers/seat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const seatRouter = Router();

seatRouter.get('/summary', seatController.getSummary);
seatRouter.get('/', seatController.getSeats);
seatRouter.post('/release-all', authMiddleware, seatController.releaseAllSeats);
seatRouter.post('/:id/hold', authMiddleware, seatController.holdSeat);
seatRouter.post('/:id/release', authMiddleware, seatController.releaseSeat);
