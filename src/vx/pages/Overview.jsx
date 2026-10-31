import React, { useState } from 'react';
import { Activity, BarChart3, Gamepad2, TrendingUp, Users, Wallet } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApp, useApi } from '../ctx.jsx';
import { Async, Card, Empty, Page, Seg, Skel, Stat } from '../ui.jsx';
import { TrendChart, pointsOf } from '../charts.jsx';
import { fmtValue, humanize, isObj, kpisOf, looksDate } from '../util.js';

const ICONS = [Users, Wallet, Gamepad2, Activity, BarChart3, TrendingUp];
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

// Arrays of objects inside the overview payload, minus the time series (shown as the chart).
function listsOf(o) {
  return Object.entries(o || {}).filter(([, v]) => Array.isArray(v) && v.length && isObj(v[0]));
}

function UsageCard({ title, rows }) {
  const numKey = Object.keys(rows[0]).find((k) => typeof rows[0][k] === 'number' && !/_id$|^id$/.test(k));
  const nameKey = Object.keys(rows[0]).find((k) => typeof rows[0][k] === 'string' && !looksDate(k, rows[0][k])) || Object.keys(rows[0])[0];
  const max = Math.max(...rows.map((r) => r[numKey] || 0), 1);
  return (
    <Card title={title}>
      <div className="list">
        {rows.slice(0, 8).map((r, i) => (
          <div className="list-item" key={i} style={{ display: 'grid', gap: 6 }}>
            <div className="row between"><span className="t">{String(r[nameKey])}</span><b className="mono">{numKey ? fmtValue(numKey, r[numKey], r) : ''}</b></div>
            {numKey && <div className="bar"><i style={{ width: `${((r[numKey] || 0) / max) * 100}%` }} /></div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Placeholder that mirrors the real layout so content flows in place instead of jumping. */
function DashSkeleton() {
  return (
    <div className="dash-skel" role="status" aria-label="Loading dashboard">
      <div className="flowbar" />
      <div className="grid g4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="card" key={i}><Skel h={14} w="55%" /><Skel h={30} w="70%" /><Skel h={12} w="40%" /></div>
        ))}
      </div>
      <div className="grid split">
        <div className="card"><Skel h={16} w="30%" /><Skel h={250} /></div>
        <div className="card"><Skel h={16} w="40%" />{Array.from({ length: 4 }, (_, i) => <Skel key={i} h={34} />)}</div>
      </div>
    </div>
  );
}

export default function Overview() {
  const { auth } = useApp();
  const [days, setDays] = useState(30);
  const overview = useApi(() => api.overview(), []);
  const trend = useApi(() => api.engagement(days), [days]);
  const name = (auth?.user?.name || auth?.name || '').split(' ')[0] || 'Admin';

  return (
    <Page title={`${greeting()}, ${name}`} sub="Stay on top of users, content and revenue across KALQY.">
      <Async q={overview} skeleton={<DashSkeleton />} render={(o) => {
        const lists = listsOf(o);
        const trendFromOverview = lists.find(([, rows]) => looksDate(Object.keys(rows[0])[0], Object.values(rows[0])[0]) || Object.keys(rows[0]).some((k) => looksDate(k, rows[0][k])));
        const others = lists.filter((l) => l !== trendFromOverview);
        const kpis = kpisOf(o).slice(0, 9);
        return (
          <>
            <div className="grid g4">
              {kpis.slice(0, 8).map((k, i) => <Stat key={k.key} hero={i === 0} label={k.label} value={k.value} index={i} icon={ICONS[i % ICONS.length]} hint={i === 0 ? 'Platform total' : 'Current'} />)}
            </div>
            {!kpis.length && <Card><Empty title="No summary figures returned" /></Card>}
            <div className="grid split">
              <Card title="Engagement" sub={`Activity over the last ${days} days`} action={<Seg value={days} onChange={setDays} options={[{ value: 7, label: '7d' }, { value: 30, label: '30d' }, { value: 90, label: '90d' }]} />}>
                <Async q={trend} rows={2} render={(d) => <TrendChart points={pointsOf(d).length ? pointsOf(d) : trendFromOverview?.[1] || []} />} />
              </Card>
              <div className="stack">
                {others.slice(0, 2).map(([k, rows]) => <UsageCard key={k} title={humanize(k)} rows={rows} />)}
                {!others.length && <Card title="Summary"><p className="muted">No per-engine breakdown was returned by the overview endpoint.</p></Card>}
              </div>
            </div>
          </>
        );
      }} />
    </Page>
  );
}
