import { DAY } from '../../data/seedUtils.js';

export const PRESETS = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'custom', label: 'Custom range' },
];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** value = { preset, from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' } -> concrete range plus the previous period. */
export function resolveRange(value, now = Date.now()) {
  let from, to;
  if (value.preset === 'custom' && value.from && value.to) {
    from = startOfDay(value.from);
    to = endOfDay(value.to);
    if (from > to) [from, to] = [startOfDay(value.to), endOfDay(value.from)];
  } else {
    const days = PRESETS.find((p) => p.value === value.preset)?.days || 30;
    to = endOfDay(now);
    from = startOfDay(now - (days - 1) * DAY);
  }
  const days = Math.max(1, Math.round((to - from) / DAY));
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(from.getTime() - days * DAY);
  return { from, to, days, prevFrom, prevTo };
}

export const inRange = (iso, from, to) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

export const toInputDate = (d) => new Date(d).toISOString().slice(0, 10);
export const rangeLabel = (value) =>
  value.preset === 'custom' ? `${value.from || '…'} to ${value.to || '…'}` : PRESETS.find((p) => p.value === value.preset)?.label;
