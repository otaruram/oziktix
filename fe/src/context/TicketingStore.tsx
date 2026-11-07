import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Seat, Ticket, SwapLog, SystemConfig, UserRole } from '../types/ticketing';
import { SeatApi } from '../services/seat.api';
import { TicketApi } from '../services/ticket.api';
import { CheckoutApi } from '../services/checkout.api';
import { AdminApi } from '../services/admin.api';
import { UserApi } from '../services/user.api';
import { supabase, signInWithGoogle, signOut } from '../config/supabase';
import { ENV } from '../config/env';
import { computeTotpNonce } from '../utils/crypto';

export const DEMO_PROFILES: Record<UserRole, User> = {
  VISITOR: {
    id: 'usr_judge_visitor_01',
    name: 'Rizky Pratama Putra',
    email: 'rizky.pratama.bdg@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    nik: '3273011508990001',
    maskedNik: '3273011508990001',
    phone: '+62 812-2045-8891',
    address: 'Jl. Bulevar Barat No. 75, Summarecon Bandung',
    role: 'VISITOR',
    kycStatus: 'SUBMITTED_TO_ADMIN',
    isOnboarded: true,
    isGoogleVerified: true,
    accessToken: ENV.DEMO_TOKENS.VISITOR,
  },
  ADMIN: {
    id: 'usr_admin_panitia_01',
    name: 'Siti Rahmawati (Lead Panitia)',
    email: 'admin.panitia@summarecon.com',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    nik: '3273045402950003',
    maskedNik: '3273045402950003',
    phone: '+62 811-2233-4455',
    address: 'Summarecon Mall Bandung Management Office',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    isOnboarded: true,
    isGoogleVerified: true,
    accessToken: ENV.DEMO_TOKENS.ADMIN,
  },
  GATE_OFFICER: {
    id: 'usr_gate_officer_01',
    name: 'Ahmad Fauzi (Gate Inspector 01)',
    email: 'gate01@summarecon-security.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    nik: '3273081911930007',
    maskedNik: '3273081911930007',
    phone: '+62 856-7788-9900',
    address: 'Main Atrium Gate 1, Summarecon Mall Bandung',
    role: 'GATE_OFFICER',
    kycStatus: 'VERIFIED',
    isOnboarded: true,
    isGoogleVerified: true,
    accessToken: ENV.DEMO_TOKENS.GATE_OFFICER,
  },
};

export const DEMO_USERS = DEMO_PROFILES;

export type ActiveTab = 'landing' | 'seatmap' | 'checkout' | 'tickets' | 'scanner' | 'admin';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
}

export const DEFAULT_CONFIG: SystemConfig = {
  maxSeatsPerUser: 2,
  holdTtlSeconds: 300, // 5:00 minutes
  totpPeriodSeconds: 30,
  gateWindowHours: 2,
  isGateWindowActive: true,
  maintenanceMode: false,
};

