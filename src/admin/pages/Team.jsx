import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Eye, ShieldAlert, RotateCcw, MoreHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import { Modal } from '../components/Overlay.jsx';
import { Avatar, Button, Card, EmptyState, ErrorState, Field, IconButton, Menu, Select, Skeleton, StatusBadge, TextInput, DemoBadge } from '../components/ui.jsx';
import { useDemoData } from '../hooks/useDemoData.js';
import { useAdmin } from '../hooks/AdminContext.jsx';
import { createRecord, updateRecord, saveObject } from '../../services/demoDataService.js';
import { ROLES, RESOURCES, DEFAULT_PERMISSIONS } from '../../data/teamData.js';
import { relTime } from '../utils/format.js';

const EMPTY = { name: '', email: '', role: 'Teacher', status: 'Invited' };

function UserForm({ open, user, onClose }) {
  const { toast } = useAdmin();
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(user ? { ...user } : EMPTY); setErr({}); } }, [open, user]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async (e) => {
    e?.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email (fictional).';
    setErr(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      if (user) await updateRecord('team', user.id, { ...f, name: f.name.trim() });
      else await createRecord('team', { ...f, name: f.name.trim(), lastActive: '' });
      toast(user ? 'Team member updated' : 'Invite recorded (no email is sent in demo mode)');
      onClose();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit team member' : 'Invite team member'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{user ? 'Save changes' : 'Add member'}</Button></>}>
      <form className="form-grid" onSubmit={save} noValidate>
        <Field label="Full name" error={err.name} className="full"><TextInput value={f.name} invalid={!!err.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email (fictional)" error={err.email} className="full"><TextInput type="email" value={f.email} invalid={!!err.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
        <Field label="Role"><Select value={f.role} options={ROLES} onChange={(e) => set('role', e.target.value)} /></Field>
        <Field label="Status"><Select value={f.status} options={['Active', 'Invited', 'Suspended']} onChange={(e) => set('status', e.target.value)} /></Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function Team() {
  const { toast, canEdit, setViewAsRole, viewAsRole } = useAdmin();
  const edit = canEdit('team');
  const { loading, error, reload, data } = useDemoData('team', 'permissions');
  const { team = [], permissions } = data;
  const [form, setForm] = useState({ open: false, user: null });
  const roleCounts = useMemo(() => Object.fromEntries(ROLES.map((r) => [r, team.filter((u) => u.role === r).length])), [team]);

  const setPerm = async (role, res, value) => {
    await saveObject('permissions', { ...permissions, [role]: { ...permissions[role], [res]: value } });
    toast(`${role}: ${res} set to “${value}” (simulated)`);
  };
  const resetPerms = async () => { await saveObject('permissions', DEFAULT_PERMISSIONS); toast('Permission matrix reset to defaults'); };

  const columns = [
    { key: 'name', header: 'Member', render: (r) => <div className="row"><Avatar name={r.name} size="sm" /><div><div className="cell-main">{r.name}</div><div className="cell-sub">{r.email}</div></div></div> },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'lastActive', header: 'Last active', render: (r) => (r.lastActive ? relTime(r.lastActive) : 'Never') },
    { key: 'actions', header: <span className="sr-only">Actions</span>, sortable: false, render: (r) => (
      <Menu label={`Actions for ${r.name}`} trigger={({ label }) => <IconButton icon={MoreHorizontal} label={label} />}
        items={[{ label: `Preview app as ${r.role}`, icon: Eye, onClick: () => { setViewAsRole(r.role); toast(`Previewing navigation as ${r.role}`); } }, edit && { label: 'Edit member', icon: Pencil, onClick: () => setForm({ open: true, user: r }) }]} />) },
  ];

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHeader title="Team & Roles" description="Sample team members and a simulated role-permission matrix."
        actions={<><DemoBadge label="SAMPLE DATA" />{edit && <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, user: null })}>Invite member</Button>}</>} />
      <div className="alert info" style={{ marginBottom: 16 }}><ShieldAlert size={17} style={{ flex: 'none', marginTop: 2 }} /><span><b>Simulated permissions.</b> These controls only change what this browser shows. They are <b>not</b> real security; real access control must be enforced by a backend.</span></div>

      <Card flush title="Team members" subtitle={`${team.length} sample users`}>
        <div style={{ height: 12 }} />
        <DataTable label="Team members" columns={columns} rows={team} loading={loading} pageSize={8} empty={<EmptyState title="No team members" />} />
      </Card>

      <Card className="mt" title="Role-permission matrix" subtitle="Set what each role can do. Try a role with “Preview as role”."
        action={<div className="row wrap"><Select aria-label="Preview as role" style={{ width: 'auto', height: 36 }} value={viewAsRole} onChange={(e) => { setViewAsRole(e.target.value); }}>
          <option value="">Preview as… (Super Admin)</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select>
          {edit && <Button size="sm" icon={RotateCcw} onClick={resetPerms}>Reset</Button>}</div>} flush>
        {loading || !permissions ? <div style={{ padding: 20 }}><Skeleton h={220} /></div> : (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Permission matrix">
            <table className="table" style={{ minWidth: 820 }}>
              <thead><tr><th scope="col">Role</th>{RESOURCES.map((r) => <th key={r.key} scope="col">{r.label}</th>)}</tr></thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role}>
                    <th scope="row" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13.5, color: 'var(--text)', background: 'transparent' }}>{role}<div className="cell-sub" style={{ fontWeight: 400 }}>{roleCounts[role]} member{roleCounts[role] === 1 ? '' : 's'}</div></th>
                    {RESOURCES.map((res) => (
                      <td key={res.key}>
                        <select className="select" style={{ height: 34, minWidth: 92, fontSize: 13 }} aria-label={`${role} access to ${res.label}`} value={permissions[role]?.[res.key] || 'none'}
                          disabled={!edit || role === 'Super Admin'} onChange={(e) => setPerm(role, res.key, e.target.value)}>
                          <option value="none">No access</option><option value="view">View</option><option value="edit">Edit</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <UserForm open={form.open} user={form.user} onClose={() => setForm({ open: false, user: null })} />
    </div>
  );
}
