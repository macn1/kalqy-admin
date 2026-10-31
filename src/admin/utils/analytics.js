import { inRange } from './dateRange.js';
import { avg, sum } from './format.js';
import { DAY } from '../../data/seedUtils.js';

/** Filter sessions by range and optional dimension filters (all optional, '' / 'all' = no filter). */
export function filterSessions(sessions, { range, schoolId, gameId, category, studentId, completion } = {}) {
  return sessions.filter((s) =>
    (!range || inRange(s.startedAt, range.from, range.to)) &&
    (!schoolId || schoolId === 'all' || s.schoolId === schoolId) &&
    (!gameId || gameId === 'all' || s.gameId === gameId) &&
    (!category || category === 'all' || s.category === category) &&
    (!studentId || studentId === 'all' || s.studentId === studentId) &&
    (!completion || completion === 'all' || s.completion === completion)
  );
}

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const localKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };

/** Daily series for the range, with previous-period values aligned by index. */
export function dailySeries(sessions, range) {
  const out = [];
  const bucket = (from, to) => {
    const map = new Map();
    sessions.filter((s) => inRange(s.startedAt, from, to)).forEach((s) => {
      const k = localKey(s.startedAt);
      const e = map.get(k) || { sessions: 0, students: new Set() };
      e.sessions += 1;
      e.students.add(s.studentId);
      map.set(k, e);
    });
    return map;
  };
  const cur = bucket(range.from, range.to);
  const prev = bucket(range.prevFrom, range.prevTo);
  for (let i = 0; i < range.days; i++) {
    const d = new Date(range.from.getTime() + i * DAY);
    const p = new Date(range.prevFrom.getTime() + i * DAY);
    const c = cur.get(localKey(d));
    const q = prev.get(localKey(p));
    out.push({
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      iso: dayKey(d),
      sessions: c ? c.sessions : 0,
      students: c ? c.students.size : 0,
      prevSessions: q ? q.sessions : 0,
      prevStudents: q ? q.students.size : 0,
    });
  }
  return out;
}

/** Collapse a long daily series into weekly buckets so 90-day charts stay readable. */
export function compressSeries(series, maxPoints = 45) {
  if (series.length <= maxPoints) return series;
  const size = Math.ceil(series.length / maxPoints);
  const out = [];
  for (let i = 0; i < series.length; i += size) {
    const chunk = series.slice(i, i + size);
    out.push({
      date: chunk[0].date,
      iso: chunk[0].iso,
      sessions: sum(chunk, (c) => c.sessions),
      students: Math.max(...chunk.map((c) => c.students)),
      prevSessions: sum(chunk, (c) => c.prevSessions),
      prevStudents: Math.max(...chunk.map((c) => c.prevStudents)),
    });
  }
  return out;
}

export const completionRate = (list) => (list.length ? (list.filter((s) => s.completion === 'Completed').length / list.length) * 100 : 0);
export const avgDuration = (list) => avg(list, (s) => s.durationMin);
export const avgScore = (list) => avg(list, (s) => s.score);

export function groupSessions(list, keyFn) {
  const map = new Map();
  list.forEach((s) => {
    const k = keyFn(s);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  return map;
}

export function byGame(list, games) {
  const g = groupSessions(list, (s) => s.gameId);
  const total = list.length || 1;
  return games.map((game) => {
    const rows = g.get(game.id) || [];
    return {
      id: game.id, name: game.name, color: game.color, sessions: rows.length,
      pct: (rows.length / total) * 100,
      completion: completionRate(rows), duration: avgDuration(rows), score: avgScore(rows),
    };
  }).sort((a, b) => b.sessions - a.sessions);
}

export function byCategory(list) {
  const g = groupSessions(list, (s) => s.category);
  return [...g.entries()].map(([name, rows]) => ({ name, sessions: rows.length, pct: (rows.length / (list.length || 1)) * 100 })).sort((a, b) => b.sessions - a.sessions);
}

export function bySchool(list, schools) {
  const g = groupSessions(list, (s) => s.schoolId);
  return schools.map((sc) => {
    const rows = g.get(sc.id) || [];
    return { id: sc.id, name: sc.name, short: sc.name.split(' ').slice(0, 2).join(' '), sessions: rows.length, completion: completionRate(rows), score: avgScore(rows), minutes: sum(rows, (r) => r.durationMin) };
  }).sort((a, b) => b.sessions - a.sessions);
}

export function weekdayEngagement(list) {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = Array(7).fill(0);
  list.forEach((s) => { counts[(new Date(s.startedAt).getDay() + 6) % 7] += 1; });
  return names.map((day, i) => ({ day, sessions: counts[i] }));
}

export function engagementDistribution(list, students) {
  const counts = new Map(students.map((s) => [s.id, 0]));
  list.forEach((s) => counts.set(s.studentId, (counts.get(s.studentId) || 0) + 1));
  const buckets = [
    { label: '0 sessions', test: (n) => n === 0 },
    { label: '1–5', test: (n) => n >= 1 && n <= 5 },
    { label: '6–15', test: (n) => n >= 6 && n <= 15 },
    { label: '16–30', test: (n) => n >= 16 && n <= 30 },
    { label: '31+', test: (n) => n > 30 },
  ];
  return buckets.map((b) => ({ label: b.label, students: [...counts.values()].filter(b.test).length }));
}

/** Illustrative development indicators: mean session score per game's development area. NOT validated research. */
export function developmentByArea(list, games, areas) {
  const gameArea = Object.fromEntries(games.map((g) => [g.id, g.devArea]));
  return areas.map((a) => {
    const rows = list.filter((s) => gameArea[s.gameId] === a.key);
    return { ...a, value: rows.length ? Math.round(avgScore(rows)) : 0, sessions: rows.length };
  });
}

export function sparkline(list, range, key = 'sessions', points = 12) {
  const series = dailySeries(list, range);
  const size = Math.max(1, Math.ceil(series.length / points));
  const out = [];
  for (let i = 0; i < series.length; i += size) out.push({ v: sum(series.slice(i, i + size), (x) => x[key]) });
  return out;
}

export const pctChange = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0);
