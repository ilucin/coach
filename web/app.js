// Coach PWA: Dan (sleep, weight, food), Trening (log), Napredak (progress), Tjedan (weekly),
// Preračun (set converter).
import { e1rm, convert, isoWeek as isoWeekOf } from '/core.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const sign = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + n(Math.abs(x));
const api = async (path, opts = {}) => {
  const r = await fetch('/api/' + path, { ...opts, headers: { 'content-type': 'application/json' }, body: opts.body && JSON.stringify(opts.body) });
  if (!r.ok) throw new Error((await r.json()).error || r.status);
  return r.json();
};
const today = () => new Date().toLocaleDateString('sv-SE');
const dt = (d) => new Date(d + 'T12:00');
const fmtLong = (d) => dt(d).toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = (d) => dt(d).toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'numeric' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Icons (Lucide, 24×24, stroke 2) ----------------------------------------
const P = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  up: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  down: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  flat: '<path d="M5 12h14"/><path d="m15 8 4 4-4 4"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  weight: '<circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  battery: '<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  swap: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7.5 10a4.5 4.5 0 0 1 9 0"/><path d="m12 10 1.6-2.2"/>',
  cookie: '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/>',
  popcorn: '<path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4"/><path d="M10 22 9 8"/><path d="m14 22 1-14"/><path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  sparkle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
};
const ic = (name, size = 18, cls = '') => `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;

// --- Shared bits ------------------------------------------------------------
let exercises = [];
const exName = (id) => exercises.find((e) => e.id === id)?.name || id;
const RIRS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
const rirTxt = (r) => (r === 0 ? 'otkaz' : String(r).replace('.5', '½').replace(/^0½$/, '½'));
const setTxt = (s) => `${n(s.kg)} kg × ${s.reps}`;
const bar = (x) => n(Math.round(x / 2.5) * 2.5);
const state = { date: today(), open: {}, form: {} };

function rirChips(name, sel) {
  return `<div class="chips" role="radiogroup">${RIRS.map((r) => `<button type="button" class="pill ${sel === r ? 'on' : ''}" data-rir="${r}" data-group="${name}">${rirTxt(r)}</button>`).join('')}</div>`;
}

// One friendly sentence about progress, from the estimated max (e1RM) vs last time.
function progressLine(c, prevDate, unit = 'nego prošli put') {
  const d = c?.e1rm?.vsPrev;
  if (!d) return `<div class="prog new">${ic('sparkle', 16)} Prvi zapis, ovo je tvoja početna točka</div>`;
  if (d.pct > 0) return `<div class="prog up">${ic('up', 16)} Jači za <b>${n(d.pct)}%</b> ${unit}</div>`;
  if (d.pct < 0) return `<div class="prog down">${ic('down', 16)} ${n(Math.abs(d.pct))}% slabije ${unit}. Normalno je, nije svaki dan isti.</div>`;
  return `<div class="prog flat">${ic('flat', 16)} Isto kao ${unit.replace('nego ', '')}</div>`;
}

function change(d, reps = 0) {
  if (!d) return '';
  if (!d.abs && reps) return `<span class="ch ${reps > 0 ? 'up' : 'down'}">${sign(reps)} pon.</span>`;
  if (!d.abs) return '<span class="ch flat">isto</span>';
  return `<span class="ch ${d.abs > 0 ? 'up' : 'down'}">${sign(d.pct ?? 0)}%</span>`;
}

// The three tracked numbers as tiles.
function tiles(m, c, prev) {
  const hr = prev && prev.heaviest.kg === m.heaviest.kg ? m.heaviest.reps - prev.heaviest.reps : 0;
  const pr = (k) => (c?.[k]?.pr ? `<span class="badge">${ic('trophy', 11)} rekord</span>` : '');
  const t = (k, icon, label, value, sub, extra = 0) => `<div class="tile">
      <div class="tl">${ic(icon, 14)} ${label}</div>
      <div class="tv">${value}</div><div class="ts">${sub}</div>
      <div class="tf">${c ? change(c[k].vsPrev, extra) : ''}${pr(k)}</div></div>`;
  return `<div class="tiles">
    ${t('heaviest', 'weight', 'Najteže', `${n(m.heaviest.kg)}<small> kg</small>`, `× ${m.heaviest.reps} pon.`, hr)}
    ${t('maxVolume', 'layers', 'Volumen', `${n(m.maxVolume.value)}<small> kg</small>`, `${n(m.maxVolume.kg)} × ${m.maxVolume.reps}`)}
    ${t('e1rm', 'target', 'Max', `${n(m.e1rm.value)}<small> kg</small>`, 'procjena za 1×')}
  </div>`;
}

// --- Sheets (bottom drawers) -------------------------------------------------
function sheet(html) {
  const el = $('#sheet');
  el.innerHTML = `<div class="scrim" data-close></div><div class="panel"><div class="grab"></div>${html}</div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
  el.onclick = (e) => { if (e.target.closest('[data-close]')) closeSheet(); };
  return el;
}
function closeSheet() { const el = $('#sheet'); el.classList.remove('open'); setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 200); }

