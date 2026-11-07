import React from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Lock,
  Cpu
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { setActiveTab, seats, tickets } = useTicketing();

  const totalSeats = 60;
  const soldSeats = seats.filter((s) => s.status === 'SOLD').length;
  const reservedSeats = seats.filter((s) => s.status === 'RESERVED').length;
  const availableSeats = seats.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="min-h-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-[#0b101c] to-[#090d16] p-8 sm:p-12 shadow-2xl">
        {/* Subtle Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Bandung Build Challenge 2026 Showcase Event
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Summarecon Mall Bandung <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Atrium Gala 2026
            </span>
          </h1>

          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            The flagship interactive seating and anti-scalping e-ticketing experience. 
            Engineered with <span className="text-emerald-400 font-medium">optimistic row locking</span>, 
            <span className="text-cyan-400 font-medium"> 30-second rotating TOTP QR passes</span>, and 
            <span className="text-purple-400 font-medium"> atomic seat relocation</span> for Summarecon Mall Bandung's premier atrium.
          </p>

          {/* Event Quick Specs */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Event Date</div>
                <div className="text-white font-semibold">15 Nov 2026, 19:00 WIB</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Venue</div>
                <div className="text-white font-semibold">Main Atrium, SMB</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <Users className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Atrium Capacity</div>
                <div className="text-white font-semibold">60 Exclusive Seats</div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveTab('seatmap')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Interactive Seat Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Launch Gate Scanner Demo</span>
            </button>
          </div>
        </div>

        {/* Live Atrium Metrics Floating Card */}
        <div className="mt-8 lg:mt-0 lg:absolute lg:top-12 lg:right-12 w-full lg:w-72 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Live Atrium Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVE
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Available:</span>
              <span className="font-mono font-bold text-emerald-400">{availableSeats} / {totalSeats}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Held in Checkout:</span>
              <span className="font-mono font-bold text-amber-400">{reservedSeats}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Sold / Confirmed:</span>
              <span className="font-mono font-bold text-rose-400">{soldSeats}</span>
            </div>

            {/* Visual occupancy bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${(soldSeats / totalSeats) * 100}%` }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${(reservedSeats / totalSeats) * 100}%` }}
              />
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${(availableSeats / totalSeats) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explicit System Assumptions & Timing Rules Card (Required by Brief) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              System Architecture Assumptions & Anti-Scalp Timing Rules
            </h2>
            <p className="text-xs text-slate-400">
              Strict engineering specifications configured for the Bandung Build Challenge 2026.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rule 1: Max 2 Quota */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-semibold">QA POINT #1</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">MAX 2</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Purchase Quota Limit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforced at the Google OAuth account level. Users can acquire at most 2 seats total across all active reservations and purchases. Selecting a 3rd seat is strictly blocked.
            </p>
          </div>

          {/* Rule 2: 5-Minute Hold TTL */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400">
              <span className="font-semibold">QA POINT #3</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">300s TTL</span>
            </div>
            <h3 className="text-sm font-semibold text-white">5:00 Hold Timeout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a seat is selected, an optimistic row-level lock is held for 300 seconds. If checkout is not finalized within 5:00 minutes, the seat auto-releases back to emerald <code className="text-emerald-400">AVAILABLE</code>.
            </p>
          </div>

          {/* Rule 3: 30-Second TOTP */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="font-semibold">QA POINT #2</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">30s ROTATING</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Dynamic TOTP Nonce</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passes use HMAC-SHA256 signatures augmented with a 30-second time-based one-time password (TOTP). Static screenshots or shared WhatsApp images expire in &lt;30s and fail at the gate.
            </p>
          </div>

          {/* Rule 4: Atomic Relocation */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-400">
              <span className="font-semibold">QA POINT #4</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">1x FREE</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Atomic Seat Relocation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Users can swap wrong seats once for free within the same tier. The transaction is atomic: the previous seat instantly returns to <code className="text-emerald-400">AVAILABLE</code>, and the old QR hash is permanently revoked.
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Tier Cards */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Atrium Seating Tiers & Pricing</h2>
            <p className="text-xs text-slate-400">Strictly 60 seats configured in a 6x10 theater-style atrium grid.</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Currency: Indonesian Rupiah (IDR)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* VIP Tier */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ROWS A & B • 20 SEATS
                </span>
                <span className="text-xs font-mono text-slate-400">VIP</span>
              </div>
              <h3 className="text-xl font-bold text-white">VIP Front Row</h3>
              <div className="mt-2 text-2xl font-mono font-extrabold text-emerald-400">
                Rp 250.000 <span className="text-xs text-slate-400 font-normal">/ seat</span>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Direct frontline sightline to the Gala stage with cushioned leather seating, complimentary gala kit, and priority gate access.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Row A (A1–A10) & Row B (B1–B10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Complimentary Welcome Drink & Gala Kit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Priority Fast-Track Gate Entry</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setActiveTab('seatmap')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-medium text-xs transition-colors"
            >
              Select VIP Seats
            </button>
          </div>

          {/* Regular Tier */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/5">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  ROWS C & D • 20 SEATS
                </span>
                <span className="text-xs font-mono text-slate-400">REGULAR</span>
              </div>
              <h3 className="text-xl font-bold text-white">Regular Tier</h3>
              <div className="mt-2 text-2xl font-mono font-extrabold text-cyan-400">
                Rp 150.000 <span className="text-xs text-slate-400 font-normal">/ seat</span>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Center atrium positioning with balanced acoustic fidelity and comfortable mid-row visibility for all stage performances.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Row C (C1–C10) & Row D (D1–D10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Center-Aisle Acoustic Alignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Standard Atrium Gala Admission</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setActiveTab('seatmap')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-medium text-xs transition-colors"
            >
              Select Regular Seats
            </button>
          </div>

          {/* Festival Tier */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/5">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  ROWS E & F • 20 SEATS
                </span>
                <span className="text-xs font-mono text-slate-400">FESTIVAL</span>
              </div>
              <h3 className="text-xl font-bold text-white">Festival Zone</h3>
              <div className="mt-2 text-2xl font-mono font-extrabold text-purple-400">
                Rp 100.000 <span className="text-xs text-slate-400 font-normal">/ seat</span>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Energetic upper tier right beside the sound & light consoles. Perfect for fans enjoying the dynamic gala ambiance.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Row E (E1–E10) & Row F (F1–F10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Interactive Lightband Synced Area</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>High Energy Community Seating</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setActiveTab('seatmap')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-purple-500 hover:text-slate-950 text-white font-medium text-xs transition-colors"
            >
              Select Festival Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

