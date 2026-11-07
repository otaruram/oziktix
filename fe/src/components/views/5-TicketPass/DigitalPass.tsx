import React, { useState, useEffect } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { useRotatingQr } from '../../../hooks/useRotatingQr';
import { QrCodeRenderer } from '../../common/QrCodeRenderer';
import { StatusBadge } from '../../common/StatusBadge';
import { SeatSwapModal } from './SeatSwapModal';
import { BrandMark } from '../../common/BrandLogo';
import { Ticket } from '../../../types';
import {
  ShieldCheck,
  RotateCw,
  Copy,
  ArrowRightLeft,
  Calendar,
  MapPin,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const DigitalPass: React.FC = () => {
  const {
    currentUser,
    tickets,
    refreshTickets,
    restartUserPlayground,
    isGateWindowActive,
    toggleGateWindow,
    addToast,
    setActiveTab,
  } = useTicketing();

  const [activeIdx, setActiveIdx] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  const displayTickets = tickets.filter(
    (t) =>
      t.userId === currentUser?.id ||
      (currentUser?.email && t.userEmail?.toLowerCase() === currentUser.email.toLowerCase())
  );

  const currentTicket: Ticket | undefined = displayTickets[activeIdx] || displayTickets[0];

  const { nonce, secondsRemaining, percentRemaining, qrPayload } = useRotatingQr(
    currentTicket || null
  );

  const handleCopySig = () => {
    if (!currentTicket) return;
    navigator.clipboard.writeText(currentTicket.hmacSignature);
    setCopied(true);
    addToast('success', 'HMAC Copied', 'Cryptographic signature copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentUser) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white font-mono">Sign In Required</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
          Digital passes are bound to verified identities. Please sign in to view your pass.
        </p>
      </div>
    );
  }

  if (displayTickets.length === 0) {
    return (
      <div className="py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-white/[0.08] text-slate-500 flex items-center justify-center mx-auto shadow-inner">
          <BrandMark sizePx={32} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white font-mono">No Tickets Issued Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
            No active tickets found for <span className="text-emerald-400 font-mono">{currentUser.email}</span>. Reserve your seat on the interactive atrium map to mint your cryptographic pass.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('seatmap')}
          className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold font-mono text-xs uppercase transition-colors shadow-lg shadow-emerald-500/10"
        >
          Explore Interactive Seat Map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Gate Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Live Cryptographic Digital Pass</h2>
          <p className="text-xs text-slate-400">
            Real-time HMAC-SHA256 signature + 30-second dynamic rotating TOTP token
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => restartUserPlayground()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/25 transition-colors"
            title="Hapus semua tiket & booking di playground Anda dan mulai ulang dari 0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Restart Simulasi dari 0</span>
          </button>

          <button
            onClick={() => refreshTickets()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-slate-900 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Pass</span>
          </button>

          <button
            onClick={toggleGateWindow}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${
              isGateWindowActive
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}
          >
            {isGateWindowActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isGateWindowActive ? 'Gate: Open (Live TOTP)' : 'Gate: Locked (Pre-T-2h)'}</span>
          </button>
        </div>
      </div>

      {/* Ticket Selector Tabs */}
      {displayTickets.length > 1 && (
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto no-scrollbar py-1">
          <span className="text-slate-500 shrink-0">Your Passes:</span>
          {displayTickets.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                activeIdx === i
                  ? 'bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-white/[0.08] hover:text-white'
              }`}
            >
              Seat {t.seatId} ({t.tier})
            </button>
          ))}
        </div>
      )}

      {currentTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Authentic Physical Pass Card (Hallmark Material Architecture) (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0b0f19] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6 relative">
            {/* Pass Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <BrandMark sizePx={20} />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  OZIKTIX PASS CERTIFICATE
                </span>
              </div>
              <StatusBadge status={currentTicket.status} size="sm" />
            </div>

            {/* Event Name & Metadata */}
            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {currentTicket.eventName}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {currentTicket.eventDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {currentTicket.eventVenue}
                </span>
              </div>
            </div>

            {/* Seat Coordinate Strip */}
            <div className="p-4 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Designated Seat
                </span>
                <div className="text-2xl font-mono font-extrabold text-white flex items-center gap-2">
                  <span>Seat {currentTicket.seatId}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {currentTicket.tier}
                  </span>
                </div>
                {currentTicket.swappedFromSeatId && (
                  <span className="text-[10px] font-mono text-purple-400 block mt-0.5">
                    Relocated from {currentTicket.swappedFromSeatId}
                  </span>
                )}
              </div>

              {currentTicket.status === 'ACTIVE' && currentTicket.swapCount === 0 && (
                <button
                  onClick={() => setIsSwapModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                  <span>Relocate (1x Free)</span>
                </button>
              )}
            </div>

            {/* Perforated Divider Line */}
            <div className="relative py-2">
              <div className="w-full border-b border-dashed border-white/[0.15]" />
              <div className="absolute -left-9 top-0.5 w-5 h-5 rounded-full bg-[#070a12]" />
              <div className="absolute -right-9 top-0.5 w-5 h-5 rounded-full bg-[#070a12]" />
            </div>

            {/* Dynamic QR Pass Section */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-white/[0.06] space-y-4">
              <QrCodeRenderer
                payload={qrPayload}
                size={190}
                isLocked={!isGateWindowActive}
                lockMessage="QR Activates 2 Hours Before Event"
              />

              {isGateWindowActive && (
                <div className="w-full max-w-xs space-y-2 text-center font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                      <span>Dynamic 30s Nonce:</span>
                    </span>
                    <span className="text-emerald-400 font-extrabold text-sm tracking-widest">
                      {nonce}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Rotates every 30s</span>
                    <span>{secondsRemaining}s remaining</span>
                  </div>
                </div>
              )}
            </div>

            {/* HMAC Signature Snippet */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/[0.08] font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Cryptographic HMAC-SHA256:</span>
                <button
                  onClick={handleCopySig}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-slate-400 break-all text-[10px] leading-tight select-all">
                {currentTicket.hmacSignature}
              </div>
            </div>
          </div>

          {/* Attendee Identity Verification Badge (Hallmark High Trust Rail) (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-4 font-mono text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white uppercase">Identity-Bound Verification</h3>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-white">{currentTicket.userName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] flex justify-between">
                  <span className="text-slate-500">Google Email:</span>
                  <span className="text-emerald-400 truncate max-w-[170px]">
                    {currentTicket.userEmail}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] flex justify-between">
                  <span className="text-slate-500">Masked NIK:</span>
                  <span className="text-white font-bold">{currentTicket.userMaskedNik}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] flex justify-between">
                  <span className="text-slate-500">Ticket Serial:</span>
                  <span className="text-cyan-400">{currentTicket.id}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-start gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Physical e-KTP or verified Google profile will be checked at Gate 01 alongside this live rotating pass.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat Swap Modal */}
      {currentTicket && (
        <SeatSwapModal
          ticket={currentTicket}
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
        />
      )}
    </div>
  );
};
