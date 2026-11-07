import { Seat, Ticket, User, SwapLog, GateScanResult, SystemConfig, SeatTier } from '../types/ticketing';
import { generateTicketSignature, computeTotpNonce } from '../utils/crypto';

const LOCAL_STORAGE_KEY_SEATS = 'oziktix_seats_v1';
const LOCAL_STORAGE_KEY_TICKETS = 'oziktix_tickets_v1';
const LOCAL_STORAGE_KEY_LOGS = 'oziktix_swap_logs_v1';
const LOCAL_STORAGE_KEY_CONFIG = 'oziktix_config_v1';

// Initial 60 Seats Generator for Summarecon Mall Bandung Atrium
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  rows.forEach((row) => {
    let tier: SeatTier = 'VIP';
    let price = 250000;

    if (row === 'A' || row === 'B') {
      tier = 'VIP';
      price = 250000;
    } else if (row === 'C' || row === 'D') {
      tier = 'REGULAR';
      price = 150000;
    } else {
      tier = 'FESTIVAL';
      price = 100000;
    }

    for (let col = 1; col <= 10; col++) {
      const id = `${row}${col}`;

      // Pristine default venue state: all physical seats are AVAILABLE
      let status: 'AVAILABLE' | 'RESERVED' | 'SOLD' = 'AVAILABLE';
      let reservedByUserId: string | null = null;
      let reservedUntil: number | null = null;
      let ticketId: string | null = null;

      seats.push({
        id,
        row,
        col,
        tier,
        price,
        status,
        reservedByUserId,
        reservedUntil,
        ticketId,
        version: 1,
      });
    }
  });

  return seats;
}

export const DEFAULT_CONFIG: SystemConfig = {
  maxSeatsPerUser: 2,
  holdTtlSeconds: 300, // 5:00 minutes
  totpPeriodSeconds: 30,
  gateWindowHours: 2,
  isGateWindowActive: true, // Gate is open by default for demo convenience
  maintenanceMode: false,
};

