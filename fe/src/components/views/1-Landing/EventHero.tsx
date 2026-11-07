import React, { useState, useEffect } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { SeatApi } from '../../../services/seat.api';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  RotateCw,
  CheckCircle2,
  Sparkles,
  UserCheck,
  QrCode,
  LayoutDashboard,
  MapPin,
  Calendar,
  Database,
  ArrowLeftRight,
  FileCheck2,
  Terminal,
  Sun,
  Moon,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    tag: 'TAHAP 1 • GOOGLE OAUTH GATE',
    title: 'Login Wajib Menggunakan Akun Google Pengguna',
    dbTable: 'Supabase Auth + public."User"',
    description:
      'Setiap pengunjung wajib melakukan autentikasi dengan akun Google terlebih dahulu. Tanpa login Google yang sah, formulir pengajuan identitas dan peta kursi terkunci sepenuhnya.',
    image:
      'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=900&auto=format&fit=crop&q=80',
    highlights: [
      'Mencegah bot calo otomatis sejak gerbang pertama',
      'Mengikat sesi langsung ke email Google terverifikasi',
      'Membuka akses ke Tahap 2 (Formulir Resmi KYC)',
    ],
  },
  {
    step: '02',
    tag: 'TAHAP 2 • OFFICIAL KYC SUBMISSION',
    title: 'Isi Form Resmi (NIK, No. HP, Foto) → Dikirim ke Admin',
    dbTable: 'public."User" (RLS Enabled)',
    description:
      'Setelah login Google berhasil, pengguna wajib mengisi Nama Lengkap sesuai KTP, 16 digit NIK, Nomor HP/WhatsApp, serta mengunggah Foto Identitas. Saat klik Konfirmasi, pengajuan langsung dikirim ke Dashboard Admin Panitia.',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&auto=format&fit=crop&q=80',
    highlights: [
      'Tersedia tombol ⚡ 1-Click Auto-Fill untuk kemudahan demo',
      'Mendukung upload foto langsung dari HP / Laptop',
      'Langsung muncul di tab "Pengajuan Identitas User (KYC)" pada Admin Console',
    ],
  },
  {
    step: '03',
    tag: 'TAHAP 3 • ATOMIC SEAT LOCK (MAX 2)',
    title: 'Pilih Kursi Atrium (60 Kursi Fisik) & Kunci 5 Menit',
    dbTable: 'public."Seat" (RLS Enabled)',
    description:
      'Pengguna memilih maksimal 2 kursi di Main Atrium Summarecon Mall Bandung (VIP, Regular, atau Festival). Sistem mengunci baris di PostgreSQL selama 5:00 menit (300 detik) dan menolak tabrakan dengan HTTP 409 Conflict.',
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80',
    highlights: [
      'Jatah kuota ketat: Maksimal 2 kursi per akun Google',
      'Jika sudah checkout 1 kursi, sisa jatah otomatis menjadi 1 kursi',
      'Banner Checkout & 1-Click Bayar langsung muncul saat kursi diklik',
    ],
  },
  {
    step: '04',
    tag: 'TAHAP 4 • 30s TOTP PASS & ATOMIC SWAP',
    title: 'Digital Pass HMAC-SHA256 Berputar Tiap 30 Detik + Pindah Kursi',
    dbTable: 'public."Ticket" & public."SwapLog"',
    description:
      'Setelah checkout, e-tiket diterbitkan dengan tanda tangan kriptografi HMAC-SHA256 dan token TOTP yang berubah setiap 30 detik. Screenshot statis otomatis kedaluwarsa. Salah pilih kursi? Bisa pindah kursi 1x gratis!',
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80',
    highlights: [
      'QR berputar setiap 30 detik (Anti-Screenshot Calo)',
      '1x Free Atomic Seat Relocation dalam tier yang sama',
      'Saat pindah kursi, kursi lama kembali AVAILABLE & QR lama dicabut',
    ],
  },
  {
    step: '05',
    tag: 'TAHAP 5 • GATE SCANNER & PANITIA CONSOLE',
    title: 'Verifikasi 3-Tier di Gate Barrier & Persetujuan Admin',
    dbTable: 'public."GateLog" & Admin Console',
    description:
      'Petugas Gate memindai QR pengunjung dengan respons 3 warna: Hijau (VALID), Kuning (ALREADY USED / EXPIRED), atau Merah (INVALID / Counterfeit). Admin Panitia memverifikasi pengajuan KYC, melakukan 1-Click Refund, dan Export CSV.',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80',
    highlights: [
      '3-Tier Cryptographic Gate Verification tercatat di tabel GateLog',
      'Admin Dashboard menampilkan daftar pengajuan KYC lengkap dengan foto',
      '1-Click Refund langsung mengembalikan kursi menjadi AVAILABLE',
    ],
  },
];

