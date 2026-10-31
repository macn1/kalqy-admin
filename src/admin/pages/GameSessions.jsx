import React, { useMemo, useState } from 'react';
import { PlayCircle, CheckCircle2, Timer, Star } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import SessionDrawer from '../components/SessionDrawer.jsx';
import { Card, EmptyState, ErrorState, SearchBox, Select, StatTile, StatusBadge, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { resolveRange, rangeLabel } from '../utils/dateRange.js';
import { filterSessions, avgDuration, avgScore } from '../utils/analytics.js';
import { byId, fullName, fmtDateTime, fmtInt } from '../utils/format.js';

export default function GameSessions() {
  const { loading, error, reload, data } = useDemoData('sessions', 'students', 'schools', 'games', 'teachers');
  const { sessions = [], students = [], schools = [], games = [], teachers = [] } = data;
  const [rangeVal, setRangeVal] = useState({ preset: '30d' });
  const [q, setQ] = useState('');
  const [student, setStudent] = useState('all');
  const [school, setSchool] = useState('all');
  const [game, setGame] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const range = useMemo(() => resolveRange(rangeVal), [rangeVal]);
  const sMap = useMemo(() => byId(students), [students]);
  const scMap = useMemo(() => byId(schools), [schools]);
  const gMap = useMemo(() => byId(games), [games]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return filterSessions(sessions, { range, schoolId: school, gameId: game, studentId: student, completion: status })
      .filter((s) => !t || `${s.id} ${fullName(sMap[s.studentId])}`.toLowerCase().includes(t)).reverse();
  }, [sessions, range, school, game, student, status, q, sMap]);

  const columns = [
    { key: 'id', header: 'Session ID', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'student', header: 'Student', sortValue: (r) => fullName(sMap[r.studentId]), render: (r) => fullName(sMap[r.studentId]) },
    { key: 'school', header: 'School', sortValue: (r) => scMap[r.schoolId]?.name, render: (r) => scMap[r.schoolId]?.name },
    { key: 'game', header: 'Game', sortValue: (r) => gMap[r.gameId]?.name, render: (r) => <span className="row"><i className="sw" style={{ background: gMap[r.gameId]?.color }} />{gMap[r.gameId]?.name}</span> },
    { key: 'category', header: 'Category' },
    { key: 'durationMin', header: 'Duration', render: (r) => <span className="mono">{r.durationMin} min</span> },
    { key: 'score', header: 'Score', render: (r) => <span className="mono">{r.score}</span> },
    { key: 'completion', header: 'Completion', render: (r) => <StatusBadge status={r.completion} /> },
    { key: 'startedAt', header: 'Started at', className: 'nowrap', render: (r) => fmtDateTime(r.startedAt) },
  ];
  const exportCols = [
    { header: 'Session ID', key: 'id' }, { header: 'Student', value: (r) => fullName(sMap[r.studentId]) }, { header: 'School', value: (r) => scMap[r.schoolId]?.name },
    { header: 'Game', value: (r) => gMap[r.gameId]?.name }, { header: 'Category', key: 'category' }, { header: 'Duration (min)', key: 'durationMin' },
    { header: 'Score', key: 'score' }, { header: 'Completion', key: 'completion' }, { header: 'Started at', key: 'startedAt' },
  ];
  const completed = rows.filter((r) => r.completion === 'Completed').length;

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Game Sessions" description="Every sample play session, filterable by student, school, game and completion."
        actions={<><DemoBadge label="SAMPLE DATA" /><DateRangePicker value={rangeVal} onChange={setRangeVal} />
          <ExportButton filename="kalqy-sessions" columns={exportCols} rows={rows} preamble={[['Report', 'Game sessions (sample data)'], ['Date range', rangeLabel(rangeVal)], ['Filters', `search="${q}" student=${student} school=${school} game=${game} status=${status}`]]} /></>} />
      <div className="grid grid-stats">
        <StatTile label="Sessions" value={fmtInt(rows.length)} icon={PlayCircle} />
        <StatTile label="Completed" value={fmtInt(completed)} icon={CheckCircle2} tone="mint" />
        <StatTile label="Avg duration" value={`${avgDuration(rows).toFixed(1)} min`} icon={Timer} tone="yellow" />
        <StatTile label="Avg score" value={Math.round(avgScore(rows))} icon={Star} tone="coral" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search session ID or student" />
          <Select aria-label="Filter by student" value={student} onChange={(e) => setStudent(e.target.value)}><option value="all">All students</option>{students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}</Select>
          <Select aria-label="Filter by school" value={school} onChange={(e) => setSchool(e.target.value)}><option value="all">All schools</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Filter by game" value={game} onChange={(e) => setGame(e.target.value)}><option value="all">All games</option>{games.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Filter by completion" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option>Completed</option><option>Partial</option><option>Abandoned</option></Select>
        </div>
        <DataTable label="Game sessions" columns={columns} rows={rows} loading={loading} pageSize={12} onRowClick={setSelected}
          empty={<EmptyState kind="egg" title="No sessions found" text="Try a wider date range or clear some filters." />} />
      </Card>
      <SessionDrawer session={selected} students={students} schools={schools} games={games} teachers={teachers} onClose={() => setSelected(null)} />
    </div>
  );
}
