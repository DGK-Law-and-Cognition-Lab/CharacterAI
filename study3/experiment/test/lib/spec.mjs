// Expected values taken from the SPEC (preregistration draft, revision 2) and from the Study 2
// code, independently of the Study 3 experiment.js under test.
//  - prereg §3.4 verbatim blocks -> the four assembled system prompts (assembled here)
//  - prereg Appendix A -> expected lengths, SHA-256 hashes, full HighA_HighE text
//  - prereg Appendix D.1-D.5, §6.14, §6.4, §4.2 -> participant-facing texts
//  - Study 2 experiment.js (read-only) -> the Study 2 output column list (and vignette-1 texts)
//  - Study 2 data/raw (optional, read-only) -> HEADER LINES ONLY, aggregated column names
// Secrets: nothing in this module reads or returns the OpenRouter key or the SONA token.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

export const CELLS = ['HighA_HighE', 'HighA_LowE', 'LowA_HighE', 'LowA_LowE'];
export const ORDERS = ['impression_first', 'bonding_first'];
export const CELL_LEVELS = {
  HighA_HighE: { a_level: 'high', e_level: 'high', a_block: 'HIGH_A', e_block: 'HIGH_E_S3', condition_id: 1 },
  HighA_LowE: { a_level: 'high', e_level: 'low', a_block: 'HIGH_A', e_block: 'LOW_E_S3', condition_id: 2 },
  LowA_HighE: { a_level: 'low', e_level: 'high', a_block: 'LOW_A', e_block: 'HIGH_E_S3', condition_id: 3 },
  LowA_LowE: { a_level: 'low', e_level: 'low', a_block: 'LOW_A', e_block: 'LOW_E_S3', condition_id: 4 },
};

// Page order of prereg §3.6 (steps 1-21), written with the page identifiers that the build logs
// in page_sequence (C25). Steps 15-17 are counterbalanced by `order`.
export function expectedPageSequence(order, { attnFail = false, priorSylva = true } = {}) {
  const setup = ['device_check', 'fullscreen', 'captcha', 'spr1', 'spr1_understood', 'spr2', 'spr2_understood',
    'pre_consent', 'consent', 'consent_date', 'sona_id', 'instructions', 'attn1'];
  if (attnFail) setup.push('attn1_fail', 'instructions_repeat', 'attn1_retry');
  setup.push('begin');
  const pre = ['tipi_self', 'gaais_1', 'gaais_2', 'phq4', 'backstory', 'prechat_ready', 'prechat_tips', 'chat', 'comprehension'];
  const imp = ['tipi_bot', 'mc'];
  const bond = ['psr', 'ec', 'trust'];
  const block = order === 'bonding_first' ? [...bond, ...imp] : [...imp, ...bond];
  const post = ['et', 'ma', 'mp', 'liab_vignette', 'liab_items', 'oe_1', 'oe_2', 'v2_vignette', 'v2_items',
    'demo_intro', 'demo_q1_3', 'demo_q4_6', 'demo_q7_9', 'demo_q10_13', 'demo_q14', 'demo_q15_16', 'demo_q17_19',
    'demo_q20_22', 'demo_q23_24', 'demo_q25_28', ...(priorSylva ? ['prior_sylva'] : []), 'ai_use', 'debrief'];
  return [...setup, ...pre, ...block, ...post];
}

function sectionBetween(md, startRe, endRe) {
  const s = md.search(startRe);
  if (s < 0) throw new Error('prereg: section not found: ' + startRe);
  const rest = md.slice(s);
  const e = rest.slice(1).search(endRe);
  return e < 0 ? rest : rest.slice(0, e + 1);
}

// Blockquote that follows a line starting with `label` (blank lines allowed in between).
function blockquoteAfter(text, label) {
  const lines = text.split('\n');
  let i = lines.findIndex((l) => l.startsWith(label));
  if (i < 0) throw new Error('prereg: label not found: ' + label);
  i++;
  while (i < lines.length && lines[i].trim() === '') i++;
  const out = [];
  while (i < lines.length && lines[i].startsWith('>')) { out.push(lines[i].replace(/^> ?/, '')); i++; }
  if (!out.length) throw new Error('prereg: no blockquote after ' + label);
  return out.join('\n');
}

const unquote = (s) => s.trim().replace(/^"/, '').replace(/"$/, '');

