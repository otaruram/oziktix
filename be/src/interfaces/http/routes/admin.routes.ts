import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const adminRouter = Router();

// Dashboard metrics (supports both /dashboard and /metrics paths)
adminRouter.get('/dashboard', authMiddleware, adminController.getDashboard);
adminRouter.get('/metrics', authMiddleware, adminController.getDashboard);
adminRouter.get('/attendees', authMiddleware, adminController.getAttendees);
adminRouter.get('/holds', authMiddleware, adminController.getHolds);

// 1-Click Refund
adminRouter.post('/refund/:ticketId', authMiddleware, adminController.refund);

// CSV Export (supports both /export and /export-attendees paths)
adminRouter.get('/export', authMiddleware, adminController.exportAttendees);
adminRouter.get('/export-attendees', authMiddleware, adminController.exportAttendees);

// Logs & KYC Users
adminRouter.get('/logs', authMiddleware, adminController.getGateLogs);
adminRouter.get('/swap-logs', authMiddleware, adminController.getSwapLogs);
adminRouter.get('/users', authMiddleware, adminController.getUsers);
adminRouter.post('/users/:userId/verify', authMiddleware, adminController.verifyUserKyc);
