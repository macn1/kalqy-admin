import React, { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, CircleHelp, Compass, FileText, Info, LayoutGrid, Layers, LogOut, Moon, Receipt, Search, SlidersHorizontal, Sun, Users } from 'lucide-react';
import { useApp } from './ctx.jsx';
import { Avatar, Btn, Loading, Modal } from './ui.jsx';

const TOP = [
  { to: '/overview', label: 'Overview' },
  { to: '/parents', label: 'Parents' },
  { to: '/billing', label: 'Billing' },
  { to: '/content', label: 'Content' },
  { to: '/filters', label: 'Filters' },
];
const RAIL = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/parents', label: 'Parents & children', icon: Users },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/content/engines', label: 'Engines', icon: Layers },
  { to: '/content/adventures', label: 'Adventures', icon: Compass },
  { to: '/content/templates', label: 'Challenge templates', icon: FileText },
  { to: '/filters', label: 'Filters', icon: SlidersHorizontal },
];

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const d = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', d);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', d); document.removeEventListener('keydown', k); };
  }, [open]);
  return { open, setOpen, ref };
}

function SearchModal({ onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return (
    <Modal title="Search parents" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); nav(`/parents?q=${encodeURIComponent(q.trim())}`); onClose(); }} className="stack">
        <input autoFocus className="input" placeholder="Name or email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parents" />
        <div className="modal-foot" style={{ marginTop: 0 }}><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" type="submit" icon={Search}>Search</Btn></div>
      </form>
    </Modal>
  );
}

export default function Shell() {
  const { auth, signOut, theme, setTheme } = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [searching, setSearching] = useState(false);
  const bell = usePopover();
  const info = usePopover();
  const menu = usePopover();
  const dark = theme === 'dark';
  const who = auth?.email || auth?.identifier || auth?.user?.email || 'admin@kalqy';
  const name = auth?.user?.name || auth?.name || 'Super Admin';

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const logout = () => { signOut(); nav('/login', { replace: true }); };

  return (
    <div className="vx">
      <div className="vx-frame">
        <header className="vx-top">
          <div className="pill vx-brand"><img src="/images/kalqy-logo.png" alt="KALQY" /></div>
          <nav className="pill vx-nav" aria-label="Primary">
            {TOP.map((t) => <NavLink key={t.to} to={t.to}>{t.label}</NavLink>)}
          </nav>
          <div className="vx-right">
            <div className="pill vx-tools">
              <button className="round" aria-label="Search" onClick={() => setSearching(true)}><Search size={17} /></button>
              <div ref={bell.ref} style={{ position: 'relative' }}>
                <button className="round" aria-label="Notifications" aria-expanded={bell.open} onClick={() => bell.setOpen((o) => !o)}><Bell size={17} /></button>
                {bell.open && <div className="popover" style={{ padding: 16, width: 220 }}><b>Notifications</b><p className="muted" style={{ marginTop: 6 }}>You are all caught up.</p></div>}
              </div>
              <div ref={info.ref} style={{ position: 'relative' }} className="hide-sm">
                <button className="round" aria-label="About" aria-expanded={info.open} onClick={() => info.setOpen((o) => !o)}><Info size={17} /></button>
                {info.open && <div className="popover" style={{ padding: 16, width: 260 }}><b>KALQY Super Admin</b><p className="muted" style={{ marginTop: 6 }}>Connected to the KALQY API at /api/v1. Money is shown from integer minor units.</p></div>}
              </div>
            </div>
            <div ref={menu.ref} style={{ position: 'relative' }}>
              <button className="pill vx-user" aria-label="Account menu" aria-expanded={menu.open} onClick={() => menu.setOpen((o) => !o)}>
                <Avatar name={name} /><span className="info"><div className="n">{name}</div><div className="e">{who}</div></span><ChevronDown size={14} className="faint" />
              </button>
              {menu.open && <div className="popover"><button onClick={logout} style={{ color: 'var(--vx-bad)' }}><LogOut size={16} />Sign out</button></div>}
            </div>
          </div>
        </header>

        <div className="vx-body">
          <aside className="rail" aria-label="Quick navigation">
            <div className="pill rail-group">
              <button className={`round ${!dark ? 'on' : ''}`} aria-label="Light mode" onClick={() => setTheme('light')}><Sun size={16} /></button>
              <button className={`round ${dark ? 'on' : ''}`} aria-label="Dark mode" onClick={() => setTheme('dark')}><Moon size={16} /></button>
            </div>
            <div className="pill rail-group">
              {RAIL.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} aria-label={label} title={label} className={({ isActive }) => `round ${isActive ? 'on' : ''}`}><Icon size={17} /></NavLink>
              ))}
            </div>
            <div className="rail-spacer" />
            <div className="pill rail-group">
              <button className="round" aria-label="Help" title="Help" onClick={() => info.setOpen(true)}><CircleHelp size={17} /></button>
              <button className="round" aria-label="Sign out" title="Sign out" onClick={logout}><LogOut size={17} /></button>
            </div>
          </aside>
          <main className="vx-main" id="main">
            <Suspense fallback={<Loading />}><Outlet /></Suspense>
          </main>
        </div>
      </div>
      {searching && <SearchModal onClose={() => setSearching(false)} />}
    </div>
  );
}
