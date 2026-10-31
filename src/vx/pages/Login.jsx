import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Eye, EyeOff, Gamepad2, KeyRound, Layers, Lock, Mail, Moon, ShieldCheck, Sun, Users, Wallet } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApp } from '../ctx.jsx';
import { Btn, Seg } from '../ui.jsx';

const FEATURES = [
  { icon: Users, title: 'Parents & children', text: 'Every family, plan and play session in one directory.' },
  { icon: Wallet, title: 'Billing & revenue', text: 'MRR, invoices and plans, always up to date.' },
  { icon: Layers, title: 'Content studio', text: 'Engines, adventures, levels and challenge templates.' },
];
const FLOATERS = [Gamepad2, Compass, Users, Wallet, Layers, ShieldCheck];

function Brand() {
  return (
    <aside className="auth-art" aria-hidden="false">
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      {FLOATERS.map((Icon, i) => <span key={i} className={`floater f${i + 1}`} aria-hidden><Icon size={18} /></span>)}
      <div className="auth-art-in">
        <img src="/images/kalqy-logo.png" alt="KALQY" className="auth-logo" />
        <div className="auth-copy">
          <span className="auth-eyebrow"><ShieldCheck size={14} /> Super admin console</span>
          <h2>Run all of KALQY<br />from one place.</h2>
          <p>Watch the platform grow, look after families, and shape the adventures children play, live, with no app release needed.</p>
        </div>
        <ul className="auth-feats">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <li key={title} style={{ '--i': i + 3 }} className="reveal">
              <span className="ic"><Icon size={17} /></span>
              <div><b>{title}</b><span>{text}</span></div>
            </li>
          ))}
        </ul>
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
  const [shake, setShake] = useState(0);
  const dest = loc.state?.from || '/overview';
  if (auth?.access_token) return <Navigate to={dest} replace />;

  const run = async (fn, after) => {
    setBusy(true);
    setError('');
    try { await fn(); after?.(); } catch (e) { setError(e.message); setShake((n) => n + 1); } finally { setBusy(false); }
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
        <form key={shake} className={`auth-form ${shake ? 'shake' : ''}`} onSubmit={submit} noValidate={false}>
          <img src="/images/kalqy-logo.png" alt="KALQY" className="auth-logo-sm" />
          <div className="reveal" style={{ '--i': 0 }}>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to the KALQY super admin dashboard.</p>
          </div>

          <div className="reveal" style={{ '--i': 1 }}>
            <Seg value={mode} onChange={switchMode} options={[{ value: 'password', label: 'Password' }, { value: 'otp', label: 'One-time code' }]} />
          </div>

          <label className="auth-field reveal" style={{ '--i': 2 }}>
            <span>Email address</span>
            <div className="auth-input"><Mail size={16} />
              <input className="input" type="email" required autoFocus autoComplete="username" placeholder="you@kalqy.in" value={email} disabled={mode === 'otp' && sent} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </label>

          {mode === 'password' && (
            <label className="auth-field reveal" style={{ '--i': 3 }}>
              <span>Password</span>
              <div className="auth-input"><Lock size={16} />
                <input className="input" type={show ? 'text' : 'password'} required autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
          )}

          {mode === 'otp' && !sent && <p className="auth-hint reveal" style={{ '--i': 3 }}><KeyRound size={15} /> We'll email a single-use code. No password needed.</p>}
          {mode === 'otp' && sent && (
            <label className="auth-field reveal" style={{ '--i': 0 }}>
              <span>Enter the 6-digit code sent to <b>{email}</b></span>
              <div className="auth-input"><KeyRound size={16} />
                <input className="input otp" inputMode="numeric" autoFocus required maxLength={8} autoComplete="one-time-code" placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))} />
              </div>
              <span className="auth-links">
                <button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }}>Change email</button>
                <button type="button" disabled={busy} onClick={sendCode}>Resend code</button>
              </span>
            </label>
          )}

          {error && <div className="err" role="alert">{error}</div>}

          <div className="reveal" style={{ '--i': 4 }}>
            <Btn variant="accent" type="submit" busy={busy} className="auth-submit">
              {mode === 'password' ? 'Sign in' : sent ? 'Verify & sign in' : 'Send code'}{!busy && <ArrowRight size={16} />}
            </Btn>
          </div>
          <p className="auth-foot"><ShieldCheck size={13} /> Authorised KALQY staff only.</p>
        </form>
      </main>
    </div>
  );
}
