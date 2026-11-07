export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export type TicketStatus = 'VALID' | 'CHECKED_IN' | 'REFUNDED' | 'SWAPPED_VOID';

export type ScanResult = 'VALID' | 'ALREADY_USED' | 'INVALID';

export interface AuthenticatedUser {
  id: string; // Supabase UUID
  email: string;
  name: string;
  nik?: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  role: 'VISITOR' | 'ADMIN' | 'GATE_OFFICER';
  kycStatus?: string;
  isOnboarded?: boolean;
}

export interface GateScanPayload {
  ticketId: string;
  timeWindow: number;
  signature: string;
  rawPayload?: string;
}

export interface GateVerificationResponse {
  verdict: ScanResult;
  message: string;
  ticketId?: string;
  seatId?: string;
  attendeeName?: string;
  checkedInAt?: Date | null;
  scannedAt: Date;
  failureReason?: string;
}

export interface DashboardMetrics {
  totalCapacity: number;
  availableCount: number;
  reservedCount: number;
  soldCount: number;
  grossRevenue: number;
  checkedInCount: number;
  activeLocksCount: number;
}