class ApiClient {
  private isOnlineBackend: boolean = false;
  private backendBaseUrl: string = 'http://localhost:8080/api/v1';

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(LOCAL_STORAGE_KEY_SEATS)) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(generateInitialSeats()));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS)) {
      localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify([]));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEY_LOGS)) {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG)) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
  }

  public resetStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(generateInitialSeats()));
    localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
  }

  // --- Seats Management ---
  public async getSeats(): Promise<Seat[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SEATS);
    const seats: Seat[] = raw ? JSON.parse(raw) : generateInitialSeats();

    // Check expired holds and auto-release them
    const now = Date.now();
    let modified = false;
    const cleanSeats = seats.map((seat) => {
      if (seat.status === 'RESERVED' && seat.reservedUntil && seat.reservedUntil < now) {
        modified = true;
        return {
          ...seat,
          status: 'AVAILABLE' as const,
          reservedByUserId: null,
          reservedUntil: null,
          version: seat.version + 1,
        };
      }
      return seat;
    });

    if (modified) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(cleanSeats));
    }

    return cleanSeats;
  }

  /**
   * Acquire a temporary 5-minute hold on a seat (Optimistic Row-Level Lock)
   */
  public async reserveSeat(
    seatId: string,
    userId: string,
    expectedVersion: number,
    ttlSeconds: number = 300
  ): Promise<{ success: boolean; seat?: Seat; error?: string; code?: number }> {
    const seats = await this.getSeats();
    const seatIdx = seats.findIndex((s) => s.id === seatId);

    if (seatIdx === -1) {
      return { success: false, error: 'Seat not found', code: 404 };
    }

    const currentSeat = seats[seatIdx];

    // Concurrency / Race Condition check (HTTP 409 Conflict)
    if (currentSeat.version !== expectedVersion) {
      return {
        success: false,
        error: `HTTP 409 Conflict: Seat ${seatId} state was altered by another attendee. Expected version ${expectedVersion}, got ${currentSeat.version}.`,
        code: 409,
      };
    }

    if (currentSeat.status === 'SOLD') {
      return {
        success: false,
        error: `HTTP 409 Conflict: Seat ${seatId} was just purchased by another attendee!`,
        code: 409,
      };
    }

    if (currentSeat.status === 'RESERVED' && currentSeat.reservedByUserId !== userId) {
      const remainingSec = Math.ceil(((currentSeat.reservedUntil ?? 0) - Date.now()) / 1000);
      return {
        success: false,
        error: `HTTP 409 Conflict: Seat ${seatId} is locked by another buyer (${Math.max(0, remainingSec)}s remaining).`,
        code: 409,
      };
    }

    // Successfully Lock
    const updatedSeat: Seat = {
      ...currentSeat,
      status: 'RESERVED',
      reservedByUserId: userId,
      reservedUntil: Date.now() + ttlSeconds * 1000,
      version: currentSeat.version + 1,
    };

    seats[seatIdx] = updatedSeat;
    localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));

    return { success: true, seat: updatedSeat };
  }

  /**
   * Release hold on a seat
   */
  public async releaseSeat(seatId: string, userId: string): Promise<{ success: boolean }> {
    const seats = await this.getSeats();
    const seatIdx = seats.findIndex((s) => s.id === seatId);

    if (seatIdx !== -1 && seats[seatIdx].reservedByUserId === userId && seats[seatIdx].status === 'RESERVED') {
      seats[seatIdx] = {
        ...seats[seatIdx],
        status: 'AVAILABLE',
        reservedByUserId: null,
        reservedUntil: null,
        version: seats[seatIdx].version + 1,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));
    }
    return { success: true };
  }

  /**
   * Simulate immediate Race Condition on a seat to trigger 409 Conflict
   */
  public async triggerConcurrencyConflict(seatId: string): Promise<Seat> {
    const seats = await this.getSeats();
    const seatIdx = seats.findIndex((s) => s.id === seatId);
    if (seatIdx !== -1) {
      const hijackedSeat: Seat = {
        ...seats[seatIdx],
        status: 'RESERVED',
        reservedByUserId: 'usr_concurrent_scalper_bot',
        reservedUntil: Date.now() + 300 * 1000,
        version: seats[seatIdx].version + 1,
      };
      seats[seatIdx] = hijackedSeat;
      localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));
      return hijackedSeat;
    }
    throw new Error('Seat not found');
  }

  // --- Checkout & Ticket Issuance ---
  public async checkoutOrder(
    seatIds: string[],
    user: User
  ): Promise<{ success: boolean; tickets?: Ticket[]; error?: string }> {
    const seats = await this.getSeats();
    const newTickets: Ticket[] = [];

    // Verify all seats are still legitimately reserved by this user
    for (const sid of seatIds) {
      const s = seats.find((item) => item.id === sid);
      if (!s) return { success: false, error: `Seat ${sid} not found.` };
      if (s.status === 'SOLD') return { success: false, error: `Seat ${sid} is already sold.` };
      if (s.status === 'RESERVED' && s.reservedByUserId !== user.id) {
        return { success: false, error: `Hold expired for Seat ${sid}. Please reselect.` };
      }
    }

    const now = Date.now();

    for (const sid of seatIds) {
      const seatIdx = seats.findIndex((s) => s.id === sid);
      const currentSeat = seats[seatIdx];
      const ticketId = `OZT-${Date.now().toString(36).toUpperCase()}-${sid}`;

      // Cryptographic HMAC-SHA256 signature
      const hmacSignature = await generateTicketSignature({
        ticketId,
        seatId: sid,
        userId: user.id,
        userNik: user.maskedNik,
        tier: currentSeat.tier,
        timestamp: now,
      });

      const ticket: Ticket = {
        id: ticketId,
        seatId: sid,
        tier: currentSeat.tier,
        price: currentSeat.price,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userMaskedNik: user.maskedNik,
        eventName: 'Summarecon Mall Bandung Atrium Gala 2026',
        eventDate: '15 Nov 2026, 19:00 WIB',
        eventVenue: 'Main Atrium, Summarecon Mall Bandung (SMB)',
        purchasedAt: now,
        status: 'ACTIVE',
        hmacSignature,
        swapCount: 0,
      };

      newTickets.push(ticket);

      seats[seatIdx] = {
        ...currentSeat,
        status: 'SOLD',
        reservedByUserId: null,
        reservedUntil: null,
        ticketId,
        version: currentSeat.version + 1,
      };
    }

    // Save seats
    localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));

    // Save tickets
    const existingTickets: Ticket[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS) || '[]'
    );
    const updatedTickets = [...existingTickets, ...newTickets];
    localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(updatedTickets));

    return { success: true, tickets: newTickets };
  }

  // --- QA Point #4: Atomic Seat Relocation (Wrong Seat Swap) ---
  public async atomicSeatSwap(
    ticketId: string,
    newSeatId: string,
    userId: string,
    reason: string = 'Attendee voluntary relocation (1x Free Swap)'
  ): Promise<{
    success: boolean;
    oldSeat?: Seat;
    newSeat?: Seat;
    updatedTicket?: Ticket;
    error?: string;
  }> {
    const seats = await this.getSeats();
    const rawTickets = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
    const tickets: Ticket[] = rawTickets ? JSON.parse(rawTickets) : [];

    const ticketIdx = tickets.findIndex((t) => t.id === ticketId);
    if (ticketIdx === -1) {
      return { success: false, error: 'Ticket not found.' };
    }

    const ticket = tickets[ticketIdx];
    if (ticket.userId !== userId) {
      return { success: false, error: 'Unauthorized: You do not own this ticket.' };
    }
    if (ticket.swapCount >= 1) {
      return { success: false, error: 'Relocation quota exceeded: Maximum 1 free swap per ticket allowed.' };
    }
    if (ticket.status !== 'ACTIVE') {
      return { success: false, error: `Cannot swap ticket with status ${ticket.status}.` };
    }

    const oldSeatId = ticket.seatId;
    const oldSeatIdx = seats.findIndex((s) => s.id === oldSeatId);
    const newSeatIdx = seats.findIndex((s) => s.id === newSeatId);

    if (oldSeatIdx === -1 || newSeatIdx === -1) {
      return { success: false, error: 'Invalid seat coordinates.' };
    }

    const oldSeat = seats[oldSeatIdx];
    const newSeat = seats[newSeatIdx];

    // Same tier restriction
    if (newSeat.tier !== ticket.tier) {
      return { success: false, error: `Swaps must be within the same tier (${ticket.tier}).` };
    }

    // Target seat must be AVAILABLE
    if (newSeat.status !== 'AVAILABLE') {
      return { success: false, error: `Target seat ${newSeatId} is not available (Status: ${newSeat.status}).` };
    }

    // ATOMIC TRANSACTION:
    // 1. Release old seat back to AVAILABLE
    seats[oldSeatIdx] = {
      ...oldSeat,
      status: 'AVAILABLE',
      reservedByUserId: null,
      reservedUntil: null,
      ticketId: null,
      version: oldSeat.version + 1,
    };

    // 2. Claim new seat as SOLD
    seats[newSeatIdx] = {
      ...newSeat,
      status: 'SOLD',
      reservedByUserId: null,
      reservedUntil: null,
      ticketId: ticket.id,
      version: newSeat.version + 1,
    };

    // 3. Re-sign Ticket HMAC with updated seat coordinates
    const newSignature = await generateTicketSignature({
      ticketId: ticket.id,
      seatId: newSeatId,
      userId: ticket.userId,
      userNik: ticket.userMaskedNik,
      tier: ticket.tier,
      timestamp: Date.now(),
    });

    const updatedTicket: Ticket = {
      ...ticket,
      seatId: newSeatId,
      swapCount: ticket.swapCount + 1,
      swappedFromSeatId: oldSeatId,
      hmacSignature: newSignature,
    };

    tickets[ticketIdx] = updatedTicket;

    // 4. Log the swap in audit log
    const swapLog: SwapLog = {
      id: `LOG-SWAP-${Date.now()}`,
      ticketId: ticket.id,
      userId: ticket.userId,
      userName: ticket.userName,
      fromSeatId: oldSeatId,
      toSeatId: newSeatId,
      tier: ticket.tier,
      timestamp: Date.now(),
      reason,
    };

    const rawLogs = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    const logs: SwapLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    logs.unshift(swapLog);

    // Commit to persistent state
    localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));
    localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));

    return {
      success: true,
      oldSeat: seats[oldSeatIdx],
      newSeat: seats[newSeatIdx],
      updatedTicket,
    };
  }

  // --- Gate Scanner Validation ---
  public async validateGateScan(payloadString: string, currentTimestamp: number = Date.now()): Promise<GateScanResult> {
    const rawTickets = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
    const tickets: Ticket[] = rawTickets ? JSON.parse(rawTickets) : [];
    const seats = await this.getSeats();

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(payloadString);
    } catch {
      return {
        verdict: 'INVALID',
        message: 'QR Format Corrupted or Non-OzikTix payload',
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: 'Malformatted JSON QR structure',
      };
    }

    const { tid, seat: seatId, uid, totp } = parsedPayload;

    if (!tid) {
      return {
        verdict: 'INVALID',
        message: 'Missing Ticket ID in QR token',
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: 'No ticket identity found',
      };
    }

    const ticket = tickets.find((t) => t.id === tid);
    if (!ticket) {
      return {
        verdict: 'INVALID',
        message: `Ticket ${tid} does not exist in master ledger. Potential counterfeit!`,
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: 'Counterfeit or unissued ticket',
      };
    }

    const seat = seats.find((s) => s.id === ticket.seatId);

    // Check if ticket was revoked or refunded
    if (ticket.status === 'REVOKED') {
      return {
        verdict: 'INVALID',
        message: `Ticket ${tid} was REVOKED/REFUNDED. Entry strictly denied.`,
        ticket,
        seat,
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: 'Ticket was cancelled or refunded by Panitia',
      };
    }

    // Check if attendee tried to use an old seat from a swapped ticket
    if (seatId !== ticket.seatId) {
      return {
        verdict: 'INVALID',
        message: `Seat mismatch! QR claims seat ${seatId}, but ticket was relocated to ${ticket.seatId}. Old QR is revoked!`,
        ticket,
        seat,
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: false,
        failureReason: 'Revoked legacy seat hash following atomic swap',
      };
    }

    // Check if already checked in (Tier 2 Yellow: ALREADY USED)
    if (ticket.status === 'USED') {
      const checkInTime = ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString('id-ID') : 'earlier';
      return {
        verdict: 'ALREADY_USED',
        message: `ALREADY USED: Ticket was already checked in at ${checkInTime}. Duplicate entry rejected!`,
        ticket,
        seat,
        scannedAt: currentTimestamp,
        totpValid: true,
        identityMatch: true,
        failureReason: 'Double-entry attempt detected at gate barrier',
      };
    }

    // QA Point #2: Check 30-Second TOTP Dynamic Nonce
    const expectedTotp = computeTotpNonce(ticket.id, currentTimestamp);
    // Allow slight tolerance of ±1 time step (30 seconds) for clock drift
    const prevTotp = computeTotpNonce(ticket.id, currentTimestamp - 30000);
    const isTotpValid = totp === expectedTotp.nonce || totp === prevTotp.nonce;

    if (!isTotpValid) {
      return {
        verdict: 'ALREADY_USED',
        message: `EXPIRED TOTP TOKEN: Token ${totp} expired! Static screenshot detected. Only live rotating QR accepted.`,
        ticket,
        seat,
        scannedAt: currentTimestamp,
        totpValid: false,
        identityMatch: true,
        failureReason: 'Stale 30-second rotating TOTP token (Screenshot anti-scalp protection)',
      };
    }

    // If all checks pass: Mark as USED and Grant Green Access
    ticket.status = 'USED';
    ticket.checkedInAt = currentTimestamp;
    ticket.checkedInBy = 'Gate Officer 01 - Main Entrance SMB';

    const tIdx = tickets.findIndex((t) => t.id === tid);
    tickets[tIdx] = ticket;
    localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(tickets));

    return {
      verdict: 'VALID',
      message: `ACCESS GRANTED: Welcome to Atrium Gala 2026, ${ticket.userName}!`,
      ticket,
      seat,
      scannedAt: currentTimestamp,
      totpValid: true,
      identityMatch: true,
    };
  }

  // --- Admin Operations ---
  public async refundTicket(ticketId: string): Promise<{ success: boolean; seatId?: string; error?: string }> {
    const rawTickets = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
    const tickets: Ticket[] = rawTickets ? JSON.parse(rawTickets) : [];
    const seats = await this.getSeats();

    const tIdx = tickets.findIndex((t) => t.id === ticketId);
    if (tIdx === -1) return { success: false, error: 'Ticket not found.' };

    const ticket = tickets[tIdx];
    const seatIdx = seats.findIndex((s) => s.id === ticket.seatId);

    // Revoke ticket
    tickets[tIdx] = {
      ...ticket,
      status: 'REVOKED',
    };

    // Return seat to AVAILABLE
    if (seatIdx !== -1) {
      seats[seatIdx] = {
        ...seats[seatIdx],
        status: 'AVAILABLE',
        reservedByUserId: null,
        reservedUntil: null,
        ticketId: null,
        version: seats[seatIdx].version + 1,
      };
    }

    localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    localStorage.setItem(LOCAL_STORAGE_KEY_SEATS, JSON.stringify(seats));

    return { success: true, seatId: ticket.seatId };
  }

  public async getTickets(): Promise<Ticket[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
    return raw ? JSON.parse(raw) : [];
  }

  public async getSwapLogs(): Promise<SwapLog[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public async getConfig(): Promise<SystemConfig> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  }

  public async updateConfig(newConfig: Partial<SystemConfig>): Promise<SystemConfig> {
    const current = await this.getConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(updated));
    return updated;
  }
}

export const apiClient = new ApiClient();
