/** Calendar-date helpers working with "YYYY-MM-DD" local date strings. */
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const dstr = (d: Date): string =>
  d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number): string => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dstr(d);
};

export const todayStr = (): string => dstr(new Date());

export const weekdayOf = (s: string): number => parseDate(s).getDay(); // 0=Sun..6=Sat

export const startOfWeekMon = (s: string): string => {
  const wd = weekdayOf(s);
  return addDays(s, -((wd + 6) % 7));
};

export const shortDate = (s: string): string =>
  parseDate(s).getDate() + ' ' + MON[parseDate(s).getMonth()];

/** Local minutes since epoch for a date string + minutes-into-day — used to compare deadlines across days. */
export const absMin = (dateStr: string, min: number): number =>
  Math.round(parseDate(dateStr).getTime() / 60000) + min;
