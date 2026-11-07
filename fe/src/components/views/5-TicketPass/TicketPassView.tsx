import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTicketing } from '../../../context/TicketingStore';
import { Ticket, Seat } from '../../../types/ticketing';
import { computeTotpNonce, formatQrPayload } from '../../../utils/crypto';
import {
  ShieldCheck,
  Clock,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  ArrowRightLeft,
  Sparkles,
  X,
  Ticket as TicketIcon,
  UserCheck,
  Calendar,
  MapPin
} from 'lucide-react';

export const TicketPassView: React.FC = () => {
  const {
    currentUser,
    tickets,
    seats,
    totpSecondsRemaining,
    isGateWindowActive,
    toggleGateWindow,
    swapSeat,
    setActiveTab,
    addToast,
  } = useTicketing();

  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedNewSeatId, setSelectedNewSeatId] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Filter user's tickets
  const userTickets = tickets.filter((t) => t.userId === currentUser?.id);
  const currentTicket: Ticket | undefined = userTickets[activeTicketIndex] || userTickets[0];

  // Dynamic TOTP Nonce calculation for current ticket
  const totpData = currentTicket ? computeTotpNonce(currentTicket.id) : null;

  // Available seats for swapping within SAME tier
  const swapCandidateSeats: Seat[] = currentTicket
    ? seats.filter((s) => s.tier === currentTicket.tier && s.status === 'AVAILABLE')
    : [];

  const handleCopySignature = () => {
    if (!currentTicket) return;
    navigator.clipboard.writeText(currentTicket.hmacSignature);
    setCopiedHash(true);
    addToast('success', 'HMAC Copied', 'Cryptographic signature copied to clipboard.');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExecuteSwap = async () => {
    if (!currentTicket || !selectedNewSeatId) return;
    setIsSwapping(true);
    const res = await swapSeat(currentTicket.id, selectedNewSeatId);
    setIsSwapping(false);
    if (res.success) {
      setIsSwapModalOpen(false);
      setSelectedNewSeatId(null);
    }
  };

  if (userTickets.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <TicketIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No E-Tickets Found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not currently hold any active gala tickets under account {currentUser?.email}. Reserve seats on the atrium grid to generate cryptographic passes.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('seatmap')}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2"
        >
          <span>Select Seats on Grid</span>
        </button>
      </div>
    );
  }

  const qrPayload = currentTicket && totpData
    ? formatQrPayload({
      ticketId: currentTicket.id,
      seatId: currentTicket.seatId,
      userId: currentTicket.userId,
      nonce: totpData.nonce,
      hmacSignature: currentTicket.hmacSignature,
    })
    : '';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 text-left">
      {/* Header & Gate Window Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              ANTI-SCALPER CRYPTOGRAPHIC PASS
            </span>
            <span className="text-xs text-slate-400">RFC 6238 TOTP Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Dynamic E-Ticket Pass
          </h2>
        </div>

        {/* Gate Window Simulator Toggle */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${isGateWindowActive
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}
          >
            {isGateWindowActive ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>QR Gate Window: Active (Live Rotating QR)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>QR Gate Window: Pre-T-2h (Locked)</span>
              </>
            )}
          </div>

          <button
            onClick={toggleGateWindow}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
            title="Toggle Gate Window to test Pre-T-2 Hours locked view vs Live Rotating QR view"
          >
            Toggle Window
          </button>
        </div>
      </div>

      {/* Ticket Selector Tabs (if user owns multiple seats) */}
      {userTickets.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Your Tickets:</span>
          {userTickets.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setActiveTicketIndex(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${activeTicketIndex === idx
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
            >
              Seat {t.seatId} ({t.tier})
            </button>
          ))}
        </div>
      )}

      {currentTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main E-Ticket Visual Card (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0d1322] to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Radial top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-[80px] pointer-events-none" />

            {/* Top Pass Brand Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white tracking-wide">
                    OZIKTIX PASS
                  </div>
                  <div className="text-[10px] text-slate-400">Summarecon Mall Bandung</div>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${currentTicket.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : currentTicket.status === 'USED'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
              >
                {currentTicket.status === 'ACTIVE' ? 'READY FOR SCAN' : currentTicket.status}
              </span>
            </div>

            {/* Event Info */}
            <div className="py-4 space-y-1">
              <h3 className="text-xl font-extrabold text-white">
                {currentTicket.eventName}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  {currentTicket.eventDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {currentTicket.eventVenue}
                </span>
              </div>
            </div>

            {/* Seat Coordinate Callout Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between my-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Designated Seat
                </span>
                <div className="text-3xl font-mono font-extrabold text-white flex items-center gap-2">
                  <span>Seat {currentTicket.seatId}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {currentTicket.tier}
                  </span>
                </div>
                {currentTicket.swappedFromSeatId && (
                  <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 mt-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    Relocated from {currentTicket.swappedFromSeatId}
                  </span>
                )}
              </div>

              {/* QA Point #4: Wrong Seat Relocate Button */}
              {currentTicket.status === 'ACTIVE' && currentTicket.swapCount === 0 && (
                <button
                  onClick={() => setIsSwapModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-mono text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Wrong seat? Relocate to another available seat in the same tier once for free"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                  <span>Relocate Seat (1x Free)</span>
                </button>
              )}
            </div>

            {/* Live QR Pass Area */}
            <div className="p-6 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
              {/* If Gate Window is INACTIVE: Show Pre-Gate Locked State */}
              {!isGateWindowActive ? (
                <div className="py-8 px-4 flex flex-col items-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-lg">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm font-mono uppercase tracking-wide text-slate-900">
                      QR Activates 2 Hours Before Event
                    </div>
                    <p className="text-xs text-slate-600 max-w-xs">
                      15 Nov 2026 at 17:00 WIB. To prevent early scalper leaks, dynamic TOTP QR code remains locked until gate opens.
                    </p>
                  </div>
                  <button
                    onClick={toggleGateWindow}
                    className="mt-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-400 hover:bg-slate-800 transition-colors"
                  >
                    Simulate Gate Open (T-2h)
                  </button>
                </div>
              ) : (
                /* Gate Window ACTIVE: Show Live Rotating TOTP QR */
                <div className="space-y-4 flex flex-col items-center">
                  <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
                    <QRCodeSVG
                      value={qrPayload}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* 30-Second Rotating Nonce Badge */}
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="flex items-center gap-1 text-slate-700">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Dynamic Nonce:</span>
                      </span>
                      <span className="text-base text-emerald-700 tracking-widest font-black">
                        {totpData?.nonce}
                      </span>
                    </div>

                    {/* Circular or linear 30s progress countdown */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-1000 ease-linear"
                          style={{
                            width: `${((totpData?.secondsRemaining ?? 30) / 30) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Rotates every 30s</span>
                        <span>{totpData?.secondsRemaining}s remaining</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 italic">
                      Screenshots strictly invalid. Dynamic token checked live by Gate Scanner.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Signature & Hash Details */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>HMAC-SHA256 Signature:</span>
                </span>
                <button
                  onClick={handleCopySignature}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-slate-300 break-all select-all text-[10px] leading-tight">
                {currentTicket.hmacSignature}
              </div>
            </div>
          </div>

          {/* Right: Identity Verification & Security Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Identity-Bound Verification Badge (QA Point #2) */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Identity-Bound Verification
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Gate officers verify that the presenter matches the authenticated Google identity tied to this ticket:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Registered Name:</span>
                  <span className="font-bold text-white">{currentTicket.userName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Google Email:</span>
                  <span className="font-bold text-emerald-400 truncate max-w-[200px]">
                    {currentTicket.userEmail}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Masked NIK:</span>
                  <span className="font-bold text-white">{currentTicket.userMaskedNik}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Ticket Serial:</span>
                  <span className="text-cyan-400 font-semibold">{currentTicket.id}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Physical e-KTP or Google account profile must be presented alongside this dynamic QR pass.
                </span>
              </div>
            </div>

            {/* Quick Test Scanner Shortcut */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-white">Test Check-In Verification</h4>
                <p className="text-[11px] text-slate-400">Switch to Gate Scanner view to test scanning this live pass.</p>
              </div>
              <button
                onClick={() => setActiveTab('scanner')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-semibold transition-colors"
              >
                Go to Gate Scanner →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QA Point #4: Atomic Seat Swap Modal */}
      {isSwapModalOpen && currentTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1322] border border-slate-800 p-6 shadow-2xl space-y-6 text-left">
            <button
              onClick={() => setIsSwapModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider">
                  QA Point #4: Atomic Relocation
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Relocate Seat (1x Free Swap)
              </h3>
              <p className="text-xs text-slate-400">
                Current Seat: <span className="font-bold text-white">{currentTicket.seatId}</span> ({currentTicket.tier} Tier).
                Select any currently <span className="text-emerald-400">AVAILABLE</span> seat in the same tier.
              </p>
            </div>

            {/* Available Seats in Same Tier Grid */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400">
                Available {currentTicket.tier} Seats:
              </span>

              {swapCandidateSeats.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  No other seats are currently available in the {currentTicket.tier} tier.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                  {swapCandidateSeats.map((cand) => (
                    <button
                      key={cand.id}
                      onClick={() => setSelectedNewSeatId(cand.id)}
                      className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${selectedNewSeatId === cand.id
                          ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/50'
                        }`}
                    >
                      {cand.id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Atomic Action Confirmation Note */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Atomic Transaction Guarantees:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                <li>Seat {currentTicket.seatId} immediately returns to emerald AVAILABLE on the map.</li>
                <li>New seat is marked SOLD to your account.</li>
                <li>Previous QR signature is revoked. If someone presents the old seat QR, the gate scanner will reject it.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSwap}
                disabled={!selectedNewSeatId || isSwapping}
                className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isSwapping ? 'Relocating...' : `Confirm Swap to ${selectedNewSeatId || '...'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
