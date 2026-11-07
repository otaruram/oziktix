import React from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  badge?: string;
  className?: string;
  interactive?: boolean;
}

/**
 * OzikTix Bespoke Brand Mark (Anti-Slop Guided)
 * Architecture:
 * 1. Physical Ticket-Perforation Silhouette (dual side architectural notches).
 * 2. High-concurrency Laser 'Z' Monogram + Interlocking Oval 'O'.
 * 3. Central Cryptographic TOTP/HMAC Pulse Aperture.
 */
export const BrandMark: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 32,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={sizePx}
      height={sizePx}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] ${className}`}
      aria-label="OzikTix Cryptographic Ticket Mark"
    >
      <defs>
        <linearGradient id="ozik-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="ozik-mark-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Ticket-Stub Contour with Architectural Side Notches */}
      <path
        d="M 14,4 C 8.5,4 5,7.5 5,13 L 5,24 C 9.5,24 13,27.5 13,32 C 13,36.5 9.5,40 5,40 L 5,51 C 5,56.5 8.5,60 14,60 L 50,60 C 55.5,60 59,56.5 59,51 L 59,40 C 54.5,40 51,36.5 51,32 C 51,27.5 54.5,24 59,24 L 59,13 C 59,7.5 55.5,4 50,4 Z"
        fill="url(#ozik-mark-bg)"
        stroke="url(#ozik-mark-emerald)"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />

      {/* Perforation Reference Notch Hairlines */}
      <line
        x1="13"
        y1="32"
        x2="19"
        y2="32"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
        strokeDasharray="2 3"
      />
      <line
        x1="45"
        y1="32"
        x2="51"
        y2="32"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
        strokeDasharray="2 3"
      />

      {/* Outer Stadium Frame 'O' */}
      <rect
        x="18"
        y="14"
        width="28"
        height="36"
        rx="8"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeOpacity="0.25"
      />

      {/* High-speed Kinetic 'Z' Monogram */}
      <path
        d="M 22,21 H 42 L 22,43 H 42"
        fill="none"
        stroke="url(#ozik-mark-emerald)"
        strokeWidth="4.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Cryptographic Heartbeat / TOTP Core */}
      <circle cx="32" cy="32" r="3.5" fill="#ffffff" />
      <circle cx="32" cy="32" r="1.5" fill="#020617" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  badge = "SMB '26",
  className = '',
  interactive = false,
}) => {
  const sizeMap = {
    xs: { px: 20, text: 'text-sm', badge: 'text-[9px]' },
    sm: { px: 28, text: 'text-base', badge: 'text-[9px]' },
    md: { px: 36, text: 'text-xl', badge: 'text-[10px]' },
    lg: { px: 48, text: 'text-2xl sm:text-3xl', badge: 'text-xs' },
    xl: { px: 64, text: 'text-3xl sm:text-4xl', badge: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        interactive ? 'cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${className}`}
    >
      <BrandMark sizePx={current.px} />
      {showText && (
        <div className="flex items-center gap-2">
          <div className={`font-display font-black tracking-tight leading-none ${current.text}`}>
            <span className="text-white">Ozik</span>
            <span className="text-emerald-400">Tix</span>
          </div>
          {badge && (
            <span
              className={`font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 leading-none ${current.badge}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