export const EventHero: React.FC = () => {
  const { currentUser, setActiveTab, setIsAuthModalOpen, theme, toggleTheme } = useTicketing();

  const [summary, setSummary] = useState({
    total: 60,
    available: 60,
    sold: 0,
    held: 0,
  });
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const fetchLiveSummary = async () => {
    try {
      const data = await SeatApi.getSummary();
      setSummary(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchLiveSummary();
    const interval = setInterval(fetchLiveSummary, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterSystem = (targetTab: 'seatmap' | 'scanner' | 'admin' = 'seatmap') => {
    if (!currentUser || !currentUser.isOnboarded) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(targetTab);
  };

  const currentFlow = WORKFLOW_STEPS[activeStepIdx];

  return (
    <div className="w-full text-left select-none sm:select-auto">
      {/* ===================================================================== */}
      {/* SECTION 1: ANTISLOP HERO & ARCHITECTURAL SHOWCASE                     */}
      {/* ===================================================================== */}
      <section
        id="hero"
        className="relative w-full pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center space-y-5">
          {/* Top Pill Tag */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">SUMMARECON MALL BANDUNG</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">ATRIUM GALA 2026</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-sky-400">SUPABASE RLS ACTIVE</span>
          </div>

          {/* Antislop Display Headline with Sliding Monochrome Difference Highlight */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Sistem Tiket Kursi Interaktif &{' '}
            <span className="antislop-highlight">
              <span className="antislop-highlight-bg" />
              <span className="antislop-highlight-text">Check-In Kriptografi</span>
            </span>{' '}
            Tanpa Celah Calo.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
            Dirancang khusus untuk Main Atrium Summarecon Mall Bandung. Menggabungkan wajib{' '}
            <span className="text-white font-medium">Login Google</span>, verifikasi identitas resmi{' '}
            <span className="text-white font-medium">KTP/NIK ke Admin</span>, penguncian kursi atomik 5 menit, dan{' '}
            <span className="text-white font-medium">QR TOTP 30 detik</span>.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
            <button
              onClick={() => handleEnterSystem('seatmap')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm tracking-tight transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/15 active:scale-[0.98]"
            >
              <span>
                {currentUser && currentUser.isOnboarded
                  ? 'Buka Core App (Pilih Kursi Sekarang)'
                  : '1. Login Google & Isi Form Resmi KYC'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#flow"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-white/[0.12] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Pelajari Alur Kerja (5 Tahap)</span>
            </a>

            <a
              href="https://github.com/otaruram/oziktix"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-white/[0.15] font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              title="Buka Repository GitHub & Dokumentasi Arsitektur FAANG"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub Repo & Docs</span>
            </a>

            <button
              onClick={toggleTheme}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.12] font-mono text-xs transition-all flex items-center justify-center gap-2"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Mode Putih (Light)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>Mode Hitam (Dark)</span>
                </>
              )}
            </button>
          </div>

          {/* Live PostgreSQL Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 w-full max-w-3xl font-mono text-left">
            <div className="p-3.5 rounded-2xl bg-[#0b0f19] border border-white/[0.08]">
              <span className="text-[10px] text-slate-500 uppercase block">Kapasitas Fisik</span>
              <span className="text-sm sm:text-base font-bold text-white">{summary.total} Kursi</span>
              <span className="text-[10px] text-emerald-400 block">Row A–F (Matriks 6x10)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b0f19] border border-white/[0.08]">
              <span className="text-[10px] text-slate-500 uppercase block">Tersedia (Real-Time)</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                {summary.available} Available
              </span>
              <span className="text-[10px] text-slate-400 block">
                {summary.sold} Terjual • {summary.held} Ditahan
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b0f19] border border-white/[0.08]">
              <span className="text-[10px] text-slate-500 uppercase block">Batas Kuota</span>
              <span className="text-sm sm:text-base font-bold text-white">Maks 2 Kursi</span>
              <span className="text-[10px] text-amber-400 block">Per Akun Google & NIK</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b0f19] border border-white/[0.08]">
              <span className="text-[10px] text-slate-500 uppercase block">Database & RLS</span>
              <span className="text-sm sm:text-base font-bold text-sky-400">5 Tabel Aktif</span>
              <span className="text-[10px] text-emerald-400 block">✓ Supabase RLS Protected</span>
            </div>
          </div>
        </div>

        {/* Antislop Showcase Frame: Visual Preview of Venue & Cryptographic Pass */}
        <div className="w-full max-w-6xl mx-auto mt-10 sm:mt-12">
          <div className="rounded-3xl border border-white/[0.12] bg-[#0b0f19] overflow-hidden shadow-2xl">
            {/* Browser/Terminal Top Chrome */}
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/70 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-slate-400 text-[11px] truncate">
                  oziktix://summarecon-bandung-atrium/live-architecture
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PostgreSQL Live Sync
              </span>
            </div>

            {/* Visual Grid Inside Showcase Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left: Venue Photography + Overlay */}
              <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 text-left overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80"
                  alt="Summarecon Mall Bandung Atrium Gala"
                  className="absolute inset-0 w-full h-full object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="relative z-10 space-y-2 always-white">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400 text-slate-950 font-mono font-bold text-[10px] uppercase shadow-sm">
                    <MapPin className="w-3 h-3" /> Main Atrium, Summarecon Mall Bandung
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white always-white" style={{ color: '#ffffff' }}>
                    Konfigurasi 60 Kursi Eksklusif dengan Penguncian Baris Atomik
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 always-white max-w-xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                    Setiap kursi memiliki koordinat fisik nyata (`VIP-A01` hingga `FEST-F10`) yang dikunci langsung di tabel PostgreSQL `Seat` saat dipilih pengunjung.
                  </p>
                </div>
              </div>

              {/* Right: Live Mini Architecture Status */}
              <div className="lg:col-span-5 p-6 sm:p-7 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col justify-between space-y-4 text-left font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">
                    End-to-End Database Entities
                  </span>
                  <div className="text-sm font-bold text-white">
                    5 Tabel PostgreSQL dengan Row-Level Security (RLS)
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-300">1. public."User"</span>
                    <span className="text-emerald-400 text-[10px]">Google + NIK + Foto KYC</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-300">2. public."Seat"</span>
                    <span className="text-emerald-400 text-[10px]">60 Kursi • 5m Hold Lock</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-300">3. public."Ticket"</span>
                    <span className="text-cyan-400 text-[10px]">HMAC-SHA256 + Nonce</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-300">4. public."SwapLog"</span>
                    <span className="text-purple-400 text-[10px]">1x Free Seat Relocation</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-300">5. public."GateLog"</span>
                    <span className="text-amber-400 text-[10px]">3-Tier Scanner Audit</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEnterSystem('seatmap')}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Mulai Alur Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: INTERACTIVE END-TO-END WORKFLOW ("CARA KERJA SISTEM")      */}
      {/* ===================================================================== */}
      <section
        id="flow"
        className="antislop-section-glow w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              END-TO-END SYSTEM WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Bagaimana Cara Kerja{' '}
              <span className="antislop-highlight">
                <span className="antislop-highlight-bg" />
                <span className="antislop-highlight-text">OzikTix</span>
              </span>{' '}
              Secara Utuh?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Klik salah satu dari 5 tahapan di bawah untuk melihat visualisasi alur kerja dari Login Google, Pengajuan Form KYC ke Admin, hingga Scan QR di Gate Atrium.
            </p>
          </div>

          {/* Interactive 5-Step Selector Pills (Mobile & Desktop Friendly) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {WORKFLOW_STEPS.map((item, idx) => {
              const isActive = activeStepIdx === idx;
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/15 scale-[1.01]'
                      : 'bg-[#0b0f19] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className={isActive ? 'font-extrabold text-slate-950' : 'text-emerald-400 font-bold'}>
                      STEP {item.step}
                    </span>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-600'}`} />
                  </div>
                  <div className={`text-xs font-bold line-clamp-2 ${isActive ? 'text-slate-950' : 'text-white'}`}>
                    {item.title.split('→')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Visual Showcase Card */}
          <div className="rounded-3xl bg-[#0b0f19] border border-white/[0.12] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
            {/* Step Image */}
            <div className="lg:col-span-6 relative min-h-[260px] sm:min-h-[360px] bg-slate-950">
              <img
                src={currentFlow.image}
                alt={currentFlow.title}
                className="w-full h-full object-cover opacity-80 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                <span className="px-3 py-1 rounded-full bg-black/80 border border-white/[0.15] text-emerald-400 font-mono text-xs w-fit">
                  Database Target: {currentFlow.dbTable}
                </span>
              </div>
            </div>

            {/* Step Details */}
            <div className="lg:col-span-6 p-6 sm:p-9 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {currentFlow.tag}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                  {currentFlow.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {currentFlow.description}
                </p>

                <div className="pt-2 space-y-2">
                  {currentFlow.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-white/[0.06] text-xs font-mono text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveStepIdx((prev) => (prev - 1 + WORKFLOW_STEPS.length) % WORKFLOW_STEPS.length)
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white"
                  >
                    ← Tahap Sebelumnya
                  </button>
                  <button
                    onClick={() => setActiveStepIdx((prev) => (prev + 1) % WORKFLOW_STEPS.length)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white"
                  >
                    Tahap Berikutnya →
                  </button>
                </div>

                <button
                  onClick={() => handleEnterSystem('seatmap')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5"
                >
                  <span>Coba Tahap Ini Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: ANTISLOP PROTOCOL COMPARISON & CODE DIFF                   */}
      {/* ===================================================================== */}
      <section
        id="protocol"
        className="antislop-section-glow w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              ZERO TICKETING SLOP ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Mengapa Tiket Konvensional Gagal & Bagaimana{' '}
              <span className="antislop-highlight">
                <span className="antislop-highlight-bg" />
                <span className="antislop-highlight-text">OzikTix</span>
              </span>{' '}
              Menyelesaikannya
            </h2>
          </div>

          {/* Side-by-Side Comparison (Antislop Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Conventional Slop */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0f19] border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-sm font-bold text-rose-400 font-mono uppercase">
                  ✕ Sistem Tiket Biasa (Rawan Calo)
                </span>
                <span className="text-xs font-mono text-slate-500">Tanpa Proteksi</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-400 font-mono">
                <li className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300">
                  - QR Code statis (PDF/Screenshot) mudah digandakan & dijual ulang oleh calo.
                </li>
                <li className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300">
                  - Race condition saat ribuan orang mengklik kursi yang sama (double booking).
                </li>
                <li className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300">
                  - Akun anonim tanpa verifikasi Google & NIK KTP ke Admin Panitia.
                </li>
              </ul>
            </div>

            {/* Right: OzikTix Engine */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0f19] border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-sm font-bold text-emerald-400 font-mono uppercase">
                  ✓ OzikTix Cryptographic Engine
                </span>
                <span className="text-xs font-mono text-emerald-400">Bandung Build 2026</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300 font-mono">
                <li className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  + QR berputar setiap 30 detik (HMAC-SHA256 + TOTP). Screenshot statis ditolak di Gate!
                </li>
                <li className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  + Atomic SQL Row Lock (5:00 TTL) + batas ketat maksimal 2 kursi per akun Google.
                </li>
                <li className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  + Wajib Login Google → Isi Form Resmi KYC & Foto → Diverifikasi di Admin Console.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: ATRIUM SEATING TIERS & PRICING                             */}
      {/* ===================================================================== */}
      <section
        id="tiers"
        className="antislop-section-glow w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]"
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                SUMMARECON MALL BANDUNG • 60 PHYSICAL SEATS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                Kategori Kursi Main Atrium
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Maksimal pembelian 2 kursi per akun Google terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* VIP */}
            <div className="p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.1] flex flex-col justify-between space-y-5 hover:border-emerald-400/60 transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ROWS A & B • 20 SEATS
                  </span>
                  <span className="text-xs text-slate-400">VIP TIER</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">VIP Front Row</h3>
                <div className="text-2xl font-mono font-extrabold text-emerald-400">
                  Rp 250.000 <span className="text-xs text-slate-500 font-normal">/ kursi</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Baris terdepan tepat di hadapan panggung utama Main Atrium SMB, dilengkapi jalur masuk prioritas Gate 01 dan fitur 1x pindah kursi gratis.
                </p>
              </div>
              <button
                onClick={() => handleEnterSystem('seatmap')}
                className="w-full py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-extrabold uppercase transition-colors"
              >
                Pilih Kursi VIP (Row A–B)
              </button>
            </div>

            {/* Regular */}
            <div className="p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.1] flex flex-col justify-between space-y-5 hover:border-cyan-400/60 transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                    ROWS C, D & E • 30 SEATS
                  </span>
                  <span className="text-xs text-slate-400">REGULAR TIER</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Regular Center</h3>
                <div className="text-2xl font-mono font-extrabold text-cyan-400">
                  Rp 150.000 <span className="text-xs text-slate-500 font-normal">/ kursi</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Area tengah Main Atrium dengan sudut pandang simetris dan akustik seimbang, dilindungi kunci kursi 5 menit & QR TOTP dinamis.
                </p>
              </div>
              <button
                onClick={() => handleEnterSystem('seatmap')}
                className="w-full py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-extrabold uppercase transition-colors"
              >
                Pilih Kursi Regular (Row C–E)
              </button>
            </div>

            {/* Festival */}
            <div className="p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.1] flex flex-col justify-between space-y-5 hover:border-purple-400/60 transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                    ROW F • 10 SEATS
                  </span>
                  <span className="text-xs text-slate-400">FESTIVAL TIER</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Festival Zone</h3>
                <div className="text-2xl font-mono font-extrabold text-purple-400">
                  Rp 100.000 <span className="text-xs text-slate-500 font-normal">/ kursi</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zona atmosferik bagian belakang atrium dengan akses penuh ke seluruh fitur Digital Pass kriptografi & pindah kursi mandiri.
                </p>
              </div>
              <button
                onClick={() => handleEnterSystem('seatmap')}
                className="w-full py-3 rounded-2xl bg-purple-400 hover:bg-purple-300 text-slate-950 font-mono text-xs font-extrabold uppercase transition-colors"
              >
                Pilih Kursi Festival (Row F)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 5: ARCHITECTURAL FOOTER & GITHUB REPOSITORY SHOWCASE          */}
      {/* ===================================================================== */}
      <footer className="w-full py-12 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#070a12]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center p-0.5 shrink-0">
              <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                OzikTix — Summarecon Mall Bandung Atrium Gala 2026
              </div>
              <div className="text-[11px] text-slate-400">
                Cryptographic HMAC-SHA256 • 30s Rotating TOTP • PostgreSQL Atomic Row Locking
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/otaruram/oziktix"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.14] text-white font-bold transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>github.com/otaruram/oziktix</span>
            </a>

            <button
              onClick={() => handleEnterSystem('seatmap')}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold transition-colors"
            >
              Buka Core App →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
