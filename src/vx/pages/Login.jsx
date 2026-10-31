import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Layers, Moon, Receipt, SlidersHorizontal, Sun, Users } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApp } from '../ctx.jsx';
import { Btn } from '../ui.jsx';

const MODULES = [
  { icon: Users, title: 'Parents & children', text: 'Families, subscriptions and play progress' },
  { icon: Receipt, title: 'Billing', text: 'Plans, invoices and revenue reporting' },
  { icon: Layers, title: 'Content studio', text: 'Engines, adventures, levels and challenge templates' },
  { icon: SlidersHorizontal, title: 'Filters', text: 'Options the parent app uses, updated without a release' },
];

function Brand() {
  return (
    <aside className="auth-art">
      <div className="auth-art-in">
        <img src="/images/kalqy-logo.png" alt="KALQY" className="auth-logo" />

        <div className="auth-copy">
          <span className="auth-eyebrow">Admin console</span>
          <h2>Everything KALQY,<br />in one place.</h2>
          <p>Manage families, billing and learning content for the KALQY platform.</p>
        </div>

        <ul className="auth-modules">
          {MODULES.map(({ icon: Icon, title, text }, i) => (
            <li key={title} style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
              <span className="ic"><Icon size={17} /></span>
              <div><b>{title}</b><span>{text}</span></div>
            </li>
          ))}
        </ul>

        <p className="auth-copyright">© {new Date().getFullYear()} KALQY. All rights reserved.</p>
      </div>
    </aside>
  );
}

export default function Login() {
  const { auth, signIn, toast, theme, setTheme } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dest = loc.state?.from || '/overview';
  if (auth?.access_token) return <Navigate to={dest} replace />;

  const run = async (fn, after) => {
    setBusy(true);
    setError('');
    try { await fn(); after?.(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const go = () => nav(dest, { replace: true });
  const sendCode = () => run(async () => {
    const d = await api.requestOtp(email.trim());
    setSent(true);
    if (d?.debug_code) setCode(d.debug_code);
    toast('One-time code sent');
  });
  const submit = (e) => {
    e.preventDefault();
    if (mode === 'password') return run(() => signIn(() => api.login(email.trim(), password)), go);
    if (!sent) return sendCode();
    return run(() => signIn(() => api.verifyOtp(email.trim(), code.trim())), go);
  };
  const switchMode = (m) => { setMode(m); setSent(false); setCode(''); setError(''); };

  return (
    <div className="auth">
      <Brand />
      <main className="auth-pane">
        <button type="button" className="round auth-theme" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <form className="auth-form" onSubmit={submit}>
          <img src="/images/kalqy-logo.png" alt="KALQY" className="auth-logo-sm" />
          <header>
            <h1>Sign in</h1>
            <p>Use your administrator account to continue.</p>
          </header>

          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'password'} className={mode === 'password' ? 'on' : ''} onClick={() => switchMode('password')}>Password</button>
            <button type="button" role="tab" aria-selected={mode === 'otp'} className={mode === 'otp' ? 'on' : ''} onClick={() => switchMode('otp')}>Email code</button>
          </div>

          <label className="auth-field">
            <span>Email</span>
            <input className="input" type="email" required autoFocus autoComplete="username" placeholder="name@kalqy.in" value={email} disabled={mode === 'otp' && sent} onChange={(e) => setEmail(e.target.value)} />
          </label>

          {mode === 'password' && (
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-pw">
                <input className="input" type={show ? 'text' : 'password'} required autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
          )}

          {mode === 'otp' && !sent && <p className="auth-note">We'll email you a single-use code. No password needed.</p>}
          {mode === 'otp' && sent && (
            <label className="auth-field">
              <span>Verification code</span>
              <input className="input otp" inputMode="numeric" autoFocus required maxLength={8} autoComplete="one-time-code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))} />
              <span className="auth-links">
                <span>Sent to {email}</span>
                <span>
                  <button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }}>Change</button>
                  <button type="button" disabled={busy} onClick={sendCode}>Resend</button>
                </span>
              </span>
            </label>
          )}

          {error && <div className="err" role="alert">{error}</div>}

          <Btn variant="primary" type="submit" busy={busy} className="auth-submit">
            {mode === 'password' ? 'Sign in' : sent ? 'Verify and sign in' : 'Send code'}{!busy && <ArrowRight size={16} />}
          </Btn>
        </form>
      </main>
    </div>
  );
}
