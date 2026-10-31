import React from 'react';
import { CalendarDays } from 'lucide-react';
import { PRESETS, toInputDate } from '../utils/dateRange.js';

export default function DateRangePicker({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="row wrap" style={{ gap: 8 }}>
      <div className="input-icon-wrap">
        <CalendarDays size={16} aria-hidden />
        <select className="select input-icon" style={{ width: 'auto', minWidth: 160, height: 38 }} aria-label="Date range" value={value.preset}
          onChange={(e) => {
            const preset = e.target.value;
            set(preset === 'custom' ? { preset, from: value.from || toInputDate(Date.now() - 13 * 86400000), to: value.to || toInputDate(Date.now()) } : { preset });
          }}>
          {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      {value.preset === 'custom' && (
        <>
          <input className="input" style={{ width: 150, height: 38 }} type="date" aria-label="From date" value={value.from || ''} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} />
          <input className="input" style={{ width: 150, height: 38 }} type="date" aria-label="To date" value={value.to || ''} min={value.from || undefined} onChange={(e) => set({ to: e.target.value })} />
        </>
      )}
    </div>
  );
}
