import React, { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, ListChecks, Palette, Pencil, Plus } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi, useApp } from '../ctx.jsx';
import { Async, Btn, Card, Chip, Empty, Field, KV, Modal, Page, Pager, StatusChip, Switch, Table } from '../ui.jsx';
import { rowsOf, totalOf } from '../util.js';

const LIMIT = 25;
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const csv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const nOrU = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

/** Save helper: runs fn, toasts, then refreshes + closes. */
function useSave(onDone) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); toast(ok); onDone?.(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return { busy, run };
}

const Tabs = () => (
  <div className="seg" role="tablist" style={{ alignSelf: 'start' }}>
    {[['engines', 'Engines'], ['adventures', 'Adventures'], ['templates', 'Challenge templates']].map(([to, label]) => (
      <NavLink key={to} to={`/content/${to}`} style={({ isActive }) => ({ padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: isActive ? 600 : 500, background: isActive ? 'var(--vx-card)' : 'transparent', boxShadow: isActive ? 'var(--vx-shadow)' : 'none' })}>{label}</NavLink>
    ))}
  </div>
);

/* ───────── engines ───────── */
function KindsModal({ engine, onClose }) {
  const res = useApi(() => api.engineKinds(engine.id), [engine.id]);
  return (
    <Modal title={`Challenge kinds — ${engine.name || engine.slug || engine.id}`} onClose={onClose}>
      <Async q={res} rows={3} render={(d) => {
        const rows = rowsOf(d);
        return rows.length ? <div className="tags">{rows.map((k) => <Chip key={k.kind || k.id || k}>{typeof k === 'string' ? k : k.kind || k.name || JSON.stringify(k)}</Chip>)}</div> : <Empty title="No kinds reported" />;
      }} />
    </Modal>
  );
}

function Engines() {
  const res = useApi(() => api.engines(), []);
  const [kinds, setKinds] = useState(null);
  const [edit, setEdit] = useState(null);
  const [desc, setDesc] = useState('');
  const { busy, run } = useSave(() => { setEdit(null); res.reload(); });
  return (
    <Card title="Engines" sub="Game engines that generate challenges">
      <Async q={res} rows={3} render={(d) => {
        const rows = rowsOf(d);
        if (!rows.length) return <Empty title="No engines" />;
        return (
          <div className="grid g3">
            {rows.map((e) => (
              <div className="tile" key={e.id}>
                <div className="row between"><b>{e.name || e.slug || e.id}</b><StatusChip value={e.status || (e.is_active === false ? 'inactive' : e.is_active ? 'active' : '')} /></div>
                <p className="muted">{e.description || 'No description'}</p>
                <div className="row wrap">
                  <Btn size="sm" icon={ListChecks} onClick={() => setKinds(e)}>Kinds</Btn>
                  <Btn size="sm" icon={Pencil} onClick={() => { setEdit(e); setDesc(e.description || ''); }}>Edit</Btn>
                </div>
              </div>
            ))}
          </div>
        );
      }} />
      {kinds && <KindsModal engine={kinds} onClose={() => setKinds(null)} />}
      {edit && (
        <Modal title={`Edit engine — ${edit.name || edit.id}`} onClose={() => setEdit(null)}>
          <Field label="Description"><textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <div className="modal-foot"><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" busy={busy} onClick={() => run(() => api.updateEngine(edit.id, { description: desc }), 'Engine updated')}>Save</Btn></div>
        </Modal>
      )}
    </Card>
  );
}

