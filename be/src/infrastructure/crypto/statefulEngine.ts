import crypto from 'crypto';
import { ENV } from '../../config/env';

export class StatefulEngine {
  /**
   * Generates cryptographic random nonce (16 bytes = 32 hex chars)
   */
  public static generateSecretNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Current 30-second time window index
   */
  public static getCurrentTimeWindow(nowMs: number = Date.now()): number {
    return Math.floor(nowMs / 30000);
  }

  /**
   * Seconds remaining in the current 30-second bucket
   */
  public static getSecondsRemaining(nowMs: number = Date.now()): number {
    return 30 - (Math.floor(nowMs / 1000) % 30);
  }

  /**
   * Constructs standardized payload string:
   * `${ticket.id}|${ticket.seatId}|${ticket.userId}|${timeWindow}|${ticket.secretNonce}`
   */
  public static constructPayloadString(params: {
    ticketId: string;
    seatId: string;
    userId: string;
    timeWindow: number;
    secretNonce: string;
  }): string {
    return `${params.ticketId}|${params.seatId}|${params.userId}|${params.timeWindow}|${params.secretNonce}`;
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  public static computeHmac(payload: string): string {
    return crypto.createHmac('sha256', ENV.HMAC_SECRET).update(payload).digest('hex');
  }

  /**
   * Generates dynamic 6-digit TOTP nonce for human-readable display & fast comparison
   */
  public static computeTotpDisplayNonce(ticketId: string, timeWindow: number): string {
    const raw = `${ticketId}:${timeWindow}:${ENV.HMAC_SECRET}`;
    const hash = crypto.createHash('sha256').update(raw).digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    return (binary % 1000000).toString().padStart(6, '0');
  }

  /**
   * Validates cryptographic integrity of a scanned payload
   * Checks current time window and previous time window (grace window for network delay)
   */
  public static verifyScannedSignature(params: {
    ticketId: string;
    seatId: string;
    userId: string;
    timeWindow: number;
    secretNonce: string;
    providedSignature: string;
  }): boolean {
    // Current bucket
    const payloadCurrent = this.constructPayloadString({
      ticketId: params.ticketId,
      seatId: params.seatId,
      userId: params.userId,
      timeWindow: params.timeWindow,
      secretNonce: params.secretNonce,
    });
    const sigCurrent = this.computeHmac(payloadCurrent);

    if (crypto.timingSafeEqual(Buffer.from(sigCurrent), Buffer.from(params.providedSignature))) {
      return true;
    }

    // Grace bucket (timeWindow - 1)
    const payloadPrev = this.constructPayloadString({
      ticketId: params.ticketId,
      seatId: params.seatId,
      userId: params.userId,
      timeWindow: params.timeWindow - 1,
      secretNonce: params.secretNonce,
    });
    const sigPrev = this.computeHmac(payloadPrev);

    if (sigPrev.length === params.providedSignature.length) {
      return crypto.timingSafeEqual(Buffer.from(sigPrev), Buffer.from(params.providedSignature));
    }

    return false;
  }
}