function glossary() {
  const row = (icon, t, d) => `<div class="gl">${ic(icon, 20)}<div><b>${t}</b><p>${d}</p></div></div>`;
  sheet(`<h2>Što znači što?</h2>
    ${row('dumbbell', 'Radna serija', 'Prava, teška serija. Zagrijavanje se ne upisuje, samo se označi da je bilo (2–4 lagane serije).')}
    ${row('battery', 'U rezervi', 'Koliko si ponavljanja još mogao napraviti. 0 znači do otkaza. Trener to zove RIR; RPE je 10 minus rezerva.')}
    ${row('weight', 'Najteže', 'Najveća kilaža koju si danas digao u radnoj seriji.')}
    ${row('layers', 'Volumen', 'Kilaža × ponavljanja u jednoj seriji. 100 kg × 5 = 500 kg. Pokazuje se najjača serija.')}
    ${row('target', 'Max', 'Procjena koliko bi digao za jedno ponavljanje, iz kilaže, ponavljanja i rezerve. Najbolji pokazatelj napretka.')}
    ${row('trophy', 'Rekord', 'Najbolje dosad za tu vježbu.')}
    ${row('moon', 'San', 'Ocjena od 1 (loše) do 5 (odlično), kako se osjećaš kad se probudiš.')}
    ${row('cookie', 'Slatko', 'Sve s dodanim šećerom: slatkiši, kolači, sokovi, zaslađeni jogurti. Cilj: što više dana bez.')}
    ${row('popcorn', 'Grickalice navečer', 'Čips, smoki, slatko i slično, pojedeno navečer. Broji se koliko večeri zaredom bez.')}
    ${row('scale', 'Težina', 'Važan je tjedni prosjek, ne pojedini dan. Težina dnevno skače i do 1 kg.')}
    <button class="btn wide" data-close>Jasno</button>`);
}

function pickExercise(onPick, exclude = []) {
  const el = sheet(`<h2>Dodaj vježbu</h2>
    <label class="search">${ic('search', 18)}<input id="q" placeholder="Traži ili upiši novu…" autocomplete="off"></label>
    <div id="opts" class="opts"></div>`);
  const draw = () => {
    const q = $('#q', el).value.trim().toLowerCase();
    const list = exercises.filter((e) => !exclude.includes(e.id) && (!q || [e.name, ...(e.aliases || [])].some((a) => a.toLowerCase().includes(q))));
    $('#opts', el).innerHTML = list.map((e) => `<button class="opt" data-id="${e.id}"><span class="ico">${ic('dumbbell', 18)}</span>${esc(e.name)}</button>`).join('')
      + (q && !exercises.some((e) => e.name.toLowerCase() === q) ? `<button class="opt new" data-new="1"><span class="ico">${ic('plus', 18)}</span>Nova vježba: <b>${esc($('#q', el).value.trim())}</b></button>` : '');
  };
  $('#q', el).oninput = draw; draw();
  $('#opts', el).onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    let id = b.dataset.id;
    if (b.dataset.new) { id = (await api('exercises', { method: 'POST', body: { name: $('#q', el).value.trim() } })).id; exercises = await api('exercises'); }
    closeSheet(); onPick(id);
  };
}

// --- Dan --------------------------------------------------------------------
const SLEEP = ['', 'loše', 'slabo', 'ok', 'dobro', 'odlično'];
const TAGS = { slatko: ['cookie', 'Slatko'], grickalice: ['popcorn', 'Grickalice'], kasno: ['moon', 'Navečer'] };
const days = (k, one, many) => `${k === 1 ? one : many}`;

function weightLine(h) {
  if (h.weight == null) return '';
  const d = h.weightDelta;
  return `<div class="prog ${d == null || d === 0 ? 'flat' : 'new'}">${ic('chart', 16)} <span>Prosjek ovaj tjedan <b>${n(h.weight)} kg</b>${d != null ? ` · ${sign(d)} kg od prošlog` : ''}</span></div>`;
}

