import React, { useEffect, useMemo, useState } from 'react';
import { Plus, UserSquare2, CheckCircle2, FileText, GraduationCap, Pencil, Eye, MoreHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import { Modal, Drawer } from '../components/Overlay.jsx';
import { Avatar, Button, Card, EmptyState, ErrorState, Field, IconButton, Menu, SearchBox, Select, StatTile, StatusBadge, TextInput, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { createRecord, updateRecord } from '../../services/demoDataService.js';
import { byId, fullName, relTime } from '../utils/format.js';

const EMPTY = { name: '', email: '', schoolId: '', status: 'Active' };

function TeacherForm({ open, teacher, schools, onClose }) {
  const { toast } = useAdmin();
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(teacher ? { ...teacher } : { ...EMPTY, schoolId: schools[0]?.id || '' }); setErr({}); } }, [open, teacher, schools]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async (e) => {
    e?.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email (use a fictional address).';
    setErr(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      if (teacher) await updateRecord('teachers', teacher.id, { ...f, name: f.name.trim() });
      else await createRecord('teachers', { ...f, name: f.name.trim(), reportsGenerated: 0, lastActive: new Date().toISOString(), recentActivity: 'Account created' });
      toast(teacher ? 'Teacher updated' : 'Teacher added');
      onClose();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={teacher ? 'Edit teacher' : 'Add teacher'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{teacher ? 'Save changes' : 'Add teacher'}</Button></>}>
      <form className="form-grid" onSubmit={save} noValidate>
        <Field label="Full name" error={err.name} className="full"><TextInput value={f.name} invalid={!!err.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email (fictional)" error={err.email} className="full"><TextInput type="email" value={f.email} invalid={!!err.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
        <Field label="Assigned school"><Select value={f.schoolId} onChange={(e) => set('schoolId', e.target.value)}><option value="">Unassigned</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Account status"><Select value={f.status} options={['Active', 'On leave', 'Inactive']} onChange={(e) => set('status', e.target.value)} /></Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function Teachers() {
  const { canEdit } = useAdmin();
  const edit = canEdit('schools');
  const { loading, error, reload, data } = useDemoData('teachers', 'schools', 'students');
  const { teachers = [], schools = [], students = [] } = data;
  const [q, setQ] = useState('');
  const [school, setSchool] = useState('all');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState({ open: false, teacher: null });
  const [openId, setOpenId] = useState(null);
  const scMap = useMemo(() => byId(schools), [schools]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return teachers.map((x) => ({ ...x, schoolName: scMap[x.schoolId]?.name || 'Unassigned', kids: students.filter((s) => s.teacherId === x.id && !s.archived) }))
      .filter((x) => (school === 'all' || x.schoolId === school) && (status === 'all' || x.status === status) && (!t || `${x.name} ${x.id} ${x.email}`.toLowerCase().includes(t)));
  }, [teachers, students, scMap, q, school, status]);
  const open = rows.find((r) => r.id === openId);

  const columns = [
    { key: 'name', header: 'Teacher', render: (r) => <div className="row"><Avatar name={r.name} size="sm" /><div><div className="cell-main">{r.name}</div><div className="cell-sub">{r.id}</div></div></div> },
    { key: 'schoolName', header: 'Assigned school' },
    { key: 'students', header: 'Students', sortValue: (r) => r.kids.length, render: (r) => <span className="mono">{r.kids.length}</span> },
    { key: 'recentActivity', header: 'Recent activity', render: (r) => <div><div>{r.recentActivity}</div><div className="cell-sub">{relTime(r.lastActive)}</div></div> },
    { key: 'reportsGenerated', header: 'Reports', render: (r) => <span className="mono">{r.reportsGenerated}</span> },
    { key: 'status', header: 'Account', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, sortable: false, render: (r) => (
      <Menu label={`Actions for ${r.name}`} trigger={({ label }) => <IconButton icon={MoreHorizontal} label={label} />}
        items={[{ label: 'View profile', icon: Eye, onClick: () => setOpenId(r.id) }, edit && { label: 'Edit teacher', icon: Pencil, onClick: () => setForm({ open: true, teacher: r }) }]} />) },
  ];
  const exportCols = [{ header: 'Teacher ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'School', key: 'schoolName' }, { header: 'Students', value: (r) => r.kids.length }, { header: 'Reports generated', key: 'reportsGenerated' }, { header: 'Status', key: 'status' }];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Teachers" description="Teacher accounts, school assignments and reporting activity."
        actions={<><DemoBadge label="SAMPLE DATA" /><ExportButton filename="kalqy-teachers" columns={exportCols} rows={rows} preamble={[['Report', 'Teachers (sample data)'], ['Filters', `search="${q}" school=${school} status=${status}`]]} />
          {edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, teacher: null })}>Add teacher</Button>}</>} />
      <div className="grid grid-stats">
        <StatTile label="Teachers" value={teachers.length} icon={UserSquare2} />
        <StatTile label="Active" value={teachers.filter((t) => t.status === 'Active').length} icon={CheckCircle2} tone="mint" />
        <StatTile label="Reports generated" value={teachers.reduce((a, t) => a + t.reportsGenerated, 0)} icon={FileText} tone="yellow" />
        <StatTile label="Students supported" value={students.filter((s) => !s.archived).length} icon={GraduationCap} tone="coral" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search teacher name, ID or email" />
          <Select aria-label="Filter by school" value={school} onChange={(e) => setSchool(e.target.value)}><option value="all">All schools</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option>Active</option><option>On leave</option><option>Inactive</option></Select>
        </div>
        <DataTable label="Teachers" columns={columns} rows={rows} loading={loading} pageSize={10} onRowClick={(r) => setOpenId(r.id)}
          empty={<EmptyState kind="star" title={teachers.length ? 'No teachers match' : 'No teachers yet'} text="Adjust filters or add a sample teacher." />} />
      </Card>
      <TeacherForm open={form.open} teacher={form.teacher} schools={schools} onClose={() => setForm({ open: false, teacher: null })} />
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name} subtitle={open ? `${open.id} · Sample teacher profile` : ''}>
        {open && (
          <div className="stack">
            <dl className="kv">
              <dt>Email</dt><dd>{open.email}</dd><dt>School</dt><dd>{open.schoolName}</dd><dt>Status</dt><dd><StatusBadge status={open.status} /></dd>
              <dt>Reports generated</dt><dd>{open.reportsGenerated}</dd><dt>Last active</dt><dd>{relTime(open.lastActive)}</dd><dt>Recent activity</dt><dd>{open.recentActivity}</dd>
            </dl>
            <h4>Students ({open.kids.length})</h4>
            {open.kids.length ? open.kids.map((k) => <div key={k.id} className="row between"><span>{fullName(k)}</span><StatusBadge status={k.status} /></div>) : <p className="muted">No students assigned.</p>}
          </div>
        )}
      </Drawer>
    </div>
  );
}
