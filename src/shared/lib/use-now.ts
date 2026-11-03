import { useEffect, useState } from 'react';

/** A ticking "now" clock. Re-renders on the given interval (default 30s). */
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
