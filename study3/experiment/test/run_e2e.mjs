#!/usr/bin/env node
// Study 3 end-to-end harness: runs the REAL experiment (index.html + experiment.js, unmodified)
// in headless Google Chrome, driven over the Chrome DevTools Protocol, and walks a synthetic
// participant through every page. Every network request is intercepted; the counterbalance
// Worker, OpenRouter, Pavlovia and the SONA redirect are mocked, every other external host is
// blocked, and the browser sits behind a dead proxy. See README_test.md.
//
//   node test/run_e2e.mjs [--only id1,id2] [--parallel N] [--no-mobile] [--no-abandon] [--no-shots] [--list]
//
// Environment (all optional): CHROME_PATH, HARNESS_TMP (Chrome profiles and downloads; default
// the OS temp dir), PREREG, S2_JS, S2_RAW (default: the lab folder layout around this file).
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChrome, sleep } from './lib/cdp.mjs';
import { installNetwork, externalRequestAudit, redact } from './lib/mocks.mjs';
import { Participant } from './lib/participant.mjs';
import { checkFinalRecord, checkAbandon, checkAssign, checkNoProbe2 } from './lib/checks.mjs';
import { CELLS, ORDERS, expectedPageSequence, loadPrereg, study2ColumnsFromCode, study2ColumnsFromRawHeaders, study2Vignette1 } from './lib/spec.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXP_DIR = path.resolve(TEST_DIR, '..');
const LAB_ROOT = path.resolve(EXP_DIR, '..', '..', '..');
const PREREG = process.env.PREREG || path.join(LAB_ROOT, 'Docs', 'Preregistration', 'Study3_Preregistration_Update_DRAFT_2026-10-01.md');
const S2_JS = process.env.S2_JS || path.join(LAB_ROOT, 'Analysis', 'Study 2', 'experiment', 'experiment.js');
const S2_RAW = process.env.S2_RAW || path.join(LAB_ROOT, 'Analysis', 'Study 2', 'data', 'raw');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TMP = path.join(process.env.HARNESS_TMP || os.tmpdir(), 'study3-e2e');
const OUT = path.join(TEST_DIR, 'output');
const SHOTS = path.join(TEST_DIR, 'screenshots');

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const flag = (name) => args.includes(name);
const PARALLEL = Math.max(1, parseInt(opt('--parallel') || '3', 10));

// ------------------------------------------------------------------ secrets (never printed)
// The OpenRouter key and the SONA credit token are read from experiment.js only to compare them
// with what the page sends (booleans) and to count them in the files this harness writes.
const EXP_SRC = fs.readFileSync(path.join(EXP_DIR, 'experiment.js'), 'utf8');
const SECRET_KEY = (/apiKey\s*:\s*'([^']*)'/.exec(EXP_SRC) || [])[1] || '';
const SECRET_TOKEN = (/SONA_CREDIT_TOKEN_TODO\s*=\s*'([^']*)'/.exec(EXP_SRC) || [])[1] || '';
const authMatches = (h) => typeof h === 'string' && SECRET_KEY.length > 0 && h === 'Bearer ' + SECRET_KEY;
const tokenMatches = (t) => typeof t === 'string' && SECRET_TOKEN.length > 0 && t === SECRET_TOKEN;
const secretCount = (text) => {
  let n = 0;
  for (const s of [SECRET_KEY, SECRET_TOKEN]) if (s && s.length >= 8) n += String(text).split(s).length - 1;
  return n;
};

