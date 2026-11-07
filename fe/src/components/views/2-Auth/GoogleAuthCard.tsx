import React from 'react';
import { useAuth, DEMO_PROFILES } from '../../../hooks/useAuth';
import { ShieldCheck, Sparkles, UserCheck, Lock } from 'lucide-react';

export const GoogleAuthCard: React.FC = () => {
  const { user, loginWithGoogle, loginAsDemoJudge, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 text-left">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Identity Gate (Google OAuth & NIK)
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Attendee Authentication</h2>
        <p className="text-xs text-slate-400">
          All tickets are cryptographically signed with your Google Identity to prevent scalping.
        </p>
      </div>

      {user ? (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover"
            />
            <div>
              <div className="font-bold text-white">{user.name}</div>
              <div className="text-[11px] text-slate-400">{user.email}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <span className="text-slate-500">Masked NIK:</span>
            <span className="text-emerald-400 font-bold">{user.maskedNik}</span>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sign in with Google */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] font-mono text-slate-500 uppercase">
              OR JUDGE INSTANT DEMO
            </span>
          </div>

          {/* 1-Click Judge Bypass Button */}
          <button
            onClick={() => loginAsDemoJudge('VISITOR')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Judge 1-Click Login (Demo Account)</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>JWT Bearer token automatically injected into all API calls.</span>
      </div>
    </div>
  );
};

