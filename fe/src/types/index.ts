export type SeatTier = 'VIP' | 'REGULAR' | 'FESTIVAL';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type TicketStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'SWAPPED';
export type UserRole = 'VISITOR' | 'ADMIN' | 'GATE_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nik?: string;
  maskedNik: string; // e.g. "3273************02"
  phone: string;
  address?: string;
  role: UserRole;
  kycStatus?: 'PENDING_SUBMISSION' | 'SUBMITTED_TO_ADMIN' | 'VERIFIED' | string;
  isOnboarded?: boolean;
  isGoogleVerified: boolean;
  accessToken?: string;
}

export interface Seat {
  id: string; // e.g. "A1", "C5"
  row: string; // "A" - "F"
  col: number; // 1 - 10
  tier: SeatTier;
  price: number;
  status: SeatStatus;
  reservedByUserId?: string | null;
  reservedUntil?: number | null; // Unix timestamp in ms
  ticketId?: string | null;
  version: number; // Optimistic locking version
}

export interface Ticket {
  id: string;
  seatId: string;
  tier: SeatTier;
  price: number;
  userId: string;
  userName: string;
  userEmail: string;
  userMaskedNik: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  purchasedAt: number;
  status: TicketStatus;
  hmacSignature: string;
  swapCount: number; // 0 or 1
  swappedFromSeatId?: string;
  checkedInAt?: number | null;
  checkedInBy?: string | null;
}

export type ScanVerdict = 'VALID' | 'ALREADY_USED' | 'INVALID';

export interface GateScanResult {
  verdict: ScanVerdict;
  message: string;
  ticket?: Ticket;
  seat?: Seat;
  scannedAt: number;
  totpValid: boolean;
  identityMatch: boolean;
  failureReason?: string;
}

export interface AdminMetrics {
  totalCapacity: number;
  soldSeats: number;
  reservedSeats: number;
  availableSeats: number;
  grossRevenue: number;
  occupancyRate: number;
  checkedInCount: number;
  activeLocksCount: number;
}

export interface SwapLog {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  fromSeatId: string;
  toSeatId: string;
  tier: SeatTier;
  timestamp: number;
  reason: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}
