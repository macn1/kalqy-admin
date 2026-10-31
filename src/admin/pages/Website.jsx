import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Maximize2, Plus, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import PublicPreview from '../components/PublicPreview.jsx';
import { Modal } from '../components/Overlay.jsx';
import { Button, Card, ErrorState, Field, Select, Skeleton, Textarea, TextInput, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { saveObject } from '../../services/demoDataService.js';
import { buildWebsite } from '../../data/websiteData.js';
import { cx } from '../components/ui.jsx';

const IMAGES = ['/images/hero.png', '/images/chicken.png', '/images/plant.png', '/images/wiz.png', '/images/arun.png', '/images/prince.png', '/images/abhi.png'];
const F = (k, label, extra = {}) => ({ k, label, ...extra });

const SECTIONS = [
  { key: 'hero', label: 'Hero section', fields: [F('eyebrow', 'Eyebrow'), F('title', 'Headline'), F('subtitle', 'Sub-headline', { multi: true }), F('cta', 'Button label'), F('image', 'Image', { image: true })] },
  { key: 'about', label: 'About KALQY', fields: [F('title', 'Title'), F('body', 'Body', { multi: true })] },
  { key: 'games', label: 'Games', list: true, item: 'Game', fields: [F('title', 'Title'), F('tag', 'Tag'), F('blurb', 'Short description', { multi: true }), F('image', 'Image', { image: true })] },
  { key: 'benefits', label: 'Learning benefits', list: true, item: 'Benefit', fields: [F('title', 'Title'), F('text', 'Text', { multi: true })] },
  { key: 'howItWorks', label: 'How It Works', list: true, item: 'Step', fields: [F('title', 'Title'), F('text', 'Text', { multi: true })] },
  { key: 'team', label: 'Team members', list: true, item: 'Member', fields: [F('name', 'Name'), F('role', 'Role'), F('bio', 'Bio', { multi: true }), F('image', 'Photo', { image: true })] },
  { key: 'gallery', label: 'Gallery', list: true, item: 'Image', fields: [F('caption', 'Caption'), F('image', 'Image', { image: true })] },
  { key: 'contact', label: 'Contact information', fields: [F('email', 'Email', { type: 'email' }), F('phone', 'Phone'), F('address', 'Address', { multi: true })] },
  { key: 'demoCta', label: 'Demo call-to-action', fields: [F('title', 'Title'), F('text', 'Text', { multi: true }), F('button', 'Button label')] },
  { key: 'downloads', label: 'Download links', fields: [F('windows', 'Windows link (https)', { url: true }), F('macAppleSilicon', 'macOS Apple Silicon link (https)', { url: true }), F('macIntel', 'macOS Intel link (https)', { url: true })] },
];

function FieldInput({ f, value, onChange }) {
  if (f.image) return <Select value={value || ''} onChange={(e) => onChange(e.target.value)}><option value="">No image</option>{IMAGES.map((i) => <option key={i} value={i}>{i.replace('/images/', '')}</option>)}</Select>;
  if (f.multi) return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 64 }} />;
  return <TextInput type={f.type || 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}

