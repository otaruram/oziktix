import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { Seat } from '../../../types';
import { StageView } from './StageView';
import { Concurrency409Test } from './Concurrency409Test';
import { StatusBadge } from '../../common/StatusBadge';
import {
  formatRupiah,
  getCategory,
  computeUnitPrice,
  computeCategoryDiscount,
  CategoryCode,
  PackageCode,
} from '../../../utils/pricing';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Clock,
  Info,
  RefreshCw,
  RotateCcw,
  Check,
  X,
  UserCheck,
  Tag,
  Sparkles,
  Users,
  ShieldCheck,
  Ticket as TicketIcon,
  RotateCw,
} from 'lucide-react';

export const InteractiveGrid: React.FC = () => {
  const {
    seats,
    refreshSeats,
    selectedSeatIds,
    selectSeat,
    deselectSeat,
    clearSelection,
    restartUserPlayground,
    currentUser,
    tickets,
    config,
    quotaWarning,
    holdSecondsRemaining,
    setActiveTab,
    setIsAuthModalOpen,
    addToast,
    pricingConfig,
    selectedPackage,
    setSelectedPackage,
    currentQuote,
  } = useTicketing();

  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<CategoryCode | 'ALL'>('ALL');

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  const getTierForRank = (row: string) => {
    if (row === 'A' || row === 'B') {
      const cat = getCategory(pricingConfig, 'VIP');
      return { name: 'VIP', price: cat ? computeUnitPrice(cat) : 225000, basePrice: cat?.basePrice || 250000 };
    }
    if (row === 'C' || row === 'D') {
      const cat = getCategory(pricingConfig, 'REGULAR');
      return { name: 'REGULAR', price: cat ? computeUnitPrice(cat) : 150000, basePrice: cat?.basePrice || 150000 };
    }
    const cat = getCategory(pricingConfig, 'FESTIVAL');
    return { name: 'FESTIVAL', price: cat ? computeUnitPrice(cat) : 90000, basePrice: cat?.basePrice || 100000 };
  };

  const userOwnedCount = currentUser
    ? tickets.filter(
        (t) => t.userId === currentUser.id && (t.status === 'ACTIVE' || t.status === 'USED')
      ).length
    : 0;

  const hasMaxQuota = userOwnedCount >= config.maxSeatsPerUser;
  const remainingQuota = Math.max(0, config.maxSeatsPerUser - userOwnedCount);
  const isQuotaFull = selectedSeatIds.length >= remainingQuota;

  const selectedSeatsData = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeatsData.reduce((acc, s) => acc + s.price, 0);

  // Count states clearly for visual badges
  const soldSeatsCount = seats.filter((s) => s.status === 'SOLD').length;
  const bookedOthersCount = seats.filter(
    (s) => s.status === 'RESERVED' && !selectedSeatIds.includes(s.id) && s.reservedByUserId !== currentUser?.id
  ).length;
  const availableSeatsCount = Math.max(
    0,
    seats.length - soldSeatsCount - bookedOthersCount - selectedSeatIds.length
  );



  const handleRestartFromZero = async () => {
    setIsRestarting(true);
    try {
      await restartUserPlayground();
    } finally {
      setIsRestarting(false);
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (
      selectedSeatIds.includes(seat.id) ||
      (seat.status === 'RESERVED' && seat.reservedByUserId === currentUser.id)
    ) {
      await deselectSeat(seat.id);
      return;
    }

    if (seat.status === 'SOLD') {
      addToast(
        'warning',
        'Kursi Penuh / Sudah Dibeli (SOLD)',
        `Kursi ${seat.id} sudah berstatus PENUH di playground Anda. Klik "Restart Simulasi dari 0" jika ingin mengulang dari awal.`
      );
      return;
    }

    if (seat.status === 'RESERVED' && seat.reservedByUserId !== currentUser.id) {
      addToast(
        'error',
        'HTTP 409: Kursi Sedang Di-Booking',
        `Kursi ${seat.id} sedang ditahan sementara (Hold Lock). Pilih kursi lain yang berstatus KOSONG.`
      );
      return;
    }

    if (hasMaxQuota) {
      addToast(
        'warning',
        `Batas Kuota ${config.maxSeatsPerUser} Kursi Tercapai`,
        `Anda sudah memiliki ${userOwnedCount} tiket aktif (maksimal ${config.maxSeatsPerUser} tiket per akun). Sesuai kebijakan anti-calo Summarecon Mall Bandung, silakan gunakan tiket Anda di tab Tiket Pass.`
      );
      return;
    }

    if (isQuotaFull) {
      addToast(
        'warning',
        userOwnedCount > 0
          ? `Sisa Kuota: ${remainingQuota} Kursi`
          : `Maksimal ${config.maxSeatsPerUser} Kursi Dipilih`,
        userOwnedCount > 0
          ? `Anda sudah memiliki ${userOwnedCount} tiket aktif dan memilih ${selectedSeatIds.length} kursi. Batas kuota akun Anda adalah ${config.maxSeatsPerUser} tiket.`
          : `Anda sudah memilih ${selectedSeatIds.length} kursi (${selectedSeatIds.join(', ')}). Klik kursi yang dipilih jika ingin mengganti, atau langsung klik Lanjut ke Pembayaran!`
      );
      return;
    }

    const res = await selectSeat(seat.id);
    if (!res.success && res.error?.includes('409')) {
      addToast('error', 'HTTP 409 Conflict', 'HTTP 409: Kursi sedang dikunci sementara.');
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Isolated Personal Playground Banner + Restart From 0 Button */}
      <div className="p-4 rounded-2xl bg-[#0b0f19] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs space-y-0.5">
            <div className="font-mono font-extrabold text-white flex flex-wrap items-center gap-2">
              <span>Playground Simulasi Pribadi: {currentUser?.name || 'Pengunjung'}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px]">
                TERISOLASI PER AKUN
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Setiap kursi yang Anda pesan & bayar hanya berlaku di playground akun Anda sendiri (tidak menyebar ke user lain), namun tetap tercatat *real-time* di konsol **Panitia Admin**.
            </p>
          </div>
        </div>

        <button
          onClick={handleRestartFromZero}
          disabled={isRestarting}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-mono font-extrabold text-xs transition-all shrink-0 disabled:opacity-50"
          title="Hapus seluruh booking & tiket akun Anda dan ulangi simulasi dari 0"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
          <span>{isRestarting ? 'Mereset...' : 'Restart Simulasi dari 0'}</span>
        </button>
      </div>

      {/* Top Controls & Clear Status Counters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold">
            🟢 Kosong: {availableSeatsCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold">
            🟡 Di-Booking (Hold): {bookedOthersCount + selectedSeatIds.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold">
            🔴 Penuh (Sold): {soldSeatsCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white font-bold">
            Pilihan Anda: {selectedSeatIds.length} / {config.maxSeatsPerUser}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refreshSeats()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-slate-900 text-xs font-mono text-white hover:border-emerald-400/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <Concurrency409Test />
        </div>
      </div>

      {/* Maximum 3 Seats Quota Reached Banner (Anti-Scalper Policy) */}
      {hasMaxQuota && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3 font-mono">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-white font-extrabold text-sm uppercase flex items-center gap-2">
                <span>Batas Kuota Maksimal Tercapai ({userOwnedCount} / {config.maxSeatsPerUser} Kursi Dimiliki)</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                  ANTI-CALO
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                Sesuai kebijakan resmi anti-calo Summarecon Mall Bandung, 1 akun Google terverifikasi NIK dibatasi maksimal {config.maxSeatsPerUser} tiket. Anda telah memiliki {userOwnedCount} tiket aktif dan tidak dapat membeli kursi tambahan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1 font-sans">
            <button
              onClick={() => setActiveTab('tickets')}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <TicketIcon className="w-4 h-4" />
              <span>Buka E-Tiket Saya (Digital Pass TOTP 30s)</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/[0.15] font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5 text-purple-400" />
              <span>Tukar Kursi (1x Free Seat Swap)</span>
            </button>
            <button
              onClick={handleRestartFromZero}
              disabled={isRestarting}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[11px] transition-colors ml-auto"
            >
              {isRestarting ? 'Mereset...' : 'Reset Playground Demo'}
            </button>
          </div>
        </div>
      )}

      {/* Quota Alert Banner */}
      {quotaWarning && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold uppercase font-mono text-amber-400">
                Batas Maksimal Kuota Kursi ({config.maxSeatsPerUser} Kursi)
              </div>
              <div className="text-white font-medium">{quotaWarning}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedSeatIds.length > 0 && (
              <button
                onClick={() => setActiveTab('checkout')}
                className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-bold text-xs"
              >
                Lanjut ke Pembayaran →
              </button>
            )}
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.12] text-white font-mono text-xs"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Prominent Checkout Banner when seats are selected */}
      {selectedSeatIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/10 animate-in fade-in duration-150">
          <div className="space-y-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-extrabold text-[11px]">
                {selectedSeatIds.length} KURSI DIPILIH ({Math.floor(holdSecondsRemaining / 60)}:
                {(holdSecondsRemaining % 60).toString().padStart(2, '0')})
              </span>
              <span className="text-white font-bold text-sm">
                Kursi: {selectedSeatIds.join(', ')} • Subtotal: {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="text-slate-300 text-[11px] font-medium">
              Kursi sedang di-booking sementara untuk Anda. Klik tombol di kanan untuk menuju Halaman Pembayaran!
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('checkout')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-extrabold text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Lanjut ke Halaman Pembayaran (Checkout)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Kategori & Paket Tiket (Kebutuhan Summarecon #01 & #03) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0f19] border border-white/[0.1] space-y-4 font-mono text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm uppercase">
              Tahap 1: Pilih Kategori & Paket Tiket
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Sistem pengelompokan rapi anti-bingung sesuai standar Summarecon
          </span>
        </div>

        {/* Kategori Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pricingConfig.categories.map((c) => {
            const isSelected = filterCategory === c.code;
            const discount = computeCategoryDiscount(c);
            const unitPrice = computeUnitPrice(c);

            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setFilterCategory((prev) => (prev === c.code ? 'ALL' : c.code))}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-white/[0.08] hover:border-white/[0.2]'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-extrabold text-white text-sm">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.08] text-slate-300">
                    Row {c.rows.join(' & ')}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-400 font-extrabold text-sm">{formatRupiah(unitPrice)}</span>
                  {discount > 0 && (
                    <span className="text-slate-500 line-through text-[11px]">
                      {formatRupiah(c.basePrice)}
                    </span>
                  )}
                </div>
                {c.discountLabel && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    {c.discountLabel} (-{formatRupiah(discount)})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Paket Selection Pills */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">Paket Pesanan:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {pricingConfig.packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.code;
              const isExceedingQuota = pkg.seats > remainingQuota;
              return (
                <button
                  key={pkg.code}
                  type="button"
                  disabled={isExceedingQuota}
                  onClick={() => setSelectedPackage(pkg.code)}
                  title={
                    isExceedingQuota
                      ? `Melebihi sisa kuota Anda (${remainingQuota} kursi lagi)`
                      : undefined
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isExceedingQuota
                      ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-500 border border-white/[0.05]'
                      : isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20 font-extrabold'
                      : 'bg-slate-950 text-slate-300 border border-white/[0.1] hover:text-white'
                  }`}
                >
                  <span>{pkg.name}</span>
                  {isExceedingQuota ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                      Sisa Kuota: {remainingQuota}
                    </span>
                  ) : pkg.discountPercent > 0 ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                        isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      Hemat {pkg.discountPercent}%
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tahap 2 Helper Banner */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] text-[11px] text-slate-300 flex items-center justify-between">
          <div>
            <strong className="text-white">Tahap 2:</strong> Pilih nomor kursi pada denah di bawah{' '}
            {filterCategory !== 'ALL' && (
              <span className="text-emerald-400 font-bold">
                (Kategori {filterCategory} — Baris {filterCategory === 'VIP' ? 'A & B' : filterCategory === 'REGULAR' ? 'C & D' : 'E & F'})
              </span>
            )}
            . Kuota paket aktif: <strong className="text-cyan-400">{pricingConfig.packages.find((p) => p.code === selectedPackage)?.seats || 1} Kursi</strong>.
          </div>
          {filterCategory !== 'ALL' && (
            <button
              onClick={() => setFilterCategory('ALL')}
              className="text-xs text-slate-400 hover:text-white underline shrink-0 ml-2"
            >
              Tampilkan Semua Baris
            </button>
          )}
        </div>
      </div>

      {/* Grid Canvas + Cart Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Atrium Grid (3 cols) */}
        <div className="lg:col-span-3 rounded-3xl bg-[#0b0f19] border border-white/[0.08] p-5 sm:p-6 flex flex-col items-center">
          <StageView />

          {/* 6x10 Seat Matrix */}
          <div className="w-full max-w-xl space-y-3">
            {rows.map((rowLetter) => {
              const tier = getTierForRank(rowLetter);
              const rowSeats = seats.filter((s) => s.row === rowLetter);
              const isRowDimmed = filterCategory !== 'ALL' && tier.name !== filterCategory;

              return (
                <div
                  key={rowLetter}
                  className={`flex items-center gap-2.5 transition-opacity duration-300 ${
                    isRowDimmed ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {/* Row Letter */}
                  <div className="w-7 h-8 rounded-lg bg-slate-950 border border-white/[0.1] flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                    {rowLetter}
                  </div>

                  {/* 10 Seats */}
                  <div className="grid grid-cols-10 gap-1.5 flex-1">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isSold = seat.status === 'SOLD';
                      const isReserved = seat.status === 'RESERVED';
                      const isMyHold = isReserved && seat.reservedByUserId === currentUser?.id;
                      const isOthersHold = isReserved && !isMyHold;

                      let colorClass =
                        'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30';

                      if (isSelected || isMyHold) {
                        colorClass =
                          'bg-emerald-400 border-2 border-emerald-300 text-slate-950 font-extrabold scale-105 shadow-md shadow-emerald-400/25';
                      } else if (isSold) {
                        colorClass =
                          'bg-rose-500/25 border-2 border-rose-500 text-rose-400 font-extrabold cursor-not-allowed';
                      } else if (isOthersHold) {
                        colorClass =
                          'bg-amber-500/25 border-2 border-amber-400 text-amber-400 font-bold cursor-not-allowed animate-pulse';
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className={`h-9 sm:h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all relative ${colorClass}`}
                          title={
                            isSold
                              ? `${seat.id} — PENUH / SUDAH DIBELI`
                              : isOthersHold
                              ? `${seat.id} — DI-BOOKING SEMENTARA`
                              : isSelected
                              ? `${seat.id} — PILIHAN ANDA`
                              : `${seat.id} — KOSONG (${formatRupiah(seat.price)})`
                          }
                        >
                          <span className="leading-none">{seat.col}</span>
                          {isSold && (
                            <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5 font-extrabold">
                              PENUH
                            </span>
                          )}
                          {isOthersHold && (
                            <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5 font-extrabold flex items-center">
                              BOOK
                            </span>
                          )}
                          {(isSelected || isMyHold) && (
                            <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-slate-950 stroke-[3]" />
                          )}
                          {isOthersHold && (
                            <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-amber-400" />
                          )}
                          {isSold && (
                            <X className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-rose-400 stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tier Label */}
                  <div className="w-16 text-right hidden sm:block">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{tier.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* High-Contrast Legend */}
          <div className="mt-8 pt-4 border-t border-white/[0.08] w-full flex flex-wrap justify-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/60" />
              <span className="text-white font-semibold">Kosong (Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-300" />
              <span className="text-emerald-400 font-bold">Pilihan Anda</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500/25 border-2 border-amber-400" />
              <span className="text-amber-400 font-semibold">Di-Booking Sementara (Hold)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500/25 border-2 border-rose-500" />
              <span className="text-rose-400 font-bold">Penuh / Sudah Dibayar (Sold)</span>
            </div>
          </div>
        </div>

        {/* Cart Hold & Inspector Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Seat Inspector */}
          <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400 pb-2 border-b border-white/[0.08]">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white uppercase">Detail Status Kursi</span>
            </div>
            {hoveredSeat ? (
              <div className="mt-3 space-y-2">
                <div className="text-white font-extrabold text-sm">Kursi {hoveredSeat.id}</div>
                <div className="text-slate-400">Kategori: {hoveredSeat.tier}</div>
                <div className="text-emerald-400 font-bold">{formatRupiah(hoveredSeat.price)}</div>
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <StatusBadge status={hoveredSeat.status} size="sm" />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-slate-400 text-[11px]">
                Arahkan kursor atau sentuh kursi untuk melihat status (Kosong / Di-Booking / Penuh).
              </p>
            )}
          </div>

          {/* Cart Hold */}
          <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
              <div>
                <span className="font-bold text-white uppercase block">
                  Keranjang ({selectedSeatIds.length}/{config.maxSeatsPerUser})
                </span>
                <span className="text-[10px] text-cyan-400">
                  Paket: {currentQuote?.package || selectedPackage}
                </span>
              </div>
              {selectedSeatIds.length > 0 && (
                <button onClick={clearSelection} className="text-rose-400 hover:underline font-bold text-[11px]">
                  Kosongkan
                </button>
              )}
            </div>

            {selectedSeatIds.length === 0 ? (
              <p className="text-slate-400 italic py-4 text-center">
                Pilih kategori & paket di atas, lalu klik kursi hijau (Kosong).
              </p>
            ) : (
              <div className="space-y-3">
                {/* Hold Countdown */}
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 space-y-1.5">
                  <div className="flex justify-between items-center font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Waktu Booking:</span>
                    </span>
                    <span>
                      {Math.floor(holdSecondsRemaining / 60)}:
                      {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-1000"
                      style={{ width: `${(holdSecondsRemaining / 300) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Selected List */}
                <div className="space-y-1.5">
                  {selectedSeatsData.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-white/[0.08]"
                    >
                      <span className="text-white font-semibold">
                        {s.id} ({s.tier})
                      </span>
                      <span className="text-slate-300 font-bold">{formatRupiah(s.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Live Discount Calculation */}
                {currentQuote && currentQuote.totalSavings > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Harga Normal:</span>
                      <span className="line-through text-slate-500">{formatRupiah(currentQuote.subtotalNormal)}</span>
                    </div>
                    {currentQuote.categoryDiscountTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon Kategori:</span>
                        <span>-{formatRupiah(currentQuote.categoryDiscountTotal)}</span>
                      </div>
                    )}
                    {currentQuote.packageDiscountTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon Paket ({currentQuote.packageDiscountPercent}%):</span>
                        <span>-{formatRupiah(currentQuote.packageDiscountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-emerald-500/20 text-white">
                      <span>Total Hemat:</span>
                      <span className="text-emerald-300 font-extrabold">Hemat {formatRupiah(currentQuote.totalSavings)}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.08] flex justify-between font-extrabold text-white text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-400">
                    {formatRupiah(currentQuote ? currentQuote.grandTotal : subtotal + (selectedSeatIds.length * 5000))}
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('checkout')}
                  className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold uppercase transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Ke Halaman Pembayaran</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {userOwnedCount > 0 && (
              <div className="pt-3 border-t border-white/[0.08]">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold text-xs"
                >
                  Lihat {userOwnedCount} Tiket Saya (Digital Pass) →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
