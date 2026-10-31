import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, LineChart, Line } from 'recharts';
import { Activity, CheckCircle2, Timer, Star } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { ChartBox, ChartTip, Legend, SERIES, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Card, EmptyState, ErrorState, ProgressBar, Select, Skeleton, StatTile, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { resolveRange, rangeLabel } from '../utils/dateRange.js';
import { filterSessions, dailySeries, compressSeries, byGame, byCategory, bySchool, weekdayEngagement, engagementDistribution, completionRate, avgDuration, avgScore } from '../utils/analytics.js';
import { fmtInt } from '../utils/format.js';
import { LEARNING_AREAS } from '../../data/dashboardData.js';
import { GAME_CATEGORIES } from '../../data/gamesData.js';

const CAT_COLORS = { Mathematics: '#E9B21A', 'English & Language': '#39A9F9', Science: '#3FB27F', 'Colours & Matching': '#FF8C78' };
const pctFmt = (v) => `${Number(v).toFixed(1)}%`;

function Chart({ state, label, children, h }) {
  if (state.loading) return <Skeleton h={h || 260} />;
  if (state.none) return <EmptyState kind="egg" title="No data for these filters" text="Widen the date range or clear a filter." />;
  return <ChartBox label={label} height={h}>{children}</ChartBox>;
}

function weeklyScore(list, range) {
  const size = Math.max(1, Math.ceil(range.days / 8));
  const buckets = new Map();
  list.forEach((s) => {
    const i = Math.floor((new Date(s.startedAt).getTime() - range.from.getTime()) / 86400000 / size);
    const b = buckets.get(i) || { sum: 0, n: 0, label: new Date(range.from.getTime() + i * size * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
    b.sum += s.score; b.n += 1; buckets.set(i, b);
  });
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => ({ label: b.label, score: Math.round(b.sum / b.n) }));
}

export default function LearningAnalytics() {
  const anim = useChartAnim();
  const { loading, error, reload, data } = useDemoData('sessions', 'students', 'schools', 'games');
  const { sessions = [], students = [], schools = [], games = [] } = data;
  const [rangeVal, setRangeVal] = useState({ preset: '30d' });
  const [school, setSchool] = useState('all');
  const [category, setCategory] = useState('all');
  const range = useMemo(() => resolveRange(rangeVal), [rangeVal]);

  // School and category filters apply to every section; the school comparison ignores the school filter so it stays comparable.
  const list = useMemo(() => filterSessions(sessions, { range, schoolId: school, category }), [sessions, range, school, category]);
  const forSchools = useMemo(() => filterSessions(sessions, { range, category }), [sessions, range, category]);
  const series = useMemo(() => compressSeries(dailySeries(filterSessions(sessions, { schoolId: school, category }), range)), [sessions, school, category, range]);
  const popularity = useMemo(() => byGame(list, games.filter((g) => category === 'all' || g.category === category)), [list, games, category]);
  const cats = useMemo(() => byCategory(list), [list]);
  const schoolRows = useMemo(() => bySchool(forSchools, schools).filter((s) => s.sessions > 0).slice(0, 8), [forSchools, schools]);
  const weekdays = useMemo(() => weekdayEngagement(list), [list]);
  const dist = useMemo(() => engagementDistribution(list, students.filter((s) => school === 'all' || s.schoolId === school)), [list, students, school]);
  const gameArea = useMemo(() => Object.fromEntries(games.map((g) => [g.id, g.devArea])), [games]);
  const areas = useMemo(() => LEARNING_AREAS.map((a) => {
    const l = list.filter((s) => gameArea[s.gameId] === a.key);
    return { ...a, n: l.length, value: l.length ? Math.round(avgScore(l)) : 0, trend: weeklyScore(l, range), games: [...new Set(l.map((s) => games.find((g) => g.id === s.gameId)?.name))].filter(Boolean) };
  }), [list, gameArea, games, range]);

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  const none = !loading && !list.length;
  const state = { loading, none };

  return (
    <div className="page">
      <PageHeader title="Learning Analytics" description="Explore engagement, completion and learning-area indicators. Filters update every chart."
        actions={<><DemoBadge label="ILLUSTRATIVE DATA" /><DateRangePicker value={rangeVal} onChange={setRangeVal} />
          <Select aria-label="School" style={{ width: 'auto', height: 38 }} value={school} onChange={(e) => setSchool(e.target.value)}><option value="all">All schools</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select aria-label="Learning category" style={{ width: 'auto', height: 38 }} value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{GAME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></>} />
      <div className="grid grid-stats">
        <StatTile label="Sessions" value={fmtInt(list.length)} icon={Activity} />
        <StatTile label="Completion rate" value={pctFmt(completionRate(list))} icon={CheckCircle2} tone="mint" />
        <StatTile label="Avg session duration" value={`${avgDuration(list).toFixed(1)} min`} icon={Timer} tone="yellow" />
        <StatTile label="Avg score" value={Math.round(avgScore(list))} icon={Star} tone="coral" />
      </div>
      <p className="note">{rangeLabel(rangeVal)} · computed from {fmtInt(list.length)} sample sessions. Illustrative data, not validated educational research.</p>

      <div className="grid grid-2 mt">
        <Card title="Learning activity over time" subtitle="Daily sessions and active students" action={<Legend items={[{ label: 'Sessions', color: SERIES[0] }, { label: 'Active students', color: SERIES[1] }]} />}>
          <Chart state={state} label="Line chart of sessions and active students over time">
            <ResponsiveContainer><AreaChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="date" {...axisProps} minTickGap={28} /><YAxis {...axisProps} allowDecimals={false} />
              <RTooltip content={<ChartTip />} />
              <Area dataKey="sessions" name="Sessions" stroke={SERIES[0]} strokeWidth={2.5} fill={SERIES[0]} fillOpacity={0.14} isAnimationActive={anim} />
              <Area dataKey="students" name="Active students" stroke={SERIES[1]} strokeWidth={2} fill="none" isAnimationActive={anim} />
            </AreaChart></ResponsiveContainer>
          </Chart>
        </Card>
        <Card title="Game popularity" subtitle="Sessions and share of total">
          <Chart state={state} label="Horizontal bar chart of sessions per game">
            <ResponsiveContainer><BarChart data={popularity} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} /><XAxis type="number" {...axisProps} allowDecimals={false} /><YAxis type="category" dataKey="name" {...axisProps} width={104} />
              <RTooltip content={<ChartTip valueFmt={(v, p) => `${fmtInt(v)} (${p.payload.pct.toFixed(1)}%)`} />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="sessions" name="Sessions" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={anim} label={{ position: 'right', fill: 'var(--text-2)', fontSize: 11.5, formatter: (v) => fmtInt(v) }}>
                {popularity.map((g) => <Cell key={g.id} fill={g.color} />)}
              </Bar>
            </BarChart></ResponsiveContainer>
          </Chart>
        </Card>
      </div>

      <div className="grid grid-3 mt">
        <Card title="Session completion rate" subtitle="Share of sessions completed, by game">
          {loading ? <Skeleton h={220} /> : popularity.filter((g) => g.sessions).map((g) => (
            <div key={g.id} className="dev-row"><div className="hd"><span><i className="sw" style={{ background: g.color }} />{g.name}</span><span className="mono">{g.completion.toFixed(0)}%</span></div><ProgressBar value={g.completion} color={g.color} label={`${g.name} completion`} /></div>
          ))}
          {!loading && none && <EmptyState title="No data" />}
        </Card>
        <Card title="Average session duration" subtitle="Minutes per session, by game">
          <Chart state={state} label="Bar chart of average session duration per game" h={260}>
            <ResponsiveContainer><BarChart data={popularity.filter((g) => g.sessions)} margin={{ top: 16, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="name" {...axisProps} interval={0} tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(' ')[0]} /><YAxis {...axisProps} />
              <RTooltip content={<ChartTip valueFmt={(v) => `${v.toFixed(1)} min`} />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="duration" name="Avg duration" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive={anim} label={{ position: 'top', fill: 'var(--text-2)', fontSize: 11, formatter: (v) => v.toFixed(0) }}>
                {popularity.filter((g) => g.sessions).map((g) => <Cell key={g.id} fill={g.color} />)}
              </Bar>
            </BarChart></ResponsiveContainer>
          </Chart>
        </Card>
        <Card title="Weekly engagement" subtitle="Sessions by day of week">
          <Chart state={state} label="Bar chart of sessions by weekday" h={260}>
            <ResponsiveContainer><BarChart data={weekdays} margin={{ top: 16, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} allowDecimals={false} />
              <RTooltip content={<ChartTip />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="sessions" name="Sessions" fill={SERIES[0]} radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={anim} label={{ position: 'top', fill: 'var(--text-2)', fontSize: 11 }} />
            </BarChart></ResponsiveContainer>
          </Chart>
        </Card>
      </div>

      <div className="grid grid-even mt">
        <Card title="Learning category distribution" subtitle="Share of sessions by category">
          {loading ? <Skeleton h={260} /> : none ? <EmptyState title="No data" /> : (
            <div className="row wrap" style={{ gap: 20, justifyContent: 'center' }}>
              <ChartBox label="Donut chart of sessions by learning category" height={220}>
                <ResponsiveContainer><PieChart>
                  <Pie data={cats} dataKey="sessions" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2} isAnimationActive={anim}>
                    {cats.map((c) => <Cell key={c.name} fill={CAT_COLORS[c.name] || SERIES[5]} />)}
                  </Pie>
                  <RTooltip content={<ChartTip valueFmt={(v, p) => `${fmtInt(v)} (${p.payload.pct.toFixed(1)}%)`} />} />
                </PieChart></ResponsiveContainer>
              </ChartBox>
              <ul className="feed" style={{ minWidth: 200, flex: 1 }}>
                {cats.map((c) => <li key={c.name} style={{ padding: '8px 0' }}><i className="sw" style={{ background: CAT_COLORS[c.name], marginTop: 6 }} /><span style={{ flex: 1 }}>{c.name}</span><b className="mono">{c.pct.toFixed(1)}%</b></li>)}
              </ul>
            </div>
          )}
        </Card>
        <Card title="Student engagement distribution" subtitle="Number of students by sessions played">
          <Chart state={state} label="Bar chart of students grouped by number of sessions played">
            <ResponsiveContainer><BarChart data={dist} margin={{ top: 16, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="label" {...axisProps} /><YAxis {...axisProps} allowDecimals={false} />
              <RTooltip content={<ChartTip />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="students" name="Students" fill={SERIES[3]} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={anim} label={{ position: 'top', fill: 'var(--text-2)', fontSize: 11 }} />
            </BarChart></ResponsiveContainer>
          </Chart>
        </Card>
      </div>

      <Card className="mt" title="School-wise comparison" subtitle="Sessions and completion rate for schools with activity (top 8)">
        <Chart state={state} label="Bar chart comparing sessions across schools" h={320}>
          <ResponsiveContainer><BarChart data={schoolRows} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={gridStroke} horizontal={false} /><XAxis type="number" {...axisProps} allowDecimals={false} /><YAxis type="category" dataKey="name" {...axisProps} width={170} tick={{ fontSize: 11.5 }} />
            <RTooltip content={<ChartTip valueFmt={(v, p) => p.dataKey === 'sessions' ? fmtInt(v) : pctFmt(v)} />} cursor={{ fill: 'var(--hover)' }} />
            <Bar dataKey="sessions" name="Sessions" fill={SERIES[0]} radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={anim} label={{ position: 'right', fill: 'var(--text-2)', fontSize: 11.5 }} />
          </BarChart></ResponsiveContainer>
        </Chart>
      </Card>

      <h2 style={{ fontSize: 18, margin: '28px 0 12px' }}>Learning development areas</h2>
      <div className="grid grid-even">
        {areas.map((a) => (
          <Card key={a.key} title={a.key} subtitle={a.n ? `${fmtInt(a.n)} sessions · ${a.games.join(', ')}` : 'No sessions in this selection'}
            action={<span className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{a.n ? `${a.value}%` : '—'}</span>}>
            <ProgressBar value={a.value} color={a.color} label={`${a.key} ${a.value}%`} />
            {loading ? <Skeleton h={90} style={{ marginTop: 12 }} /> : a.trend.length > 1 ? (
              <ChartBox label={`Score trend for ${a.key}`} height={110}>
                <ResponsiveContainer><LineChart data={a.trend} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="label" {...axisProps} minTickGap={24} tick={{ fontSize: 10 }} /><YAxis {...axisProps} domain={[40, 100]} tick={{ fontSize: 10 }} />
                  <RTooltip content={<ChartTip valueFmt={(v) => `${v}%`} />} /><Line dataKey="score" name="Avg score" stroke={a.color} strokeWidth={2.5} dot={{ r: 3, fill: a.color, stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={anim} />
                </LineChart></ResponsiveContainer>
              </ChartBox>
            ) : <p className="muted" style={{ marginTop: 12 }}>Not enough data for a trend.</p>}
          </Card>
        ))}
      </div>
      <p className="note">Development indicators are illustrative averages of sample game scores. They are not scientifically validated measurements or clinical assessments.</p>
    </div>
  );
}
