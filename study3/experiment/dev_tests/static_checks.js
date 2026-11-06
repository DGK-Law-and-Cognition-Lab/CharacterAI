#!/usr/bin/env node
// Static checks for the Study 3 experiment.js (no browser, no network).
//
//   node dev_tests/static_checks.js <study2 experiment.js> <study3 experiment.js> <prereg .md> [<vignette-2 brief .md>]
//
// 1. Loads both files in a Node vm sandbox (init IIFE removed, fetch/XHR/beacon stubbed
//    so that nothing can leave the machine) and builds every page with the same seeded
//    Math.random. Checks that every Study 2 page's HTML and flags are byte-identical in Study 3
//    apart from the specified insertions (C24 notice, C15/C30 debrief blocks), checks the C25
//    page order for both measurement orders and the placement of the new pages (vignette 2,
//    prior_sylva), and lists the pages whose handler code differs.
// 2. Checks TRAIT_BLOCKS: all Study 2 keys unchanged; HIGH_E_S3 / LOW_E_S3 equal the
//    prereg §3.4 text verbatim; SYLVA_BASE_S3 equals SYLVA_BASE with only the length rule
//    replaced (and the new rule equals the prereg text).
// 3. Assembles the four Study 3 prompts and compares length and SHA-256 with prereg
//    Appendix A.
// 4. (build part 2) Checks every new participant-facing text against the prereg verbatim:
//    scripts (App. D.1) and their hashes, pre-chat notice (D.2), probe texts (D.3), vignette 2
//    and its items (D.4, §6.14), debrief sentence (D.5), C16 items (§6.4, §4.2), Draft C.
// Never prints secret values.
'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const [s2Path, s3Path, preregPath, briefPath] = process.argv.slice(2);
if (!s2Path || !s3Path || !preregPath) { console.error('usage: static_checks.js s2.js s3.js prereg.md'); process.exit(2); }

let failures = 0;
function check(cond, label) { console.log((cond ? 'PASS ' : 'FAIL ') + label); if (!cond) failures++; }

function seeded(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function load(path, isS2) {
  let src = fs.readFileSync(path, 'utf8');
  const cut = src.lastIndexOf('(async function(){');
  if (cut < 0) throw new Error('init IIFE not found in ' + path);
  src = src.slice(0, cut);
  const store = {};
  const blocked = () => { throw new Error('network blocked in static checks'); };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh) static-check', sendBeacon: blocked },
    location: { search: '' },
    screen: { width: 1440, height: 900 },
    URLSearchParams, TextEncoder, Uint8Array, Array, Object, JSON, String, Number, Date, Promise, Error, RegExp, isNaN, parseInt, encodeURIComponent,
    setTimeout, clearTimeout, setInterval, clearInterval,
    fetch: () => Promise.reject(new Error('network blocked')),
    XMLHttpRequest: function () { blocked(); },
    alert() {},
    document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    sessionStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    crypto: globalThis.crypto,
  };
  sandbox.window = sandbox;
  sandbox.Math = Object.create(Math);
  vm.createContext(sandbox);
  vm.runInContext(src + '\n;this.__exports={ST,P,TRAIT_BLOCKS,SYLVA_BASE,STUDY_CONFIGS,' + (isS2 ? '' : 'SYLVA_BASE_S3,buildSystemPrompt,EXPECTED_PROMPT_SHA256,') + 'buildAll};', sandbox, { filename: path });
  return sandbox;
}

const s2 = load(s2Path, true);
const s3 = load(s3Path, false);