export default function Website() {
  const { toast, canEdit } = useAdmin();
  const edit = canEdit('website');
  const { loading, error, reload, data } = useDemoData('website');
  const [draft, setDraft] = useState(null);
  const [active, setActive] = useState('hero');
  const [saving, setSaving] = useState(false);
  const [full, setFull] = useState(false);

  // Re-sync whenever the stored content changes (after a save or a demo-data reset).
  useEffect(() => { if (data.website) setDraft(JSON.parse(JSON.stringify(data.website))); }, [data.website]);

  const dirty = useMemo(() => draft && data.website && JSON.stringify(draft) !== JSON.stringify(data.website), [draft, data.website]);
  const section = SECTIONS.find((s) => s.key === active);

  const urlErrors = useMemo(() => {
    if (!draft) return {};
    const e = {};
    SECTIONS.find((s) => s.key === 'downloads').fields.forEach((f) => { if (draft.downloads[f.k] && !/^https:\/\/\S+$/i.test(draft.downloads[f.k])) e[f.k] = 'Use a full https:// link.'; });
    return e;
  }, [draft]);
  const emailErr = draft && draft.contact.email && !/^\S+@\S+\.\S+$/.test(draft.contact.email) ? 'Enter a valid email.' : '';
  const blocked = Object.keys(urlErrors).length > 0 || !!emailErr;

  const setField = (key, k, v) => setDraft((d) => ({ ...d, [key]: { ...d[key], [k]: v } }));
  const setItem = (key, i, k, v) => setDraft((d) => ({ ...d, [key]: d[key].map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const addItem = (s) => setDraft((d) => ({ ...d, [s.key]: [...d[s.key], Object.fromEntries(s.fields.map((f) => [f.k, ''])) ] }));
  const delItem = (key, i) => setDraft((d) => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try { await saveObject('website', draft); toast('Saved to the local demo store. The live website was not changed.'); } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };
  const resetSection = () => { setDraft((d) => ({ ...d, [active]: buildWebsite()[active] })); toast('Section reset to starting content (not saved yet)'); };

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Website Content" description="Edit sample copy for the public KALQY site and preview it. Changes stay in this browser only."
        actions={<><DemoBadge label="LOCAL PREVIEW ONLY" /><Button icon={Maximize2} onClick={() => setFull(true)} disabled={!draft}>Full preview</Button>
          {edit && <Button variant="primary" icon={Save} loading={saving} disabled={!dirty || blocked} onClick={save}>{dirty ? 'Save changes' : 'Saved'}</Button>}</>} />
      <div className="alert info" style={{ marginBottom: 16 }}><ShieldCheck size={17} style={{ flex: 'none', marginTop: 2 }} /><span>Nothing here is published. Edits are stored in your browser's local demo store and never reach kalqy.in or any server.</span></div>

      {loading || !draft ? <Skeleton h={420} style={{ borderRadius: 18 }} /> : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,220px) minmax(0,1fr) minmax(0,1.1fr)' }} data-split>
          <style>{`@media (max-width:1280px){[data-split]{grid-template-columns:minmax(0,1fr)!important}}`}</style>
          <Card flush title="Sections">
            <nav aria-label="Content sections" style={{ padding: 8 }}>
              {SECTIONS.map((s) => (
                <button key={s.key} onClick={() => setActive(s.key)} aria-current={active === s.key ? 'true' : undefined}
                  className={cx('sb-link')} style={{ width: '100%', border: 0, background: active === s.key ? 'var(--blue-soft)' : 'transparent', fontWeight: active === s.key ? 700 : 500, color: 'var(--text)' }}>{s.label}</button>
              ))}
            </nav>
          </Card>

          <Card title={section.label} subtitle={edit ? 'Edit the fields — the preview updates instantly.' : 'View-only for your simulated role.'}
            action={edit && <Button size="sm" icon={RotateCcw} onClick={resetSection}>Reset section</Button>}>
            <fieldset disabled={!edit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              {!section.list ? (
                <div className="stack" style={{ gap: 14 }}>
                  {section.fields.map((f) => (
                    <Field key={f.k} label={f.label} error={(section.key === 'downloads' && urlErrors[f.k]) || (section.key === 'contact' && f.k === 'email' && emailErr) || ''}>
                      <FieldInput f={f} value={draft[section.key][f.k]} onChange={(v) => setField(section.key, f.k, v)} />
                    </Field>
                  ))}
                </div>
              ) : (
                <div className="stack">
                  {draft[section.key].map((it, i) => (
                    <div key={i} className="card card-pad" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}>
                      <div className="row between" style={{ marginBottom: 10 }}><b>{section.item} {i + 1}</b>{edit && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Remove ${section.item} ${i + 1}`} onClick={() => delItem(section.key, i)}>Remove</Button>}</div>
                      <div className="stack" style={{ gap: 12 }}>{section.fields.map((f) => <Field key={f.k} label={f.label}><FieldInput f={f} value={it[f.k]} onChange={(v) => setItem(section.key, i, f.k, v)} /></Field>)}</div>
                    </div>
                  ))}
                  {edit && <div><Button icon={Plus} onClick={() => addItem(section)}>Add {section.item.toLowerCase()}</Button></div>}
                </div>
              )}
            </fieldset>
          </Card>

          <Card title="Live preview" subtitle={dirty ? 'Unsaved changes' : 'Matches saved content'}><PublicPreview content={draft} active={active} /></Card>
        </div>
      )}

      <Modal open={full} onClose={() => setFull(false)} title="Full preview (local only)" size="xl">{draft && <PublicPreview content={draft} active="" />}</Modal>
    </div>
  );
}