async function renderDay() {
  const { day, habits: h } = await api('day/' + state.date);
  const isToday = state.date === today();
  const f = (state.food ??= { text: '', tags: new Set(isToday && new Date().getHours() >= 20 ? ['kasno'] : []) });
  const sugar = day.food.some((x) => x.tags?.includes('slatko'));
  const kg = state.kg ?? day.weight ?? h.weight ?? 80;
  $('#view').innerHTML = `
    <section class="hero">
      <div class="row">
        <div class="grow"><div class="eyebrow">${isToday ? 'Danas' : 'Dan'}</div><h1>${cap(fmtLong(state.date))}</h1></div>
        <label class="datebtn" aria-label="Promijeni dan">${ic('calendar', 20)}<input type="date" id="date" value="${state.date}"></label>
      </div>
      <div class="stats">
        <div><b>${h.sugarStreak}</b><span>${days(h.sugarStreak, 'dan', 'dana')} bez slatkog</span></div>
        <div><b>${h.junkStreak}</b><span>${days(h.junkStreak, 'večer', 'večeri')} bez grickalica</span></div>
        <div><b>${day.sleep || '–'}</b><span>san${day.sleep ? ` · ${SLEEP[day.sleep]}` : ''}</span></div>
      </div>
    </section>
    <section class="card">
      <h3>${ic('moon', 16)} Kako si spavao?</h3>
      <div class="sleep">${[1, 2, 3, 4, 5].map((v) => `<button data-sleep="${v}" class="${day.sleep === v ? 'on' : ''}"><b>${v}</b><span>${SLEEP[v]}</span></button>`).join('')}</div>
    </section>
    <section class="card">
      <h3>${ic('utensils', 16)} Što si jeo?</h3>
      <div class="prog ${sugar ? 'down' : 'up'}">${ic(sugar ? 'cookie' : 'leaf', 16)} ${sugar ? (isToday ? 'Danas je bilo slatkog. Sutra novi niz.' : 'Taj dan je bilo slatkog.') : (isToday ? 'Danas bez slatkog, samo tako' : 'Taj dan bez slatkog')}</div>
      ${day.food.length ? `<ol class="sets food">${day.food.map((x, i) => `<li><span class="grow"><b>${esc(x.text)}</b>${x.time ? ` <span class="mute sm">${x.time}</span>` : ''}</span>${(x.tags || []).map((t) => `<span class="tag ${t}">${ic(TAGS[t][0], 13)} ${TAGS[t][1]}</span>`).join('')}<button class="del" data-del="${i}" aria-label="Obriši">${ic('x', 16)}</button></li>`).join('')}</ol>` : ''}
      <div class="form">
        <label class="search plain">${ic('utensils', 18)}<input id="ftext" placeholder="npr. čokolada, čips, piletina…" value="${esc(f.text)}" autocomplete="off"></label>
        <div class="chips tags">${Object.entries(TAGS).map(([t, [i, l]]) => `<button type="button" class="pill ${f.tags.has(t) ? 'on' : ''}" data-tag="${t}">${ic(i, 15)} ${l}</button>`).join('')}</div>
        <button class="btn wide" id="fadd">${ic('plus', 18)} Dodaj</button>
      </div>
      <p class="mute sm hint">${ic('msg', 13)} Ili samo reci Claudeu što si pojeo.</p>
    </section>
    <section class="card">
      <h3>${ic('scale', 16)} Težina</h3>
      <div class="wrow">
        <div class="stepper"><div><button data-w="-0.1" aria-label="manje">${ic('minus', 18)}</button><input id="wkg" type="number" inputmode="decimal" step="0.1" value="${kg}"><button data-w="0.1" aria-label="više">${ic('plus', 18)}</button></div><span>kg</span></div>
        <button class="btn" id="wsave">${ic('check', 18)} ${day.weight ? 'Ispravi' : 'Spremi'}</button>
      </div>
      ${day.weight ? `<p class="mute sm">Upisano: <b>${n(day.weight)} kg</b>. Najbolje se vagati ujutro, prije doručka.</p>` : '<p class="mute sm">Najbolje ujutro, prije doručka. Ne mora svaki dan.</p>'}
      ${weightLine(h)}
    </section>`;

  const v = $('#view');
  $('#date').onchange = (ev) => { state.date = ev.target.value || today(); state.food = null; state.kg = null; route(); };
  $('#ftext').oninput = (ev) => (f.text = ev.target.value);
  $('#wkg').oninput = (ev) => (state.kg = +ev.target.value);
  const save = async (path, body, method = 'POST') => { await api(`day/${state.date}${path}`, { method, body }); };
  v.onclick = async (e) => {
    const t = e.target.closest('[data-tag]'), sl = e.target.closest('[data-sleep]'), w = e.target.closest('[data-w]'), del = e.target.closest('[data-del]');
    if (t) { f.tags.has(t.dataset.tag) ? f.tags.delete(t.dataset.tag) : f.tags.add(t.dataset.tag); t.classList.toggle('on'); }
    if (sl) { const val = +sl.dataset.sleep; await save('', { sleep: day.sleep === val ? null : val }); toast(`${ic('moon', 16)} San spremljen`); renderDay(); }
    if (w) { const inp = $('#wkg'); inp.value = state.kg = Math.round((+inp.value + +w.dataset.w) * 10) / 10; }
    if (del) { await save('/food', { index: +del.dataset.del }, 'DELETE'); renderDay(); }
    if (e.target.closest('#wsave')) { await save('', { weight: +$('#wkg').value }); state.kg = null; toast(`${ic('check', 16)} Težina spremljena`); renderDay(); }
    if (e.target.closest('#fadd')) {
      if (!f.text.trim()) return $('#ftext').focus();
      await save('/food', { text: f.text, tags: [...f.tags], time: isToday ? new Date().toTimeString().slice(0, 5) : undefined });
      state.food = null; toast(`${ic('check', 16)} Zapisano`); renderDay();
    }
  };
}

