import React from 'react';
import { Drawer } from './Overlay.jsx';
import { Avatar, StatusBadge, ProgressBar, Badge } from './ui.jsx';
import { fmtDateTime, fullName } from '../utils/format.js';

export default function SessionDrawer({ session, students, schools, games, teachers = [], onClose }) {
  const s = session;
  const student = s && students.find((x) => x.id === s.studentId);
  const school = s && schools.find((x) => x.id === s.schoolId);
  const game = s && games.find((x) => x.id === s.gameId);
  const teacher = s && teachers.find((x) => x.id === s.teacherId);
  return (
    <Drawer open={!!s} onClose={onClose} title={s ? `Session ${s.id}` : ''} subtitle="Sample session record">
      {s && (
        <div className="stack">
          <div className="row">
            <Avatar name={fullName(student)} />
            <div><div className="cell-main">{fullName(student)}</div><div className="cell-sub">{school?.name}</div></div>
            <span className="spacer" /><StatusBadge status={s.completion} />
          </div>
          <dl className="kv">
            <dt>Game</dt><dd>{game?.name}</dd>
            <dt>Category</dt><dd>{s.category}</dd>
            <dt>Started</dt><dd>{fmtDateTime(s.startedAt)}</dd>
            <dt>Duration</dt><dd>{s.durationMin} min</dd>
            <dt>Score</dt><dd>{s.score} / 100</dd>
            <dt>Teacher</dt><dd>{teacher?.name || '—'}</dd>
            <dt>Skills practised</dt><dd className="row wrap">{s.skills.length ? s.skills.map((k) => <Badge key={k} tone="blue" plain>{k}</Badge>) : '—'}</dd>
          </dl>
          <div>
            <div className="row between" style={{ marginBottom: 6 }}><b>Completion</b><span className="mono">{s.completionPct}%</span></div>
            <ProgressBar value={s.completionPct} color={s.completion === 'Completed' ? '#3FB27F' : s.completion === 'Partial' ? '#E9B21A' : '#FF8C78'} label="Completion" />
          </div>
          <div>
            <div className="row between" style={{ marginBottom: 6 }}><b>Score</b><span className="mono">{s.score}%</span></div>
            <ProgressBar value={s.score} label="Score" />
          </div>
          <p className="note">Sample data. No webcam footage or biometric data is stored in this demo.</p>
        </div>
      )}
    </Drawer>
  );
}
