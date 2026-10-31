export const fmtInt = (n) => Math.round(n || 0).toLocaleString('en-IN');
export const fmtPct = (n, d = 1) => `${(n || 0).toFixed(d)}%`;

export const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtShortDay = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function relTime(v, now = Date.now()) {
  if (!v) return '—';
  const diff = Math.max(0, now - new Date(v).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return fmtDate(v);
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export const avg = (arr, f = (x) => x) => (arr.length ? arr.reduce((a, b) => a + f(b), 0) / arr.length : 0);
export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0);
export const byId = (arr) => Object.fromEntries(arr.map((r) => [r.id, r]));
export const fullName = (s) => (s ? `${s.firstName} ${s.lastName}` : 'Unknown');
