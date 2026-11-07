import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { Flame, AlertTriangle } from 'lucide-react';

export const Concurrency409Test: React.FC = () => {
  const { seats, simulateConcurrencyRace, addToast } = useTicketing();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun409Test = async () => {
    const candidate = seats.find((s) => s.status === 'AVAILABLE');
    if (!candidate) {
      addToast('warning', 'No Seats Available', 'All seats are currently held or sold.');
      return;
    }

    setIsRunning(true);
    await simulateConcurrencyRace(candidate.id);
    setIsRunning(false);
  };

  return (
    <button
      onClick={handleRun409Test}
      disabled={isRunning}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono font-medium transition-all"
      title="Test HTTP 409 Conflict when two buyers race for the same seat"
    >
      <Flame className="w-3.5 h-3.5 text-rose-400" />
      <span>{isRunning ? 'Triggering 409...' : 'Simulate 409 Race Condition'}</span>
    </button>
  );
};

