import React, { useMemo, useState } from 'react';
import { FileDown, Printer, FileBarChart } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { Button, Card, EmptyState, ErrorState, Field, Select, Skeleton, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { REPORT_TYPES } from '../../data/reportsData.js';
import { resolveRange, rangeLabel } from '../utils/dateRange.js';
import { buildReport } from '../utils/reports.js';
import { toCsv, downloadCsv } from '../utils/csv.js';
import { fmtInt } from '../utils/format.js';

export default function Reports() {
  const { toast, canEdit } = useAdmin();
  const { loading, error, reload, data } = useDemoData('sessions', 'students', 'schools', 'games');
  const { sessions = [], students = [], schools = [], games = [] } = data;
  const [type, setType] = useState('student');
  const [rangeVal, setRangeVal] = useState({ preset: '30d' });
  const [schoolId, setSchoolId] = useState('all');
  const [gameId, setGameId] = useState('all');
  const [generated, setGenerated] = useState(null);

  const range = useMemo(() => resolveRange(rangeVal), [rangeVal]);
  const meta = REPORT_TYPES.find((r) => r.key === type);
  const filtersText = `School: ${schoolId === 'all' ? 'All' : schools.find((s) => s.id === schoolId)?.name}; Game: ${gameId === 'all' ? 'All' : games.find((g) => g.id === gameId)?.name}`;

  const live = useMemo(() => (loading ? null : buildReport(type, { sessions, students, schools, games }, { range, schoolId, gameId })), [loading, type, sessions, students, schools, games, range, schoolId, gameId]);
  const report = generated?.snapshot || live;

  const generate = () => {
    setGenerated({ snapshot: live, label: meta.label, at: new Date(), filters: filtersText, range: rangeLabel(rangeVal) });
    toast('Report preview generated from sample data');
  };
  const info = generated || { label: meta?.label, at: new Date(), filters: filtersText, range: rangeLabel(rangeVal) };

  const exportCsv = () => {
    if (!report?.rows.length) return;
    const text = toCsv(report.columns.map(([key, header]) => ({ key, header })), report.rows, [
      ['Report', info.label], ['Data', 'Sample data (not real KALQY records)'], ['Date range', info.range], ['Filters', info.filters], ['Generated', info.at.toISOString()], ['Rows', report.rows.length],
    ]);
    downloadCsv(`kalqy-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`, text);
    toast(`Exported ${report.rows.length} rows to CSV`);
  };

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  const allowed = canEdit('reports');
  return (
    <div className="page">
      <PageHeader title="Reports & Exports" description="Build a report from the sample dataset, preview it, then export to CSV or PDF." actions={<DemoBadge label="SAMPLE DATA" />} />
      <div className="grid grid-reports">
        <Card title="Report builder" subtitle="Choose what to include">
          <div className="stack" style={{ gap: 14 }}>
            <Field label="Report type"><Select value={type} onChange={(e) => { setType(e.target.value); setGenerated(null); }} options={REPORT_TYPES.map((r) => ({ value: r.key, label: r.label }))} /></Field>
            <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>{meta.description}</p>
            <div className="field"><span className="lbl">Date range</span><DateRangePicker value={rangeVal} onChange={(v) => { setRangeVal(v); setGenerated(null); }} /></div>
            <Field label="School"><Select value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setGenerated(null); }}><option value="all">All schools</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            {(type === 'game' || type === 'student' || type === 'school' || type === 'weekly' || type === 'monthly') && (
              <Field label="Game"><Select value={gameId} onChange={(e) => { setGameId(e.target.value); setGenerated(null); }}><option value="all">All games</option>{games.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            )}
            <Button variant="primary" icon={FileBarChart} onClick={generate} disabled={loading || !allowed}>Generate preview</Button>
            {!allowed && <p className="note">Your simulated role has view-only access to reports.</p>}
          </div>
        </Card>

        <Card className="print-area" title={info.label} subtitle={`${info.range} · ${info.filters}`}
          action={<div className="row no-print"><Button icon={FileDown} onClick={exportCsv} disabled={!report?.rows.length}>Export CSV</Button><Button icon={Printer} disabled={!report?.rows.length} onClick={() => { toast('Use “Save as PDF” in the print dialog'); setTimeout(() => window.print(), 200); }}>Download PDF</Button></div>} flush>
          <div style={{ padding: '12px 20px 4px' }} className="faint">
            <span className="demo-badge"><i />SAMPLE DATA</span> {generated ? `Generated ${generated.at.toLocaleString('en-IN')}` : 'Live preview — click “Generate preview” to snapshot'}
          </div>
          {loading ? <div style={{ padding: 20 }}><Skeleton h={220} /></div> : !report.rows.length ? <EmptyState kind="leaf" title="No rows for this selection" text="Try a wider date range or fewer filters." /> : (
            <>
              <div className="table-wrap" tabIndex={0} role="region" aria-label="Report preview">
                <table className="table">
                  <thead><tr>{report.columns.map(([k, h]) => <th key={k}>{h}</th>)}</tr></thead>
                  <tbody>{report.rows.slice(0, 12).map((r, i) => <tr key={i}>{report.columns.map(([k]) => <td key={k} className={typeof r[k] === 'number' ? 'mono' : ''}>{typeof r[k] === 'number' ? fmtInt(r[k]) === String(r[k]) || Number.isInteger(r[k]) ? fmtInt(r[k]) : r[k] : r[k] || '—'}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div className="pager"><span>Previewing {Math.min(12, report.rows.length)} of {report.rows.length} rows. CSV exports all rows.</span></div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
