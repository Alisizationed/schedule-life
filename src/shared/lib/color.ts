/** Pick a readable ink color (black/white) for text on a given hex background. */
export function textOn(hex: string): string {
  if (!hex) return '#121212';
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#121212' : '#ffffff';
}
