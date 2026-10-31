// ──────────────────────────────────────────────────────────────────────────
// DEMO-ONLY mock authentication.
// These credentials are public, on purpose, and grant access to fictional data only.
// Do NOT reuse this module in production: replace `signIn` with a real identity provider
// (server-side sessions / OIDC) and never ship credentials in client code.
// ──────────────────────────────────────────────────────────────────────────
export const DEMO_CREDENTIALS = { email: 'admin@kalqy.in', password: 'KalqyDemo123!' };
const KEY = 'kalqy_demo_auth';

export async function signIn(email, password, remember) {
  await new Promise((r) => setTimeout(r, 700));
  if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    throw new Error('Invalid email or password. Check the demo credentials shown below the form.');
  }
  const session = { email: DEMO_CREDENTIALS.email, name: 'Admin', at: Date.now() };
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  } catch { /* storage blocked: session lasts until reload */ }
  return session;
}

export function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function signOut() {
  try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch { /* ignore */ }
}
