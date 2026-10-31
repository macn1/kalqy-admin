// Thin client for the KALQY super-admin API (see kalqy_super_admin.postman_collection.json).
// Responses are { success, data, ... }; request() resolves to `data` and throws ApiError otherwise.
const BASE = import.meta.env.VITE_API_BASE || '';
const KEY = 'kalqy_admin_auth';

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const write = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* ignore */ } };

export const getAuth = read;
export const isSignedIn = () => !!read()?.access_token;
export const clearAuth = () => write(null);
const listeners = new Set();
export const onAuthLost = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

let refreshing = null;
async function refresh() {
  const auth = read();
  if (!auth?.refresh_token) return false;
  refreshing ||= fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: auth.refresh_token }),
  }).then(async (r) => {
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.data?.access_token) return false;
    write({ ...auth, ...j.data });
    return true;
  }).catch(() => false).finally(() => { refreshing = null; });
  return refreshing;
}

async function request(method, path, { body, params, auth = true, retry = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = read()?.access_token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the KALQY API. Check VITE_API_URL in .env and that the backend is up.', 0);
  }
  if (res.status === 401 && auth && retry && (await refresh())) return request(method, path, { body, params, auth, retry: false });
  const json = await res.json().catch(() => null);
  if (res.status === 401 && auth) { clearAuth(); listeners.forEach((f) => f()); }
  if (!res.ok || json?.success === false) {
    const m = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : '') || `Request failed (${res.status})`;
    throw new ApiError(m, res.status, json);
  }
  return json && 'data' in json ? json.data : json;
}

const get = (p, params) => request('GET', p, { params });
const post = (p, body) => request('POST', p, { body });
const patch = (p, body) => request('PATCH', p, { body });
const del = (p) => request('DELETE', p);
const A = '/api/v1/admin';

export const api = {
  login: async (identifier, password) => {
    const d = await request('POST', '/api/v1/auth/login', { body: { identifier, password }, auth: false });
    write({ ...d, email: identifier }); return read();
  },
  requestOtp: (email) => request('POST', '/api/v1/auth/otp/request', { body: { email }, auth: false }),
  verifyOtp: async (email, code) => {
    const d = await request('POST', '/api/v1/auth/otp/verify', { body: { email, code }, auth: false });
    write({ ...d, email }); return read();
  },
  logout: clearAuth,

  overview: () => get(`${A}/overview`),
  engagement: (days = 30) => get(`${A}/analytics/engagement`, { days }),

  parents: ({ limit = 25, offset = 0, search = '' } = {}) => get(`${A}/parents`, { limit, offset, search }),
  parent: (id) => get(`${A}/parents/${id}`),
  child: (id) => get(`${A}/children/${id}`),
  childProgress: (id) => get(`${A}/children/${id}/progress`),
  childSessions: (id, { limit = 25, offset = 0 } = {}) => get(`${A}/children/${id}/sessions`, { limit, offset }),
  setChildInsight: (id, body) => patch(`${A}/children/${id}/insight`, body),

  billingSummary: () => get(`${A}/billing/summary`),
  invoices: ({ limit = 25, offset = 0, status = '' } = {}) => get(`${A}/billing/invoices`, { limit, offset, status }),
  plans: () => get(`${A}/billing/plans`),
  createPlan: (body) => post(`${A}/billing/plans`, body),
  updatePlan: (slug, body) => patch(`${A}/billing/plans/${slug}`, body),

  engines: () => get(`${A}/content/engines`),
  engineKinds: (id) => get(`${A}/content/engines/${id}/kinds`),
  updateEngine: (id, body) => patch(`${A}/content/engines/${id}`, body),

  adventures: () => get(`${A}/content/adventures`),
  adventure: (id) => get(`${A}/content/adventures/${id}`),
  updateAdventure: (id, body) => patch(`${A}/content/adventures/${id}`, body),
  levels: (id) => get(`${A}/content/adventures/${id}/levels`),
  createLevel: (id, body) => post(`${A}/content/adventures/${id}/levels`, body),
  updateLevel: (id, body) => patch(`${A}/content/story-levels/${id}`, body),

  templates: ({ limit = 25, offset = 0 } = {}) => get(`${A}/content/templates`, { limit, offset }),
  createTemplate: (body) => post(`${A}/content/templates`, body),
  previewTemplate: (id, body) => post(`${A}/content/templates/${id}/preview`, body),
  updateTemplate: (id, body) => patch(`${A}/content/templates/${id}`, body),

  filters: (scope) => get(`${A}/filters/${scope}`),
  createFilter: (body) => post(`${A}/filters`, body),
  updateFilter: (id, body) => patch(`${A}/filters/${id}`, body),
  deleteFilter: (id) => del(`${A}/filters/${id}`),
};
