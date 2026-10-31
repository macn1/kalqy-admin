// Mock asynchronous data service backed by localStorage.
// Every function returns a Promise so pages can later be wired to a real API with no UI changes.
// Nothing here talks to a network or to the production KALQY website.
import { buildSchools, buildTeachers } from '../data/schoolsData.js';
import { buildParents, buildStudents } from '../data/studentsData.js';
import { buildGames } from '../data/gamesData.js';
import { buildSessions } from '../data/sessionsData.js';
import { buildLeads } from '../data/leadsData.js';
import { buildTeam, DEFAULT_PERMISSIONS } from '../data/teamData.js';
import { buildWebsite } from '../data/websiteData.js';
import { buildDownloads, buildActivity, buildNotifications } from '../data/analyticsData.js';

const PREFIX = 'kalqy_demo_v1:';
const LATENCY = 220;

export const ARRAY_COLLECTIONS = ['schools', 'teachers', 'parents', 'students', 'games', 'sessions', 'leads', 'team', 'downloads', 'activity', 'notifications'];
export const OBJECT_COLLECTIONS = ['website', 'permissions'];
const ID_PREFIX = { schools: 'SCH-', teachers: 'TCH-', parents: 'PAR-', students: 'STU-', games: 'GAME-', sessions: 'SES-', leads: 'LD-', team: 'USR-', activity: 'ACT-', notifications: 'NOT-', downloads: 'DL-' };
const ID_START = { schools: 101, teachers: 301, parents: 201, students: 1001, games: 1, sessions: 10001, leads: 2001, team: 1, activity: 1, notifications: 1, downloads: 5001 };
const ID_PAD = { games: 2 };

let cache = null;
const listeners = new Set();
const wait = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));

function persist(name) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(cache[name]));
  } catch {
    /* storage full or blocked: data stays in memory for this session */
  }
}

function seed() {
  const now = Date.now();
  const schools = buildSchools(now);
  const teachers = buildTeachers(now, schools);
  const parents = buildParents(now);
  const students = buildStudents(now, schools, teachers, parents);
  const games = buildGames(now);
  return {
    schools, teachers, parents, students, games,
    sessions: buildSessions(now, students, games),
    leads: buildLeads(now),
    team: buildTeam(now),
    downloads: buildDownloads(now),
    activity: buildActivity(now),
    notifications: buildNotifications(now),
    website: buildWebsite(),
    permissions: clone(DEFAULT_PERMISSIONS),
  };
}

function ensureLoaded() {
  if (cache) return cache;
  let fresh = true;
  try { fresh = !localStorage.getItem(PREFIX + 'meta'); } catch { /* ignore */ }
  if (fresh) {
    cache = seed();
    try {
      Object.keys(cache).forEach(persist);
      localStorage.setItem(PREFIX + 'meta', JSON.stringify({ seededAt: new Date().toISOString() }));
    } catch { /* ignore */ }
  } else {
    cache = {};
    const defaults = seed();
    [...ARRAY_COLLECTIONS, ...OBJECT_COLLECTIONS].forEach((name) => {
      try {
        const raw = localStorage.getItem(PREFIX + name);
        cache[name] = raw ? JSON.parse(raw) : defaults[name];
      } catch {
        cache[name] = defaults[name];
      }
    });
  }
  return cache;
}

const emit = (name) => listeners.forEach((fn) => fn(name));
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function nextId(name) {
  const list = ensureLoaded()[name];
  const prefix = ID_PREFIX[name] || 'ID-';
  const nums = list.map((r) => parseInt(String(r.id).replace(prefix, ''), 10)).filter(Number.isFinite);
  const n = nums.length ? Math.max(...nums) + 1 : ID_START[name] || 1;
  return prefix + String(n).padStart(ID_PAD[name] || 0, '0');
}

/** Synchronous snapshot for derived hooks. */
export const peek = (name) => clone(ensureLoaded()[name]);

export async function listRecords(name) {
  await wait();
  return clone(ensureLoaded()[name] ?? []);
}

export async function getRecord(name, id) {
  await wait(120);
  return clone(ensureLoaded()[name].find((r) => r.id === id) || null);
}

export async function createRecord(name, data) {
  await wait(160);
  const db = ensureLoaded();
  const record = { ...data, id: data.id || nextId(name) };
  db[name] = [record, ...db[name]];
  persist(name);
  emit(name);
  return clone(record);
}

export async function updateRecord(name, id, patch) {
  await wait(160);
  const db = ensureLoaded();
  let updated = null;
  db[name] = db[name].map((r) => (r.id === id ? (updated = { ...r, ...patch, id }) : r));
  if (!updated) throw new Error(`${name} record ${id} not found`);
  persist(name);
  emit(name);
  return clone(updated);
}

export async function removeRecord(name, id) {
  await wait(160);
  const db = ensureLoaded();
  db[name] = db[name].filter((r) => r.id !== id);
  persist(name);
  emit(name);
}

export async function getObject(name) {
  await wait(120);
  return clone(ensureLoaded()[name]);
}

export async function saveObject(name, value) {
  await wait(160);
  ensureLoaded()[name] = clone(value);
  persist(name);
  emit(name);
}

/** Restore the original seeded sample data. */
export async function resetDemoData() {
  await wait(300);
  cache = seed();
  Object.keys(cache).forEach(persist);
  try { localStorage.setItem(PREFIX + 'meta', JSON.stringify({ seededAt: new Date().toISOString() })); } catch { /* ignore */ }
  [...ARRAY_COLLECTIONS, ...OBJECT_COLLECTIONS].forEach(emit);
}

/** Remove every sample record (lets you see empty states). Settings are kept. */
export async function clearDemoData() {
  await wait(300);
  const db = ensureLoaded();
  ARRAY_COLLECTIONS.forEach((name) => { db[name] = []; persist(name); emit(name); });
}
