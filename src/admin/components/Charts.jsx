import React from 'react';
import { prefersReducedMotion } from '../utils/motion.js';

// Categorical colours in fixed order (blue, coral, amber, green, violet, slate).
// Charts always pair colour with a legend / direct value labels so colour is never the only cue.
export const SERIES = ['#39A9F9', '#FF8C78', '#E9B21A', '#3FB27F', '#8A7BE0', '#5B6B8C'];
export const useChartAnim = () => !prefersReducedMotion();

export function ChartTip({ active, payload, label, valueFmt = (v) => v, title }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="t">{title ? title(label, payload) : label}</div>
      {payload.map((p) => (
        <div className="r" key={p.dataKey || p.name}>
          <span><i className="sw" style={{ background: p.color || p.payload?.fill }} />{p.name}</span>
          <b className="mono">{valueFmt(p.value, p)}</b>
        </div>
      ))}
    </div>
  );
}

export const axisProps = { tickLine: false, axisLine: false };
export const gridStroke = 'var(--grid-line)';

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i className="sw" style={i.dashed ? { background: 'transparent', border: `2px dashed ${i.color}` } : { background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export const ChartBox = ({ children, label, height }) => (
  <div className="chart-box" role="img" aria-label={label} style={height ? { height } : undefined}>{children}</div>
);
