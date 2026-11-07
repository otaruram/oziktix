import { axiosInstance } from './axiosClient';
import { Ticket, SwapLog, AdminMetrics } from '../types';

export const AdminApi = {
  /**
   * Fetch live KPI metrics
   * Calls GET /api/v1/admin/metrics or /api/v1/admin/dashboard
   */
  async getMetrics(): Promise<AdminMetrics> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/dashboard');
      const data = response.data.metrics || response.data?.data || response.data;
      const soldSeats = data.soldCount ?? data.soldSeats ?? 0;
      const reservedSeats = data.reservedCount ?? data.reservedSeats ?? 0;
      const availableSeats = data.availableCount ?? data.availableSeats ?? 60;
      const occupancyRate = Number(((soldSeats / (data.totalCapacity || 60)) * 100).toFixed(1));

      return {
        totalCapacity: data.totalCapacity || 60,
        soldSeats,
        reservedSeats,
        availableSeats,
        grossRevenue: data.grossRevenue || 0,
        occupancyRate: data.occupancyRate ?? occupancyRate,
        checkedInCount: data.checkedInCount || 0,
        activeLocksCount: data.activeLocksCount ?? reservedSeats,
      };
    } catch {
      return {
        totalCapacity: 60,
        soldSeats: 0,
        reservedSeats: 0,
        availableSeats: 60,
        grossRevenue: 0,
        occupancyRate: 0,
        checkedInCount: 0,
        activeLocksCount: 0,
      };
    }
  },

  /**
   * Fetch all attendee tickets
   * Calls GET /api/v1/admin/attendees or /api/v1/admin/dashboard
   */
  async getAttendees(): Promise<Ticket[]> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/attendees');
      const attendees = response.data.attendees || response.data?.data || response.data;
      if (Array.isArray(attendees)) {
        return attendees.map((t: any) => {
          const rawStatus = t.status;
          const mappedStatus =
            rawStatus === 'VALID' || rawStatus === 'ACTIVE'
              ? 'ACTIVE'
              : rawStatus === 'CHECKED_IN' || rawStatus === 'USED'
              ? 'USED'
              : rawStatus === 'REFUNDED' || rawStatus === 'REVOKED'
              ? 'REVOKED'
              : 'ACTIVE';
          return {
            ...t,
            tier: t.tier || t.seat?.tier || 'VIP',
            price: t.price ?? t.seat?.price ?? 250000,
            status: mappedStatus,
            purchasedAt: t.createdAt ? new Date(t.createdAt).getTime() : (t.purchasedAt || Date.now()),
            eventName: t.eventName || 'Summarecon Mall Bandung Atrium Gala 2026',
            eventDate: t.eventDate || '15 Nov 2026, 19:00 WIB',
            eventVenue: t.eventVenue || 'Main Atrium, Summarecon Mall Bandung (SMB)',
            userMaskedNik: t.userMaskedNik || (t.userPhone ? `NIK-${t.userPhone.slice(-4)}` : '3273011508990001'),
            hmacSignature: t.hmacSignature || t.secretNonce || 'SIG_INITIALIZED',
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * 1-Click Refund
   * Calls POST /api/v1/admin/refund/:ticketId
   */
  async refundTicket(ticketId: string): Promise<{ success: boolean; seatId?: string; error?: string }> {
    try {
      const response = await axiosInstance.post(`/api/v1/admin/refund/${ticketId}`);
      return { success: true, seatId: response.data.seatId || response.data.data?.seatId };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Refund failed',
      };
    }
  },

  /**
   * Download CSV Export
   * Calls GET /api/v1/admin/export
   */
  async downloadExportCsv(): Promise<Blob> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/export', {
        responseType: 'blob',
      });
      return response.data;
    } catch (err) {
      // Direct fallback CSV download with UTF-8 BOM
      const response = await axiosInstance.get('/api/v1/admin/attendees');
      const tickets: Ticket[] = response.data?.attendees || [];
      const headers = [
        'Ticket ID',
        'Seat Coordinate',
        'Tier',
        'Price (IDR)',
        'Attendee Name',
        'Google Email',
        'Status',
        'Purchased At',
        'HMAC Signature',
      ];

      const rows = tickets.map((t) => [
        `"${t.id}"`,
        `"${t.seatId}"`,
        `"${t.tier || 'VIP'}"`,
        t.price || 250000,
        `"${t.userName}"`,
        `"${t.userEmail}"`,
        `"${t.status}"`,
        `"${new Date(t.purchasedAt).toLocaleString('id-ID')}"`,
        `"${t.hmacSignature}"`,
      ]);

      const csvString = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    }
  },

  /**
   * Relocate seat (1x Free Swap)
   * Calls POST /api/v1/tickets/:id/swap
   */
  async swapTicketSeat(
    ticketId: string,
    newSeatId: string,
    userId: string
  ): Promise<{ success: boolean; updatedTicket?: Ticket; error?: string }> {
    try {
      const response = await axiosInstance.post(`/api/v1/tickets/${ticketId}/swap`, {
        targetSeatId: newSeatId,
        newSeatId,
        userId,
      });
      return { success: true, updatedTicket: response.data.ticket || response.data.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Relocation failed',
      };
    }
  },

  /**
   * Get Swap Audit Logs
   */
  async getSwapLogs(): Promise<SwapLog[]> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/swap-logs');
      const data = response.data?.data || response.data?.logs || [];
      if (Array.isArray(data)) {
        return data.map((l: any) => ({
          id: l.id,
          ticketId: l.ticketId,
          userId: l.userId,
          userName: l.userName,
          fromSeatId: l.fromSeatId,
          toSeatId: l.toSeatId,
          tier: l.tier || 'VIP',
          timestamp: l.createdAt ? new Date(l.createdAt).getTime() : Date.now(),
          reason: l.reason || '1x Free Atomic Seat Relocation',
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch all registered users & KYC submissions
   */
  async getUsers(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/users');
      return response.data?.users || response.data?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Approve / Verify User KYC submission
   */
  async verifyUserKyc(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axiosInstance.post(`/api/v1/admin/users/${userId}/verify`);
      return { success: true, message: response.data?.message };
    } catch {
      return { success: false };
    }
  },

  /**
   * Fetch recent Gate Scanner audit logs
   */
  async getGateLogs(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/logs');
      return response.data?.logs || response.data?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch all active seat holds across all users' playgrounds
   */
  async getHolds(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/api/v1/admin/holds');
      return response.data?.holds || response.data?.data || [];
    } catch {
      return [];
    }
  },
};
