/**
 * OzikTix Pricing Engine (pure, side-effect free)
 *
 * Menjawab brief Summarecon (10 Nov 2026):
 *  - #01 Kategori (VIP / Reguler / Festival) x Paket (Single / Couple / Group) yang terstruktur
 *  - #03 Panitia mengatur diskon -> harga setelah diskon dihitung otomatis & konsisten
 *
 * File ini di-mirror 1:1 di fe/src/utils/pricing.ts agar angka yang dilihat pelanggan
 * identik dengan angka yang ditagih backend saat checkout (backend tetap otoritatif).
 */

export type CategoryCode = 'VIP' | 'REGULAR' | 'FESTIVAL';
export type PackageCode = 'SINGLE' | 'COUPLE' | 'GROUP';
export type DiscountType = 'NONE' | 'PERCENT' | 'NOMINAL';

export interface CategoryPricing {
  code: CategoryCode;
  name: string;
  rows: string[];
  basePrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountLabel: string;
}

export interface PackagePricing {
  code: PackageCode;
  name: string;
  seats: number;
  discountPercent: number;
  enabled: boolean;
}

export interface PricingConfig {
  categories: CategoryPricing[];
  packages: PackagePricing[];
  serviceFeePerSeat: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PriceQuote {
  category: CategoryCode;
  package: PackageCode;
  seatCount: number;
  basePerSeat: number;
  categoryDiscountPerSeat: number;
  unitPriceAfterCategory: number;
  subtotalNormal: number;
  categoryDiscountTotal: number;
  packageDiscountPercent: number;
  packageDiscountTotal: number;
  ticketTotal: number;
  serviceFeeTotal: number;
  grandTotal: number;
  totalSavings: number;
  pricePerSeatPaid: number;
}

export const MAX_SEATS_PER_ORDER = 3;

export const DEFAULT_PRICING: PricingConfig = {
  categories: [
    {
      code: 'VIP',
      name: 'VIP',
      rows: ['A', 'B'],
      basePrice: 250000,
      discountType: 'PERCENT',
      discountValue: 10,
      discountLabel: 'Early Bird',
    },
    {
      code: 'REGULAR',
      name: 'Reguler',
      rows: ['C', 'D'],
      basePrice: 150000,
      discountType: 'NONE',
      discountValue: 0,
      discountLabel: '',
    },
    {
      code: 'FESTIVAL',
      name: 'Festival',
      rows: ['E', 'F'],
      basePrice: 100000,
      discountType: 'NOMINAL',
      discountValue: 10000,
      discountLabel: 'Promo Mahasiswa',
    },
  ],
  packages: [
    { code: 'SINGLE', name: 'Single', seats: 1, discountPercent: 0, enabled: true },
    { code: 'COUPLE', name: 'Couple', seats: 2, discountPercent: 5, enabled: true },
    { code: 'GROUP', name: 'Group', seats: 3, discountPercent: 10, enabled: true },
  ],
  serviceFeePerSeat: 5000,
};

export function getCategory(config: PricingConfig, code: string): CategoryPricing | undefined {
  return config.categories.find((c) => c.code === code);
}

export function getPackage(config: PricingConfig, code: string): PackagePricing | undefined {
  return config.packages.find((p) => p.code === code);
}

export function packageForSeatCount(config: PricingConfig, count: number): PackagePricing | undefined {
  return config.packages.find((p) => p.seats === count && p.enabled);
}

export function computeCategoryDiscount(category: CategoryPricing): number {
  if (category.discountType === 'PERCENT') {
    return Math.round((category.basePrice * category.discountValue) / 100);
  }
  if (category.discountType === 'NOMINAL') {
    return Math.min(category.discountValue, category.basePrice);
  }
  return 0;
}

export function computeUnitPrice(category: CategoryPricing): number {
  return category.basePrice - computeCategoryDiscount(category);
}

export function computeQuote(
  config: PricingConfig,
  categoryCode: CategoryCode,
  packageCode: PackageCode
): PriceQuote {
  const category = getCategory(config, categoryCode);
  const pkg = getPackage(config, packageCode);
  if (!category) throw new Error(`Kategori ${categoryCode} tidak dikenal.`);
  if (!pkg) throw new Error(`Paket ${packageCode} tidak dikenal.`);

  const n = pkg.seats;
  const categoryDiscountPerSeat = computeCategoryDiscount(category);
  const unitPriceAfterCategory = category.basePrice - categoryDiscountPerSeat;
  const subtotalNormal = category.basePrice * n;
  const categoryDiscountTotal = categoryDiscountPerSeat * n;
  const afterCategory = unitPriceAfterCategory * n;
  const packageDiscountTotal = Math.round((afterCategory * pkg.discountPercent) / 100);
  const ticketTotal = afterCategory - packageDiscountTotal;
  const serviceFeeTotal = config.serviceFeePerSeat * n;

  return {
    category: category.code,
    package: pkg.code,
    seatCount: n,
    basePerSeat: category.basePrice,
    categoryDiscountPerSeat,
    unitPriceAfterCategory,
    subtotalNormal,
    categoryDiscountTotal,
    packageDiscountPercent: pkg.discountPercent,
    packageDiscountTotal,
    ticketTotal,
    serviceFeeTotal,
    grandTotal: ticketTotal + serviceFeeTotal,
    totalSavings: categoryDiscountTotal + packageDiscountTotal,
    pricePerSeatPaid: Math.round(ticketTotal / n),
  };
}

/**
 * Validasi aturan bisnis. Mengembalikan daftar pesan error (kosong = valid).
 */
export function validatePricingConfig(config: PricingConfig): string[] {
  const errors: string[] = [];
  const requiredCategories: CategoryCode[] = ['VIP', 'REGULAR', 'FESTIVAL'];
  const requiredPackages: PackageCode[] = ['SINGLE', 'COUPLE', 'GROUP'];

  for (const code of requiredCategories) {
    const c = getCategory(config, code);
    if (!c) {
      errors.push(`Kategori ${code} wajib ada.`);
      continue;
    }
    if (!Number.isInteger(c.basePrice) || c.basePrice < 10000 || c.basePrice > 10000000) {
      errors.push(`${c.name}: harga dasar harus Rp 10.000 – Rp 10.000.000.`);
    }
    if (c.discountType === 'PERCENT' && (c.discountValue < 0 || c.discountValue > 90)) {
      errors.push(`${c.name}: diskon persen harus 0–90%.`);
    }
    if (c.discountType === 'NOMINAL' && (c.discountValue < 0 || c.discountValue >= c.basePrice)) {
      errors.push(`${c.name}: diskon nominal harus lebih kecil dari harga dasar.`);
    }
  }

  for (const code of requiredPackages) {
    const p = getPackage(config, code);
    if (!p) {
      errors.push(`Paket ${code} wajib ada.`);
      continue;
    }
    if (p.discountPercent < 0 || p.discountPercent > 50) {
      errors.push(`Paket ${p.name}: diskon paket harus 0–50%.`);
    }
  }
  if (!getPackage(config, 'SINGLE')?.enabled) {
    errors.push('Paket Single tidak boleh dinonaktifkan.');
  }

  if (config.serviceFeePerSeat < 0 || config.serviceFeePerSeat > 100000) {
    errors.push('Biaya layanan harus Rp 0 – Rp 100.000 per kursi.');
  }

  return errors;
}

/**
 * Normalisasi input admin: kunci field struktural (code, rows, seats) agar tidak bisa diubah
 * dari client, hanya angka & label yang boleh diedit.
 */
export function normalizePricingInput(input: any, base: PricingConfig = DEFAULT_PRICING): PricingConfig {
  const toInt = (v: any, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const categories = base.categories.map((def) => {
    const incoming = Array.isArray(input?.categories)
      ? input.categories.find((c: any) => c?.code === def.code)
      : undefined;
    const discountType: DiscountType = ['NONE', 'PERCENT', 'NOMINAL'].includes(incoming?.discountType)
      ? incoming.discountType
      : def.discountType;
    return {
      ...def,
      basePrice: toInt(incoming?.basePrice, def.basePrice),
      discountType,
      discountValue: discountType === 'NONE' ? 0 : toInt(incoming?.discountValue, def.discountValue),
      discountLabel:
        discountType === 'NONE'
          ? ''
          : String(incoming?.discountLabel ?? def.discountLabel).slice(0, 40),
    };
  });

  const packages = base.packages.map((def) => {
    const incoming = Array.isArray(input?.packages)
      ? input.packages.find((p: any) => p?.code === def.code)
      : undefined;
    return {
      ...def,
      discountPercent: toInt(incoming?.discountPercent, def.discountPercent),
      enabled: def.code === 'SINGLE' ? true : incoming?.enabled === undefined ? def.enabled : Boolean(incoming.enabled),
    };
  });

  return {
    categories,
    packages,
    serviceFeePerSeat: toInt(input?.serviceFeePerSeat, base.serviceFeePerSeat),
  };
}

