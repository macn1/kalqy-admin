import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ComposedChart } from 'recharts';
import { GraduationCap, School, FileBarChart, Inbox, Sparkles, Gamepad2, CheckCircle2, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DataTable from '../components/DataTable.jsx';
import SessionDrawer from '../components/SessionDrawer.jsx';
import { ChartBox, ChartTip, Legend, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Card, Skeleton, ProgressBar, SearchBox, Select, StatusBadge, EmptyState, ErrorState, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { KPI_BASE, RANGE_FLOW_FACTOR, LEARNING_AREAS } from '../../data/dashboardData.js';
import { resolveRange, rangeLabel } from '../utils/dateRange.js';
import { filterSessions, dailySeries, compressSeries, byGame, sparkline, developmentByArea } from '../utils/analytics.js';
import { byId, fullName, fmtDate, relTime, fmtInt } from '../utils/format.js';

const ACT_ICON = { session: [Gamepad2, 'blue'], school: [School, 'mint'], report: [FileBarChart, 'yellow'], lead: [Inbox, 'coral'], content: [Sparkles, 'blue'] };
const SPARK_KEY = { students: 'students', schools: 'students', sessions: 'sessions', progress: 'sessions', minutes: 'sessions', demos: 'students' };
const KPI_COLOR = ['#39A9F9', '#3FB27F', '#39A9F9', '#E9B21A', '#8A7BE0', '#FF8C78'];

const dev = (v) => (v >= 80 ? { label: 'Strong', Icon: CheckCircle2, color: 'var(--mint-ink)' } : v >= 70 ? { label: 'Steady', Icon: TrendingUp, color: 'var(--blue-ink)' } : { label: 'Needs focus', Icon: AlertCircle, color: 'var(--coral-ink)' });

export default function Dashboard() {
  const { settings } = useAdmin();
  const { loading, error, data, reload } = useDemoData('sessions', 'students', 'schools', 'games', 'teachers', 'activity');
  const [rangeVal, setRangeVal] = useState({ preset: '30d' });
  const [q, setQ] = useState('');
  const [fGame, setFGame] = useState('all');
  const [fSchool, setFSchool] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const anim = useChartAnim();

  const range = useMemo(() => resolveRange(rangeVal), [rangeVal]);
  const { sessions = [], students = [], schools = [], games = [], teachers = [], activity = [] } = data;
  const sMap = useMemo(() => byId(students), [students]);
  const scMap = useMemo(() => byId(schools), [schools]);
  const gMap = useMemo(() => byId(games), [games]);

  const inRangeSessions = useMemo(() => filterSessions(sessions, { range }), [sessions, range]);
  const series = useMemo(() => compressSeries(dailySeries(sessions, range)), [sessions, range]);
  const popularity = useMemo(() => byGame(inRangeSessions, games), [inRangeSessions, games]);
  const devAreas = useMemo(() => developmentByArea(inRangeSessions, games, LEARNING_AREAS), [inRangeSessions, games]);
  const factor = rangeVal.preset === 'custom' ? range.days / 30 : RANGE_FLOW_FACTOR[rangeVal.preset] ?? 1;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...inRangeSessions].reverse().filter((s) =>
      (fGame === 'all' || s.gameId === fGame) && (fSchool === 'all' || s.schoolId === fSchool) && (fStatus === 'all' || s.completion === fStatus) &&
      (!t || `${fullName(sMap[s.studentId])} ${s.id}`.toLowerCase().includes(t)));
  }, [inRangeSessions, q, fGame, fSchool, fStatus, sMap]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const columns = [
    { key: 'student', header: 'Student', sortValue: (r) => fullName(sMap[r.studentId]), render: (r) => <div><div className="cell-main">{fullName(sMap[r.studentId])}</div><div className="cell-sub">{r.id}</div></div> },
    { key: 'school', header: 'School', sortValue: (r) => scMap[r.schoolId]?.name, render: (r) => scMap[r.schoolId]?.name },
    { key: 'game', header: 'Game', sortValue: (r) => gMap[r.gameId]?.name, render: (r) => <span className="row"><i className="sw" style={{ background: gMap[r.gameId]?.color }} />{gMap[r.gameId]?.name}</span> },
    { key: 'category', header: 'Learning category', render: (r) => r.category },
    { key: 'durationMin', header: 'Duration', render: (r) => <span className="mono">{r.durationMin} min</span> },
    { key: 'score', header: 'Score', render: (r) => <span className="mono">{r.score}</span> },
    { key: 'completion', header: 'Completion', render: (r) => <StatusBadge status={r.completion} /> },
    { key: 'startedAt', header: 'Date', className: 'nowrap', render: (r) => fmtDate(r.startedAt) },
  ];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;

  return (
    <div className="page">
      <PageHeader title={`${greet}, ${settings.profile.name}!`} description="Here's what's happening across your KALQY learning ecosystem."
        actions={<><DemoBadge label="DEMONSTRATION DATA" /><DateRangePicker value={rangeVal} onChange={setRangeVal} /></>} />

      <div className="grid grid-kpi" aria-label="Key performance indicators">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={158} style={{ borderRadius: 18 }} />)
          : KPI_BASE.map(({ id: kid, ...k }, i) => {
            const value = k.scale === 'flow' ? k.value * factor : k.value;
            return <KpiCard key={kid} {...k} value={value} color={KPI_COLOR[i]} spark={sparkline(sessions, range, SPARK_KEY[kid])} />;
          })}
      </div>
      <p className="note">Demonstration data: KPI totals are fictional ecosystem-level figures for “{rangeLabel(rangeVal)}”. Charts and tables below are drawn from {fmtInt(sessions.length)} sample session records.</p>

      <div className="grid grid-2 mt">
        <Card title="Learning activity" subtitle={`Daily game sessions and active students · ${rangeLabel(rangeVal)}`}
          action={<Legend items={[{ label: 'Sessions', color: '#39A9F9' }, { label: 'Active students', color: '#FF8C78' }, { label: 'Previous period', color: '#5B6B8C', dashed: true }]} />}>
          {loading ? <Skeleton h={300} /> : series.every((s) => !s.sessions) ? <EmptyState kind="egg" title="No sessions in this range" text="Try a wider date range." /> : (
            <ChartBox label="Area chart of daily game sessions and active students compared with the previous period">
              <ResponsiveContainer>
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs><linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39A9F9" stopOpacity={0.35} /><stop offset="100%" stopColor="#39A9F9" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="date" {...axisProps} minTickGap={28} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <RTooltip content={<ChartTip />} cursor={{ stroke: '#39A9F9', strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="prevSessions" name="Previous period" stroke="#5B6B8C" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={anim} />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#39A9F9" strokeWidth={2.5} fill="url(#actFill)" isAnimationActive={anim} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="students" name="Active students" stroke="#FF8C78" strokeWidth={2} dot={false} isAnimationActive={anim} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          )}
        </Card>

        <Card title="Game popularity" subtitle="Sessions by game in the selected range">
          {loading ? <Skeleton h={300} /> : !inRangeSessions.length ? <EmptyState kind="marble" title="No game sessions yet" /> : (
            <div className="stack" style={{ gap: 14 }}>
              {popularity.map((g) => (
                <div key={g.id}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <span className="row" style={{ fontWeight: 600 }}><i className="sw" style={{ background: g.color }} />{g.name}</span>
                    <span className="mono muted">{fmtInt(g.sessions)} · {g.pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={g.pct * 100 / (popularity[0].pct || 1)} color={g.color} label={`${g.name} share of sessions`} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-2 mt">
        <Card title="Learning development" subtitle="Average session score by development area">
          {loading ? <Skeleton h={220} /> : devAreas.map((a) => {
            const d = dev(a.value);
            return (
              <div className="dev-row" key={a.key}>
                <div className="hd"><span><i className="sw" style={{ background: a.color }} />{a.key}</span>
                  <span className="mono row" style={{ color: d.color, gap: 6 }}><d.Icon size={15} aria-hidden />{a.value}% · {d.label}</span></div>
                <ProgressBar value={a.value} color={a.color} label={`${a.key} ${a.value}%`} />
              </div>
            );
          })}
          <p className="note">Illustrative metrics derived from sample game scores. They are not scientifically validated measurements or clinical assessments.</p>
        </Card>

        <Card title="Recent activity" subtitle="Latest events across the ecosystem (sample)">
          {loading ? <Skeleton h={220} /> : !activity.length ? <EmptyState title="No recent activity" /> : (
            <ul className="feed">
              {activity.map((a) => {
                const [Icon, tone] = ACT_ICON[a.type] || ACT_ICON.session;
                return (
                  <li key={a.id}>
                    <span className={`ico tone-${tone}`}><Icon size={17} aria-hidden /></span>
                    <div style={{ minWidth: 0 }}><div>{a.text}</div><div className="faint" style={{ fontSize: 12 }}>{relTime(a.at)}</div></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt" title="Recent sessions" subtitle="Select a row to open session details" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search student or session ID" />
          <Select aria-label="Filter by game" value={fGame} onChange={(e) => setFGame(e.target.value)}>
            <option value="all">All games</option>{games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select aria-label="Filter by school" value={fSchool} onChange={(e) => setFSchool(e.target.value)}>
            <option value="all">All schools</option>{schools.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select aria-label="Filter by completion" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">All statuses</option><option>Completed</option><option>Partial</option><option>Abandoned</option>
          </Select>
        </div>
        <DataTable label="Recent sessions" columns={columns} rows={rows} loading={loading} pageSize={8} onRowClick={setSelected} initialSort={{ key: 'startedAt', dir: 'desc' }}
          empty={<EmptyState kind="egg" title="No sessions match" text="Adjust the search, filters or date range." />} />
      </Card>

      <SessionDrawer session={selected} students={students} schools={schools} games={games} teachers={teachers} onClose={() => setSelected(null)} />
    </div>
  );
}
