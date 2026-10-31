import { filterSessions, completionRate, avgScore, avgDuration } from './analytics.js';
import { sum, fullName } from './format.js';

const r1 = (n) => Math.round(n * 10) / 10;
const weekStart = (iso) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
const key = (d) => d.toISOString().slice(0, 10);

/** Build a report (columns + rows) from the shared sample dataset using the active filters. */
export function buildReport(type, { sessions, students, schools, games }, { range, schoolId, gameId }) {
  const list = filterSessions(sessions, { range, schoolId, gameId });
  const scopedStudents = students.filter((s) => !s.archived && (!schoolId || schoolId === 'all' || s.schoolId === schoolId));

  if (type === 'student') {
    const rows = scopedStudents.map((s) => {
      const l = list.filter((x) => x.studentId === s.id);
      return {
        id: s.id, name: fullName(s), school: schools.find((x) => x.id === s.schoolId)?.name || '', sessions: l.length,
        minutes: sum(l, (x) => x.durationMin), score: l.length ? r1(avgScore(l)) : 0, completion: l.length ? r1(completionRate(l)) : 0,
        lastActive: l.length ? l[l.length - 1].startedAt.slice(0, 10) : '',
      };
    }).sort((a, b) => b.sessions - a.sessions);
    return { columns: [['id', 'Student ID'], ['name', 'Student'], ['school', 'School'], ['sessions', 'Sessions'], ['minutes', 'Minutes played'], ['score', 'Avg score'], ['completion', 'Completion %'], ['lastActive', 'Last active']], rows };
  }
  if (type === 'school') {
    const rows = schools.filter((s) => !schoolId || schoolId === 'all' || s.id === schoolId).map((s) => {
      const l = list.filter((x) => x.schoolId === s.id);
      return { id: s.id, name: s.name, location: s.location, students: students.filter((x) => x.schoolId === s.id && !x.archived).length, sessions: l.length, minutes: sum(l, (x) => x.durationMin), score: l.length ? r1(avgScore(l)) : 0, completion: l.length ? r1(completionRate(l)) : 0 };
    }).sort((a, b) => b.sessions - a.sessions);
    return { columns: [['id', 'School ID'], ['name', 'School'], ['location', 'Location'], ['students', 'Students'], ['sessions', 'Sessions'], ['minutes', 'Minutes played'], ['score', 'Avg score'], ['completion', 'Completion %']], rows };
  }
  if (type === 'game') {
    const rows = games.filter((g) => !gameId || gameId === 'all' || g.id === gameId).map((g) => {
      const l = list.filter((x) => x.gameId === g.id);
      return { id: g.id, name: g.name, category: g.category, status: g.status, sessions: l.length, students: new Set(l.map((x) => x.studentId)).size, duration: l.length ? r1(avgDuration(l)) : 0, score: l.length ? r1(avgScore(l)) : 0, completion: l.length ? r1(completionRate(l)) : 0 };
    }).sort((a, b) => b.sessions - a.sessions);
    return { columns: [['id', 'Game ID'], ['name', 'Game'], ['category', 'Category'], ['status', 'Status'], ['sessions', 'Sessions'], ['students', 'Unique students'], ['duration', 'Avg duration (min)'], ['score', 'Avg score'], ['completion', 'Completion %']], rows };
  }
  const monthly = type === 'monthly';
  const map = new Map();
  list.forEach((s) => {
    const d = monthly ? new Date(new Date(s.startedAt).getFullYear(), new Date(s.startedAt).getMonth(), 1) : weekStart(s.startedAt);
    const k = key(new Date(d.getTime() - d.getTimezoneOffset() * 60000));
    const e = map.get(k) || { period: monthly ? d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : `Week of ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, k, list: [] };
    e.list.push(s);
    map.set(k, e);
  });
  const rows = [...map.values()].sort((a, b) => a.k.localeCompare(b.k)).map((e) => ({
    period: e.period, sessions: e.list.length, students: new Set(e.list.map((x) => x.studentId)).size, minutes: sum(e.list, (x) => x.durationMin),
    score: r1(avgScore(e.list)), completion: r1(completionRate(e.list)),
  }));
  return { columns: [['period', monthly ? 'Month' : 'Week'], ['sessions', 'Sessions'], ['students', 'Active students'], ['minutes', 'Minutes played'], ['score', 'Avg score'], ['completion', 'Completion %']], rows };
}
