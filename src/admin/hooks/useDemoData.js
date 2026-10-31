import { useEffect, useRef, useState, useCallback } from 'react';
import { listRecords, getObject, subscribe, OBJECT_COLLECTIONS } from '../../services/demoDataService.js';

/** Load one or more shared collections. Re-renders whenever any of them change. */
export function useDemoData(...names) {
  const key = names.join('|');
  const [state, setState] = useState({ loading: true, error: null, data: {} });
  const mounted = useRef(true);

  const load = useCallback(async (silent) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const entries = await Promise.all(
        names.map(async (n) => [n, OBJECT_COLLECTIONS.includes(n) ? await getObject(n) : await listRecords(n)])
      );
      if (mounted.current) setState({ loading: false, error: null, data: Object.fromEntries(entries) });
    } catch (e) {
      if (mounted.current) setState((s) => ({ ...s, loading: false, error: e.message || 'Failed to load demo data' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    mounted.current = true;
    load(false);
    const off = subscribe((changed) => { if (names.includes(changed)) load(true); });
    return () => { mounted.current = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load]);

  return { ...state, reload: () => load(false) };
}
