#!/usr/bin/env node
// End-to-end test of the Study 3 experiment in headless Chrome with EVERY non-localhost
// request intercepted. Nothing reaches openrouter.ai, pavlovia.org, the counterbalance
// Worker, SONA, Box or any other host:
//   - the page's requests are intercepted (puppeteer request interception): the Worker,
//     OpenRouter and Pavlovia are answered by in-process mocks, the SONA credit redirect by
//     a stub page, and any other host is aborted and reported;
//   - navigator.sendBeacon is replaced before the page loads and its payload is captured;
//   - the browser itself runs with a dead proxy (127.0.0.1:9) and background networking off,
//     so browser-level traffic cannot leave the machine either.
// Synthetic chat messages only. Secret values are never printed: the OpenRouter
// Authorization header is checked for presence only, and the SONA redirect URL is compared
// in memory with the Study 2 URL.
//
//   PUPPETEER_DIR=<dir containing node_modules/puppeteer> CHROME_BIN=<chrome-headless-shell> \
//   node dev_tests/e2e_mocked.js <study2 experiment.js (for the redirect comparison)>
// Optional SHOT_DIR=<dir> saves screenshots of the probe card (synthetic text only).
// Build part 2 scenarios: S1 covers the scripted S0/S1 turns, the three probes (timer and idle
// pause, probe 2 at >= 300 s, probe 3 with a pending reply), bonding_first order, vignette 2,
// C16 items and the debrief; S10 covers impression_first, the IOS card at 375 px width,
// probe 2 not triggered and the slider format.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require(path.join(process.env.PUPPETEER_DIR, 'node_modules', 'puppeteer'));

const EXP_DIR = path.resolve(__dirname, '..');
const S2_JS = process.argv[2];
const CHROME_BIN = process.env.CHROME_BIN;
const PROFILE_DIR = process.env.PROFILE_DIR || fs.mkdtempSync(path.join(require('os').tmpdir(), 's3e2e-'));

const APPX_A = {
  HighA_HighE: 'd13545a7ddfed0dc9300d4a6d7bda0f4323974f42a7a8de044a10d1a139d28e9',
  HighA_LowE: '524b4aed4889534cc1d7ee653c18ffb0367d2fbce7b661a050ff53e3741a75c9',
  LowA_HighE: 'c2cc5cb1e0d06394ed8c1ea650b2ecffd33e8772aa09a3597e9bb56c64c07e0a',
  LowA_LowE: '277bf9dd7456c509fe6232f7079d8c28f5f28322e72e1ea1b978a6bea7268e95',
};

let failures = 0;
const check = (c, label) => { console.log((c ? 'PASS ' : 'FAIL ') + label); if (!c) failures++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// ------------------------------------------------------------------ static server (127.0.0.1 only)
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = path.join(EXP_DIR, p === '/' ? 'index.html' : p);
  if (!f.startsWith(EXP_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});

// ------------------------------------------------------------------ helpers
function parseCSV(text) { // RFC 4180, quoted fields may contain newlines
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(field); field = ''; } else if (ch === '\r' && text[i + 1] === '\n') { /* CRLF row end */ } else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [h, v] = rows; const o = {}; h.forEach((k, i) => { o[k] = v[i]; }); return o;
}
function parseMultipart(body, ctype) {
  if (!/[^\x00-\xff]/.test(body)) body = Buffer.from(body, 'latin1').toString('utf8');
  const b = /boundary=(.+)$/.exec(ctype || ''); if (!b) return {};
  const out = {};
  for (const part of body.split('--' + b[1])) {
    const m = /name="([^"]+)"\r\n\r\n([\s\S]*)\r\n$/.exec(part); if (m) out[m[1]] = m[2];
  }
  return out;
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' };

function newCtx(opts) {
  return Object.assign({
    mockConfig: { experiment: { name: 'mock', fullpath: 'characters/mock-local' }, gitlab: { projectId: '999999' } },
    worker: () => ({ body: { study: '1d', cell: 'HighA_HighE', order: 'impression_first', slot: 0 } }),
    chat: () => ({}),
    hosts: [], unexpected: [], workerCalls: [], pavPosts: [], chatCalls: [], pavResults: [], pavOther: [], beacons: [], sonaRedirect: null, dialogs: [],
  }, opts);
}

async function setupPage(context, ctx) {
  const page = await context.newPage();
  page.on('dialog', async (d) => { ctx.dialogs.push(d.message()); await d.accept(); });
  page.on('pageerror', (err) => { ctx.pageErrors = (ctx.pageErrors || []).concat(String(err.message).slice(0, 200)); });
  await page.setRequestInterception(true);
  page.on('request', (req) => handle(req, ctx).catch((e) => { console.log('handler error: ' + e.message); try { req.abort(); } catch (x) {} }));
  return page;
}

