#!/usr/bin/env node
// LIVE OpenRouter check of the Study 3 chat (real model calls; costs a fraction of a cent per run).
//
//   node test/live_openrouter_check.mjs [--cells HighA_HighE,LowA_LowE] [--messages 6]
//
// What is real: the experiment page (served from this folder on 127.0.0.1) in headless Chrome,
// the browser's own XMLHttpRequest to https://openrouter.ai (CORS, auth header, JSON parsing,
// per-reply metadata) and the model's replies. What is NOT real: the counterbalance Worker,
// Pavlovia and SONA are never contacted. Chrome sends everything except openrouter.ai and
// 127.0.0.1 to a dead proxy, and CDP Fetch interception aborts any other request.
// The chat page is opened directly (the cell is set with applyAssignment as a TEST session);
// the participant messages are synthetic. Output: test/output/live_openrouter/.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './lib/cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXP_DIR = path.resolve(here, '..');
const OUT = process.env.LIVE_OUT || path.join(here, 'output', 'live_openrouter');   // LIVE_OUT: write elsewhere (for example a local scratch folder)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CELLS = (arg('--cells', 'HighA_HighE,HighA_LowE,LowA_HighE,LowA_LowE')).split(',');
const NMSG = parseInt(arg('--messages', '6'), 10);
const RUNS = parseInt(arg('--runs', '1'), 10);
// prereg §4.6: a range of first messages (an answer, a question, a greeting, a one-word reply)
const FIRST = [
  "Hi! I just wandered over, I'm on a break from studying.",
  'Who are you, and why are you out here?',
  'hello',
  'ok',
];

const MSGS = [
  "Hi! I just wandered over, I'm on a break from studying.",
  "Things have been pretty busy. I'm a student and midterms are coming up.",
  'What do you do all day in the forest?',
  'One thing that has been hard lately is that I moved away from home this year and I sometimes feel a bit lonely.',
  'Thanks for listening. Do you ever get lonely on your quest?',
  "What's the strangest thing you've found while looking for a way to resist fire?",
  'If you could have one wish granted, what would it be?',
  'I should probably get back to studying soon. Any advice?',
  'Do you have any friends left in the forest?',
  'What does the forest look like in winter?',
  'I think I would like to see a crystal ridge someday.',
  'What would you do first if you became fireproof?',
];

const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

async function launch(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `s3live-${tag}-`));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync',
    '--disable-default-apps', '--disable-client-side-phishing-detection', '--disable-domain-reliability', '--disable-breakpad',
    '--metrics-recording-only', '--safebrowsing-disable-auto-update', '--password-store=basic', '--use-mock-keychain',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=openrouter.ai;127.0.0.1', '--window-size=1280,800', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; proc.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
  const pf = path.join(dir, 'DevToolsActivePort'); const t0 = Date.now();
  while (!fs.existsSync(pf) || fs.readFileSync(pf, 'utf8').split('\n').length < 2) {
    if (proc.exitCode !== null || Date.now() - t0 > 20000) throw new Error('Chrome failed: ' + err.slice(-300));
    await sleep(100);
  }
  const [port, ws] = fs.readFileSync(pf, 'utf8').trim().split('\n');
  const cdp = await new CDP(`ws://127.0.0.1:${port.trim()}${ws.trim()}`).connect();
  const close = async () => { try { await Promise.race([cdp.send('Browser.close'), sleep(3000)]); } catch { /* */ } cdp.close(); await sleep(300); try { proc.kill('SIGKILL'); } catch { /* */ } fs.rmSync(dir, { recursive: true, force: true }); };
  return { cdp, close };
}

