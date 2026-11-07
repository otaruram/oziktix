import React, { useState, useRef, useEffect } from 'react';
import { useTicketing } from '../../context/TicketingStore';
import {
  ShieldCheck,
  RotateCcw,
  UserCheck,
  Lock,
  Unlock,
  Radio,
  Clock,
  Ticket as TicketIcon,
  QrCode,
  LayoutDashboard,
  LogIn,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export const TopJudgeBar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentUser,
    switchRole,
    resetAllDemoData,
    activeTab,
    setActiveTab,
    isGateWindowActive,
    toggleGateWindow,
    selectedSeatIds,
    tickets,
    setIsAuthModalOpen,
    logout,
  } = useTicketing();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeLandingSection, setActiveLandingSection] = useState<string>('hero');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTicketsCount = tickets.filter(
    (t) => t.userId === currentUser?.id && (t.status === 'ACTIVE' || t.status === 'USED')
  ).length;

  const scrollToSection = (sectionId: string) => {
    setActiveLandingSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ============================================================================
  // MODE 1: LANDING PAGE — ANTISLOP FLOATING PILL NAVBAR (NO CLUTTERED ROLE/TAB BAR)
  // ============================================================================
  if (activeTab === 'landing') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-4 px-3 flex justify-center pointer-events-none">
        <div className="antislop-pill-shell pointer-events-auto flex items-center gap-1 sm:gap-1.5 max-w-full overflow-x-auto no-scrollbar">
          {/* Brand Pill */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-2 pl-3 pr-3.5 h-[36px] sm:h-[38px] rounded-full font-bold text-xs sm:text-[13px] tracking-tight transition-colors shrink-0"
            style={{
              backgroundColor: theme === 'dark' ? '#ffffff' : '#090a0f',
              color: theme === 'dark' ? '#000000' : '#ffffff',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>OzikTix</span>
          </button>

          {/* Smooth Section Links (Flow Cara Kerja, Protokol, Tier) */}
          <button
            onClick={() => scrollToSection('flow')}
            className={`px-3 sm:px-4 h-[36px] sm:h-[38px] rounded-full text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap ${
              activeLandingSection === 'flow'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cara Kerja (Flow)
          </button>

          <button
            onClick={() => scrollToSection('protocol')}
            className={`hidden sm:grid place-items-center px-4 h-[38px] rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
              activeLandingSection === 'protocol'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arsitektur
          </button>

          <button
            onClick={() => scrollToSection('tiers')}
            className={`px-3 sm:px-4 h-[36px] sm:h-[38px] rounded-full text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap ${
              activeLandingSection === 'tiers'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tier Atrium
          </button>

          {/* Theme Switcher Pill (Hitam / Putih) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 h-[36px] sm:h-[38px] rounded-full text-xs font-mono border border-white/[0.12] hover:bg-white/[0.08] transition-all shrink-0"
            title="Ganti Tema Hitam (Dark) / Putih (Light)"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Putih</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden md:inline text-[11px]">Hitam</span>
              </>
            )}
          </button>

          {/* Auth / Enter Core Workspace CTA */}
          {currentUser && currentUser.isOnboarded ? (
            <button
              onClick={() => {
                if (currentUser.role === 'ADMIN') setActiveTab('admin');
                else if (currentUser.role === 'GATE_OFFICER') setActiveTab('scanner');
                else setActiveTab('seatmap');
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 h-[36px] sm:h-[38px] rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-[13px] transition-all shrink-0 shadow-sm"
            >
              <span>Buka Core App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 h-[36px] sm:h-[38px] rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-[13px] transition-all shrink-0 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Google</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  // ============================================================================
  // MODE 2: CORE WORKSPACE HEADER (SEAT MAP, CHECKOUT, DIGITAL PASS, SCANNER, ADMIN)
  // ============================================================================
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070a12]/95 backdrop-blur-md">
      {/* Top Role & Telemetry Bar inside Core App */}
      <div className="bg-[#0b0f19] border-b border-white/[0.06] px-3 sm:px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {/* Back to Landing + Venue Label */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Landing</span>
            </button>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              Summarecon Mall Bandung • Core Ticketing Engine
            </span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-slate-500 px-1.5 uppercase tracking-wider hidden sm:flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                Role:
              </span>

              <button
                onClick={() => switchRole('VISITOR')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  currentUser?.role === 'VISITOR'
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Visitor
              </button>

              <button
                onClick={() => switchRole('GATE_OFFICER')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  currentUser?.role === 'GATE_OFFICER'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gate Scanner
              </button>

              <button
                onClick={() => switchRole('ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Panitia Admin
              </button>
            </div>
          </div>

          {/* Right Quick Controls: Theme Toggle, Gate Window, Sync */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/[0.1] text-slate-300 hover:text-white text-[11px] transition-colors"
              title="Ganti Tema Hitam / Putih"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Putih</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-slate-700" />
                  <span className="hidden sm:inline">Hitam</span>
                </>
              )}
            </button>

            <button
              onClick={toggleGateWindow}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                isGateWindowActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {isGateWindowActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{isGateWindowActive ? 'TOTP Live' : 'Locked'}</span>
            </button>

            <button
              onClick={resetAllDemoData}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/[0.08]"
              title="Sinkronkan kursi & tiket dengan PostgreSQL"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Core App Navigation Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-400 flex items-center justify-center p-0.5 shadow-sm">
            <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-bold text-sm tracking-tight text-white">
              Ozik<span className="text-emerald-400">Tix</span>
            </span>
            <p className="text-[10px] font-mono text-slate-400">SMB Atrium Gala 2026</p>
          </div>
        </div>

        {/* Core Modules Navigation (Strictly Enforced by Active Role!) */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTab('seatmap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'seatmap'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-bold'
                : currentUser?.role && currentUser.role !== 'VISITOR'
                ? 'text-slate-500 opacity-60 hover:opacity-90 border border-transparent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentUser?.role && currentUser.role !== 'VISITOR' ? (
              <Lock className="w-3 h-3 text-slate-500" />
            ) : (
              <Radio className="w-3 h-3 text-emerald-400" />
            )}
            <span>1. Seat Map</span>
            {selectedSeatIds.length > 0 && currentUser?.role === 'VISITOR' && (
              <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {selectedSeatIds.length}
              </span>
            )}
          </button>

          {selectedSeatIds.length > 0 && currentUser?.role === 'VISITOR' && (
            <button
              onClick={() => setActiveTab('checkout')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'checkout'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
              <span>Checkout ({selectedSeatIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 font-bold'
                : currentUser?.role && currentUser.role !== 'VISITOR'
                ? 'text-slate-500 opacity-60 hover:opacity-90 border border-transparent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentUser?.role && currentUser.role !== 'VISITOR' ? (
              <Lock className="w-3 h-3 text-slate-500" />
            ) : (
              <TicketIcon className="w-3 h-3 text-cyan-400" />
            )}
            <span>2. Digital Pass</span>
            {activeTicketsCount > 0 && currentUser?.role === 'VISITOR' && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                {activeTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 font-bold'
                : currentUser?.role !== 'GATE_OFFICER'
                ? 'text-slate-500 opacity-60 hover:opacity-90 border border-transparent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentUser?.role !== 'GATE_OFFICER' ? (
              <Lock className="w-3 h-3 text-slate-500" />
            ) : (
              <QrCode className="w-3 h-3 text-amber-400" />
            )}
            <span>3. Gate Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 font-bold'
                : currentUser?.role !== 'ADMIN'
                ? 'text-slate-500 opacity-60 hover:opacity-90 border border-transparent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentUser?.role !== 'ADMIN' ? (
              <Lock className="w-3 h-3 text-slate-500" />
            ) : (
              <LayoutDashboard className="w-3 h-3 text-sky-400" />
            )}
            <span>4. Panitia Console</span>
          </button>
        </nav>

        {/* User Profile Pill */}
        <div className="flex items-center pl-2 border-l border-white/[0.08] shrink-0">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.1] text-left transition-colors font-mono text-xs"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg border border-white/[0.15] object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left text-[11px] leading-tight">
                  <div className="text-white font-semibold truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-slate-400 text-[10px] truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b0f19] border border-white/[0.12] shadow-2xl p-3 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 font-mono text-xs text-left">
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      {currentUser.avatarUrl && (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-lg object-cover border border-emerald-400/50"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-white font-bold text-xs truncate">{currentUser.name}</div>
                        <div className="text-slate-400 text-[10px] truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-white/[0.06] space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">NIK KTP:</span>
                        <span className="text-emerald-400 font-semibold">
                          {currentUser.nik || currentUser.maskedNik}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">No. HP:</span>
                        <span className="text-slate-300">{currentUser.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status KYC:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                          Terkirim ke Admin
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Role Aktif:</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/[0.08] text-white font-semibold">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-white/[0.06] pt-1.5">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors font-medium text-xs"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Ubah Data Resmi KYC & Foto</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-mono text-xs font-bold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
