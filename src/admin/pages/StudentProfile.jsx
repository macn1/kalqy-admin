import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts';
import { Pencil, Trophy, Star, Flame, Target, Medal, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StudentFormModal from '../components/StudentFormModal.jsx';
import SessionDrawer from '../components/SessionDrawer.jsx';
import { ChartBox, ChartTip, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Avatar, Badge, Button, Card, EmptyState, ProgressBar, Skeleton, StatusBadge, Tabs, ErrorState } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { byId, fullName, fmtDate, fmtDateTime, avg, relTime } from '../utils/format.js';
import { avgScore, completionRate } from '../utils/analytics.js';
import { DAY } from '../../data/seedUtils.js';
import { GAME_CATEGORIES } from '../../data/gamesData.js';

const CAT_COLOR = { Mathematics: '#E9B21A', 'English & Language': '#39A9F9', Science: '#3FB27F', 'Colours & Matching': '#FF8C78' };

function achievements(list) {
  const done = list.filter((s) => s.completion === 'Completed').length;
  const days = new Set(list.map((s) => s.startedAt.slice(0, 10))).size;
  return [
    { icon: Star, label: 'First session', earned: list.length >= 1, hint: 'Play any game once' },
    { icon: Flame, label: '10 sessions', earned: list.length >= 10, hint: `${Math.min(list.length, 10)}/10 sessions` },
    { icon: Trophy, label: 'High scorer', earned: list.some((s) => s.score >= 90), hint: 'Score 90 or more' },
    { icon: Target, label: 'Finisher', earned: done >= 15, hint: `${Math.min(done, 15)}/15 completed` },
    { icon: Medal, label: 'Regular player', earned: days >= 12, hint: `${Math.min(days, 12)}/12 active days` },
  ];
}

export default function StudentProfile() {
  const { id } = useParams();
  const { canEdit } = useAdmin();
  const { loading, error, reload, data } = useDemoData('students', 'schools', 'teachers', 'parents', 'games', 'sessions');
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const anim = useChartAnim();
  const { students = [], schools = [], teachers = [], parents = [], games = [], sessions = [] } = data;
  const student = students.find((s) => s.id === id);
  const mine = useMemo(() => sessions.filter((s) => s.studentId === id).sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [sessions, id]);
  const gMap = useMemo(() => byId(games), [games]);

  const weekly = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      const list = mine.filter((s) => { const t = new Date(s.startedAt).getTime(); return t > start && t <= end + (i === 7 ? DAY : 0); });
      return { week: new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sessions: list.length, minutes: list.reduce((a, s) => a + s.durationMin, 0) };
    });
  }, [mine]);

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading) return <div className="page"><Skeleton h={30} w={240} /><div style={{ height: 16 }} /><Skeleton h={360} /></div>;
  if (!student) return <div className="page"><Card><EmptyState kind="egg" title="Student not found" text="This sample record may have been removed or the demo data was cleared." action={<Link to="/admin/students"><Button icon={ArrowLeft}>Back to students</Button></Link>} /></Card></div>;

  const name = fullName(student);
  const school = schools.find((s) => s.id === student.schoolId);
  const teacher = teachers.find((t) => t.id === student.teacherId);
  const parent = parents.find((p) => p.id === student.parentId);
  const cats = GAME_CATEGORIES.map((c) => {
    const l = mine.filter((s) => s.category === c);
    return { name: c, value: l.length ? Math.round(avgScore(l)) : 0, n: l.length };
  });

  const histCols = [
    { key: 'id', header: 'Session', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'game', header: 'Game', sortValue: (r) => gMap[r.gameId]?.name, render: (r) => gMap[r.gameId]?.name },
    { key: 'category', header: 'Category' },
    { key: 'durationMin', header: 'Duration', render: (r) => `${r.durationMin} min` },
    { key: 'score', header: 'Score' },
    { key: 'completion', header: 'Status', render: (r) => <StatusBadge status={r.completion} /> },
    { key: 'startedAt', header: 'Started', render: (r) => fmtDateTime(r.startedAt) },
  ];

  return (
    <div className="page">
      <PageHeader title={name} description={`${student.id} · Sample student profile`}
        crumbs={[{ label: 'Students', to: '/admin/students' }, { label: name, to: '#' }]}
        actions={canEdit('students') && <Button icon={Pencil} onClick={() => setEditing(true)}>Edit sample record</Button>} />

      <div className="grid grid-2">
        <Card>
          <div className="row" style={{ gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} size="lg" />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="row wrap"><h2 style={{ fontSize: 22 }}>{name}</h2><StatusBadge status={student.archived ? 'Archived' : student.status} /></div>
              <dl className="kv mt" style={{ marginTop: 14 }}>
                <dt>Age</dt><dd>{student.age} years</dd>
                <dt>School / centre</dt><dd>{school ? <Link to={`/admin/schools/${school.id}`}>{school.name}</Link> : '—'}</dd>
                <dt>Teacher</dt><dd>{teacher?.name || '—'}</dd>
                <dt>Guardian</dt><dd>{parent ? `${parent.name} (${parent.id})` : '—'}</dd>
                <dt>Registered</dt><dd>{fmtDate(student.registeredAt)}</dd>
                <dt>Sessions played</dt><dd>{mine.length}{mine[0] ? ` · last ${relTime(mine[0].startedAt)}` : ''}</dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card title="Assigned games" subtitle="Games available to this student">
          <div className="row wrap">{student.assignedGameIds.length ? student.assignedGameIds.map((g) => <Badge key={g} tone="blue" plain>{gMap[g]?.name || g}</Badge>) : <span className="muted">None assigned</span>}</div>
          <h4 style={{ margin: '18px 0 8px', fontSize: 14 }}>Achievements</h4>
          <div className="row wrap">
            {achievements(mine).map(({ icon: Icon, label, earned, hint }) => (
              <span key={label} className={`chip ${earned ? 'on' : ''}`} title={earned ? 'Earned' : `Locked: ${hint}`} style={earned ? {} : { opacity: 0.6 }}>
                <Icon size={14} aria-hidden />{label}{!earned && <span className="sr-only"> (locked)</span>}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt"><Tabs label="Profile sections" value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'progress', label: 'Learning progress' }, { value: 'history', label: `Session history (${mine.length})` }]} /></div>

      {tab === 'overview' && (
        <div className="grid grid-2 mt">
          <Card title="Weekly activity" subtitle="Sessions per week · last 8 weeks">
            <ChartBox label="Bar chart of sessions per week for the last eight weeks">
              <ResponsiveContainer><BarChart data={weekly} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="week" {...axisProps} /><YAxis {...axisProps} allowDecimals={false} />
                <RTooltip content={<ChartTip />} cursor={{ fill: 'var(--hover)' }} />
                <Bar dataKey="sessions" name="Sessions" fill="#39A9F9" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={anim} />
              </BarChart></ResponsiveContainer>
            </ChartBox>
          </Card>
          <div className="stack">
            <Card title="Strengths"><div className="row wrap">{student.strengths.length ? student.strengths.map((s) => <Badge key={s} tone="mint" plain>{s}</Badge>) : <span className="muted">Not enough data yet</span>}</div></Card>
            <Card title="Areas to practise"><div className="row wrap">{student.practise.length ? student.practise.map((s) => <Badge key={s} tone="yellow" plain>{s}</Badge>) : <span className="muted">Not enough data yet</span>}</div></Card>
            <Card title="Recent sessions" flush>
              {mine.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => setSelected(s)} className="row between" style={{ width: '100%', padding: '12px 20px', border: 0, borderTop: '1px solid var(--border)', background: 'transparent', textAlign: 'left' }}>
                  <span><b>{gMap[s.gameId]?.name}</b><div className="cell-sub">{relTime(s.startedAt)} · {s.durationMin} min</div></span><StatusBadge status={s.completion} />
                </button>
              ))}
              {!mine.length && <EmptyState kind="egg" title="No sessions yet" />}
            </Card>
          </div>
        </div>
      )}

      {tab === 'progress' && (
        <Card className="mt" title="Learning progress by category" subtitle="Average session score · illustrative sample metric">
          {cats.map((c) => (
            <div className="dev-row" key={c.name}>
              <div className="hd"><span><i className="sw" style={{ background: CAT_COLOR[c.name] }} />{c.name}</span><span className="mono">{c.n ? `${c.value}% · ${c.n} sessions` : 'No sessions'}</span></div>
              <ProgressBar value={c.value} color={CAT_COLOR[c.name]} label={`${c.name} ${c.value}%`} />
            </div>
          ))}
          <p className="note">Overall: {Math.round(avgScore(mine))}% average score · {Math.round(completionRate(mine))}% completion. Not a validated educational assessment.</p>
        </Card>
      )}

      {tab === 'history' && (
        <Card className="mt" flush>
          <DataTable label="Session history" columns={histCols} rows={mine} onRowClick={setSelected} initialSort={{ key: 'startedAt', dir: 'desc' }} empty={<EmptyState kind="egg" title="No sessions yet" />} />
        </Card>
      )}

      <StudentFormModal open={editing} student={student} schools={schools} teachers={teachers} parents={parents} onClose={() => setEditing(false)} />
      <SessionDrawer session={selected} students={students} schools={schools} games={games} teachers={teachers} onClose={() => setSelected(null)} />
    </div>
  );
}
