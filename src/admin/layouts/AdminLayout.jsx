import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Bell, Moon, Sun, Search, LogOut, Settings as Cog, X, Eye, UserCircle } from 'lucide-react';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { NAV } from './navConfig.js';
import { Avatar, DemoBadge, IconButton, Tooltip, Menu, Button, Skeleton } from '../components/ui.jsx';
import Toasts from '../components/Toasts.jsx';
import { relTime, fullName } from '../utils/format.js';
import { updateRecord } from '../../services/demoDataService.js';
import AccessRestricted from '../components/AccessRestricted.jsx';

const useIsMobile = () => {
  const [m, setM] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
};

function GlobalSearch() {
  const navigate = useNavigate();
  const { data } = useDemoData('students', 'schools', 'games', 'leads');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); } };
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const out = [];
    (data.students || []).filter((s) => `${fullName(s)} ${s.id}`.toLowerCase().includes(t)).slice(0, 4).forEach((s) => out.push({ g: 'Students', label: fullName(s), sub: s.id, to: `/admin/students/${s.id}` }));
    (data.schools || []).filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(t)).slice(0, 3).forEach((s) => out.push({ g: 'Schools', label: s.name, sub: s.location, to: `/admin/schools/${s.id}` }));
    (data.games || []).filter((s) => s.name.toLowerCase().includes(t)).slice(0, 3).forEach((s) => out.push({ g: 'Games', label: s.name, sub: s.category, to: '/admin/games' }));
    (data.leads || []).filter((s) => `${s.contactName} ${s.organisation}`.toLowerCase().includes(t)).slice(0, 3).forEach((s) => out.push({ g: 'Leads', label: s.contactName, sub: s.organisation, to: '/admin/leads' }));
    return out;
  }, [q, data]);

  const go = (to) => { navigate(to); setOpen(false); setQ(''); };
  let lastGroup = '';
  return (
    <div className="search" ref={ref} role="search">
      <Search size={17} className="ico" aria-hidden />
      <input ref={inputRef} className="search-input" placeholder="Search students, schools, games…" aria-label="Global search" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].to); if (e.key === 'Escape') setOpen(false); }} />
      <kbd className="hide-tablet">Ctrl K</kbd>
      {open && q.trim().length >= 2 && (
        <div className="search-results" role="listbox">
          {results.length === 0 && <div className="muted" style={{ padding: 14 }}>No matches in the sample data.</div>}
          {results.map((r) => {
            const head = r.g !== lastGroup ? <div className="grp" key={`g${r.g}`}>{r.g.toUpperCase()}</div> : null;
            lastGroup = r.g;
            return (
              <React.Fragment key={r.g + r.sub + r.label}>
                {head}
                <button role="option" onClick={() => go(r.to)}><span style={{ fontWeight: 600 }}>{r.label}</span><span className="faint">{r.sub}</span></button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { data } = useDemoData('notifications');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const f = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', f);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k); };
  }, []);
  const list = data.notifications || [];
  const unread = list.filter((n) => !n.read);
  const markAll = () => unread.forEach((n) => updateRecord('notifications', n.id, { read: true }));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconButton icon={Bell} label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'} bordered dot={unread.length > 0} onClick={() => setOpen((o) => !o)} aria-expanded={open} />
      {open && (
        <div className="popover" role="dialog" aria-label="Notifications">
          <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <b>Notifications</b>
            <Button size="sm" variant="ghost" disabled={!unread.length} onClick={markAll}>Mark all read</Button>
          </div>
          {list.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>You're all caught up.</div>}
          {list.map((n) => (
            <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{n.title}</div><div className="muted" style={{ fontSize: 13 }}>{n.text}</div><div className="faint" style={{ fontSize: 12 }}>{relTime(n.at)}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { settings, updateSettings, signOut, role, viewAsRole, setViewAsRole, canViewRoute, matrix } = useAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [drawer, setDrawer] = useState(false);
  const collapsed = settings.sidebarCollapsed && !isMobile;
  const slug = pathname.split('/')[2] || 'dashboard';

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const k = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [drawer]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const logout = () => { signOut(); navigate('/admin/login', { replace: true }); };

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''} ${drawer ? 'drawer-open' : ''}`}>
      <a href="#main" className="sr-only">Skip to content</a>
      <aside className="sidebar" aria-label="Primary">
        <div className="sb-brand">
          <img src="/images/FAVICON-01.png" alt="KALQY logo" />
          <div><div className="name">KALQY</div><div className="tag">Admin · Demo</div></div>
          {isMobile && <span className="spacer" />}
          {isMobile && <IconButton icon={X} label="Close menu" onClick={() => setDrawer(false)} />}
        </div>
        <nav className="sb-nav">
          {NAV.map((group) => {
            const items = group.items.filter((i) => canViewRoute(i.slug));
            if (!items.length) return null;
            return (
              <div key={group.section}>
                <div className="sb-section">{group.section}</div>
                {items.map(({ slug: s, label, icon: Icon }) => (
                  <Tooltip key={s} text={label} disabled={!collapsed}>
                    <NavLink to={`/admin/${s}`} className="sb-link" aria-label={collapsed ? label : undefined}>
                      <Icon size={19} aria-hidden /><span className="label">{label}</span>
                    </NavLink>
                  </Tooltip>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sb-foot">
          <Menu label="Account menu" trigger={({ label, expanded }) => (
            <button className="sb-user" style={{ width: '100%', background: 'transparent', border: 0, textAlign: 'left' }} aria-label={label} aria-expanded={expanded}>
              <Avatar name={settings.profile.name} /><div className="info"><div className="n">{settings.profile.name}</div><div className="r">{role}</div></div>
            </button>)}
            items={[
              { label: 'Profile & settings', icon: UserCircle, onClick: () => navigate('/admin/settings') },
              { label: 'Sign out', icon: LogOut, danger: true, onClick: logout },
            ]} />
        </div>
      </aside>
      <div className="sb-backdrop" onClick={() => setDrawer(false)} />

      <div className="main">
        <header className="topbar">
          {isMobile
            ? <IconButton icon={MenuIcon} label="Open menu" onClick={() => setDrawer(true)} aria-expanded={drawer} />
            : <IconButton icon={collapsed ? PanelLeftOpen : PanelLeftClose} label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })} />}
          <GlobalSearch />
          <div className="top-actions">
            <DemoBadge />
            <IconButton icon={isDark ? Sun : Moon} label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} bordered className="hide-mobile"
              onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })} />
            <Notifications />
            <Menu label="Account menu" trigger={({ label, expanded }) => (
              <button className="icon-btn" aria-label={label} aria-expanded={expanded}><Avatar name={settings.profile.name} size="sm" /></button>)}
              items={[
                { label: 'Profile & settings', icon: Cog, onClick: () => navigate('/admin/settings') },
                { divider: true },
                { label: 'Sign out', icon: LogOut, danger: true, onClick: logout },
              ]} />
          </div>
        </header>
        {viewAsRole && (
          <div className="role-banner" role="status">
            <Eye size={16} aria-hidden /> Previewing as <b>{viewAsRole}</b> — simulated in the browser only; this is not real access control.
            <Button size="sm" onClick={() => setViewAsRole('')}>Exit preview</Button>
          </div>
        )}
        <main id="main" key={pathname.split('/').slice(0, 3).join('/')}>
          {matrix && !canViewRoute(slug) ? <AccessRestricted role={role} onReset={() => setViewAsRole('')} /> : (
            <Suspense fallback={<div className="page" role="status" aria-label="Loading page"><Skeleton h={34} w={260} /><div style={{ height: 18 }} /><Skeleton h={120} /><div style={{ height: 18 }} /><Skeleton h={320} /></div>}><Outlet /></Suspense>
          )}
        </main>
      </div>
      <Toasts />
    </div>
  );
}
