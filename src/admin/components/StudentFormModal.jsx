import React, { useEffect, useState } from 'react';
import { Modal } from './Overlay.jsx';
import { Button, Field, TextInput, Select } from './ui.jsx';
import { createRecord, updateRecord } from '../../services/demoDataService.js';
import { useAdmin } from '../hooks/AdminContext.jsx';

const EMPTY = { firstName: '', lastName: '', age: 4, schoolId: '', teacherId: '', status: 'New' };

/** Add / edit a sample student. Only minimal, non-sensitive fields are collected on purpose. */
export default function StudentFormModal({ open, student, schools, teachers, parents, onClose }) {
  const { toast } = useAdmin();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm(student ? { ...student } : { ...EMPTY, schoolId: schools[0]?.id || '' }); setErrors({}); }
  }, [open, student, schools]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const schoolTeachers = teachers.filter((t) => t.schoolId === form.schoolId);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!form.schoolId) errs.schoolId = 'Choose a school or centre.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const teacherId = schoolTeachers.some((t) => t.id === form.teacherId) ? form.teacherId : schoolTeachers[0]?.id || '';
      const clean = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), age: Number(form.age), teacherId };
      if (student) await updateRecord('students', student.id, clean);
      else await createRecord('students', {
        ...clean, archived: false, registeredAt: new Date().toISOString(), strengths: [], practise: [], assignedGameIds: ['GAME-01', 'GAME-02'],
        parentId: parents?.[0]?.id || '', engagementBias: 1,
      });
      toast(student ? 'Sample student updated' : 'Sample student added');
      onClose();
    } catch (err) {
      toast(err.message || 'Could not save student', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? `Edit ${student.firstName}` : 'Add student'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={submit}>{student ? 'Save changes' : 'Add student'}</Button></>}>
      <form onSubmit={submit} className="form-grid" noValidate>
        <Field label="First name" error={errors.firstName}><TextInput value={form.firstName} onChange={(e) => set('firstName', e.target.value)} invalid={!!errors.firstName} maxLength={40} /></Field>
        <Field label="Last name" error={errors.lastName}><TextInput value={form.lastName} onChange={(e) => set('lastName', e.target.value)} invalid={!!errors.lastName} maxLength={40} /></Field>
        <Field label="Age"><Select value={form.age} onChange={(e) => set('age', e.target.value)} options={[3, 4, 5].map((a) => ({ value: a, label: `${a} years` }))} /></Field>
        <Field label="Learning status"><Select value={form.status} onChange={(e) => set('status', e.target.value)} options={['New', 'On track', 'Excelling', 'Needs attention']} /></Field>
        <Field label="School or centre" error={errors.schoolId} className="full">
          <Select value={form.schoolId} onChange={(e) => set('schoolId', e.target.value)}><option value="">Select…</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        </Field>
        <Field label="Teacher" className="full" hint="Teachers are limited to the selected school.">
          <Select value={form.teacherId} onChange={(e) => set('teacherId', e.target.value)}><option value="">Auto-assign</option>{schoolTeachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
        </Field>
        <p className="note full">Sample record only. Do not enter real children's personal information in this demo.</p>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
