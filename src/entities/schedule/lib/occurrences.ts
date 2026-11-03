import { weekdayOf } from '@/shared/lib';
import type { Occurrence, ScheduleData } from '../model/types';

/** Resolve all occurrences on a date: one-off tasks + recurring items (with per-date overrides and term range). */
export function occForDate(data: ScheduleData, date: string): Occurrence[] {
  const wd = weekdayOf(date);
  const out: Occurrence[] = [];
  const term = data.settings?.term ?? { start: null, end: null };
  const inTerm = (!term.start || date >= term.start) && (!term.end || date <= term.end);

  data.tasks.forEach((t) => {
    if (t.date === date) out.push({ ...t, kind: 'task', links: t.links || [] });
  });

  data.recurring.forEach((r) => {
    if (r.weekday !== wd || !inTerm) return;
    const key = r.id + '|' + date;
    const ov = data.overrides[key];
    if (ov && ov.status === 'cancelled') return;
    const base: Occurrence = {
      id: key,
      recurringId: r.id,
      date,
      kind: 'recurring',
      title: r.title,
      start: r.start,
      allocatedMinutes: r.allocatedMinutes,
      hardLimit: r.hardLimit ?? null,
      hardLimitDate: r.hardLimitDate ?? null,
      priority: r.priority,
      type: r.type,
      links: r.links || [],
      notes: r.notes || '',
      done: false,
      modified: false,
    };
    if (ov && ov.status === 'modified') {
      Object.assign(base, ov.fields || {});
      base.modified = true;
    }
    out.push(base);
  });

  return out.sort((a, b) => a.start - b.start);
}

export interface LaidOccurrence {
  o: Occurrence;
  start: number;
  end: number;
  col: number;
  cols: number;
}

/** Interval-partition overlapping occurrences into side-by-side columns (calendar layout). */
export function layoutDay(occs: Occurrence[]): LaidOccurrence[] {
  const items: LaidOccurrence[] = occs
    .map((o) => ({
      o,
      start: o.start,
      end: Math.max(o.start + o.allocatedMinutes, o.start + 12),
      col: 0,
      cols: 1,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const res: LaidOccurrence[] = [];
  let cluster: LaidOccurrence[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const cols: number[] = [];
    cluster.forEach((it) => {
      let c = cols.findIndex((end) => end <= it.start);
      if (c < 0) {
        c = cols.length;
        cols.push(it.end);
      } else {
        cols[c] = it.end;
      }
      it.col = c;
    });
    cluster.forEach((it) => {
      it.cols = cols.length;
      res.push(it);
    });
  };

  items.forEach((it) => {
    if (cluster.length && it.start < clusterEnd) {
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, it.end);
    } else {
      if (cluster.length) flush();
      cluster = [it];
      clusterEnd = it.end;
    }
  });
  if (cluster.length) flush();
  return res;
}
