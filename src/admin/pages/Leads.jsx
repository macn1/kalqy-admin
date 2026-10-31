import React, { useEffect, useMemo, useState } from 'react';
import { Inbox, Sparkles, CalendarCheck, Trophy, Mail, Phone } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ExportButton from '../components/ExportButton.jsx';
import { Drawer } from '../components/Overlay.jsx';
import { Button, Card, EmptyState, ErrorState, Field, SearchBox, Select, StatTile, StatusBadge, Textarea, TextInput, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { updateRecord } from '../../services/demoDataService.js';
import { LEAD_STATUSES, LEAD_TYPES, LEAD_SOURCES } from '../../data/leadsData.js';
import { fmtDate, fmtDateTime } from '../utils/format.js';

function LeadDrawer({ lead, onClose, edit }) {
  const { toast } = useAdmin();
  const [note, setNote] = useState('');
  const [follow, setFollow] = useState('');
  useEffect(() => { setNote(''); setFollow(lead?.followUp || ''); }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lead) return <Drawer open={false} onClose={onClose} />;
  const setStatus = async (status) => { await updateRecord('leads', lead.id, { status }); toast(`Status changed to “${status}” (no message sent)`); };
  const addNote = async () => {
    if (!note.trim()) return;
    await updateRecord('leads', lead.id, { notes: [{ at: new Date().toISOString(), text: note.trim() }, ...lead.notes] });
    setNote(''); toast('Note added');
  };
  const saveFollow = async () => { await updateRecord('leads', lead.id, { followUp: follow }); toast(follow ? 'Follow-up date saved' : 'Follow-up cleared'); };

  return (
    <Drawer open onClose={onClose} title={lead.contactName} subtitle={`${lead.id} · ${lead.organisation}`}>
      <div className="stack">
        <dl className="kv">
          <dt>Enquiry type</dt><dd>{lead.type}</dd>
          <dt>Email</dt><dd><Mail size={13} style={{ verticalAlign: -2 }} /> {lead.email}</dd>
          <dt>Phone</dt><dd><Phone size={13} style={{ verticalAlign: -2 }} /> {lead.phone}</dd>
          <dt>Source</dt><dd>{lead.source}</dd>
          <dt>Received</dt><dd>{fmtDateTime(lead.receivedAt)}</dd>
        </dl>
        <Field label="Status"><Select value={lead.status} options={LEAD_STATUSES} disabled={!edit} onChange={(e) => setStatus(e.target.value)} /></Field>
        <Field label="Follow-up date"><div className="row"><TextInput type="date" value={follow} disabled={!edit} onChange={(e) => setFollow(e.target.value)} /><Button disabled={!edit || follow === (lead.followUp || '')} onClick={saveFollow}>Save</Button></div></Field>
        <div>
          <h4 style={{ marginBottom: 8 }}>Notes</h4>
          {edit && (
            <div className="stack" style={{ gap: 8 }}>
              <Textarea aria-label="New note" placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              <div><Button variant="primary" size="sm" disabled={!note.trim()} onClick={addNote}>Add note</Button></div>
            </div>
          )}
          <ul className="feed" style={{ marginTop: 10 }}>
            {lead.notes.map((n, i) => <li key={i} style={{ display: 'block' }}><div>{n.text}</div><div className="faint" style={{ fontSize: 12 }}>{fmtDateTime(n.at)}</div></li>)}
            {!lead.notes.length && <li className="muted">No notes yet.</li>}
          </ul>
        </div>
        <p className="note">Demo mode: changing a status or adding a note never sends an email, SMS or WhatsApp message.</p>
      </div>
    </Drawer>
  );
}

export default function Leads() {
  const { canEdit } = useAdmin();
  const edit = canEdit('website');
  const { loading, error, reload, data } = useDemoData('leads');
  const { leads = [] } = data;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return leads.filter((l) => (status === 'all' || l.status === status) && (type === 'all' || l.type === type) && (source === 'all' || l.source === source) &&
      (!t || `${l.contactName} ${l.organisation} ${l.email} ${l.id}`.toLowerCase().includes(t)));
  }, [leads, q, status, type, source]);
  const open = leads.find((l) => l.id === openId);

  const columns = [
    { key: 'contactName', header: 'Contact', render: (r) => <div><div className="cell-main">{r.contactName}</div><div className="cell-sub mono">{r.id}</div></div> },
    { key: 'organisation', header: 'Organisation' },
    { key: 'type', header: 'Enquiry type' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', className: 'nowrap' },
    { key: 'source', header: 'Source' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'receivedAt', header: 'Received', className: 'nowrap', render: (r) => fmtDate(r.receivedAt) },
  ];
  const exportCols = [{ header: 'Lead ID', key: 'id' }, { header: 'Contact', key: 'contactName' }, { header: 'Organisation', key: 'organisation' }, { header: 'Type', key: 'type' }, { header: 'Email (fictional)', key: 'email' }, { header: 'Phone (fictional)', key: 'phone' }, { header: 'Source', key: 'source' }, { header: 'Status', key: 'status' }, { header: 'Follow-up', key: 'followUp' }, { header: 'Received', value: (r) => r.receivedAt.slice(0, 10) }, { header: 'Notes', value: (r) => r.notes.map((n) => n.text).join(' | ') }];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Demo Requests & Leads" description="Track enquiries from schools, preschools and parents. All contacts are fictional."
        actions={<><DemoBadge label="SAMPLE DATA" /><ExportButton filename="kalqy-leads" columns={exportCols} rows={rows} preamble={[['Report', 'Leads (sample data)'], ['Filters', `search="${q}" status=${status} type=${type} source=${source}`]]} /></>} />
      <div className="grid grid-stats">
        <StatTile label="Total enquiries" value={leads.length} icon={Inbox} />
        <StatTile label="New enquiries" value={leads.filter((l) => l.status === 'New').length} icon={Sparkles} tone="coral" />
        <StatTile label="Demos scheduled" value={leads.filter((l) => l.status === 'Demo Scheduled').length} icon={CalendarCheck} tone="yellow" />
        <StatTile label="Converted" value={leads.filter((l) => l.status === 'Converted').length} icon={Trophy} tone="mint" />
      </div>
      <Card className="mt" flush>
        <div className="filters">
          <SearchBox value={q} onChange={setQ} placeholder="Search contact, organisation or email" />
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select aria-label="Filter by enquiry type" value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option>{LEAD_TYPES.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value)}><option value="all">All sources</option>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
        <DataTable label="Leads" columns={columns} rows={rows} loading={loading} pageSize={10} onRowClick={(r) => setOpenId(r.id)} initialSort={{ key: 'receivedAt', dir: 'desc' }}
          empty={<EmptyState kind="star" title={leads.length ? 'No leads match' : 'No enquiries yet'} text="Adjust filters or restore sample data in Settings." />} />
      </Card>
      <LeadDrawer lead={open} onClose={() => setOpenId(null)} edit={edit} />
    </div>
  );
}