// ---------- 1. pages (build part 2: specified insertions and the C25 order block)
// Shuffles are made deterministic and stream-independent (Math.random = 0), so a page built by
// both versions has the same item order even though Study 3 builds more shuffled pages.
// Study 3 is built twice: with the C16 switches off (pages must match Study 2 except the
// specified insertions) and as configured (switches on).
const zero = () => 0;
s2.Math.random = zero;
s3.Math.random = zero;
s2.__exports.ST.cbAssignment = { level: 'high', slot: 0, source: 'worker' }; // avoid an RNG draw in Study 2 buildAll
s2.__exports.buildAll();
const s3off = load(s3Path, false);
s3off.Math.random = zero; s3off.INCLUDE_MC_E_ITEMS = false; s3off.INCLUDE_PRIOR_SYLVA = false;
s3off.__exports.buildAll();
s3.__exports.buildAll();
const P2 = s2.__exports.P, P3off = s3off.__exports.P, P3 = s3.__exports.P;
const NEW_PIDS = ['v2_vignette', 'v2_items', 'prior_sylva'];
function basePages(P) { // drop the new pages and the second copy of the impression block
  const seen = {}; const out = [];
  for (const p of P) {
    if (NEW_PIDS.includes(p.pid)) continue;
    if (p.pid === 'tipi_bot' || p.pid === 'mc') { seen[p.pid] = (seen[p.pid] || 0) + 1; if (seen[p.pid] > 1) continue; }
    out.push(p);
  }
  return out;
}
const B3 = basePages(P3off);
check(P3off.length === P2.length + 4 && P3.length === P2.length + 5, 'page count: Study 2 ' + P2.length + '; Study 3 ' + P3off.length + ' with C16 off (+2 impression copy, +2 vignette 2), ' + P3.length + ' as configured (+ prior_sylva)');
check(B3.length === P2.length, 'Study 3 minus the new pages and the second impression copy has the Study 2 page count (' + B3.length + ')');
check(P3.every((p) => typeof p.pid === 'string' && p.pid.length > 0), 'every Study 3 page has a page identifier (pid)');
const S3c = s3off; const X = (n) => S3c[n];
const debriefIns1 = X('DEBRIEF_S3_MANIPULATION_HTML') + X('DEBRIEF_S3_SCENARIOS_HTML') + X('DEBRIEF_S3_WITHDRAW_HTML') + X('DEBRIEF_S3_SUPPORT_HTML');
const EXPECTED_DIFF = {
  prechat_ready: (h) => h.replace('<p style="margin-top:16px">' + X('PRECHAT_PROBE_NOTICE') + '</p>', ''),
  debrief: (h) => h.replace(debriefIns1, '').replace(X('DEBRIEF_S3_OHRPP_HTML'), ''),
};
let htmlSame = 0; const htmlDiff = []; const handlerDiff = []; const insertOk = [];
for (let i = 0; i < Math.min(P2.length, B3.length); i++) {
  const a = P2[i], b = B3[i];
  const flagsSame = a.nt === b.nt && a.timer === b.timer && a.fin === b.fin && a.isChat === b.isChat;
  if (a.html === b.html && flagsSame) htmlSame++;
  else if (EXPECTED_DIFF[b.pid] && flagsSame && EXPECTED_DIFF[b.pid](b.html) === a.html) insertOk.push(b.pid);
  else htmlDiff.push(i + ':' + b.pid);
  for (const fn of ['val', 'cond', 'onShow']) {
    const fa = a[fn] ? a[fn].toString() : '', fb = b[fn] ? b[fn].toString() : '';
    if (fa !== fb) handlerDiff.push(b.pid + ':' + fn);
  }
}
// The consent page is replaced on purpose (IRB amendment 2026-10-19): full Study 3 consent text + new option labels.
const consentIdx = htmlDiff.findIndex((d) => /:consent$/.test(d));
if (consentIdx >= 0) htmlDiff.splice(consentIdx, 1);
check(htmlDiff.length === 0, 'page HTML + nt/timer/fin/isChat identical to Study 2 for every Study 2 page except the consent page (' + htmlSame + ' identical; differing beyond the specified insertions: ' + JSON.stringify(htmlDiff) + ')');
{
  const cp = B3.find((p) => p.pid === 'consent');
  const fsx = require('fs'), pth = require('path');
  const txtPath = pth.join(__dirname, '..', '..', '..', '..', 'Docs', 'IRB', 'Amendment_Study3_2026-10-19', 'Study3_Consent_page_text.txt');
  if (fsx.existsSync(txtPath) && cp) {
    const norm = (t) => t.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[•○]/g, ' ').replace(/^\s*\d+\.\s/gm, ' ').replace(/\s+/g, ' ').trim();
    const want = norm(fsx.readFileSync(txtPath, 'utf8').replace(/○ I (do not )?consent/g, '').replace(/^\d+\.\s/gm, ''));
    const got = norm(cp.html.split('<div class="radio-group"')[0].replace('<h1>Consent</h1>', ''));
    check(got === want, 'consent page shows the full IRB consent text word for word (' + got.length + ' vs ' + want.length + ' characters)');
    check(/value="1"> I consent</.test(cp.html) && /value="2"> I do not consent</.test(cp.html), 'consent options read "I consent" / "I do not consent"');
  } else check(false, 'consent page text file found');
}
check(JSON.stringify(insertOk.sort()) === JSON.stringify(['debrief', 'prechat_ready']), 'only differences: C24 notice appended to "Getting Ready to Chat", C15/C30 blocks inserted in the debrief; removing them gives the Study 2 HTML (' + insertOk.join(',') + ')');
console.log('INFO pages whose handler code differs from Study 2: ' + JSON.stringify(handlerDiff));
// order block
function shown(S, order) {
  S.__exports.ST.order = order; const P = S.__exports.P; const seq = [];
  for (const p of P) { if (p.cond && !p.cond()) continue; seq.push(p.pid); }
  return seq;
}
const seqI = shown(s3, 'impression_first'), seqB = shown(s3, 'bonding_first');
const sl = (seq) => seq.slice(seq.indexOf('comprehension'), seq.indexOf('liab_vignette')).join(',');
check(sl(seqI) === 'comprehension,tipi_bot,mc,psr,ec,trust,et,ma,mp', 'impression_first shows comprehension, TIPI-Bot, MC, PSR, EC, Trust, ET, MA, MP (' + sl(seqI) + ')');
check(sl(seqB) === 'comprehension,psr,ec,trust,tipi_bot,mc,et,ma,mp', 'bonding_first shows comprehension, PSR, EC, Trust, TIPI-Bot, MC, ET, MA, MP (' + sl(seqB) + ')');
check(seqI.length === seqB.length && new Set(seqI).size === seqI.length && new Set(seqB).size === seqB.length, 'each order shows every page exactly once (' + seqI.length + ' pages shown with attention-check pages skipped)');
check(shown(s3, null).join() === seqI.join(), 'unset order falls back to the impression_first sequence');
const tb = P3.filter((p) => p.pid === 'tipi_bot'), mcs = P3.filter((p) => p.pid === 'mc');
check(tb.length === 2 && mcs.length === 2 && tb[0].html === tb[1].html && mcs[0].html === mcs[1].html, 'both copies of the impression block have identical pages');
const after = (seq) => seq.slice(seq.indexOf('oe_2'), seq.indexOf('demo_intro') + 1).join(',');
check(after(seqI) === 'oe_2,v2_vignette,v2_items,demo_intro' && after(seqB) === after(seqI), 'vignette 2 pages directly after the open-ended questions, before demographics');
const tail = seqI.slice(seqI.indexOf('demo_q25_28')).join(',');
check(tail === 'demo_q25_28,prior_sylva,ai_use,debrief', 'prior_sylva on its own page after the 28 numbered items, before the AI-use page (' + tail + ')');