let chatN = 0;
async function handle(req, ctx) {
  const u = new URL(req.url());
  if (u.protocol === 'data:' || u.protocol === 'about:') return req.continue();
  if (u.hostname === '127.0.0.1') {
    if (u.pathname.endsWith('/config.json') && ctx.mockConfig) return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(ctx.mockConfig) });
    return req.continue();
  }
  ctx.hosts.push(u.hostname + ' ' + req.method() + ' ' + u.pathname);
  if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
  if (u.hostname === 'study3-counterbalance.dgkamper.workers.dev') {
    const study = u.searchParams.get('study'); ctx.workerCalls.push(study);
    const r = ctx.worker(study);
    if (r === 'abort') return req.abort('failed');
    return req.respond({ status: r.status || 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(r.body) });
  }
  if (u.hostname === 'openrouter.ai') {
    const body = JSON.parse((req.fetchPostData ? await req.fetchPostData() : req.postData()) || '{}');
    const auth = req.headers()['authorization'] || '';
    const k = ctx.chatCalls.length;
    ctx.chatCalls.push({ authPresent: /^Bearer \S{20,}$/.test(auth), sysSha: sha(body.messages[0].content), contents: body.messages.slice(1).map((m) => m.content), nMsgs: body.messages.length, roles: body.messages.map((m) => m.role).join(','), model: body.model, max_tokens: body.max_tokens, temperature: body.temperature, keys: Object.keys(body).sort().join(',') });
    const plan = ctx.chat(k) || {};
    if (plan.delay) await sleep(plan.delay);
    if (plan.status && plan.status !== 200) return req.respond({ status: plan.status, headers: CORS, contentType: 'application/json', body: '{"error":{"message":"mock failure"}}' });
    chatN++;
    const content = plan.content || ('Synthetic Sylva reply ' + k + '. This is mock text for testing only. It has a few sentences. Nothing here is real.');
    return req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ id: 'gen-mock-' + chatN, provider: 'MockProvider', model: 'meta-llama/llama-3.3-70b-instruct', object: 'chat.completion', choices: [{ index: 0, finish_reason: 'stop', native_finish_reason: 'stop', message: { role: 'assistant', content } }], usage: { prompt_tokens: 600 + k, completion_tokens: 90 + k, total_tokens: 690 + 2 * k } }) });
  }
  if (u.hostname === 'pavlovia.org' && req.method() === 'POST' && /\/(results|delete)$/.test(u.pathname)) {
    const raw = (req.fetchPostData ? await req.fetchPostData() : req.postData()) || '';
    ctx.pavPosts.push({ path: u.pathname.replace(/sessions\/[^/]+/, 'sessions/<tok>'), type: req.resourceType(), entries: parseMultipart(raw, req.headers()['content-type']) });
  }
  if (u.hostname === 'pavlovia.org') {
    if (req.method() === 'POST' && /\/sessions$/.test(u.pathname)) return req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: '{"token":"mock-session"}' });
    if (req.method() === 'POST' && /\/results$/.test(u.pathname)) {
      const raw = (req.fetchPostData ? await req.fetchPostData() : req.postData()) || '';
      ctx.pavResults.push(parseMultipart(raw, req.headers()['content-type']));
      return req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: '{}' });
    }
    ctx.pavOther.push(req.method() + ' ' + u.pathname.replace(/sessions\/[^/]+/, 'sessions/<tok>'));
    return req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: '{}' });
  }
  if (u.hostname === 'ucla.sona-systems.com') { ctx.sonaRedirect = req.url(); return req.respond({ status: 200, contentType: 'text/html', body: '<html><body>stub</body></html>' }); }
  ctx.unexpected.push(u.hostname);
  return req.abort('blockedbyclient');
}

// ------------------------------------------------------------------ page walking
const PICK = { devicecheck: '1', consent: '1', attn1: '3', attn1r: '3', comp_name: 'sylva', d_serious: '2', d_ai_study: '2', prior_sylva: 'No' };
async function state(page) { return page.evaluate(() => ({ cp: ST.cp, h1: (document.querySelector('#pageContainer h1') || {}).textContent || '', captcha: !!document.getElementById('captcha-status'), spr: !!document.getElementById('spr-display'), chat: !!document.getElementById('chatArea'), age: !!document.getElementById('d_age'), sona: !!document.getElementById('sonaId'), fin: !!(P[ST.cp] && P[ST.cp].fin) })); }

async function fillPage(page, extra) {
  await page.evaluate((PICK, extra) => {
    const names = new Set([...document.querySelectorAll('#pageContainer input[type=radio]')].map((i) => i.name));
    names.forEach((n) => { const opts = [...document.querySelectorAll('input[name="' + n + '"]')]; const want = PICK[n]; const el = want ? opts.find((o) => o.value === want) : opts[0]; if (el) el.checked = true; });
    const cb = new Set([...document.querySelectorAll('#pageContainer input[type=checkbox]')].map((i) => i.name));
    cb.forEach((n) => { const el = document.querySelector('input[name="' + n + '"]'); if (el) el.checked = true; });
    document.querySelectorAll('#pageContainer textarea').forEach((t) => { if (t.id === 'sonaId') { if (extra.sona !== undefined) t.value = extra.sona; return; } if (t.id !== 'chatInput' && !t.value) t.value = 'Synthetic test answer.'; });
    const age = document.getElementById('d_age'); if (age && extra.age !== undefined) age.value = extra.age;
  }, PICK, extra || {});
}

async function clickNext(page) {
  await page.waitForFunction(() => { const b = document.getElementById('nextBtn'); return b && !b.disabled; }, { timeout: 20000 });
  await page.evaluate(() => document.getElementById('nextBtn').click());
}

async function waitAdvance(page, from, timeout = 20000) {
  await page.waitForFunction((f) => ST.cp !== f, { timeout }, from);
}

// Walk forward until stopAt(state) is true; returns the state.
async function walk(page, stopAt, extra) {
  for (let guard = 0; guard < 80; guard++) {
    await sleep(120);
    const s = await state(page);
    if (stopAt(s)) return s;
    if (s.chat) throw new Error('reached chat unexpectedly');
    if (s.captcha) { await sleep(150); await page.keyboard.press('q'); await sleep(100); }
    if (s.spr) { await sleep(150); for (let i = 0; i < 16; i++) { await page.keyboard.press('Space'); await sleep(20); } }
    await fillPage(page, extra);
    await clickNext(page);
    await waitAdvance(page, s.cp);
  }
  throw new Error('walk guard exceeded');
}

async function openStudy(browser, ctx, query, viewport) {
  const context = await browser.createBrowserContext();
  const page = await setupPage(context, ctx);
  if (viewport) await page.setViewport(viewport);
  await page.goto(BASE + '/index.html' + (query || ''), { waitUntil: 'load' });
  await page.waitForFunction(() => typeof ST !== 'undefined' && P.length > 10 && document.getElementById('experimentContainer').style.display === 'block', { timeout: 15000 });
  return { context, page };
}
const R = (page) => page.evaluate(() => JSON.parse(JSON.stringify(ST.r)));

