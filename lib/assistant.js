// Asistent: Fleetov embed view (`#/embed`, chat s Claude sesijama u jednom direktoriju) koji UI
// otvara u iframeu. Coach ne zna ništa o sesijama, samo gradi URL (isto kao Fin i Brain).
//
// Konfiguracija je lokalna za mašinu (nije u gitu): `~/.config/coach/assistant.json`
//
//   { "fleetUrl": "https://<shed>.<tailnet>.ts.net:7443", "host": "<fleet host>", "dir": "~/Code/coach" }
//
// `COACH_FLEET_URL` u envu pregazi `fleetUrl`. `dir` je zadano repo u kojem server radi; mora biti
// u Fleetovim `spawnDirs` tog hosta. Bez fajla (ili s nevaljanim) gumba nema.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ASSISTANT_FILE = path.join(os.homedir(), '.config/coach/assistant.json');
const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const ORIGIN = /^https?:\/\/[^\s/]+$/;

/** Embed URL bez `theme` (UI ga dodaje po svom modu); `null` = asistent isključen. */
export function readAssistantUrl(file, env = process.env) {
  if (!file) return null;
  let c;
  try { c = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  if (typeof c?.host !== 'string' || !c.host) return null;
  if (c.dir != null && (typeof c.dir !== 'string' || !c.dir)) return null;
  const fleetUrl = (env.COACH_FLEET_URL?.trim() || c.fleetUrl)?.replace(/\/+$/, '');
  if (typeof fleetUrl !== 'string' || !ORIGIN.test(fleetUrl)) return null;
  const q = new URLSearchParams({ host: c.host, dir: c.dir ?? REPO, app: 'coach' });
  // Upit ide prije hasha: Fleetov hash router ga ionako seli tamo (Fleet docs → Embed view).
  return `${fleetUrl}/?${q}#/embed`;
}