/* ───────── adventures ───────── */
function Adventures() {
  const nav = useNavigate();
  const { toast } = useApp();
  const res = useApi(() => api.adventures(), []);
  const [pending, setPending] = useState(null);
  const toggle = async (a, v) => {
    setPending(a.id);
    try { await api.updateAdventure(a.id, { is_published: v }); toast(v ? 'Adventure published' : 'Adventure unpublished'); res.reload(); } catch (e) { toast(e.message, 'error'); } finally { setPending(null); }
  };
  return (
    <Card title="Adventures" sub="Story adventures shown in the parent app games catalog">
      <Async q={res} rows={4} render={(d) => (
        <Table rows={rowsOf(d)} prefer={['title', 'name', 'slug', 'engine', 'level_count', 'is_published']}
          onRowClick={(a) => nav(`/content/adventures/${a.id}`)}
          empty="No adventures" />
      )} />
      <PublishRail res={res} toggle={toggle} pending={pending} />
    </Card>
  );
}

// Quick publish toggles (the table rows navigate on click, so toggles live in their own list).
function PublishRail({ res, toggle, pending }) {
  const rows = rowsOf(res.data).filter((a) => 'is_published' in a);
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="faint" style={{ fontSize: 12, marginBottom: 6 }}>Published</div>
      <div className="list">
        {rows.map((a) => (
          <div className="list-item" key={a.id}><span className="t">{a.title || a.name || a.slug}</span><span className="end"><Switch label={`Publish ${a.title || a.name}`} on={!!a.is_published} onChange={(v) => !pending && toggle(a, v)} /></span></div>
        ))}
      </div>
    </div>
  );
}

function VisualsModal({ adv, onClose, onSaved }) {
  const g = (k, d = '') => adv?.[k] ?? d;
  const [f, setF] = useState({
    short_description: g('short_description'), image_url: g('image_url'), card_bg_color: g('card_bg_color'), tag_bg_color: g('tag_bg_color'), tag_text_color: g('tag_text_color'),
    tags: (g('tags', [])).join(', '), gallery_images: (g('gallery_images', [])).join('\n'), play_time_label: g('play_time_label'), difficulty_label: g('difficulty_label'), difficulty_color: g('difficulty_color'),
    benefits: JSON.stringify(g('benefits', []), null, 2),
  });
  const [err, setErr] = useState('');
  const { busy, run } = useSave(() => { onSaved(); onClose(); });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const save = () => {
    let benefits;
    try { benefits = JSON.parse(f.benefits || '[]'); if (!Array.isArray(benefits)) throw new Error(); } catch { setErr('Benefits must be a valid JSON array.'); return; }
    setErr('');
    run(() => api.updateAdventure(adv.id, { ...f, tags: csv(f.tags), gallery_images: lines(f.gallery_images), benefits }), 'Catalog visuals saved');
  };
  const color = (k, label) => <Field label={label}><div className="row"><input className="input" value={f[k]} onChange={set(k)} placeholder="F2F7EE" />{f[k] && <span className="swatch" style={{ background: `#${f[k].replace('#', '')}` }} />}</div></Field>;
  return (
    <Modal wide title="Games catalog visuals" onClose={onClose}>
      <div className="form-grid">
        <Field full label="Short description"><input className="input" value={f.short_description} onChange={set('short_description')} /></Field>
        <Field full label="Image URL"><input className="input" value={f.image_url} onChange={set('image_url')} /></Field>
        {color('card_bg_color', 'Card background (hex)')}{color('tag_bg_color', 'Tag background (hex)')}{color('tag_text_color', 'Tag text (hex)')}{color('difficulty_color', 'Difficulty colour (hex)')}
        <Field label="Play time label"><input className="input" value={f.play_time_label} onChange={set('play_time_label')} placeholder="10-15 min" /></Field>
        <Field label="Difficulty label"><input className="input" value={f.difficulty_label} onChange={set('difficulty_label')} placeholder="Easy" /></Field>
        <Field full label="Tags (comma separated)"><input className="input" value={f.tags} onChange={set('tags')} /></Field>
        <Field full label="Gallery images (one per line)"><textarea className="textarea" value={f.gallery_images} onChange={set('gallery_images')} /></Field>
        <Field full label="Benefits (JSON: title, description, icon, icon_bg_color, icon_color)"><textarea className="textarea code" style={{ minHeight: 130 }} value={f.benefits} onChange={set('benefits')} /></Field>
      </div>
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} onClick={save}>Save visuals</Btn></div>
    </Modal>
  );
}

