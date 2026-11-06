#!/usr/bin/env node
// Smoke test of the Pavlovia upload folder as a standalone site (no network leaves the machine).
//
//   node test/deploy_smoke.mjs [--dir "<path to pavlovia_upload>"]
//
// Checks: (1) served from 127.0.0.1, the page loads, every local file it requests exists (no 404),
// the device-check page renders, and the consent link points to the UCLA Box copy; (2) served under the hostname
// run.pavlovia.org (mapped to 127.0.0.1 inside Chrome) with the placeholder projectId still in
// config.json, the page refuses to start ("This study is not available yet"), i.e. a premature
// push fails safe instead of saving data on participants' computers. Every external request is
// blocked (dead proxy + CDP Fetch abort).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './lib/cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argDir = process.argv.indexOf('--dir');
const DIR = argDir > 0 ? process.argv[argDir + 1] : path.resolve(here, '..', '..', 'pavlovia_upload');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let fails = 0;
let CFG = null;   // config.json of the folder under test
const ck = (ok, label) => { console.log((ok ? 'PASS ' : 'FAIL ') + label); if (!ok) fails++; };

async function run(port, host, label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's3smoke-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${dir}`,
    '--no-first-run', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;run.pavlovia.org',
    '--host-resolver-rules=MAP run.pavlovia.org 127.0.0.1', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore'] });
  const pf = path.join(dir, 'DevToolsActivePort'); const t0 = Date.now();
  while (!fs.existsSync(pf) || fs.readFileSync(pf, 'utf8').split('\n').length < 2) { if (Date.now() - t0 > 20000) throw new Error('chrome'); await sleep(100); }
  const [p, ws] = fs.readFileSync(pf, 'utf8').trim().split('\n');
  const cdp = await new CDP(`ws://127.0.0.1:${p.trim()}${ws.trim()}`).connect();
  const local = [], blocked = [], errors = [];
  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    cdp.on('Fetch.requestPaused', async (e, s) => {
      if (s !== sid) return;
      const u = new URL(e.request.url);
      if (u.hostname === host) { local.push(u.pathname); return cdp.send('Fetch.continueRequest', { requestId: e.requestId }, sid); }
      blocked.push(u.hostname); return cdp.send('Fetch.failRequest', { requestId: e.requestId, errorReason: 'BlockedByClient' }, sid);
    });
    const statuses = {};
    cdp.on('Network.responseReceived', (e, s) => { if (s === sid) { try { statuses[new URL(e.response.url).pathname] = e.response.status; } catch { /* */ } } });
    cdp.on('Runtime.exceptionThrown', (e, s) => { if (s === sid) errors.push((e.exceptionDetails.exception || {}).description || e.exceptionDetails.text); });
    await cdp.send('Network.enable', {}, sid); await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }, sid);
    await cdp.send('Page.enable', {}, sid); await cdp.send('Runtime.enable', {}, sid);
    await cdp.send('Page.navigate', { url: `http://${host}:${port}/index.html` }, sid);
    const ev = async (x) => (await cdp.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sid)).result.value;
    await sleep(3500);
    const body = await ev('document.body.innerText');
    if (host === '127.0.0.1') {
      ck(/Device Check/.test(body), `${label}: page loads and shows the device check`);
      const curl = await ev(`CONSENT_URL`);
      ck(curl === 'https://ucla.box.com/s/aetncw10cuf1cijrii2lytieizvae0pv', `${label}: consent download link points to the UCLA Box copy (${curl})`);
      const img = await ev(`fetch('captcha.png').then(r=>r.status)`);
      ck(img === 200, `${label}: captcha.png served`);
      const bad = Object.entries(statuses).filter(([pth, st]) => st >= 400 && pth !== '/favicon.ico');   // the browser's automatic icon request is not part of the study
      ck(bad.length === 0, `${label}: no local request failed (${Object.keys(statuses).join(', ')})`);
      ck(errors.length === 0, `${label}: no page exceptions${errors.length ? ': ' + errors[0] : ''}`);
      const consentHasForm = await ev(`(function(){var i=P.findIndex(function(p){return /<h1>Consent<\\/h1>/.test(p.html)});return i>=0&&/consent-text/.test(P[i].html)&&/ucla\\.box\\.com\\/s\\/aetncw10cuf1cijrii2lytieizvae0pv/.test(P[i].html)})()`);
      ck(consentHasForm === true, `${label}: consent page holds the full consent text and the PDF link`);
    } else if (/^TODO/i.test(String(CFG.gitlab.projectId))) {
      ck(/not available yet/i.test(body), `${label}: with the placeholder projectId, the page refuses to start on a Pavlovia hostname`);
      ck(!blocked.includes('pavlovia.org'), `${label}: no request to the Pavlovia API was attempted`);
    } else {
      // Live projectId (after IRB approval): the page starts and opens a Pavlovia session (blocked here, so nothing is saved).
      ck(!/not available yet/i.test(body) && /Device Check/.test(body), `${label}: with projectId ${CFG.gitlab.projectId}, the page starts on a Pavlovia hostname`);
      ck(blocked.includes('pavlovia.org'), `${label}: the page tried to open a Pavlovia session (request blocked by the test)`);
    }
    ck(true, `${label}: external requests blocked: ${blocked.length ? [...new Set(blocked)].join(', ') : 'none attempted'}`);
  } finally { try { await cdp.send('Browser.close'); } catch { /* */ } cdp.close(); try { proc.kill('SIGKILL'); } catch { /* */ } await sleep(800); try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* temp profile left for the OS to clean */ } }
}

(async () => {
  const want = ['index.html', 'experiment.js', 'style.css', 'config.json', 'captcha.png'];
  const have = fs.readdirSync(DIR).filter((f) => !f.startsWith('.'));
  ck(JSON.stringify(have.sort()) === JSON.stringify(want.slice().sort()), `upload folder holds exactly the five files (${have.join(', ')})`);
  const cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
  CFG = cfg;
  ck(!!cfg.experiment && !!cfg.gitlab, `config.json is valid JSON (fullpath ${cfg.experiment.fullpath}, projectId ${cfg.gitlab.projectId})`);
  const port = await freePort();
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: DIR, stdio: 'ignore' });
  await sleep(700);
  try { await run(port, '127.0.0.1', 'local'); await run(port, 'run.pavlovia.org', 'pavlovia-hostname'); } finally { srv.kill(); }
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nDEPLOY SMOKE TEST PASSED');
  process.exit(fails ? 1 : 0);
})();
