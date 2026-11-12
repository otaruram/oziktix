/**
 * OzikTix Pricing Engine (Frontend Client)
 * Identik 1:1 dengan be/src/domain/pricing.ts
 * Menjawab kebutuhan Mas Adit (Summarecon Mall Bandung):
 * 01. Kategori (VIP, Reguler, Festival) & Paket (Single, Couple 2 org, Group 3 org)
 * 03. Pengaturan diskon dan perhitungan harga otomatis
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
    { code: 'SINGLE', name: 'Single (1 Tiket)', seats: 1, discountPercent: 0, enabled: true },
    { code: 'COUPLE', name: 'Couple (2 Tiket)', seats: 2, discountPercent: 5, enabled: true },
    { code: 'GROUP', name: 'Group (3 Tiket)', seats: 3, discountPercent: 10, enabled: true },
  ],
  serviceFeePerSeat: 5000,
};

export function getCategory(config: PricingConfig, code: string): CategoryPricing | undefined {
  return config.categories.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

export function getPackage(config: PricingConfig, code: string): PackagePricing | undefined {
  return config.packages.find((p) => p.code.toUpperCase() === code.toUpperCase());
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

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

