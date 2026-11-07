import { Request, Response, NextFunction } from 'express';
import { adminService } from '../../../services/admin.service';
import { BadRequestError } from '../../../domain/errors';

export class AdminController {
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await adminService.getDashboard();
      res.json({ success: true, data: metrics, metrics });
    } catch (e) {
      next(e);
    }
  }

  public async getAttendees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendees = await adminService.getAllAttendees();
      res.json({ success: true, data: attendees, attendees });
    } catch (e) {
      next(e);
    }
  }

  public async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = (Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId) as string;
      if (!ticketId) throw new BadRequestError('ticketId is required for refund.');

      const result = await adminService.refundTicket(ticketId);
      res.json({
        success: true,
        message: `Tiket ${ticketId} berhasil di-refund. Kursi ${result.seatId} dikembalikan menjadi KOSONG di playground pengunjung.`,
        seatId: result.seatId,
      });
    } catch (e) {
      next(e);
    }
  }

  public async exportAttendees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await adminService.exportAttendeesCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="OzikTix_Attendees_${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (e) {
      next(e);
    }
  }

  public async getGateLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await adminService.getRecentGateLogs();
      res.json({ success: true, data: logs, logs });
    } catch (e) {
      next(e);
    }
  }

  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      res.json({ success: true, data: users, users });
    } catch (e) {
      next(e);
    }
  }

  public async verifyUserKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId) as string;
      if (!userId) throw new BadRequestError('userId is required.');
      const user = await adminService.verifyUserKyc(userId);
      res.json({
        success: true,
        message: `Pengajuan identitas ${user.fullName} telah diverifikasi oleh Admin Panitia.`,
        data: user,
      });
    } catch (e) {
      next(e);
    }
  }

  public async getSwapLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await adminService.getSwapLogs();
      res.json({ success: true, data: logs, logs });
    } catch (e) {
      next(e);
    }
  }

  public async getHolds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holds = await adminService.getAllActiveHolds();
      res.json({ success: true, data: holds, holds });
    } catch (e) {
      next(e);
    }
  }
}

export const adminController = new AdminController();
