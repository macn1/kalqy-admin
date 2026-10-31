import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi, useApp, useDebounced } from '../ctx.jsx';
import { Async, Btn, Card, Empty, Field, KV, Modal, Page, Pager, SearchBox, Table } from '../ui.jsx';
import { humanize, isObj, rowsOf, totalOf } from '../util.js';

const LIMIT = 25;
const idOf = (r, ...keys) => { for (const k of [...keys, 'id']) if (r?.[k]) return r[k]; return undefined; };

export function ParentsList() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [offset, setOffset] = useState(0);
  const q = useDebounced(search);
  useEffect(() => { setOffset(0); setParams(q ? { q } : {}, { replace: true }); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const res = useApi(() => api.parents({ limit: LIMIT, offset, search: q }), [q, offset]);

  return (
    <Page title="Parents" sub="Every parent with their plan, subscription status, lifetime value and outstanding balance." action={<SearchBox value={search} onChange={setSearch} placeholder="Search name or email" />}>
      <Card>
        <Async q={res} rows={6} render={(d) => {
          const rows = rowsOf(d);
          return (
            <>
              <Table rows={rows} prefer={['name', 'full_name', 'email', 'child_count', 'children_count', 'plan', 'plan_name', 'subscription_status', 'lifetime_value_minor', 'outstanding_minor']} onRowClick={(r) => nav(`/parents/${idOf(r, 'parent_id')}`)} empty="No parents match your search" />
              <Pager offset={offset} limit={LIMIT} count={rows.length} total={totalOf(d)} onChange={setOffset} />
            </>
          );
        }} />
      </Card>
    </Page>
  );
}

const ArrayCards = ({ data, skipKeys = [], onRow }) => (
  <>
    {Object.entries(data || {}).filter(([k, v]) => !skipKeys.includes(k) && Array.isArray(v) && isObj(v[0])).map(([k, rows]) => (
      <Card key={k} title={humanize(k)} sub={`${rows.length} record${rows.length === 1 ? '' : 's'}`}>
        <Table rows={rows} onRowClick={/child/i.test(k) ? onRow : undefined} />
      </Card>
    ))}
  </>
);

export function ParentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const res = useApi(() => api.parent(id), [id]);
  return (
    <Page title="Parent" sub="Profile, children, subscription history and invoices." action={<Btn icon={ArrowLeft} onClick={() => nav('/parents')}>All parents</Btn>}>
      <Async q={res} rows={5} render={(d) => {
        const p = d?.parent || d;
        return (
          <>
            <Card title={p?.name || p?.full_name || p?.email || 'Parent'}><KV data={p} /></Card>
            <ArrayCards data={d} onRow={(r) => nav(`/children/${idOf(r, 'child_id')}`)} />
            {d?.parent && <ArrayCards data={d.parent} onRow={(r) => nav(`/children/${idOf(r, 'child_id')}`)} />}
          </>
        );
      }} />
    </Page>
  );
}

function InsightModal({ id, current, onClose, onSaved }) {
  const { toast } = useApp();
  const [summary, setSummary] = useState(current?.summary || '');
  const [traits, setTraits] = useState((current?.traits || []).join(', '));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.setChildInsight(id, { summary: summary.trim(), traits: traits.split(',').map((t) => t.trim()).filter(Boolean) });
      toast('Insight saved');
      onSaved();
      onClose();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal title="Know your kid — insight" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 14 }}>Shown on the parent app's profile card. This text is authored by an admin; it is not derived from play data.</p>
      <div className="stack">
        <Field label="Summary"><textarea className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
        <Field label="Traits (comma separated)"><input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="Cautious, Short Focus, Mixed Learner" /></Field>
      </div>
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} onClick={save}>Save insight</Btn></div>
    </Modal>
  );
}

export function ChildDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState(false);
  const child = useApi(() => api.child(id), [id]);
  const progress = useApi(() => api.childProgress(id), [id]);
  const sessions = useApi(() => api.childSessions(id, { limit: LIMIT, offset }), [id, offset]);

  return (
    <Page title="Child" sub="Summary, learning progress and play sessions."
      action={<><Btn icon={ArrowLeft} onClick={() => nav(-1)}>Back</Btn><Btn variant="primary" icon={Pencil} onClick={() => setEditing(true)}>Edit insight</Btn></>}>
      <div className="grid g2">
        <Card title="Summary"><Async q={child} rows={3} render={(d) => <KV data={d?.child || d} />} /></Card>
        <Card title="Progress"><Async q={progress} rows={3} render={(d) => (isObj(d) ? <KV data={d} /> : <Table rows={rowsOf(d)} />)} /></Card>
      </div>
      <Async q={progress} rows={1} render={(d) => <ArrayCards data={d} />} />
      <Card title="Sessions">
        <Async q={sessions} rows={4} render={(d) => {
          const rows = rowsOf(d);
          return <><Table rows={rows} empty="No sessions yet" /><Pager offset={offset} limit={LIMIT} count={rows.length} total={totalOf(d)} onChange={setOffset} /></>;
        }} />
      </Card>
      {editing && <InsightModal id={id} current={child.data?.insight || child.data?.child?.insight} onClose={() => setEditing(false)} onSaved={child.reload} />}
    </Page>
  );
}
