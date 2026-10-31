import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, MailCheck, Link2, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import { Drawer } from '../components/Overlay.jsx';
import { Avatar, Badge, Card, EmptyState, ErrorState, SearchBox, Select, StatTile, StatusBadge, Switch, DemoBadge, IconButton } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { updateRecord } from '../../services/demoDataService.js';
import { byId, fullName, fmtDate, relTime } from '../utils/format.js';

const PREFS = [['weeklyReport', 'Weekly progress report'], ['sessionAlerts', 'Session completed alerts'], ['productUpdates', 'Product updates']];

export default function Parents() {
  const { toast, canEdit } = useAdmin();
  const edit = canEdit('students');
  const { loading, error, reload, data } = useDemoData('parents', 'students');
  const { parents = [], students = [] } = data;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState(null);
  const sMap = useMemo(() => byId(students), [students]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return parents.filter((p) => (status === 'all' || p.status === status) && (!t || `${p.name} ${p.id} ${p.email}`.toLowerCase().includes(t)))
      .map((p) => ({ ...p, kids: students.filter((s) => s.parentId === p.id) }));
  }, [parents, students, q, status]);
  const open = parents.find((p) => p.id === openId);

  const setPref = async (p, key, v) => {
    await updateRecord('parents', p.id, { notifications: { ...p.notifications, [key]: v } });
    toast('Notification preference saved (demo only, no messages are sent)');
  };

  const columns = [
    { key: 'name', header: 'Parent / guardian', render: (r) => <div className="row"><Avatar name={r.name} size="sm" /><div><div className="cell-main">{r.name}</div><div className="cell-sub">{r.email}</div></div></div> },
    { key: 'kids', header: 'Linked students', sortable: false, render: (r) => r.kids.length ? r.kids.map((k) => <Link key={k.id} to={`/admin/students/${k.id}`} onClick={(e) => e.stopPropagation()} style={{ marginRight: 8, whiteSpace: 'nowrap' }}>{fullName(k)}</Link>) : '—' },
    { key: 'registeredAt', header: 'Registered', className: 'nowrap', render: (r) => fmtDate(r.registeredAt) },
    { key: 'lastActive', header: 'Last active', render: (r) => relTime(r.lastActive) },
    { key: 'prefs', header: 'Notifications', sortable: false, render: (r) => { const n = Object.values(r.notifications).filter(Boolean).length; return <Badge plain tone={n ? 'blue' : ''}>{n} of 3 on</Badge>; } },
    { key: 'status', header: 'Account', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'view', header: <span className="sr-only">View</span>, sortable: false, render: (r) => <IconButton icon={Eye} label={`View ${r.name}`} onClick={() => setOpenId(r.id)} /> },
  ];
  const exportCols = [{ header: 'Parent ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Email (fictional)', key: 'email' }, { header: 'Linked students', value: (r) => r.kids.map(fullName).join('; ') }, { header: 'Registered', value: (r) => r.registeredAt.slice(0, 10) }, { header: 'Status', key: 'status' }];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Parents" description="Parent and guardian accounts linked to student profiles. Contact details are fictional."
        actions={<><DemoBadge label="SAMPLE DATA" /><ExportButton filename="kalqy-parents" columns={exportCols} rows={rows} preamble={[['Report', 'Parents (sample data)'], ['Filters', `search="${q}" status=${status}`]]} /></>} />
      <div className="grid grid-stats">
        <StatTile label="Parent accounts" value={parents.length} icon={Users} />
        <StatTile label="Active accounts" value={parents.filter((p) => p.status === 'Active').length} icon={CheckCircle2} tone="mint" />
        <StatTile label="Weekly reports on" value={parents.filter((p) => p.notifications?.weeklyReport).length} icon={MailCheck} tone="yellow" />
        <StatTile label="Linked students" value={students.filter((s) => s.parentId).length} icon={Link2} tone="coral" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search parent name, ID or email" />
          <Select aria-label="Filter by account status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All accounts</option><option>Active</option><option>Invited</option><option>Suspended</option></Select>
        </div>
        <DataTable label="Parents" columns={columns} rows={rows} loading={loading} pageSize={10} onRowClick={(r) => setOpenId(r.id)}
          empty={<EmptyState title={parents.length ? 'No parents match' : 'No parent accounts yet'} text="Adjust your search or restore sample data in Settings." />} />
      </Card>
      <p className="note">Demo mode: no real emails or messages are ever sent from this interface.</p>
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name} subtitle={open ? `${open.id} · Sample parent account` : ''}>
        {open && (
          <div className="stack">
            <dl className="kv">
              <dt>Email</dt><dd>{open.email}</dd><dt>Phone</dt><dd>{open.phone}</dd><dt>Registered</dt><dd>{fmtDate(open.registeredAt)}</dd>
              <dt>Last active</dt><dd>{relTime(open.lastActive)}</dd><dt>Account</dt><dd><StatusBadge status={open.status} /></dd>
              <dt>Linked students</dt><dd>{open.studentIds.map((i) => sMap[i]).filter(Boolean).map((k) => <div key={k.id}><Link to={`/admin/students/${k.id}`}>{fullName(k)}</Link></div>)}</dd>
            </dl>
            <h4>Notification preferences</h4>
            {PREFS.map(([k, label]) => (
              <div key={k} className="row between"><span>{label}</span><Switch label={label} checked={open.notifications[k]} disabled={!edit} onChange={(v) => setPref(open, k, v)} /></div>
            ))}
            {!edit && <p className="note">Your simulated role has view-only access.</p>}
          </div>
        )}
      </Drawer>
    </div>
  );
}