// ------------------------------------------------------------------ runs
const DESKTOP_PLAN = [
  { msg: 2 }, { msg: 3 }, { msg: 4 },
  { msg: 5, setSecs: 312, expectNoProbe2: true },          // reply lands at ~288 s active: no probe 2
  { msg: 6, setSecs: 301, delay: 1600, expectProbe: 2 },  // reply lands at >= 300 s: probe 2
  { msg: 7 }, { msg: 8 },
];
const MOBILE_PLAN = [
  { msg: 2 }, { msg: 3, status: 500 }, { msg: 4 },        // injected HTTP 500 (C8)
  { msg: 5, setSecs: 312, expectNoProbe2: true },
  { msg: 6, setSecs: 301, delay: 1600, expectProbe: 2 },
  { msg: 7 }, { msg: 8 },
  { msg: 9, lateAtEnd: true, delay: 6000 },               // sent just before the time-out; reply arrives after it (C11)
];
const probe2Sends = (plan) => 1 + plan.findIndex((s) => s.expectProbe === 2) + 1;

function defineRuns() {
  const runs = [];
  CELLS.forEach((cell, ci) => ORDERS.forEach((order, oi) => {
    const n = ci * 2 + oi + 1;
    runs.push({
      id: `${cell}_${order}`, kind: 'desktop', cell, order, mode: 'pavlovia', pid: `9900${String(n).padStart(2, '0')}`, pidViaUrl: true,
      mobile: false, touch: false, attnFail: false, testId: false, slot: n - 1, slotTag: `d${n}`, seed: 1000 + n,
      probeValues: { 1: 2 + (n % 3), 2: 3 + (n % 3), 3: 4 + (n % 3) }, chatPlan: DESKTOP_PLAN, viewport: '1280x800',
    });
  }));
  if (!flag('--no-mobile')) runs.push({
    id: 'HighA_LowE_bonding_first_mobile375', kind: 'mobile', cell: 'HighA_LowE', order: 'bonding_first', mode: 'local', pid: 'TESTharness375', pidViaUrl: false,
    mobile: true, touch: true, attnFail: true, testId: true, ageProbe: true, slot: 3, slotTag: 'm1', seed: 2001,
    probeValues: { 1: 3, 2: 4, 3: 5 }, chatPlan: MOBILE_PLAN, viewport: '375x812',
  });
  if (!flag('--no-abandon')) runs.push({
    id: 'abandon_LowA_LowE_impression_first', kind: 'abandon', cell: 'LowA_LowE', order: 'impression_first', mode: 'pavlovia', pid: '990099', pidViaUrl: true,
    mobile: false, touch: false, attnFail: false, testId: false, slot: 8, slotTag: 'a1', seed: 3001,
    probeValues: { 1: 4, 2: 4, 3: 4 }, chatPlan: [{ msg: 2 }], viewport: '1280x800',
  });
  if (!flag('--no-extra')) {
    // Extra scenarios (short runs): condition-assignment branches (C3, C4) and the slider probe.
    const x = (id, o) => ({ id, kind: 'assign', cell: 'HighA_HighE', order: 'impression_first', mode: 'pavlovia', pidViaUrl: true, mobile: false, touch: false,
      attnFail: false, testId: false, seed: 5000 + runs.length, probeValues: { 1: 5, 2: 5, 3: 5 }, chatPlan: [], viewport: '1280x800', ...o });
    runs.push(x('extra_fallback_on_study_mismatch', { workerMode: 'mismatch', pid: '990201', slot: 11, slotTag: 'x1' }));
    runs.push(x('extra_test_id_worker_http500', { workerMode: 'http500', pid: 'TESTfallback500', testId: true, slot: 12, slotTag: 'x2' }));
    runs.push(x('extra_worker_without_order', { workerMode: 'no_order', cell: 'LowA_HighE', order: 'bonding_first', pid: '990203', slot: 13, slotTag: 'x3' }));
    runs.push(x('extra_reload_reuses_assignment', { reload: true, cell: 'LowA_LowE', order: 'bonding_first', pid: '990204', slot: 14, slotTag: 'x4' }));
    runs.push(x('extra_slider_probe', { kind: 'slider', probeFormat: 'slider', cell: 'LowA_HighE', order: 'impression_first', pid: '990205', slot: 15, slotTag: 'x5' }));
    runs.push(x('extra_worker_timeout', { workerMode: 'timeout', cell: 'HighA_LowE', order: 'bonding_first', pid: '990206', slot: 16, slotTag: 'x6' }));
    runs.push(x('extra_probe2_not_triggered', { kind: 'noprobe2', cell: 'LowA_LowE', order: 'bonding_first', pid: '990207', slot: 17, slotTag: 'x7', chatPlan: [{ msg: 2 }], probeValues: { 1: 3, 2: 3, 3: 6 } }));
  }
  for (const r of runs) r.probe2Sends = r.chatPlan.length ? probe2Sends(r.chatPlan) : null;
  const only = opt('--only');
  return only ? runs.filter((r) => only.split(',').includes(r.id)) : runs;
}

