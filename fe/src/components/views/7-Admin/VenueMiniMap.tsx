import React from 'react';
import { useTicketing } from '../../../context/TicketingStore';

export const VenueMiniMap: React.FC = () => {
  const { seats } = useTicketing();
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  const soldCount = seats.filter((s) => s.status === 'SOLD').length;
  const heldCount = seats.filter((s) => s.status === 'RESERVED').length;
  const freeCount = Math.max(0, seats.length - soldCount - heldCount);

  return (
    <div className="p-5 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-4 text-left font-mono text-xs">
      <div className="space-y-2 pb-3 border-b border-white/[0.08]">
        <div className="font-bold text-white uppercase text-[11px]">
          Global Admin Mini-Map (Seluruh User)
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Kosong ({freeCount})
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Hold ({heldCount})
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Terisi ({soldCount})
          </span>
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        {rows.map((rowLetter) => {
          const rowSeats = seats.filter((s) => s.row === rowLetter);
          return (
            <div key={rowLetter} className="flex items-center gap-1.5">
              <span className="w-4 text-slate-400 text-[10px] font-bold">{rowLetter}</span>
              <div className="grid grid-cols-10 gap-1 flex-1">
                {rowSeats.map((s) => {
                  let bg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
                  if (s.status === 'RESERVED')
                    bg = 'bg-amber-500/35 border-amber-400 text-amber-300';
                  if (s.status === 'SOLD')
                    bg = 'bg-rose-500/35 border-rose-500 text-rose-400';

                  return (
                    <div
                      key={s.id}
                      className={`h-6 rounded border text-[9px] flex items-center justify-center font-extrabold ${bg}`}
                      title={`${s.id} — ${s.status}`}
                    >
                      {s.col}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06]">
        Admin memantau penggabungan kursi yang sedang ditahan & dibeli dari seluruh playground pengunjung secara *real-time*.
      </p>
    </div>
  );
};
