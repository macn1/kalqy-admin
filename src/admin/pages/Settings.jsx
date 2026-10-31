import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Download, RotateCcw, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { ConfirmDialog } from '../components/Overlay.jsx';
import { Button, Card, Field, Select, Switch, Tabs, TextInput, DemoBadge, Avatar } from '../components/ui.jsx';
import { useAdmin, DEFAULT_SETTINGS } from '../hooks/AdminContext.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { resetDemoData, clearDemoData, ARRAY_COLLECTIONS, OBJECT_COLLECTIONS, peek } from '../../services/demoDataService.js';
import { DEMO_CREDENTIALS } from '../../services/mockAuth.js';
import { downloadCsv } from '../utils/csv.js';
import { fmtInt } from '../utils/format.js';

const TABS = [{ value: 'general', label: 'General' }, { value: 'appearance', label: 'Appearance' }, { value: 'notifications', label: 'Notifications' }, { value: 'profile', label: 'Profile' }, { value: 'data', label: 'Data & Privacy' }];
const TZ = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'];
const DATE_FORMATS = ['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
const LANGS = ['English (India)', 'English (UK)', 'Malayalam (preview)', 'Hindi (preview)'];

function Row({ title, text, children }) {
  return (
    <div className="row between" style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
      <div><div style={{ fontWeight: 600 }}>{title}</div>{text && <div className="muted" style={{ fontSize: 13 }}>{text}</div>}</div>{children}
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, toast, canEdit } = useAdmin();
  const edit = canEdit('settings');
  const [tab, setTab] = useState('general');
  const [gen, setGen] = useState({ orgName: settings.orgName, timezone: settings.timezone, dateFormat: settings.dateFormat, language: settings.language });
  const [prof, setProf] = useState(settings.profile);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const { data } = useDemoData(...ARRAY_COLLECTIONS);
  useEffect(() => { setGen({ orgName: settings.orgName, timezone: settings.timezone, dateFormat: settings.dateFormat, language: settings.language }); }, [settings.orgName, settings.timezone, settings.dateFormat, settings.language]);

  const saveGeneral = (e) => {
    e.preventDefault();
    if (!gen.orgName.trim()) return toast('Organisation name cannot be empty', 'error');
    updateSettings({ ...gen, orgName: gen.orgName.trim() });
    toast('General settings saved locally');
  };
  const saveProfile = (e) => {
    e.preventDefault();
    if (!prof.name.trim()) return toast('Name cannot be empty', 'error');
    if (!/^\S+@\S+\.\S+$/.test(prof.email)) return toast('Enter a valid email', 'error');
    updateSettings({ profile: { ...prof, name: prof.name.trim() } });
    toast('Profile saved locally');
  };
  const changePw = (e) => {
    e.preventDefault();
    const er = {};
    if (pw.current !== DEMO_CREDENTIALS.password) er.current = 'Current password is incorrect.';
    if (pw.next.length < 10) er.next = 'Use at least 10 characters.';
    if (pw.next !== pw.confirm) er.confirm = 'Passwords do not match.';
    setPwErr(er);
    if (Object.keys(er).length) return;
    setPw({ current: '', next: '', confirm: '' });
    toast('Mock password change accepted. Nothing was stored; the demo password is unchanged.');
  };
  const setNotif = (k, v) => { updateSettings({ notifications: { ...settings.notifications, [k]: v } }); toast('Notification preference saved'); };

  const exportAll = () => {
    const out = {};
    [...ARRAY_COLLECTIONS, ...OBJECT_COLLECTIONS].forEach((n) => { out[n] = peek(n); });
    const blob = new Blob([JSON.stringify({ note: 'KALQY admin DEMO export. Fictional sample data only.', exportedAt: new Date().toISOString(), data: out }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kalqy-demo-data.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Demo data exported as JSON');
  };
  const run = async () => {
    setBusy(true);
    try { confirm === 'reset' ? await resetDemoData() : await clearDemoData(); toast(confirm === 'reset' ? 'Demo data restored to the original sample set' : 'All demo records cleared. Use Reset to restore them.'); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); setConfirm(''); }
  };

  return (
    <div className="page">
      <PageHeader title="Settings" description="Preferences are saved in this browser only." actions={<DemoBadge label="DEMO ENVIRONMENT" />} />
      <Tabs label="Settings sections" tabs={TABS} value={tab} onChange={setTab} />
      <div style={{ maxWidth: 760, marginTop: 20 }}>
        {tab === 'general' && (
          <Card title="General" subtitle="Organisation defaults">
            <form onSubmit={saveGeneral} className="form-grid" noValidate>
              <Field label="Organisation name" className="full"><TextInput value={gen.orgName} onChange={(e) => setGen({ ...gen, orgName: e.target.value })} disabled={!edit} maxLength={60} /></Field>
              <div className="field full"><span className="lbl">Logo preview</span><div className="row"><img src="/images/kalqy_favicon.png" alt="KALQY logo" width={56} height={56} style={{ borderRadius: 14, border: '1px solid var(--border)' }} /><span className="muted" style={{ fontSize: 13 }}>Using the KALQY brand mark from the public site. Logo upload is disabled in demo mode.</span></div></div>
              <Field label="Default timezone"><Select value={gen.timezone} options={TZ} onChange={(e) => setGen({ ...gen, timezone: e.target.value })} disabled={!edit} /></Field>
              <Field label="Date format"><Select value={gen.dateFormat} options={DATE_FORMATS} onChange={(e) => setGen({ ...gen, dateFormat: e.target.value })} disabled={!edit} /></Field>
              <Field label="Language" className="full" hint="The interface is English only in this demo."><Select value={gen.language} options={LANGS} onChange={(e) => setGen({ ...gen, language: e.target.value })} disabled={!edit} /></Field>
              <div className="full"><Button type="submit" variant="primary" disabled={!edit}>Save changes</Button></div>
            </form>
          </Card>
        )}

        {tab === 'appearance' && (
          <Card title="Appearance" subtitle="Theme and sidebar">
            <div className="field"><span className="lbl">Theme</span>
              <div className="row wrap" role="radiogroup" aria-label="Theme">
                {[['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]].map(([v, l, Icon]) => (
                  <button key={v} role="radio" aria-checked={settings.theme === v} className="chip-btn" aria-pressed={settings.theme === v} onClick={() => updateSettings({ theme: v })}><Icon size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{l}</button>
                ))}
              </div>
            </div>
            <Row title="Collapse sidebar by default" text="Show icons only on desktop. Hover an icon to see its label."><Switch label="Collapse sidebar" checked={settings.sidebarCollapsed} onChange={(v) => updateSettings({ sidebarCollapsed: v })} /></Row>
          </Card>
        )}

        {tab === 'notifications' && (
          <Card title="Notifications" subtitle="In-app and demo email preferences">
            <h4 style={{ marginBottom: 2 }}>In-app</h4>
            <Row title="New demo requests"><Switch label="New demo requests" checked={settings.notifications.newLead} onChange={(v) => setNotif('newLead', v)} /></Row>
            <Row title="Reports ready"><Switch label="Reports ready" checked={settings.notifications.reportReady} onChange={(v) => setNotif('reportReady', v)} /></Row>
            <Row title="School trials ending"><Switch label="School trials ending" checked={settings.notifications.trialEnding} onChange={(v) => setNotif('trialEnding', v)} /></Row>
            <h4 style={{ margin: '18px 0 2px' }}>Email (demo)</h4>
            <Row title="Daily digest" text="No emails are sent in demo mode."><Switch label="Daily digest" checked={settings.notifications.emailDaily} onChange={(v) => setNotif('emailDaily', v)} /></Row>
            <Row title="Weekly summary"><Switch label="Weekly summary" checked={settings.notifications.emailWeekly} onChange={(v) => setNotif('emailWeekly', v)} /></Row>
            <Row title="Product news"><Switch label="Product news" checked={settings.notifications.productNews} onChange={(v) => setNotif('productNews', v)} /></Row>
          </Card>
        )}

        {tab === 'profile' && (
          <div className="stack">
            <Card title="Profile" subtitle="Administrator details">
              <form onSubmit={saveProfile} className="form-grid" noValidate>
                <div className="full row"><Avatar name={prof.name} size="lg" /><div className="muted" style={{ fontSize: 13 }}>Initials avatar generated from your name.</div></div>
                <Field label="Name"><TextInput value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} maxLength={50} /></Field>
                <Field label="Email"><TextInput type="email" value={prof.email} onChange={(e) => setProf({ ...prof, email: e.target.value })} /></Field>
                <Field label="Job title" className="full"><TextInput value={prof.title} onChange={(e) => setProf({ ...prof, title: e.target.value })} maxLength={60} /></Field>
                <div className="full"><Button type="submit" variant="primary">Save profile</Button></div>
              </form>
            </Card>
            <Card title="Change password" subtitle="Mock mode: nothing is stored or sent">
              <form onSubmit={changePw} className="form-grid" noValidate autoComplete="off">
                <Field label="Current password" error={pwErr.current} className="full"><TextInput type="password" autoComplete="current-password" value={pw.current} invalid={!!pwErr.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
                <Field label="New password" error={pwErr.next}><TextInput type="password" autoComplete="new-password" value={pw.next} invalid={!!pwErr.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
                <Field label="Confirm new password" error={pwErr.confirm}><TextInput type="password" autoComplete="new-password" value={pw.confirm} invalid={!!pwErr.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
                <div className="full"><Button type="submit">Update password</Button></div>
              </form>
            </Card>
          </div>
        )}

        {tab === 'data' && (
          <div className="stack">
            <Card title="Sample data" subtitle="Everything in this dashboard is fictional and stored in your browser (localStorage)">
              <dl className="kv">
                {ARRAY_COLLECTIONS.map((n) => (<React.Fragment key={n}><dt style={{ textTransform: 'capitalize' }}>{n}</dt><dd className="mono">{fmtInt((data[n] || []).length)} records</dd></React.Fragment>))}
              </dl>
              <div className="row wrap mt">
                <Button icon={Download} onClick={exportAll}>Export all demo data (JSON)</Button>
                <Button icon={RotateCcw} disabled={!edit} onClick={() => setConfirm('reset')}>Reset demo data</Button>
                <Button variant="danger" icon={Trash2} disabled={!edit} onClick={() => setConfirm('clear')}>Clear demo data</Button>
              </div>
            </Card>
            <Card title="Privacy-conscious data handling" subtitle="Guidance for when this connects to real data">
              <ul className="muted" style={{ paddingLeft: 18, display: 'grid', gap: 6, margin: 0 }}>
                <li>KALQY serves young children: collect the minimum personal information needed.</li>
                <li>Never store webcam footage, facial recognition data or biometric templates in the admin dashboard.</li>
                <li>Prefer pseudonymous student IDs in exports and reports.</li>
                <li>Obtain verifiable parent or guardian consent before processing a child's data.</li>
                <li>Enforce access control on the server; frontend role checks are only a convenience.</li>
                <li>Replace this demo login and localStorage store with an authenticated backend before production use.</li>
              </ul>
              <p className="note"><ShieldCheck size={14} style={{ flex: 'none' }} />This is general guidance, not legal advice.</p>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!confirm} danger={confirm === 'clear'} loading={busy} title={confirm === 'reset' ? 'Reset demo data?' : 'Clear all demo data?'}
        confirmLabel={confirm === 'reset' ? 'Reset data' : 'Clear data'} onClose={() => setConfirm('')} onConfirm={run}
        message={confirm === 'reset' ? 'Every edit you made (students, schools, games, leads, website content, permissions) will be replaced with the original sample dataset.' : 'All sample records will be removed so you can preview empty states. Website content and permissions are kept. You can restore data with “Reset demo data”.'} />
    </div>
  );
}
