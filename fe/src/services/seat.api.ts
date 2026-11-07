import { axiosInstance } from './axiosClient';
import { Seat, ApiResponse } from '../types';
import { apiClient } from './apiClient';

export const SeatApi = {
  /**
   * Fetch all 60 seats for the Summarecon Mall Bandung Atrium
   * Calls GET /api/v1/seats
   */
  async getSeats(scope?: string): Promise<Seat[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Seat[]> | Seat[]>('/api/v1/seats', {
        params: scope ? { scope } : undefined,
      });
      let rawList: any[] = [];
      if (Array.isArray(response.data)) {
        rawList = response.data;
      } else if (response.data && (response.data as any).data && Array.isArray((response.data as any).data)) {
        rawList = (response.data as any).data;
      }

      if (rawList.length > 0) {
        return rawList.map((s: any) => {
          // Normalize row coordinate
          const row = s.row || s.rowLabel || (s.id.match(/[A-F]/) ? s.id.match(/[A-F]/)[0] : 'A');
          // Normalize col coordinate
          const numMatch = s.id.match(/\d+/);
          const col = s.col ?? s.seatNumber ?? (numMatch ? parseInt(numMatch[0], 10) : 1);

          return {
            id: s.id,
            row,
            col,
            tier: s.tier,
            price: s.price,
            status: s.status,
            reservedByUserId: s.reservedByUserId || s.heldByUserId || null,
            reservedUntil: s.holdExpiresAt ? new Date(s.holdExpiresAt).getTime() : s.reservedUntil || null,
            ticketId: s.ticketId || null,
            version: s.version || 1,
          };
        });
      }
      return await apiClient.getSeats();
    } catch {
      // Graceful fallback to client persistence
      return await apiClient.getSeats();
    }
  },

  /**
   * Fetch live summary counts from backend
   * Calls GET /api/v1/seats/summary
   */
  async getSummary(): Promise<{ total: number; available: number; sold: number; held: number }> {
    try {
      const response = await axiosInstance.get('/api/v1/seats/summary');
      const data = response.data?.summary || response.data?.data || response.data;
      if (data && typeof data.total === 'number') {
        return data;
      }
      // Compute from live seats
      const seats = await SeatApi.getSeats();
      const total = seats.length;
      const sold = seats.filter((s) => s.status === 'SOLD').length;
      const held = seats.filter((s) => s.status === 'RESERVED').length;
      const available = seats.filter((s) => s.status === 'AVAILABLE').length;
      return { total, available, sold, held };
    } catch {
      const seats = await SeatApi.getSeats();
      const total = seats.length;
      const sold = seats.filter((s) => s.status === 'SOLD').length;
      const held = seats.filter((s) => s.status === 'RESERVED').length;
      const available = seats.filter((s) => s.status === 'AVAILABLE').length;
      return { total, available, sold, held };
    }
  },

  /**
   * Hold a seat with optimistic concurrency lock
   * Calls POST /api/v1/seats/:id/hold
   */
  async holdSeat(
    seatId: string,
    version: number,
    userId: string
  ): Promise<{ success: boolean; seat?: Seat; error?: string; status?: number }> {
    try {
      const response = await axiosInstance.post(`/api/v1/seats/${seatId}/hold`, {
        version,
        userId,
      });
      return { success: true, seat: response.data.seat || response.data.data };
    } catch (err: any) {
      if (err.response?.status === 429) {
        return {
          success: false,
          error:
            err.response.data?.message ||
            'Purchase limit reached: Maximum 2 seats per verified Google account.',
          status: 429,
        };
      }
      if (err.response?.status === 409) {
        return {
          success: false,
          error: err.response.data?.message || 'HTTP 409: Seat locked by another user.',
          status: 409,
        };
      }
      // Demo fallback lock
      const res = await apiClient.reserveSeat(seatId, userId, version);
      return {
        success: res.success,
        seat: res.seat,
        error: res.error,
        status: res.code || (res.success ? 200 : 409),
      };
    }
  },

  /**
   * Release hold on a seat
   * Calls POST /api/v1/seats/:id/release
   */
  async releaseSeat(seatId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await axiosInstance.post(`/api/v1/seats/${seatId}/release`, { userId });
      return { success: true };
    } catch {
      return await apiClient.releaseSeat(seatId, userId);
    }
  },

  async releaseAllSeats(): Promise<{ success: boolean }> {
    try {
      await axiosInstance.post('/api/v1/seats/release-all');
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};
