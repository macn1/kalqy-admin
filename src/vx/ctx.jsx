import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearAuth, getAuth, onAuthLost } from '../api/client.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const THEME_KEY = 'kalqy_admin_theme';

export function AppProvider({ children }) {
  const [auth, setAuth] = useState(() => getAuth());
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; } });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-anim');
    root.dataset.theme = theme;
    const t = setTimeout(() => root.classList.remove('theme-anim'), 400);
    return () => clearTimeout(t);
  }, [theme]);
  useEffect(() => onAuthLost(() => setAuth(null)), []);

  const setTheme = useCallback((t) => { setThemeState(t); try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ } }, []);
  const toast = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((l) => [...l.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3200);
  }, []);
  const signIn = useCallback(async (fn) => { const d = await fn(); setAuth(d); return d; }, []);
  const signOut = useCallback(() => { clearAuth(); setAuth(null); }, []);

  const value = useMemo(() => ({ auth, signIn, signOut, theme, setTheme, toast, toasts }), [auth, signIn, signOut, theme, setTheme, toast, toasts]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Load data from the API; re-runs when deps change. */
export function useApi(fn, deps = []) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    set((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve().then(fn).then((data) => alive && set({ data, error: null, loading: false }), (error) => alive && set({ data: null, error, loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
