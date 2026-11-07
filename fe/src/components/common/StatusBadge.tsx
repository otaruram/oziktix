import React from 'react';
import { SeatStatus, TicketStatus, ScanVerdict } from '../../types';

interface StatusBadgeProps {
  status: SeatStatus | TicketStatus | ScanVerdict | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let label = status;

  // Strict Semantic Status System
  switch (status) {
    case 'AVAILABLE':
    case 'VALID':
    case 'ACTIVE':
      colorStyles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10';
      dotColor = 'bg-emerald-400';
      break;
    case 'RESERVED':
    case 'ALREADY_USED':
    case 'USED':
      colorStyles = 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10';
      dotColor = 'bg-amber-400';
      label = status === 'ALREADY_USED' ? 'ALREADY USED' : status;
      break;
    case 'SOLD':
    case 'INVALID':
    case 'REVOKED':
      colorStyles = 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/10';
      dotColor = 'bg-rose-500';
      break;
    default:
      break;
  }

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded-full border ${sizeStyles} ${colorStyles}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
      )}
      <span>{label}</span>
    </span>
  );
};