let BASE;
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  const browser = await puppeteer.launch({
    executablePath: CHROME_BIN, headless: true, userDataDir: PROFILE_DIR,
    args: ['--proxy-server=http://127.0.0.1:9', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--disable-default-apps', '--disable-domain-reliability', '--disable-client-side-phishing-detection', '--metrics-recording-only', '--no-pings', '--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication'],
  });
  const allCtx = [];
  try {
    // ================================================================ S1: full participant session
    console.log('\n--- S1 full session (Worker: LowA_HighE / bonding_first, slot 5; Pavlovia mocked) ---');
    const c1 = newCtx({
      worker: (study) => ({ body: { study, cell: 'LowA_HighE', order: 'bonding_first', slot: 5 } }),
      chat: (k) => (k === 1 ? { status: 500 } : k === 4 ? { delay: 4500 } : {}),
    });
    allCtx.push(c1);
    const { page: p1 } = await openStudy(browser, c1, '?participant=900001');
    let s = await walk(p1, (st) => st.chat);
    check(c1.workerCalls.length === 1 && c1.workerCalls[0] === '1d', 'one Worker call, study=1d, made at SONA ID submission');
    // ---- chat: scripted S0 (no API call), Send disabled until it is shown
    const start = await p1.evaluate(() => ({ send: document.getElementById('chatSendBtn').disabled, typing: document.getElementById('chatTyping').style.display, t: Date.now() }));
    await p1.waitForFunction(() => ST.chatLog.some((e) => e.script_slot === 'S0'), { timeout: 15000 });
    const s0 = await p1.evaluate(() => ({ log: JSON.parse(JSON.stringify(ST.chatLog)), hist: ST.chatHistory.map((m) => m.role + ':' + m.content), sc: SCRIPTS[ST.condition.cell], opener: CHAT_OPENER, send: document.getElementById('chatSendBtn').disabled, bubbles: [...document.querySelectorAll('#chatArea > div')].map((d) => d.textContent), t: Date.now() }));
    const expDelay = (t) => Math.max(2000, Math.min(6000, 1500 + 8 * t.length));
    check(start.send === true && start.typing === 'block', 'chat opens with "Sylva is typing..." and Send disabled');
    check(c1.chatCalls.length === 0, 'no API call for the greeting (S0 is scripted)');
    check(s0.log.length === 2 && s0.log[0].role === 'user_scripted' && s0.log[0].content === s0.opener && s0.log[0].round === 0 && s0.log[1].role === 'assistant' && s0.log[1].scripted === true && s0.log[1].script_slot === 'S0' && s0.log[1].round === 0 && s0.log[1].content === s0.sc.S0 && s0.log[1].delay_ms === expDelay(s0.sc.S0) && typeof s0.log[1].elapsed === 'number' && !!s0.log[1].ts, 'chat_log: opener as user_scripted (round 0), then S0 {scripted, script_slot S0, round 0, ts, elapsed, delay_ms ' + s0.log[1].delay_ms + '}');
    check(s0.hist.length === 3 && s0.hist[1] === 'user:' + s0.opener && s0.hist[2] === 'assistant:' + s0.sc.S0, 'model context: system prompt, opener (user), S0 (assistant)');
    check(s0.bubbles.length === 1 && s0.bubbles[0] === 'Sylva' + s0.sc.S0 && s0.send === false, 'only S0 is displayed (the opener is not), and Send is enabled after it');
    check(s0.t - start.t >= s0.log[1].delay_ms - 300, 'S0 shown after the typing delay (' + (s0.t - start.t) + ' ms >= ' + s0.log[1].delay_ms + ' ms)');
    const send = async (text) => { await p1.evaluate((t) => { document.getElementById('chatInput').value = t; chatSend(); }, text); };
    const answerProbe = async (page, v) => { await page.evaluate((v) => { document.querySelector('#probeCard .ios-opt[data-v="' + v + '"]').click(); }, v); await page.evaluate(() => document.querySelector('#probeCard .probe-submit').click()); };
    // ---- S1 (scripted) and probe 1
    await send('Synthetic message one for the S1 test.');
    await p1.waitForFunction(() => !!document.getElementById('probeCard'), { timeout: 15000 });
    const pr1 = await p1.evaluate(() => { const a = document.getElementById('chatArea'); const card = document.getElementById('probeCard'); const last = ST.chatLog[ST.chatLog.length - 1]; return { last, k: card.getAttribute('data-probe'), lastChild: a.lastElementChild === card, prev: card.previousElementSibling.textContent, opts: [...card.querySelectorAll('.ios-opt')].map((o) => o.getAttribute('data-v')).join(''), labels: [...card.querySelectorAll('text')].map((t) => t.textContent).join(','), q: card.querySelector('.probe-q').textContent, next: card.querySelector('.probe-submit').disabled, inp: document.getElementById('chatInput').disabled, sendB: document.getElementById('chatSendBtn').disabled, secs: CS.secs, open: CS.probeOpen }; });
    check(c1.chatCalls.length === 0, 'no API call for the first participant message (S1 is scripted)');
    check(pr1.last.role === 'assistant' && pr1.last.scripted === true && pr1.last.script_slot === 'S1' && pr1.last.round === 1 && pr1.last.content === s0.sc.S1 && pr1.last.delay_ms === expDelay(s0.sc.S1), 'S1 logged {scripted, script_slot S1, round 1, delay_ms}');
    check(pr1.k === '1' && pr1.lastChild && pr1.prev === 'Sylva' + s0.sc.S1, 'probe 1 card is in #chatArea directly below S1');
    check(pr1.opts === '1234567' && pr1.labels === 'You,Sylva,You,Sylva,You,Sylva,You,Sylva,You,Sylva,You,Sylva,You,Sylva' && pr1.q === 'Which picture best describes how close you feel to Sylva right now?', 'IOS card: 7 pairs in ascending order labeled You/Sylva, Appendix D.3 instruction');
    check(pr1.next && pr1.inp && pr1.sendB && pr1.open, 'while the probe is open: message box and Send disabled; Next disabled until a picture is chosen');
    await p1.evaluate(() => { CS.idleMs = 1500; });   // the idle limit would be passed while the card is open
    await sleep(2600);
    const held = await p1.evaluate(() => ({ secs: CS.secs, paused: CS.paused, idle: ST.r.idle_pause_count || 0, timer: document.getElementById('chatTimer').textContent }));
    await p1.evaluate(() => { document.getElementById('chatInput').value = 'blocked'; chatSend(); });
    const blocked = await p1.evaluate(() => ({ n: ST.chatLog.length, v: document.getElementById('chatInput').value }));
    check(held.secs === pr1.secs && !held.paused && held.idle === 0 && /paused/.test(held.timer), 'countdown and idle timer paused while the card is open (secs ' + pr1.secs + ' -> ' + held.secs + ', no idle pause)');
    check(blocked.n === 4 && blocked.v === 'blocked', 'chatSend does nothing while the card is open');
    await p1.evaluate(() => { document.getElementById('chatInput').value = ''; });
    await answerProbe(p1, 5);
    await p1.evaluate(() => { CS.idleMs = 45000; });
    const after1 = await p1.evaluate(() => ({ card: !!document.getElementById('probeCard'), inp: document.getElementById('chatInput').disabled, sendB: document.getElementById('chatSendBtn').disabled, r: JSON.parse(JSON.stringify(ST.r)), probeMs: CS.probeMs, idleGap: Date.now() - CS.lastActivity }));
    check(!after1.card && !after1.inp && !after1.sendB, 'after Next: card removed, message box and Send enabled');
    check(after1.r.ios_t1 === 5 && after1.r.ios_t1_rt_ms >= 2500 && after1.r.ios_t1_round === 1 && typeof after1.r.ios_t1_elapsed === 'number' && !isNaN(Date.parse(after1.r.ios_t1_shown_ts)), 'ios_t1 = 5 with ios_t1_rt_ms (' + after1.r.ios_t1_rt_ms + '), ios_t1_round 1, ios_t1_elapsed, ios_t1_shown_ts');
    check(after1.idleGap < 1000, 'idle clock shifted by the time the card was open (gap ' + after1.idleGap + ' ms after closing)');
    // ---- model replies from the second message on
    await send('Synthetic message two.');
    await p1.waitForFunction(() => !CS.waiting, { timeout: 10000 });
    check(c1.chatCalls.length === 1 && c1.chatCalls[0].roles === 'system,user,assistant,user,assistant,user' && JSON.stringify(c1.chatCalls[0].contents) === JSON.stringify([s0.opener, s0.sc.S0, 'Synthetic message one for the S1 test.', s0.sc.S1, 'Synthetic message two.']), 'first API call = reply to message 2; context = system, opener, S0, message 1, S1, message 2');
    await send('Synthetic message three (mock API returns 500).');
    await p1.waitForFunction(() => !CS.waiting, { timeout: 10000 });
    await send('Synthetic message four.');
    await p1.waitForFunction(() => !CS.waiting, { timeout: 10000 });
    check(!(await p1.evaluate(() => !!document.getElementById('probeCard'))), 'no probe 2 before 300 s of active chat');
    // ---- probe 2 after the first reply displayed at >= 300 s active
    await p1.evaluate(() => { CS.secs = 300; });
    await send('Synthetic message five.');
    await p1.waitForFunction(() => !!document.getElementById('probeCard'), { timeout: 10000 });
    const pr2 = await p1.evaluate(() => ({ k: document.getElementById('probeCard').getAttribute('data-probe'), prev: document.getElementById('probeCard').previousElementSibling.textContent, el: ST.r.ios_t2_elapsed, round: ST.r.ios_t2_round }));
    check(pr2.k === '2' && /^SylvaSynthetic Sylva reply 3/.test(pr2.prev) && pr2.el >= 300 && pr2.round === 5, 'probe 2 directly below the first reply displayed at >= 300 s (elapsed ' + pr2.el + ', round ' + pr2.round + ')');
    await sleep(300); await answerProbe(p1, 3);
    // ---- probe 3 at time-out with a reply pending; the late reply goes above the card
    await send('Synthetic message six (reply delayed past the end).');
    await p1.evaluate(() => { CS.secs = 2; });
    await p1.waitForFunction(() => CS.ended === true && !!document.getElementById('probeCard'), { timeout: 10000 });
    const pr3 = await p1.evaluate(() => ({ k: document.getElementById('probeCard').getAttribute('data-probe'), endArea: document.getElementById('chatEndArea').style.display, sendB: document.getElementById('chatSendBtn').disabled }));
    check(pr3.k === '3' && pr3.endArea !== 'block' && pr3.sendB, 'probe 3 at time-out; Continue button hidden until it is answered');
    await p1.waitForFunction(() => ST.chatLog.some((e) => e.after_end), { timeout: 15000 });
    const lateDom = await p1.evaluate(() => { const a = document.getElementById('chatArea'); const card = document.getElementById('probeCard'); return { lastChild: a.lastElementChild === card, prev: card.previousElementSibling.textContent }; });
    check(lateDom.lastChild && /^SylvaSynthetic Sylva reply 4/.test(lateDom.prev), 'late reply displayed above the open probe-3 card');
    // shot of the desktop layout with the card open (synthetic text only)
    if (process.env.SHOT_DIR) await p1.screenshot({ path: path.join(process.env.SHOT_DIR, 'probe3_desktop.png') });
    await answerProbe(p1, 6);
    const endA = await p1.evaluate(() => ({ endArea: document.getElementById('chatEndArea').style.display, sendB: document.getElementById('chatSendBtn').disabled, inp: document.getElementById('chatInput').disabled }));
    check(endA.endArea === 'block' && endA.sendB && endA.inp, 'after probe 3: Continue button shown; input and Send stay disabled');
    await p1.evaluate(() => chatFinish());
    // continue to the age page and test validation
    s = await walk(p1, (st) => st.age);
    const ageTries = {};
    for (const bad of ['17', '101', '25.5', 'abc']) {
      await fillPage(p1, { age: bad }); const before = (await state(p1)).cp;
      await p1.evaluate(() => document.getElementById('nextBtn').click()); await sleep(300);
      ageTries[bad] = (await state(p1)).cp === before && (await p1.evaluate(() => document.getElementById('err-d2').style.display === 'block'));
    }
    check(Object.values(ageTries).every(Boolean), 'age 17, 101, 25.5 and non-numeric are rejected (page stays, error shown): ' + JSON.stringify(ageTries));
    await fillPage(p1, { age: '25' }); const beforeAge = (await state(p1)).cp; await clickNext(p1); await waitAdvance(p1, beforeAge);
    check(true, 'age 25 accepted');
    s = await walk(p1, (st) => st.fin);
    const deb = await p1.evaluate(() => ({ text: document.getElementById('pageContainer').textContent, d5: DEBRIEF_V2_SENTENCE, fic: DEBRIEF_S3_SCENARIOS_FICTIONAL }));
    check(deb.text.includes(deb.fic + ' ' + deb.d5) && ['988', 'CAPS', 'OHRPP', 'withdraw', 'David G. Kamper'].every((w) => deb.text.includes(w)), 'debrief shows the D.5 sentence after "both scenarios were fictional", plus CAPS, 988, OHRPP, withdrawal, investigator');
    await clickNext(p1);
    await p1.waitForFunction(() => true, { timeout: 1000 });
    for (let i = 0; i < 40 && !c1.sonaRedirect; i++) await sleep(250);
    check(c1.pavResults.length === 1, 'final record uploaded once to (mocked) Pavlovia');
    const fin = c1.pavResults.length ? parseCSV(c1.pavResults[0].value) : {};
    const finKey = c1.pavResults.length ? c1.pavResults[0].key : '';
    check(/^data\/char-ai-study_900001_SESSION_.*\.csv$/.test(finKey) && !/_PARTIAL/.test(finKey), 'final key data/char-ai-study_<pid>_SESSION_<ts>.csv');
    check(c1.pavOther.some((x) => x.startsWith('DELETE')), 'session closed (DELETE) after the final upload');
    // redirect comparison without printing
    const s2src = fs.readFileSync(S2_JS, 'utf8');
    const tok = /credit_token=([A-Za-z0-9]+)/.exec(s2src)[1];
    const expectedRedirect = 'https://ucla.sona-systems.com/webstudy_credit.aspx?experiment_id=3286&credit_token=' + tok + '&survey_code=900001';
    check(c1.sonaRedirect === expectedRedirect, 'SONA credit redirect URL identical to the Study 2 URL [token present] (compared in memory)');
    // field checks
    const F = fin;
    const eq = (k, v) => check(F[k] === v, k + ' = ' + JSON.stringify(v) + (F[k] === v ? '' : ' (got ' + JSON.stringify(F[k]) + ')'));
    eq('study_mode', '1d'); eq('study_id', '3'); eq('experiment_version', 'study3-v0.2.1-2026-10-15-staging');
    check(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(F.session_uuid || ''), 'session_uuid is a v4 UUID');
    eq('cell', 'LowA_HighE'); eq('condition_label', 'LowA_HighE'); eq('condition_id', '3'); eq('a_level', 'low'); eq('e_level', 'high'); eq('a_block', 'LOW_A'); eq('e_block', 'HIGH_E_S3'); eq('n_block', 'MOD_LOW_N');
    eq('order', 'bonding_first'); eq('order_source', 'worker'); eq('cb_source', 'worker'); eq('cb_slot', '5'); eq('cb_study_code', '1d'); eq('cb_error', ''); eq('cb_reused', 'false'); eq('is_test_session', 'false');
    eq('system_prompt_sha256', APPX_A.LowA_HighE); eq('system_prompt_sha256_match', 'true');
    const spRaw = F.system_prompt || '';
    console.log('  info: system_prompt as uploaded: ' + spRaw.length + ' chars, ' + (spRaw.match(/\r\n/g) || []).length + ' CRLF (multipart/form-data normalizes LF to CRLF)');
    check(sha(spRaw.replace(/\r\n/g, '\n')) === APPX_A.LowA_HighE, 'uploaded system_prompt, with CRLF normalized to LF, hashes to Appendix A');
    // scripts
    eq('script_version', 'D1-rev2-draft-2026-10-01');
    check(F.script_sha256 === sha(s0.sc.S0 + '\n' + s0.sc.S1) && F.script_sha256_match === 'true', 'script_sha256 = SHA-256(S0 + "\\n" + S1) of the texts shown; script_sha256_match = true');
    eq('chat_opener', s0.opener);
    check(F.ai_msg_0 === s0.sc.S0 && F.ai_msg_1 === s0.sc.S1 && F.user_msg_1 === 'Synthetic message one for the S1 test.' && !('user_msg_0' in F), 'ai_msg_0 = S0, ai_msg_1 = S1, user_msg_1 = first message; opener not a user_msg');
    eq('max_tokens', '400'); eq('api_endpoint', 'https://openrouter.ai/api/v1/chat/completions'); eq('model', 'meta-llama/llama-3.3-70b-instruct'); eq('temperature', '0.7');
    eq('completed', 'true'); eq('pid_url', '900001'); eq('pid_mismatch', 'false'); eq('sona_id', '900001'); eq('reload_count', '0'); eq('d_age', '25');
    check(!!F.consent_ts && !isNaN(Date.parse(F.consent_ts)), 'consent_ts recorded (ISO time)');
    check(['manipulated_trait', 'condition_level', 'held_constant_1', 'held_constant_2'].every((k) => !(k in F)), 'manipulated_trait, condition_level, held_constant_1/2 not written');
    check(!('checkpoint_stage' in F), 'final record has no checkpoint fields');
    // chat log
    const log = JSON.parse(F.chat_log || '[]');
    const asst = log.filter((e) => e.role === 'assistant'), model = asst.filter((e) => !e.scripted), scripted = asst.filter((e) => e.scripted), errs = log.filter((e) => e.role === 'system_error');
    check(model.length === 4 && model.every((e) => e.finish_reason === 'stop' && e.provider === 'MockProvider' && e.model_served && /^gen-mock-/.test(e.gen_id) && typeof e.latency_ms === 'number' && e.usage && e.usage.completion_tokens), 'every model-generated assistant entry has finish_reason, provider, model_served, gen_id, latency_ms, usage');
    check(scripted.length === 2 && scripted.map((e) => e.script_slot + e.round).join() === 'S00,S11' && scripted.every((e) => !e.usage && typeof e.delay_ms === 'number'), 'two scripted entries (S0 round 0, S1 round 1) with delay_ms and no usage');
    check(log.filter((e) => e.role === 'user_scripted').length === 1, 'one user_scripted entry (the opener)');
    check(errs.length === 1 && errs[0].error_type === 'API error: 500' && errs[0].http_status === 500 && errs[0].round === 3 && typeof errs[0].elapsed === 'number' && !!errs[0].ts, 'failed call logged once as system_error (type, status, round 3, elapsed, ts)');
    const late = asst.filter((e) => e.after_end);
    check(late.length === 1 && late[0].displayed === true && late[0].round === 6, 'late reply kept with after_end=true, displayed=true, round 6');
    eq('chat_api_error_count', '1'); eq('chat_send_attempts', '6'); eq('chat_total_rounds', '5'); eq('chat_llm_rounds', '4'); eq('chat_after_end_replies', '1'); eq('chat_min_message_threshold_met', 'false');
    check(!!F.ai_msg_6 && /Synthetic Sylva reply/.test(F.ai_msg_6), 'ai_msg_6 (late reply) saved in the final record');
    // probes
    eq('ios_t1', '5'); eq('ios_t2', '3'); eq('ios_t3', '6'); eq('ios_t2_status', 'answered'); eq('probe_format', 'ios'); eq('ios_t1_round', '1'); eq('ios_t2_round', '5'); eq('ios_t3_round', '6');
    check([1, 2, 3].every((k) => +F['ios_t' + k + '_rt_ms'] > 0 && !isNaN(Date.parse(F['ios_t' + k + '_shown_ts'])) && F['ios_t' + k + '_elapsed'] !== ''), 'ios_tK_rt_ms, ios_tK_shown_ts, ios_tK_elapsed recorded for K = 1, 2, 3');
    check(+F.ios_t3_elapsed === 600 && +F.ios_t2_elapsed >= 300, 'ios_t3_elapsed = 600 (time-out), ios_t2_elapsed >= 300');
    check(+F.chat_probe_seconds >= 2.5 && Math.abs(+F.chat_probe_seconds - ([1, 2, 3].reduce((a, k) => a + +F['ios_t' + k + '_rt_ms'], 0) / 1000)) < 0.2, 'chat_probe_seconds = total time the cards were open (' + F.chat_probe_seconds + ' s)');
    // order, page sequence, vignette 2, C16
    const seq = (F.page_sequence || '').split(';');
    const j = (a) => seq.join(';').includes(a.join(';'));
    check(j(['chat', 'comprehension', 'psr', 'ec', 'trust', 'tipi_bot', 'mc', 'et', 'ma', 'mp', 'liab_vignette']), 'page_sequence (bonding_first): comprehension, PSR, EC, Trust, TIPI-Bot, MC, ET, MA, MP');
    check(j(['oe_1', 'oe_2', 'v2_vignette', 'v2_items', 'demo_intro']) && j(['demo_q25_28', 'prior_sylva', 'ai_use', 'debrief']) && seq[0] === 'device_check' && new Set(seq).size === seq.length, 'page_sequence: vignette 2 after the open-ended pages; prior_sylva before the AI-use page; each page once');
    const v2ids = ['v2_resp_company', 'v2_resp_sylva', 'v2_resp_user', 'v2_cause_company', 'v2_cause_sylva', 'v2_cause_user', 'v2_oblig_company', 'v2_oblig_sylva', 'v2_oblig_user', 'v2_severity'];
    check(v2ids.every((k) => F[k] === '1'), 'all nine vignette-2 items and v2_severity recorded');
    const v2o = (F.v2_item_order || '').split(';');
    check(v2o.length === 10 && v2ids.every((k) => v2o.includes(k)), 'v2_item_order lists the 10 item ids in presented order');
    check(+F.v2_page_ms >= 9500 && +F.v2_items_page_ms > 0, 'v2_page_ms >= 10 s (10-s minimum; ' + F.v2_page_ms + ' ms), v2_items_page_ms recorded');
    eq('v2_version', 'D4'); eq('v2_severity_included', 'true');
    check(F.mc_e_energetic === '1' && F.mc_length === '1' && F.mc_extraversion === '1', 'mc_e_energetic and mc_length recorded with the manipulation checks');
    eq('prior_sylva', 'No'); eq('mc_e_items_included', 'true'); eq('prior_sylva_included', 'true');
    // OpenRouter calls
    check(c1.chatCalls.length === 5, 'five API calls (messages 2-6); none for S0 and S1');
    check(c1.chatCalls.every((c) => c.authPresent), 'Authorization header present on every OpenRouter call [key present]');
    check(c1.chatCalls.every((c) => c.sysSha === APPX_A.LowA_HighE), 'every OpenRouter call carries the LowA_HighE system prompt (Appendix A hash)');
    check(c1.chatCalls.every((c) => c.keys === 'max_tokens,messages,model,temperature' && c.max_tokens === 400 && c.temperature === 0.7), 'request body has only model, max_tokens, temperature, messages (400, 0.7)');
    const pe = (c1.pageErrors || []).filter((m) => !/exitFullscreen/.test(m)); // Study 2 line 194 behaviour, unchanged
    check(!pe.length, 'no uncaught page errors (ignoring the unchanged Study 2 exitFullscreen rejection)' + (pe.length ? ': ' + JSON.stringify(pe) : ''));
    check(c1.pavPosts.filter((x) => /results$/.test(x.path)).length === 1 && !c1.pavPosts.some((x) => /delete$/.test(x.path)), 'no partial beacon in a completed session (one results upload, no incomplete close)');

    // ================================================================ S10: impression_first, 375 px, probe 2 not triggered, slider format
    console.log('\n--- S10 impression_first at 375 px width; probe 2 not triggered; slider format for probe 3 ---');
    const c10 = newCtx({ worker: (study) => ({ body: { study, cell: 'HighA_LowE', order: 'impression_first', slot: 9 } }) });
    allCtx.push(c10);
    const { page: p10, context: x10 } = await openStudy(browser, c10, '?participant=900010', { width: 375, height: 812 });
    await walk(p10, (st) => st.chat);
    await p10.waitForFunction(() => ST.chatLog.some((e) => e.script_slot === 'S0'), { timeout: 15000 });
    await p10.evaluate(() => { document.getElementById('chatInput').value = 'Synthetic first message at phone width.'; chatSend(); });
    await p10.waitForFunction(() => !!document.getElementById('probeCard'), { timeout: 15000 });
    const lay = await p10.evaluate(() => {
      const area = document.getElementById('chatArea'), card = document.getElementById('probeCard'), ar = area.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const opts = [...card.querySelectorAll('.ios-opt')].map((o) => o.getBoundingClientRect());
      const tops = [...new Set(opts.map((r) => Math.round(r.top)))];
      const next = card.querySelector('.probe-submit').getBoundingClientRect();
      return { vw: window.innerWidth, docW: document.documentElement.scrollWidth, areaW: ar.width, cardIn: cr.left >= ar.left && cr.right <= ar.right + 0.5, cardOverflow: card.scrollWidth - card.clientWidth, minW: Math.min(...opts.map((r) => r.width)), rows: tops.length, perRow: tops.map((t) => opts.filter((r) => Math.round(r.top) === t).length).join('+'), optsIn: opts.every((r) => r.left >= cr.left && r.right <= cr.right + 0.5), cardH: cr.height, areaH: area.clientHeight, nextIn: next.bottom <= ar.bottom + 0.5 && next.top >= ar.top - 0.5 };
    });
    check(lay.vw === 375 && lay.docW <= 375 && lay.cardIn && lay.cardOverflow <= 0 && lay.optsIn, 'IOS card fits at 375 px: no horizontal overflow of the page, chat area or card (page ' + lay.docW + ' px, chat area ' + Math.round(lay.areaW) + ' px)');
    check(lay.minW >= 60 && lay.rows === 3 && lay.perRow === '3+3+1', 'IOS pictures wrap 3 per row at 375 px (' + lay.perRow + '), each >= 60 px wide (' + Math.round(lay.minW) + ' px), order kept');
    check(lay.cardH <= lay.areaH && lay.nextIn, 'whole card, including Next, visible inside the 400-px chat area (card ' + Math.round(lay.cardH) + ' px)');
    if (process.env.SHOT_DIR) await p10.screenshot({ path: path.join(process.env.SHOT_DIR, 'probe1_375px.png') });
    await p10.evaluate(() => { document.querySelector('#probeCard .ios-opt[data-v="2"]').click(); });
    if (process.env.SHOT_DIR) await p10.screenshot({ path: path.join(process.env.SHOT_DIR, 'probe1_selected_375px.png') });
    await p10.evaluate(() => { document.querySelector('#probeCard .probe-submit').click(); });
    // switch the format for probe 3 and time out without a further message (probe 2 never triggers)
    await p10.evaluate(() => { PROBE_FORMAT = 'slider'; CS.secs = 2; });
    await p10.waitForFunction(() => CS.ended === true && !!document.getElementById('probeCard'), { timeout: 10000 });
    const sl0 = await p10.evaluate(() => { const c = document.getElementById('probeCard'); const sl = c.querySelector('.probe-slider'); return { k: c.getAttribute('data-probe'), q: c.querySelector('.probe-q').textContent, ends: [...c.querySelectorAll('.probe-ends span')].map((s) => s.textContent).join('|'), unset: sl.classList.contains('unset'), thumb: getComputedStyle(sl, '::-webkit-slider-thumb').opacity, next: c.querySelector('.probe-submit').disabled, min: sl.min, max: sl.max }; });
    check(sl0.k === '3' && sl0.q === 'How close do you feel to Sylva right now?' && sl0.ends === 'Not at all close|Extremely close' && sl0.min === '1' && sl0.max === '7', 'slider format: Appendix D.3 question and end labels, 1-7');
    check(sl0.unset && sl0.next, 'slider has no default position (thumb hidden, Next disabled) until the participant clicks');
    if (process.env.SHOT_DIR) await p10.screenshot({ path: path.join(process.env.SHOT_DIR, 'probe3_slider_375px.png') });
    const box = await p10.evaluate(() => { const r = document.querySelector('#probeCard .probe-slider').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await p10.mouse.click(box.x + box.w * 0.83, box.y + box.h / 2);
    await sleep(200);
    const sl1 = await p10.evaluate(() => { const c = document.getElementById('probeCard'); return { unset: c.querySelector('.probe-slider').classList.contains('unset'), next: c.querySelector('.probe-submit').disabled, v: c.querySelector('.probe-slider').value }; });
    if (process.env.SHOT_DIR) await p10.screenshot({ path: path.join(process.env.SHOT_DIR, 'probe3_slider_clicked_375px.png') });
    check(!sl1.unset && !sl1.next && +sl1.v >= 5, 'after a click the thumb appears and Next is enabled (value ' + sl1.v + ')');
    await p10.evaluate(() => document.querySelector('#probeCard .probe-submit').click());
    let r10 = await R(p10);
    check(r10.ios_t3 === +sl1.v && r10.ios_t1 === 2 && r10.ios_t2_status === 'not_triggered' && !('ios_t2' in r10) && !('ios_t2_shown_ts' in r10), 'ios_t1 = 2, ios_t3 = slider value, ios_t2_status = not_triggered, no ios_t2 fields');
    check(c10.chatCalls.length === 0 && r10.chat_total_rounds === 1 && r10.chat_llm_rounds === 0 && r10.chat_send_attempts === 1, 'one scripted exchange, no API call: chat_total_rounds 1, chat_llm_rounds 0');
    await p10.evaluate(() => chatFinish());
    await walk(p10, (st) => st.h1 === 'Final Questions');
    r10 = await R(p10);
    const seq10 = (r10.page_sequence || []).join(';');
    check(seq10.includes(['chat', 'comprehension', 'tipi_bot', 'mc', 'psr', 'ec', 'trust', 'et', 'ma', 'mp', 'liab_vignette'].join(';')) && r10.order === 'impression_first', 'page_sequence (impression_first): comprehension, TIPI-Bot, MC, PSR, EC, Trust, ET, MA, MP');
    check(r10.script_sha256_match === true && r10.cell === 'HighA_LowE' && r10.system_prompt_sha256 === APPX_A.HighA_LowE, 'HighA_LowE: script_sha256_match and Appendix A prompt hash');
    await x10.close();

    // ================================================================ S2: partial data on leaving mid-study
    console.log('\n--- S2 partial record when the tab is left after the SONA ID page ---');
    const c2 = newCtx({ worker: (study) => ({ body: { study, cell: 'HighA_LowE', order: 'impression_first', slot: 6 } }) });
    allCtx.push(c2);
    const { page: p2, context: x2 } = await openStudy(browser, c2, '?participant=900002');
    await walk(p2, (st) => st.h1 === 'Instructions');
    const dbg2 = await p2.evaluate(() => ({ active: PAVLOVIA.isActive, key: PAVLOVIA._lastKey, staged: !!PAVLOVIA._lastCSV, csv: PAVLOVIA._lastCSV }));
    check(dbg2.active && dbg2.staged && /_PARTIAL\.csv$/.test(dbg2.key || ''), 'checkpoint staged a _PARTIAL record before leaving');
    await p2.goto('about:blank');
    await sleep(800);
    const pres = c2.pavPosts.find((b) => /results$/.test(b.path));
    const pdel = c2.pavPosts.find((b) => /delete$/.test(b.path));
    console.log('  info: beacon request types seen: ' + JSON.stringify(c2.pavPosts.map((x) => x.type + ' ' + x.path)));
    check(/^data\/char-ai-study_900002_SESSION_.*_PARTIAL\.csv$/.test(dbg2.key || ''), 'staged key data/char-ai-study_<pid>_SESSION_<ts>_PARTIAL.csv');
    check(!!pres && !!pdel, 'on page exit the browser sent the results beacon and the incomplete-close beacon (bodies are not visible to interception)');
    check(c2.pavPosts.filter((b) => /results$/.test(b.path)).length === 1, 'partial record sent once (pagehide + unload guarded)');
    {
      const PR = parseCSV(dbg2.csv || '');
      check(PR.completed === 'false' && /^render_\d+$/.test(PR.checkpoint_stage) && PR.cell === 'HighA_LowE' && PR.cb_slot === '6' && PR.sona_id === '900002' && !!PR.consent_ts, 'partial record: completed=false, checkpoint_stage, cell, cb_slot, sona_id, consent_ts');
    }
    await x2.close();

    // ================================================================ S3: TEST routing
    console.log('\n--- S3 TEST session (SONA ID entered by hand: "TEST-dk") ---');
    const c3 = newCtx({ worker: (study) => ({ body: { study, cell: 'HighA_LowE', order: 'impression_first', slot: 0 } }) });
    allCtx.push(c3);
    const { page: p3, context: x3 } = await openStudy(browser, c3, '');
    await walk(p3, (st) => st.h1 === 'Instructions', { sona: 'TEST-dk' });
    let r = await R(p3);
    check(JSON.stringify(c3.workerCalls) === '["1d_test"]', 'TEST ID calls the Worker with study=1d_test only (participant counter untouched)');
    check(r.cb_source === 'test' && r.order_source === 'test' && r.cb_study_code === '1d_test' && r.is_test_session === true && r.cell === 'HighA_LowE' && r.system_prompt_sha256 === APPX_A.HighA_LowE, 'TEST: cb_source=test, order_source=test, cell from the test counter, Appendix A hash');
    check(r.pid_url === '' && r.pid_mismatch === false, 'pid_url empty and pid_mismatch=false when the ID is typed');
    await x3.close();

    // ================================================================ S4: mismatched study is rejected
    console.log('\n--- S4 Worker answers with a legacy/mismatched response ---');
    const c4 = newCtx({ worker: () => ({ body: { study: '1c', condition: 'high', slot: 3 } }) });
    allCtx.push(c4);
    const { page: p4, context: x4 } = await openStudy(browser, c4, '?participant=900004');
    await walk(p4, (st) => st.h1 === 'Instructions');
    r = await R(p4);
    check(r.cb_source === 'fallback_random' && r.order_source === 'fallback_random' && r.cb_slot === -1 && /Study mismatch/.test(r.cb_error), 'mismatched study rejected: fallback_random, cb_slot -1, cb_error recorded');
    check(['HighA_HighE', 'HighA_LowE', 'LowA_HighE', 'LowA_LowE'].includes(r.cell) && ['impression_first', 'bonding_first'].includes(r.order) && r.system_prompt_sha256 === APPX_A[r.cell], 'fallback draws a valid cell and order; prompt hash matches Appendix A');
    check(c4.dialogs.length === 0, 'no alert for a participant (non-TEST) fallback');
    await x4.close();

    // ================================================================ S5: Worker unreachable
    console.log('\n--- S5 Worker unreachable ---');
    const c5 = newCtx({ worker: () => 'abort' });
    allCtx.push(c5);
    const { page: p5, context: x5 } = await openStudy(browser, c5, '?participant=900005');
    await walk(p5, (st) => st.h1 === 'Instructions');
    r = await R(p5);
    check(r.cb_source === 'fallback_random' && r.cb_error !== '' && !!r.cell && !!r.system_prompt, 'unreachable Worker: fallback_random with a cell, prompt and cb_error');
    await x5.close();

    // ================================================================ S6 + S7: missing order, then reload reuse
    console.log('\n--- S6 Worker returns a cell but no order; S7 reload in the same tab ---');
    const c6 = newCtx({ worker: (study) => ({ body: { study, cell: 'HighA_HighE', slot: 7 } }) });
    allCtx.push(c6);
    const { page: p6, context: x6 } = await openStudy(browser, c6, '?participant=900006');
    await walk(p6, (st) => st.h1 === 'Instructions');
    r = await R(p6);
    check(r.cb_source === 'worker' && r.order_source === 'client' && r.cb_slot === 7 && r.cell === 'HighA_HighE' && ['impression_first', 'bonding_first'].includes(r.order), 'no order from Worker: order drawn by the client (order_source=client)');
    const firstOrder = r.order, firstUuid = r.session_uuid;
    await p6.reload({ waitUntil: 'load' });
    await p6.waitForFunction(() => typeof ST !== 'undefined' && P.length > 10, { timeout: 15000 });
    await walk(p6, (st) => st.h1 === 'Instructions');
    r = await R(p6);
    check(c6.workerCalls.length === 1, 'reload: no second Worker call (assignment reused from sessionStorage)');
    check(r.cb_reused === true && r.reload_count === 1 && r.cell === 'HighA_HighE' && r.order === firstOrder && r.cb_slot === 7 && r.cb_first_session_uuid === firstUuid && r.session_uuid !== firstUuid, 'reload: cb_reused=true, reload_count=1, same cell/order/slot, new session_uuid, first uuid kept');
    await x6.close();

    // ================================================================ S8: TEST session with failing Worker shows an investigator alert
    console.log('\n--- S8 TEST session with Worker failure ---');
    const c8 = newCtx({ worker: () => ({ status: 503, body: { error: 'down' } }) });
    allCtx.push(c8);
    const { page: p8, context: x8 } = await openStudy(browser, c8, '?participant=test_rA');
    await walk(p8, (st) => st.h1 === 'Instructions');
    r = await R(p8);
    check(c8.dialogs.length === 1 && /\[TEST session\]/.test(c8.dialogs[0]), 'TEST + Worker failure: one investigator alert');
    check(r.cb_source === 'test' && r.cb_error === 'HTTP 503' && JSON.stringify(c8.workerCalls) === '["1d_test"]', 'lower-case "test_" prefix routed to 1d_test; cb_source stays test with cb_error');
    await x8.close();

    // ================================================================ S9: real config.json (placeholder projectId) -> no Pavlovia traffic
    console.log('\n--- S9 placeholder config.json ---');
    const c9 = newCtx({ mockConfig: null });
    allCtx.push(c9);
    const { page: p9, context: x9 } = await openStudy(browser, c9, '?participant=900009');
    const act = await p9.evaluate(() => ({ active: PAVLOVIA.isActive, pid: PAVLOVIA.projectId }));
    check(act.active === false && act.pid === 'TODO_NEW_PROJECT_ID' && !c9.hosts.some((h) => h.startsWith('pavlovia.org')), 'placeholder projectId: local mode, no request to pavlovia.org');
    await x9.close();
  } catch (e) {
    console.log('FAIL exception: ' + String(e && e.message).slice(0, 300)); failures++;
  } finally {
    await browser.close();
    server.close();
  }
  const hosts = {}; const unexpected = new Set();
  for (const c of allCtx) { c.hosts.forEach((h) => { hosts[h] = (hosts[h] || 0) + 1; }); c.unexpected.forEach((h) => unexpected.add(h)); }
  console.log('\nNon-localhost requests seen by the page (all intercepted; none left the machine):');
  Object.entries(hosts).sort().forEach(([h, n]) => console.log('  ' + n + 'x ' + h));
  check(unexpected.size === 0, 'no request to an unexpected host' + (unexpected.size ? ': ' + [...unexpected].join(', ') : ''));
  console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nALL E2E CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
