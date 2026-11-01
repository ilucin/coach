// HTTP server: JSON API under /api, static PWA from web/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import * as store from './store.js';
import { sessionReport, weekReport, history, bests, isoWeek, habitsAt, weekHabits, FOOD_TAGS } from './core.js';

const WEB = new URL('../web', import.meta.url).pathname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

const json = (res, code, v) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(v)); };
const body = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => ok(b ? JSON.parse(b) : {})); });

function workoutView(date) {
  return { workout: store.workout(date), report: sessionReport(store.workouts(), date) };
}

function dayView(date) {
  const days = store.days();
  return { day: store.day(date), habits: habitsAt(days, date), weights: days.filter((d) => d.weight).map((d) => ({ date: d.date, kg: d.weight })) };
}

async function api(req, res, parts) {
  const [a, b, c] = parts;
  const m = req.method;
  if (a === 'health') return json(res, 200, { ok: true, app: 'coach' });
  if (a === 'exercises' && m === 'GET') return json(res, 200, store.exercises());
  if (a === 'exercises' && m === 'POST') {
    const { name } = await body(req);
    if (!name?.trim()) return json(res, 400, { error: 'name' });
    const ex = store.addExercise(name.trim()); store.commit(`exercise: ${ex.name}`);
    return json(res, 200, ex);
  }
  if (a === 'summary') {
    const ws = store.workouts();
    return json(res, 200, store.exercises().map((ex) => {
      const h = history(ws, ex.id), last = h.at(-1), prev = h.at(-2);
      return { ...ex, sessions: h.length, last: last?.date, e1rm: last?.metrics.e1rm.value,
        trend: last && prev ? Math.round(((last.metrics.e1rm.value - prev.metrics.e1rm.value) / prev.metrics.e1rm.value) * 1000) / 10 : null };
    }));
  }
  if (a === 'workouts') return json(res, 200, store.workouts().map((w) => ({ date: w.date, exercises: w.entries.map((e) => e.exercise) })).reverse());
  if (a === 'workout' && b && /^\d{4}-\d\d-\d\d$/.test(b)) {
    if (m === 'GET' && !c) return json(res, 200, workoutView(b));
    const w = store.workout(b);
    const q = await body(req);
    if (c === 'sets' && m === 'POST') {
      const kg = Number(q.kg), reps = Number(q.reps);
      if (!q.exercise || !(kg >= 0) || !(reps > 0)) return json(res, 400, { error: 'exercise, kg, reps' });
      const set = { kg, reps };
      if (q.rpe != null && q.rpe !== '') set.rpe = Number(q.rpe);
      store.entry(w, q.exercise).sets.push(set);
    } else if (c === 'sets' && m === 'DELETE') {
      store.entry(w, q.exercise).sets.splice(q.index, 1);
    } else if (c === 'warmup' && m === 'POST') {
      store.entry(w, q.exercise).warmup = !!q.warmup;
    } else if (c === 'note' && m === 'POST') {
      if (q.exercise) store.entry(w, q.exercise).note = q.note || undefined; else w.note = q.note || undefined;
    } else return json(res, 404, { error: 'not found' });
    store.saveWorkout(w); store.commit(`trening ${b}: ${q.exercise || 'bilješka'}`);
    return json(res, 200, workoutView(b));
  }
  if (a === 'day' && b && /^\d{4}-\d\d-\d\d$/.test(b)) {
    if (m === 'GET') return json(res, 200, dayView(b));
    const d = store.day(b), q = await body(req);
    let what;
    if (!c && m === 'POST') {
      if ('sleep' in q) d.sleep = q.sleep >= 1 && q.sleep <= 5 ? Math.round(q.sleep) : undefined;
      if ('weight' in q) d.weight = Number(q.weight) > 0 ? Math.round(q.weight * 10) / 10 : undefined;
      if ('note' in q) d.note = q.note || undefined;
      what = Object.keys(q).join(', ');
    } else if (c === 'food' && m === 'POST') {
      if (!q.text?.trim()) return json(res, 400, { error: 'text' });
      const f = { text: q.text.trim(), tags: FOOD_TAGS.filter((t) => q.tags?.includes(t)) };
      if (q.time) f.time = q.time;
      d.food.push(f); what = f.text;
    } else if (c === 'food' && m === 'DELETE') {
      what = `makni ${d.food.splice(q.index, 1)[0]?.text}`;
    } else return json(res, 404, { error: 'not found' });
    store.saveDay(d); store.commit(`dan ${b}: ${what}`);
    return json(res, 200, dayView(b));
  }
  if (a === 'exercise' && b) {
    const ex = store.exercises().find((e) => e.id === b);
    const h = history(store.workouts(), b);
    const best = bests(h.map((x) => x.metrics));
    return json(res, 200, { exercise: ex, history: h.reverse(), best });
  }
  if (a === 'weeks') {
    const ws = [...store.workouts(), ...store.days()].map((w) => isoWeek(w.date));
    const all = [...new Set([...ws, ...store.reportWeeks()])].sort().reverse();
    return json(res, 200, all);
  }
  if (a === 'week' && b) return json(res, 200, { report: weekReport(store.workouts(), b), habits: weekHabits(store.days(), b, store.today()), text: store.readReport(b) });
  return json(res, 404, { error: 'not found' });
}

export function serve(port) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname.slice(5).split('/').filter(Boolean).map(decodeURIComponent));
      if (url.pathname === '/core.js') { res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' }); return fs.createReadStream(new URL('./core.js', import.meta.url)).pipe(res); }
      let f = path.join(WEB, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(WEB, 'index.html');
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      fs.createReadStream(f).pipe(res);
    } catch (e) {
      json(res, 500, { error: String(e.message || e) });
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`coach server up on :${port}`));
  return server;
}
