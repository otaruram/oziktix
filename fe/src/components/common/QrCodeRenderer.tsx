import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock } from 'lucide-react';

interface QrCodeRendererProps {
  payload: string;
  size?: number;
  isLocked?: boolean;
  lockMessage?: string;
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  payload,
  size = 200,
  isLocked = false,
  lockMessage = 'QR Activates 2 Hours Before Event',
}) => {
  return (
    <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-200/80 inline-flex items-center justify-center">
      {isLocked ? (
        <div
          style={{ width: size, height: size }}
          className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl text-center space-y-2 text-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-400 leading-tight">
            {lockMessage}
          </span>
          <span className="text-[10px] text-slate-400">
            Pre-gate security lock active
          </span>
        </div>
      ) : (
        <QRCodeSVG
          value={payload || 'EMPTY_PAYLOAD'}
          size={size}
          level="H"
          includeMargin={false}
        />
      )}
    </div>
  );
};