interface TicketingContextType {
  // Theme (Hitam / Putih)
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & KYC Onboarding
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginAsJudge: (role?: UserRole) => void;
  loginWithGoogle: () => Promise<void>;
  submitOnboardingKyc: (params: {
    id?: string;
    fullName: string;
    email: string;
    nik: string;
    phone: string;
    address?: string;
    avatarUrl?: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Navigation (Guarded)
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Data
  seats: Seat[];
  tickets: Ticket[];
  swapLogs: SwapLog[];
  config: SystemConfig;
  refreshSeats: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  updateConfig: (newConfig: Partial<SystemConfig>) => Promise<void>;

  // Selection & Hold
  selectedSeatIds: string[];
  selectSeat: (seatId: string) => Promise<{ success: boolean; error?: string }>;
  deselectSeat: (seatId: string) => Promise<void>;
  clearSelection: () => Promise<void>;

  // Checkout Timer (5:00 min hold TTL)
  holdSecondsRemaining: number;
  isHoldExpired: boolean;
  activeHoldExpiresAt: number | null;

  // TOTP & Gate Activation Window
  totpSecondsRemaining: number;
  isGateWindowActive: boolean;
  toggleGateWindow: () => void;

  // Actions
  checkout: (redirectToTickets?: boolean) => Promise<{ success: boolean; tickets?: Ticket[]; error?: string }>;
  swapSeat: (ticketId: string, newSeatId: string) => Promise<{ success: boolean; error?: string }>;
  refundTicket: (ticketId: string) => Promise<{ success: boolean; error?: string }>;
  simulateConcurrencyRace: (seatId: string) => Promise<void>;
  resetAllDemoData: () => Promise<void>;
  restartUserPlayground: () => Promise<void>;

  // Alerts & Notifications
  quotaWarning: string | null;
  setQuotaWarning: (msg: string | null) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, description: string) => void;
  removeToast: (id: string) => void;
}

const TicketingContext = createContext<TicketingContextType | null>(null);

const USER_STORAGE_KEY = 'oziktix_current_user_v1';

export const TicketingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('oziktix_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
      localStorage.setItem('oziktix_theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  const setCurrentUser = useCallback((u: User | null) => {
    setCurrentUserState(u);
    if (typeof window !== 'undefined') {
      if (u) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<ActiveTab>('landing');

  const [seats, setSeats] = useState<Seat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [swapLogs, setSwapLogs] = useState<SwapLog[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [activeHoldExpiresAt, setActiveHoldExpiresAt] = useState<number | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(300);
  const [isHoldExpired, setIsHoldExpired] = useState<boolean>(false);

  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState<number>(30);
  const [isGateWindowActive, setIsGateWindowActive] = useState<boolean>(true);

  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const addToast = useCallback((type: ToastMessage['type'], title: string, description: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Strict Auth & Role-Guarded Navigation (No cross-role feature access without switching role first!)
  const setActiveTab = useCallback(
    (tab: ActiveTab) => {
      if (tab === 'landing') {
        setActiveTabState('landing');
        return;
      }

      if (!currentUser || !currentUser.isOnboarded) {
        setIsAuthModalOpen(true);
        addToast(
          'warning',
          'Login Google & Formulir KYC Diperlukan',
          'Silakan masuk dengan akun Google Anda & lengkapi formulir resmi KYC terlebih dahulu.'
        );
        return;
      }

      const userRole = currentUser.role || 'VISITOR';

      if (userRole === 'VISITOR' && (tab === 'scanner' || tab === 'admin')) {
        const neededRoleName = tab === 'scanner' ? 'Gate Scanner' : 'Panitia Admin';
        addToast(
          'warning',
          `🔒 Fitur Khusus Role ${neededRoleName}`,
          `Role Anda saat ini adalah Visitor. Silakan klik tombol Role "${neededRoleName}" di bar atas (tetap menggunakan akun asli ${currentUser.name}) untuk mengakses fitur ini!`
        );
        return;
      }

      if (userRole === 'GATE_OFFICER' && tab !== 'scanner') {
        const neededRoleName = tab === 'admin' ? 'Panitia Admin' : 'Visitor';
        addToast(
          'warning',
          `🔒 Fitur Khusus Role ${neededRoleName}`,
          `Role Anda saat ini adalah Gate Scanner. Silakan klik tombol Role "${neededRoleName}" di bar atas (tetap menggunakan akun asli ${currentUser.name}) terlebih dahulu!`
        );
        return;
      }

      if (userRole === 'ADMIN' && tab !== 'admin') {
        const neededRoleName = tab === 'scanner' ? 'Gate Scanner' : 'Visitor';
        addToast(
          'warning',
          `🔒 Fitur Khusus Role ${neededRoleName}`,
          `Role Anda saat ini adalah Panitia Admin. Silakan klik tombol Role "${neededRoleName}" di bar atas (tetap menggunakan akun asli ${currentUser.name}) terlebih dahulu!`
        );
        return;
      }

      setActiveTabState(tab);
    },
    [currentUser, addToast]
  );

  // Supabase Auth State Listener (Real Google OAuth)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const token = session.access_token;
        localStorage.setItem('oziktix_auth_token', token);

        const dbProfile = await UserApi.getMe();
        if (dbProfile && dbProfile.isOnboarded) {
          setCurrentUser({
            ...dbProfile,
            accessToken: token,
          });
        } else {
          const googleUser: User = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'Google User',
            email: session.user.email || '',
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            nik: '',
            maskedNik: '',
            phone: session.user.phone || '',
            role: (session.user.app_metadata?.role as UserRole) || 'VISITOR',
            kycStatus: 'PENDING_SUBMISSION',
            isOnboarded: false,
            isGoogleVerified: true,
            accessToken: token,
          };
          setCurrentUser(googleUser);
          // Mandatory onboarding form for new Google users
          setIsAuthModalOpen(true);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('oziktix_auth_token');
        setCurrentUser(null);
        setActiveTabState('landing');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setCurrentUser]);

  // Fetch live seat data from backend AND auto-sync user's active holds into selectedSeatIds
  const refreshSeats = useCallback(async () => {
    try {
      const data = await SeatApi.getSeats();
      setSeats(data);

      if (currentUser) {
        const now = Date.now();
        const myHeldSeats = data.filter(
          (s) =>
            s.status === 'RESERVED' &&
            s.reservedByUserId === currentUser.id &&
            (!s.reservedUntil || s.reservedUntil > now)
        );

        const heldIds = myHeldSeats.map((s) => s.id);
        setSelectedSeatIds((prev) => {
          if (heldIds.length === prev.length && heldIds.every((id) => prev.includes(id))) {
            return prev;
          }
          return heldIds;
        });

        if (myHeldSeats.length > 0) {
          const maxExpiry = Math.max(
            ...myHeldSeats.map((s) => s.reservedUntil || Date.now() + 300 * 1000)
          );
          setActiveHoldExpiresAt((prev) => prev || maxExpiry);
        }
      }
    } catch {
      // Keep existing seats
    }
  }, [currentUser]);

  // Fetch tickets & logs
  const refreshTickets = useCallback(async () => {
    try {
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'GATE_OFFICER') {
        const [adminTickets, logs] = await Promise.all([
          AdminApi.getAttendees(),
          AdminApi.getSwapLogs(),
        ]);
        setTickets(adminTickets);
        setSwapLogs(logs);
      } else if (currentUser) {
        const myTix = await TicketApi.getMyTickets();
        setTickets(myTix);
      } else {
        setTickets([]);
      }
    } catch {
      // Fallback
    }
  }, [currentUser]);

  useEffect(() => {
    refreshSeats();
  }, [refreshSeats]);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets, currentUser]);

  // Periodic polling for live seats
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSeats();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshSeats]);

  // 30s TOTP Clock Engine
  useEffect(() => {
    const tickTotp = () => {
      const { secondsRemaining } = computeTotpNonce('CLOCK_TICK');
      setTotpSecondsRemaining(secondsRemaining);
    };
    tickTotp();
    const interval = setInterval(tickTotp, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hold Timer Engine (5:00 countdown)
  useEffect(() => {
    if (!activeHoldExpiresAt || selectedSeatIds.length === 0) {
      setHoldSecondsRemaining(config.holdTtlSeconds);
      setIsHoldExpired(false);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = activeHoldExpiresAt - Date.now();
      const remSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setHoldSecondsRemaining(remSec);

      if (remSec <= 0) {
        setIsHoldExpired(true);
        clearInterval(interval);
        if (currentUser) {
          selectedSeatIds.forEach((sid) => SeatApi.releaseSeat(sid, currentUser.id));
        }
        setSelectedSeatIds([]);
        setActiveHoldExpiresAt(null);
        refreshSeats();
        addToast(
          'warning',
          'Waktu Tahan Kursi Habis (5:00)',
          'Waktu reservasi 5 menit telah berakhir. Kursi dikembalikan menjadi AVAILABLE.'
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHoldExpiresAt, selectedSeatIds, currentUser, config.holdTtlSeconds, refreshSeats, addToast]);

  // Seat Selection with Real Backend Lock & Smooth Max 2 Seats per Checkout Check
  const selectSeat = useCallback(
    async (seatId: string): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return { success: false, error: 'Silakan login terlebih dahulu' };
      }

      const targetSeat = seats.find((s) => s.id === seatId);
      if (!targetSeat) return { success: false, error: 'Kursi tidak ditemukan' };

      if (selectedSeatIds.length >= config.maxSeatsPerUser && !selectedSeatIds.includes(seatId)) {
        const msg = `Batas Maksimal ${config.maxSeatsPerUser} Kursi per Transaksi: Anda sudah memilih ${selectedSeatIds.length} kursi (${selectedSeatIds.join(', ')}). Klik tombol "Lanjut ke Halaman Pembayaran" atau batalkan salah satu kursi terlebih dahulu.`;
        setQuotaWarning(msg);
        addToast('warning', 'Maksimal 2 Kursi Dipilih', msg);
        return { success: false, error: msg };
      }

      // Optimistic UI update so clicking seat is instant & responsive
      setSelectedSeatIds((prev) => (prev.includes(seatId) ? prev : [...prev, seatId]));
      setQuotaWarning(null);
      if (!activeHoldExpiresAt) {
        setActiveHoldExpiresAt(Date.now() + config.holdTtlSeconds * 1000);
        setHoldSecondsRemaining(config.holdTtlSeconds);
        setIsHoldExpired(false);
      }

      // Call live backend hold endpoint
      let res = await SeatApi.holdSeat(seatId, targetSeat.version, currentUser.id);

      // If backend returned 429 due to an orphaned hold in DB not in selectedSeatIds, clear orphaned holds and retry once
      if (!res.success && res.status === 429) {
        await SeatApi.releaseAllSeats();
        for (const existingSid of selectedSeatIds) {
          await SeatApi.holdSeat(existingSid, 1, currentUser.id);
        }
        res = await SeatApi.holdSeat(seatId, targetSeat.version, currentUser.id);
      }

      if (!res.success) {
        // Revert optimistic selection if seat is locked by someone else (409)
        setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
        if (res.status === 429) {
          const quotaMsg =
            res.error ||
            `Batas Maksimal ${config.maxSeatsPerUser} Kursi: Silakan lanjut ke halaman Pembayaran (Checkout).`;
          setQuotaWarning(quotaMsg);
          addToast('warning', 'Maksimal 2 Kursi Dipilih', quotaMsg);
        } else {
          addToast('error', 'Konflik Kunci Kursi (HTTP 409)', res.error || 'Gagal mengunci kursi');
        }
        await refreshSeats();
        return { success: false, error: res.error };
      }

      await refreshSeats();
      addToast(
        'success',
        `Kursi ${seatId} Dikunci (RESERVED)`,
        `Kursi ditahan selama 5:00 menit. Klik "Lanjut ke Halaman Pembayaran (Checkout)" untuk membayar.`
      );
      return { success: true };
    },
    [currentUser, seats, activeHoldExpiresAt, config.holdTtlSeconds, config.maxSeatsPerUser, selectedSeatIds, refreshSeats, addToast]
  );

  const deselectSeat = useCallback(
    async (seatId: string) => {
      if (!currentUser) return;
      const remaining = selectedSeatIds.filter((id) => id !== seatId);
      setSelectedSeatIds(remaining);
      if (remaining.length === 0) {
        setActiveHoldExpiresAt(null);
      }
      setQuotaWarning(null);
      await SeatApi.releaseSeat(seatId, currentUser.id);
      await refreshSeats();
    },
    [currentUser, selectedSeatIds, refreshSeats]
  );

  const clearSelection = useCallback(async () => {
    if (!currentUser) return;
    setSelectedSeatIds([]);
    setActiveHoldExpiresAt(null);
    setQuotaWarning(null);
    await SeatApi.releaseAllSeats();
    for (const sid of selectedSeatIds) {
      await SeatApi.releaseSeat(sid, currentUser.id);
    }
    await refreshSeats();
  }, [currentUser, selectedSeatIds, refreshSeats]);

  // Checkout process connecting directly to backend
  const checkout = useCallback(
    async (redirectToTickets: boolean = true) => {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return { success: false, error: 'Silakan login terlebih dahulu' };
      }
      if (selectedSeatIds.length === 0) {
        return { success: false, error: 'Belum ada kursi yang dipilih' };
      }

      const res = await CheckoutApi.confirmCheckout(selectedSeatIds, currentUser);

      if (!res.success) {
        addToast('error', 'Checkout Gagal', res.error || 'Gagal memproses pembayaran');
        return { success: false, error: res.error };
      }

      // Immediately stop the hold countdown timer upon payment!
      setActiveHoldExpiresAt(null);
      setIsHoldExpired(false);
      setSelectedSeatIds([]);
      setQuotaWarning(null);
      await Promise.all([refreshSeats(), refreshTickets()]);

      addToast(
        'success',
        'Pembayaran Berhasil & Waktu Hold Dihentikan!',
        `Berhasil menerbitkan ${res.tickets?.length || 1} Digital Pass dengan tanda tangan HMAC-SHA256 & QR TOTP 30 detik.`
      );

      if (redirectToTickets) {
        setActiveTabState('tickets');
      }
      return { success: true, tickets: res.tickets };
    },
    [currentUser, selectedSeatIds, refreshSeats, refreshTickets, addToast]
  );

  // Atomic Seat Relocation
  const swapSeat = useCallback(
    async (ticketId: string, newSeatId: string) => {
      if (!currentUser) return { success: false, error: 'Not authenticated' };

      const res = await TicketApi.swapSeat(ticketId, newSeatId);

      if (!res.success) {
        addToast('error', 'Pindah Kursi Ditolak', res.error || 'Gagal memindahkan kursi');
        return { success: false, error: res.error };
      }

      await Promise.all([refreshSeats(), refreshTickets()]);

      addToast(
        'success',
        'Atomic Seat Swap Berhasil!',
        `Kursi berhasil dipindahkan ke ${newSeatId}. QR lama dicabut dan hash kriptografi baru telah diterbitkan.`
      );

      return { success: true };
    },
    [currentUser, refreshSeats, refreshTickets, addToast]
  );

  // 1-Click Refund
  const refundTicket = useCallback(
    async (ticketId: string) => {
      const res = await AdminApi.refundTicket(ticketId);
      if (!res.success) {
        addToast('error', 'Refund Gagal', res.error || 'Tidak dapat memproses refund');
        return { success: false, error: res.error };
      }

      await Promise.all([refreshSeats(), refreshTickets()]);
      addToast('info', 'Tiket Di-Refund', `Tiket ${ticketId} dicabut. Kursi ${res.seatId} kembali AVAILABLE.`);
      return { success: true };
    },
    [refreshSeats, refreshTickets, addToast]
  );

  // Simulate Concurrency Race Condition (HTTP 409)
  const simulateConcurrencyRace = useCallback(
    async (seatId: string) => {
      try {
        const dummyCompUser = 'usr_competing_buyer';
        await SeatApi.holdSeat(seatId, 1, dummyCompUser);
        await refreshSeats();
        addToast(
          'error',
          'Concurrency Alert (HTTP 409 Conflict)',
          `Kursi ${seatId} baru saja dikunci oleh pembeli lain secara bersamaan! Optimistic lock mencegah tabrakan.`
        );
      } catch (e: any) {
        addToast('error', 'Simulation Error', e.message);
      }
    },
    [refreshSeats, addToast]
  );

  // System Config update
  const updateConfig = useCallback(
    async (newConfig: Partial<SystemConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
      if (typeof newConfig.isGateWindowActive === 'boolean') {
        setIsGateWindowActive(newConfig.isGateWindowActive);
      }
      addToast('success', 'Konfigurasi Diperbarui', 'Parameter sistem berhasil disimpan.');
    },
    [addToast]
  );

  const toggleGateWindow = useCallback(() => {
    const nextVal = !isGateWindowActive;
    setIsGateWindowActive(nextVal);
    updateConfig({ isGateWindowActive: nextVal });
    addToast(
      'info',
      nextVal ? 'Gate Window Dibuka (Live TOTP)' : 'Gate Window Ditutup (Pre-Gate Mode)',
      nextVal
        ? 'QR Code sekarang AKTIF dengan rotasi token TOTP 30 detik.'
        : 'QR Code dikunci hingga H-2 jam sebelum acara.'
    );
  }, [isGateWindowActive, updateConfig, addToast]);

  // Reset / Sync demo state
  const resetAllDemoData = useCallback(async () => {
    await refreshSeats();
    await refreshTickets();
    addToast('info', 'Data Disinkronkan', 'Status kursi dan tiket berhasil disinkronkan dari database PostgreSQL.');
  }, [refreshSeats, refreshTickets, addToast]);

  // Restart ONLY this user's isolated playground back to 0!
  const restartUserPlayground = useCallback(async () => {
    if (!currentUser) return;
    const res = await UserApi.resetPlayground(currentUser.id);
    if (res.success) {
      setSelectedSeatIds([]);
      setActiveHoldExpiresAt(null);
      setQuotaWarning(null);
      await Promise.all([refreshSeats(), refreshTickets()]);
      addToast(
        'success',
        '🔄 Simulasi Playground Di-Restart dari 0!',
        `Seluruh kursi di playground pribadi ${currentUser.name} kembali KOSONG (60/60 Available) tanpa mengganggu data user lain.`
      );
    } else {
      addToast('error', 'Gagal Restart Simulasi', res.error || 'Terjadi kesalahan saat mereset playground.');
    }
  }, [currentUser, refreshSeats, refreshTickets, addToast]);

  // Submit Mandatory Official KYC Onboarding Form
  const submitOnboardingKyc = useCallback(
    async (params: {
      id?: string;
      fullName: string;
      email: string;
      nik: string;
      phone: string;
      address?: string;
      avatarUrl?: string;
      role: UserRole;
    }): Promise<{ success: boolean; error?: string }> => {
      const res = await UserApi.onboardUser(params);
      if (!res.success || !res.user) {
        addToast('error', 'Gagal Menyimpan Identitas', res.error || 'Terjadi kesalahan saat menyimpan ke database.');
        return { success: false, error: res.error };
      }

      setCurrentUser(res.user);
      await Promise.all([refreshSeats(), refreshTickets()]);

      addToast(
        'success',
        'Pengajuan Identitas Telah Dikirim ke Admin!',
        `Selamat datang, ${res.user.name}! Data KTP/NIK & Foto Anda telah tersimpan di Core Database (${res.user.role}).`
      );

      if (res.user.role === 'ADMIN') {
        setActiveTabState('admin');
      } else if (res.user.role === 'GATE_OFFICER') {
        setActiveTabState('scanner');
      } else {
        setActiveTabState('seatmap');
      }

      return { success: true };
    },
    [setCurrentUser, refreshSeats, refreshTickets, addToast]
  );

  // Role switching strictly using the SAME registered Google user account (NO fake persona!)
  const switchRole = useCallback(
    async (role: UserRole) => {
      if (!currentUser || !currentUser.isOnboarded) {
        setIsAuthModalOpen(true);
        addToast(
          'warning',
          'Login Akun Google Diperlukan',
          'Silakan login dengan akun Google & isi formulir KYC terlebih dahulu sebelum berpindah role.'
        );
        return;
      }

      // Optimistically update current user's role while keeping their exact identity
      const optimisticUser: User = {
        ...currentUser,
        role,
      };
      setCurrentUser(optimisticUser);

      if (role === 'VISITOR') {
        setActiveTabState('seatmap');
      } else if (role === 'ADMIN') {
        setActiveTabState('admin');
      } else if (role === 'GATE_OFFICER') {
        setActiveTabState('scanner');
      }

      const res = await UserApi.switchRole(role, currentUser);
      if (res.success && res.user) {
        setCurrentUser(res.user);
      }

      await Promise.all([refreshSeats(), refreshTickets()]);

      const roleLabel =
        role === 'ADMIN' ? 'Panitia Admin' : role === 'GATE_OFFICER' ? 'Gate Scanner' : 'Visitor';
      addToast(
        'success',
        `Role Berpindah ke: ${roleLabel}`,
        `Tetap menggunakan akun asli Anda: ${currentUser.name} (${currentUser.email}).`
      );
    },
    [currentUser, setCurrentUser, refreshSeats, refreshTickets, addToast]
  );

  // Judge Quick Login opens Google Auth Modal if not logged in, or switches role on current account
  const loginAsJudge = useCallback(
    async (role: UserRole = 'VISITOR') => {
      if (!currentUser || !currentUser.isOnboarded) {
        setIsAuthModalOpen(true);
        return;
      }
      await switchRole(role);
    },
    [currentUser, switchRole]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      addToast(
        'info',
        'Gunakan Formulir Registrasi Google di Bawah',
        'Silakan klik tombol Auto-Fill atau isi akun Google Anda pada form di bawah untuk langsung masuk ke Core Inti.'
      );
    }
  }, [addToast]);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    localStorage.removeItem('oziktix_auth_token');
    setCurrentUser(null);
    setSelectedSeatIds([]);
    setActiveHoldExpiresAt(null);
    setActiveTabState('landing');
    addToast('info', 'Berhasil Logout', 'Anda telah keluar dari sesi akun.');
  }, [setCurrentUser, addToast]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      currentUser,
      setCurrentUser,
      switchRole,
      isAuthModalOpen,
      setIsAuthModalOpen,
      loginAsJudge,
      loginWithGoogle,
      submitOnboardingKyc,
      logout,
      activeTab,
      setActiveTab,
      seats,
      tickets,
      swapLogs,
      config,
      refreshSeats,
      refreshTickets,
      updateConfig,
      selectedSeatIds,
      selectSeat,
      deselectSeat,
      clearSelection,
      holdSecondsRemaining,
      isHoldExpired,
      activeHoldExpiresAt,
      totpSecondsRemaining,
      isGateWindowActive,
      toggleGateWindow,
      checkout,
      swapSeat,
      refundTicket,
      simulateConcurrencyRace,
      resetAllDemoData,
      restartUserPlayground,
      quotaWarning,
      setQuotaWarning,
      toasts,
      addToast,
      removeToast,
    }),
    [
      theme,
      toggleTheme,
      currentUser,
      setCurrentUser,
      switchRole,
      isAuthModalOpen,
      activeTab,
      seats,
      tickets,
      swapLogs,
      config,
      refreshSeats,
      refreshTickets,
      updateConfig,
      selectedSeatIds,
      selectSeat,
      deselectSeat,
      clearSelection,
      holdSecondsRemaining,
      isHoldExpired,
      activeHoldExpiresAt,
      totpSecondsRemaining,
      isGateWindowActive,
      toggleGateWindow,
      checkout,
      swapSeat,
      refundTicket,
      simulateConcurrencyRace,
      resetAllDemoData,
      restartUserPlayground,
      quotaWarning,
      toasts,
      addToast,
      removeToast,
      loginAsJudge,
      loginWithGoogle,
      submitOnboardingKyc,
      logout,
      setActiveTab,
    ]
  );

  return <TicketingContext.Provider value={value}>{children}</TicketingContext.Provider>;
};

export const useTicketing = () => {
  const context = useContext(TicketingContext);
  if (!context) {
    throw new Error('useTicketing must be used within a TicketingProvider');
  }
  return context;
};
