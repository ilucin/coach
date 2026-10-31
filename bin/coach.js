#!/usr/bin/env node
// coach CLI: log working sets, show reports, serve the app.
import * as store from '../lib/store.js';
import { sessionReport, weekReport, isoWeek, history, bests, e1rm, convert } from '../lib/core.js';
import { sessionText, weekText } from '../lib/format.js';

const HELP = `coach — dnevnik snage

  coach log <vježba> [setovi…] [--warmup] [--date D]   dodaj radne serije: 100x5  102.5x4@8  100x5x3@7.5 (=3 serije, RPE 7,5)
  coach warmup <vježba> [--off] [--date D]             označi zagrijavanje (2–4 serije) odrađeno
  coach undo <vježba> [--date D]                       makni zadnju seriju
  coach fix <vježba> <n> <kg>x<reps> [--date D]        ispravi n-tu seriju (od 1)
  coach note [vježba] "<tekst>" [--date D]             bilješka za trening ili vježbu
  coach calc <kg>x<reps>@<rpe> [--rir R | --rpe P] [--reps N]   isti zamor na drugom broju ponavljanja
  coach show [D]                                       trening (JSON)
  coach report --session [D]                           izvještaj treninga (default danas)
  coach report --week [YYYY-Www] [--save]              tjedni izvještaj (--save → data/reports/)
  coach history <vježba>                               povijest i rekordi vježbe
  coach exercises                                      popis vježbi
  coach exercise add "<ime>" [--alias a,b]             nova vježba
  coach serve [--port 4340]                            web app`;

const args = process.argv.slice(2);
const flag = (f, bool = false) => {
  const i = args.indexOf(f); if (i < 0) return undefined;
  const v = args[i + 1], takes = !bool && v && !v.startsWith('--') && !/^\d+(?:[.,]\d+)?x/i.test(v);
  args.splice(i, takes ? 2 : 1); return takes ? v : true;
};
const die = (m) => { console.error(`coach: ${m}`); process.exit(1); };
const date = () => { const d = flag('--date'); return typeof d === 'string' ? d : store.today(); };
const ex = (n) => store.findExercise(n || die('nedostaje vježba')) || die(`nepoznata vježba "${n}" — coach exercises / coach exercise add`);
const parseSet = (s) => {
  const m = s.replace(/,/g, '.').match(/^(\d+(?:\.\d+)?)x(\d+)(?:x(\d+))?(?:@(\d+(?:\.\d+)?))?$/i) || die(`ne razumijem seriju "${s}" (npr. 100x5 ili 100x5@8)`);
  const set = { kg: Number(m[1]), reps: Number(m[2]) };
  if (m[4]) set.rpe = Number(m[4]);
  return Array.from({ length: Number(m[3] || 1) }, () => ({ ...set }));
};
const save = (w, what) => { store.saveWorkout(w); store.commit(`trening ${w.date}: ${what}`); };
const summary = (d, id) => {
  const r = sessionReport(store.workouts(), d);
  const x = r?.exercises.find((e) => e.exercise === id);
  console.log(x ? sessionText({ ...r, exercises: [x] }).split('\n').slice(2, -2).join('\n') : 'spremljeno');
};

