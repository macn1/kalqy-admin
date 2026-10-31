import { DAY } from './seedUtils.js';

export const ROLES = ['Super Admin', 'Administrator', 'School Administrator', 'Teacher', 'Analyst'];
export const RESOURCES = [
  { key: 'students', label: 'Students' },
  { key: 'schools', label: 'Schools' },
  { key: 'games', label: 'Games' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'website', label: 'Website content' },
  { key: 'team', label: 'Team management' },
  { key: 'settings', label: 'Settings' },
];

// 'none' < 'view' < 'edit'. Simulated in the browser only; NOT real security.
const E = 'edit', V = 'view', N = 'none';
export const DEFAULT_PERMISSIONS = {
  'Super Admin': { students: E, schools: E, games: E, analytics: E, reports: E, website: E, team: E, settings: E },
  Administrator: { students: E, schools: E, games: E, analytics: E, reports: E, website: E, team: V, settings: V },
  'School Administrator': { students: E, schools: V, games: V, analytics: V, reports: E, website: N, team: N, settings: N },
  Teacher: { students: V, schools: V, games: V, analytics: V, reports: V, website: N, team: N, settings: N },
  Analyst: { students: V, schools: V, games: V, analytics: E, reports: E, website: N, team: N, settings: N },
};

export const buildTeam = (now) => {
  const rows = [
    ['Admin User', 'admin@kalqy.in', 'Super Admin', 'Active', 20],
    ['Maya Raghavan', 'maya@example.com', 'Administrator', 'Active', 95],
    ['Sunil Varghese', 'sunil@example.com', 'School Administrator', 'Active', 600],
    ['Reena Thomas', 'reena@example.com', 'Teacher', 'Active', 1400],
    ['Karthik Subramanian', 'karthik@example.com', 'Analyst', 'Active', 240],
    ['Nandini Das', 'nandini@example.com', 'Teacher', 'Invited', 0],
    ['Paul Abraham', 'paul@example.com', 'School Administrator', 'Suspended', 9000],
    ['Zara Ali', 'zara@example.com', 'Analyst', 'Active', 3200],
  ];
  return rows.map(([name, email, role, status, minsAgo], i) => ({
    id: `USR-${i + 1}`,
    name,
    email,
    role,
    status,
    lastActive: status === 'Invited' ? '' : new Date(now - minsAgo * 60000 - (i > 5 ? DAY : 0)).toISOString(),
  }));
};
