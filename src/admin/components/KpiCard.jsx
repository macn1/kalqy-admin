import React, { useId } from 'react';
import { ArrowUpRight, ArrowDownRight, GraduationCap, School, Gamepad2, TrendingUp, Clock, CalendarCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useCountUp } from '../hooks/useCountUp.js';
import { fmtInt } from '../utils/format.js';

const ICONS = { GraduationCap, School, Gamepad2, TrendingUp, Clock, CalendarCheck, Activity };

export default function KpiCard({ label, value, fmt, delta, unit, icon, spark = [], color = '#39A9F9' }) {
  const Icon = ICONS[icon] || Activity;
  const gid = `g${useId().replace(/:/g, '')}`;
  const shown = useCountUp(value);
  const text = fmt === 'pct' ? `${shown.toFixed(1)}%` : fmtInt(shown);
  const up = delta >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="card kpi hoverable">
      <div className="top"><span className="ico"><Icon size={16} aria-hidden /></span>{label}</div>
      <div className="val mono" aria-label={`${label}: ${fmt === 'pct' ? value.toFixed(1) + '%' : fmtInt(value)}`}>{text}</div>
      <div className="trend" style={up ? undefined : { color: 'var(--coral-ink)' }}>
        <Arrow size={14} aria-hidden />{up ? '+' : ''}{delta.toFixed(1)}{unit === 'pp' ? ' pp' : '%'}
        <span className="sub" style={{ fontWeight: 500 }}>{unit === 'pp' ? 'vs prev.' : 'vs prev.'}</span>
      </div>
      <div className="spark" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
