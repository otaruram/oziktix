import { axiosInstance } from './axiosClient';
import { Ticket } from '../types';

export const TicketApi = {
  /**
   * Fetch authenticated user's real tickets
   * Calls GET /api/v1/tickets/my-ticket
   */
  async getMyTickets(): Promise<Ticket[]> {
    try {
      const response = await axiosInstance.get('/api/v1/tickets/my-ticket');
      const data = response.data?.tickets || response.data?.data || response.data;
      if (Array.isArray(data)) {
        return data.map((t: any) => {
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
            purchasedAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
            eventName: t.eventName || 'Summarecon Mall Bandung Atrium Gala 2026',
            eventDate: t.eventDate || '15 Nov 2026, 19:00 WIB',
            eventVenue: t.eventVenue || 'Main Atrium, Summarecon Mall Bandung (SMB)',
            userMaskedNik: t.userMaskedNik || '3273011508990001',
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
   * Dynamic 30-Second TOTP rotating QR payload
   * Calls GET /api/v1/tickets/:id/qr-payload
   */
  async getRotatingQrPayload(ticketId: string): Promise<{
    ticketId: string;
    seatId: string;
    tier: string;
    attendeeName: string;
    userEmail: string;
    timeWindow: number;
    displayNonce: string;
    signature: string;
    secondsRemaining: number;
    rawPayload: string;
  } | null> {
    try {
      const response = await axiosInstance.get(`/api/v1/tickets/${ticketId}/qr-payload`);
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  /**
   * Atomic seat relocation
   * Calls POST /api/v1/tickets/:id/swap
   */
  async swapSeat(ticketId: string, targetSeatId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axiosInstance.post(`/api/v1/tickets/${ticketId}/swap`, { targetSeatId });
      return { success: true, data: response.data?.data || response.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Seat relocation failed',
      };
    }
  },
};
