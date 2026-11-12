import React, { useState, useEffect } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { AdminApi } from '../../../services/admin.api';
import { Ticket, SwapLog } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { MetricsRow } from './MetricsRow';
import { VenueMiniMap } from './VenueMiniMap';
import { PricingDiscountManager } from './PricingDiscountManager';
import {
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  Users,
  Ticket as TicketIcon,
  ArrowLeftRight,
  UserCheck,
  Activity,
  Clock,
  QrCode,
  Tag,
} from 'lucide-react';

export const AttendeeTable: React.FC = () => {
  const { tickets, refreshTickets, refreshSeats, addToast, currentUser } = useTicketing();

  const [attendees, setAttendees] = useState<Ticket[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [swapLogs, setSwapLogs] = useState<SwapLog[]>([]);
  const [gateLogs, setGateLogs] = useState<any[]>([]);
  const [globalHolds, setGlobalHolds] = useState<any[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'stream' | 'users' | 'tickets' | 'swaps' | 'pricing'>('stream');

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [isRefunding, setIsRefunding] = useState<string | null>(null);
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [ticketList, userList, swaps, gLogs, holdsList] = await Promise.all([
        AdminApi.getAttendees(),
        AdminApi.getUsers(),
        AdminApi.getSwapLogs(),
        AdminApi.getGateLogs(),
        AdminApi.getHolds(),
      ]);
      setAttendees(ticketList);
      setRegisteredUsers(userList);
      setSwapLogs(swaps);
      setGateLogs(gLogs);
      setGlobalHolds(holdsList);
    } catch {
      setAttendees(tickets);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    refreshSeats();
    const interval = setInterval(() => {
      fetchAllAdminData();
      refreshSeats();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefund = async (ticketId: string) => {
    setIsRefunding(ticketId);
    try {
      const res = await AdminApi.refundTicket(ticketId);
      if (res.success) {
        addToast(
          'success',
          '1-Click Refund Berhasil!',
          `Tiket ${ticketId.slice(0, 10)}... telah di-refund. Kursi ${res.seatId} dikembalikan menjadi KOSONG di playground pemiliknya.`
        );
        await Promise.all([fetchAllAdminData(), refreshTickets(), refreshSeats()]);
      } else {
        addToast('error', 'Refund Gagal', res.error || 'Tidak dapat memproses refund');
      }
    } finally {
      setIsRefunding(null);
    }
  };

  const handleVerifyUserKyc = async (userId: string, fullName: string) => {
    setVerifyingUserId(userId);
    try {
      const res = await AdminApi.verifyUserKyc(userId);
      if (res.success) {
        addToast(
          'success',
          'Pengajuan Identitas Disetujui',
          `Data resmi KTP/NIK milik ${fullName} telah diverifikasi oleh Admin Panitia.`
        );
        await fetchAllAdminData();
      } else {
        addToast('error', 'Gagal Verifikasi KYC', 'Tidak dapat memperbarui status KYC user.');
      }
    } finally {
      setVerifyingUserId(null);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const blob = await AdminApi.downloadExportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smb_atrium_attendees_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'CSV Export Selesai', 'File manifest seluruh pengunjung berhasil diunduh dari PostgreSQL.');
    } catch {
      addToast('error', 'Export Error', 'Gagal mengunduh CSV.');
    }
  };

  const filteredTickets = attendees.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.seatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || t.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">Panitia Administrative Console</h2>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-400 text-[10px] font-mono font-bold">
              GLOBAL MULTI-USER MONITOR • Admin: {currentUser?.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Admin memantau seluruh booking kursi, pengajuan identitas KYC, pembayaran tiket, pindah kursi, & scan gate dari semua playground user secara *real-time*.
          </p>
        </div>

        <button
          onClick={fetchAllAdminData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.1] bg-slate-900 text-xs font-mono font-bold text-white hover:border-sky-400/50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Live Metrics Row */}
      <MetricsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Console Panel (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-5">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setActiveAdminTab('stream')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeAdminTab === 'stream'
                    ? 'bg-emerald-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Semua Alur User (Live)</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('users')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeAdminTab === 'users'
                    ? 'bg-emerald-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Pengajuan KYC ({registeredUsers.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('tickets')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeAdminTab === 'tickets'
                    ? 'bg-sky-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <TicketIcon className="w-3.5 h-3.5" />
                <span>2. Pembayaran & Tiket ({attendees.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('swaps')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeAdminTab === 'swaps'
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>3. Swap & Gate ({swapLogs.length + gateLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('pricing')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeAdminTab === 'pricing'
                    ? 'bg-emerald-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>4. Pengaturan Harga & Diskon</span>
              </button>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold font-mono text-xs transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* TAB 0: UNIFIED END-TO-END USER ACTIVITY STREAM */}
          {activeAdminTab === 'stream' && (
            <div className="space-y-5 font-mono text-xs">
              {/* Step A: Active Seat Holds Across ALL Users */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-400 uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Booking Sementara Aktif dari Seluruh Playground User ({globalHolds.length})</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">
                    LIVE HOLD LOCK
                  </span>
                </div>
                {globalHolds.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">
                    Tidak ada kursi yang sedang ditahan sementara saat ini. Begitu user mengklik kursi di Seat Map, datanya langsung muncul di sini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {globalHolds.map((h) => {
                      const remSec = h.expiresAt
                        ? Math.max(0, Math.ceil((new Date(h.expiresAt).getTime() - Date.now()) / 1000))
                        : 300;
                      return (
                        <div
                          key={h.id}
                          className="p-3 rounded-xl bg-[#0b0f19] border border-amber-500/40 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white">
                              Kursi {h.seatId} {h.isSimulatedOther ? '(Simulasi 409)' : ''}
                            </div>
                            <div className="text-[10px] text-emerald-400 truncate">
                              {h.userName || 'User'} ({h.userEmail})
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs shrink-0">
                            {Math.floor(remSec / 60)}:{(remSec % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step B: Latest KYC Onboarding Submissions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase">
                    <UserCheck className="w-4 h-4" />
                    <span>1. Pengajuan Identitas Resmi User / KYC ({registeredUsers.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('users')}
                    className="text-[11px] text-emerald-400 underline font-bold"
                  >
                    Kelola KYC →
                  </button>
                </div>
                {registeredUsers.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">Belum ada pengajuan identitas KYC masuk.</p>
                ) : (
                  <div className="space-y-2">
                    {registeredUsers.slice(0, 5).map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="w-8 h-8 rounded-lg object-cover border border-emerald-400/50 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                              {(u.fullName || 'U').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">
                              {u.fullName} <span className="text-[10px] text-emerald-400">({u.role})</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {u.email} • NIK: {u.nik || '3273011508990001'} • HP: {u.phone}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {u.kycStatus === 'VERIFIED' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                              ✓ KYC DISETUJUI
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyUserKyc(u.id, u.fullName)}
                              disabled={verifyingUserId === u.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px]"
                            >
                              {verifyingUserId === u.id ? 'Memproses...' : 'Setujui KYC'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step C: Latest Paid Checkouts & Issued Tickets */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sky-400 uppercase">
                    <TicketIcon className="w-4 h-4" />
                    <span>2. Pembayaran Checkout & Tiket Terbit Seluruh User ({attendees.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('tickets')}
                    className="text-[11px] text-sky-400 underline font-bold"
                  >
                    Kelola Semua Tiket →
                  </button>
                </div>
                {attendees.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">Belum ada tiket yang di-checkout.</p>
                ) : (
                  <div className="space-y-2">
                    {attendees.slice(0, 6).map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">
                            <span className="text-emerald-400">Kursi {t.seatId}</span> ({t.tier}) • {t.userName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {t.userEmail} • ID: {t.id.slice(0, 14)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <StatusBadge status={t.status} size="sm" />
                          {t.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleRefund(t.id)}
                              disabled={isRefunding === t.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 text-[10px] font-bold"
                            >
                              {isRefunding === t.id ? 'Refunding...' : '1-Click Refund'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step D: Latest Swap & Gate Scans */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-400 uppercase">
                    <QrCode className="w-4 h-4" />
                    <span>3. Pindah Kursi & Verifikasi Scan Gate ({swapLogs.length + gateLogs.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('swaps')}
                    className="text-[11px] text-amber-400 underline font-bold"
                  >
                    Lihat Detail Audit →
                  </button>
                </div>
                {swapLogs.length === 0 && gateLogs.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">
                    Belum ada aktivitas pindah kursi atau scan Gate masuk.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gateLogs.slice(0, 3).map((g: any) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">
                            [SCAN GATE] {g.attendeeName} • Kursi {g.seatId}
                          </div>
                          <div className="text-[10px] text-slate-400">{g.reason}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.result === 'GRANTED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : g.result === 'ALREADY_USED'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {g.result}
                        </span>
                      </div>
                    ))}
                    {swapLogs.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">
                            [SWAP KURSI] {s.userName}: <span className="text-rose-400">{s.fromSeatId}</span> →{' '}
                            <span className="text-emerald-400">{s.toSeatId}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{s.reason}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(s.timestamp).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: REGISTERED USERS & KYC SUBMISSIONS */}
          {activeAdminTab === 'users' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-white flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Daftar pengajuan identitas resmi (KTP/NIK, No. HP, Foto, & Akun Google asli) yang dikirim oleh pengguna ke Core Database.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 text-[10px] uppercase">
                      <th className="py-2.5 px-2">Pengguna & Foto</th>
                      <th className="py-2.5 px-2">NIK KTP & No. HP</th>
                      <th className="py-2.5 px-2">Role Aktif</th>
                      <th className="py-2.5 px-2">Status Pengajuan</th>
                      <th className="py-2.5 px-2">Verifikasi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {registeredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Belum ada user terdaftar.
                        </td>
                      </tr>
                    ) : (
                      registeredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.fullName}
                                  className="w-9 h-9 rounded-xl object-cover border border-emerald-400/50 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                                  {(u.fullName || 'U').charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{u.fullName}</div>
                                <div className="text-[10px] text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="text-emerald-400 font-semibold">NIK: {u.nik || '3273011508990001'}</div>
                            <div className="text-[10px] text-slate-400">{u.phone}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-white/[0.1] text-white text-[10px] font-bold">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            {u.kycStatus === 'VERIFIED' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                ✓ TERVERIFIKASI ADMIN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
                                PENGAJUAN MASUK
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            {u.kycStatus !== 'VERIFIED' ? (
                              <button
                                onClick={() => handleVerifyUserKyc(u.id, u.fullName)}
                                disabled={verifyingUserId === u.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px] transition-colors"
                              >
                                {verifyingUserId === u.id ? 'Memproses...' : 'Setujui KYC'}
                              </button>
                            ) : (
                              <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDEE TICKETS & INSTANT 1-CLICK REFUND */}
          {activeAdminTab === 'tickets' && (
            <>
              <div className="flex gap-2 font-mono text-xs">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari ID tiket, nama pengunjung, kursi, atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-white/[0.1] rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="ALL">Semua Tier</option>
                  <option value="VIP">VIP</option>
                  <option value="REGULAR">Regular</option>
                  <option value="FESTIVAL">Festival</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 text-[10px] uppercase">
                      <th className="py-2.5 px-2">Ticket ID</th>
                      <th className="py-2.5 px-2">Kursi</th>
                      <th className="py-2.5 px-2">Pengunjung</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Belum ada tiket yang diterbitkan. Silakan pilih kursi di Seat Map dan lakukan Checkout.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-2 font-bold text-white">{t.id.slice(0, 12)}...</td>
                          <td className="py-2.5 px-2">
                            <span className="text-emerald-400 font-bold">Seat {t.seatId}</span>
                            <span className="text-[10px] text-slate-400 block">{t.tier}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="text-white font-semibold">{t.userName}</div>
                            <div className="text-[10px] text-slate-400">{t.userEmail}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <StatusBadge status={t.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-2">
                            {t.status !== 'REVOKED' ? (
                              <button
                                onClick={() => handleRefund(t.id)}
                                disabled={isRefunding === t.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold transition-colors disabled:opacity-50"
                              >
                                {isRefunding === t.id ? 'Refunding...' : '1-Click Refund'}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Refunded</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: ATOMIC SWAP LOGS & GATE SCAN LOGS */}
          {activeAdminTab === 'swaps' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="space-y-2.5">
                <div className="font-bold text-sky-400 uppercase flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>Riwayat Verifikasi Scan Gate Barrier ({gateLogs.length})</span>
                </div>
                {gateLogs.length === 0 ? (
                  <div className="py-4 px-4 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-400 italic">
                    Belum ada riwayat scan tiket di Gate Scanner. Pindah ke role Gate Scanner untuk menguji scan identitas / TTD digital!
                  </div>
                ) : (
                  gateLogs.map((g: any) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {g.attendeeName} ({g.seatId}) • Status:{' '}
                          <span
                            className={
                              g.result === 'GRANTED'
                                ? 'text-emerald-400'
                                : g.result === 'ALREADY_USED'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {g.result}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {g.reason || 'HMAC & TOTP Verified'} • Gate: {g.gateName}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {g.scannedAt ? new Date(g.scannedAt).toLocaleTimeString('id-ID') : 'Baru saja'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Riwayat Pindah Kursi / Atomic Seat Swap ({swapLogs.length})</span>
                </div>
                {swapLogs.length === 0 ? (
                  <div className="py-4 px-4 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-400 italic">
                    Belum ada riwayat pindah kursi (Atomic Seat Swap).
                  </div>
                ) : (
                  swapLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {log.userName} • <span className="text-rose-400">{log.fromSeatId}</span> →{' '}
                          <span className="text-emerald-400">{log.toSeatId}</span> ({log.tier})
                        </div>
                        <div className="text-[10px] text-slate-400">{log.reason}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRICING & DISCOUNT CONFIGURATION (SUMMARECON #03) */}
          {activeAdminTab === 'pricing' && <PricingDiscountManager />}
        </div>

        {/* Venue Mini-Map (1 col) */}
        <div className="space-y-4">
          <VenueMiniMap />
        </div>
      </div>
    </div>
  );
};