// --- Danas ------------------------------------------------------------------
async function renderToday() {
  const { workout, report } = await api('workout/' + state.date);
  const rep = Object.fromEntries((report?.exercises || []).map((x) => [x.exercise, x]));
  const nSets = workout.entries.reduce((t, e) => t + e.sets.length, 0);
  const prs = (report?.exercises || []).filter((x) => Object.values(x.compare).some((c) => c.pr));
  const isToday = state.date === today();

  const cards = workout.entries.map((e) => {
    const r = rep[e.exercise];
    const last = e.sets.at(-1) || r?.prev?.sets?.at(-1);
    const f = (state.form[e.exercise] ??= { kg: last?.kg ?? 20, reps: last?.reps ?? 5, rir: last?.rpe != null ? 10 - last.rpe : null });
    const open = state.open[e.exercise] ?? !e.sets.length;
    const hasPr = r && Object.values(r.compare).some((c) => c.pr);
    return `<section class="card ex" data-ex="${esc(e.exercise)}">
      <div class="exh">
        <span class="ico big">${ic('dumbbell', 22)}</span>
        <div class="grow"><h2>${esc(exName(e.exercise))}</h2>
          ${r?.prev ? `<div class="mute sm">${ic('history', 13)} Zadnji put ${fmtShort(r.prev.date)}: ${r.prev.sets.map((s) => `${n(s.kg)}×${s.reps}`).join(', ')}</div>` : '<div class="mute sm">Prvi put radiš ovu vježbu</div>'}
        </div>
        ${hasPr ? `<span class="trophy">${ic('trophy', 20)}</span>` : ''}
      </div>
      <button class="warm ${e.warmup ? 'on' : ''}" data-act="warm"><span class="box">${ic('check', 14)}</span>${ic('thermo', 15)} Zagrijao sam se <span class="mute">(2–4 lagane serije)</span></button>
      ${e.sets.length ? `<ol class="sets">${e.sets.map((s, i) => `<li><span class="num">${i + 1}</span><span class="grow"><b>${n(s.kg)} kg</b> × ${s.reps}</span>${s.rpe != null ? `<span class="rir">${ic('battery', 13)} ${rirTxt(10 - s.rpe)}</span>` : ''}<button class="del" data-act="del" data-i="${i}" aria-label="Obriši seriju">${ic('x', 16)}</button></li>`).join('')}</ol>` : ''}
      ${open ? `<div class="form">
          <div class="steppers">
            <div class="stepper"><label>Kilaža</label><div><button data-act="kg-" aria-label="manje">${ic('minus', 18)}</button><input type="number" inputmode="decimal" step="0.5" class="kg" value="${f.kg}"><button data-act="kg+" aria-label="više">${ic('plus', 18)}</button></div><span>kg</span></div>
            <div class="stepper"><label>Ponavljanja</label><div><button data-act="r-" aria-label="manje">${ic('minus', 18)}</button><input type="number" inputmode="numeric" class="reps" value="${f.reps}"><button data-act="r+" aria-label="više">${ic('plus', 18)}</button></div><span>pon.</span></div>
          </div>
          <label class="lbl">${ic('battery', 15)} Koliko si još mogao? <span class="mute">(0 = do otkaza)</span></label>
          ${rirChips(e.exercise, f.rir)}
          <button class="btn wide" data-act="add">${ic('check', 18)} Spremi seriju</button>
        </div>` : `<button class="btn ghost wide" data-act="open">${ic('plus', 18)} Dodaj seriju</button>`}
      ${r ? `${progressLine(r.compare)}${tiles(r.metrics, r.compare, r.prev?.metrics)}
        <a class="link" href="#calc/${r.metrics.e1rm.kg}/${r.metrics.e1rm.reps}/${r.metrics.e1rm.rpe ?? 10}">${ic('swap', 15)} Koliko za drugi broj ponavljanja?</a>` : ''}
    </section>`;
  }).join('');

  $('#view').innerHTML = `
    <section class="hero">
      <div class="row">
        <div class="grow"><div class="eyebrow">${isToday ? 'Danas' : 'Trening'}</div><h1>${cap(fmtLong(state.date))}</h1></div>
        <label class="datebtn" aria-label="Promijeni dan">${ic('calendar', 20)}<input type="date" id="date" value="${state.date}"></label>
      </div>
      <div class="stats">
        <div><b>${workout.entries.length}</b><span>${workout.entries.length === 1 ? 'vježba' : 'vježbi'}</span></div>
        <div><b>${nSets}</b><span>${nSets === 1 ? 'serija' : 'serija'}</span></div>
        <div><b>${prs.length}</b><span>${prs.length === 1 ? 'rekord' : 'rekorda'}</span></div>
      </div>
      ${prs.length ? `<div class="hero-pr">${ic('trophy', 16)} Novi rekord: ${prs.map((x) => esc(exName(x.exercise))).join(', ')}</div>` : ''}
    </section>
    ${cards || `<div class="empty">${ic('dumbbell', 40)}<p>Još ništa za ${isToday ? 'danas' : 'taj dan'}.<br>Dodaj prvu vježbu ili samo reci Claudeu što si radio.</p></div>`}
    <button class="btn wide add" id="addEx">${ic('plus', 20)} Dodaj vježbu</button>`;

  $('#date').onchange = (ev) => { state.date = ev.target.value || today(); state.form = {}; state.open = {}; renderToday(); };
  $('#addEx').onclick = () => pickExercise(async (id) => {
    await api(`workout/${state.date}/warmup`, { method: 'POST', body: { exercise: id, warmup: false } });
    state.open[id] = true; renderToday();
  }, workout.entries.map((e) => e.exercise));

  for (const card of document.querySelectorAll('section.ex')) {
    const id = card.dataset.ex, f = state.form[id];
    const kg = $('.kg', card), reps = $('.reps', card);
    if (kg) kg.oninput = () => (f.kg = +kg.value);
    if (reps) reps.oninput = () => (f.reps = +reps.value);
    card.onclick = async (ev) => {
      const rb = ev.target.closest('[data-rir]');
      if (rb) { f.rir = f.rir === +rb.dataset.rir ? null : +rb.dataset.rir; for (const b of card.querySelectorAll('[data-rir]')) b.classList.toggle('on', +b.dataset.rir === f.rir); return; }
      const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
      const btn = ev.target.closest('[data-act]');
      if (a === 'kg+') kg.value = f.kg = +kg.value + 2.5;
      if (a === 'kg-') kg.value = f.kg = Math.max(0, +kg.value - 2.5);
      if (a === 'r+') reps.value = f.reps = +reps.value + 1;
      if (a === 'r-') reps.value = f.reps = Math.max(1, +reps.value - 1);
      if (a === 'open') { state.open[id] = true; renderToday(); }
      if (a === 'add') {
        await api(`workout/${state.date}/sets`, { method: 'POST', body: { exercise: id, kg: f.kg, reps: f.reps, rpe: f.rir == null ? '' : 10 - f.rir } });
        state.open[id] = false; toast(`${ic('check', 16)} Serija spremljena`); renderToday();
      }
      if (a === 'del') { await api(`workout/${state.date}/sets`, { method: 'DELETE', body: { exercise: id, index: +btn.dataset.i } }); renderToday(); }
      if (a === 'warm') { await api(`workout/${state.date}/warmup`, { method: 'POST', body: { exercise: id, warmup: !btn.classList.contains('on') } }); renderToday(); }
    };
  }
}

