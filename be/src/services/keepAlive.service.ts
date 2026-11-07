import { prisma } from '../infrastructure/db/prisma';
import { ShowcaseSeederService } from './showcaseSeeder.service';

export class KeepAliveService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Pings Supabase PostgreSQL, ensures baseline showcase telemetry is active, and measures roundtrip latency.
   */
  public static async pingDatabase(): Promise<{
    status: string;
    database: string;
    latencyMs: number;
    seatCount: number;
    timestamp: string;
  }> {
    const start = Date.now();
    await ShowcaseSeederService.ensureSeeded();
    const count = await prisma.seat.count();
    const latency = Date.now() - start;

    return {
      status: 'ok',
      database: 'connected',
      latencyMs: latency,
      seatCount: count,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Starts periodic database keep-alive ping to prevent Supabase Free Tier & Render from sleeping/pausing.
   * Default interval: 5 minutes (300,000 ms).
   */
  public static startScheduler(intervalMs = 5 * 60 * 1000) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`[KeepAlive] ⏱️ Supabase & Render Keep-Alive scheduled every ${intervalMs / 60000} minutes.`);

    // Perform initial ping & showcase seed after 2 seconds
    setTimeout(async () => {
      try {
        const res = await this.pingDatabase();
        console.log(`[KeepAlive] 🟢 Initial Supabase ping & showcase seed OK (${res.latencyMs}ms, ${res.seatCount} seats)`);
      } catch (err: any) {
        console.warn(`[KeepAlive] ⚠️ Initial Supabase ping error:`, err?.message || err);
      }
    }, 2000);

    // Recurring interval
    this.timer = setInterval(async () => {
      try {
        const res = await this.pingDatabase();
        console.log(`[KeepAlive] 🟢 Supabase Keep-Alive Ping OK at ${res.timestamp} (${res.latencyMs}ms)`);
      } catch (err: any) {
        console.warn(`[KeepAlive] ⚠️ Supabase Keep-Alive Ping failed:`, err?.message || err);
      }
    }, intervalMs);

    // Do not prevent Node process from exiting
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  public static stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

