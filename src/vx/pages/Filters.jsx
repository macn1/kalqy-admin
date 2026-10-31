import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi, useApp } from '../ctx.jsx';
import { Async, Btn, Card, ConfirmButton, Empty, Field, Modal, Page, SearchBox, Switch } from '../ui.jsx';
import { rowsOf } from '../util.js';

const DEFAULT_SCOPES = ['date_range'];
const nOrU = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

function OptionModal({ scope, opt, onClose, onSaved }) {
  const { toast } = useApp();
  const editing = !!opt;
  const [f, setF] = useState({ value: opt?.value ?? '', label: opt?.label ?? '', sort_order: opt?.sort_order ?? '', meta: JSON.stringify(opt?.meta ?? {}, null, 2) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const save = async () => {
    let meta;
    try { meta = JSON.parse(f.meta || '{}'); } catch { setErr('Meta must be valid JSON.'); return; }
    setErr('');
    setBusy(true);
    try {
      if (editing) await api.updateFilter(opt.id, { label: f.label, sort_order: nOrU(f.sort_order), meta });
      else await api.createFilter({ scope, value: f.value.trim(), label: f.label.trim(), sort_order: nOrU(f.sort_order), meta });
      toast(editing ? 'Option updated' : 'Option added');
      onSaved();
      onClose();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal title={editing ? 'Edit option' : `Add option to “${scope}”`} onClose={onClose}>
      <div className="form-grid">
        {!editing && <Field label="Value"><input className="input" value={f.value} onChange={set('value')} placeholder="2 Years" /></Field>}
        <Field label="Label"><input className="input" value={f.label} onChange={set('label')} placeholder="2 Years" /></Field>
        <Field label="Sort order"><input className="input" type="number" value={f.sort_order} onChange={set('sort_order')} /></Field>
        <Field full label="Meta (JSON)"><textarea className="textarea code" value={f.meta} onChange={set('meta')} /></Field>
      </div>
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} disabled={!f.label.trim() || (!editing && !f.value.trim())} onClick={save}>{editing ? 'Save' : 'Add option'}</Btn></div>
    </Modal>
  );
}

export default function Filters() {
  const { toast } = useApp();
  const [scope, setScope] = useState(DEFAULT_SCOPES[0]);
  const [draft, setDraft] = useState('');
  const [modal, setModal] = useState(null);
  const res = useApi(() => api.filters(scope), [scope]);

  const toggle = async (o, v) => {
    try { await api.updateFilter(o.id, { is_active: v }); toast(v ? 'Option enabled' : 'Option disabled'); res.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (o) => {
    try { await api.deleteFilter(o.id); toast('Option deleted'); res.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const isOn = (o) => o.is_active ?? true;

  return (
    <Page title="Filters" sub="Options that power the filter dropdowns across the apps — relabel, reorder, disable or add."
      action={<Btn variant="primary" icon={Plus} onClick={() => setModal({})}>Add option</Btn>}>
      <Card title="Scope" sub="Pick a filter group to manage">
        <div className="row wrap">
          <div className="seg">{DEFAULT_SCOPES.map((s) => <button key={s} className={s === scope ? 'on' : ''} onClick={() => setScope(s)}>{s}</button>)}</div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setScope(draft.trim()); setDraft(''); } }}>
            <SearchBox value={draft} onChange={setDraft} placeholder="Open another scope…" />
          </form>
        </div>
      </Card>
      <Card title={`Options — ${scope}`}>
        <Async q={res} rows={4} render={(d) => {
          const rows = [...rowsOf(d)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          if (!rows.length) return <Empty title="No options in this scope" />;
          return (
            <div className="list">
              {rows.map((o) => (
                <div className="list-item" key={o.id}>
                  <span className="ic mono" style={{ fontSize: 12, fontWeight: 700 }}>{o.sort_order ?? '·'}</span>
                  <div><div className="t">{o.label}</div><div className="s">value: {o.value}{o.meta && Object.keys(o.meta).length ? ` · ${JSON.stringify(o.meta)}` : ''}</div></div>
                  <div className="end row">
                    <Switch label={`Enable ${o.label}`} on={!!isOn(o)} onChange={(v) => toggle(o, v)} />
                    <button className="round" aria-label={`Edit ${o.label}`} onClick={() => setModal({ opt: o })}><Pencil size={15} /></button>
                    <ConfirmButton size="sm" icon={Trash2} onConfirm={() => remove(o)}>Delete</ConfirmButton>
                  </div>
                </div>
              ))}
            </div>
          );
        }} />
      </Card>
      {modal && <OptionModal scope={scope} opt={modal.opt} onClose={() => setModal(null)} onSaved={res.reload} />}
    </Page>
  );
}