function toast(html) {
  const t = $('#toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}

// --- Vježbe -----------------------------------------------------------------
function chart(points) {
  if (points.length < 2) return '<p class="mute sm">Graf se pojavi nakon drugog treninga.</p>';
  const W = 320, H = 120, PX = 8, PY = 12, ys = points.map((p) => p.y), lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 1;
  const xy = points.map((p, i) => [PX + (i * (W - 2 * PX)) / (points.length - 1), H - PY - ((p.y - lo) / span) * (H - 2 * PY)]);
  const line = xy.map((p) => p.join(',')).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <polygon fill="url(#g)" points="${xy[0][0]},${H} ${line} ${xy.at(-1)[0]},${H}"/>
      <polyline fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" points="${line}"/>
    </svg>
    <div class="axis"><span><b>${n(points[0].y)} kg</b>${fmtShort(points[0].d)}</span><span><b>${n(points.at(-1).y)} kg</b>${fmtShort(points.at(-1).d)}</span></div>`;
}

// Weekly averages once there are two weeks of weigh-ins, single weigh-ins before that.
function weightChart(weights) {
  const wk = {};
  for (const w of weights) (wk[isoWeekOf(w.date)] ??= []).push(w);
  const weeks = Object.values(wk);
  const pts = weeks.length >= 2
    ? weeks.map((ws) => ({ y: Math.round((ws.reduce((t, w) => t + w.kg, 0) / ws.length) * 10) / 10, d: ws[0].date }))
    : weights.map((w) => ({ y: w.kg, d: w.date }));
  return chart(pts).replace('nakon drugog treninga', 'nakon drugog vaganja');
}

async function renderExercises() {
  const [list0, { weights }] = await Promise.all([api('summary'), api('day/' + today())]);
  const list = list0.sort((a, b) => (b.last || '').localeCompare(a.last || ''));
  $('#view').innerHTML = `<header class="ph"><h1>Napredak</h1><p class="mute">Težina i tvoj max po vježbi</p></header>
    ${weights.length ? `<section class="card"><h3>${ic('scale', 16)} Težina${weights.length > 1 ? ' <span class="mute sm">(tjedni prosjek)</span>' : ''}</h3>${weightChart(weights)}</section>` : ''}
    <div class="list">${list.map((e) => `<a class="card li" href="#ex/${e.id}">
      <span class="ico big">${ic('dumbbell', 22)}</span>
      <div class="grow"><b>${esc(e.name)}</b><div class="mute sm">${e.last ? `${e.sessions}× · zadnji put ${dt(e.last).toLocaleDateString('hr-HR', { day: 'numeric', month: 'numeric' })}` : 'još nije rađena'}</div></div>
      ${e.e1rm ? `<div class="right"><div class="big-n">${n(e.e1rm)}<small> kg</small></div>${e.trend != null ? `<span class="ch ${e.trend > 0 ? 'up' : e.trend < 0 ? 'down' : 'flat'}">${ic(e.trend > 0 ? 'up' : e.trend < 0 ? 'down' : 'flat', 13)} ${sign(e.trend)}%</span>` : '<span class="mute sm">max</span>'}</div>` : ''}
      ${ic('right', 18, 'mute')}</a>`).join('')}</div>`;
}

async function renderExercise(id) {
  const { exercise, history, best } = await api('exercise/' + id);
  const asc = [...history].reverse();
  const first = asc[0], last = asc.at(-1);
  const total = first && last && first !== last ? ((last.metrics.e1rm.value - first.metrics.e1rm.value) / first.metrics.e1rm.value) * 100 : null;
  const metric = state.metric || 'e1rm';
  const pick = { e1rm: (h) => h.metrics.e1rm.value, heaviest: (h) => h.metrics.heaviest.kg, maxVolume: (h) => h.metrics.maxVolume.value };
  $('#view').innerHTML = `
    <a class="back" href="#exercises">${ic('left', 18)} Napredak</a>
    <section class="hero">
      <div class="eyebrow">${esc(exercise?.name || id)}</div>
      ${exercise?.video ? `<a class="link" href="${esc(exercise.video)}" target="_blank" rel="noopener">${ic('play', 15)} Video izvedbe</a>` : ''}
      ${last ? `<div class="hero-n">${n(last.metrics.e1rm.value)}<small> kg</small></div><div class="hero-sub">procjena maksa (1 ponavljanje)</div>
      ${total != null ? `<div class="hero-pr">${ic(total >= 0 ? 'up' : 'down', 16)} ${sign(Math.round(total * 10) / 10)}% od prvog zapisa (${fmtShort(first.date)})</div>` : ''}` : '<p>Još nema zapisa.</p>'}
    </section>
    ${asc.length ? `<section class="card">
      <div class="seg">${[['e1rm', 'Max'], ['heaviest', 'Najteže'], ['maxVolume', 'Volumen']].map(([k, l]) => `<button data-m="${k}" class="${metric === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${chart(asc.map((h) => ({ y: pick[metric](h), d: h.date })))}
    </section>` : ''}
    ${best ? `<section class="card"><h3>${ic('trophy', 16)} Rekordi</h3>${tiles({ heaviest: best.heaviest.heaviest, maxVolume: best.maxVolume.maxVolume, e1rm: best.e1rm.e1rm })}</section>` : ''}
    <section class="card"><h3>${ic('history', 16)} Povijest</h3>
      ${history.map((h) => `<div class="hist"><div class="row"><b class="grow">${cap(fmtShort(h.date))}</b>${h.warmup ? `<span class="mute sm">${ic('thermo', 13)} zagrijan</span>` : ''}</div>
        <div class="hsets">${h.sets.map((s) => `<span>${n(s.kg)}×${s.reps}${s.rpe != null ? `<i>${rirTxt(10 - s.rpe)}</i>` : ''}</span>`).join('')}</div>
        <div class="mute sm">Najteže ${n(h.metrics.heaviest.kg)} kg · volumen ${n(h.metrics.maxVolume.value)} kg · max ${n(h.metrics.e1rm.value)} kg</div></div>`).join('') || '<p class="mute">Nema zapisa</p>'}
    </section>`;
  for (const b of document.querySelectorAll('[data-m]')) b.onclick = () => { state.metric = b.dataset.m; renderExercise(id); };
}

// --- Tjedan -----------------------------------------------------------------
function weekLabel(w) {
  const [y, k] = w.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4)), mon = new Date(jan4);
  mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (k - 1) * 7);
  const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
  const f = (d) => `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
  return `${f(mon)} – ${f(sun)}`;
}
// The coach's comment: text of the saved report before the generated numbers.
const comment = (text) => (text || '').replace(/^# .*\n+/, '').split(/^Treninzi:/m)[0].trim();

async function renderWeek(week) {
  const weeks = await api('weeks');
  week = week || weeks[0];
  if (!week) { $('#view').innerHTML = `<header class="ph"><h1>Tjedan</h1></header><div class="empty">${ic('calendar', 40)}<p>Još nema zapisa.</p></div>`; return; }
  const { report, habits: h, text } = await api('week/' + week);
  const prs = report.exercises.filter((x) => Object.values(x.compare).some((c) => c.pr));
  const up = report.exercises.filter((x) => x.compare.e1rm.vsPrev?.pct > 0).length;
  const i = weeks.indexOf(week);
  $('#view').innerHTML = `
    <section class="hero">
      <div class="row"><a class="nav-w ${weeks[i + 1] ? '' : 'off'}" href="#week/${weeks[i + 1] || week}" aria-label="Prethodni tjedan">${ic('left', 20)}</a>
        <div class="grow center"><div class="eyebrow">Tjedan</div><h1>${weekLabel(week)}</h1></div>
        <a class="nav-w ${i > 0 ? '' : 'off'}" href="#week/${weeks[i - 1] || week}" aria-label="Sljedeći tjedan">${ic('right', 20)}</a></div>
      <div class="stats">
        <div><b>${report.workouts.length}</b><span>${report.workouts.length === 1 ? 'trening' : 'treninga'}</span></div>
        <div><b>${up}</b><span>jače</span></div>
        <div><b>${prs.length}</b><span>${prs.length === 1 ? 'rekord' : 'rekorda'}</span></div>
      </div>
    </section>
    ${h.logged ? `<section class="card"><h3>${ic('sun', 16)} Navike</h3><div class="tiles two">
      <div class="tile"><div class="tl">${ic('cookie', 14)} Bez slatkog</div><div class="tv">${h.days - h.sugarDays}<small> / ${h.days} dana</small></div></div>
      <div class="tile"><div class="tl">${ic('popcorn', 14)} Bez grickalica</div><div class="tv">${h.days - h.junkEvenings}<small> / ${h.days} večeri</small></div></div>
      <div class="tile"><div class="tl">${ic('moon', 14)} San</div><div class="tv">${h.sleep != null ? n(h.sleep) : '–'}<small> / 5</small></div><div class="ts">${h.sleepDays ? `prosjek, ${h.sleepDays} ${h.sleepDays === 1 ? 'noć' : 'noći'}` : 'nije upisan'}</div></div>
      <div class="tile"><div class="tl">${ic('scale', 14)} Težina</div><div class="tv">${h.weight != null ? n(h.weight) : '–'}<small> kg</small></div><div class="tf">${h.weightDelta != null ? `<span class="ch flat">${sign(h.weightDelta)} kg</span>` : '<span class="ts">prosjek tjedna</span>'}</div></div>
    </div></section>` : ''}
    ${comment(text) ? `<section class="card quote"><h3>${ic('msg', 16)} Komentar</h3><p>${esc(comment(text))}</p></section>` : ''}
    ${report.exercises.map((x) => `<section class="card ex">
      <div class="exh"><span class="ico big">${ic('dumbbell', 22)}</span><div class="grow"><h2>${esc(exName(x.exercise))}</h2>
        <div class="mute sm">${x.sessions}× ovaj tjedan</div></div>${Object.values(x.compare).some((c) => c.pr) ? `<span class="trophy">${ic('trophy', 20)}</span>` : ''}</div>
      ${x.prevWeek ? progressLine(x.compare, null, 'nego prošli tjedan') : progressLine(null)}
      ${tiles(x.metrics, x.compare, x.prev)}</section>`).join('')}`;
}

// --- Preračun ---------------------------------------------------------------
function renderCalc(kg = 60, reps = 5, rpe = 8) {
  const st = { kg, reps, rir: 10 - rpe, treps: 3, trir: 10 - rpe };
  $('#view').innerHTML = `<header class="ph"><h1>Preračun</h1><p class="mute">Isti osjećaj težine, drugi broj ponavljanja</p></header>
    <section class="card">
      <h3>${ic('dumbbell', 16)} Što si napravio?</h3>
      <div class="steppers">
        <div class="stepper"><label>Kilaža</label><div><button data-s="kg" data-d="-2.5">${ic('minus', 18)}</button><input id="ckg" type="number" inputmode="decimal" value="${kg}"><button data-s="kg" data-d="2.5">${ic('plus', 18)}</button></div><span>kg</span></div>
        <div class="stepper"><label>Ponavljanja</label><div><button data-s="reps" data-d="-1">${ic('minus', 18)}</button><input id="creps" type="number" inputmode="numeric" value="${reps}"><button data-s="reps" data-d="1">${ic('plus', 18)}</button></div><span>pon.</span></div>
      </div>
      <label class="lbl">${ic('battery', 15)} Koliko si još mogao?</label>
      ${rirChips('have', st.rir)}
      <div class="result sm-r">${ic('target', 18)} Tvoj max je otprilike <b id="ce1"></b></div>
    </section>
    <section class="card">
      <h3>${ic('swap', 16)} Koliko ponavljanja želiš?</h3>
      <div class="steppers one"><div class="stepper"><label>Ponavljanja</label><div><button data-s="treps" data-d="-1">${ic('minus', 18)}</button><input id="treps" type="number" inputmode="numeric" value="3"><button data-s="treps" data-d="1">${ic('plus', 18)}</button></div><span>pon.</span></div></div>
      <label class="lbl">${ic('battery', 15)} S koliko u rezervi?</label>
      ${rirChips('want', st.trir)}
      <div class="result"><div class="mute sm">Stavi na šipku</div><div class="hero-n accent" id="tout"></div><div class="mute sm" id="texact"></div></div>
      <details><summary>Tablica za sva ponavljanja</summary><div id="ttab"></div></details>
    </section>
    <p class="mute sm center">Procjena po RPE tablici (RTS, kao plsource.org/rpe-calc).</p>`;
  const v = $('#view');
  const upd = () => {
    st.kg = +$('#ckg').value; st.reps = +$('#creps').value; st.treps = +$('#treps').value;
    const set = { kg: st.kg, reps: st.reps, rpe: 10 - st.rir };
    if (!(st.kg > 0 && st.reps > 0 && st.treps > 0)) return;
    const t = convert(set, st.treps, 10 - st.trir);
    $('#ce1').textContent = `${n(e1rm(set))} kg`;
    $('#tout').innerHTML = `${bar(t)}<small> kg × ${st.treps}</small>`;
    $('#texact').textContent = `točno ${n(t)} kg · ${st.trir === 0 ? 'do otkaza' : `${rirTxt(st.trir)} u rezervi`}`;
    $('#ttab').innerHTML = [1, 2, 3, 4, 5, 6, 8, 10, 12].map((r) => `<div class="trow ${r === st.treps ? 'on' : ''}"><span>${r} pon.</span><b>${bar(convert(set, r, 10 - st.trir))} kg</b><span class="mute">${n(convert(set, r, 10 - st.trir))}</span></div>`).join('');
  };
  v.onclick = (e) => {
    const rb = e.target.closest('[data-rir]');
    if (rb) {
      const key = rb.dataset.group === 'have' ? 'rir' : 'trir';
      st[key] = +rb.dataset.rir;
      for (const b of v.querySelectorAll(`[data-group=${rb.dataset.group}]`)) b.classList.toggle('on', b === rb);
      return upd();
    }
    const s = e.target.closest('[data-s]');
    if (s) { const inp = $({ kg: '#ckg', reps: '#creps', treps: '#treps' }[s.dataset.s]); inp.value = Math.max(s.dataset.s === 'kg' ? 0 : 1, +inp.value + +s.dataset.d); upd(); }
  };
  v.oninput = upd;
  upd();
}

// --- Router -----------------------------------------------------------------
async function route() {
  const [tab, ...rest] = (location.hash.slice(1) || 'day').split('/');
  const t = tab === 'ex' ? 'exercises' : tab;
  for (const b of document.querySelectorAll('nav a')) b.classList.toggle('on', b.dataset.tab === (t === 'today' || t === 'exercises' || t === 'week' || t === 'calc' ? t : 'day'));
  v.onclick = null; v.oninput = null;
  try {
    if (tab === 'ex') await renderExercise(rest[0]);
    else if (t === 'exercises') await renderExercises();
    else if (t === 'week') await renderWeek(rest[0]);
    else if (t === 'calc') renderCalc(...rest.map(Number).filter((x) => x > 0));
    else if (t === 'today') await renderToday();
    else await renderDay();
  } catch (e) { $('#view').innerHTML = `<div class="card">Greška: ${esc(e.message)}</div>`; }
  window.scrollTo(0, 0);
}
const v = $('#view');
$('#help').onclick = glossary;
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (!document.hidden && ['', '#day', '#today'].includes(location.hash)) route(); });
exercises = await api('exercises');
route();
