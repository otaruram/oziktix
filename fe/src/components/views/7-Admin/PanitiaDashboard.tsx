import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { Ticket, SystemConfig } from '../../../types/ticketing';
import {
  Users,
  DollarSign,
  Percent,
  Clock,
  Download,
  RotateCcw,
  Settings,
  ShieldCheck,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Layers
} from 'lucide-react';

export const PanitiaDashboard: React.FC = () => {
  const {
    seats,
    tickets,
    swapLogs,
    config,
    updateConfig,
    refundTicket,
    addToast,
  } = useTicketing();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Editable config state
  const [editMaxSeats, setEditMaxSeats] = useState(config.maxSeatsPerUser);
  const [editHoldTtl, setEditHoldTtl] = useState(config.holdTtlSeconds);

  // Calculations for Live KPIs
  const totalCapacity = 60;
  const soldSeats = seats.filter((s) => s.status === 'SOLD').length;
  const reservedSeats = seats.filter((s) => s.status === 'RESERVED').length;
  const availableSeats = seats.filter((s) => s.status === 'AVAILABLE').length;

  const occupancyRate = ((soldSeats / totalCapacity) * 100).toFixed(1);

  // Calculate gross revenue from sold seats
  const grossRevenue = seats
    .filter((s) => s.status === 'SOLD')
    .reduce((acc, s) => acc + s.price, 0);

  const checkedInCount = tickets.filter((t) => t.status === 'USED').length;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.seatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTierFilter === 'ALL' || t.tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  // Export Manifest to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Ticket ID',
      'Seat Coordinate',
      'Tier',
      'Price (IDR)',
      'Attendee Name',
      'Google Email',
      'Masked NIK',
      'Status',
      'Purchased At',
      'Checked In At',
      'Swapped From',
      'HMAC Signature',
    ];

    const rows = tickets.map((t) => [
      `"${t.id}"`,
      `"${t.seatId}"`,
      `"${t.tier}"`,
      t.price,
      `"${t.userName}"`,
      `"${t.userEmail}"`,
      `"${t.userMaskedNik}"`,
      `"${t.status}"`,
      `"${new Date(t.purchasedAt).toLocaleString('id-ID')}"`,
      `"${t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('id-ID') : 'Pending'}"`,
      `"${t.swappedFromSeatId || 'None'}"`,
      `"${t.hmacSignature}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OzikTix_SMB_Atrium_Manifest_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Manifest Exported', 'Attendee manifest downloaded as Excel-compatible CSV.');
  };

  const handleSaveConfig = async () => {
    await updateConfig({
      maxSeatsPerUser: editMaxSeats,
      holdTtlSeconds: editHoldTtl,
    });
    setIsConfigOpen(false);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
              PANITIA ORGANIZER CONSOLE
            </span>
            <span className="text-xs text-slate-400">Summarecon Mall Bandung 2026</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Gala Operations & Master Manifest
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Config Modal Button */}
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Config System</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Manifest (.CSV)</span>
          </button>
        </div>
      </div>

      {/* System Config Accordion */}
      {isConfigOpen && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                System Parameters Configuration
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Changes apply immediately</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Max Seats Per User (Anti-Scalping Quota):
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={editMaxSeats}
                onChange={(e) => setEditMaxSeats(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Checkout Hold TTL (Seconds):
              </label>
              <input
                type="number"
                min="60"
                max="900"
                step="30"
                value={editHoldTtl}
                onChange={(e) => setEditHoldTtl(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Live KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>GROSS REVENUE</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            {formatRupiah(grossRevenue)}
          </div>
          <p className="text-[11px] text-slate-500">
            From {soldSeats} finalized transactions
          </p>
        </div>

        {/* KPI 2: Occupancy Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>OCCUPANCY RATE</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-cyan-400">
            {occupancyRate}%
          </div>
          <p className="text-[11px] text-slate-500">
            {soldSeats} sold / {totalCapacity} total capacity
          </p>
        </div>

        {/* KPI 3: Check-in Progress */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>GATE CHECK-INS</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-purple-400">
            {checkedInCount} <span className="text-xs text-slate-400 font-normal">/ {tickets.length}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Verified through Gate 01 barrier
          </p>
        </div>

        {/* KPI 4: Active Holds */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ACTIVE 5m HOLDS</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-400">
            {reservedSeats} Seats
          </div>
          <p className="text-[11px] text-slate-500">
            {availableSeats} seats remaining available
          </p>
        </div>
      </div>

      {/* Attendee Manifest Table & 1-Click Refund Action */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Attendee Manifest ({filteredTickets.length})
            </h3>
            <p className="text-xs text-slate-400">
              Master ticketing ledger with 1-click refund authorization.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket, name, seat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="VIP">VIP</option>
              <option value="REGULAR">Regular</option>
              <option value="FESTIVAL">Festival</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-3 px-2">Ticket ID</th>
                <th className="py-3 px-2">Seat</th>
                <th className="py-3 px-2">Tier</th>
                <th className="py-3 px-2">Attendee Name</th>
                <th className="py-3 px-2">Masked NIK</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No tickets found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 font-bold text-white">{t.id}</td>
                    <td className="py-3 px-2">
                      <span className="font-extrabold text-emerald-400">Seat {t.seatId}</span>
                      {t.swappedFromSeatId && (
                        <span className="text-[10px] text-purple-400 block">
                          ex-{t.swappedFromSeatId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${t.tier === 'VIP'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : t.tier === 'REGULAR'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                      >
                        {t.tier}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-200">{t.userName}</div>
                      <div className="text-[10px] text-slate-400">{t.userEmail}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-300">{t.userMaskedNik}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.status === 'USED'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {t.status !== 'REVOKED' ? (
                        <button
                          onClick={() => refundTicket(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold transition-colors"
                          title="1-Click Refund: Voids ticket and immediately returns seat to AVAILABLE"
                        >
                          1-Click Refund
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Voided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Atomic Seat Relocation Audit Logs (QA Point #4) */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Atomic Seat Relocation Audit Trail (QA Point #4)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {swapLogs.length} Swaps Recorded
          </span>
        </div>

        {swapLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center font-mono">
            No seat relocations logged yet. Attendees can perform 1 free relocation via the E-Ticket Pass.
          </p>
        ) : (
          <div className="space-y-2">
            {swapLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{log.userName}:</span>
                  <span className="line-through text-slate-500">Seat {log.fromSeatId}</span>
                  <span className="text-purple-400">→</span>
                  <span className="font-bold text-emerald-400">Seat {log.toSeatId}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300">
                    {log.tier}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
