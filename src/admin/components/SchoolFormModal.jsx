import React, { useEffect, useState } from 'react';
import { Modal } from './Overlay.jsx';
import { Button, Field, TextInput, Select } from './ui.jsx';
import { createRecord, updateRecord } from '../../services/demoDataService.js';
import { useAdmin } from '../hooks/AdminContext.jsx';

const EMPTY = { name: '', city: '', state: 'Kerala', status: 'Trial', contactEmail: '', classrooms: 1 };
const STATES = ['Kerala', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'Other'];

export default function SchoolFormModal({ open, school, onClose }) {
  const { toast } = useAdmin();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setForm(school ? { ...school } : EMPTY); setErrors({}); } }, [open, school]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'School name is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) errs.contactEmail = 'Enter a valid email.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const clean = { ...form, name: form.name.trim(), city: form.city.trim(), location: `${form.city.trim()}, ${form.state}`, classrooms: Number(form.classrooms) || 1 };
      if (school) await updateRecord('schools', school.id, clean);
      else await createRecord('schools', { ...clean, registeredAt: new Date().toISOString() });
      toast(school ? 'School updated' : 'School added');
      onClose();
    } catch (err) { toast(err.message || 'Could not save school', 'error'); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={school ? 'Edit school' : 'Add school or centre'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={submit}>{school ? 'Save changes' : 'Add school'}</Button></>}>
      <form onSubmit={submit} className="form-grid" noValidate>
        <Field label="School / centre name" error={errors.name} className="full"><TextInput value={form.name} invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} maxLength={80} /></Field>
        <Field label="City" error={errors.city}><TextInput value={form.city} invalid={!!errors.city} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="State"><Select value={form.state} options={STATES} onChange={(e) => set('state', e.target.value)} /></Field>
        <Field label="Access status"><Select value={form.status} options={['Active', 'Trial', 'Pending', 'Expired']} onChange={(e) => set('status', e.target.value)} /></Field>
        <Field label="Classrooms"><TextInput type="number" min={1} max={50} value={form.classrooms} onChange={(e) => set('classrooms', e.target.value)} /></Field>
        <Field label="Contact email (fictional)" error={errors.contactEmail} className="full"><TextInput type="email" value={form.contactEmail} invalid={!!errors.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="office@example.com" /></Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
