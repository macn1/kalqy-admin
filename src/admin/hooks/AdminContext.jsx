import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readSession, signIn as mockSignIn, signOut as mockSignOut } from '../../services/mockAuth.js';
import { getObject, subscribe } from '../../services/demoDataService.js';
import { canEdit, canView, ROUTE_RESOURCE } from '../utils/permissions.js';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

const SETTINGS_KEY = 'kalqy_demo_settings';
export const DEFAULT_SETTINGS = {
  orgName: 'KALQY',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD MMM YYYY',
  language: 'English (India)',
  theme: 'light',
  sidebarCollapsed: false,
  sidebarHover: true,
  notifications: { newLead: true, reportReady: true, trialEnding: true, productNews: false, emailDaily: false, emailWeekly: true },
  profile: { name: 'Admin', email: 'admin@kalqy.in', title: 'Platform administrator' },
};

const loadSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return DEFAULT_SETTINGS; }
};

export function AdminProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [settings, setSettings] = useState(loadSettings);
  const [toasts, setToasts] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [viewAsRole, setViewAsRoleState] = useState(() => {
    try { return sessionStorage.getItem('kalqy_view_as') || ''; } catch { return ''; }
  });

  // Theme: applied to <html>; a short-lived class enables smooth colour transitions.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
    };
    root.classList.add('theme-anim');
    apply();
    const t = setTimeout(() => root.classList.remove('theme-anim'), 400);
    return () => clearTimeout(t);
  }, [settings.theme]);

  useEffect(() => {
    let alive = true;
    const load = () => getObject('permissions').then((m) => alive && setMatrix(m));
    load();
    const off = subscribe((n) => n === 'permissions' && load());
    return () => { alive = false; off(); };
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3800);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const setViewAsRole = useCallback((role) => {
    setViewAsRoleState(role);
    try { role ? sessionStorage.setItem('kalqy_view_as', role) : sessionStorage.removeItem('kalqy_view_as'); } catch { /* ignore */ }
  }, []);

  const signIn = useCallback(async (email, password, remember) => {
    const s = await mockSignIn(email, password, remember);
    setSession(s);
    return s;
  }, []);
  const signOut = useCallback(() => { mockSignOut(); setSession(null); setViewAsRole(''); }, [setViewAsRole]);

  const role = viewAsRole || 'Super Admin';
  const value = useMemo(() => ({
    session, signIn, signOut, settings, updateSettings, toast, toasts, dismissToast,
    role, viewAsRole, setViewAsRole, matrix,
    canView: (resource) => !matrix || canView(matrix, role, resource),
    canEdit: (resource) => !matrix || canEdit(matrix, role, resource),
    canViewRoute: (slug) => !matrix || !ROUTE_RESOURCE[slug] || canView(matrix, role, ROUTE_RESOURCE[slug]),
  }), [session, signIn, signOut, settings, updateSettings, toast, toasts, dismissToast, role, viewAsRole, setViewAsRole, matrix]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
