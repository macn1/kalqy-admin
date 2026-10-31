// Fake KALQY super-admin API for previewing the UI without the real backend.
// Run: npm run mock   (listens on :8080, same routes as kalqy_super_admin.postman_collection.json)
import http from 'node:http';

const PORT = process.env.PORT || 8080;
const day = (n) => new Date(Date.now() - n * 864e5).toISOString();
const ok = (data) => ({ success: true, data });

const parents = Array.from({ length: 58 }, (_, i) => ({
  parent_id: `p${i + 1}`,
  name: ['Aarav Mehta', 'Diya Sharma', 'Kabir Rao', 'Isha Nair', 'Rohan Iyer', 'Meera Das', 'Vikram Singh', 'Ananya Pillai'][i % 8] + (i > 7 ? ` ${i}` : ''),
  email: `parent${i + 1}@example.com`,
  child_count: (i % 3) + 1,
  plan: ['family', 'school', 'free'][i % 3],
  subscription_status: ['active', 'trialing', 'canceled', 'past_due'][i % 4],
  lifetime_value_minor: (i % 7) * 54900 + 54900,
  outstanding_minor: i % 5 === 0 ? 54900 : 0,
  created_at: day(i * 3 + 2),
}));
const engines = ['Butterfly Match', 'Number Garden', 'Shape Sorter', 'Story Builder'].map((name, i) => ({
  id: `e${i + 1}`, name, slug: name.toLowerCase().replace(/ /g, '-'), description: `Engine ${i + 1} generates ${name.toLowerCase()} challenges.`, is_active: true,
}));
const adventures = ['Butterfly Meadow', 'Counting Cove', 'Shape Safari', 'Colour Carnival', 'Story Forest'].map((title, i) => ({
  id: `a${i + 1}`, title, slug: title.toLowerCase().replace(/ /g, '-'), engine: engines[i % 4].name, level_count: 5, is_published: i !== 4,
  short_description: `Explore ${title}.`, image_url: `assets/images/${i}.png`, card_bg_color: 'F2F7EE', tag_bg_color: 'E2F0DD', tag_text_color: '609B59',
  tags: ['Adventure', 'Memory'], gallery_images: [], benefits: [{ title: 'Boosts Memory', description: 'Improves recall.', icon: 'leaf', icon_bg_color: 'F1F8E9', icon_color: '4CAF50' }],
  play_time_label: '10-15 min', difficulty_label: 'Easy', difficulty_color: '4CAF50',
}));
const levels = Array.from({ length: 5 }, (_, i) => ({ id: `l${i + 1}`, number: i + 1, title: `Level ${i + 1}`, kind: i ? 'variation' : 'intro', assist_level: ['full', 'partial', 'none'][i % 3], difficulty: (i % 3) + 1, challenge_count: 3, pass_threshold: 0.6 }));
let templates = Array.from({ length: 12 }, (_, i) => ({ id: `t${i + 1}`, slug: `match_color__colors__a${3 + (i % 3)}_d${(i % 3) + 1}`, kind: 'match_color', age: 3 + (i % 3), curriculum: 'colors', difficulty: (i % 3) + 1, weight: 1 }));
const plans = [
  { slug: 'free', name: 'Free', amount_minor: 0, currency: 'INR', interval: 'month', max_children: 1, trial_days: 0, features: ['1 child profile'] },
  { slug: 'family', name: 'KALQY Family', amount_minor: 54900, currency: 'INR', interval: 'month', max_children: 4, trial_days: 7, features: ['4 child profiles', 'Weekly reports'], description: 'For households' },
  { slug: 'school', name: 'KALQY School', amount_minor: 999000, currency: 'INR', interval: 'year', max_children: 30, trial_days: 30, features: ['30 child profiles', 'Teacher reporting'] },
];
let filters = [
  { id: 'f1', scope: 'date_range', value: '7 Days', label: 'Last 7 days', sort_order: 1, is_active: true, meta: { days: 7 } },
  { id: 'f2', scope: 'date_range', value: '30 Days', label: 'Last 30 days', sort_order: 2, is_active: true, meta: { days: 30 } },
  { id: 'f3', scope: 'date_range', value: '90 Days', label: 'Last 90 days', sort_order: 3, is_active: false, meta: { days: 90 } },
];
const invoices = Array.from({ length: 40 }, (_, i) => ({
  number: `INV-${1000 + i}`, parent_email: `parent${(i % 20) + 1}@example.com`, status: ['paid', 'paid', 'open', 'failed'][i % 4], amount_minor: [54900, 999000, 54900][i % 3], currency: 'INR', issued_at: day(i * 2),
}));

