import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, School, CheckCircle2, GraduationCap, Activity, Eye, Pencil, MoreHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import SchoolFormModal from '../components/SchoolFormModal.jsx';
import { Button, Card, SearchBox, Select, StatTile, StatusBadge, Menu, IconButton, EmptyState, ErrorState, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { fmtDate, fmtInt } from '../utils/format.js';

export default function Schools() {
  const nav = useNavigate();
  const { canEdit } = useAdmin();
  const edit = canEdit('schools');
  const { loading, error, reload, data } = useDemoData('schools', 'students', 'teachers', 'sessions');
  const { schools = [], students = [], teachers = [], sessions = [] } = data;
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState({ open: false, school: null });

  const rows = useMemo(() => {
    const sc = {}, tc = {}, ss = {};
    students.filter((s) => !s.archived).forEach((s) => { sc[s.schoolId] = (sc[s.schoolId] || 0) + 1; });
    teachers.forEach((t) => { tc[t.schoolId] = (tc[t.schoolId] || 0) + 1; });
    sessions.forEach((s) => { ss[s.schoolId] = (ss[s.schoolId] || 0) + 1; });
    const t = q.trim().toLowerCase();
    return schools.map((s) => ({ ...s, studentCount: sc[s.id] || 0, teacherCount: tc[s.id] || 0, sessionCount: ss[s.id] || 0 }))
      .filter((s) => (state === 'all' || s.state === state) && (status === 'all' || s.status === status) && (!t || `${s.name} ${s.id} ${s.city}`.toLowerCase().includes(t)));
  }, [schools, students, teachers, sessions, q, state, status]);

  const states = [...new Set(schools.map((s) => s.state))].sort();
  const enrolled = rows.reduce((a, s) => a + s.studentCount, 0);
  const avgAct = rows.length ? rows.reduce((a, s) => a + s.sessionCount, 0) / rows.length : 0;

  const columns = [
    { key: 'name', header: 'School', render: (r) => <div><div className="cell-main">{r.name}</div><div className="cell-sub mono">{r.id}</div></div> },
    { key: 'location', header: 'Location' },
    { key: 'studentCount', header: 'Students', render: (r) => <span className="mono">{r.studentCount}</span> },
    { key: 'teacherCount', header: 'Teachers', render: (r) => <span className="mono">{r.teacherCount}</span> },
    { key: 'sessionCount', header: 'Game sessions', render: (r) => <span className="mono">{fmtInt(r.sessionCount)}</span> },
    { key: 'status', header: 'Access status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'registeredAt', header: 'Registered', className: 'nowrap', render: (r) => fmtDate(r.registeredAt) },
    { key: 'actions', header: <span className="sr-only">Actions</span>, sortable: false, render: (r) => (
      <Menu label={`Actions for ${r.name}`} trigger={({ label }) => <IconButton icon={MoreHorizontal} label={label} />}
        items={[{ label: 'View details', icon: Eye, onClick: () => nav(`/admin/schools/${r.id}`) }, edit && { label: 'Edit school', icon: Pencil, onClick: () => setForm({ open: true, school: r }) }]} />) },
  ];
  const exportCols = [
    { header: 'School ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Location', key: 'location' }, { header: 'Students', key: 'studentCount' },
    { header: 'Teachers', key: 'teacherCount' }, { header: 'Game sessions', key: 'sessionCount' }, { header: 'Status', key: 'status' }, { header: 'Registered', value: (r) => r.registeredAt.slice(0, 10) },
  ];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Schools & Centres" description="Preschools and learning centres using KALQY, with enrolment and activity at a glance."
        actions={<><DemoBadge label="SAMPLE DATA" />
          <ExportButton filename="kalqy-schools" columns={exportCols} rows={rows} preamble={[['Report', 'Schools (sample data)'], ['Filters', `search="${q}" state=${state} status=${status}`]]} />
          {edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, school: null })}>Add school</Button>}</>} />
      <div className="grid grid-stats">
        <StatTile label="Registered schools" value={rows.length} icon={School} />
        <StatTile label="Active schools" value={rows.filter((r) => r.status === 'Active').length} icon={CheckCircle2} tone="mint" />
        <StatTile label="Enrolled students (sample)" value={enrolled} icon={GraduationCap} tone="yellow" />
        <StatTile label="Avg sessions per school" value={Math.round(avgAct)} icon={Activity} tone="coral" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search school, ID or city" />
          <Select aria-label="Filter by state" value={state} onChange={(e) => setState(e.target.value)}><option value="all">All locations</option>{states.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option>Active</option><option>Trial</option><option>Pending</option><option>Expired</option></Select>
        </div>
        <DataTable label="Schools" columns={columns} rows={rows} loading={loading} pageSize={8} onRowClick={(r) => nav(`/admin/schools/${r.id}`)}
          empty={<EmptyState kind="leaf" title={schools.length ? 'No schools match' : 'No schools yet'} text={schools.length ? 'Adjust your search or filters.' : 'Add a sample school to get started.'} />} />
      </Card>
      <SchoolFormModal open={form.open} school={form.school} onClose={() => setForm({ open: false, school: null })} />
    </div>
  );
}