// Harness-side observation hooks, installed in the page at DOMContentLoaded (before the first
// render): wrap checkpoint() and PAVLOVIA.save() to report the staged partial keys and the final
// CSV through a CDP binding. Behaviour of the experiment is unchanged (originals are called).
const HOOK_SRC = `(function(){
  if (location.protocol!=='http:'||location.hostname!=='127.0.0.1') return;
  document.addEventListener('DOMContentLoaded',function(){
    try{
      var send=function(o){try{window.__harnessCapture(JSON.stringify(o))}catch(e){}};
      var FULL={consent:1,chat_end:1,probe_1:1,probe_3:1};
      if(window.__harnessProbeFormat)PROBE_FORMAT=window.__harnessProbeFormat;
      if(typeof window.checkpoint==='function'){var oc=window.checkpoint;window.checkpoint=function(stage){var r=oc.apply(this,arguments);var o={type:'checkpoint',stage:String(stage),key:PAVLOVIA._lastKey,len:(PAVLOVIA._lastCSV||'').length,t:Date.now()};if(FULL[stage])o.csv=PAVLOVIA._lastCSV;send(o);return r}}
      if(window.PAVLOVIA&&typeof PAVLOVIA.save==='function'){var os=PAVLOVIA.save;PAVLOVIA.save=function(d){send({type:'final',csv:PAVLOVIA.toCSV(d),t:Date.now()});return os.apply(this,arguments)}}
      window.__harnessHooks=true;
    }catch(e){window.__harnessHookError=String(e)}
  },true);
})();`;

// ------------------------------------------------------------------ screenshots
const shots = {
  taken: new Set(),
  file(name, run) { return name.startsWith('S0_') ? `${name}_desktop_1280x800.png` : `${name}_${run.mobile ? 'mobile_375x812' : 'desktop_1280x800'}.png`; },
  wantS0(cell) { return !this.taken.has(`S0_${cell}_desktop_1280x800.png`); },
  wantIos(run) { return !this.taken.has(this.file('ios_probe1', run)); },
  save(name, buf, run) {
    const f = this.file(name, run);
    if (this.taken.has(f)) return;
    this.taken.add(f);
    fs.writeFileSync(path.join(SHOTS, f), buf);
    run.screenshots.push(path.join(SHOTS, f));
  },
};

