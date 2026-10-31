import { mulberry32, between, weighted, pick, DAY } from './seedUtils.js';

export const PLATFORMS = ['Windows', 'macOS Apple Silicon', 'macOS Intel'];
const REGIONS = ['Kochi, IN', 'Bengaluru, IN', 'Chennai, IN', 'Kozhikode, IN', 'Hyderabad, IN', 'Pune, IN', 'Dubai, AE', 'Singapore, SG'];

// Fictional download events. NOT real website analytics.
export const buildDownloads = (now) => {
  const rng = mulberry32(31337);
  const out = [];
  for (let d = 89; d >= 0; d--) {
    const count = Math.round(4 + ((89 - d) / 89) * 5 + between(rng, -2, 4));
    for (let k = 0; k < count; k++) {
      const platform = weighted(rng, PLATFORMS, [52, 33, 15]);
      const ts = new Date(now - d * DAY);
      ts.setHours(between(rng, 7, 22), between(rng, 0, 59), 0, 0);
      if (ts.getTime() > now) continue;
      out.push({ id: '', platform, region: pick(rng, REGIONS), version: platform === 'Windows' ? '1.4.2' : '1.4.0', at: ts.toISOString() });
    }
  }
  out.sort((a, b) => a.at.localeCompare(b.at));
  out.forEach((e, i) => (e.id = `DL-${5001 + i}`));
  return out;
};

export const buildActivity = (now) => {
  const m = 60000;
  return [
    { id: 'ACT-1', type: 'session', text: 'Aarav Menon completed a mathematics session in Math Quest', at: new Date(now - 4 * m).toISOString() },
    { id: 'ACT-2', type: 'school', text: 'Blossom Buds Kindergarten registered a new classroom', at: new Date(now - 26 * m).toISOString() },
    { id: 'ACT-3', type: 'report', text: 'Meera Krishnan generated a weekly learning report', at: new Date(now - 71 * m).toISOString() },
    { id: 'ACT-4', type: 'lead', text: 'New demo request received from Tiny Tots Playhouse', at: new Date(now - 3 * 60 * m).toISOString() },
    { id: 'ACT-5', type: 'content', text: 'Game content update published: Plant Power', at: new Date(now - 7 * 60 * m).toISOString() },
    { id: 'ACT-6', type: 'session', text: 'Diya Nair completed an Egg Game session', at: new Date(now - 26 * 60 * m).toISOString() },
  ];
};

export const buildNotifications = (now) => [
  { id: 'NOT-1', title: 'New demo request', text: 'Tiny Tots Playhouse asked for a demo.', at: new Date(now - 3 * 3600000).toISOString(), read: false },
  { id: 'NOT-2', title: 'Report ready', text: 'Weekly learning summary generated.', at: new Date(now - 9 * 3600000).toISOString(), read: false },
  { id: 'NOT-3', title: 'Trial ending soon', text: 'Tiny Steps Academy trial ends in 5 days.', at: new Date(now - 30 * 3600000).toISOString(), read: false },
  { id: 'NOT-4', title: 'Game draft saved', text: 'Word Jungle was saved as draft.', at: new Date(now - 52 * 3600000).toISOString(), read: true },
];
