import { axiosInstance } from './axiosClient';
import { PricingConfig, DEFAULT_PRICING, PriceQuote } from '../utils/pricing';

export const PricingApi = {
  async getPricing(): Promise<PricingConfig> {
    try {
      const res = await axiosInstance.get('/api/v1/pricing');
      if (res.data?.data) {
        return res.data.data as PricingConfig;
      }
      return DEFAULT_PRICING;
    } catch {
      return DEFAULT_PRICING;
    }
  },

  async getQuote(category: string, packageType: string): Promise<PriceQuote | null> {
    try {
      const res = await axiosInstance.get('/api/v1/pricing/quote', {
        params: { category, package: packageType },
      });
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async updatePricing(config: Partial<PricingConfig>): Promise<{ success: boolean; data?: PricingConfig; error?: string }> {
    try {
      const res = await axiosInstance.put('/api/v1/admin/pricing', config);
      return { success: true, data: res.data?.data };
    } catch (e: any) {
      return {
        success: false,
        error: e.response?.data?.error || e.message || 'Gagal menyimpan pengaturan harga',
      };
    }
  },
};

