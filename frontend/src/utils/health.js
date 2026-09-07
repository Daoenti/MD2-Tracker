// Pure display logic ported from the original client — stays client-side, never round-trips.
export function healthClass(remaining, max) {
  if (max <= 0) return 'stat-dead';
  if (remaining <= 0) return 'stat-dead';
  const pct = remaining / max;
  if (pct > 0.6) return 'stat-ok';
  if (pct > 0.3) return 'stat-warn';
  return 'stat-danger';
}
