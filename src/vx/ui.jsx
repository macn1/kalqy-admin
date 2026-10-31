import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';
import { autoColumns, fmtValue, initials, statusTone } from './util.js';

export const Avatar = ({ name }) => <span className="avatar" aria-hidden>{initials(name)}</span>;
export const Chip = ({ tone = '', children }) => <span className={`chip ${tone}`}>{children}</span>;
export const StatusChip = ({ value }) => (value ? <Chip tone={statusTone(value)}>{String(value).replace(/_/g, ' ')}</Chip> : <span className="faint">—</span>);

export function Btn({ variant = '', size = '', icon: Icon, busy, children, ...p }) {
  return (
    <button type="button" {...p} disabled={p.disabled || busy} className={`btn ${variant} ${size} ${p.className || ''}`}>
      {busy ? <Loader2 size={15} className="spin" /> : Icon ? <Icon size={15} /> : null}{children}
    </button>
  );
}

export const Card = ({ title, sub, action, children, className = '', style }) => (
  <section className={`card ${className}`} style={style}>
    {(title || action) && (
      <div className="card-head"><div>{title && <h3>{title}</h3>}{sub && <div className="sub">{sub}</div>}</div>{action}</div>
    )}
    {children}
  </section>
);

/** Counts the first number inside a formatted string up from 0 (keeps prefix/suffix such as ₹ or %). */
export function CountUp({ text, duration = 1100 }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    const s = String(text ?? '');
    const m = s.match(/\d[\d,]*(\.\d+)?/);
    if (!m || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setOut(s); return undefined; }
    const target = parseFloat(m[0].replace(/,/g, ''));
    const dec = m[1] ? m[1].length - 1 : 0;
    if (!Number.isFinite(target) || target === 0) { setOut(s); return undefined; }
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      if (p >= 1) { setOut(s); return; }
      const v = target * (1 - (1 - p) ** 4);
      const f = v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      setOut(s.slice(0, m.index) + f + s.slice(m.index + m[0].length));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);
  return <>{out}</>;
}

export const Stat = ({ label, value, hint, icon: Icon, hero, chip, index = 0 }) => (
  <div className={`card stat ${hero ? 'hero' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
    <div className="label"><span>{label}</span>{Icon && <span className="ico"><Icon size={14} /></span>}</div>
    <div className="value mono"><CountUp text={value} /></div>
    <div className="row between"><span className="hint">{hint}</span>{chip}</div>
  </div>
);

export const Page = ({ title, sub, action, children }) => (
  <>
    <div className="vx-head row"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action && <div className="row wrap">{action}</div>}</div>
    <div className="stack">{children}</div>
  </>
);

export const Skel = ({ h = 20, w = '100%', style }) => <div className="skel" style={{ height: h, width: w, ...style }} />;
export const Loading = ({ rows = 4 }) => <div className="stack" role="status" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skel key={i} h={i ? 46 : 28} />)}</div>;
export const ErrorBox = ({ error, onRetry }) => (
  <div className="err" role="alert"><span className="row"><AlertCircle size={18} />{error?.message || 'Something went wrong'}</span>{onRetry && <Btn size="sm" onClick={onRetry}>Retry</Btn>}</div>
);
export const Empty = ({ title = 'Nothing here yet', children }) => <div className="empty"><Inbox size={28} /><b>{title}</b>{children && <span>{children}</span>}</div>;

/** Wraps a useApi() result: skeleton while loading, error box on failure, else render(data). */
export function Async({ q, render, rows, skeleton }) {
  if (q.loading && !q.data) return skeleton || <Loading rows={rows} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.reload} />;
  return render(q.data);
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between" style={{ marginBottom: 16 }}><h3 style={{ fontSize: 20 }}>{title}</h3><button className="round" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children, full }) => <label className={`field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>;
export const Switch = ({ on, onChange, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
export const Seg = ({ value, options, onChange }) => (
  <div className="seg" role="tablist">{options.map((o) => { const v = o.value ?? o; return <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{o.label ?? o}</button>; })}</div>
);
export const SearchBox = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="searchbox"><Search size={15} /><input className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} /></div>
);

export function Pager({ offset, limit, count, total, onChange }) {
  const end = offset + count;
  const hasNext = total != null ? end < total : count >= limit;
  return (
    <div className="pager">
      <span>{count ? `${offset + 1}–${end}${total != null ? ` of ${total}` : ''}` : 'No results'}</span>
      <div className="row"><Btn size="sm" icon={ChevronLeft} disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>Prev</Btn><Btn size="sm" disabled={!hasNext} onClick={() => onChange(offset + limit)}>Next<ChevronRight size={15} /></Btn></div>
    </div>
  );
}

/** Generic table. `columns` optional: [{key,label,render?}]; otherwise derived from the rows. */
export function Table({ rows, columns, prefer, onRowClick, empty = 'No records found', max }) {
  if (!rows?.length) return <Empty title={empty} />;
  const cols = columns || autoColumns(rows, prefer, max);
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? r.parent_id ?? r.slug ?? i} className={onRowClick ? 'click' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {cols.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : /status|state/i.test(c.key) ? <StatusChip value={r[c.key]} /> : fmtValue(c.key, r[c.key], r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const KV = ({ data, skip = [] }) => (
  <dl className="kv">
    {Object.entries(data || {}).filter(([k, v]) => !skip.includes(k) && (v === null || typeof v !== 'object')).map(([k, v]) => (
      <React.Fragment key={k}><dt>{k.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())}</dt><dd>{/status/i.test(k) && v ? <StatusChip value={v} /> : fmtValue(k, v, data)}</dd></React.Fragment>
    ))}
  </dl>
);

export function ConfirmButton({ children, onConfirm, ...p }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return <Btn {...p} variant="danger" onClick={() => (armed ? onConfirm() : setArmed(true))}>{armed ? 'Click to confirm' : children}</Btn>;
}
