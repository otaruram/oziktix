import { prisma } from '../infrastructure/db/prisma';
import { BadRequestError } from '../domain/errors';
import {
  DEFAULT_PRICING,
  PricingConfig,
  normalizePricingInput,
  validatePricingConfig,
} from '../domain/pricing';

const CACHE_TTL_MS = 10_000;

/**
 * Persisted pricing & discount rules (single-row JSONB config).
 * Tabel dibuat idempotent saat runtime (pola yang sama dengan UserSeatHold) sehingga
 * deploy Render tidak butuh migration manual.
 */
export class PricingService {
  private schemaReady: Promise<void> | null = null;
  private cache: { value: PricingConfig; at: number } | null = null;

  public ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "PricingRule" (
            "id" TEXT PRIMARY KEY,
            "config" JSONB NOT NULL,
            "updatedBy" TEXT NOT NULL DEFAULT 'system',
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "pricePaid" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "packageType" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "orderId" TEXT;`);
      })().catch((err) => {
        // Allow retry on next call if DB was temporarily unreachable
        this.schemaReady = null;
        throw err;
      });
    }
    return this.schemaReady;
  }

  public async getConfig(): Promise<PricingConfig> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.value;
    }
    try {
      await this.ensureSchema();
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "config", "updatedBy", "updatedAt" FROM "PricingRule" WHERE "id" = 'default' LIMIT 1;
      `;
      const value: PricingConfig = rows.length
        ? {
            ...normalizePricingInput(rows[0].config, DEFAULT_PRICING),
            updatedBy: rows[0].updatedBy,
            updatedAt: new Date(rows[0].updatedAt).toISOString(),
          }
        : DEFAULT_PRICING;
      this.cache = { value, at: Date.now() };
      return value;
    } catch {
      // DB unreachable -> keep serving last known config or defaults (never block purchases)
      return this.cache?.value ?? DEFAULT_PRICING;
    }
  }

  public async updateConfig(input: unknown, updatedBy: string): Promise<PricingConfig> {
    const current = await this.getConfig();
    const next = normalizePricingInput(input, current);
    const errors = validatePricingConfig(next);
    if (errors.length > 0) {
      throw new BadRequestError(errors.join(' '));
    }

    await this.ensureSchema();
    const json = JSON.stringify(next);
    await prisma.$executeRaw`
      INSERT INTO "PricingRule" ("id", "config", "updatedBy", "updatedAt")
      VALUES ('default', ${json}::jsonb, ${updatedBy}, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "config" = ${json}::jsonb,
        "updatedBy" = ${updatedBy},
        "updatedAt" = NOW();
    `;

    this.cache = null;
    return this.getConfig();
  }
}

export const pricingService = new PricingService();