async function runCell(cell, port, runIdx = 0) {
  const msgs = [FIRST[runIdx % FIRST.length], ...MSGS.slice(1)];
  const { cdp, close } = await launch(cell + '-' + runIdx);
  const net = { live: 0, blocked: [], local: 0 };
  const errors = [];
  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    cdp.on('Fetch.requestPaused', async (p, s) => {
      if (s !== sid) return;
      const u = new URL(p.request.url);
      try {
        if (u.hostname === '127.0.0.1') { net.local++; return await cdp.send('Fetch.continueRequest', { requestId: p.requestId }, sid); }
        if (u.hostname === 'openrouter.ai') { net.live++; return await cdp.send('Fetch.continueRequest', { requestId: p.requestId }, sid); }
        net.blocked.push(u.hostname + u.pathname);
        return await cdp.send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' }, sid);
      } catch (e) { errors.push('fetch handler: ' + e.message); }
    });
    cdp.on('Runtime.exceptionThrown', (p, s) => { if (s === sid) errors.push('page exception: ' + ((p.exceptionDetails.exception || {}).description || p.exceptionDetails.text || '').split('\n')[0]); });
    cdp.on('Page.javascriptDialogOpening', async (p, s) => { if (s === sid) { errors.push('dialog: ' + p.message); await cdp.send('Page.handleJavaScriptDialog', { accept: true }, sid); } });
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }, sid);
    await cdp.send('Page.enable', {}, sid); await cdp.send('Runtime.enable', {}, sid);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?survey_code=TESTlive_${cell}` }, sid);
    const ev = async (expr) => { const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sid); if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception || {}).description); return r.result.value; };
    const waitFor = async (expr, ms, what) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch { /* page loading */ } await sleep(250); } throw new Error('timeout waiting for ' + what); };
    await waitFor(`typeof P!=='undefined'&&P.length>10&&typeof applyAssignment==='function'`, 20000, 'experiment to load');
    // TEST session; cell set directly (no Worker call); then open the chat page.
    await ev(`(async()=>{ST.pid='TESTlive_${cell}';await applyAssignment({cell:'${cell}',order:'impression_first',slot:'',source:'test',order_source:'test',study:'1d_test',req_id:'live-check',error:'',fetch_ms:0},true,false);render(P.findIndex(function(p){return p.isChat}));return true})()`);
    const promptOk = await ev(`ST.r.system_prompt_sha256_match===true`);
    const answerProbe = async () => { await ev(`(function(){var o=document.querySelector('#probeCard .ios-opt[data-v="4"]');if(o)o.click();var b=document.querySelector('#probeCard .probe-submit');if(b)b.click();return true})()`); await sleep(300); };
    await waitFor(`ST.chatLog.some(function(e){return e.script_slot==='S0'})&&!CS.waiting`, 15000, 'S0');
    const turns = [];
    for (let i = 0; i < NMSG; i++) {
      await waitFor(`!CS.waiting&&!CS.ended`, 120000, 'ready to send');
      if (await ev('CS.probeOpen')) await answerProbe();
      const nBefore = await ev('ST.chatLog.length');
      const t0 = Date.now();
      await ev(`(function(){document.getElementById('chatInput').value=${JSON.stringify(msgs[i])};chatSend();return true})()`);
      await waitFor(`ST.chatLog.length>=${nBefore + 2}&&!CS.waiting`, 120000, `reply to message ${i + 1}`);
      const last = await ev(`ST.chatLog[ST.chatLog.length-1]`);
      turns.push({ msg: i + 1, wall_ms: Date.now() - t0, entry: last });
      if (await ev('CS.probeOpen')) await answerProbe();
    }
    const log = await ev('ST.chatLog');
    const rec = await ev(`({cell:ST.r.cell,a_level:ST.r.a_level,e_level:ST.r.e_level,errors:ST.r.chat_api_error_count||0,llm:CS.llmRounds,ok:CS.okRounds,ios_t1:ST.r.ios_t1})`);
    return { cell, runIdx, promptOk, rec, log, turns, net, errors };
  } finally { await close(); }
}

const words = (t) => (t.trim().match(/\S+/g) || []).length;
const msgs0 = (r) => { const u = r.log.find((e) => e.role === 'user'); return u ? JSON.stringify(u.content) : ''; };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: EXP_DIR, stdio: 'ignore' });
  await sleep(800);
  const results = [];
  try {
    // cells run in parallel; runs within a cell run one after another
    await Promise.all(CELLS.map(async (cell) => {
      for (let k = 0; k < RUNS; k++) {
        try { const r = await runCell(cell, port, k); results.push(r); console.log(`${cell} run ${k + 1}/${RUNS}: done`); } catch (e) { results.push({ cell, runIdx: k, fatal: e.message }); console.log(`${cell} run ${k + 1}: FAILED: ${e.message}`); }
      }
    }));
  } finally { srv.kill(); }
  const summary = [];
  for (const r of results) {
    if (r.fatal) { summary.push({ cell: r.cell, ok: false, fatal: r.fatal }); continue; }
    const model = r.log.filter((e) => e.role === 'assistant' && !e.scripted);
    const errs = r.log.filter((e) => e.role === 'system_error');
    const s = {
      cell: r.cell, run: r.runIdx + 1, first_message_type: ['answer', 'question', 'greeting', 'one-word'][r.runIdx % 4], ok: model.length === NMSG - 1 && errs.length === 0 && r.errors.length === 0 && r.net.blocked.length === 0 && r.promptOk,
      system_prompt_hash_matches_prereg: r.promptOk, model_replies: model.length, api_errors: errs.length,
      providers: [...new Set(model.map((e) => e.provider))], models_served: [...new Set(model.map((e) => e.model_served))],
      finish_reasons: [...new Set(model.map((e) => e.finish_reason))],
      latency_ms_median: model.map((e) => e.latency_ms).sort((a, b) => a - b)[Math.floor(model.length / 2)] || null,
      mean_words_per_reply: +(model.reduce((a, e) => a + words(e.content), 0) / Math.max(1, model.length)).toFixed(1),
      exclam_per_reply: +(model.reduce((a, e) => a + (e.content.match(/!/g) || []).length, 0) / Math.max(1, model.length)).toFixed(2),
      questions_per_reply: +(model.reduce((a, e) => a + (e.content.match(/\?/g) || []).length, 0) / Math.max(1, model.length)).toFixed(2),
      prompt_tokens_last: (model[model.length - 1] || {}).usage ? model[model.length - 1].usage.prompt_tokens : null,
      cost_usd: +model.reduce((a, e) => a + ((e.usage && e.usage.cost) || 0), 0).toFixed(6),
      requests_live_to_openrouter: r.net.live, requests_blocked: r.net.blocked, page_errors: r.errors,
    };
    summary.push(s);
    const md = [`# Live check: ${r.cell}`, '', `Synthetic participant messages; Sylva's first two messages are the scripted S0/S1, the rest are live Llama 3.3 70B replies via OpenRouter.`, ''];
    for (const e of r.log) {
      if (e.role === 'user_scripted') continue;
      const who = e.role === 'user' ? 'Participant (synthetic)' : e.role === 'assistant' ? (e.scripted ? `Sylva (scripted ${e.script_slot})` : `Sylva (live; ${e.provider}, ${e.latency_ms} ms, finish ${e.finish_reason})`) : e.role;
      md.push(`**${who}:** ${e.content}`, '');
    }
    s.words_all = model.map((e) => words(e.content)); s.latencies = model.map((e) => e.latency_ms);
    s.S1_after_first_message = `${msgs0(r)} -> ${(r.log.find((e) => e.script_slot === 'S1') || {}).content || ''}`.slice(0, 600);
    fs.writeFileSync(path.join(OUT, RUNS > 1 ? `${r.cell}_run${r.runIdx + 1}.md` : `${r.cell}.md`), md.join('\n'));
  }
  // per-cell length check (prereg §4.6: each cell's mean words per model reply within ±10% of the grand mean)
  const byCell = {};
  for (const s of summary) { if (s.fatal) continue; (byCell[s.cell] = byCell[s.cell] || []).push(...s.words_all); }
  const cellMeans = Object.fromEntries(Object.entries(byCell).map(([c, w]) => [c, w.reduce((a, b) => a + b, 0) / w.length]));
  const grand = Object.values(cellMeans).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(cellMeans).length);
  const lengthCheck = Object.fromEntries(Object.entries(cellMeans).map(([c, m]) => [c, { mean_words: +m.toFixed(1), pct_from_grand_mean: +(100 * (m - grand) / grand).toFixed(1), n_replies: byCell[c].length }]));
  const allLat = summary.flatMap((s) => s.latencies || []).sort((a, b) => a - b);
  const agg = { runs: summary.length, runs_ok: summary.filter((s) => s.ok).length, total_model_replies: allLat.length,
    api_errors: summary.reduce((a, s) => a + (s.api_errors || 0), 0), grand_mean_words: +grand.toFixed(1), length_check_pass_10pct: Object.values(lengthCheck).every((v) => Math.abs(v.pct_from_grand_mean) <= 10),
    length_by_cell: lengthCheck, latency_ms_p50: allLat[Math.floor(allLat.length * 0.5)] || null, latency_ms_p95: allLat[Math.floor(allLat.length * 0.95)] || null, latency_ms_max: allLat[allLat.length - 1] || null,
    total_cost_usd: +summary.reduce((a, s) => a + (s.cost_usd || 0), 0).toFixed(4), providers: [...new Set(summary.flatMap((s) => s.providers || []))] };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ aggregate: agg, runs: summary.map(({ words_all, latencies, ...x }) => x) }, null, 2));
  console.log(JSON.stringify(agg, null, 2));
  const allOk = summary.every((s) => s.ok);
  console.log(allOk ? '\nLIVE OPENROUTER CHECK PASSED' : '\nLIVE OPENROUTER CHECK: PROBLEMS (see above)');
  process.exit(allOk ? 0 : 1);
})();