const LEVEL_DEFAULT = { number: '', kind: 'variation', title: '', narrative: '', instruction: '', assist_level: 'partial', template_kind: '', curriculum: '', difficulty: 1, challenge_count: 3, pass_threshold: 0.6 };

function LevelModal({ advId, level, onClose, onSaved }) {
  const editing = !!level;
  const [f, setF] = useState(editing ? { ...LEVEL_DEFAULT, ...level } : LEVEL_DEFAULT);
  const { busy, run } = useSave(() => { onSaved(); onClose(); });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const save = () => {
    const body = { ...f, number: nOrU(f.number), difficulty: nOrU(f.difficulty), challenge_count: nOrU(f.challenge_count), pass_threshold: nOrU(f.pass_threshold), rewards: f.rewards || [] };
    if (editing) return run(() => api.updateLevel(level.id, { title: body.title, narrative: body.narrative, instruction: body.instruction, assist_level: body.assist_level, difficulty: body.difficulty, challenge_count: body.challenge_count, pass_threshold: body.pass_threshold }), 'Level updated');
    return run(() => api.createLevel(advId, body), 'Level created');
  };
  return (
    <Modal wide title={editing ? `Edit level ${level.number ?? ''}` : 'New story level'} onClose={onClose}>
      <div className="form-grid">
        {!editing && <Field label="Number"><input className="input" type="number" value={f.number} onChange={set('number')} /></Field>}
        {!editing && <Field label="Kind"><input className="input" value={f.kind} onChange={set('kind')} placeholder="variation" /></Field>}
        <Field label="Title" full><input className="input" value={f.title} onChange={set('title')} /></Field>
        <Field label="Narrative" full><input className="input" value={f.narrative} onChange={set('narrative')} /></Field>
        <Field label="Instruction" full><input className="input" value={f.instruction} onChange={set('instruction')} /></Field>
        <Field label="Assist level"><select className="select" value={f.assist_level} onChange={set('assist_level')}><option value="full">Full</option><option value="partial">Partial</option><option value="none">None</option></select></Field>
        {!editing && <Field label="Template kind"><input className="input" value={f.template_kind} onChange={set('template_kind')} placeholder="match_color" /></Field>}
        {!editing && <Field label="Curriculum"><input className="input" value={f.curriculum} onChange={set('curriculum')} placeholder="colors" /></Field>}
        <Field label="Difficulty"><input className="input" type="number" min="1" value={f.difficulty} onChange={set('difficulty')} /></Field>
        <Field label="Challenge count"><input className="input" type="number" min="1" value={f.challenge_count} onChange={set('challenge_count')} /></Field>
        <Field label="Pass threshold (0–1)"><input className="input" type="number" min="0" max="1" step="0.05" value={f.pass_threshold} onChange={set('pass_threshold')} /></Field>
      </div>
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} onClick={save}>{editing ? 'Save level' : 'Create level'}</Btn></div>
    </Modal>
  );
}

function AdventureDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const adv = useApi(() => api.adventure(id), [id]);
  const levels = useApi(() => api.levels(id), [id]);
  const [visuals, setVisuals] = useState(false);
  const [level, setLevel] = useState(null);
  const a = adv.data?.adventure || adv.data;
  return (
    <Page title={a?.title || a?.name || 'Adventure'} sub="Catalog metadata and story levels."
      action={<><Btn icon={ArrowLeft} onClick={() => nav('/content/adventures')}>All adventures</Btn><Btn icon={Palette} onClick={() => setVisuals(true)} disabled={!a}>Edit visuals</Btn></>}>
      <Card title="Details"><Async q={adv} rows={3} render={() => <KV data={a} />} /></Card>
      <Card title="Story levels" action={<Btn variant="primary" size="sm" icon={Plus} onClick={() => setLevel({})}>New level</Btn>}>
        <Async q={levels} rows={3} render={(d) => <Table rows={rowsOf(d)} prefer={['number', 'title', 'kind', 'assist_level', 'difficulty', 'challenge_count', 'pass_threshold']} onRowClick={(l) => setLevel({ level: l })} empty="No levels yet" />} />
      </Card>
      {visuals && a && <VisualsModal adv={a} onClose={() => setVisuals(false)} onSaved={adv.reload} />}
      {level && <LevelModal advId={id} level={level.level} onClose={() => setLevel(null)} onSaved={levels.reload} />}
    </Page>
  );
}

