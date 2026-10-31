// JSON files under the data dir: exercises.json, workouts/<date>.json, reports/<week>.md.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

export function dataDir() {
  return path.resolve(process.env.COACH_DATA || new URL('../data', import.meta.url).pathname);
}
const p = (...xs) => path.join(dataDir(), ...xs);
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const writeJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
};

export const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const exercises = () => readJson(p('exercises.json'), []);

export function findExercise(name) {
  const s = slug(name);
  return exercises().find((e) => e.id === s || slug(e.name) === s || (e.aliases || []).some((a) => slug(a) === s));
}

export function addExercise(name, aliases = []) {
  const found = findExercise(name);
  if (found) return found;
  const list = exercises();
  const ex = { id: slug(name), name, aliases };
  list.push(ex);
  writeJson(p('exercises.json'), list);
  return ex;
}

export function workouts() {
  const dir = p('workouts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => readJson(path.join(dir, f)));
}

export const workout = (date) => readJson(p('workouts', `${date}.json`), { date, entries: [] });
export const saveWorkout = (w) => {
  if (!w.entries.length && !w.note) fs.rmSync(p('workouts', `${w.date}.json`), { force: true });
  else writeJson(p('workouts', `${w.date}.json`), w);
};

// Get (or create) the entry for an exercise in a workout.
export function entry(w, exerciseId) {
  let e = w.entries.find((x) => x.exercise === exerciseId);
  if (!e) w.entries.push((e = { exercise: exerciseId, warmup: false, sets: [] }));
  return e;
}

export const readReport = (week) => (fs.existsSync(p('reports', `${week}.md`)) ? fs.readFileSync(p('reports', `${week}.md`), 'utf8') : null);
export const reportWeeks = () =>
  fs.existsSync(p('reports')) ? fs.readdirSync(p('reports')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort().reverse() : [];
export function writeReport(week, md) {
  fs.mkdirSync(p('reports'), { recursive: true });
  fs.writeFileSync(p('reports', `${week}.md`), md);
}

// Commit data changes in the background when the data dir is its own git repo (private, never
// part of the code repo).
export function commit(msg) {
  const repo = dataDir();
  if (!fs.existsSync(path.join(repo, '.git'))) return;
  execFile('git', ['-C', repo, 'add', '-A'], () =>
    execFile('git', ['-C', repo, 'commit', '-q', '-m', msg], () => {}));
}
