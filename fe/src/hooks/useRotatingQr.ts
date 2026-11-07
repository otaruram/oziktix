import { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket } from '../types';
import { TicketApi } from '../services/ticket.api';
import { computeTotpNonce, formatQrPayload } from '../utils/crypto';

export const useRotatingQr = (ticket: Ticket | null) => {
  const [nonce, setNonce] = useState<string>('000000');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchPayloadFromBackend = useCallback(async (ticketId: string) => {
    try {
      const data = await TicketApi.getRotatingQrPayload(ticketId);
      if (data && data.displayNonce && data.rawPayload) {
        setNonce(data.displayNonce);
        setSecondsRemaining(data.secondsRemaining || 30);
        setQrPayload(data.rawPayload);
        return true;
      }
    } catch {
      // Fallback to local crypto computation
    }
    return false;
  }, []);

  useEffect(() => {
    if (!ticket) {
      setNonce('000000');
      setSecondsRemaining(30);
      setQrPayload('');
      return;
    }

    let isMounted = true;

    const refreshPayload = async () => {
      const ok = await fetchPayloadFromBackend(ticket.id);
      if (!ok && isMounted) {
        const { nonce: nextNonce, secondsRemaining: rem } = computeTotpNonce(ticket.id);
        setNonce(nextNonce);
        setSecondsRemaining(rem);
        const payload = formatQrPayload({
          ticketId: ticket.id,
          seatId: ticket.seatId,
          userId: ticket.userId,
          nonce: nextNonce,
          hmacSignature: ticket.hmacSignature,
        });
        setQrPayload(payload);
      }
    };

    refreshPayload();

    // 1-second countdown ticker
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshPayload();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [ticket?.id, ticket?.seatId, ticket?.userId, ticket?.hmacSignature, fetchPayloadFromBackend]);

  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / 30) * 100));

  return {
    nonce,
    secondsRemaining,
    percentRemaining,
    qrPayload,
    isLoading,
  };
};
