import React, { useEffect, useLayoutEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { initials } from '../utils/format.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Button({ variant = 'secondary', size, icon: Icon, loading, children, className, ...p }) {
  return (
    <button type="button" {...p} disabled={p.disabled || loading} className={cx('btn', `btn-${variant}`, size && `btn-${size}`, className)}>
      {loading ? <Loader2 size={16} className="spin" aria-hidden /> : Icon ? <Icon size={16} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, bordered, dot, className, ...p }) {
  return (
    <button type="button" aria-label={label} title={label} {...p} className={cx('icon-btn', bordered && 'bordered', className)}>
      <Icon size={19} aria-hidden />
      {dot && <span className="dot" />}
    </button>
  );
}

export function Card({ title, subtitle, action, children, className, hoverable, flush }) {
  return (
    <section className={cx('card', hoverable && 'hoverable', className)}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {flush ? children : <div className="card-body">{children}</div>}
    </section>
  );
}

const TONES = {
  Active: 'mint', Published: 'mint', Completed: 'mint', Converted: 'mint', Excelling: 'mint', 'On track': 'blue', Qualified: 'blue', Delivered: 'mint',
  Trial: 'yellow', Partial: 'yellow', 'Demo Scheduled': 'yellow', Contacted: 'blue', Draft: 'yellow', Pending: 'yellow', Invited: 'yellow', 'On leave': 'yellow', New: 'blue',
  'Needs attention': 'coral', Expired: 'coral', Abandoned: 'coral', Suspended: 'coral', Inactive: 'gray', Closed: 'gray', Archived: 'gray',
};
export function Badge({ tone, children, plain, className }) {
  return <span className={cx('badge', tone, plain && 'plain', className)}>{children}</span>;
}
export const StatusBadge = ({ status }) => <Badge tone={TONES[status] || ''}>{status}</Badge>;

export function Field({ label, error, hint, children, className }) {
  const id = useId();
  const child = React.isValidElement(children) ? React.cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-e` : undefined }) : children;
  return (
    <div className={cx('field', className)}>
      {label && <label htmlFor={id}>{label}</label>}
      {child}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" id={`${id}-e`} role="alert">{error}</span>}
    </div>
  );
}

export const TextInput = React.forwardRef(function TextInput({ className, invalid, ...p }, ref) {
  return <input ref={ref} className={cx('input', invalid && 'invalid', className)} {...p} />;
});
export const Select = ({ options, className, children, ...p }) => (
  <select className={cx('select', className)} {...p}>
    {children ||
      options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
);
export const Textarea = ({ className, ...p }) => <textarea className={cx('textarea', className)} {...p} />;
export const Checkbox = ({ label, ...p }) => (
  <label className="check"><input type="checkbox" {...p} />{label}</label>
);
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" aria-label={label} checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…', label }) {
  return (
    <div className="search-box input-icon-wrap">
      <Search size={16} aria-hidden />
      <input className="input input-icon" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
    </div>
  );
}

export function ProgressBar({ value, color = 'var(--blue)', label }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, value)))); return () => cancelAnimationFrame(t); }, [value]);
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

const AV = ['#b9e8c9', '#ffd34e', '#ff8c78', '#9fd6fb', '#d9cffb'];
export function Avatar({ name, size }) {
  const c = AV[(name || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV.length];
  return <span className={cx('avatar', size)} style={{ background: c }} aria-hidden>{initials(name)}</span>;
}

export function Skeleton({ h = 16, w = '100%', style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden />;
}
export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{ padding: 20, display: 'grid', gap: 14 }} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={22} />)}
    </div>
  );
}

const DOODLES = {
  star: (<><circle cx="40" cy="40" r="34" fill="#ffd34e" opacity=".35" /><path d="M40 16l7 15 16 2-12 11 3 16-14-8-14 8 3-16L17 33l16-2z" fill="#ffd34e" stroke="#20304a" strokeWidth="2.5" strokeLinejoin="round" /></>),
  egg: (<><circle cx="40" cy="40" r="34" fill="#39a9f9" opacity=".2" /><path d="M40 14c10 0 18 18 18 30a18 18 0 0 1-36 0c0-12 8-30 18-30z" fill="#fff9ed" stroke="#20304a" strokeWidth="2.5" /><path d="M24 44l7-6 6 6 6-6 7 6" fill="none" stroke="#ff8c78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>),
  leaf: (<><circle cx="40" cy="40" r="34" fill="#b9e8c9" opacity=".5" /><path d="M40 62V34" stroke="#20304a" strokeWidth="2.5" strokeLinecap="round" /><path d="M40 40c-14 0-20-10-20-18 12 0 20 6 20 18zM40 34c0-10 8-16 20-16 0 10-8 16-20 16z" fill="#b9e8c9" stroke="#20304a" strokeWidth="2.5" strokeLinejoin="round" /></>),
  marble: (<><circle cx="40" cy="40" r="34" fill="#ff8c78" opacity=".2" /><circle cx="40" cy="40" r="17" fill="#ff8c78" stroke="#20304a" strokeWidth="2.5" /><circle cx="34" cy="34" r="4.5" fill="#fff" opacity=".85" /></>),
};
export function Doodle({ kind = 'star', size = 72 }) {
  return <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>{DOODLES[kind]}</svg>;
}

export function EmptyState({ title, text, action, kind = 'star' }) {
  return (
    <div className="empty">
      <Doodle kind={kind} />
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty" role="alert">
      <Doodle kind="marble" />
      <h4>Something went wrong</h4>
      <p>{message || 'The demo data could not be loaded.'}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" className="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>{t.label}</button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export const DemoBadge = ({ label = 'DEMO DATA' }) => <span className="demo-badge" title="All figures are fictional sample data"><i />{label}</span>;

export function StatTile({ label, value, icon: Icon, tone = 'blue' }) {
  return (
    <div className="card stat hoverable">
      <span className={cx('ico', `tone-${tone}`)}><Icon size={20} aria-hidden /></span>
      <div><div className="v mono">{value}</div><div className="l">{label}</div></div>
    </div>
  );
}

/** Fixed-position tooltip (not clipped by scroll containers). Used for the collapsed sidebar. */
export function Tooltip({ text, children, disabled }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const show = () => {
    if (disabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: r.right + 10, y: r.top + r.height / 2 });
  };
  return (
    <span ref={ref} style={{ display: 'block' }} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}>
      {children}
      {pos && createPortal(<span className="tooltip" role="tooltip" style={{ left: pos.x, top: pos.y }}>{text}</span>, document.body)}
    </span>
  );
}

/** Dropdown menu rendered in a portal so tables never clip it. */
export function Menu({ trigger, items, label = 'Actions' }) {
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const menu = useRef(null);
  const open = () => {
    const r = btn.current.getBoundingClientRect();
    const left = Math.min(r.right - 190, window.innerWidth - 200);
    setPos({ left: Math.max(8, left), top: r.bottom + 6 });
  };
  useEffect(() => {
    if (!pos) return undefined;
    const close = (e) => { if (!menu.current?.contains(e.target) && !btn.current?.contains(e.target)) setPos(null); };
    const esc = (e) => e.key === 'Escape' && (setPos(null), btn.current?.focus());
    const scroll = () => setPos(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', scroll, true); };
  }, [pos]);
  useLayoutEffect(() => {
    if (pos && menu.current) {
      const h = menu.current.offsetHeight;
      if (pos.top + h > window.innerHeight - 8) setPos((p) => ({ ...p, top: Math.max(8, btn.current.getBoundingClientRect().top - h - 6) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!pos]);
  return (
    <>
      <span ref={btn} onClick={(e) => { e.stopPropagation(); pos ? setPos(null) : open(); }} style={{ display: 'inline-flex' }}>{trigger({ label, expanded: !!pos })}</span>
      {pos && createPortal(
        <div ref={menu} className="menu" role="menu" style={{ left: pos.left, top: pos.top }} onClick={(e) => e.stopPropagation()}>
          {items.filter(Boolean).map((it, i) => it.divider ? <hr key={i} /> : (
            <button key={it.label} role="menuitem" className={it.danger ? 'danger' : ''} disabled={it.disabled} onClick={() => { setPos(null); it.onClick(); }}>
              {it.icon && <it.icon size={15} aria-hidden />}{it.label}
            </button>
          ))}
        </div>, document.body)}
    </>
  );
}

export function SortIcon({ dir }) {
  return dir === 'asc' ? <ChevronUp size={13} /> : dir === 'desc' ? <ChevronDown size={13} /> : null;
}
