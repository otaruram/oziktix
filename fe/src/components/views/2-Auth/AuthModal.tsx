import React, { useState, useEffect, useRef } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { UserRole } from '../../../types/ticketing';
import {
  ShieldCheck,
  X,
  Upload,
  CheckCircle2,
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Wand2,
  ArrowRight,
  Camera,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    submitOnboardingKyc,
    loginWithGoogle,
  } = useTicketing();

  // Strict 2-Step Gate: Step 1 = Login Google First, Step 2 = Official KYC Form -> Send to Admin
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<UserRole>('VISITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessBanner, setSubmittedSuccessBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setSubmittedSuccessBanner(null);
      setFormError(null);
      if (currentUser && currentUser.email) {
        // User already signed in with real Google -> go straight to Step 2 KYC Form
        setStep(2);
        setFullName(currentUser.name || '');
        setEmail(currentUser.email || '');
        setNik(currentUser.nik || currentUser.maskedNik || '');
        setPhone(currentUser.phone || '');
        setAddress(currentUser.address || 'Bandung, Jawa Barat');
        setAvatarUrl(currentUser.avatarUrl || '');
        setRole(currentUser.role || 'VISITOR');
      } else {
        setStep(1);
      }
    }
  }, [isAuthModalOpen, currentUser]);

  if (!isAuthModalOpen) return null;

  // Step 2 Auto-Fill Helper: ONLY fills valid NIK, Phone, and Address format for the user's OWN Google account!
  const handleAutoFillKyc = () => {
    setFormError(null);
    const randomSuffix = Math.floor(1000 + Math.random() * 8999);
    setNik(nik || `327301150899${randomSuffix}`);
    setPhone(phone || `+62 812-2045-${randomSuffix}`);
    setAddress(address || 'Summarecon Bandung, Gedebage, Kota Bandung');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !nik.trim() || !phone.trim()) {
      setFormError(
        'Harap lengkapi Nama Lengkap, NIK 16 Digit, dan Nomor HP (atau klik tombol ⚡ Auto-Fill Format NIK & No. HP).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitOnboardingKyc({
        id: currentUser?.id,
        fullName: fullName.trim(),
        email: email.trim(),
        nik: nik.trim(),
        phone: phone.trim(),
        address: address.trim() || 'Bandung, Jawa Barat',
        avatarUrl: avatarUrl || currentUser?.avatarUrl || '',
        role,
      });

      if (res.success) {
        setSubmittedSuccessBanner(
          'Pengajuan identitas resmi Anda telah dikirim ke Dashboard Admin Panitia & tersimpan di PostgreSQL!'
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setSubmittedSuccessBanner(null);
        }, 1000);
      } else {
        setFormError(res.error || 'Gagal menyimpan data ke server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0b0f19] border border-white/[0.14] p-6 sm:p-7 shadow-2xl space-y-5 text-left my-auto max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 2-Step Progress Indicator */}
        <div className="flex items-center gap-2 font-mono text-[11px] pr-8">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              step === 1
                ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-bold'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
            }`}
          >
            {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>01</span>}
            <span>1. Login Google</span>
          </div>

          <div className="h-[1px] w-5 bg-white/[0.15]" />

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              step === 2
                ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-950 border-white/[0.08] text-slate-500'
            }`}
          >
            <span>02</span>
            <span>2. Formulir Resmi KYC → Admin</span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* STEP 1: CLEAN REAL GOOGLE OAUTH LOGIN ONLY (NO FAKE ACCOUNT LIST!)    */}
        {/* ===================================================================== */}
        {step === 1 && (
          <div className="space-y-6 py-2 animate-in fade-in duration-150">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                Login dengan Akun Google Resmi Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Sesuai protokol keamanan Summarecon Mall Bandung Atrium Gala 2026, silakan masuk menggunakan akun Google pribadi Anda. Setelah terautentikasi, Anda akan melengkapi data identitas resmi (NIK & Foto) dan mendapatkan playground simulasi pribadi Anda sendiri.
              </p>
            </div>

            {/* Primary Button: Real Supabase Google OAuth ONLY */}
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
            >
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </span>
              <span>Masuk dengan Akun Google (OAuth 2.0)</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/[0.08] text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-white font-bold">✓ 1 Akun Asli untuk Semua Role & Playground Pribadi</div>
              <p>
                Setelah login & mengisi KYC, Anda dapat berpindah role (<strong>Visitor</strong>, <strong>Gate Scanner</strong>, <strong>Panitia Admin</strong>) tetap menggunakan identitas akun Google Anda sendiri tanpa akun palsu.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 2: MANDATORY OFFICIAL KYC FORM -> SUBMIT TO ADMIN DASHBOARD       */}
        {/* ===================================================================== */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-display font-extrabold text-white">
                  Tahap 2: Formulir Resmi Identitas (KYC)
                </h3>
                <p className="text-xs text-slate-400">
                  Terautentikasi sebagai <span className="text-emerald-400 font-mono font-semibold">{email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillKyc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[11px] shrink-0 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Fill NIK & HP</span>
              </button>
            </div>

            {submittedSuccessBanner && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submittedSuccessBanner}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="space-y-3.5 text-xs font-mono">
              {/* Photo Upload */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto Identitas"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-400/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/[0.1] flex items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-white">Foto Profil / Identitas Resmi</div>
                    <div className="text-[10px] text-slate-400">Otomatis dari Google atau unggah foto baru</div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.12] text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Foto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-emerald-400" /> Nama Lengkap Sesuai KTP *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400" /> Email Akun Google (Terkunci)
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-emerald-400 font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-400" /> NIK KTP (16 Digit) *
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="327301xxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> Nomor HP / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Alamat Domisili
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Kota Bandung, Jawa Barat"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengirim Pengajuan ke Admin Panitia...</span>
                ) : (
                  <>
                    <span>Konfirmasi & Kirim Pengajuan ke Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