// ---------- 2. text blocks
const T2 = s2.__exports.TRAIT_BLOCKS, T3 = s3.__exports.TRAIT_BLOCKS;
const keys2 = Object.keys(T2);
check(keys2.every(k => T2[k] === T3[k]), 'all Study 2 TRAIT_BLOCKS keys byte-identical in Study 3 (' + keys2.join(',') + ')');
const newKeys = Object.keys(T3).filter(k => !(k in T2));
check(JSON.stringify(newKeys) === JSON.stringify(['HIGH_E_S3', 'LOW_E_S3']), 'only new TRAIT_BLOCKS keys are HIGH_E_S3, LOW_E_S3 (' + newKeys.join(',') + ')');
check(s2.__exports.SYLVA_BASE === s3.__exports.SYLVA_BASE, 'SYLVA_BASE unchanged');

const md = fs.readFileSync(preregPath, 'utf8');
function quoteAfter(heading) {
  const i = md.indexOf(heading); if (i < 0) return null;
  const m = /\n> ([^\n]+)/.exec(md.slice(i)); return m ? m[1] : null;
}
const preHighE = quoteAfter('**HIGH_E (new, Study 3):**');
const preLowE = quoteAfter('**LOW_E (new, Study 3):**');
check(preHighE && T3.HIGH_E_S3 === preHighE, 'HIGH_E_S3 verbatim = prereg §3.4 HIGH_E');
check(preLowE && T3.LOW_E_S3 === preLowE, 'LOW_E_S3 verbatim = prereg §3.4 LOW_E');
const preHighA = quoteAfter('**HIGH_A (unchanged; Study 1 HighA block):**');
const preLowA = quoteAfter('**LOW_A (unchanged; Study 1 LowA block):**');
const preModLowN = quoteAfter('**MOD_LOW_N (unchanged; held constant in all cells, as in Study 1):**');
check(T3.HIGH_A === preHighA && T3.LOW_A === preLowA && T3.MOD_LOW_N === preModLowN, 'HIGH_A, LOW_A, MOD_LOW_N equal the prereg §3.4 text');
const OLD = '- Keep responses to 2-4 sentences. Be conversational and natural, not long-winded.';
const NEW = '- Every reply is about 4 sentences and 70-100 words. Be conversational and natural.';
check(md.includes('> ' + NEW), 'new length rule appears verbatim in prereg §3.4');
check(s3.__exports.SYLVA_BASE_S3 === s3.__exports.SYLVA_BASE.replace(OLD, NEW) && s3.__exports.SYLVA_BASE_S3 !== s3.__exports.SYLVA_BASE, 'SYLVA_BASE_S3 = SYLVA_BASE with only the length rule replaced');

