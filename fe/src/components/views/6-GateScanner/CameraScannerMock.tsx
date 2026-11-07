import React, { useState, useEffect } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { GateApi, UniversalGateTicket } from '../../../services/gate.api';
import { GateScanResult } from '../../../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  ShieldCheck,
  Fingerprint,
  QrCode,
  User as UserIcon,
  CreditCard,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

export const CameraScannerMock: React.FC = () => {
  const { currentUser, refreshTickets, addToast } = useTicketing();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [universalTickets, setUniversalTickets] = useState<UniversalGateTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<UniversalGateTicket | null>(null);
  const [scanResult, setScanResult] = useState<GateScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<GateScanResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const loadUniversalTickets = async (q: string = searchQuery) => {
    setIsSearching(true);
    try {
      const results = await GateApi.searchUniversalTickets(q);
      setUniversalTickets(results);

      // Update selectedTicket with fresh status/signature if already selected
      if (selectedTicket) {
        const updated = results.find((r) => r.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      } else if (results.length > 0 && !selectedTicket) {
        setSelectedTicket(results[0]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadUniversalTickets('');
    const interval = setInterval(() => {
      loadUniversalTickets(searchQuery);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUniversalTickets(searchQuery);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute real scan against PostgreSQL GateLog & Ticket table
  const handleScanSelectedTicket = async (mode: 'LIVE_VALID' | 'EXPIRED_SCREENSHOT' | 'FORGED_SIGNATURE' = 'LIVE_VALID') => {
    if (!selectedTicket) return;
    setIsLoading(true);
    try {
      let payloadStr = selectedTicket.rawQrPayload;
      let extra: any = {
        ticketId: selectedTicket.id,
        signature: selectedTicket.digitalSignature,
        timeWindow: selectedTicket.timeWindow,
        directIdentityVerify: mode === 'LIVE_VALID',
      };

      if (mode === 'EXPIRED_SCREENSHOT') {
        const oldTw = Math.floor(Date.now() / 30000) - 25;
        payloadStr = JSON.stringify({
          app: 'OZIKTIX',
          tid: selectedTicket.id,
          seat: selectedTicket.seatId,
          uid: selectedTicket.userId,
          tw: oldTw,
          totp: '000999',
          sig: 'expired_screenshot_signature_000',
          v: '2026.1',
        });
        extra = {
          ticketId: selectedTicket.id,
          signature: 'expired_screenshot_signature_000',
          timeWindow: oldTw,
          directIdentityVerify: false,
        };
      } else if (mode === 'FORGED_SIGNATURE') {
        payloadStr = JSON.stringify({
          app: 'OZIKTIX',
          tid: 'TIX-PALSU-9999',
          seat: selectedTicket.seatId,
          uid: 'scalper_forged',
          tw: Math.floor(Date.now() / 30000),
          totp: '000000',
          sig: 'forged_invalid_hmac_signature',
          v: '2026.1',
        });
        extra = {
          ticketId: 'TIX-PALSU-9999',
          signature: 'forged_invalid_hmac_signature',
          timeWindow: Math.floor(Date.now() / 30000),
          directIdentityVerify: false,
        };
      }

      const res = await GateApi.scanTicket(payloadStr, Date.now(), extra);

      const enriched: GateScanResult = {
        ...res,
        totpValid: res.verdict === 'VALID' || res.verdict === 'ALREADY_USED',
        identityMatch: res.verdict !== 'INVALID',
      };

      setScanResult(enriched);
      setScanHistory((prev) => [enriched, ...prev.slice(0, 14)]);

      if (res.verdict === 'VALID') {
        addToast(
          'success',
          '✅ Scan Gate VALID — Akses Diberikan!',
          `${selectedTicket.userName} (Kursi ${selectedTicket.seatId}) berhasil check-in & tercatat di Admin GateLog.`
        );
      } else if (res.verdict === 'ALREADY_USED') {
        addToast(
          'warning',
          '⚠️ Anti-Passback: Tiket Sudah Digunakan!',
          res.message || 'Tiket ini sudah pernah di-scan masuk sebelumnya.'
        );
      } else {
        addToast(
          'error',
          '❌ Scan Ditolak (INVALID)',
          res.message || 'Tanda tangan digital tidak valid atau tiket telah di-refund.'
        );
      }

      await Promise.all([loadUniversalTickets(searchQuery), refreshTickets()]);
    } catch {
      addToast('error', 'Scanner Error', 'Gagal menghubungi server verifikasi Gate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">
              Universal Gate Scanner (Identitas & TTD Digital)
            </h2>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
              UNIVERSAL ALL-USERS REGISTRY • Petugas: {currentUser?.name}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cari pengunjung dari seluruh akun berdasarkan **Nama, NIK KTP, Email, Kursi, atau Tanda Tangan Digital (HMAC-SHA256)** → Klik untuk rincian → Scan Validasi Masuk Gate!
          </p>
        </div>

        <button
          onClick={() => loadUniversalTickets(searchQuery)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-xs font-mono font-bold text-white hover:border-amber-400/50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync Universal Tiket ({universalTickets.length})</span>
        </button>
      </div>

      {/* Universal Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0b0f19] border border-white/[0.1] space-y-3 font-mono">
        <label className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>Pencarian Universal (Identitas KTP / Email / Kursi / Tanda Tangan Digital HMAC)</span>
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik Nama Lengkap, NIK KTP (3273...), Email Google, Kursi (VIP-A01), atau Hash TTD Digital..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-white/[0.12] text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Main 2-Column Universal Lookup + Detail & Scan Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (5 cols): Universal Ticket & Identity List */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-3 font-mono text-xs max-h-[620px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <span className="font-bold text-white uppercase">
              Daftar Tiket Seluruh User ({universalTickets.length})
            </span>
            <span className="text-[10px] text-slate-400">Klik untuk buka rincian</span>
          </div>

          {universalTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <QrCode className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-semibold text-white">Tidak Ada Tiket Ditemukan</p>
              <p className="text-[11px]">
                Belum ada tiket yang sesuai pencarian, atau pengunjung belum melakukan Checkout kursi.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {universalTickets.map((item) => {
                const isSelected = selectedTicket?.id === item.id;
                const statusBadge =
                  item.status === 'VALID' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                      BELUM SCAN (VALID)
                    </span>
                  ) : item.status === 'CHECKED_IN' ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
                      SUDAH CHECK-IN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[10px] font-bold">
                      {item.status}
                    </span>
                  );

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTicket(item);
                      setScanResult(null);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all space-y-2 ${
                      isSelected
                        ? 'bg-amber-500/15 border-2 border-amber-400 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-900 border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm text-emerald-400">
                        Kursi {item.seatId} ({item.tier})
                      </span>
                      {statusBadge}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {item.userAvatarUrl ? (
                        <img
                          src={item.userAvatarUrl}
                          alt={item.userName}
                          className="w-8 h-8 rounded-lg object-cover border border-white/[0.15] shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          {item.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{item.userName}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          NIK: {item.userNik} • {item.userEmail}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[200px]">
                        TTD: {item.digitalSignature.slice(0, 20)}...
                      </span>
                      <span className="text-amber-400 font-bold shrink-0">Pilih →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (7 cols): Detailed Identity & Digital Signature Inspector + Scan Trigger */}
        <div className="lg:col-span-7 space-y-5 font-mono">
          {!selectedTicket ? (
            <div className="p-10 rounded-3xl bg-[#0b0f19] border border-white/[0.08] text-center space-y-3">
              <Fingerprint className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Pilih Pengunjung atau Cari TTD Digital</h3>
              <p className="text-xs text-slate-400">
                Klik salah satu tiket pengunjung di sebelah kiri untuk membuka rincian identitas KTP, tanda tangan kriptografi HMAC-SHA256, dan melakukan verifikasi scan masuk Gate.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.1] space-y-5 text-xs">
              {/* Top Identity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  {selectedTicket.userAvatarUrl ? (
                    <img
                      src={selectedTicket.userAvatarUrl}
                      alt={selectedTicket.userName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400/60 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-extrabold text-lg shrink-0">
                      {selectedTicket.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase">
                      Rincian Identitas & Tanda Tangan Digital
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      {selectedTicket.userName}
                    </h3>
                    <div className="text-[11px] text-slate-400">{selectedTicket.userEmail}</div>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-left sm:text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase">Kursi Terikat</div>
                  <div className="text-base font-extrabold text-emerald-400">
                    {selectedTicket.seatId} ({selectedTicket.tier})
                  </div>
                </div>
              </div>

              {/* Complete Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-400" /> NIK KTP Resmi
                  </div>
                  <div className="font-bold text-white">{selectedTicket.userNik}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> Nomor HP / WhatsApp
                  </div>
                  <div className="font-bold text-white">{selectedTicket.userPhone || '-'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-emerald-400" /> Status Tiket Saat Ini
                  </div>
                  <div className="font-extrabold">
                    {selectedTicket.status === 'VALID' ? (
                      <span className="text-emerald-400">VALID (Siap Scan Masuk Gate)</span>
                    ) : selectedTicket.status === 'CHECKED_IN' ? (
                      <span className="text-amber-400">
                        SUDAH CHECK-IN ({selectedTicket.checkedInAt ? new Date(selectedTicket.checkedInAt).toLocaleTimeString('id-ID') : ''})
                      </span>
                    ) : (
                      <span className="text-rose-400">{selectedTicket.status} (Tidak Berlaku)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.08] space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Token Dinamis TOTP (30 Detik)
                  </div>
                  <div className="font-extrabold text-amber-400 tracking-widest">
                    {selectedTicket.totpNonce} (Window #{selectedTicket.timeWindow})
                  </div>
                </div>
              </div>

              {/* Cryptographic Digital Signature Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Tanda Tangan Digital (HMAC-SHA256 Signature)
                  </span>
                  <span className="text-slate-400">ID: {selectedTicket.id.slice(0, 14)}...</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0b0f19] border border-white/[0.06] text-[11px] text-emerald-400 break-all font-semibold">
                  {selectedTicket.digitalSignature}
                </div>
              </div>

              {/* Primary Universal Scan Button + Security Test Scenarios */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleScanSelectedTicket('LIVE_VALID')}
                  disabled={isLoading}
                  className="w-full py-4 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <QrCode className="w-5 h-5" />
                  <span>
                    {isLoading
                      ? 'Memverifikasi Identitas & TTD Digital...'
                      : 'Scan & Verifikasi Tiket Masuk Gate Sekarang'}
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleScanSelectedTicket('EXPIRED_SCREENSHOT')}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 font-bold text-[11px] transition-colors"
                  >
                    Uji Tolak Screenshot Lama (Expired TOTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScanSelectedTicket('FORGED_SIGNATURE')}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-bold text-[11px] transition-colors"
                  >
                    Uji Tolak TTD Digital Palsu (Counterfeit)
                  </button>
                </div>
              </div>

              {/* Live Verdict Banner */}
              {scanResult && (
                <div
                  className={`p-4 rounded-2xl border-2 space-y-1.5 animate-in fade-in duration-150 ${
                    scanResult.verdict === 'VALID'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400'
                      : scanResult.verdict === 'ALREADY_USED'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-400'
                      : 'bg-rose-500/15 border-rose-500 text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-extrabold text-sm uppercase">
                    {scanResult.verdict === 'VALID' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    {scanResult.verdict === 'ALREADY_USED' && <AlertTriangle className="w-5 h-5 shrink-0" />}
                    {scanResult.verdict === 'INVALID' && <XCircle className="w-5 h-5 shrink-0" />}
                    <span>HASIL SCAN GATE: {scanResult.verdict}</span>
                  </div>
                  <p className="text-xs text-white font-medium">{scanResult.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Scan History in Current Gate Session */}
          {scanHistory.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-2 text-xs">
              <div className="font-bold text-white uppercase text-[11px]">
                Riwayat Scan Sesi Ini ({scanHistory.length}) — Tersinkron ke Admin GateLog
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {scanHistory.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-white">{h.message}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        h.verdict === 'VALID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : h.verdict === 'ALREADY_USED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {h.verdict}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