export function loadPrereg(preregPath) {
  const md = fs.readFileSync(preregPath, 'utf8').replace(/\r\n/g, '\n');
  const s34 = sectionBetween(md, /^### 3\.4 /m, /^### 3\.5 /m);
  const base = blockquoteAfter(s34, '**Base persona, `SYLVA_BASE_S3`');
  const blocks = {
    HIGH_A: blockquoteAfter(s34, '**HIGH_A ('),
    LOW_A: blockquoteAfter(s34, '**LOW_A ('),
    HIGH_E_S3: blockquoteAfter(s34, '**HIGH_E (new'),
    LOW_E_S3: blockquoteAfter(s34, '**LOW_E (new'),
    MOD_LOW_N: blockquoteAfter(s34, '**MOD_LOW_N ('),
  };
  const opener = /Opening message \(unchanged text\)\.\*\*[^"]*"([^"]+)"/.exec(s34)[1];
  // §3.4 formula: SYLVA_BASE_S3 + "HOW YOU BEHAVE IN CONVERSATION:" + blank line + A + blank line + E + blank line + MOD_LOW_N
  const prompts = {};
  for (const c of ['HighA_HighE', 'HighA_LowE', 'LowA_HighE', 'LowA_LowE']) {
    const lv = CELL_LEVELS[c];
    prompts[c] = base + '\n\nHOW YOU BEHAVE IN CONVERSATION:\n\n' + blocks[lv.a_block] + '\n\n' + blocks[lv.e_block] + '\n\n' + blocks.MOD_LOW_N;
  }

  const appA = sectionBetween(md, /^## Appendix A\./m, /^## Appendix B\./m);
  const appendixA = {};
  for (const m of appA.matchAll(/^\| (HighA_HighE|HighA_LowE|LowA_HighE|LowA_LowE) \| ([\d,]+) \| `([0-9a-f]{64})` \|/gm)) {
    appendixA[m[1]] = { length: parseInt(m[2].replace(/,/g, ''), 10), sha256: m[3] };
  }
  const full = /Full text of the HighA_HighE prompt[\s\S]*?```\n([\s\S]*?)\n```/.exec(appA);
  const appendixAFullHighAHighE = full ? full[1] : null;

  const appD = sectionBetween(md, /^## Appendix D\./m, /^### D\.6 /m);
  const d1 = sectionBetween(appD, /^### D\.1 /m, /^### D\.2 /m);
  const cellHeads = {
    HighA_HighE: '**Warm, outgoing (HIGH_A × HIGH_E)**', HighA_LowE: '**Warm, reserved (HIGH_A × LOW_E)**',
    LowA_HighE: '**Cold, outgoing (LOW_A × HIGH_E)**', LowA_LowE: '**Cold, reserved (LOW_A × LOW_E)**',
  };
  const scripts = {};
  for (const [c, head] of Object.entries(cellHeads)) {
    const q = blockquoteAfter(d1, head);
    const s0 = /^S0: (.+)$/m.exec(q), s1 = /^S1: (.+)$/m.exec(q);
    scripts[c] = { S0: s0[1].trim(), S1: s1[1].trim() };
  }
  const d2 = unquote(blockquoteAfter(sectionBetween(appD, /^### D\.2 /m, /^### D\.3 /m), 'One sentence added'));
  const d3s = sectionBetween(appD, /^### D\.3 /m, /^### D\.4 /m);
  const iosInstruction = unquote(blockquoteAfter(d3s, '**Recommended: Inclusion'));
  const sliderQuestion = /\*\*Alternative: one-item slider\.\*\* "([^"]+)"/.exec(d3s)[1];
  const sliderEnds = /end labels "([^"]+)" and "([^"]+)"/.exec(d3s).slice(1, 3);
  const d4s = sectionBetween(appD, /^### D\.4 /m, /^### D\.5 /m);
  const vignette2 = unquote(blockquoteAfter(d4s, 'Shown after the open-ended'));
  const v2Severity = /\*\*Optional tenth item \(recommended\)\.\*\* "([^"]+)"/.exec(d4s)[1];
  const d5 = unquote(blockquoteAfter(sectionBetween(appD, /^### D\.5 /m, /^### D\.6 /m), 'One sentence added'));

  const s614 = sectionBetween(md, /^### 6\.14 /m, /^### 6\.15 /m);
  const v2Items = {};
  for (const m of s614.matchAll(/`(v2_(?:resp|cause|oblig)_(?:company|sylva|user))`: "([^"]+)"/g)) v2Items[m[1]] = m[2];
  const vignette2_614 = blockquoteAfter(s614, 'Shown after the open-ended');
  const s64 = sectionBetween(md, /^### 6\.4 /m, /^### 6\.5 /m);
  const mcNew = {};
  for (const m of s64.matchAll(/`(mc_e_energetic|mc_length)` "([^"]+)"/g)) mcNew[m[1]] = m[2];
  const s42 = sectionBetween(md, /^### 4\.2 /m, /^### 4\.3 /m);
  const priorSylvaQ = (/"(Before today, had you taken part[^"]+)"/.exec(s42) || [])[1] || null;

  return {
    base, blocks, opener, prompts, appendixA, appendixAFullHighAHighE, scripts,
    d2, iosInstruction, sliderQuestion, sliderEnds, vignette2, vignette2_614, v2Severity, d5, v2Items, mcNew, priorSylvaQ,
  };
}

// Script-typing delay formula is NOT given by the prereg ([CONFIRM] in the changelog); the build's
// constants are read at run time from the page and reported, not asserted against the spec.

// Study 2 output columns, derived from the Study 2 code (read-only). Returns
// { always: [...], conditional: {name: reason}, dynamicPrefixes: [...] }.
export function study2ColumnsFromCode(s2Path) {
  const src = fs.readFileSync(s2Path, 'utf8');
  const cols = new Set();
  for (const m of src.matchAll(/rec\('([a-z0-9_]+)'\s*,/g)) cols.add(m[1]);
  for (const m of src.matchAll(/ST\.r\.([a-z0-9_]+)\s*=/g)) cols.add(m[1]);
  for (const m of src.matchAll(/flat\.([a-z0-9_]+)\s*=/g)) cols.add(m[1]);
  for (const m of src.matchAll(/\{id:'([a-z0-9_]+)',text:/g)) cols.add(m[1]);
  // SPR fields are built as rec(spr.id+'_rts') etc. for spr1/spr2; the sentence ids are not columns.
  for (const s of ['spr1', 'spr2']) { cols.delete(s); for (const suf of ['_rts', '_mean_rt', '_min_rt', '_understood']) cols.add(s + suf); }
  const dynamicPrefixes = [];
  for (const m of src.matchAll(/rec\('([a-z0-9_]+_)'\s*\+/g)) dynamicPrefixes.push(m[1]);
  for (const p of dynamicPrefixes) cols.delete(p);
  const conditional = {
    attn1_retry: 'only after a failed first attention check',
    attn1_retry_pass: 'only after a failed first attention check',
    idle_pause_count: 'only when the 45-s idle pause fires (ST.r.idle_pause_count)',
    atlas_detected: 'only for an automated-browser user agent (session ends)',
  };
  return { all: [...cols].sort(), conditional, dynamicPrefixes };
}

// Study 2 raw data: reads ONLY the first line (header) of each CSV and aggregates column names.
// The file is read in 128-byte chunks and reading stops at the first line break, so at most
// 127 bytes past the header are ever in memory (and are discarded unparsed). No file name and
// no value row is ever returned or printed.
function readHeaderLine(file) {
  const fd = fs.openSync(file, 'r');
  const chunk = Buffer.alloc(128);
  const parts = [];
  let pos = 0;
  try {
    for (;;) {
      const n = fs.readSync(fd, chunk, 0, chunk.length, pos);
      if (n <= 0) break;
      const nl = chunk.subarray(0, n).indexOf(0x0a);
      if (nl >= 0) { parts.push(Buffer.from(chunk.subarray(0, nl))); break; }
      parts.push(Buffer.from(chunk.subarray(0, n)));
      pos += n;
      if (pos > 1 << 20) break; // a header line longer than 1 MB is not a header
    }
  } finally { fs.closeSync(fd); chunk.fill(0); }
  return Buffer.concat(parts).toString('utf8').replace(/\r$/, '');
}

export function study2ColumnsFromRawHeaders(rawDir) {
  if (!rawDir || !fs.existsSync(rawDir)) return null;
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.csv'));
  const counts = new Map();
  for (const f of files) {
    const header = readHeaderLine(path.join(rawDir, f));
    const names = new Set([...header.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"')));
    for (const c of names) counts.set(c, (counts.get(c) || 0) + 1);
  }
  const always = [], sometimes = {};
  for (const [c, k] of counts) {
    if (/^(user_msg_|ai_msg_)\d+$/.test(c)) continue;
    if (k === files.length) always.push(c); else sometimes[c] = k;
  }
  return { nFiles: files.length, always: always.sort(), sometimes };
}

// Vignette-1 page texts from the Study 2 code (for a byte-level comparison with the DOM).
export function study2Vignette1(s2Path) {
  const src = fs.readFileSync(s2Path, 'utf8');
  const unesc = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\'/g, "'");
  const v = /function buildLiability\(\)\{[\s\S]*?<div class="sentence-display"><p>([\s\S]*?)<\/p><\/div>/.exec(src);
  const fn = /function buildLiability\(\)\{([\s\S]*?)\n\}/.exec(src);
  const items = {};
  if (fn) for (const m of fn[1].matchAll(/\{id:'(liab_\d+)',text:'((?:[^'\\]|\\.)*)'\}/g)) items[m[1]] = unesc(m[2]);
  return { vignette: v ? unesc(v[1]) : null, items };
}
