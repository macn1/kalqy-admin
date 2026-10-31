import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GraduationCap, Activity, UserPlus, Gauge, Eye, Pencil, Archive, ArchiveRestore, MoreHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import StudentFormModal from '../components/StudentFormModal.jsx';
import { ConfirmDialog } from '../components/Overlay.jsx';
import { Button, Card, SearchBox, Select, StatTile, StatusBadge, Avatar, Menu, IconButton, EmptyState, ErrorState, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { updateRecord } from '../../services/demoDataService.js';
import { byId, fullName, relTime, fmtDate } from '../utils/format.js';
import { DAY } from '../../data/seedUtils.js';

export default function Students() {
  const nav = useNavigate();
  const { toast, canEdit } = useAdmin();
  const edit = canEdit('students');
  const { loading, error, data, reload } = useDemoData('students', 'schools', 'teachers', 'parents', 'sessions');
  const { students = [], schools = [], teachers = [], parents = [], sessions = [] } = data;
  const [q, setQ] = useState('');
  const [school, setSchool] = useState('all');
  const [age, setAge] = useState('all');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState({ open: false, student: null });
  const [confirm, setConfirm] = useState(null);

  const scMap = useMemo(() => byId(schools), [schools]);
  const tMap = useMemo(() => byId(teachers), [teachers]);
  const stats = useMemo(() => {
    const per = {};
    sessions.forEach((s) => {
      const e = per[s.studentId] || (per[s.studentId] = { n: 0, last: '', recent: 0 });
      e.n += 1;
      if (s.startedAt > e.last) e.last = s.startedAt;
      if (new Date(s.startedAt).getTime() > Date.now() - 30 * DAY) e.recent += 1;
    });
    return per;
  }, [sessions]);

  const enriched = useMemo(() => students.map((s) => ({ ...s, name: fullName(s), schoolName: scMap[s.schoolId]?.name || '—', teacherName: tMap[s.teacherId]?.name || '—', sessions: stats[s.id]?.n || 0, lastActive: stats[s.id]?.last || '' })), [students, scMap, tMap, stats]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return enriched.filter((s) =>
      (status === 'Archived' ? s.archived : !s.archived && (status === 'all' || s.status === status)) &&
      (school === 'all' || s.schoolId === school) && (age === 'all' || String(s.age) === age) &&
      (!t || `${s.name} ${s.id}`.toLowerCase().includes(t)));
  }, [enriched, q, school, age, status]);

  const live = enriched.filter((s) => !s.archived);
  const active = live.filter((s) => s.lastActive && Date.now() - new Date(s.lastActive).getTime() < 14 * DAY).length;
  const newReg = live.filter((s) => Date.now() - new Date(s.registeredAt).getTime() < 30 * DAY).length;
  const engagement = live.length ? live.reduce((a, s) => a + (stats[s.id]?.recent || 0), 0) / live.length : 0;

  const archive = async (s, value) => {
    await updateRecord('students', s.id, { archived: value });
    toast(value ? `${s.name} archived` : `${s.name} restored`);
    setConfirm(null);
  };

  const columns = [
    { key: 'id', header: 'Student ID', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'name', header: 'Student', render: (r) => <div className="row"><Avatar name={r.name} size="sm" /><span className="cell-main">{r.name}</span></div> },
    { key: 'age', header: 'Age group', render: (r) => `Age ${r.age}` },
    { key: 'schoolName', header: 'School / centre' },
    { key: 'teacherName', header: 'Teacher' },
    { key: 'sessions', header: 'Sessions', render: (r) => <span className="mono">{r.sessions}</span> },
    { key: 'lastActive', header: 'Last active', render: (r) => relTime(r.lastActive) },
    { key: 'status', header: 'Learning status', render: (r) => <StatusBadge status={r.archived ? 'Archived' : r.status} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, sortable: false, render: (r) => (
      <Menu label={`Actions for ${r.name}`} trigger={({ label }) => <IconButton icon={MoreHorizontal} label={label} />}
        items={[
          { label: 'View profile', icon: Eye, onClick: () => nav(`/admin/students/${r.id}`) },
          edit && { label: 'Edit sample record', icon: Pencil, onClick: () => setForm({ open: true, student: r }) },
          edit && (r.archived ? { label: 'Restore student', icon: ArchiveRestore, onClick: () => archive(r, false) } : { label: 'Archive student', icon: Archive, danger: true, onClick: () => setConfirm(r) }),
        ]} />) },
  ];

  const exportCols = [
    { header: 'Student ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Age', key: 'age' }, { header: 'School', key: 'schoolName' },
    { header: 'Teacher', key: 'teacherName' }, { header: 'Sessions', key: 'sessions' }, { header: 'Last active', value: (r) => r.lastActive }, { header: 'Status', value: (r) => (r.archived ? 'Archived' : r.status) },
  ];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Students" description="Manage sample student records, track engagement and open learning profiles."
        actions={<><DemoBadge label="SAMPLE DATA" />
          <ExportButton filename="kalqy-students" columns={exportCols} rows={rows} preamble={[['Report', 'Students (sample data)'], ['Filters', `search="${q}" school=${school} age=${age} status=${status}`]]} />
          {edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, student: null })}>Add student</Button>}</>} />
      <div className="grid grid-stats">
        <StatTile label="Total students" value={live.length} icon={GraduationCap} />
        <StatTile label="Active (last 14 days)" value={active} icon={Activity} tone="mint" />
        <StatTile label="New registrations (30 days)" value={newReg} icon={UserPlus} tone="yellow" />
        <StatTile label="Avg sessions / student (30 days)" value={engagement.toFixed(1)} icon={Gauge} tone="coral" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name or ID" />
          <Select aria-label="Filter by school" value={school} onChange={(e) => setSchool(e.target.value)}><option value="all">All schools</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Filter by age group" value={age} onChange={(e) => setAge(e.target.value)}><option value="all">All ages</option><option value="3">Age 3</option><option value="4">Age 4</option><option value="5">Age 5</option></Select>
          <Select aria-label="Filter by learning status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option><option>On track</option><option>Excelling</option><option>Needs attention</option><option>New</option><option>Archived</option>
          </Select>
        </div>
        <DataTable label="Students" columns={columns} rows={rows} loading={loading} onRowClick={(r) => nav(`/admin/students/${r.id}`)}
          empty={<EmptyState kind="star" title={students.length ? 'No students match' : 'No students yet'} text={students.length ? 'Adjust your search or filters.' : 'Add a sample student, or restore sample data from Settings.'} />} />
      </Card>
      <p className="note">All students are fictional sample records. No facial data, recordings or real children's details are stored.</p>
      <StudentFormModal open={form.open} student={form.student} schools={schools} teachers={teachers} parents={parents} onClose={() => setForm({ open: false, student: null })} />
      <ConfirmDialog open={!!confirm} danger title="Archive student?" confirmLabel="Archive" onClose={() => setConfirm(null)} onConfirm={() => archive(confirm, true)}
        message={confirm ? `${confirm.name} will be hidden from the active list. You can restore them from the “Archived” filter. (Sample data only.)` : ''} />
    </div>
  );
}