/* ───────── templates ───────── */
const SPEC_HINT = '{\n  "butterflies": 4,\n  "decoy_flowers": 2,\n  "colors": ["red", "blue"],\n  "match_on": ["color"]\n}';

function TemplateModal({ onClose, onSaved }) {
  const engines = useApi(() => api.engines(), []);
  const [f, setF] = useState({ engine_id: '', slug: '', kind: '', age: 4, curriculum: '', difficulty: 2, instruction: '', spec: SPEC_HINT, hints: true, weight: 1 });
  const [err, setErr] = useState('');
  const kinds = useApi(() => (f.engine_id ? api.engineKinds(f.engine_id) : Promise.resolve([])), [f.engine_id]);
  const { busy, run } = useSave(() => { onSaved(); onClose(); });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const engineRows = rowsOf(engines.data);
  const kindRows = rowsOf(kinds.data).map((k) => (typeof k === 'string' ? k : k.kind || k.name)).filter(Boolean);
  const save = () => {
    let spec;
    try { spec = JSON.parse(f.spec); } catch { setErr('Spec must be valid JSON.'); return; }
    setErr('');
    run(() => api.createTemplate({ ...f, spec, age: nOrU(f.age), difficulty: nOrU(f.difficulty), weight: nOrU(f.weight) }), 'Template created');
  };
  return (
    <Modal wide title="New challenge template" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 14 }}>The template is generated once before saving. If the spec cannot produce a playable challenge the API rejects it (422).</p>
      <div className="form-grid">
        <Field label="Engine"><select className="select" value={f.engine_id} onChange={set('engine_id')}><option value="">Select…</option>{engineRows.map((e) => <option key={e.id} value={e.id}>{e.name || e.slug || e.id}</option>)}</select></Field>
        <Field label="Kind">{kindRows.length ? <select className="select" value={f.kind} onChange={set('kind')}><option value="">Select…</option>{kindRows.map((k) => <option key={k}>{k}</option>)}</select> : <input className="input" value={f.kind} onChange={set('kind')} placeholder="match_color" />}</Field>
        <Field label="Slug" full><input className="input" value={f.slug} onChange={set('slug')} placeholder="custom__match_color__colors__a4_d2" /></Field>
        <Field label="Age"><input className="input" type="number" value={f.age} onChange={set('age')} /></Field>
        <Field label="Curriculum"><input className="input" value={f.curriculum} onChange={set('curriculum')} placeholder="colors" /></Field>
        <Field label="Difficulty"><input className="input" type="number" min="1" value={f.difficulty} onChange={set('difficulty')} /></Field>
        <Field label="Weight"><input className="input" type="number" min="0" value={f.weight} onChange={set('weight')} /></Field>
        <Field label="Instruction" full><input className="input" value={f.instruction} onChange={set('instruction')} /></Field>
        <Field label="Spec (JSON)" full><textarea className="textarea code" style={{ minHeight: 150 }} value={f.spec} onChange={set('spec')} /></Field>
        <div className="row full"><Switch label="Hints" on={f.hints} onChange={(v) => setF((s) => ({ ...s, hints: v }))} /><span>Show hints</span></div>
      </div>
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} disabled={!f.engine_id || !f.slug || !f.kind} onClick={save}>Create template</Btn></div>
    </Modal>
  );
}