const cmd = args.shift();
switch (cmd) {
  case 'log': {
    const d = date(), warm = flag('--warmup', true);
    const e = ex(args.shift()), w = store.workout(d), en = store.entry(w, e.id);
    if (warm) en.warmup = true;
    for (const s of args) en.sets.push(...parseSet(s));
    save(w, e.name); summary(d, e.id); break;
  }
  case 'warmup': {
    const d = date(), off = flag('--off', true);
    const e = ex(args.shift()), w = store.workout(d);
    store.entry(w, e.id).warmup = !off; save(w, `${e.name} zagrijavanje`); console.log(`${e.name}: zagrijavanje ${off ? '✗' : '✓'}`); break;
  }
  case 'undo': {
    const d = date(), e = ex(args.shift()), w = store.workout(d);
    const s = store.entry(w, e.id).sets.pop(); save(w, `${e.name} undo`);
    console.log(s ? `maknuto ${s.kg}x${s.reps}` : 'nema serija'); summary(d, e.id); break;
  }
  case 'fix': {
    const d = date(), e = ex(args.shift()), i = Number(args.shift()) - 1, w = store.workout(d);
    const en = store.entry(w, e.id);
    if (!en.sets[i]) die(`nema serije ${i + 1}`);
    en.sets[i] = parseSet(args.shift() || die('nedostaje serija'))[0]; save(w, `${e.name} ispravak`); summary(d, e.id); break;
  }
  case 'note': {
    const d = date(), w = store.workout(d);
    if (args.length > 1) store.entry(w, ex(args.shift()).id).note = args.join(' '); else w.note = args[0];
    save(w, 'bilješka'); console.log('spremljeno'); break;
  }
  case 'calc': {
    const rirF = flag('--rir'), rpeF = flag('--rpe'), repsF = flag('--reps');
    const set = parseSet(args.shift() || die('npr. coach calc 60x5@8 --reps 3'))[0];
    const rpe = rirF ? 10 - Number(String(rirF).replace(',', '.')) : rpeF ? Number(String(rpeF).replace(',', '.')) : set.rpe ?? 10;
    const f = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
    const bar = (x) => f(Math.round(x / 2.5) * 2.5);
    console.log(`${set.kg}×${set.reps} @RPE ${set.rpe ?? 10} (RIR ${10 - (set.rpe ?? 10)}) → e1RM ${f(e1rm(set))} kg`);
    console.log(`Isti zamor uz RIR ${f(10 - rpe)} (RPE ${f(rpe)}):`);
    for (const r of repsF ? [Number(repsF)] : [1, 2, 3, 4, 5, 6, 8, 10]) console.log(`  ${String(r).padStart(2)} pon.: ${f(convert(set, r, rpe))} kg  (šipka ≈ ${bar(convert(set, r, rpe))})`);
    break;
  }
  case 'show': console.log(JSON.stringify(store.workout(args[0] || store.today()), null, 2)); break;
  case 'report': {
    const s = flag('--session'), wk = flag('--week'), sv = flag('--save', true);
    if (wk) {
      const week = typeof wk === 'string' ? wk : isoWeek(store.today());
      const text = weekText(weekReport(store.workouts(), week));
      if (sv) { store.writeReport(week, text + '\n'); store.commit(`izvještaj ${week}`); }
      console.log(text);
    } else console.log(sessionText(sessionReport(store.workouts(), typeof s === 'string' ? s : args[0] || store.today())));
    break;
  }
  case 'history': {
    const e = ex(args.join(' ')), h = history(store.workouts(), e.id), b = bests(h.map((x) => x.metrics));
    console.log(`${e.name}`);
    for (const x of h) console.log(`  ${x.date}  ${x.sets.map((s) => `${s.kg}x${s.reps}${s.rpe != null ? '@' + s.rpe : ''}`).join(', ')}  · najteža ${x.metrics.heaviest.kg}x${x.metrics.heaviest.reps} · maks. vol ${x.metrics.maxVolume.value} · e1RM ${x.metrics.e1rm.value}`);
    if (b) console.log(`Rekordi: najteža ${b.heaviest.heaviest.kg}x${b.heaviest.heaviest.reps} · maks. vol ${b.maxVolume.maxVolume.value} · e1RM ${b.e1rm.e1rm.value}`);
    break;
  }
  case 'exercises': for (const e of store.exercises()) console.log(`${e.id}\t${e.name}${e.aliases?.length ? `\t(${e.aliases.join(', ')})` : ''}`); break;
  case 'exercise': {
    if (args.shift() !== 'add') die('coach exercise add "<ime>"');
    const al = flag('--alias'); const e = store.addExercise(args.join(' '), typeof al === 'string' ? al.split(',').map((s) => s.trim()) : []);
    store.commit(`exercise: ${e.name}`); console.log(`${e.id}\t${e.name}`); break;
  }
  case 'serve': { const { serve } = await import('../lib/server.js'); const pt = flag('--port'); serve(Number(pt) || 4340); break; }
  default: console.log(HELP);
}
