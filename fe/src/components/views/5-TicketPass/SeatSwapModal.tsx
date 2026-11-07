import React, { useState } from 'react';
import { Ticket, Seat } from '../../../types';
import { useTicketing } from '../../../context/TicketingStore';
import { ArrowRightLeft, X, Sparkles } from 'lucide-react';

interface SeatSwapModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

export const SeatSwapModal: React.FC<SeatSwapModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const { seats, swapSeat } = useTicketing();
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  if (!isOpen) return null;

  // Filter available seats in the SAME tier
  const availableSameTier = seats.filter(
    (s) => s.tier === ticket.tier && s.status === 'AVAILABLE'
  );

  const handleConfirmSwap = async () => {
    if (!selectedSeatId) return;
    setIsSwapping(true);
    const res = await swapSeat(ticket.id, selectedSeatId);
    setIsSwapping(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0f19] border border-white/[0.12] p-6 sm:p-7 shadow-2xl space-y-5 text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono font-bold text-purple-400 uppercase">
              QA Point #4: Atomic Relocation
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">Relocate Seat (1x Free Swap)</h3>
          <p className="text-xs text-slate-400">
            Current Seat: <span className="font-bold text-white">{ticket.seatId}</span> ({ticket.tier} Tier).
          </p>
        </div>

        {/* Available Seats Grid */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400">
            Available {ticket.tier} Seats:
          </span>

          {availableSameTier.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              No other seats are currently available in the {ticket.tier} tier.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
              {availableSameTier.map((cand) => (
                <button
                  key={cand.id}
                  onClick={() => setSelectedSeatId(cand.id)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                    selectedSeatId === cand.id
                      ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                      : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  {cand.id}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-white flex items-center gap-1 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Atomic Transaction Guarantees:</span>
          </div>
          <p>
            Old seat {ticket.seatId} immediately turns green AVAILABLE on the map. Old QR signature is revoked.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSwap}
            disabled={!selectedSeatId || isSwapping}
            className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase font-mono tracking-wider transition-all disabled:opacity-50"
          >
            {isSwapping ? 'Swapping...' : `Confirm Swap to ${selectedSeatId || '...'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

