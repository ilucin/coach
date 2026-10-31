// Pure training math: set metrics, comparisons, records, session and week reports.

// RTS / Tuchscherer RPE chart (same as the plsource / OpenPowerlifting RPE calculator):
// %1RM by "effective reps" = reps + (10 − RPE), in half-rep steps from 1.
const RPE_PCT = [100, 97.8, 95.5, 93.9, 92.2, 90.7, 89.2, 87.8, 86.3, 85.0, 83.7, 82.4, 81.1, 79.9, 78.6,
  77.4, 76.2, 75.1, 73.9, 72.3, 70.7, 69.4, 68.0, 66.7, 65.3, 64.0, 62.6, 61.3, 59.9, 58.6];

export function pct1rm(reps, rpe = 10) {
  const i = Math.max(0, (reps + 10 - rpe - 1) * 2);
  const last = RPE_PCT.length - 1;
  if (i >= last) return RPE_PCT[last] - (i - last) * (RPE_PCT[last - 1] - RPE_PCT[last]);
  const lo = Math.floor(i);
  return RPE_PCT[lo] + (i - lo) * (RPE_PCT[lo + 1] - RPE_PCT[lo]);
}

// Estimated 1RM from the RPE chart; a set without RPE counts as RPE 10.
export const e1rm = (s) => (s.kg * 100) / pct1rm(s.reps, s.rpe ?? 10);
export const volume = (s) => s.kg * s.reps;

// Load for `reps` at `rpe` that matches the effort of a done set (same e1RM).
export const convert = (set, reps, rpe = 10) => (e1rm(set) * pct1rm(reps, rpe)) / 100;
export const rir = (rpe) => 10 - rpe;

const round1 = (n) => Math.round(n * 10) / 10;

// The three tracked parameters for one exercise entry (working sets only).
export function metrics(sets) {
  const valid = (sets || []).filter((s) => s.reps > 0);
  if (!valid.length) return null;
  const heaviest = valid.reduce((a, b) => (b.kg > a.kg || (b.kg === a.kg && b.reps > a.reps) ? b : a));
  const topVol = valid.reduce((a, b) => (volume(b) > volume(a) ? b : a));
  const topE = valid.reduce((a, b) => (e1rm(b) > e1rm(a) ? b : a));
  return {
    heaviest: { kg: heaviest.kg, reps: heaviest.reps },
    maxVolume: { value: volume(topVol), kg: topVol.kg, reps: topVol.reps },
    e1rm: { value: round1(e1rm(topE)), kg: topE.kg, reps: topE.reps, rpe: topE.rpe },
    totalVolume: valid.reduce((t, s) => t + volume(s), 0),
  };
}

// Comparable scalar per parameter. Heaviest: kg, reps break ties.
const scalar = {
  heaviest: (m) => m.heaviest.kg + m.heaviest.reps / 1000,
  maxVolume: (m) => m.maxVolume.value,
  e1rm: (m) => m.e1rm.value,
};
const display = {
  heaviest: (m) => m.heaviest.kg,
  maxVolume: (m) => m.maxVolume.value,
  e1rm: (m) => m.e1rm.value,
};
export const PARAMS = ['heaviest', 'maxVolume', 'e1rm'];

function diff(cur, prev, key) {
  if (!prev) return null;
  const a = display[key](cur), b = display[key](prev);
  return { abs: round1(a - b), pct: b ? round1(((a - b) / b) * 100) : null };
}

// Compare current metrics with the previous occurrence and the best before it.
export function compare(cur, prev, best) {
  const out = {};
  for (const k of PARAMS) {
    out[k] = {
      vsPrev: diff(cur, prev, k),
      vsBest: diff(cur, best?.[k], k),
      pr: !!best && scalar[k](cur) > scalar[k](best[k]),
      first: !best,
    };
  }
  return out;
}

// best[k] = metrics object holding the best value of parameter k across a list of metrics.
export function bests(list) {
  if (!list.length) return null;
  const out = {};
  for (const k of PARAMS) out[k] = list.reduce((a, b) => (scalar[k](b) > scalar[k](a) ? b : a));
  return out;
}

// Every occurrence of an exercise across workouts, oldest first.
export function history(workouts, exerciseId) {
  const out = [];
  for (const w of [...workouts].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const e of w.entries || []) {
      if (e.exercise !== exerciseId) continue;
      const m = metrics(e.sets);
      if (m) out.push({ date: w.date, warmup: e.warmup, sets: e.sets, metrics: m });
    }
  }
  return out;
}

// Per-exercise report of one workout vs everything before it.
export function sessionReport(workouts, date) {
  const w = workouts.find((x) => x.date === date);
  if (!w) return null;
  const exercises = [];
  for (const e of w.entries || []) {
    const m = metrics(e.sets);
    if (!m) continue;
    const before = history(workouts, e.exercise).filter((h) => h.date < date);
    const prev = before.at(-1);
    exercises.push({
      exercise: e.exercise, warmup: e.warmup, sets: e.sets, metrics: m,
      prev: prev ? { date: prev.date, sets: prev.sets, metrics: prev.metrics } : null,
      compare: compare(m, prev?.metrics, bests(before.map((h) => h.metrics))),
    });
  }
  return { date, note: w.note, exercises };
}

// ISO week key, e.g. 2026-W44.
export function isoWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = d.getUTCFullYear();
  const wk = Math.ceil(((d - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

// Best of each parameter per exercise in a week, vs the previous week it was trained and the record before.
export function weekReport(workouts, week) {
  const inWeek = workouts.filter((w) => isoWeek(w.date) === week);
  const ids = [...new Set(inWeek.flatMap((w) => (w.entries || []).map((e) => e.exercise)))];
  const exercises = [];
  for (const id of ids) {
    const h = history(workouts, id);
    const cur = bests(h.filter((x) => isoWeek(x.date) === week).map((x) => x.metrics));
    if (!cur) continue;
    const curM = { heaviest: cur.heaviest.heaviest, maxVolume: cur.maxVolume.maxVolume, e1rm: cur.e1rm.e1rm };
    const before = h.filter((x) => isoWeek(x.date) < week);
    const prevWeek = before.length ? isoWeek(before.at(-1).date) : null;
    const p = prevWeek ? bests(before.filter((x) => isoWeek(x.date) === prevWeek).map((x) => x.metrics)) : null;
    const prevM = p ? { heaviest: p.heaviest.heaviest, maxVolume: p.maxVolume.maxVolume, e1rm: p.e1rm.e1rm } : null;
    exercises.push({
      exercise: id, sessions: h.filter((x) => isoWeek(x.date) === week).length,
      metrics: curM, prevWeek, prev: prevM,
      compare: compare(curM, prevM, bests(before.map((x) => x.metrics))),
    });
  }
  return { week, workouts: inWeek.map((w) => w.date).sort(), exercises };
}
