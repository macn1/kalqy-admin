import { mulberry32, between, weighted, DAY } from './seedUtils.js';

// Sessions are generated from the shared student/game records so every page agrees.
const GAME_WEIGHTS = { 'GAME-01': 24, 'GAME-02': 20, 'GAME-03': 17, 'GAME-04': 16, 'GAME-05': 12, 'GAME-06': 2 };
const DURATION = { 'GAME-01': [7, 14], 'GAME-02': [8, 16], 'GAME-03': [6, 13], 'GAME-04': [9, 18], 'GAME-05': [10, 19], 'GAME-06': [5, 10] };
export const SKILLS = {
  Mathematics: ['Counting', 'Comparing quantities', 'Simple addition'],
  'English & Language': ['Letter recognition', 'Phonics', 'Vocabulary'],
  Science: ['Observation', 'Cause & effect', 'Nature awareness'],
  'Colours & Matching': ['Colour recognition', 'Matching', 'Visual attention'],
};

export const buildSessions = (now, students, games) => {
  const rng = mulberry32(777);
  const out = [];
  const byId = Object.fromEntries(games.map((g) => [g.id, g]));
  const gameIds = Object.keys(GAME_WEIGHTS);
  const weights = Object.values(GAME_WEIGHTS);
  const bias = students.map((s) => s.engagementBias);
  for (let d = 119; d >= 0; d--) {
    const dayStart = new Date(now - d * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dow = dayStart.getDay();
    const weekend = dow === 0 || dow === 6;
    const growth = 0.7 + ((119 - d) / 119) * 0.6; // activity grows over time
    const count = Math.round((weekend ? 3 : 9) * growth + between(rng, -2, 3));
    for (let k = 0; k < count; k++) {
      const student = weighted(rng, students, bias);
      if (new Date(student.registeredAt).getTime() > dayStart.getTime() + DAY) continue;
      const gameId = weighted(rng, gameIds, weights);
      const game = byId[gameId];
      if (!game) continue;
      const [lo, hi] = DURATION[gameId];
      const r = rng();
      const completion = r < 0.74 ? 'Completed' : r < 0.9 ? 'Partial' : 'Abandoned';
      const pct = completion === 'Completed' ? 100 : completion === 'Partial' ? between(rng, 45, 90) : between(rng, 8, 40);
      const hour = weekend ? between(rng, 9, 18) : between(rng, 8, 15);
      const startedAt = dayStart.getTime() + hour * 3600000 + between(rng, 0, 59) * 60000;
      if (startedAt > now) continue;
      const base = student.status === 'Excelling' ? 84 : student.status === 'Needs attention' ? 58 : 72;
      out.push({
        id: '',
        studentId: student.id,
        schoolId: student.schoolId,
        teacherId: student.teacherId,
        gameId,
        category: game.category,
        durationMin: between(rng, lo, hi),
        score: Math.max(20, Math.min(100, base + between(rng, -14, 14) - (completion === 'Abandoned' ? 18 : 0))),
        completion,
        completionPct: pct,
        skills: SKILLS[game.category].filter(() => rng() > 0.35).slice(0, 2),
        startedAt: new Date(startedAt).toISOString(),
      });
    }
  }
  out.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  out.forEach((s, i) => (s.id = `SES-${10001 + i}`));
  return out;
};
