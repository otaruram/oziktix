import React, { useState, useEffect } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import {
  PricingConfig,
  DEFAULT_PRICING,
  formatRupiah,
  computeCategoryDiscount,
  computeUnitPrice,
  computeQuote,
  CategoryCode,
  PackageCode,
  DiscountType,
} from '../../../utils/pricing';
import { Tag, Sparkles, Save, RotateCcw, CheckCircle2, AlertCircle, Percent, DollarSign } from 'lucide-react';

export const PricingDiscountManager: React.FC = () => {
  const { pricingConfig, updatePricingConfig } = useTicketing();
  const [formConfig, setFormConfig] = useState<PricingConfig>(pricingConfig || DEFAULT_PRICING);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (pricingConfig) {
      setFormConfig(pricingConfig);
    }
  }, [pricingConfig]);

  const handleCategoryChange = (
    index: number,
    field: 'basePrice' | 'discountType' | 'discountValue' | 'discountLabel',
    value: any
  ) => {
    setFormConfig((prev) => {
      const categories = [...prev.categories];
      categories[index] = {
        ...categories[index],
        [field]:
          field === 'basePrice' || field === 'discountValue'
            ? Math.max(0, parseInt(value || '0', 10))
            : value,
      };
      return { ...prev, categories };
    });
  };

  const handlePackageChange = (index: number, field: 'discountPercent' | 'enabled', value: any) => {
    setFormConfig((prev) => {
      const packages = [...prev.packages];
      packages[index] = {
        ...packages[index],
        [field]: field === 'discountPercent' ? Math.max(0, Math.min(50, parseInt(value || '0', 10))) : value,
      };
      return { ...prev, packages };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const res = await updatePricingConfig(formConfig);
    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan pengaturan.');
    }
  };

  const handleReset = () => {
    setFormConfig(DEFAULT_PRICING);
  };

  return (
    <div className="p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-6 text-left font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-base">
              Pengaturan Diskon & Perhitungan Harga Otomatis
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Fitur resmi Summarecon Mall Bandung: Atur harga dasar & diskon, sistem menghitung harga otomatis untuk pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Pengaturan harga dan diskon berhasil disimpan & aktif secara real-time!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Kategori & Diskon Kategori */}
        <div className="space-y-3">
          <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Harga Dasar & Diskon Kategori (VIP, Reguler, Festival)</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formConfig.categories.map((c, idx) => {
              const discount = computeCategoryDiscount(c);
              const unitPrice = computeUnitPrice(c);

              return (
                <div key={c.code} className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                    <span className="font-extrabold text-white text-sm">{c.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                      Row {c.rows.join(' & ')}
                    </span>
                  </div>

                  {/* Base Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Harga Dasar (Rp):</label>
                    <input
                      type="number"
                      step="5000"
                      min="10000"
                      value={c.basePrice}
                      onChange={(e) => handleCategoryChange(idx, 'basePrice', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0b0f19] border border-white/[0.1] text-white font-bold focus:border-emerald-400 outline-none"
                    />
                  </div>

                  {/* Discount Type */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Jenis Diskon:</label>
                    <select
                      value={c.discountType}
                      onChange={(e) =>
                        handleCategoryChange(idx, 'discountType', e.target.value as DiscountType)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0b0f19] border border-white/[0.1] text-white font-bold focus:border-emerald-400 outline-none"
                    >
                      <option value="NONE">Tanpa Diskon</option>
                      <option value="PERCENT">Persentase (%)</option>
                      <option value="NOMINAL">Potongan Nominal (Rp)</option>
                    </select>
                  </div>

                  {/* Discount Value & Label */}
                  {c.discountType !== 'NONE' && (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">
                          {c.discountType === 'PERCENT' ? 'Nilai (%)' : 'Potongan (Rp)'}:
                        </label>
                        <input
                          type="number"
                          value={c.discountValue}
                          onChange={(e) => handleCategoryChange(idx, 'discountValue', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-emerald-500/30 text-emerald-400 font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Label Promo:</label>
                        <input
                          type="text"
                          placeholder="e.g. Early Bird"
                          value={c.discountLabel}
                          onChange={(e) => handleCategoryChange(idx, 'discountLabel', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-white/[0.1] text-white outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Real-time Calculation Result */}
                  <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Harga Setelah Diskon:</span>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-400 block text-xs">{formatRupiah(unitPrice)}</span>
                      {discount > 0 && (
                        <span className="text-[10px] text-slate-500 line-through">
                          {formatRupiah(c.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Diskon Paket (Single, Couple, Group) */}
        <div className="space-y-3">
          <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5 text-cyan-400">
            <Percent className="w-3.5 h-3.5" />
            <span>2. Diskon Tambahan Paket Pesanan (Single, Couple, Group)</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formConfig.packages.map((pkg, idx) => (
              <div key={pkg.code} className="p-3.5 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-white text-sm">{pkg.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {pkg.seats} Kursi
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Diskon Paket Tambahan (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    disabled={pkg.code === 'SINGLE'}
                    value={pkg.discountPercent}
                    onChange={(e) => handlePackageChange(idx, 'discountPercent', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-white/[0.1] text-cyan-300 font-bold outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Live Matrix Preview of All Combinations */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
          <span className="font-bold text-white text-xs uppercase block text-slate-300">
            3. Simulasi Matriks Harga Otomatis (Yang Dilihat & Ditagih ke Pelanggan)
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="py-2 pr-3">Kategori</th>
                  <th className="py-2 px-3">Paket</th>
                  <th className="py-2 px-3 text-right">Harga Normal</th>
                  <th className="py-2 px-3 text-right">Diskon Kategori</th>
                  <th className="py-2 px-3 text-right">Diskon Paket</th>
                  <th className="py-2 px-3 text-right">Total Hemat</th>
                  <th className="py-2 pl-3 text-right">Tagihan Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {formConfig.categories.flatMap((cat) =>
                  formConfig.packages.map((pkg) => {
                    const quote = computeQuote(formConfig, cat.code, pkg.code);
                    return (
                      <tr key={`${cat.code}-${pkg.code}`} className="hover:bg-white/[0.02]">
                        <td className="py-2 pr-3 font-bold text-white">{cat.name}</td>
                        <td className="py-2 px-3 text-cyan-300">{pkg.name}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatRupiah(quote.subtotalNormal)}</td>
                        <td className="py-2 px-3 text-right text-amber-400">
                          {quote.categoryDiscountTotal > 0 ? `-${formatRupiah(quote.categoryDiscountTotal)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-cyan-400">
                          {quote.packageDiscountTotal > 0 ? `-${formatRupiah(quote.packageDiscountTotal)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {quote.totalSavings > 0 ? formatRupiah(quote.totalSavings) : 'Rp 0'}
                        </td>
                        <td className="py-2 pl-3 text-right font-extrabold text-white">
                          {formatRupiah(quote.grandTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan & Menghitung...' : 'Simpan & Terapkan Pengaturan Harga'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
