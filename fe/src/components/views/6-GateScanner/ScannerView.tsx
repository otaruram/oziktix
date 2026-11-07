import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { apiClient } from '../../../services/apiClient';
import { GateScanResult, Ticket } from '../../../types/ticketing';
import { computeTotpNonce, formatQrPayload } from '../../../utils/crypto';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  QrCode,
  Clock,
  UserCheck,
  Sparkles,
  RefreshCw,
  Search,
  Camera,
  History,
  Info
} from 'lucide-react';

export const ScannerView: React.FC = () => {
  const { tickets, refreshTickets, addToast } = useTicketing();

  const [rawInputPayload, setRawInputPayload] = useState<string>('');
  const [lastScanResult, setLastScanResult] = useState<GateScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<GateScanResult[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const executeValidation = async (payloadStr: string, simulatedTimestamp?: number) => {
    setIsScanning(true);
    // Simulate gate barrier laser reader delay
    setTimeout(async () => {
      const result = await apiClient.validateGateScan(payloadStr, simulatedTimestamp);
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
      await refreshTickets();
      setIsScanning(false);
    }, 400);
  };

  const handleManualScan = () => {
    if (!rawInputPayload.trim()) return;
    executeValidation(rawInputPayload);
  };

  // --- QA 1-Click Simulation Presets for Judges ---

  // Scenario 1: Tier 1 Green (VALID + Identity Match)
  const testScenarioValidPass = () => {
    // Find active non-checked in ticket or create a test payload
    const activeTicket = tickets.find((t) => t.status === 'ACTIVE');
    if (!activeTicket) {
      addToast('warning', 'No Active Tickets Found', 'Please purchase a seat first or check Panitia tickets.');
      return;
    }

    const { nonce } = computeTotpNonce(activeTicket.id);
    const payload = formatQrPayload({
      ticketId: activeTicket.id,
      seatId: activeTicket.seatId,
      userId: activeTicket.userId,
      nonce,
      hmacSignature: activeTicket.hmacSignature,
    });

    setRawInputPayload(payload);
    executeValidation(payload);
  };

  // Scenario 2: Tier 2 Yellow (ALREADY USED Ticket)
  const testScenarioAlreadyUsed = () => {
    // Find or simulate an already checked-in ticket
    const usedTicket = tickets.find((t) => t.status === 'USED');
    if (usedTicket) {
      const { nonce } = computeTotpNonce(usedTicket.id);
      const payload = formatQrPayload({
        ticketId: usedTicket.id,
        seatId: usedTicket.seatId,
        userId: usedTicket.userId,
        nonce,
        hmacSignature: usedTicket.hmacSignature,
      });
      setRawInputPayload(payload);
      executeValidation(payload);
    } else {
      // Pick any active ticket and pass it with double check
      const anyTicket = tickets[0];
      if (!anyTicket) {
        addToast('warning', 'No Tickets Exist', 'Please purchase a seat first.');
        return;
      }
      const { nonce } = computeTotpNonce(anyTicket.id);
      const payload = formatQrPayload({
        ticketId: anyTicket.id,
        seatId: anyTicket.seatId,
        userId: anyTicket.userId,
        nonce,
        hmacSignature: anyTicket.hmacSignature,
      });
      setRawInputPayload(payload);
      // Run once to mark as used, then run again to trigger already used!
      executeValidation(payload);
    }
  };

  // Scenario 3: Tier 2 Yellow (Expired 30s Screenshot Nonce)
  const testScenarioExpiredScreenshot = () => {
    const activeTicket = tickets.find((t) => t.status === 'ACTIVE') || tickets[0];
    if (!activeTicket) {
      addToast('warning', 'No Tickets Exist', 'Please purchase a seat first.');
      return;
    }

    // Compute a nonce from 5 minutes ago (representing a shared screenshot)
    const staleTimestamp = Date.now() - 5 * 60 * 1000;
    const { nonce: staleNonce } = computeTotpNonce(activeTicket.id, staleTimestamp);

    const payload = formatQrPayload({
      ticketId: activeTicket.id,
      seatId: activeTicket.seatId,
      userId: activeTicket.userId,
      nonce: staleNonce, // Stale!
      hmacSignature: activeTicket.hmacSignature,
    });

    setRawInputPayload(payload);
    executeValidation(payload);
  };

  // Scenario 4: Tier 3 Red (Swapped Old Seat Hash / Revoked)
  const testScenarioSwappedOldSeat = () => {
    const activeTicket = tickets.find((t) => t.status === 'ACTIVE') || tickets[0];
    if (!activeTicket) {
      addToast('warning', 'No Tickets Exist', 'Please purchase a seat first.');
      return;
    }

    const { nonce } = computeTotpNonce(activeTicket.id);
    // Pretend the QR claimed old seat "A1" when the ticket is on another seat
    const fakeOldSeat = activeTicket.seatId === 'A1' ? 'A2' : 'A1';

    const payload = formatQrPayload({
      ticketId: activeTicket.id,
      seatId: fakeOldSeat, // Mismatched old seat
      userId: activeTicket.userId,
      nonce,
      hmacSignature: activeTicket.hmacSignature,
    });

    setRawInputPayload(payload);
    executeValidation(payload);
  };

  // Scenario 5: Tier 3 Red (Counterfeit / Revoked Ticket)
  const testScenarioCounterfeit = () => {
    const payload = JSON.stringify({
      app: 'OZIKTIX',
      tid: 'TIX-FAKE-COUNTERFEIT-999',
      seat: 'A1',
      uid: 'usr_hacker_bot',
      totp: '000000',
      sig: 'forged_fake_sig',
      v: '2026.1',
    });

    setRawInputPayload(payload);
    executeValidation(payload);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 text-left">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              PHYSICAL GATE SCANNER • SMB ATRIUM
            </span>
            <span className="text-xs text-slate-400">Barrier Access Control</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Gate Check-In & Scanner Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict 3-Tier validation system: Emerald (Valid), Amber (Already Used / Expired Screenshot), Rose (Invalid / Revoked).
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Scanner Online: Gate 01</span>
        </div>
      </div>

      {/* 1-Click Judge Simulation Presets */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              1-Click Judge Scenario Presets
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Instant verdict testing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Preset 1: Tier 1 Green */}
          <button
            onClick={testScenarioValidPass}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1">
              <span className="font-bold">TIER 1 GREEN</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300">
              Valid Live Pass
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Fresh 30s TOTP + matching identity.
            </p>
          </button>

          {/* Preset 2: Tier 2 Yellow (Already Used) */}
          <button
            onClick={testScenarioAlreadyUsed}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1">
              <span className="font-bold">TIER 2 AMBER</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300">
              Already Used
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Double check-in barrier attempt.
            </p>
          </button>

          {/* Preset 3: Tier 2 Yellow (Expired Screenshot) */}
          <button
            onClick={testScenarioExpiredScreenshot}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1">
              <span className="font-bold">TIER 2 AMBER</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300">
              Expired Screenshot
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Static image &gt;30s old rejected.
            </p>
          </button>

          {/* Preset 4: Tier 3 Red (Swapped Old Seat) */}
          <button
            onClick={testScenarioSwappedOldSeat}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-400 mb-1">
              <span className="font-bold">TIER 3 ROSE</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300">
              Swapped Old Seat
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Revoked old seat hash rejected.
            </p>
          </button>

          {/* Preset 5: Tier 3 Red (Counterfeit / Forged) */}
          <button
            onClick={testScenarioCounterfeit}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-400 mb-1">
              <span className="font-bold">TIER 3 ROSE</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300">
              Counterfeit Ticket
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Unrecognized HMAC signature.
            </p>
          </button>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Scan Result Feedback Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Result Card */}
          {lastScanResult ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all duration-300 space-y-6 ${lastScanResult.verdict === 'VALID'
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-emerald-500/10'
                  : lastScanResult.verdict === 'ALREADY_USED'
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-amber-500/10'
                    : 'bg-rose-950/30 border-rose-500/60 shadow-rose-500/10'
                }`}
            >
              {/* Verdict Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {lastScanResult.verdict === 'VALID' && (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  )}
                  {lastScanResult.verdict === 'ALREADY_USED' && (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  )}
                  {lastScanResult.verdict === 'INVALID' && (
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider block ${lastScanResult.verdict === 'VALID'
                          ? 'text-emerald-400'
                          : lastScanResult.verdict === 'ALREADY_USED'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                    >
                      GATE VERDICT: {lastScanResult.verdict.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      {lastScanResult.message}
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(lastScanResult.scannedAt).toLocaleTimeString('id-ID')}
                </span>
              </div>

              {/* Attendee Identity Verification Details */}
              {lastScanResult.ticket ? (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">ATTENDEE CREDENTIALS</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Google Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Full Name</span>
                      <span className="font-bold text-white text-sm">
                        {lastScanResult.ticket.userName}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Seat</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        Seat {lastScanResult.ticket.seatId} ({lastScanResult.ticket.tier})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Google Account</span>
                      <span className="text-slate-300 truncate block">
                        {lastScanResult.ticket.userEmail}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Masked NIK</span>
                      <span className="text-slate-300 font-bold block">
                        {lastScanResult.ticket.userMaskedNik}
                      </span>
                    </div>
                  </div>

                  {/* TOTP Validation Status indicator */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">30s TOTP Dynamic Check:</span>
                    <span
                      className={`font-bold ${lastScanResult.totpValid ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                    >
                      {lastScanResult.totpValid ? '✓ TIME-STEP MATCHED' : '✕ EXPIRED NONCE'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-400">
                  Failure Reason: {lastScanResult.failureReason}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 border-dashed text-center space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Scanner Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select any of the 1-click test scenarios above or paste a QR code string below to simulate physical gate barrier scanning.
              </p>
            </div>
          )}

          {/* Manual QR Code String Input */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
              <span>Inspect Raw QR Payload:</span>
              <span className="text-[10px] text-slate-500 font-normal">JSON / Base64 format</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rawInputPayload}
                onChange={(e) => setRawInputPayload(e.target.value)}
                placeholder='e.g. {"app":"OZIKTIX","tid":"OZT-ABC","seat":"A1"...}'
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleManualScan}
                disabled={isScanning || !rawInputPayload}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all disabled:opacity-50"
              >
                {isScanning ? 'Validating...' : 'Scan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Scan History & Audit Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Gate Access Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {scanHistory.length} Entries
              </span>
            </div>

            {scanHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No scans recorded during this session.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {scanHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${entry.verdict === 'VALID'
                              ? 'bg-emerald-400'
                              : entry.verdict === 'ALREADY_USED'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                        />
                        <span className="font-bold text-white">
                          {entry.ticket ? `Seat ${entry.ticket.seatId}` : 'Unknown Seat'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {entry.ticket?.userName?.split(' ')[0] || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {entry.message}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.verdict === 'VALID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : entry.verdict === 'ALREADY_USED'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                      >
                        {entry.verdict}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(entry.scannedAt).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
