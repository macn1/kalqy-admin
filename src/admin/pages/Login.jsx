import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { DEMO_CREDENTIALS } from '../../services/mockAuth.js';
import { Button, Checkbox, Field, TextInput, DemoBadge } from '../components/ui.jsx';

export default function Login() {
  const { session, signIn } = useAdmin();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to={loc.state?.from || '/admin/dashboard'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await signIn(email, password, remember);
      navigate(loc.state?.from || '/admin/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  const fill = () => { setEmail(DEMO_CREDENTIALS.email); setPassword(DEMO_CREDENTIALS.password); setErrors({}); setFormError(''); };

  return (
    <div className="login">
      <div className="login-panel">
        <form className="login-card stack" onSubmit={submit} noValidate aria-label="Admin login">
          <div className="row">
            <img src="/images/kalqy_favicon.png" alt="KALQY" width={44} height={44} style={{ borderRadius: 12 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '0.04em' }}>KALQY</div>
            <span className="spacer" /><DemoBadge label="DEMO ENVIRONMENT" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>Welcome back</h1>
            <p className="muted">Sign in to the KALQY admin dashboard.</p>
          </div>
          {formError && <div className="alert error" role="alert"><AlertCircle size={17} style={{ flex: 'none', marginTop: 2 }} />{formError}</div>}
          <Field label="Email" error={errors.email}>
            <TextInput type="email" autoComplete="username" placeholder="admin@kalqy.in" value={email} invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="input-wrap">
              <TextInput type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={password} invalid={!!errors.password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((s) => !s)}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <div className="row between">
            <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          </div>
          <Button type="submit" variant="primary" size="lg" loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
          <div className="demo-box">
            <div className="row" style={{ marginBottom: 4 }}><Info size={15} aria-hidden /><b>Demo credentials</b></div>
            <div>Email: <code>{DEMO_CREDENTIALS.email}</code></div>
            <div>Password: <code>{DEMO_CREDENTIALS.password}</code></div>
            <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={fill}>Fill demo credentials</button>
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Mock sign-in for a frontend demo. It does not connect to any real account system or to the live KALQY website.</p>
          </div>
        </form>
      </div>
      <aside className="login-art" aria-hidden>
        <div className="float" style={{ width: 90, height: 90, background: '#ffd34e', top: 60, right: 80 }} />
        <div className="float" style={{ width: 46, height: 46, background: '#ff8c78', top: 220, left: 50, animationDelay: '1s' }} />
        <div className="float" style={{ width: 30, height: 30, background: '#b9e8c9', bottom: 120, right: 60, animationDelay: '2s' }} />
        <div>
          <h2>Where movement meets magic.</h2>
          <p>See how every child, classroom and game is performing across your KALQY learning ecosystem.</p>
        </div>
        <img className="hero" src="/images/hero.png" alt="" />
        <small style={{ opacity: 0.8 }}>All data in this dashboard is fictional sample data.</small>
      </aside>
    </div>
  );
}