// ---------- 3. prompts and hashes
const appA = {};
for (const m of md.matchAll(/\| (HighA_HighE|HighA_LowE|LowA_HighE|LowA_LowE) \| ([\d,]+) \| `([0-9a-f]{64})` \|/g)) appA[m[1]] = { len: parseInt(m[2].replace(/,/g, ''), 10), sha: m[3] };
check(Object.keys(appA).length === 4, 'read 4 rows of prereg Appendix A');
const cells = s3.__exports.STUDY_CONFIGS['1d'].cells;
for (const c of cells) {
  const p = s3.__exports.buildSystemPrompt(c);
  const sha = crypto.createHash('sha256').update(p, 'utf8').digest('hex');
  check(p.length === appA[c.cell].len, c.cell + ' prompt length ' + p.length + ' = Appendix A ' + appA[c.cell].len);
  check(sha === appA[c.cell].sha, c.cell + ' SHA-256 = Appendix A (' + sha.slice(0, 12) + '...)');
  check(s3.__exports.EXPECTED_PROMPT_SHA256[c.cell] === appA[c.cell].sha, c.cell + ' EXPECTED_PROMPT_SHA256 constant = Appendix A');
  check(p.indexOf(T3[c.a_block]) < p.indexOf(T3[c.e_block]) && p.indexOf(T3[c.e_block]) < p.indexOf(T3.MOD_LOW_N), c.cell + ' block order A, E, MOD_LOW_N');
}
// Full HighA_HighE text in Appendix A
const fence = /Full text of the HighA_HighE prompt[\s\S]*?```\n([\s\S]*?)\n```/.exec(md);
check(fence && fence[1] === s3.__exports.buildSystemPrompt(cells[0]), 'HighA_HighE prompt equals the full text printed in Appendix A');
// No out-of-character safety clause (rule 6 / prereg §11.3)
const allPrompts = cells.map(c => s3.__exports.buildSystemPrompt(c)).join('\n');
check(!/step out of character|crisis|988|harming themselves/i.test(allPrompts), 'no out-of-character safety clause in any prompt');

