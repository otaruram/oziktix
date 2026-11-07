import { axiosInstance } from './axiosClient';
import { GateScanResult } from '../types';

export interface UniversalGateTicket {
  id: string;
  seatId: string;
  tier: string;
  price: number;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userNik: string;
  userAvatarUrl: string;
  userAddress: string;
  kycStatus: string;
  status: 'VALID' | 'CHECKED_IN' | 'REFUNDED' | 'SWAPPED_VOID';
  swapCount: number;
  secretNonce: string;
  digitalSignature: string;
  totpNonce: string;
  timeWindow: number;
  purchasedAt: number;
  checkedInAt: number | null;
  checkedInGate: string | null;
  rawQrPayload: string;
}

export const GateApi = {
  /**
   * Universal search across ALL users' tickets by Identity (Name, Email, NIK, Phone, Seat) or Digital Signature (HMAC / Ticket ID)
   */
  async searchUniversalTickets(query: string = ''): Promise<UniversalGateTicket[]> {
    try {
      const response = await axiosInstance.get('/api/v1/gate/tickets', {
        params: { q: query },
      });
      return response.data?.tickets || response.data?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Validate physical barrier scan payload or direct identity/signature scan
   */
  async scanTicket(
    payload: string,
    currentTimestamp: number = Date.now(),
    extra?: {
      ticketId?: string;
      signature?: string;
      timeWindow?: number;
      directIdentityVerify?: boolean;
      simulateScenario?: 'VALID_GREEN' | 'ANTI_PASSBACK_YELLOW' | 'INVALID_RED';
    }
  ): Promise<GateScanResult> {
    try {
      const response = await axiosInstance.post<GateScanResult>('/api/v1/gate/scan', {
        payload,
        rawPayload: payload,
        timestamp: currentTimestamp,
        ...extra,
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data as GateScanResult;
      }
      return {
        verdict: 'INVALID',
        message: 'Gate Barrier Offline or Network Error',
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: err.message || 'Connection failure',
      };
    }
  },
};