// ------------------------------------------------------------------ static server
async function freePort() {
  return new Promise((resolve, reject) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); s.on('error', reject); });
}
async function startServer() {
  const port = await freePort();
  fs.mkdirSync(TMP, { recursive: true });
  const logFile = fs.openSync(path.join(TMP, 'http_server.log'), 'w');
  const proc = spawn('python3', ['-I', '-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', EXP_DIR], { stdio: ['ignore', logFile, logFile], cwd: TMP });
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/index.html`); if (r.ok) return { port, proc }; } catch { /* not up yet */ }
    await sleep(100);
  }
  proc.kill();
  throw new Error('local http.server did not start');
}

// ------------------------------------------------------------------ one run
async function waitUntil(fn, timeout) { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > timeout) return false; await sleep(100); } return true; }

async function executeRun(run, ctx) {
  Object.assign(run, { checks: [], problems: [], notes: [], screenshots: [], replyPlan: [], csvPath: null, fatal: null,
    events: { checkpoints: [], finalInPage: null, console: [], exceptions: [], dialogs: [], columnsLogged: null } });
  run.screen = run.mobile ? { w: 375, h: 812 } : { w: 1440, h: 900 };
  const t0 = Date.now();
  const chrome = await launchChrome({ chromePath: CHROME_PATH, profileRoot: TMP, tag: run.slotTag, windowSize: run.mobile ? '375,812' : '1280,800' });
  const { cdp } = chrome;
  const ck = (name, pass, detail = '') => run.checks.push({ name, pass: !!pass, detail: String(detail) });
  let sid = null;
  try {
    const ver = await cdp.send('Browser.getVersion');
    run.chrome = ver.product;
    // Browser-level target audit: the Fetch interception is enabled on the page session, so any
    // other target that could issue requests (dedicated/shared/service worker, out-of-process
    // frame) would bypass it. Every target created during the run is recorded and checked below.
    run.targets = [];
    cdp.on('Target.targetCreated', (p, s) => { if (s) return; const t = p.targetInfo || {}; run.targets.push({ type: t.type, url: redact(t.url || '') || t.url, scheme: String(t.url || '').split(':')[0], ctx: t.browserContextId || null }); });
    await cdp.send('Target.setDiscoverTargets', { discover: true });
    const major = (/Chrome\/(\d+)/.exec(ver.product) || [])[1] || '155';
    const { browserContextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
    run.browserContextId = browserContextId;
    if (run.mode === 'local') {
      run.downloadDir = fs.mkdtempSync(path.join(TMP, `dl-${run.slotTag}-`));
      await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', browserContextId, downloadPath: run.downloadDir, eventsEnabled: true });
      cdp.on('Browser.downloadWillBegin', (p) => { run.download = { guid: p.guid, suggestedFilename: p.suggestedFilename, state: 'started' }; });
      cdp.on('Browser.downloadProgress', (p) => { if (run.download && p.guid === run.download.guid) run.download.state = p.state; });
    }
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
    ({ sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }));
    cdp.on('Runtime.bindingCalled', (p, s) => {
      if (s !== sid || p.name !== '__harnessCapture') return;
      let o; try { o = JSON.parse(p.payload); } catch { return; }
      if (o.type === 'checkpoint') run.events.checkpoints.push(o);
      if (o.type === 'final') run.events.finalInPage = o.csv;
    });
    cdp.on('Runtime.consoleAPICalled', (p, s) => {
      if (s !== sid) return;
      const text = (p.args || []).map((a) => (a.value !== undefined ? String(a.value) : (a.description || ''))).join(' ').slice(0, 300);
      if (p.type === 'warning' || p.type === 'error') run.events.console.push({ type: p.type, text });
      if (/^Columns:/.test(text)) run.events.columnsLogged = text;
    });
    cdp.on('Runtime.exceptionThrown', (p, s) => {
      if (s !== sid) return;
      const d = p.exceptionDetails || {};
      run.events.exceptions.push(((d.exception && d.exception.description) || d.text || '').split('\n')[0].slice(0, 300));
    });
    cdp.on('Page.javascriptDialogOpening', async (p, s) => {
      if (s !== sid) return;
      run.events.dialogs.push({ type: p.type, message: String(p.message).slice(0, 200) });
      try { await cdp.send('Page.handleJavaScriptDialog', { accept: true }, sid); } catch { /* ignore */ }
    });
    await cdp.send('Page.enable', {}, sid);
    await cdp.send('Runtime.enable', {}, sid);
    await installNetwork(cdp, sid, run, ctx);
    await cdp.send('Runtime.addBinding', { name: '__harnessCapture' }, sid);
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: (run.probeFormat ? `window.__harnessProbeFormat=${JSON.stringify(run.probeFormat)};` : '') + HOOK_SRC }, sid);
    if (run.mobile) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true, screenWidth: 375, screenHeight: 812 }, sid);
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36`, platform: 'Linux armv8l' }, sid);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sid);
    } else {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900 }, sid);
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`, platform: 'MacIntel' }, sid);
    }
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true }, sid);
    const url = `http://127.0.0.1:${ctx.port}/index.html` + (run.pidViaUrl ? `?survey_code=${encodeURIComponent(run.pid)}` : '');
    await cdp.send('Page.navigate', { url }, sid);

    const part = new Participant({ cdp, sid, run, spec: ctx.spec, s2v1: ctx.s2v1, shots: (ctx.noShots || ['abandon', 'assign', 'noprobe2'].includes(run.kind)) ? null : shots });
    const expected = expectedPageSequence(run.order, { attnFail: run.attnFail });
    const res = await part.walk({ expected, abandonInChat: run.kind === 'abandon', stopAfterPid: run.kind === 'assign' ? 'sona_id' : (run.kind === 'noprobe2' ? 'chat' : null) });
    run.marks.walkDone = Date.now();

    if (run.kind === 'assign') {
      const snap = async () => JSON.parse(await part.ev(`JSON.stringify({r:ST.r,stored:sessionStorage.getItem('cb_assignment_'+ST.r.cb_study_code+'_'+PAVLOVIA.safePid(ST.pid))})`));
      const first = await snap();
      let second = null;
      if (run.reload) {
        await cdp.send('Page.reload', { ignoreCache: true }, sid);
        const p2 = new Participant({ cdp, sid, run, spec: ctx.spec, s2v1: ctx.s2v1, shots: null });
        await p2.walk({ expected, stopAfterPid: 'sona_id' });
        second = await snap();
      }
      run.checks.push(...checkAssign(run, first, second, ctx));
    } else if (run.kind === 'slider') {
      if (res !== 'stop') ck('slider scenario stopped after probe 1', false, res);
    } else if (run.kind === 'noprobe2') {
      if (res !== 'stop') ck('probe-2 scenario stopped after the chat page', false, res);
      await sleep(300);
      const snap = JSON.parse(await part.ev(`JSON.stringify({r:ST.r,probeShown2:!!CS.probeShown[2],pid:P[ST.cp].pid})`));
      run.checks.push(...checkNoProbe2(run, snap, ctx));
    } else if (res === 'abandon') {
      await sleep(400);
      await cdp.send('Page.navigate', { url: 'about:blank' }, sid);   // participant leaves mid-chat
      await waitUntil(() => run.net.pavlovia.some((e) => e.kind === 'close-beacon'), 8000);
      await sleep(800);
      const r = checkAbandon(run, ctx);
      run.checks.push(...r.checks);
      if (r.csv) { run.csvPath = path.join(OUT, `abandon_${run.cell}_${run.order}_PARTIAL.csv`); fs.writeFileSync(run.csvPath, r.csv); }
    } else {
      const gotSona = await waitUntil(() => run.net.sona.length > 0, 20000);
      if (!gotSona) run.problems.push(`[${run.id}] no SONA redirect within 20 s after "Complete Study"`);
      if (run.mode === 'local') await waitUntil(() => run.download && run.download.state === 'completed', 10000);
      await sleep(1500); // catch any beacon fired by pagehide on the redirect
      let csvText = null;
      if (run.mode === 'pavlovia') {
        const up = run.net.pavlovia.find((e) => e.kind === 'results' && e.form && !/_PARTIAL\.csv$/.test(e.form.key || ''));
        csvText = up ? up.form.value : null;
        run.csvSource = 'mocked Pavlovia results upload (multipart body, value field)';
      } else if (run.download && run.download.state === 'completed') {
        csvText = fs.readFileSync(path.join(run.downloadDir, run.download.suggestedFilename), 'utf8');
        run.csvSource = 'browser download (local mode)';
      }
      if (!csvText) { ck('final CSV captured', false, 'no upload/download captured'); }
      else {
        run.csvPath = path.join(OUT, run.kind === 'mobile' ? `${run.id}.csv` : `${run.cell}_${run.order}.csv`);
        fs.writeFileSync(run.csvPath, csvText);
        const r = checkFinalRecord(run, csvText, ctx);
        run.checks.push(...r.checks);
        run.nColumns = r.header.length;
      }
    }

    // ---- generic checks for every run
    const audit = externalRequestAudit(run, ctx.port);
    ck('zero unmocked external requests reached the network (every non-loopback request fulfilled by a mock or blocked)', audit.length === 0, audit.join(' | ') || `${run.net.networkReqs.size} requests observed, ${run.net.mocked.length} mocked, ${run.net.blocked.length} blocked`);
    ck('no request to any other external host (none had to be blocked)', run.net.blocked.length === 0, run.net.blocked.map((b) => `${b.method} ${b.url}`).join(' | '));
    ck('mock handlers raised no errors', run.net.handlerErrors.length === 0, run.net.handlerErrors.join(' | '));
    // Chrome's own component extensions and browser UI (chrome:, chrome-extension:) run outside the
    // run's browser context and sit behind the dead proxy; they are listed but not counted.
    const chromeInternal = (t) => /^(chrome|chrome-extension|chrome-untrusted|devtools)$/.test(t.scheme);
    const inRun = (t) => (t.ctx === run.browserContextId && !chromeInternal(t)) || /^(https?|blob|data|ws|wss)$/.test(t.scheme);
    const oddTargets = run.targets.filter((t) => inRun(t) && t.type !== 'page');
    const runPages = run.targets.filter((t) => t.ctx === run.browserContextId && t.type === 'page');
    ck('no worker, service-worker or out-of-process-frame target in the experiment context; one page only (every request came from the intercepted page session)', oddTargets.length === 0 && runPages.length === 1,
      (oddTargets.length ? 'UNEXPECTED: ' + oddTargets.map((t) => `${t.type} ${t.url}`).join(' | ') + '; ' : '') + `${runPages.length} page target(s) in the run context; Chrome-internal targets outside it: ${run.targets.filter((t) => !inRun(t)).map((t) => t.type + ' ' + t.scheme + ':').join(', ') || 'none'}`);
    if (run.mode === 'pavlovia') ck('harness served config.json with a mock projectId (file on disk unchanged)', run.net.configOverridden);
    ck('harness observation hooks installed before the first page', run.live.hooks === true);
    ck('no uncaught JavaScript exception in the page', run.events.exceptions.length === 0, run.events.exceptions.join(' | '));
    const expectedWarn = (w) => (run.mode === 'local' && /\[Pavlovia\] Init failed: Placeholder gitlab\.projectId/.test(w.text)) ||
      (!!run.workerMode && run.workerMode !== 'no_order' && /^\[Counterbalance\] Worker unreachable or response rejected/.test(w.text));
    const badConsole = run.events.console.filter((w) => !expectedWarn(w));
    ck('no console warning or error (expected: the C17 placeholder warning in local mode; the fallback warning when the Worker fails)', badConsole.length === 0, badConsole.map((w) => `${w.type}: ${w.text}`).join(' | '));
    if (run.workerMode === 'http500' && run.testId) ck('TEST session with a failing Worker: one investigator alert (readiness 2.13)', run.events.dialogs.length === 1 && /^\[TEST session\] Counterbalance Worker failed/.test(run.events.dialogs[0].message), run.events.dialogs.map((d) => d.message).join(' | '));
    else ck('no alert/confirm dialog', run.events.dialogs.length === 0, run.events.dialogs.map((d) => d.message).join(' | '));
    ck(`page count = 56 (P.length; Study 2 pages + C25/C26/C16 additions)`, run.live.pageCount === 56, run.live.pageCount);
  } catch (e) {
    run.fatal = e.message + (cdp.closed ? ' [' + chrome.info() + ']' : '');
    ck('run completed without a harness error', false, e.message);
    try {
      if (sid) {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
        const f = path.join(SHOTS, `FAIL_${run.id}.png`);
        fs.writeFileSync(f, Buffer.from(data, 'base64')); run.screenshots.push(f);
      }
    } catch { /* ignore */ }
  } finally {
    await chrome.close();
    if (run.downloadDir) { try { fs.rmSync(run.downloadDir, { recursive: true, force: true }); } catch { /* ignore */ } }
  }
  run.seconds = Math.round((Date.now() - t0) / 1000);
  const failed = run.checks.filter((c) => !c.pass);
  const report = {
    id: run.id, kind: run.kind, cell: run.cell, order: run.order, viewport: run.viewport, mode: run.mode, pid: run.pid,
    chrome: run.chrome, seconds: run.seconds, completed: !run.fatal && (['abandon', 'assign', 'slider', 'noprobe2'].includes(run.kind) || !!(run.net && run.net.sona.length === 1)),
    n_columns: run.nColumns || null, csv: run.csvPath ? path.relative(TEST_DIR, run.csvPath) : null, csv_source: run.csvSource || null,
    passed: run.checks.length - failed.length, failed: failed.length, fatal: run.fatal,
    checks: run.checks, problems: run.problems, notes: [...run.notes, ...((run.live && run.live.notes) || [])],
    network: {
      mocked: summarize(run.net ? run.net.mocked : []), blocked: run.net ? run.net.blocked : [],
      worker_calls: run.net ? run.net.workerCalls.map((w) => ({ study: w.study, response: w.response })) : [],
      openrouter_calls: run.net ? run.net.orCalls.length : 0,
      pavlovia: run.net ? run.net.pavlovia.map((e) => ({ kind: e.kind, method: e.method, beacon: e.resourceType === 'Ping', key: e.form && e.form.key ? e.form.key.replace(String(run.pid), '<pid>') : undefined, isCompleted: e.form && e.form.isCompleted })) : [],
      sona_redirects: run.net ? run.net.sona.map((s) => ({ experiment_id: s.experiment_id, survey_code_is_pid: s.survey_code === run.pid, token_present: s.tokenPresent, token_matches_code: s.tokenMatchesCode })) : [],
    },
    targets: run.targets || [],
    console: run.events.console, exceptions: run.events.exceptions, columns_logged: run.events.columnsLogged,
    live: run.live ? { timers: run.live.timers, pause: run.live.pause, probe_dom: run.live.dom, chat: run.live.chat } : null,
    screenshots: run.screenshots.map((f) => path.relative(TEST_DIR, f)),
  };
  fs.writeFileSync(path.join(OUT, `${run.id}.checks.json`), JSON.stringify(report, null, 1));
  return report;
}

