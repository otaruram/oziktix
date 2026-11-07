import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../../services/admin.api';
import { AdminMetrics } from '../../../types';
import { DollarSign, Percent, Users, Clock } from 'lucide-react';

export const MetricsRow: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const fetchMetrics = async () => {
    const data = await AdminApi.getMetrics();
    setMetrics(data);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left font-mono">
      {/* Gross Revenue */}
      <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-1">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>GROSS REVENUE</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-extrabold text-emerald-400">
          {formatRupiah(metrics.grossRevenue)}
        </div>
        <div className="text-[10px] text-slate-500">From {metrics.soldSeats} tickets sold</div>
      </div>

      {/* Occupancy Rate */}
      <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-1">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>OCCUPANCY RATE</span>
          <Percent className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-xl font-extrabold text-cyan-400">{metrics.occupancyRate}%</div>
        <div className="text-[10px] text-slate-500">
          {metrics.soldSeats} / {metrics.totalCapacity} capacity
        </div>
      </div>

      {/* Gate Check-Ins */}
      <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-1">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>GATE CHECK-INS</span>
          <Users className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-xl font-extrabold text-purple-400">
          {metrics.checkedInCount} / {metrics.soldSeats}
        </div>
        <div className="text-[10px] text-slate-500">Verified through barrier</div>
      </div>

      {/* Active Holds */}
      <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/[0.08] space-y-1">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>ACTIVE 5m HOLDS</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-extrabold text-amber-400">{metrics.reservedSeats} Seats</div>
        <div className="text-[10px] text-slate-500">{metrics.availableSeats} available</div>
      </div>
    </div>
  );
};
