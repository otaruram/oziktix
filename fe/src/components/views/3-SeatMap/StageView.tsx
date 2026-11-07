import React from 'react';

export const StageView: React.FC = () => {
  return (
    <div className="w-full max-w-xl mx-auto mb-8 text-center">
      <div className="relative py-3 px-6 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 shadow-md">
        <div className="text-xs sm:text-sm font-mono font-extrabold tracking-[0.22em] text-white uppercase">
          MAIN GALA STAGE & PODIUM
        </div>
        <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
          SUMMARECON MALL BANDUNG • MAIN ATRIUM
        </div>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-emerald-400 rounded-full shadow-sm" />
      </div>
      <div className="text-[11px] font-mono text-slate-400 mt-2 font-medium">
        Viewing angle: Front towards Atrium Stage
      </div>
    </div>
  );
};

