import { absMin } from '@/shared/lib';

export interface LimitInfo {
  ld: string; // limit date
  lim: number; // limit time (minutes)
  sameDay: boolean;
  limAbs: number; // absolute minutes of the deadline
}

/** Resolve an occurrence's hard-limit deadline (date + time), or null if none. */
export function limitInfo(occ: {
  hardLimit: number | null;
  hardLimitDate: string | null;
  date: string;
}): LimitInfo | null {
  if (occ.hardLimit == null) return null;
  const ld = occ.hardLimitDate || occ.date;
  return { ld, lim: occ.hardLimit, sameDay: ld === occ.date, limAbs: absMin(ld, occ.hardLimit) };
}
