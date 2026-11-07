import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { BrandMark } from '../../common/BrandLogo';
import { 
  Clock, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const {
    seats,
    selectedSeatIds,
    holdSecondsRemaining,
    isHoldExpired,
    currentUser,
    checkout,
    setActiveTab,
    clearSelection,
  } = useTicketing();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va'>('qris');

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const platformFee = selectedSeats.length * 5000; // Rp 5,000 per seat
  const totalAmount = subtotal + platformFee;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePayNow = async () => {
    setIsProcessing(true);
    // Simulate brief payment gateway network handshake
    setTimeout(async () => {
      await checkout();
      setIsProcessing(false);
    }, 1200);
  };

  if (selectedSeatIds.length === 0 || isHoldExpired) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No Active Reservation Hold</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isHoldExpired
              ? 'Your 5-minute hold time expired and the seats were automatically returned to the public pool to prevent scalper holding.'
              : 'You have not selected any seats yet. Please choose available seats on the atrium grid.'}
          </p>
        </div>
        <button
          onClick={() => setActiveTab('seatmap')}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Seat Map</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 text-left">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('seatmap')}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seat Map</span>
        </button>

        {/* Live 5:00 Hold Countdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Hold Expires in:</span>
          <span className="font-bold text-amber-400">
            {Math.floor(holdSecondsRemaining / 60)}:
            {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Identity Binding & Payment Method (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Identity Binding Card (QA Point #2) */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BrandMark sizePx={20} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Identity Binding & Anti-Scalping Hash
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                VERIFIED GOOGLE ID
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To eradicate unauthorized ticket re-selling, each ticket issued will be cryptographically bound via <code className="text-emerald-400 font-mono">HMAC-SHA256</code> to this verified Google Account and masked National ID.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Attendee Name</span>
                <div className="text-white font-semibold mt-0.5">{currentUser?.name}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Google Account</span>
                <div className="text-white font-semibold mt-0.5 truncate">{currentUser?.email}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Masked National ID (NIK)</span>
                <div className="text-emerald-400 font-bold mt-0.5">{currentUser?.maskedNik}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Registered Phone</span>
                <div className="text-slate-300 font-semibold mt-0.5">{currentUser?.phone}</div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector (QRIS Sandbox) */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <span>Select Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">QRIS Instant</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      Zero Fee
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    BCA, Mandiri, GoPay, OVO, ShopeePay, Dana
                  </p>
                </div>
                {paymentMethod === 'qris' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                  paymentMethod === 'va'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Virtual Account</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      Auto Detect
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    BCA VA, Mandiri Livin, BRI, BNI
                  </p>
                </div>
                {paymentMethod === 'va' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Sandbox QRIS Preview Mock */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center">
                {/* Visual QR mock */}
                <div className="w-full h-full border-2 border-slate-900 rounded grid grid-cols-4 gap-1 p-1">
                  <div className="bg-slate-900 col-span-2 row-span-2"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900 col-span-2"></div>
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Sandbox Instant Payment Gateway</span>
                </div>
                <p className="text-slate-400">
                  Ready to test. Clicking "Authorize Payment" simulates an instant 200 OK webhook confirmation and issues cryptographic passes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono pb-3 border-b border-slate-800">
              Order Summary
            </h3>

            {/* Selected Seats Itemized */}
            <div className="space-y-3 font-mono text-xs">
              {selectedSeats.map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-bold text-white">Seat {s.id}</span>
                    <span className="text-[10px] text-slate-400 block">{s.tier} Atrium</span>
                  </div>
                  <span className="text-slate-200">{formatRupiah(s.price)}</span>
                </div>
              ))}

              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>Platform & Service Fee</span>
                <span>{formatRupiah(platformFee)}</span>
              </div>

              {/* Total Calculation */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Total Amount:</span>
                <span className="font-extrabold text-emerald-400 text-base">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing HMAC Cryptographic Ticket...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Issue Passes</span>
                </>
              )}
            </button>

            <div className="text-[10px] font-mono text-center text-slate-400">
              100% Guaranteed Anti-Scalp Protected • Non-transferable
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

