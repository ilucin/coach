import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readAssistantUrl } from '../lib/assistant.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coach-assistant-'));
const file = (name, v) => { const f = path.join(root, name); fs.writeFileSync(f, typeof v === 'string' ? v : JSON.stringify(v)); return f; };

test('assistant: embed URL from config', () => {
  const f = file('ok.json', { fleetUrl: 'https://shed.example.ts.net:7443/', host: 'shed', dir: '~/Code/coach' });
  assert.equal(readAssistantUrl(f, {}), 'https://shed.example.ts.net:7443/?host=shed&dir=%7E%2FCode%2Fcoach&app=coach#/embed');
});

test('assistant: env overrides fleetUrl, dir defaults to the repo', () => {
  const f = file('env.json', { host: 'shed' });
  const url = readAssistantUrl(f, { COACH_FLEET_URL: 'http://127.0.0.1:7777' });
  assert.match(url, /^http:\/\/127\.0\.0\.1:7777\/\?host=shed&dir=%2F.+&app=coach#\/embed$/);
});

test('assistant: off without a valid config', () => {
  assert.equal(readAssistantUrl(null, {}), null);
  assert.equal(readAssistantUrl(path.join(root, 'missing.json'), {}), null);
  assert.equal(readAssistantUrl(file('bad.json', '{'), {}), null);
  assert.equal(readAssistantUrl(file('nohost.json', { fleetUrl: 'https://a:1' }), {}), null);
  assert.equal(readAssistantUrl(file('path.json', { fleetUrl: 'https://a:1/x', host: 'h' }), {}), null);
  assert.equal(readAssistantUrl(file('nourl.json', { host: 'h' }), {}), null);
});
