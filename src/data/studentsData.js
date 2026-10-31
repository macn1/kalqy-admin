import { mulberry32, pick, between, DAY } from './seedUtils.js';

// Every record is fictional. No facial data, recordings or real personal details are stored.
const FIRST = ['Aarav', 'Diya', 'Noah', 'Anaya', 'Vihaan', 'Myra', 'Kabir', 'Ira', 'Reyansh', 'Zoya', 'Ishaan', 'Navya', 'Arjun', 'Saanvi', 'Ayaan', 'Tara', 'Rehan', 'Aadhya', 'Dev', 'Meher', 'Advik', 'Kiara', 'Yash', 'Anika', 'Rudra', 'Pihu', 'Samar', 'Riya', 'Veer', 'Mishka'];
const LAST = ['Menon', 'Nair', 'Thomas', 'Pillai', 'Varma', 'Iyer', 'Kurian', 'George', 'Reddy', 'Khan', 'Das', 'Rao', 'Joseph', 'Mathew', 'Krishnan', 'Fernandes'];
const STRENGTHS = ['Counting & numbers', 'Letter recognition', 'Colour matching', 'Balance & coordination', 'Following instructions', 'Teamwork', 'Creative storytelling', 'Pattern spotting', 'Listening skills', 'Gross motor control'];
const PRACTISE = ['Number sequencing', 'Letter sounds', 'Shape sorting', 'Hopping & jumping', 'Turn-taking', 'Focus duration', 'Vocabulary building', 'Left/right awareness'];
const STATUSES = ['On track', 'On track', 'On track', 'Excelling', 'Needs attention', 'New'];
const PARENT_FIRST = ['Rajesh', 'Sunita', 'Anil', 'Deepa', 'Thomas', 'Mary', 'Faisal', 'Neha', 'Prakash', 'Latha', 'Sanjay', 'Rekha', 'Biju', 'Shalini', 'Manoj', 'Asha', 'Ravi', 'Geeta', 'Kiran', 'Pooja', 'Naveen', 'Sarita', 'Abdul', 'Jyothi', 'Mohan', 'Smitha'];

export const buildParents = (now) =>
  PARENT_FIRST.map((first, i) => {
    const rng = mulberry32(900 + i);
    return {
      id: `PAR-${201 + i}`,
      name: `${first} ${LAST[(i * 3) % LAST.length]}`,
      email: `parent${i + 1}@example.com`,
      phone: `+91 90000 ${String(10000 + i * 37).slice(-5)}`,
      studentIds: [],
      registeredAt: new Date(now - between(rng, 10, 160) * DAY).toISOString(),
      lastActive: new Date(now - between(rng, 60, 4000) * 60000).toISOString(),
      notifications: { weeklyReport: rng() > 0.2, sessionAlerts: rng() > 0.5, productUpdates: rng() > 0.6 },
      status: i === 7 ? 'Invited' : i === 19 ? 'Suspended' : 'Active',
    };
  });

const FIXED = { 0: ['Aarav', 'Menon', 4, 0], 1: ['Diya', 'Nair', 5, 1], 2: ['Noah', 'Thomas', 3, 2] };

export const buildStudents = (now, schools, teachers, parents) =>
  Array.from({ length: 30 }, (_, i) => {
    const rng = mulberry32(100 + i);
    const f = FIXED[i];
    const school = schools[f ? f[3] : i % schools.length];
    const schoolTeachers = teachers.filter((t) => t.schoolId === school.id);
    const teacher = schoolTeachers.length ? pick(rng, schoolTeachers) : teachers[0];
    const parent = parents[i < 26 ? i : i - 26 + 3]; // a few siblings share a parent
    parent.studentIds.push(`STU-${1001 + i}`);
    return {
      id: `STU-${1001 + i}`,
      firstName: f ? f[0] : FIRST[i % FIRST.length],
      lastName: f ? f[1] : pick(rng, LAST),
      age: f ? f[2] : between(rng, 3, 5),
      schoolId: school.id,
      teacherId: teacher.id,
      parentId: parent.id,
      status: i === 4 ? 'New' : STATUSES[Math.floor(rng() * STATUSES.length)],
      archived: false,
      registeredAt: new Date(now - between(rng, 5, 150) * DAY).toISOString(),
      strengths: [pick(rng, STRENGTHS), pick(rng, STRENGTHS)].filter((v, idx, a) => a.indexOf(v) === idx),
      practise: [pick(rng, PRACTISE), pick(rng, PRACTISE)].filter((v, idx, a) => a.indexOf(v) === idx),
      assignedGameIds: ['GAME-01', 'GAME-02', 'GAME-03', 'GAME-04', 'GAME-05'].filter(() => rng() > 0.3),
      engagementBias: 0.4 + rng() * 1.2, // drives how many sessions the seed generates
    };
  });
