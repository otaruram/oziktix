import React from 'react';
import { useTicketing } from '../../context/TicketingStore';
import { TopJudgeBar } from './TopJudgeBar';
import {
  Home,
  Map,
  Ticket as TicketIcon,
  QrCode,
  LayoutDashboard,
  Clock,
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { activeTab, setActiveTab, selectedSeatIds, tickets, currentUser } = useTicketing();

  const userTicketsCount = tickets.filter(
    (t) => t.userId === currentUser?.id && (t.status === 'ACTIVE' || t.status === 'USED')
  ).length;

  const isLanding = activeTab === 'landing';

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-black text-slate-100 font-sans">
      <TopJudgeBar />

      {isLanding ? (
        <main className="flex-1 w-full">{children}</main>
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10">
          {children}
        </main>
      )}

      {/* Mobile-First Bottom Navigation Bar (Only shown inside Core App views) */}
      {!isLanding && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-white/[0.1] px-2 py-1.5 flex items-center justify-around text-[10px] font-mono shadow-2xl">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <Home className="w-4 h-4" />
            <span>Landing</span>
          </button>

          <button
            onClick={() => setActiveTab('seatmap')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg relative transition-colors ${
              activeTab === 'seatmap' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Seat Map</span>
            {selectedSeatIds.length > 0 && (
              <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {selectedSeatIds.length}
              </span>
            )}
          </button>

          {selectedSeatIds.length > 0 && (
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors ${
                activeTab === 'checkout' ? 'text-amber-400 font-bold' : 'text-amber-400'
              }`}
            >
              <Clock className="w-4 h-4 animate-spin" />
              <span>Checkout</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg relative transition-colors ${
              activeTab === 'tickets' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span>Pass</span>
            {userTicketsCount > 0 && (
              <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {userTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors ${
              activeTab === 'scanner' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors ${
              activeTab === 'admin' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panitia</span>
          </button>
        </nav>
      )}
    </div>
  );
};
