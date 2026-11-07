import { Router } from 'express';
import { gateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const gateRouter = Router();

gateRouter.get('/tickets', authMiddleware, gateController.searchTickets);
gateRouter.post('/scan', gateController.scan);
