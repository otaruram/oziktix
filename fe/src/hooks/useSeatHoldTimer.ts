import { useState, useEffect, useCallback } from 'react';

export const useSeatHoldTimer = (
  initialSeconds: number = 300,
  onExpire?: () => void
) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const startTimer = useCallback((seconds: number = 300) => {
    setSecondsRemaining(seconds);
    setIsActive(true);
    setIsExpired(false);
  }, []);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback((seconds: number = 300) => {
    setSecondsRemaining(seconds);
    setIsActive(true);
    setIsExpired(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(false);
          setIsExpired(true);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / initialSeconds) * 100));

  return {
    secondsRemaining,
    formattedTime,
    percentRemaining,
    isActive,
    isExpired,
    startTimer,
    stopTimer,
    resetTimer,
  };
};

