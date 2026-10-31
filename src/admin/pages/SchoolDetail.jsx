import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts';
import { Pencil, Users, ArrowLeft, GraduationCap, UserSquare2, Gamepad2, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import SchoolFormModal from '../components/SchoolFormModal.jsx';
import SessionDrawer from '../components/SessionDrawer.jsx';
import { Modal } from '../components/Overlay.jsx';
import { ChartBox, ChartTip, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Avatar, Button, Card, Checkbox, EmptyState, ErrorState, Skeleton, StatTile, StatusBadge, Tabs } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { updateRecord } from '../../services/demoDataService.js';
import { resolveRange } from '../utils/dateRange.js';
import { dailySeries, completionRate } from '../utils/analytics.js';
import { byId, fullName, fmtDate, fmtDateTime, relTime } from '../utils/format.js';

function ManageTeachers({ open, school, teachers, schools, onClose }) {
  const { toast } = useAdmin();
  const [sel, setSel] = useState(new Set());
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setSel(new Set(teachers.filter((t) => t.schoolId === school.id).map((t) => t.id))); }, [open, school, teachers]);
  const scMap = byId(schools);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const save = async () => {
    setSaving(true);
    try {
      for (const t of teachers) {
        const was = t.schoolId === school.id, now = sel.has(t.id);
        if (was !== now) await updateRecord('teachers', t.id, { schoolId: now ? school.id : '' });
      }
      toast('Assigned teachers updated');
      onClose();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Manage teachers · ${school.name}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>Save assignments</Button></>}>
      <p className="muted" style={{ marginBottom: 12 }}>Tick the teachers assigned to this school. Selecting a teacher from another school moves them here.</p>
      <div className="stack" style={{ gap: 4 }}>
        {teachers.map((t) => (
          <div key={t.id} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <Checkbox checked={sel.has(t.id)} onChange={() => toggle(t.id)} label={t.name} />
            <span className="faint" style={{ fontSize: 12 }}>{t.schoolId && t.schoolId !== school.id ? `at ${scMap[t.schoolId]?.name}` : t.schoolId ? '' : 'Unassigned'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function SchoolDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { canEdit } = useAdmin();
  const anim = useChartAnim();
  const { loading, error, reload, data } = useDemoData('schools', 'students', 'teachers', 'sessions', 'games');
  const { schools = [], students = [], teachers = [], sessions = [], games = [] } = data;
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState(null);
  const school = schools.find((s) => s.id === id);

  const mineSessions = useMemo(() => sessions.filter((s) => s.schoolId === id), [sessions, id]);
  const mineStudents = useMemo(() => students.filter((s) => s.schoolId === id && !s.archived), [students, id]);
  const mineTeachers = useMemo(() => teachers.filter((t) => t.schoolId === id), [teachers, id]);
  const series = useMemo(() => dailySeries(mineSessions, resolveRange({ preset: '30d' })), [mineSessions]);
  const dist = [3, 4, 5].map((a) => ({ age: `Age ${a}`, students: mineStudents.filter((s) => s.age === a).length }));
  const sMap = useMemo(() => byId(students), [students]);
  const gMap = useMemo(() => byId(games), [games]);

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading) return <div className="page"><Skeleton h={30} w={260} /><div style={{ height: 16 }} /><Skeleton h={360} /></div>;
  if (!school) return <div className="page"><Card><EmptyState kind="leaf" title="School not found" action={<Link to="/admin/schools"><Button icon={ArrowLeft}>Back to schools</Button></Link>} /></Card></div>;

  const sessionCols = [
    { key: 'id', header: 'Session', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'student', header: 'Student', render: (r) => fullName(sMap[r.studentId]) },
    { key: 'game', header: 'Game', render: (r) => gMap[r.gameId]?.name },
    { key: 'score', header: 'Score' },
    { key: 'completion', header: 'Status', render: (r) => <StatusBadge status={r.completion} /> },
    { key: 'startedAt', header: 'Started', render: (r) => fmtDateTime(r.startedAt) },
  ];
  const recent = [...mineSessions].reverse();

  return (
    <div className="page">
      <PageHeader title={school.name} description={`${school.id} · ${school.location} · Registered ${fmtDate(school.registeredAt)}`}
        crumbs={[{ label: 'Schools & Centres', to: '/admin/schools' }, { label: school.name, to: '#' }]}
        actions={canEdit('schools') && <><Button icon={Users} onClick={() => setManaging(true)}>Manage teachers</Button><Button icon={Pencil} onClick={() => setEditing(true)}>Edit school</Button></>} />
      <div className="grid grid-stats">
        <StatTile label="Enrolled students" value={mineStudents.length} icon={GraduationCap} />
        <StatTile label="Teachers" value={mineTeachers.length} icon={UserSquare2} tone="mint" />
        <StatTile label="Game sessions" value={mineSessions.length} icon={Gamepad2} tone="yellow" />
        <StatTile label="Completion rate" value={`${Math.round(completionRate(mineSessions))}%`} icon={CheckCircle2} tone="coral" />
      </div>
      <div className="mt"><Tabs label="School sections" value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'students', label: `Students (${mineStudents.length})` }, { value: 'teachers', label: `Teachers (${mineTeachers.length})` }]} /></div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-2 mt">
            <Card title="Activity" subtitle="Daily sessions · last 30 days">
              <ChartBox label="Area chart of daily sessions at this school">
                <ResponsiveContainer><AreaChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="date" {...axisProps} minTickGap={28} /><YAxis {...axisProps} allowDecimals={false} />
                  <RTooltip content={<ChartTip />} /><Area dataKey="sessions" name="Sessions" stroke="#39A9F9" strokeWidth={2.5} fill="#39A9F9" fillOpacity={0.15} isAnimationActive={anim} />
                </AreaChart></ResponsiveContainer>
              </ChartBox>
            </Card>
            <Card title="Student distribution" subtitle="Enrolled students by age">
              <ChartBox label="Bar chart of students by age">
                <ResponsiveContainer><BarChart data={dist} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="age" {...axisProps} /><YAxis {...axisProps} allowDecimals={false} />
                  <RTooltip content={<ChartTip />} cursor={{ fill: 'var(--hover)' }} /><Bar dataKey="students" name="Students" fill="#3FB27F" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={anim} />
                </BarChart></ResponsiveContainer>
              </ChartBox>
            </Card>
          </div>
          <Card className="mt" title="Recent sessions" flush>
            <DataTable label="Recent sessions" columns={sessionCols} rows={recent} pageSize={6} onRowClick={setSelected} empty={<EmptyState kind="egg" title="No sessions yet" />} />
          </Card>
        </>
      )}

      {tab === 'students' && (
        <Card className="mt" flush>
          <DataTable label="Enrolled students" rows={mineStudents.map((s) => ({ ...s, name: fullName(s) }))} onRowClick={(r) => nav(`/admin/students/${r.id}`)}
            columns={[
              { key: 'id', header: 'ID', render: (r) => <span className="mono">{r.id}</span> },
              { key: 'name', header: 'Student', render: (r) => <div className="row"><Avatar name={r.name} size="sm" />{r.name}</div> },
              { key: 'age', header: 'Age', render: (r) => `${r.age} yrs` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]} empty={<EmptyState title="No enrolled students" text="No sample students are assigned to this school." />} />
        </Card>
      )}

      {tab === 'teachers' && (
        <Card className="mt" flush>
          <DataTable label="Assigned teachers" rows={mineTeachers}
            columns={[
              { key: 'name', header: 'Teacher', render: (r) => <div className="row"><Avatar name={r.name} size="sm" />{r.name}</div> },
              { key: 'email', header: 'Email (fictional)' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'lastActive', header: 'Last active', render: (r) => relTime(r.lastActive) },
            ]} empty={<EmptyState title="No teachers assigned" text="Use “Manage teachers” to assign teachers." />} />
        </Card>
      )}

      <SchoolFormModal open={editing} school={school} onClose={() => setEditing(false)} />
      <ManageTeachers open={managing} school={school} teachers={teachers} schools={schools} onClose={() => setManaging(false)} />
      <SessionDrawer session={selected} students={students} schools={schools} games={games} teachers={teachers} onClose={() => setSelected(null)} />
    </div>
  );
}
