import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts';
import { Download, Monitor, Laptop, Cpu } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import { ChartBox, ChartTip, Legend, SERIES, axisProps, gridStroke, useChartAnim } from '../components/Charts.jsx';
import { Badge, Card, EmptyState, ErrorState, Skeleton, StatTile, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { PLATFORMS } from '../../data/analyticsData.js';
import { resolveRange, inRange, rangeLabel } from '../utils/dateRange.js';
import { compressSeries } from '../utils/analytics.js';
import { fmtInt, fmtDateTime, relTime } from '../utils/format.js';
import { DAY } from '../../data/seedUtils.js';

const COLORS = { Windows: SERIES[0], 'macOS Apple Silicon': SERIES[1], 'macOS Intel': SERIES[2] };

export default function Downloads() {
  const anim = useChartAnim();
  const { loading, error, reload, data } = useDemoData('downloads', 'website');
  const { downloads = [], website } = data;
  const [rangeVal, setRangeVal] = useState({ preset: '90d' });
  const range = useMemo(() => resolveRange(rangeVal), [rangeVal]);
  const rows = useMemo(() => downloads.filter((d) => inRange(d.at, range.from, range.to)), [downloads, range]);

  const counts = Object.fromEntries(PLATFORMS.map((p) => [p, rows.filter((d) => d.platform === p).length]));
  const donut = PLATFORMS.map((p) => ({ name: p, value: counts[p], pct: rows.length ? (counts[p] / rows.length) * 100 : 0 }));
  const trend = useMemo(() => {
    const out = [];
    for (let i = 0; i < range.days; i++) {
      const from = range.from.getTime() + i * DAY;
      const day = rows.filter((d) => { const t = new Date(d.at).getTime(); return t >= from && t < from + DAY; });
      out.push({ date: new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), Windows: day.filter((d) => d.platform === 'Windows').length, 'macOS Apple Silicon': day.filter((d) => d.platform === 'macOS Apple Silicon').length, 'macOS Intel': day.filter((d) => d.platform === 'macOS Intel').length, sessions: 0, students: 0, prevSessions: 0, prevStudents: 0, iso: '' });
    }
    return out;
  }, [rows, range]);
  const trendC = useMemo(() => {
    // Weekly buckets for long ranges keep the lines readable.
    if (trend.length <= 45) return trend;
    const size = Math.ceil(trend.length / 45);
    const out = [];
    for (let i = 0; i < trend.length; i += size) {
      const c = trend.slice(i, i + size);
      const o = { date: c[0].date };
      PLATFORMS.forEach((p) => { o[p] = c.reduce((a, x) => a + x[p], 0); });
      out.push(o);
    }
    return out;
  }, [trend]);

  const recent = [...rows].reverse();
  const columns = [
    { key: 'id', header: 'Event', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'platform', header: 'Platform', render: (r) => <span className="row"><i className="sw" style={{ background: COLORS[r.platform] }} />{r.platform}</span> },
    { key: 'version', header: 'Version', render: (r) => <span className="mono">v{r.version}</span> },
    { key: 'region', header: 'Region (sample)' },
    { key: 'at', header: 'When', render: (r) => <div>{fmtDateTime(r.at)}<div className="cell-sub">{relTime(r.at)}</div></div> },
  ];
  const links = website?.downloads;

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Downloads & Installations" description="Software distribution across the platforms offered on the KALQY website."
        actions={<><DemoBadge label="FICTIONAL STATS" /><DateRangePicker value={rangeVal} onChange={setRangeVal} />
          <ExportButton filename="kalqy-downloads" rows={recent} columns={[{ header: 'Event', key: 'id' }, { header: 'Platform', key: 'platform' }, { header: 'Version', key: 'version' }, { header: 'Region', key: 'region' }, { header: 'When', key: 'at' }]} preamble={[['Report', 'Download events (fictional sample statistics)'], ['Date range', rangeLabel(rangeVal)]]} /></>} />
      <div className="alert info" style={{ marginBottom: 16 }}><span>These are fictional sample statistics. They are not real website analytics unless real tracking data is integrated.</span></div>
      <div className="grid grid-stats">
        <StatTile label="Total downloads" value={fmtInt(rows.length)} icon={Download} />
        <StatTile label="Windows" value={fmtInt(counts.Windows)} icon={Monitor} tone="mint" />
        <StatTile label="macOS Apple Silicon" value={fmtInt(counts['macOS Apple Silicon'])} icon={Cpu} tone="coral" />
        <StatTile label="macOS Intel" value={fmtInt(counts['macOS Intel'])} icon={Laptop} tone="yellow" />
      </div>
      <div className="grid grid-2 mt">
        <Card title="Download trend" subtitle="Downloads per day by platform" action={<Legend items={PLATFORMS.map((p) => ({ label: p, color: COLORS[p] }))} />}>
          {loading ? <Skeleton h={300} /> : !rows.length ? <EmptyState kind="egg" title="No downloads in this range" /> : (
            <ChartBox label="Line chart of downloads per day for each platform">
              <ResponsiveContainer><LineChart data={trendC} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} /><XAxis dataKey="date" {...axisProps} minTickGap={28} /><YAxis {...axisProps} allowDecimals={false} />
                <RTooltip content={<ChartTip />} />
                {PLATFORMS.map((p) => <Line key={p} dataKey={p} name={p} stroke={COLORS[p]} strokeWidth={2.2} dot={false} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={anim} />)}
              </LineChart></ResponsiveContainer>
            </ChartBox>
          )}
        </Card>
        <Card title="Platform distribution" subtitle="Share of downloads">
          {loading ? <Skeleton h={300} /> : !rows.length ? <EmptyState title="No data" /> : (
            <>
              <ChartBox label="Donut chart of downloads by platform" height={200}>
                <ResponsiveContainer><PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2} isAnimationActive={anim}>{donut.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}</Pie>
                  <RTooltip content={<ChartTip valueFmt={(v, p) => `${fmtInt(v)} (${p.payload.pct.toFixed(1)}%)`} />} />
                </PieChart></ResponsiveContainer>
              </ChartBox>
              <ul className="feed">{donut.map((d) => <li key={d.name} style={{ padding: '8px 0' }}><i className="sw" style={{ background: COLORS[d.name], marginTop: 6 }} /><span style={{ flex: 1 }}>{d.name}</span><b className="mono">{d.pct.toFixed(1)}%</b></li>)}</ul>
            </>
          )}
        </Card>
      </div>
      <Card className="mt" title="Download links" subtitle="As configured in Website Content (read-only here)">
        <div className="stack" style={{ gap: 8 }}>
          {links && [['Windows', links.windows], ['macOS Apple Silicon', links.macAppleSilicon], ['macOS Intel', links.macIntel]].map(([l, u]) => (
            <div key={l} className="row between wrap"><Badge plain>{l}</Badge><code style={{ overflowWrap: 'anywhere', fontSize: 12.5 }}>{u}</code></div>
          ))}
        </div>
      </Card>
      <Card className="mt" title="Recent download events" flush>
        <DataTable label="Recent download events" columns={columns} rows={recent} loading={loading} pageSize={8} initialSort={{ key: 'at', dir: 'desc' }} empty={<EmptyState title="No download events" />} />
      </Card>
    </div>
  );
}