function summarize(list) {
  const m = {};
  for (const x of list) { const k = `${x.method} ${x.host}${x.path}`; m[k] = (m[k] || 0) + 1; }
  return m;
}

// ------------------------------------------------------------------ main
async function main() {
  const runs = defineRuns();
  if (flag('--list')) { for (const r of runs) console.log(r.id); return 0; }
  for (const p of [PREREG, S2_JS]) if (!fs.existsSync(p)) throw new Error('missing input: ' + p);
  if (!SECRET_KEY || !SECRET_TOKEN) console.log('note: experiment.js has no OpenRouter key or SONA token constant in the expected form; the corresponding checks will fail');
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  if (!opt('--only')) { // a full run replaces the previous results (only this harness's own output files)
    for (const f of fs.readdirSync(OUT)) if (/\.(csv|json)$/.test(f)) fs.rmSync(path.join(OUT, f));
    for (const f of fs.readdirSync(SHOTS)) if (/\.png$/.test(f)) fs.rmSync(path.join(SHOTS, f));
  }
  const spec = loadPrereg(PREREG);
  // PI decision of 2026-10-19: the pre-chat notice reads "Up to three times ..." (prereg revision 3, Appendix D.2).
  const REV3 = path.join(LAB_ROOT, 'Docs', 'Preregistration', 'Study3_Preregistration_Update_DRAFT_2026-10-16.md');
  if (fs.existsSync(REV3)) {
    const m = /^### D\.2[\s\S]*?\n> "([^"\n]+)"/m.exec(fs.readFileSync(REV3, 'utf8'));
    if (m) spec.d2 = m[1];
  }
  const ctx = {
    spec, s2cols: study2ColumnsFromCode(S2_JS), s2raw: study2ColumnsFromRawHeaders(S2_RAW), s2v1: study2Vignette1(S2_JS),
    realConfig: JSON.parse(fs.readFileSync(path.join(EXP_DIR, 'config.json'), 'utf8')),
    authMatches, tokenMatches, secretCount, noShots: flag('--no-shots'),
  };
  const server = await startServer();
  ctx.port = server.port;
  console.log(`Serving ${path.basename(EXP_DIR)}/ on http://127.0.0.1:${ctx.port} (python3 http.server); ${runs.length} run(s), ${PARALLEL} in parallel`);
  console.log(`Spec: prereg ${path.basename(PREREG)}; Study 2 columns: ${ctx.s2cols.all.length} from code${ctx.s2raw ? `, ${ctx.s2raw.always.length} from ${ctx.s2raw.nFiles} raw headers` : ''}`);
  const reports = [];
  const queue = [...runs];
  const worker = async () => {
    while (queue.length) {
      const run = queue.shift();
      console.log(`  start ${run.id} (${run.viewport}, ${run.mode})`);
      const rep = await executeRun(run, ctx);
      reports.push(rep);
      console.log(`  done  ${run.id}: ${rep.passed} passed, ${rep.failed} failed, ${rep.seconds} s${rep.fatal ? ' — HARNESS ERROR: ' + rep.fatal : ''}`);
      for (const c of rep.checks.filter((x) => !x.pass)) console.log(`        FAIL ${c.name} :: ${c.detail}`);
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(PARALLEL, runs.length) }, worker));
  } finally {
    server.proc.kill();
  }
  // secret scan of everything this harness wrote or ships (counts only)
  const scanned = [];
  const scan = (dir, re) => { if (!fs.existsSync(dir)) return; for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isFile() && re.test(f)) scanned.push({ file: path.relative(TEST_DIR, p), count: secretCount(fs.readFileSync(p, 'utf8')) }); } };
  scan(OUT, /\.(csv|json)$/); scan(TEST_DIR, /\.(mjs|md)$/); scan(path.join(TEST_DIR, 'lib'), /\.mjs$/);
  const leaked = scanned.filter((s) => s.count > 0);
  reports.sort((a, b) => runs.findIndex((r) => r.id === a.id) - runs.findIndex((r) => r.id === b.id));
  const summary = {
    generated: new Date().toISOString(), experiment_version: (/EXPERIMENT_VERSION='([^']+)'/.exec(EXP_SRC) || [])[1], chrome: reports[0] && reports[0].chrome,
    runs: reports.map((r) => ({ id: r.id, cell: r.cell, order: r.order, viewport: r.viewport, mode: r.mode, completed: r.completed, n_columns: r.n_columns, passed: r.passed, failed: r.failed, fatal: r.fatal, failed_checks: r.checks.filter((c) => !c.pass).map((c) => `${c.name} :: ${c.detail}`), problems: r.problems, notes: r.notes })),
    secret_scan: { files: scanned.length, files_with_secrets: leaked.map((s) => s.file) },
    total_failed: reports.reduce((a, r) => a + r.failed, 0) + leaked.length,
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
  console.log(`\nSecret scan: ${scanned.length} files, ${leaked.length} with the key or token${leaked.length ? ': ' + leaked.map((s) => s.file).join(', ') : ''}`);
  console.log(`TOTAL: ${reports.reduce((a, r) => a + r.passed, 0)} checks passed, ${summary.total_failed} failed across ${reports.length} runs. Details: test/output/summary.json and test/output/<run>.checks.json`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ }
  return summary.total_failed ? 1 : 0;
}

main().then((code) => process.exit(code), (e) => { console.error('harness error:', e.message); process.exit(2); });
