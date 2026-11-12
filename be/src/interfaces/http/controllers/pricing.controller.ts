import { Request, Response, NextFunction, Router } from 'express';
import { pricingService } from '../../../services/pricing.service';
import { computeQuote, CategoryCode, PackageCode, getCategory, getPackage } from '../../../domain/pricing';
import { BadRequestError } from '../../../domain/errors';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

export class PricingController {
  /** GET /api/v1/pricing — public: kategori, paket, diskon aktif + matriks harga final */
  public async getPricing(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await pricingService.getConfig();
      const matrix = config.categories.flatMap((c) =>
        config.packages
          .filter((p) => p.enabled)
          .map((p) => computeQuote(config, c.code, p.code))
      );
      res.json({ success: true, data: config, matrix });
    } catch (e) {
      next(e);
    }
  }

  /** GET /api/v1/pricing/quote?category=VIP&package=COUPLE — kalkulasi harga otoritatif */
  public async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = String(req.query.category || '').toUpperCase();
      const pkg = String(req.query.package || '').toUpperCase();
      const config = await pricingService.getConfig();
      if (!getCategory(config, category)) throw new BadRequestError(`Kategori ${category} tidak dikenal.`);
      const p = getPackage(config, pkg);
      if (!p || !p.enabled) throw new BadRequestError(`Paket ${pkg} tidak tersedia.`);
      res.json({ success: true, data: computeQuote(config, category as CategoryCode, pkg as PackageCode) });
    } catch (e) {
      next(e);
    }
  }

  /** PUT /api/v1/admin/pricing — panitia mengubah harga dasar, diskon kategori, diskon paket */
  public async updatePricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.email || 'panitia';
      const config = await pricingService.updateConfig(req.body, updatedBy);
      res.json({ success: true, data: config, message: 'Harga & diskon berhasil diperbarui.' });
    } catch (e) {
      next(e);
    }
  }
}

export const pricingController = new PricingController();

export const pricingRouter = Router();
pricingRouter.get('/', pricingController.getPricing);
pricingRouter.get('/quote', pricingController.getQuote);

export const adminPricingRouter = Router();
adminPricingRouter.put('/', authMiddleware, requireRole(['ADMIN']), pricingController.updatePricing);

