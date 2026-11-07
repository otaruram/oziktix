import React from 'react';
import { useTicketing } from '../../../context/TicketingStore';

export const VenueMiniMap: React.FC = () => {
  const { seats } = useTicketing();
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  const soldCount = seats.filter((s) => s.status === 'SOLD').length;
  const heldCount = seats.filter((s) => s.status === 'RESERVED').length;
  const freeCount = Math.max(0, seats.length - soldCount - heldCount);

  const tierStats = [
    {
      tier: 'VIP',
      label: 'VIP (Row A–B)',
      total: 20,
      price: 250000,
      sold: seats.filter((s) => s.tier === 'VIP' && s.status === 'SOLD').length,
      held: seats.filter((s) => s.tier === 'VIP' && s.status === 'RESERVED').length,
      barColor: 'bg-emerald-400',
      textColor: 'text-emerald-400',
    },
    {
      tier: 'REGULAR',
      label: 'Regular (Row C–D)',
      total: 20,
      price: 150000,
      sold: seats.filter((s) => s.tier === 'REGULAR' && s.status === 'SOLD').length,
      held: seats.filter((s) => s.tier === 'REGULAR' && s.status === 'RESERVED').length,
      barColor: 'bg-cyan-400',
      textColor: 'text-cyan-400',
    },
    {
      tier: 'FESTIVAL',
      label: 'Festival (Row E–F)',
      total: 20,
      price: 100000,
      sold: seats.filter((s) => s.tier === 'FESTIVAL' && s.status === 'SOLD').length,
      held: seats.filter((s) => s.tier === 'FESTIVAL' && s.status === 'RESERVED').length,
      barColor: 'bg-purple-400',
      textColor: 'text-purple-400',
    },
  ];

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-5 text-left font-mono text-xs">
      <div className="p-5 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-4">
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
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Lunas / Merah ({soldCount})
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
          Admin memantau penggabungan kursi yang sedang ditahan (Kuning) & sudah lunas (Merah) dari seluruh pengunjung secara *real-time*.
        </p>
      </div>

      {/* Live Occupancy & Revenue Distribution Chart per Tier */}
      <div className="p-5 rounded-3xl bg-[#0b0f19] border border-white/[0.08] space-y-4">
        <div className="pb-2.5 border-b border-white/[0.08] flex items-center justify-between">
          <span className="font-bold text-white uppercase text-[11px]">
            Grafik Okupansi & Revenue per Tier
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">Live Telemetry</span>
        </div>

        <div className="space-y-3.5">
          {tierStats.map((st) => {
            const pct = Math.min(100, Math.round(((st.sold + st.held) / st.total) * 100));
            const soldPct = Math.min(100, Math.round((st.sold / st.total) * 100));
            return (
              <div key={st.tier} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${st.textColor}`}>{st.label}</span>
                  <span className="text-white font-semibold">
                    {st.sold} Lunas • {st.held} Hold / {st.total} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 border border-white/[0.08] overflow-hidden flex">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${soldPct}%` }}
                    title={`Lunas: ${st.sold} kursi`}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.max(0, pct - soldPct)}%` }}
                    title={`Hold: ${st.held} kursi`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Harga: {formatRupiah(st.price)}/kursi</span>
                  <span className="text-emerald-400 font-semibold">
                    Subtotal: {formatRupiah(st.sold * st.price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
