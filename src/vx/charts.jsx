import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty, Seg } from './ui.jsx';
import { dateFmt, humanize, isObj, looksDate, num } from './util.js';

/** Find the array of points inside an API payload (array, or first array-valued field). */
export const pointsOf = (d) => {
  if (Array.isArray(d)) return d;
  if (isObj(d)) {
    const k = Object.keys(d).find((x) => Array.isArray(d[x]) && d[x].length && isObj(d[x][0]));
    if (k) return d[k];
  }
  return [];
};

/** Bar chart of a time series; picks the date key and numeric series automatically. */
export function TrendChart({ points, height = 250, metric: forced }) {
  const { xKey, series } = useMemo(() => {
    const r = points?.[0] || {};
    const keys = Object.keys(r);
    const x = keys.find((k) => looksDate(k, r[k])) || keys.find((k) => typeof r[k] === 'string') || keys[0];
    return { xKey: x, series: keys.filter((k) => k !== x && typeof r[k] === 'number' && !/_id$|^id$/.test(k)) };
  }, [points]);
  const [pick, setPick] = useState(null);
  const metric = forced || (series.includes(pick) ? pick : series[0]);
  if (!points?.length || !metric) return <Empty title="No data for this period" />;
  const max = Math.max(...points.map((p) => p[metric] || 0));
  const fmtX = (v) => (looksDate(xKey, v) ? dateFmt(v).replace(/ \d{4}$/, '') : v);
  return (
    <div>
      {series.length > 1 && !forced && <div style={{ marginBottom: 10 }}><Seg value={metric} onChange={setPick} options={series.slice(0, 4).map((s) => ({ value: s, label: humanize(s) }))} /></div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={points} margin={{ top: 6, right: 0, left: -18, bottom: 0 }}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#ee5d2c" /><line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeWidth="2" opacity="0.55" /></pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--vx-line)" />
          <XAxis dataKey={xKey} tickFormatter={fmtX} tick={{ fontSize: 11, fill: 'var(--vx-ink-3)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--vx-ink-3)' }} axisLine={false} tickLine={false} tickFormatter={num} />
          <Tooltip cursor={{ fill: 'var(--vx-card-2)' }} contentStyle={{ borderRadius: 14, border: 0, background: 'var(--vx-card)', color: 'var(--vx-ink)', boxShadow: 'var(--vx-pop)' }} labelFormatter={fmtX} formatter={(v) => [num(v), humanize(metric)]} />
          <Bar dataKey={metric} radius={[7, 7, 7, 7]} maxBarSize={22} isAnimationActive animationDuration={1000} animationEasing="ease-out">
            {points.map((p, i) => <Cell key={i} fill={p[metric] >= max * 0.6 ? 'var(--vx-ink)' : 'url(#hatch)'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
