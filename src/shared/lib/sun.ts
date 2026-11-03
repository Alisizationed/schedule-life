/** Sunrise / sunset for a date and location, computed on-device (NOAA algorithm, no network). */
export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

export function sunTimes(date: Date, lat: number, lng: number): SunTimes | null {
  try {
    const rad = Math.PI / 180;
    const dayMs = 864e5;
    const J1970 = 2440588;
    const J2000 = 2451545;
    const toJulian = (d: Date): number => d.valueOf() / dayMs - 0.5 + J1970;
    const fromJulian = (j: number): Date => new Date((j + 0.5 - J1970) * dayMs);
    const toDays = (d: Date): number => toJulian(d) - J2000;
    const e = rad * 23.4397;
    const solarMeanAnomaly = (d: number): number => rad * (357.5291 + 0.98560028 * d);
    const eclLon = (M: number): number => {
      const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
      return M + C + rad * 102.9372 + Math.PI;
    };
    const dec = (L: number): number => Math.asin(Math.sin(e) * Math.sin(L));
    const J0 = 0.0009;
    const transit = (ht: number, lw: number, n: number): number => J0 + (ht + lw) / (2 * Math.PI) + n;
    const stJ = (ds: number, M: number, L: number): number =>
      J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const n = Math.round(d - J0 - lw / (2 * Math.PI));
    const ds = transit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclLon(M);
    const de = dec(L);
    const Jnoon = stJ(ds, M, L);
    const h0 = -0.833 * rad;
    const w = Math.acos(
      (Math.sin(h0) - Math.sin(phi) * Math.sin(de)) / (Math.cos(phi) * Math.cos(de)),
    );
    if (Number.isNaN(w)) return null; // polar day / night
    const Jset = stJ(transit(w, lw, n), M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset) };
  } catch {
    return null;
  }
}
