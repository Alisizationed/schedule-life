/** Minutes-in-a-day helpers and misc primitives (project-agnostic). */
export const DAY = 1440;

export const pad = (n: number): string => String(n).padStart(2, '0');

export const minToHHMM = (m: number): string => {
  m = ((m % DAY) + DAY) % DAY;
  return pad(Math.floor(m / 60)) + ':' + pad(Math.round(m % 60));
};

export const hhmmToMin = (s: string): number => {
  if (!s) return 0;
  const [a, b] = s.split(':').map(Number);
  return a * 60 + (b || 0);
};

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export const snap = (m: number, g = 5): number => Math.round(m / g) * g;

export const fmtDur = (m: number): string => {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return (h ? h + 'h' : '') + (mm ? (h ? ' ' : '') + mm + 'm' : h ? '' : '0m');
};

export const fmtDurLong = (m: number): string => {
  m = Math.round(m);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return [d ? d + 'd' : '', h ? h + 'h' : '', mm && !d ? mm + 'm' : ''].filter(Boolean).join(' ') || '0m';
};

export const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
