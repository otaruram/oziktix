import React, { useState } from 'react';
import { useTicketing } from '../../../context/TicketingStore';
import { QrCode, Sparkles, Lock, ArrowLeft, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { OrderSummary } from './OrderSummary';
import { Seat, Ticket } from '../../../types';

export const SandboxQRIS: React.FC = () => {
  const { checkout, setActiveTab, selectedSeatIds, seats, holdSecondsRemaining } = useTicketing();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [stoppedAtSeconds, setStoppedAtSeconds] = useState<number | null>(null);
  const [paidSeatsSnapshot, setPaidSeatsSnapshot] = useState<Seat[]>([]);
  const [issuedTickets, setIssuedTickets] = useState<Ticket[]>([]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    const snapshotSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
    const snapshotTimer = holdSecondsRemaining;

    const res = await checkout(false);
    setIsProcessing(false);

    if (res.success) {
      setStoppedAtSeconds(snapshotTimer);
      setPaidSeatsSnapshot(snapshotSeats);
      setIssuedTickets(res.tickets || []);
      setIsPaid(true);
    }
  };

  if (selectedSeatIds.length === 0 && !isPaid) {
    return (
      <div className="py-12 px-6 rounded-3xl bg-[#0b0f19] border border-white/[0.1] text-center space-y-4">
        <h3 className="text-lg font-bold text-white font-mono">Belum Ada Kursi yang Dipilih</h3>
        <p className="text-xs text-slate-400">
          Silakan pilih paket dan kursi terlebih dahulu pada denah Seat Map untuk memulai sesi pembayaran.
        </p>
        <button
          onClick={() => setActiveTab('seatmap')}
          className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold font-mono text-xs transition-colors"
        >
          ← Kembali ke Seat Map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab('seatmap')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-mono text-white hover:border-emerald-400/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Seat Map</span>
        </button>
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
          {isPaid ? '✓ Pembayaran Selesai (Timer Dihentikan)' : 'Halaman Pembayaran Resmi (Checkout)'}
        </span>
      </div>

      <OrderSummary
        isPaid={isPaid}
        stoppedAtSeconds={stoppedAtSeconds}
        paidSeatsSnapshot={paidSeatsSnapshot}
      >
        {/* Sandbox QRIS Payment Card */}
        {isPaid ? (
          <div className="p-6 rounded-2xl bg-[#0b0f19] border-2 border-emerald-500/50 space-y-5 text-left font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase">
                    Pembayaran QRIS Berhasil Dikonfirmasi!
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Countdown timer dihentikan pada {Math.floor((stoppedAtSeconds || 0) / 60)}:
                    {((stoppedAtSeconds || 0) % 60).toString().padStart(2, '0')} • Tiket Kriptografi Resmi Diterbitkan
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-400 text-slate-950 font-extrabold text-xs self-start sm:self-auto">
                PAID • RECORDED IN ADMIN DB
              </span>
            </div>

            {issuedTickets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {issuedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400">Kursi {t.seatId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                        AKTIF (SOLD)
                      </span>
                    </div>
                    <div className="text-white font-semibold">{t.userName}</div>
                    <div className="text-[10px] text-slate-400 truncate">Ticket ID: {t.id}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('tickets')}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Buka Digital Pass & Lihat QR TOTP (30s)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/[0.15] text-white font-bold text-xs uppercase transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Cek di Panitia Console (Admin)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-white/[0.1] space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-mono font-extrabold text-white uppercase">
                  Metode Pembayaran Instan (QRIS / Virtual Account)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                MENUNGGU KONFIRMASI BAYAR
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-white/[0.08] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center border border-slate-300">
                <div className="w-full h-full border-2 border-slate-900 rounded grid grid-cols-3 gap-0.5 p-0.5">
                  <div className="bg-slate-900 col-span-2"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900 col-span-2"></div>
                </div>
              </div>

              <div className="text-xs space-y-1.5 font-mono">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Konfirmasi Pembayaran QRIS (BCA / GoPay / Mandiri / Livin)</span>
                </div>
                <p className="text-slate-300 font-sans">
                  Klik tombol pembayaran di bawah untuk melunasi pesanan. Begitu diklik,{' '}
                  <strong className="text-white">waktu hitung mundur (countdown) akan langsung berhenti</strong>, kursi dikunci permanen sebagai <strong className="text-emerald-400">SOLD</strong>, dan transaksi langsung tercatat di dashboard <strong className="text-sky-400">Admin Panitia</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm uppercase font-mono tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Memverifikasi Pembayaran & Menghentikan Timer...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Bayar Sekarang via QRIS & Hentikan Timer</span>
                </>
              )}
            </button>
          </div>
        )}
      </OrderSummary>
    </div>
  );
};

