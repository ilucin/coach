import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metrics, sessionReport, weekReport, isoWeek, e1rm, pct1rm, convert, streak, sugarDay, junkEvening, weekHabits, weekStart } from '../lib/core.js';

test('metrics: heaviest, max volume, e1rm', () => {
  const m = metrics([{ kg: 100, reps: 5 }, { kg: 105, reps: 3 }, { kg: 105, reps: 2 }]);
  assert.deepEqual(m.heaviest, { kg: 105, reps: 3 });
  assert.equal(m.maxVolume.value, 500);
  assert.equal(m.e1rm.value, 115.9);
  assert.equal(m.totalVolume, 500 + 315 + 210);
  assert.equal(e1rm({ kg: 140, reps: 1 }), 140);
});

test('e1rm follows the RPE chart', () => {
  assert.equal(pct1rm(5, 8), 81.1);
  assert.equal(pct1rm(1, 9.5), 97.8);
  assert.equal(Math.round(e1rm({ kg: 60, reps: 5, rpe: 8 }) * 10) / 10, 74);
  assert.equal(Math.round(e1rm({ kg: 65, reps: 6, rpe: 7.5 }) * 10) / 10, 84);
  assert.ok(pct1rm(12, 6) < 58.6);
});

const W = [
  { date: '2026-10-20', entries: [{ exercise: 'bench', warmup: true, sets: [{ kg: 100, reps: 5 }] }] },
  { date: '2026-10-23', entries: [{ exercise: 'bench', warmup: true, sets: [{ kg: 95, reps: 5 }] }] },
  { date: '2026-10-27', entries: [{ exercise: 'bench', warmup: true, sets: [{ kg: 110, reps: 5 }] }] },
];

test('session report compares with previous and record', () => {
  const r = sessionReport(W, '2026-10-27');
  const c = r.exercises[0].compare;
  assert.equal(r.exercises[0].prev.date, '2026-10-23');
  assert.equal(c.heaviest.vsPrev.pct, 15.8);
  assert.equal(c.heaviest.vsBest.pct, 10);
  assert.equal(c.maxVolume.pr, true);
  assert.equal(c.e1rm.pr, true);
  const first = sessionReport(W, '2026-10-20').exercises[0].compare;
  assert.equal(first.e1rm.first, true);
  assert.equal(first.e1rm.pr, false);
  assert.equal(sessionReport(W, '2026-10-23').exercises[0].compare.heaviest.pr, false);
});

test('week report uses best in week vs previous week', () => {
  assert.equal(isoWeek('2026-10-27'), '2026-W44');
  assert.equal(isoWeek('2026-10-23'), '2026-W43');
  const r = weekReport(W, '2026-W44');
  assert.equal(r.exercises[0].prevWeek, '2026-W43');
  assert.equal(r.exercises[0].prev.heaviest.kg, 100);
  assert.equal(r.exercises[0].compare.heaviest.vsPrev.pct, 10);
});

test('convert keeps the effort: 60x5 @8 -> 3 reps @8', () => {
  assert.equal(Math.round(convert({ kg: 60, reps: 5, rpe: 8 }, 3, 8) * 10) / 10, 63.8);
  assert.equal(Math.round(convert({ kg: 60, reps: 5, rpe: 8 }, 5, 8) * 10) / 10, 60);
});

test('habits: streaks and the week', () => {
  const days = [
    { date: '2026-10-19', weight: 89, food: [] },
    { date: '2026-10-22', food: [{ text: 'čokolada', tags: ['slatko'] }] },
    { date: '2026-10-27', sleep: 4, weight: 88, food: [{ text: 'čips', tags: ['grickalice', 'kasno'] }] },
    { date: '2026-10-28', sleep: 2, weight: 87.6, food: [{ text: 'keks', tags: ['slatko'] }] },
  ];
  assert.equal(weekStart('2026-W44'), '2026-10-26');
  assert.equal(streak(days, '2026-11-01', sugarDay), 4);
  assert.equal(streak(days, '2026-10-28', sugarDay), 0);
  assert.equal(streak(days, '2026-10-21', sugarDay), 3);
  assert.equal(streak(days, '2026-11-01', junkEvening), 5);
  const h = weekHabits(days, '2026-W44', '2026-10-29');
  assert.equal(h.days, 4);
  assert.equal(h.sleep, 3);
  assert.equal(h.weight, 87.8);
  assert.equal(h.prevWeight, 89);
  assert.equal(h.weightDelta, -1.2);
  assert.equal(h.sugarDays, 1);
  assert.equal(h.junkEvenings, 1);
});