const routes = [
  ['POST', /^\/api\/v1\/auth\/login$/, () => ok({ access_token: 'mock-access', refresh_token: 'mock-refresh', role: 'super_admin' })],
  ['POST', /^\/api\/v1\/auth\/otp\/request$/, () => ok({ debug_code: '123456', expires_in_seconds: 300 })],
  ['POST', /^\/api\/v1\/auth\/otp\/verify$/, () => ok({ access_token: 'mock-access', refresh_token: 'mock-refresh', role: 'super_admin' })],
  ['POST', /^\/api\/v1\/auth\/refresh$/, () => ok({ access_token: 'mock-access' })],
  ['GET', /^\/api\/v1\/admin\/overview$/, () => ok({
    users: { parents: 1284, children: 2310 }, content: { adventures: 5, templates: 148 }, total_plays: 48210, revenue_minor: 18450000, mrr_minor: 4120000,
    per_engine: engines.map((e, i) => ({ engine: e.name, plays: 15000 - i * 3200 })),
    activity_trend: Array.from({ length: 30 }, (_, i) => ({ date: day(29 - i).slice(0, 10), plays: 900 + ((i * 137) % 700) })),
  })],
  ['GET', /^\/api\/v1\/admin\/analytics\/engagement$/, (u) => ok(Array.from({ length: +(u.searchParams.get('days') || 30) }, (_, i, a = { length: +(u.searchParams.get('days') || 30) }) => ({ date: day(a.length - 1 - i).slice(0, 10), sessions: 300 + ((i * 97) % 500), active_children: 120 + ((i * 53) % 200) })))],
  ['GET', /^\/api\/v1\/admin\/parents$/, (u) => {
    const s = (u.searchParams.get('search') || '').toLowerCase(); const l = +u.searchParams.get('limit') || 25; const o = +u.searchParams.get('offset') || 0;
    const all = parents.filter((p) => !s || `${p.name} ${p.email}`.toLowerCase().includes(s));
    return ok({ items: all.slice(o, o + l), total: all.length });
  }],
  ['GET', /^\/api\/v1\/admin\/parents\/([^/]+)$/, (u, m) => { const p = parents.find((x) => x.parent_id === m[1]) || parents[0]; return ok({ ...p, children: Array.from({ length: p.child_count }, (_, i) => ({ child_id: `c${m[1]}-${i}`, name: ['Amar', 'Tara', 'Zoya'][i], age: 4 + i, sessions: 12 * (i + 1) })), subscriptions: [{ plan: p.plan, status: p.subscription_status, started_at: day(90) }], invoices: invoices.slice(0, 3) }); }],
  ['GET', /^\/api\/v1\/admin\/children\/([^/]+)$/, () => ok({ name: 'Amar', age: 5, total_sessions: 42, last_played_at: day(1), insight: { summary: 'Watches carefully before joining in.', traits: ['Cautious', 'Short Focus'] } })],
  ['GET', /^\/api\/v1\/admin\/children\/([^/]+)\/progress$/, () => ok({ levels_completed: 9, stars: 24, accuracy: 0.82, by_curriculum: [{ curriculum: 'colors', accuracy: 0.9, attempts: 30 }, { curriculum: 'shapes', accuracy: 0.74, attempts: 22 }] })],
  ['GET', /^\/api\/v1\/admin\/children\/([^/]+)\/sessions$/, () => ok({ items: Array.from({ length: 8 }, (_, i) => ({ session_id: `s${i}`, adventure: adventures[i % 5].title, started_at: day(i), duration_seconds: 300 + i * 40, score: 60 + i * 4 })), total: 8 })],
  ['PATCH', /^\/api\/v1\/admin\/children\/([^/]+)\/insight$/, () => ok({ ok: true })],
  ['GET', /^\/api\/v1\/admin\/billing\/summary$/, () => ok({ mrr_minor: 4120000, collected_minor: 18450000, outstanding_minor: 640000, active_subscriptions: 812, by_plan: plans.map((p, i) => ({ plan: p.name, subscribers: 600 - i * 220, revenue_minor: (3 - i) * 3100000 })) })],
  ['GET', /^\/api\/v1\/admin\/billing\/invoices$/, (u) => {
    const st = u.searchParams.get('status'); const l = +u.searchParams.get('limit') || 25; const o = +u.searchParams.get('offset') || 0;
    const all = invoices.filter((i) => !st || i.status === st); return ok({ items: all.slice(o, o + l), total: all.length });
  }],
  ['GET', /^\/api\/v1\/admin\/billing\/plans$/, () => ok(plans)],
  ['POST', /^\/api\/v1\/admin\/billing\/plans$/, (u, m, b) => { plans.push({ currency: 'INR', ...b }); return ok(b); }],
  ['PATCH', /^\/api\/v1\/admin\/billing\/plans\/([^/]+)$/, (u, m, b) => { Object.assign(plans.find((p) => p.slug === m[1]) || {}, b); return ok(b); }],
  ['GET', /^\/api\/v1\/admin\/content\/engines$/, () => ok(engines)],
  ['GET', /^\/api\/v1\/admin\/content\/engines\/([^/]+)\/kinds$/, () => ok(['match_color', 'match_shape', 'count_objects'])],
  ['PATCH', /^\/api\/v1\/admin\/content\/engines\/([^/]+)$/, (u, m, b) => { Object.assign(engines.find((e) => e.id === m[1]) || {}, b); return ok(b); }],
  ['GET', /^\/api\/v1\/admin\/content\/adventures$/, () => ok(adventures.map(({ id, title, slug, engine, level_count, is_published }) => ({ id, title, slug, engine, level_count, is_published })))],
  ['GET', /^\/api\/v1\/admin\/content\/adventures\/([^/]+)$/, (u, m) => ok(adventures.find((a) => a.id === m[1]) || adventures[0])],
  ['PATCH', /^\/api\/v1\/admin\/content\/adventures\/([^/]+)$/, (u, m, b) => { Object.assign(adventures.find((a) => a.id === m[1]) || {}, b); return ok(b); }],
  ['GET', /^\/api\/v1\/admin\/content\/adventures\/([^/]+)\/levels$/, () => ok(levels)],
  ['POST', /^\/api\/v1\/admin\/content\/adventures\/([^/]+)\/levels$/, (u, m, b) => { levels.push({ id: `l${levels.length + 1}`, ...b }); return ok(b); }],
  ['PATCH', /^\/api\/v1\/admin\/content\/story-levels\/([^/]+)$/, (u, m, b) => { Object.assign(levels.find((l) => l.id === m[1]) || {}, b); return ok(b); }],
  ['GET', /^\/api\/v1\/admin\/content\/templates$/, (u) => { const l = +u.searchParams.get('limit') || 25; const o = +u.searchParams.get('offset') || 0; return ok({ items: templates.slice(o, o + l), total: templates.length }); }],
  ['POST', /^\/api\/v1\/admin\/content\/templates$/, (u, m, b) => { templates = [{ id: `t${templates.length + 1}`, ...b }, ...templates]; return ok(b); }],
  ['POST', /^\/api\/v1\/admin\/content\/templates\/([^/]+)\/preview$/, (u, m, b) => ok({ assist_level: b.assist_level, challenge: { prompt: 'Guide each butterfly to its colour', butterflies: [{ color: 'red' }, { color: 'blue' }], flowers: [{ color: 'red' }, { color: 'blue' }, { color: 'green' }] } })],
  ['PATCH', /^\/api\/v1\/admin\/content\/templates\/([^/]+)$/, (u, m, b) => { Object.assign(templates.find((t) => t.id === m[1]) || {}, b); return ok(b); }],
  ['GET', /^\/api\/v1\/admin\/filters\/([^/]+)$/, (u, m) => ok(filters.filter((f) => f.scope === m[1]))],
  ['POST', /^\/api\/v1\/admin\/filters$/, (u, m, b) => { filters.push({ id: `f${Date.now()}`, is_active: true, ...b }); return ok(b); }],
  ['PATCH', /^\/api\/v1\/admin\/filters\/([^/]+)$/, (u, m, b) => { Object.assign(filters.find((f) => f.id === m[1]) || {}, b); return ok(b); }],
  ['DELETE', /^\/api\/v1\/admin\/filters\/([^/]+)$/, (u, m) => { filters = filters.filter((f) => f.id !== m[1]); return ok({ deleted: true }); }],
];

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const hit = routes.map(([m, re, fn]) => (m === req.method && re.exec(u.pathname) ? { fn, match: re.exec(u.pathname) } : null)).find(Boolean);
    res.setHeader('Content-Type', 'application/json');
    setTimeout(() => {
      if (!hit) { res.statusCode = 404; return res.end(JSON.stringify({ success: false, message: 'Not found' })); }
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
      return res.end(JSON.stringify(hit.fn(u, hit.match, body)));
    }, 150);
  });
}).listen(PORT, () => console.log(`Mock KALQY API on http://localhost:${PORT}`));
