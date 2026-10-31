// Text rendering of reports (CLI output and the weekly markdown).
import { exercises } from './store.js';

const name = (id) => exercises().find((e) => e.id === id)?.name || id;
const n = (x) => String(x).replace('.', ',');
const one = (s) => `${n(s.kg)}×${s.reps}${s.rpe != null ? ` @${n(s.rpe)}` : ''}`;
const sets = (ss) => ss.map(one).join(', ');
const delta = (d) => (d ? `${d.abs >= 0 ? '+' : ''}${n(d.abs)} kg (${d.pct >= 0 ? '+' : ''}${n(d.pct)}%)` : '–');

function params(m, c) {
  const tag = (k) => (c[k].pr ? ' **PR**' : c[k].first ? ' (prvi put)' : '');
  return [
    `  - Najteža serija: ${n(m.heaviest.kg)}×${m.heaviest.reps} · vs prošli: ${delta(c.heaviest.vsPrev)} · vs rekord: ${delta(c.heaviest.vsBest)}${tag('heaviest')}`,
    `  - Maks. volumen serije: ${n(m.maxVolume.value)} kg (${n(m.maxVolume.kg)}×${m.maxVolume.reps}) · vs prošli: ${delta(c.maxVolume.vsPrev)} · vs rekord: ${delta(c.maxVolume.vsBest)}${tag('maxVolume')}`,
    `  - e1RM: ${n(m.e1rm.value)} kg (${one(m.e1rm)}) · vs prošli: ${delta(c.e1rm.vsPrev)} · vs rekord: ${delta(c.e1rm.vsBest)}${tag('e1rm')}`,
  ];
}

export function sessionText(r) {
  if (!r || !r.exercises.length) return 'Nema radnih serija za taj dan.';
  const out = [`# Trening ${r.date}`, ''];
  for (const x of r.exercises) {
    out.push(`- **${name(x.exercise)}**${x.warmup ? ' · zagrijavanje ✓' : ''} · ${sets(x.sets)}`);
    out.push(...params(x.metrics, x.compare));
    if (x.prev) out.push(`  - Zadnji put (${x.prev.date}): ${sets(x.prev.sets)}`);
  }
  const prs = r.exercises.filter((x) => Object.values(x.compare).some((c) => c.pr)).map((x) => name(x.exercise));
  out.push('', prs.length ? `Novi rekordi: ${prs.join(', ')}` : 'Bez novih rekorda.');
  return out.join('\n');
}

export function weekText(r) {
  const out = [`# Tjedan ${r.week}`, '', `Treninzi: ${r.workouts.length} (${r.workouts.join(', ') || '–'})`, ''];
  for (const x of r.exercises) {
    out.push(`- **${name(x.exercise)}** · ${x.sessions}× u tjednu${x.prevWeek ? ` · uspoređeno s ${x.prevWeek}` : ''}`);
    out.push(...params(x.metrics, x.compare));
  }
  const prs = r.exercises.filter((x) => Object.values(x.compare).some((c) => c.pr)).map((x) => name(x.exercise));
  const flat = r.exercises.filter((x) => x.compare.e1rm.vsPrev && x.compare.e1rm.vsPrev.pct <= 0).map((x) => name(x.exercise));
  out.push('', `Novi rekordi: ${prs.join(', ') || '–'}`, `Stagnacija (e1RM ≤ prošli tjedan): ${flat.join(', ') || '–'}`);
  return out.join('\n');
}