function PreviewModal({ tpl, onClose }) {
  const { toast } = useApp();
  const [assist, setAssist] = useState('full');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { setOut(await api.previewTemplate(tpl.id, { assist_level: assist })); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal wide title={`Preview — ${tpl.slug || tpl.id}`} onClose={onClose}>
      <div className="row" style={{ marginBottom: 14 }}>
        <select className="select" style={{ width: 160 }} value={assist} onChange={(e) => setAssist(e.target.value)} aria-label="Assist level"><option value="full">Full assist</option><option value="partial">Partial assist</option><option value="none">No assist</option></select>
        <Btn variant="primary" icon={Eye} busy={busy} onClick={go}>Generate preview</Btn>
      </div>
      {out ? <pre className="code">{JSON.stringify(out, null, 2)}</pre> : <Empty title="No preview yet">Pick an assist level and generate a sample challenge.</Empty>}
    </Modal>
  );
}

function WeightModal({ tpl, onClose, onSaved }) {
  const [w, setW] = useState(tpl.weight ?? 1);
  const { busy, run } = useSave(() => { onSaved(); onClose(); });
  return (
    <Modal title={`Edit template — ${tpl.slug || tpl.id}`} onClose={onClose}>
      <Field label="Weight"><input className="input" type="number" min="0" value={w} onChange={(e) => setW(e.target.value)} /></Field>
      <div className="modal-foot"><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" busy={busy} onClick={() => run(() => api.updateTemplate(tpl.id, { weight: Number(w) }), 'Template updated')}>Save</Btn></div>
    </Modal>
  );
}

function Templates() {
  const [offset, setOffset] = useState(0);
  const res = useApi(() => api.templates({ limit: LIMIT, offset }), [offset]);
  const [modal, setModal] = useState(null);
  const columns = (rows) => [
    ...(rows[0] ? Object.keys(rows[0]).filter((k) => ['slug', 'kind', 'age', 'curriculum', 'difficulty', 'weight'].includes(k)).map((key) => ({ key, label: key[0].toUpperCase() + key.slice(1) })) : []),
    { key: '_a', label: '', render: (r) => <div className="row"><Btn size="sm" icon={Eye} onClick={() => setModal({ t: 'preview', tpl: r })}>Preview</Btn><Btn size="sm" icon={Pencil} onClick={() => setModal({ t: 'edit', tpl: r })}>Edit</Btn></div> },
  ];
  return (
    <Card title="Challenge templates" sub="Reusable challenge specs the engines instance" action={<Btn variant="primary" size="sm" icon={Plus} onClick={() => setModal({ t: 'new' })}>New template</Btn>}>
      <Async q={res} rows={5} render={(d) => {
        const rows = rowsOf(d);
        return <><Table rows={rows} columns={rows.length ? columns(rows) : undefined} empty="No templates yet" /><Pager offset={offset} limit={LIMIT} count={rows.length} total={totalOf(d)} onChange={setOffset} /></>;
      }} />
      {modal?.t === 'new' && <TemplateModal onClose={() => setModal(null)} onSaved={res.reload} />}
      {modal?.t === 'preview' && <PreviewModal tpl={modal.tpl} onClose={() => setModal(null)} />}
      {modal?.t === 'edit' && <WeightModal tpl={modal.tpl} onClose={() => setModal(null)} onSaved={res.reload} />}
    </Card>
  );
}

export default function Content() {
  return (
    <Routes>
      <Route index element={<Navigate to="engines" replace />} />
      <Route path="adventures/:id" element={<AdventureDetail />} />
      <Route path="*" element={(
        <Page title="Content" sub="Engines, adventures, story levels and challenge templates.">
          <Tabs />
          <Routes><Route path="engines" element={<Engines />} /><Route path="adventures" element={<Adventures />} /><Route path="templates" element={<Templates />} /><Route path="*" element={<Navigate to="engines" replace />} /></Routes>
        </Page>
      )} />
    </Routes>
  );
}
