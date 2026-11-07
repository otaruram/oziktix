export type SeatTier = 'VIP' | 'REGULAR' | 'FESTIVAL';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type TicketStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'SWAPPED';
export type UserRole = 'VISITOR' | 'ADMIN' | 'GATE_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nik?: string; // 16-digit NIK KTP
  maskedNik: string; // e.g. 3273**********89
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
  reservedUntil?: number | null; // Unix timestamp ms
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
  purchasedAt: number; // ms
  status: TicketStatus;
  hmacSignature: string; // Cryptographic HMAC-SHA256 signature
  swapCount: number; // 0 or 1 (Max 1 free swap)
  swappedFromSeatId?: string;
  checkedInAt?: number | null;
  checkedInBy?: string | null;
}

export interface TotpTokenData {
  nonce: string; // 6-digit dynamic TOTP token
  secondsRemaining: number;
  totalPeriod: number; // 30s
  timestamp: number;
  signaturePayload: string;
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

export interface SystemConfig {
  maxSeatsPerUser: number;
  holdTtlSeconds: number; // default 300 (5 minutes)
  totpPeriodSeconds: number; // default 30
  gateWindowHours: number; // default 2
  isGateWindowActive: boolean; // toggle to simulate pre-gate vs gate open
  maintenanceMode: boolean;
}

