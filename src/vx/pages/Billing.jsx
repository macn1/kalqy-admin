import React, { useState } from 'react';
import { CircleDollarSign, Pencil, Plus, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi, useApp } from '../ctx.jsx';
import { Async, Btn, Card, Chip, Field, Modal, Page, Pager, Seg, Stat, Table } from '../ui.jsx';
import { humanize, isObj, kpisOf, money, rowsOf, totalOf } from '../util.js';

const LIMIT = 25;
const ICONS = [TrendingUp, Wallet, CircleDollarSign, Receipt];
const EMPTY = { slug: '', name: '', description: '', amount: '', currency: 'INR', interval: 'month', max_children: '', trial_days: '', features: '', sort_order: '' };

function PlanModal({ plan, onClose, onSaved }) {
  const { toast } = useApp();
  const editing = !!plan;
  const [f, setF] = useState(editing ? {
    ...EMPTY, ...plan, amount: typeof plan.amount_minor === 'number' ? plan.amount_minor / 100 : '', features: (plan.features || []).join('\n'),
  } : EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toNum = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

  const save = async () => {
    const body = {
      name: f.name.trim(), description: f.description, amount_minor: toNum(f.amount) === undefined ? undefined : Math.round(Number(f.amount) * 100),
      max_children: toNum(f.max_children), trial_days: toNum(f.trial_days), sort_order: toNum(f.sort_order),
      features: f.features.split('\n').map((x) => x.trim()).filter(Boolean),
    };
    setBusy(true);
    try {
      if (editing) await api.updatePlan(plan.slug, body);
      else await api.createPlan({ ...body, slug: f.slug.trim(), currency: f.currency, interval: f.interval });
      toast(editing ? 'Plan updated' : 'Plan created');
      onSaved();
      onClose();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Modal title={editing ? `Edit plan — ${plan.name || plan.slug}` : 'New plan'} onClose={onClose}>
      <div className="form-grid">
        {!editing && <Field label="Slug"><input className="input" value={f.slug} onChange={set('slug')} placeholder="school" /></Field>}
        <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label={`Price (${f.currency}, major units)`}><input className="input" type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} /></Field>
        {!editing && <Field label="Interval"><select className="select" value={f.interval} onChange={set('interval')}><option value="month">Month</option><option value="year">Year</option></select></Field>}
        <Field label="Max children"><input className="input" type="number" min="0" value={f.max_children} onChange={set('max_children')} /></Field>
        <Field label="Trial days"><input className="input" type="number" min="0" value={f.trial_days} onChange={set('trial_days')} /></Field>
        <Field label="Sort order"><input className="input" type="number" value={f.sort_order} onChange={set('sort_order')} /></Field>
        <Field label="Description" full><input className="input" value={f.description} onChange={set('description')} /></Field>
        <Field label="Features (one per line)" full><textarea className="textarea" value={f.features} onChange={set('features')} /></Field>
      </div>
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} disabled={!f.name.trim() || (!editing && !f.slug.trim())} onClick={save}>{editing ? 'Save changes' : 'Create plan'}</Btn></div>
    </Modal>
  );
}

function Plans() {
  const plans = useApi(() => api.plans(), []);
  const [modal, setModal] = useState(null);
  return (
    <Card title="Plans" sub="Subscription plans offered to parents" action={<Btn variant="primary" size="sm" icon={Plus} onClick={() => setModal({})}>New plan</Btn>}>
      <Async q={plans} rows={3} render={(d) => {
        const rows = rowsOf(d);
        return (
          <>
            <div className="grid g3">
              {rows.map((p) => (
                <div className="tile" key={p.slug || p.id}>
                  <div className="row between"><b>{p.name || p.slug}</b><button className="round" aria-label={`Edit ${p.name || p.slug}`} onClick={() => setModal({ plan: p })}><Pencil size={15} /></button></div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{money(p.amount_minor, p.currency)}<span className="faint" style={{ fontSize: 13, fontWeight: 500 }}> / {p.interval || 'month'}</span></div>
                  {p.description && <div className="muted">{p.description}</div>}
                  <div className="tags">
                    {p.max_children != null && <Chip>{p.max_children} children</Chip>}
                    {p.trial_days ? <Chip tone="accent">{p.trial_days}-day trial</Chip> : null}
                    {p.is_active === false && <Chip tone="bad">inactive</Chip>}
                  </div>
                  {Array.isArray(p.features) && <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>{p.features.map((x) => <li key={x}>{x}</li>)}</ul>}
                </div>
              ))}
            </div>
            {!rows.length && <p className="muted">No plans yet.</p>}
            {modal && <PlanModal plan={modal.plan} onClose={() => setModal(null)} onSaved={plans.reload} />}
          </>
        );
      }} />
    </Card>
  );
}

function Invoices() {
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const res = useApi(() => api.invoices({ limit: LIMIT, offset, status }), [status, offset]);
  return (
    <Card title="Invoices" sub="All invoices across parents" action={<Seg value={status} onChange={(s) => { setStatus(s); setOffset(0); }} options={[{ value: '', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'open', label: 'Open' }, { value: 'failed', label: 'Failed' }]} />}>
      <Async q={res} rows={5} render={(d) => {
        const rows = rowsOf(d);
        return <><Table rows={rows} prefer={['number', 'invoice_number', 'parent_email', 'parent_name', 'status', 'amount_minor', 'currency', 'issued_at', 'paid_at', 'created_at']} empty="No invoices found" /><Pager offset={offset} limit={LIMIT} count={rows.length} total={totalOf(d)} onChange={setOffset} /></>;
      }} />
    </Card>
  );
}

export default function Billing() {
  const summary = useApi(() => api.billingSummary(), []);
  return (
    <Page title="Billing" sub="Recurring revenue, collections, plans and invoices. Amounts are stored in minor units.">
      <Async q={summary} rows={3} render={(s) => {
        const kpis = kpisOf(s).slice(0, 4);
        const breakdown = Object.entries(s || {}).find(([, v]) => Array.isArray(v) && isObj(v[0]));
        return (
          <>
            <div className="grid g4">{kpis.map((k, i) => <Stat key={k.key} hero={i === 0} label={k.label} value={k.value} icon={ICONS[i % ICONS.length]} hint="Current" />)}</div>
            {breakdown && <Card title={humanize(breakdown[0])}><Table rows={breakdown[1]} /></Card>}
          </>
        );
      }} />
      <Plans />
      <Invoices />
    </Page>
  );
}
