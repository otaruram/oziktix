import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { Seat } from '../../../types/ticketing';
import {
  ShieldAlert,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  Layers,
  Flame
} from 'lucide-react';

export const SeatMapView: React.FC = () => {
  const {
    seats,
    selectedSeatIds,
    selectSeat,
    deselectSeat,
    clearSelection,
    holdSecondsRemaining,
    currentUser,
    tickets,
    config,
    quotaWarning,
    simulateConcurrencyRace,
    setActiveTab,
  } = useTicketing();

  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isSimulatingConflict, setIsSimulatingConflict] = useState(false);

  // Group seats by rows
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  const getTierForRank = (row: string) => {
    if (row === 'A' || row === 'B') return { name: 'VIP', color: 'emerald', price: 250000 };
    if (row === 'C' || row === 'D') return { name: 'REGULAR', color: 'cyan', price: 150000 };
    return { name: 'FESTIVAL', color: 'purple', price: 100000 };
  };

  // Calculate current user active quota
  const userOwnedCount = currentUser
    ? tickets.filter(
      (t) => t.userId === currentUser.id && (t.status === 'ACTIVE' || t.status === 'USED')
    ).length
    : 0;

  const totalCommitted = userOwnedCount + selectedSeatIds.length;
  const isQuotaFull = totalCommitted >= config.maxSeatsPerUser;

  // Calculate total price of selected seats
  const selectedSeatsData = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeatsData.reduce((acc, s) => acc + s.price, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSeatClick = async (seat: Seat) => {
    // If seat is already selected by current user, clicking it toggles deselect
    if (selectedSeatIds.includes(seat.id)) {
      await deselectSeat(seat.id);
      return;
    }

    // If seat is sold or reserved by someone else
    if (seat.status === 'SOLD') return;
    if (seat.status === 'RESERVED' && seat.reservedByUserId !== currentUser?.id) return;

    await selectSeat(seat.id);
  };

  const handleRaceConditionSimulation = async () => {
    // Pick an available seat to simulate race condition
    const candidate = seats.find((s) => s.status === 'AVAILABLE' && !selectedSeatIds.includes(s.id));
    if (!candidate) return;

    setIsSimulatingConflict(true);
    await simulateConcurrencyRace(candidate.id);
    setIsSimulatingConflict(false);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              STAGE ATRIUM 6x10 MATRIX
            </span>
            <span className="text-xs text-slate-400">Summarecon Mall Bandung</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Interactive Atrium Seat Map
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optimistic row-level locking. Max {config.maxSeatsPerUser} seats per verified Google account.
          </p>
        </div>

        {/* Quota Tracker & Race Condition Simulator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* User Quota Indicator Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Account Quota:</span>
            <span
              className={`font-bold ${isQuotaFull ? 'text-amber-400' : 'text-emerald-400'
                }`}
            >
              {totalCommitted} / {config.maxSeatsPerUser} Seats
            </span>
            {isQuotaFull && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                MAX REACHED
              </span>
            )}
          </div>

          {/* Simulate 409 Race Condition Button */}
          <button
            onClick={handleRaceConditionSimulation}
            disabled={isSimulatingConflict}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono font-medium transition-all"
            title="Demonstrate atomic row-level concurrency lock when two buyers click simultaneously"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Concurrency (HTTP 409)</span>
          </button>
        </div>
      </div>

      {/* QA Point #1 Alert Banner: Quota Limit Enforcer */}
      {quotaWarning && (
        <div className="animate-in fade-in slide-in-from-top-2 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold tracking-wide uppercase font-mono text-amber-400">
              Anti-Scalping Rule Enforced
            </div>
            <p className="leading-relaxed">
              {quotaWarning}
            </p>
            <p className="text-[11px] text-amber-300/80">
              Current Google Account already owns {userOwnedCount} confirmed ticket(s) and {selectedSeatIds.length} active reservation(s). To select a different seat, please deselect an existing reservation.
            </p>
          </div>
        </div>
      )}

      {/* Main Seat Map Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Seat Map Matrix Canvas (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 flex flex-col items-center relative overflow-hidden shadow-xl">
          {/* Subtle Radial stage backlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-24 bg-gradient-to-b from-cyan-500/10 to-transparent blur-xl pointer-events-none" />

          {/* Stage Visual Header */}
          <div className="w-full max-w-2xl mb-10 text-center">
            <div className="relative py-3 px-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-md">
              <div className="text-xs font-mono font-bold tracking-[0.25em] text-slate-300 uppercase">
                GALA MAIN STAGE & PODIUM
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-2">
              Viewing direction: Front towards Atrium Stage
            </div>
          </div>

          {/* 6x10 Seat Matrix */}
          <div className="w-full max-w-2xl space-y-4">
            {rows.map((rowLetter) => {
              const tierInfo = getTierForRank(rowLetter);
              const rowSeats = seats.filter((s) => s.row === rowLetter);

              return (
                <div key={rowLetter} className="flex items-center gap-3">
                  {/* Row Letter Badge */}
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                    {rowLetter}
                  </div>

                  {/* 10 Seats Columns */}
                  <div className="grid grid-cols-10 gap-2 flex-1">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isSold = seat.status === 'SOLD';
                      const isReserved = seat.status === 'RESERVED';
                      const isMyHold = isReserved && seat.reservedByUserId === currentUser?.id;
                      const isOthersHold = isReserved && !isMyHold;

                      // Strict Semantic Status System
                      let statusBg = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 shadow-emerald-500/5';

                      if (isSelected || isMyHold) {
                        statusBg = 'bg-emerald-400 border-emerald-300 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 scale-105';
                      } else if (isSold) {
                        statusBg = 'bg-slate-950/80 border-rose-900/40 text-rose-500/60 cursor-not-allowed opacity-60';
                      } else if (isOthersHold) {
                        statusBg = 'bg-amber-500/10 border-amber-500/40 text-amber-400 cursor-not-allowed animate-pulse';
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          disabled={isSold || isOthersHold}
                          className={`h-9 rounded-lg border font-mono text-xs font-semibold flex items-center justify-center transition-all duration-150 relative ${statusBg}`}
                          title={`Seat ${seat.id} (${seat.tier}) - ${formatRupiah(seat.price)}`}
                        >
                          {/* Seat coordinate */}
                          <span>{seat.col}</span>

                          {/* Lock icon for others hold */}
                          {isOthersHold && (
                            <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-amber-400" />
                          )}

                          {/* Sold indicator dot */}
                          {isSold && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1 right-1"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tier Label (Right end) */}
                  <div className="w-16 text-right hidden sm:block">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {tierInfo.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strict Legend (Adhering to Semantic Status System) */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-center gap-6 text-xs font-mono">
            {/* Emerald Available */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-[10px]">
                •
              </span>
              <span className="text-slate-300">Available (Emerald)</span>
            </div>

            {/* Amber Reserved */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 text-[10px]">
                <Lock className="w-2.5 h-2.5" />
              </span>
              <span className="text-slate-300">Reserved (5m Lock)</span>
            </div>

            {/* Rose Sold */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-slate-950 border border-rose-900/60 flex items-center justify-center text-rose-500 text-[10px]">
                ✕
              </span>
              <span className="text-slate-400">Sold (Rose)</span>
            </div>

            {/* Selected Active */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-400 border border-emerald-300 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                ✓
              </span>
              <span className="text-emerald-400 font-semibold">Your Selection</span>
            </div>
          </div>
        </div>

        {/* Sidebar / Checkout Summary Panel (1 col) */}
        <div className="space-y-6">
          {/* Seat Inspector / Hover Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-3 border-b border-slate-800">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Seat Inspector</span>
            </div>

            {hoveredSeat ? (
              <div className="mt-4 space-y-3 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Coordinate:</span>
                  <span className="text-lg font-bold text-white">Seat {hoveredSeat.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Tier:</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    {hoveredSeat.tier}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Price:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatRupiah(hoveredSeat.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Status:</span>
                  <span
                    className={`text-xs font-bold ${hoveredSeat.status === 'AVAILABLE'
                        ? 'text-emerald-400'
                        : hoveredSeat.status === 'RESERVED'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                  >
                    {hoveredSeat.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500 italic">
                Hover over any seat on the grid to inspect tier pricing and live reservation status.
              </p>
            )}
          </div>

          {/* Selected Seats & Checkout Action Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Cart Hold ({selectedSeatIds.length})
              </span>
              {selectedSeatIds.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedSeatIds.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400">No seats selected yet</p>
                <p className="text-[11px] text-slate-500">
                  Click on up to 2 green available seats to reserve them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 5-Minute Hold Countdown Bar */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Hold TTL Timer:</span>
                    </span>
                    <span className="font-bold text-sm text-amber-400">
                      {Math.floor(holdSecondsRemaining / 60)}:
                      {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-1000"
                      style={{ width: `${(holdSecondsRemaining / 300) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-amber-400/80">
                    Seats are held with row-level locks. Complete checkout before timer hits 00:00.
                  </div>
                </div>

                {/* Selected Seat Badges */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSeatsData.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white mr-2">Seat {s.id}</span>
                        <span className="text-[10px] text-slate-400">{s.tier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{formatRupiah(s.price)}</span>
                        <button
                          onClick={() => deselectSeat(s.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                          title="Remove seat"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal */}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-mono">
                  <span className="text-xs text-slate-400">Subtotal:</span>
                  <span className="text-base font-bold text-emerald-400">{formatRupiah(subtotal)}</span>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={() => setActiveTab('checkout')}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