// ---------- 4. build part 2: new participant-facing text = prereg verbatim (Appendix D, §6.4, §6.14, §4.2)
{
  const S = s3; const G = (n) => S[n];
  const sec = (a, b) => { const i = md.indexOf(a); const j = b ? md.indexOf(b, i + 1) : md.length; return i < 0 ? '' : md.slice(i, j); };
  const D1 = sec('### D.1 Scripted openings', '### D.2');
  const CELLS = { HighA_HighE: ['**Warm, outgoing (HIGH_A × HIGH_E)**', 87, 73], HighA_LowE: ['**Warm, reserved (HIGH_A × LOW_E)**', 85, 84], LowA_HighE: ['**Cold, outgoing (LOW_A × HIGH_E)**', 84, 80], LowA_LowE: ['**Cold, reserved (LOW_A × LOW_E)**', 87, 77] };
  const SC = G('SCRIPTS');
  for (const [c, [h, w0, w1]] of Object.entries(CELLS)) {
    const s = D1.slice(D1.indexOf(h));
    const p0 = (/\n> S0: ([^\n]+)\n/.exec(s) || [])[1], p1 = (/\n> S1: ([^\n]+)\n/.exec(s) || [])[1];
    check(SC[c] && SC[c].S0 === p0 && SC[c].S1 === p1, c + ': S0 and S1 verbatim = prereg Appendix D.1');
    check(SC[c].S0.split(/\s+/).length === w0 && SC[c].S1.split(/\s+/).length === w1, c + ': word counts ' + w0 + '/' + w1 + ' as in the Appendix D.1 table');
    const h256 = crypto.createHash('sha256').update(SC[c].S0 + '\n' + SC[c].S1, 'utf8').digest('hex');
    check(G('EXPECTED_SCRIPT_SHA256')[c] === h256, c + ': EXPECTED_SCRIPT_SHA256 = SHA-256(S0 + "\\n" + S1) (' + h256.slice(0, 12) + '...)');
  }
  check(/S0 \+ "\\n" \+ S1 per cell/.test(D1), 'Appendix D.1 defines script_sha256 as SHA-256 of S0 + "\\n" + S1');
  const s2src = fs.readFileSync(s2Path, 'utf8'), s3src = fs.readFileSync(s3Path, 'utf8');
  check(s2src.includes("content:'" + G('CHAT_OPENER') + "'"), 'CHAT_OPENER is the unchanged Study 1-2 opening message');
  const q1 = (t) => (/\n> "([^\n]+)"\n/.exec(t) || [])[1];
  check(G('PRECHAT_PROBE_NOTICE') === q1(sec('### D.2 Pre-chat notice', '### D.3')), 'PRECHAT_PROBE_NOTICE verbatim = Appendix D.2');
  const D3 = sec('### D.3 Closeness probe', '### D.4');
  check(G('PROBE_IOS_INSTRUCTION') === q1(D3) && md.includes('Instruction: "' + G('PROBE_IOS_INSTRUCTION') + '"'), 'IOS instruction verbatim = Appendix D.3 and §6.13');
  check(JSON.stringify(G('PROBE_IOS_LABELS')) === JSON.stringify((/labeled "([^"]+)" and "([^"]+)"/.exec(D3) || []).slice(1, 3)), 'IOS labels "You" / "Sylva" = Appendix D.3');
  check((D3.includes('slider.** "' + G('PROBE_SLIDER_QUESTION') + '"') || D3.includes('("' + G('PROBE_SLIDER_QUESTION') + '"')) && D3.includes('end labels "' + G('PROBE_SLIDER_END_LABELS')[0] + '" and "' + G('PROBE_SLIDER_END_LABELS')[1] + '"'), 'slider question and end labels = Appendix D.3');
  check(['ios', 'slider'].includes(G('PROBE_FORMAT')), 'PROBE_FORMAT is ios or slider (' + G('PROBE_FORMAT') + ')');
  const D4 = sec('### D.4 Vignette 2', '### D.5'), S614 = sec('### 6.14 Vignette 2', '### 6.15');
  check(G('VIGNETTE2_TEXT') === q1(D4) && G('VIGNETTE2_TEXT') === (/\n> ([^\n]+)\n/.exec(S614) || [])[1], 'VIGNETTE2_TEXT verbatim = Appendix D.4 = §6.14');
  const items = [...S614.matchAll(/`(v2_[a-z_]+)`: "([^"]+)"/g)].map((m) => m[1] + '|' + m[2]);
  check(JSON.stringify(G('V2_ITEMS').map((i) => i.id + '|' + i.text)) === JSON.stringify(items) && items.length === 9, 'nine vignette-2 items: ids and wording verbatim = §6.14 table');
  check(G('V2_SEVERITY_ITEM').id === 'v2_severity' && (md.includes('v2_severity, worded as liab_11 ("' + G('V2_SEVERITY_ITEM').text + '")') || md.includes('("' + G('V2_SEVERITY_ITEM').text + '", worded as `liab_11`)')) && s3src.includes("{id:'liab_11',text:'" + G('V2_SEVERITY_ITEM').text + "'}"), 'v2_severity worded as liab_11 (§6.14, Appendix D.4)');
  const P = S.__exports.P, vp = P.find((p) => p.pid === 'v2_vignette'), ip = P.find((p) => p.pid === 'v2_items');
  const v1 = P.find((p) => p.pid === 'liab_vignette'), v1i = P.find((p) => p.pid === 'liab_items');
  check(vp && vp.timer === 10 && vp.html.includes(G('VIGNETTE2_TEXT')) && vp.html.replace(G('VIGNETTE2_TEXT'), 'X') === v1.html.replace(/<p>Imagine that[^<]*<\/p>/, '<p>X</p>'), 'vignette 2 page: 10-s minimum, vignette-1 frame unchanged around the D.4 text');
  const nIt = (ip && ip.html.match(/class="form-group"/g) || []).length;
  check(ip && nIt === (G('INCLUDE_V2_SEVERITY') ? 10 : 9) && ip.nt === true && (ip.html.match(/>Not at all</g) || []).length === nIt && ip.html.startsWith('<h1>Questions About the Scenario</h1><p>Based on the scenario you just read, please answer the following:</p>') && v1i.html.startsWith('<h1>Questions About the Scenario</h1><p>Based on the scenario you just read, please answer the following:</p>'), 'vignette 2 items on one page (' + nIt + ' items, mkS5b scale, vignette-1 title and lead-in)');
  check(G('INCLUDE_V2_SEVERITY') === true, 'INCLUDE_V2_SEVERITY = true (recommended, pending sign-off)');
  const brief = briefPath ? fs.readFileSync(briefPath, 'utf8') : '';
  const draftC = (/### 7\.3 Draft C[^\n]*\n\n> "([^\n]+)"\n/.exec(brief) || [])[1];
  check(!briefPath || (draftC && s3src.includes("// var VIGNETTE2_TEXT='" + draftC.replace(/'/g, "\\'") + "';")), 'Draft C (brief §7.3) kept verbatim as a commented alternative');
  const d5 = q1(sec('### D.5 Debrief addition', '### D.6'));
  const dp = P.find((p) => p.pid === 'debrief');
  check(G('DEBRIEF_V2_SENTENCE') === d5 && dp.html.includes(G('DEBRIEF_S3_SCENARIOS_FICTIONAL') + ' ' + d5), 'D.5 sentence verbatim, directly after the sentence that both scenarios were fictional');
  check(['988', 'CAPS', 'OHRPP', 'withdraw', 'Warmth', 'Extraversion', 'language model given specific personality instructions', 'davidgkamper@ucla.edu'].every((w) => dp.html.includes(w)), 'debrief has the §11.3 elements (manipulation, AI model, withdrawal, investigator, OHRPP, CAPS, 988, fictional scenarios)');
  const S64 = sec('### 6.4 Manipulation checks', '### 6.5');
  const mcPre = [...S64.matchAll(/`(mc_e_energetic|mc_length)` "([^"]+)"/g)].map((m) => m[1] + '|' + m[2]);
  check(JSON.stringify(G('MC_E_ITEMS').map((i) => i.id + '|' + i.text)) === JSON.stringify(mcPre) && mcPre.length === 2, 'mc_e_energetic and mc_length verbatim = §6.4');
  const mcp = P.find((p) => p.pid === 'mc');
  check(mcp && (mcp.html.match(/class="form-group"/g) || []).length === (G('INCLUDE_MC_E_ITEMS') ? 5 : 3) && mcp.html.includes(G('MC_E_ITEMS')[0].text) === G('INCLUDE_MC_E_ITEMS'), 'manipulation-check page has ' + (G('INCLUDE_MC_E_ITEMS') ? 5 : 3) + ' items on one page');
  const pr = /demographics item "([^"]+)" \(([^)]+)\), saved as prior_sylva/.exec(md) || /demographics item, "([^"]+)" \(([^)]+)\), is saved as `prior_sylva`/.exec(md) || [];   // revision 2 or revision 3 phrasing
  check(G('PRIOR_SYLVA_QUESTION') === pr[1] && G('PRIOR_SYLVA_OPTIONS').map((o) => o[1]).join(' / ') === pr[2] && G('PRIOR_SYLVA_OPTIONS').every((o) => o[0] === o[1]), 'prior_sylva wording and options verbatim = §4.2 (values = labels, so "Yes" matches exclusion 9)');
  const pp = P.find((p) => p.pid === 'prior_sylva');
  check(!G('INCLUDE_PRIOR_SYLVA') || (pp && pp.html.includes(G('PRIOR_SYLVA_QUESTION')) && pp.nt === true), 'prior_sylva page built');
  const WORD = ['bl', 'ame'].join(''); // hard rule 6: the word may appear only in existing items
  const wcount = (t) => (t.match(new RegExp(WORD, 'gi')) || []).length;
  check(wcount(s3src) === wcount(s2src), 'no new occurrence of the word excluded by hard rule 6 (' + wcount(s3src) + ' = Study 2 count: liab_2 and ma_8 only)');
  const marks = (s3src.match(/\[PI SIGN-OFF NEEDED\] prereg Appendix D\.[1-5]/g) || []).map((m) => m.slice(-3));
  check(['D.1', 'D.2', 'D.3', 'D.4', 'D.5'].every((d) => marks.includes(d)), 'every Appendix D text constant is marked [PI SIGN-OFF NEEDED] prereg Appendix D.x');
}

console.log(failures ? ('\n' + failures + ' FAILURE(S)') : '\nALL STATIC CHECKS PASSED');
process.exit(failures ? 1 : 0);
