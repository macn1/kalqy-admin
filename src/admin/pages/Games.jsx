import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts';
import { Plus, Pencil, BarChart3, Eye, Upload, EyeOff, Trash2, MoreHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import GameThumb from '../components/GameThumb.jsx';
import { Modal, ConfirmDialog } from '../components/Overlay.jsx';
import { ChartBox, ChartTip, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Badge, Button, Card, EmptyState, ErrorState, Field, IconButton, Menu, SearchBox, Select, Skeleton, StatusBadge, Textarea, TextInput, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { createRecord, updateRecord, removeRecord } from '../../services/demoDataService.js';
import { GAME_CATEGORIES, DEV_AREAS } from '../../data/gamesData.js';
import { resolveRange } from '../utils/dateRange.js';
import { dailySeries, completionRate, avgDuration, avgScore } from '../utils/analytics.js';
import { fmtInt, fmtDate } from '../utils/format.js';

const FILTERS = [
  { v: 'all', l: 'All games' }, { v: 'Mathematics', l: 'Mathematics' }, { v: 'English & Language', l: 'English & language' },
  { v: 'Science', l: 'Science' }, { v: 'Colours & Matching', l: 'Colours & matching' }, { v: 'Published', l: 'Published' }, { v: 'Draft', l: 'Draft' },
];
const COLORS = ['#39A9F9', '#3FB27F', '#FF8C78', '#E9B21A', '#8A7BE0', '#5B6B8C'];
const EMPTY = { name: '', category: 'Mathematics', description: '', status: 'Draft', thumbnail: '', devArea: DEV_AREAS[0], ageRange: '3–5' };

/** Downscale a chosen image to keep the localStorage footprint small. Preview stays local to this browser. */
function readThumbnail(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be opened.'));
      img.onload = () => {
        const max = 480, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function GameForm({ open, game, onClose }) {
  const { toast } = useAdmin();
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => { if (open) { setF(game ? { ...game } : EMPTY); setErr({}); } }, [open, game]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { set('thumbnail', await readThumbnail(file)); } catch (x) { toast(x.message, 'error'); }
    e.target.value = '';
  };
  const save = async (e) => {
    e?.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Game title is required.';
    if (!f.description.trim()) er.description = 'Add a short description.';
    setErr(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const clean = { ...f, name: f.name.trim(), description: f.description.trim(), updatedAt: new Date().toISOString() };
      if (game) await updateRecord('games', game.id, clean);
      else await createRecord('games', { ...clean, origin: 'sample', color: COLORS[Math.floor(Math.random() * COLORS.length)], icon: 'Gamepad2' });
      toast(game ? 'Game updated' : 'Game created in the demo store');
      onClose();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={game ? `Edit ${game.name}` : 'Add game'} size="lg"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{game ? 'Save changes' : 'Create game'}</Button></>}>
      <form className="form-grid" onSubmit={save} noValidate>
        <Field label="Game title" error={err.name}><TextInput value={f.name} invalid={!!err.name} onChange={(e) => set('name', e.target.value)} maxLength={60} /></Field>
        <Field label="Learning category"><Select value={f.category} options={GAME_CATEGORIES} onChange={(e) => set('category', e.target.value)} /></Field>
        <Field label="Short description" error={err.description} className="full"><Textarea value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={240} /></Field>
        <Field label="Development area"><Select value={f.devArea} options={DEV_AREAS} onChange={(e) => set('devArea', e.target.value)} /></Field>
        <Field label="Publication status"><Select value={f.status} options={['Draft', 'Published']} onChange={(e) => set('status', e.target.value)} /></Field>
        <div className="field full">
          <span className="lbl">Thumbnail</span>
          <div className="row wrap">
            <div style={{ width: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}><GameThumb game={{ ...f, name: f.name || 'New game', color: f.color || '#39A9F9', icon: f.icon || 'Gamepad2' }} size={80} /></div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} aria-label="Upload thumbnail" />
            <Button icon={Upload} onClick={() => fileRef.current?.click()}>Choose image</Button>
            {f.thumbnail && <Button variant="ghost" onClick={() => set('thumbnail', '')}>Remove</Button>}
          </div>
          <span className="hint">Preview only — stays in this browser and is never uploaded.</span>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function Games() {
  const { toast, canEdit } = useAdmin();
  const edit = canEdit('games');
  const anim = useChartAnim();
  const { loading, error, reload, data } = useDemoData('games', 'sessions');
  const { games = [], sessions = [] } = data;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ open: false, game: null });
  const [view, setView] = useState({ mode: '', game: null });
  const [del, setDel] = useState(null);

  const stats = useMemo(() => Object.fromEntries(games.map((g) => {
    const l = sessions.filter((s) => s.gameId === g.id);
    return [g.id, { n: l.length, dur: avgDuration(l), comp: completionRate(l), score: avgScore(l), list: l }];
  })), [games, sessions]);

  const rows = games.filter((g) => {
    const t = q.trim().toLowerCase();
    const fOk = filter === 'all' || g.category === filter || g.status === filter;
    return fOk && (!t || `${g.name} ${g.category} ${g.description}`.toLowerCase().includes(t));
  });

  const toggle = async (g) => {
    const next = g.status === 'Published' ? 'Draft' : 'Published';
    await updateRecord('games', g.id, { status: next, updatedAt: new Date().toISOString() });
    toast(`${g.name} ${next === 'Published' ? 'published' : 'unpublished'} (demo mode, the public site is unchanged)`);
  };
  const remove = async () => { await removeRecord('games', del.id); toast(`${del.name} deleted from the demo store`); setDel(null); };

  const series = view.game ? dailySeries(stats[view.game.id].list, resolveRange({ preset: '30d' })) : [];
  const vs = view.game && stats[view.game.id];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Games Library" description="Manage the learning games offered on KALQY. Descriptions marked “Sample” are placeholder content."
        actions={<><DemoBadge label="SAMPLE CONTENT" />{edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, game: null })}>Add game</Button>}</>} />
      <div className="row wrap" style={{ marginBottom: 14, gap: 12 }}>
        <div style={{ flex: '1 1 240px', maxWidth: 340 }}><SearchBox value={q} onChange={setQ} placeholder="Search games" /></div>
        <div className="row wrap" role="group" aria-label="Game filters">
          {FILTERS.map((f) => <button key={f.v} className="chip-btn" aria-pressed={filter === f.v} onClick={() => setFilter(f.v)}>{f.l}</button>)}
        </div>
      </div>

      {loading ? <div className="game-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={340} style={{ borderRadius: 18 }} />)}</div>
        : !rows.length ? <Card><EmptyState kind="marble" title={games.length ? 'No games match' : 'No games yet'} text="Adjust filters, or add a game to the demo library." action={edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, game: null })}>Add game</Button>} /></Card>
          : (
            <div className="game-grid">
              {rows.map((g) => {
                const s = stats[g.id];
                return (
                  <article key={g.id} className="card game-card hoverable">
                    <div className="game-thumb"><GameThumb game={g} />
                      <span className="st"><StatusBadge status={g.status} /></span>
                      <span className="src">{g.origin === 'kalqy.in' ? <Badge tone="blue" plain>On kalqy.in</Badge> : <Badge plain>Sample</Badge>}</span>
                    </div>
                    <div className="game-body">
                      <div className="row between"><h3 style={{ fontSize: 18 }}>{g.name}</h3>
                        <Menu label={`More actions for ${g.name}`} trigger={({ label }) => <IconButton icon={MoreHorizontal} label={label} />}
                          items={[
                            { label: 'Preview details', icon: Eye, onClick: () => setView({ mode: 'preview', game: g }) },
                            { label: 'View analytics', icon: BarChart3, onClick: () => setView({ mode: 'analytics', game: g }) },
                            edit && { label: 'Edit details', icon: Pencil, onClick: () => setForm({ open: true, game: g }) },
                            edit && { label: g.status === 'Published' ? 'Unpublish' : 'Publish', icon: g.status === 'Published' ? EyeOff : Eye, onClick: () => toggle(g) },
                            edit && { divider: true }, edit && { label: 'Delete game', icon: Trash2, danger: true, onClick: () => setDel(g) },
                          ]} /></div>
                      <Badge tone="yellow" plain>{g.category}</Badge>
                      <p className="muted" style={{ fontSize: 13 }}>{g.description}</p>
                      <div className="game-metrics">
                        <div><b className="mono">{fmtInt(s.n)}</b><small>Sessions</small></div>
                        <div><b className="mono">{s.n ? s.dur.toFixed(1) : '—'}{s.n ? ' min' : ''}</b><small>Avg duration</small></div>
                        <div><b className="mono">{s.n ? `${Math.round(s.comp)}%` : '—'}</b><small>Completion</small></div>
                      </div>
                      <div className="row" style={{ marginTop: 'auto' }}>
                        <Button size="sm" icon={Eye} onClick={() => setView({ mode: 'preview', game: g })}>Preview</Button>
                        <Button size="sm" icon={BarChart3} onClick={() => setView({ mode: 'analytics', game: g })}>Analytics</Button>
                        {edit && <Button size="sm" variant="ghost" onClick={() => toggle(g)}>{g.status === 'Published' ? 'Unpublish' : 'Publish'}</Button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

      <GameForm open={form.open} game={form.game} onClose={() => setForm({ open: false, game: null })} />

      <Modal open={view.mode === 'preview'} onClose={() => setView({ mode: '', game: null })} title={view.game?.name || ''} size="lg">
        {view.game && (
          <div className="stack">
            <div style={{ borderRadius: 16, overflow: 'hidden' }}><GameThumb game={view.game} size={220} /></div>
            <div className="row wrap"><StatusBadge status={view.game.status} /><Badge tone="yellow" plain>{view.game.category}</Badge><Badge plain>Ages {view.game.ageRange}</Badge></div>
            <p>{view.game.description}</p>
            <dl className="kv">
              <dt>Development area</dt><dd>{view.game.devArea}</dd><dt>Source</dt><dd>{view.game.origin === 'kalqy.in' ? 'Game name listed on kalqy.in' : 'Sample content'}</dd><dt>Last updated</dt><dd>{fmtDate(view.game.updatedAt)}</dd>
            </dl>
            <p className="note">Preview of library details only. Gameplay is not simulated in this demo.</p>
          </div>
        )}
      </Modal>

      <Modal open={view.mode === 'analytics'} onClose={() => setView({ mode: '', game: null })} title={`${view.game?.name || ''} · analytics`} size="lg">
        {view.game && vs && (
          <div className="stack">
            <div className="grid grid-stats">
              {[['Sessions', fmtInt(vs.n)], ['Avg duration', vs.n ? `${vs.dur.toFixed(1)} min` : '—'], ['Completion', vs.n ? `${Math.round(vs.comp)}%` : '—'], ['Avg score', vs.n ? Math.round(vs.score) : '—']].map(([l, v]) => (
                <div key={l} className="card card-pad"><div className="muted" style={{ fontSize: 12.5 }}>{l}</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }} className="mono">{v}</div></div>
              ))}
            </div>
            {vs.n ? (
              <ChartBox label={`Daily sessions for ${view.game.name}, last 30 days`} height={240}>
                <ResponsiveContainer><AreaChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="date" {...axisProps} minTickGap={28} /><YAxis {...axisProps} allowDecimals={false} />
                  <RTooltip content={<ChartTip />} /><Area dataKey="sessions" name="Sessions" stroke={view.game.color} strokeWidth={2.5} fill={view.game.color} fillOpacity={0.15} isAnimationActive={anim} />
                </AreaChart></ResponsiveContainer>
              </ChartBox>
            ) : <EmptyState kind="egg" title="No sessions recorded" text="This game has no sample sessions yet." />}
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!del} danger title="Delete game?" confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={remove}
        message={del ? `${del.name} will be removed from the demo library. Existing sample sessions will remain. This does not affect the live website.` : ''} />
    </div>
  );
}
