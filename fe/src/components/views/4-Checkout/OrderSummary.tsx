import React from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { BrandMark } from '../../common/BrandLogo';
import { Clock, ShieldCheck, CheckCircle2, Tag, Sparkles } from 'lucide-react';
import { Seat } from '../../../types';
import { formatRupiah, getCategory, getPackage } from '../../../utils/pricing';

interface OrderSummaryProps {
  children?: React.ReactNode;
  isPaid?: boolean;
  stoppedAtSeconds?: number | null;
  paidSeatsSnapshot?: Seat[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  children,
  isPaid = false,
  stoppedAtSeconds = null,
  paidSeatsSnapshot = [],
}) => {
  const { seats, selectedSeatIds, holdSecondsRemaining, currentUser, config, pricingConfig, currentQuote } = useTicketing();

  const activeSeats =
    isPaid && paidSeatsSnapshot.length > 0
      ? paidSeatsSnapshot
      : seats.filter((s) => selectedSeatIds.includes(s.id));

  const quote = currentQuote;
  const subtotalNormal = quote ? quote.subtotalNormal : activeSeats.reduce((acc, s) => acc + s.price, 0);
  const totalSavings = quote ? quote.totalSavings : 0;
  const platformFee = quote ? quote.serviceFeeTotal : activeSeats.length * (pricingConfig?.serviceFeePerSeat || 5000);
  const totalAmount = quote ? quote.grandTotal : subtotalNormal + platformFee;

  const activeTier = activeSeats[0]?.tier || 'VIP';
  const categoryInfo = getCategory(pricingConfig, activeTier);
  const activePkgCode = quote?.package || (activeSeats.length === 3 ? 'GROUP' : activeSeats.length === 2 ? 'COUPLE' : 'SINGLE');
  const pkgInfo = getPackage(pricingConfig, activePkgCode);

  const displaySeconds =
    isPaid && stoppedAtSeconds !== null ? stoppedAtSeconds : holdSecondsRemaining;

  return (
    <div className="space-y-6 text-left">
      {/* 5-Minute Hold Countdown Bar (Stops Immediately When Paid!) */}
      {isPaid ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase">
                ✓ Pembayaran Lunas — Waktu Hold Kursi Dihentikan!
              </div>
              <div className="text-[11px] text-white font-medium">
                Kursi resmi menjadi milik Anda (SOLD) & tercatat otomatis di Database Admin Panitia.
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase">Waktu Berhenti Pada</div>
            <div className="font-extrabold text-base text-emerald-400">
              {Math.floor(displaySeconds / 60)}:
              {(displaySeconds % 60).toString().padStart(2, '0')} (STOPPED)
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 space-y-2.5 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase">
                  Batas Waktu Pembayaran (5:00 Atomic Hold Lock)
                </div>
                <div className="text-[11px] text-white font-medium">
                  Selesaikan pembayaran sebelum waktu habis. Begitu Anda membayar, timer akan langsung berhenti.
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-center shrink-0">
              <div className="text-[10px] text-slate-400 uppercase">Sisa Waktu</div>
              <div className="font-extrabold text-lg text-amber-400">
                {Math.floor(displaySeconds / 60)}:
                {(displaySeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/[0.08]">
            <div
              className="bg-amber-400 h-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (displaySeconds / 300) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Binding Card */}
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/[0.1] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <BrandMark sizePx={18} />
              <h3 className="text-xs font-mono font-extrabold text-white uppercase">
                Data Identitas Pembeli (KYC Terikat)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              VERIFIED ACCOUNT
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
              <span className="text-slate-400">Nama Lengkap:</span>
              <span className="font-bold text-white">{currentUser?.name}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
              <span className="text-slate-400">Akun Google:</span>
              <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                {currentUser?.email}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
              <span className="text-slate-400">NIK KTP:</span>
              <span className="text-white font-semibold">
                {currentUser?.nik || currentUser?.maskedNik || '3273011508990001'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center">
              <span className="text-slate-400">Jumlah Kursi Transaksi:</span>
              <span className="text-emerald-400 font-bold">
                {activeSeats.length} / {config.maxSeatsPerUser} Kursi
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Order Summary with Transparent Discount Engine */}
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/[0.1] space-y-4 font-mono text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rincian Tagihan & Diskon Otomatis</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Paket: <strong className="text-emerald-400">{pkgInfo?.name || activePkgCode}</strong> ({activeSeats.length} Kursi {activeTier})
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-white/[0.08] text-slate-300">
                {isPaid ? 'STATUS: LUNAS' : 'STATUS: MENUNGGU BAYAR'}
              </span>
            </div>

            <div className="space-y-2">
              {/* Selected Seats */}
              <div className="space-y-1">
                {activeSeats.map((s) => (
                  <div
                    key={s.id}
                    className="p-2 rounded-xl bg-slate-950 border border-white/[0.08] flex justify-between items-center"
                  >
                    <span className="text-white font-semibold">
                      Kursi {s.id} ({s.tier})
                    </span>
                    <span className="text-slate-300 font-bold">{formatRupiah(categoryInfo?.basePrice || s.price)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal Normal */}
              <div className="flex justify-between items-center text-slate-400 pt-1">
                <span>Subtotal Harga Dasar</span>
                <span className="text-white font-semibold">{formatRupiah(subtotalNormal)}</span>
              </div>

              {/* Category Discount (e.g. Early Bird) */}
              {quote && quote.categoryDiscountTotal > 0 && (
                <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Diskon Kategori ({categoryInfo?.discountLabel || 'Promo'})</span>
                  </span>
                  <span className="font-bold">-{formatRupiah(quote.categoryDiscountTotal)}</span>
                </div>
              )}

              {/* Package Discount (e.g. Couple 5% / Group 10%) */}
              {quote && quote.packageDiscountTotal > 0 && (
                <div className="flex justify-between items-center text-cyan-400 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Diskon Paket {pkgInfo?.name} ({quote.packageDiscountPercent}%)</span>
                  </span>
                  <span className="font-bold">-{formatRupiah(quote.packageDiscountTotal)}</span>
                </div>
              )}

              {/* Total Savings Badge */}
              {totalSavings > 0 && (
                <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex justify-between items-center text-emerald-300 font-bold text-[11px]">
                  <span>Total Penghematan Diskon:</span>
                  <span>Hemat {formatRupiah(totalSavings)}</span>
                </div>
              )}

              {/* Platform Service Fee */}
              <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/[0.08]">
                <span>Biaya Layanan & Tiket Kriptografi</span>
                <span className="text-white font-semibold">{formatRupiah(platformFee)}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex justify-between items-center text-sm font-extrabold text-emerald-400 mt-4">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-normal">Total Tagihan Final</div>
              <span className="text-xs text-white">Setelah Seluruh Diskon</span>
            </div>
            <span className="text-lg font-bold">{formatRupiah(totalAmount)}</span>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

