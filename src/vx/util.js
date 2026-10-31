// Formatting + shape helpers. The API's response shapes are read defensively (field names vary).
export const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export const humanize = (k) => String(k).replace(/_minor$/, '').replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
export const num = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : n ?? '—');
export const money = (minor, cur = 'INR') => {
  if (typeof minor !== 'number') return '—';
  try { return (minor / 100).toLocaleString('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }); } catch { return `${cur} ${(minor / 100).toFixed(0)}`; }
};
export const dateFmt = (v, withTime = false) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v ?? '—';
  return d.toLocaleString('en-IN', withTime ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' });
};
export const initials = (s = '') => String(s).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const first = (o, ...keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined; };
export const rowsOf = (d) => (Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : Array.isArray(d?.results) ? d.results : []);
export const totalOf = (d, n) => (isObj(d) ? first(d, 'total', 'count', 'total_count') : undefined) ?? n;

const DATE_KEY = /(^|_)(at|date|day|time|month|week)$|^(date|day|period)$/i;
export const looksDate = (k, v) => DATE_KEY.test(k) || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));

// Render any scalar value into display text, using the key name as a hint.
export function fmtValue(k, v, row) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') {
    if (/_minor$/.test(k) || /(revenue|amount|balance|value|mrr|price)$/i.test(k) && Number.isInteger(v) && /minor/.test(k)) return money(v, row?.currency || 'INR');
    if (/(rate|ratio|pct|percent)/i.test(k) && v <= 1) return `${Math.round(v * 100)}%`;
    return num(v);
  }
  if (typeof v === 'string' && looksDate(k, v)) return dateFmt(v, /_at$|time/i.test(k));
  return String(v);
}

// Flatten scalar fields (one nested level) of an object into KPI entries.
export function kpisOf(obj, prefix = '') {
  const out = [];
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (['string', 'number', 'boolean'].includes(typeof v) && !(typeof v === 'string' && (looksDate(k, v) || v.length > 28))) out.push({ key: prefix + k, label: humanize((prefix ? `${prefix} ` : '') + k).replace(/_/g, ' '), raw: v, value: fmtValue(k, v, obj) });
    else if (isObj(v) && !prefix) out.push(...kpisOf(v, k));
  });
  return out;
}

// Pick sensible table columns from rows: preferred keys first, scalars only, skip noisy ids.
export function autoColumns(rows, prefer = [], max = 7) {
  const sample = rows.slice(0, 20);
  const keys = [];
  sample.forEach((r) => Object.keys(r || {}).forEach((k) => { if (!keys.includes(k)) keys.push(k); }));
  const scalar = keys.filter((k) => sample.every((r) => r?.[k] === null || r?.[k] === undefined || typeof r[k] !== 'object'));
  const skip = (k) => /^(id|.*_id|uuid|password.*|.*token.*)$/i.test(k) && !prefer.includes(k);
  const ordered = [...prefer.filter((k) => scalar.includes(k)), ...scalar.filter((k) => !prefer.includes(k) && !skip(k))];
  return ordered.slice(0, max).map((key) => ({ key, label: humanize(key) }));
}

export const statusTone = (s = '') => {
  const t = String(s).toLowerCase();
  if (/(paid|active|success|published|live|trial|completed|enabled|ok)/.test(t)) return 'good';
  if (/(fail|cancel|expired|void|error|overdue|disabled|unpaid)/.test(t)) return 'bad';
  if (/(pending|open|draft|past_due|due|processing)/.test(t)) return 'warn';
  return '';
};
