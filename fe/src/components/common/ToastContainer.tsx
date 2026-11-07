import React from 'react';
import { useTicketing } from '../../context/TicketingStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, theme } = useTicketing();

  if (toasts.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        let containerStyle = isLight
          ? 'bg-white border-2 border-slate-300 shadow-2xl text-slate-900'
          : 'bg-[#0b101b] border border-slate-700/80 shadow-2xl text-white';
        let icon = <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />;
        let titleColor = isLight ? '#0f172a' : '#ffffff';
        let descColor = isLight ? '#334155' : '#cbd5e1';

        if (toast.type === 'success') {
          containerStyle = isLight
            ? 'bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15'
            : 'bg-[#081510] border border-emerald-500/60 shadow-2xl shadow-emerald-950/60';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
          titleColor = isLight ? '#047857' : '#34d399';
          descColor = isLight ? '#0f172a' : '#e2e8f0';
        } else if (toast.type === 'error') {
          containerStyle = isLight
            ? 'bg-white border-2 border-rose-500 shadow-2xl shadow-rose-500/15'
            : 'bg-[#180a0e] border border-rose-500/60 shadow-2xl shadow-rose-950/60';
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
          titleColor = isLight ? '#be123c' : '#fb7185';
          descColor = isLight ? '#0f172a' : '#e2e8f0';
        } else if (toast.type === 'warning') {
          containerStyle = isLight
            ? 'bg-white border-2 border-amber-500 shadow-2xl shadow-amber-500/15'
            : 'bg-[#161208] border border-amber-500/60 shadow-2xl shadow-amber-950/60';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
          titleColor = isLight ? '#b45309' : '#fbbf24';
          descColor = isLight ? '#0f172a' : '#e2e8f0';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl backdrop-blur-md transition-all duration-300 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 ${containerStyle}`}
          >
            {icon}
            <div className="flex-1 space-y-1 text-left min-w-0">
              <div
                className="text-xs font-bold font-mono tracking-tight leading-snug"
                style={{ color: titleColor }}
              >
                {toast.title}
              </div>
              <div
                className="text-[12px] font-sans leading-relaxed break-words"
                style={{ color: descColor }}
              >
                {toast.description}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

