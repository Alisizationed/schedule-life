import { useEffect, useMemo } from 'react';
import { sunTimes } from '@/shared/lib';
import type { SunTimes } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';

export interface ThemeInfo {
  sun: SunTimes | null;
  isDay: boolean;
  effTheme: 'light' | 'dark';
  toggle: () => void;
}

/** Resolves the active theme from local sunrise/sunset (or the manual override) and applies it. */
export function useSunTheme(now: Date): ThemeInfo {
  const location = useScheduleStore((s) => s.data.settings.location);
  const themeOverride = useScheduleStore((s) => s.data.settings.themeOverride);
  const updateSettings = useScheduleStore((s) => s.updateSettings);

  const bucket = Math.floor(now.getTime() / 3e5); // recompute sun ~every 5 min
  const sun = useMemo(
    () => sunTimes(now, location.lat, location.lon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.lat, location.lon, bucket],
  );
  const isDay = useMemo(
    () => (sun ? now >= sun.sunrise && now < sun.sunset : !(now.getHours() < 7 || now.getHours() >= 19)),
    [sun, now],
  );
  const effTheme: 'light' | 'dark' =
    themeOverride === 'auto' ? (isDay ? 'light' : 'dark') : themeOverride;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effTheme);
  }, [effTheme]);

  const toggle = () =>
    updateSettings((s) => {
      const o = s.themeOverride;
      s.themeOverride = o === 'auto' ? (isDay ? 'dark' : 'light') : o === 'light' ? 'dark' : 'auto';
    });

  return { sun, isDay, effTheme, toggle };
}
