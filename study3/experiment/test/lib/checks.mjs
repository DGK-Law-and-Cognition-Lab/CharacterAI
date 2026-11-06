// Checks on the CSV record that the code uploaded (or downloaded, in local mode), against the
// run's requested assignment, the prereg (spec.mjs) and the Study 2 column list.
import { csvRecord } from './csv.mjs';
import { CELL_LEVELS, expectedPageSequence, sha256 } from './spec.mjs';
import { CHAT_MSGS, fieldOf } from './participant.mjs';
import { MOCK_SESSION_TOKEN } from './mocks.mjs';

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const REMOVED_BY_DESIGN = ['manipulated_trait', 'condition_level', 'held_constant_1', 'held_constant_2']; // C5, Change 21
const lf = (s) => String(s ?? '').replace(/\r\n/g, '\n');

export function checkFinalRecord(run, csvText, ctx) {
  const out = [];
  const ck = (name, pass, detail = '') => out.push({ name, pass: !!pass, detail: String(detail) });
  const { header, record: R, nRows, nValues, duplicates } = csvRecord(csvText);
  const spec = ctx.spec, cell = run.cell, lv = CELL_LEVELS[cell];
  const code = run.testId ? '1d_test' : '1d';
  ck('CSV: one header row and one record, no duplicate columns', nRows === 2 && nValues === header.length && duplicates.length === 0, `${nRows} rows, ${header.length} columns, ${nValues} values, duplicates ${duplicates.join(',') || 'none'}`);
  const has = (k) => Object.prototype.hasOwnProperty.call(R, k);

  // ---- assignment
  const asg = { cell, condition_label: cell, a_level: lv.a_level, e_level: lv.e_level, a_block: lv.a_block, e_block: lv.e_block, n_block: 'MOD_LOW_N', condition_id: String(lv.condition_id), order: run.order };
  const bad = Object.entries(asg).filter(([k, v]) => R[k] !== v).map(([k, v]) => `${k}=${R[k]} (want ${v})`);
  ck('assignment fields match the requested cell/order (cell, a_level, e_level, order, blocks, condition_id)', bad.length === 0, bad.join('; ') || `${cell} / ${run.order}`);
  const src = run.testId ? 'test' : 'worker';
  ck(`cb_source = order_source = '${src}', cb_slot = mock slot, cb_study_code = '${code}', cb_error empty, cb_reused false`,
    R.cb_source === src && R.order_source === src && R.cb_slot === String(run.slot) && R.cb_study_code === code && R.cb_error === '' && R.cb_reused === 'false',
    `cb_source=${R.cb_source} order_source=${R.order_source} cb_slot=${R.cb_slot} cb_study_code=${R.cb_study_code} cb_error=${JSON.stringify(R.cb_error)} cb_reused=${R.cb_reused}`);
  ck(`is_test_session = ${!!run.testId}`, R.is_test_session === String(!!run.testId), R.is_test_session);
  const wc = run.net.workerCalls;
  ck(`Worker called exactly once, GET /assign?study=${code}, after the SONA ID page was submitted`, wc.length === 1 && wc[0].study === code && wc[0].method === 'GET' && wc[0].t >= run.marks.sonaSubmit,
    `${wc.length} call(s); study=${wc[0] && wc[0].study}`);
  ck('cb_first_session_uuid = session_uuid; cb_fetch_ts ISO; cb_fetch_ms number', R.cb_first_session_uuid === R.session_uuid && ISO.test(R.cb_fetch_ts) && /^\d+$/.test(R.cb_fetch_ms || ''));

  // ---- system prompt (prereg §3.4 assembled here; Appendix A hashes)
  const sp = lf(R.system_prompt);
  const app = spec.appendixA[cell];
  ck('system_prompt = the cell prompt assembled from the prereg §3.4 verbatim blocks', sp === spec.prompts[cell], `length ${sp.length} vs ${spec.prompts[cell].length}`);
  ck('SHA-256(system_prompt) and length = prereg Appendix A', sha256(sp) === app.sha256 && sp.length === app.length, `${sha256(sp).slice(0, 12)}… vs ${app.sha256.slice(0, 12)}…, ${sp.length} vs ${app.length}`);
  ck('system_prompt_sha256 field = Appendix A hash; system_prompt_sha256_match = true', R.system_prompt_sha256 === app.sha256 && R.system_prompt_sha256_match === 'true', `${(R.system_prompt_sha256 || '').slice(0, 12)}… match=${R.system_prompt_sha256_match}`);
  if (cell === 'HighA_HighE') ck('system_prompt = Appendix A full HighA_HighE text', sp === spec.appendixAFullHighAHighE);
  ck('no out-of-character safety clause in the prompt (no "break character" exception, no crisis/988/therapist referral text)', !/988|crisis|step out of character|emergency services/i.test(sp));
  const sysAll = run.net.orCalls.every((c) => c.messages && c.messages[0] && c.messages[0].role === 'system' && c.messages[0].content === spec.prompts[cell]);
  ck('every OpenRouter request carries this system prompt (LF text)', run.net.orCalls.length > 0 && sysAll, `${run.net.orCalls.length} calls`);
  if (run.mode === 'pavlovia') {
    const crlf = (R.system_prompt.match(/\r\n/g) || []).length;
    run.notes.push(`multipart upload stores system_prompt with ${crlf} CRLF line breaks (${R.system_prompt.length} chars; ${sp.length} after CRLF->LF), as noted for C19`);
  }

  // ---- chat log: opener, scripted S0/S1
  let log = [];
  try { log = JSON.parse(R.chat_log); } catch (e) { ck('chat_log is valid JSON', false, e.message); }
  const S0 = spec.scripts[cell].S0, S1 = spec.scripts[cell].S1;
  const e0 = log[0] || {}, e1 = log[1] || {}, e2 = log[2] || {}, e3 = log[3] || {};
  ck('chat_log[0] = opener {role:user_scripted, round 0}', e0.role === 'user_scripted' && e0.content === spec.opener && e0.round === 0);
  const meta = ['usage', 'gen_id', 'finish_reason', 'provider', 'model_served', 'latency_ms'];
  ck('chat_log[1] = S0 {assistant, scripted, S0, round 0, ts, elapsed, delay_ms}, no API metadata', e1.role === 'assistant' && e1.scripted === true && e1.script_slot === 'S0' && e1.round === 0 && e1.content === S0 && ISO.test(e1.ts || '') && typeof e1.elapsed === 'number' && typeof e1.delay_ms === 'number' && meta.every((k) => !(k in e1)), JSON.stringify({ role: e1.role, slot: e1.script_slot, round: e1.round, delay_ms: e1.delay_ms }));
  ck('chat_log[2] = participant message 1 (round 1)', e2.role === 'user' && e2.round === 1 && e2.content === CHAT_MSGS[1]);
  ck('chat_log[3] = S1 {assistant, scripted, S1, round 1}, no API metadata', e3.role === 'assistant' && e3.scripted === true && e3.script_slot === 'S1' && e3.round === 1 && e3.content === S1 && meta.every((k) => !(k in e3)));
  const dm = run.live.scriptDelayConsts;
  const expDelay = (t) => Math.max(dm.min, Math.min(dm.max, dm.base + dm.per * t.length));
  ck('scripted delay_ms = the build formula for S0 and S1 (same formula all cells)', e1.delay_ms === expDelay(S0) && e3.delay_ms === expDelay(S1), `S0 ${e1.delay_ms} / S1 ${e3.delay_ms} ms`);
  const s1Gap = Date.parse(e3.ts) - Date.parse(e2.ts);
  ck('S1 shown after its typing delay (chat_log ts of S1 minus ts of message 1 >= delay_ms)', s1Gap >= e3.delay_ms - 50 && s1Gap <= e3.delay_ms + 1500, `S1 shown ${s1Gap} ms after message 1; delay_ms ${e3.delay_ms}`);
  ck('S0 and S1 = prereg Appendix D.1 text; ai_msg_0 = S0, ai_msg_1 = S1; chat_opener = §3.4 opener', R.ai_msg_0 === S0 && R.ai_msg_1 === S1 && R.chat_opener === spec.opener);
  ck('script_sha256 = SHA-256(S0 + "\\n" + S1) of the Appendix D.1 texts; script_sha256_match = true', R.script_sha256 === sha256(S0 + '\n' + S1) && R.script_sha256_match === 'true', `${(R.script_sha256 || '').slice(0, 12)}…`);
  ck('script_version recorded', !!R.script_version, R.script_version);
  const t = run.live.chat.tally;
  const okCalls = run.net.orCalls.filter((c) => c.status === 200);
  ck('no API call for S0/S1: OpenRouter calls = participant sends - 1', run.net.orCalls.length === t.sends - 1, `${run.net.orCalls.length} calls for ${t.sends} sends`);

  // ---- model replies and per-reply metadata (C7)
  const replies = log.filter((e) => e.role === 'assistant' && !e.scripted);
  const metaOk = replies.length === okCalls.length && replies.every((e, i) => e.content === okCalls[i].reply && e.gen_id === okCalls[i].gen_id && e.finish_reason === 'stop' && e.native_finish_reason === 'stop' && e.provider === 'HarnessMockProvider' && e.model_served === 'meta-llama/llama-3.3-70b-instruct' && typeof e.latency_ms === 'number' && e.usage && typeof e.usage.completion_tokens === 'number');
  ck('model replies in chat_log = mocked replies, with usage, finish_reason, provider, model_served, gen_id, latency_ms', metaOk, `${replies.length} replies / ${okCalls.length} mocked`);
  const users = log.filter((e) => e.role === 'user');
  const msgOk = users.every((e) => R['user_msg_' + e.round] === e.content) && replies.every((e) => R['ai_msg_' + e.round] === e.content) && users.every((e) => CHAT_MSGS.includes(e.content));
  ck('user_msg_N / ai_msg_N fields match chat_log (synthetic messages only)', msgOk, `${users.length} user messages`);
  const errs = log.filter((e) => e.role === 'system_error');
  ck('counters: chat_total_rounds, chat_llm_rounds, chat_send_attempts, chat_api_error_count', R.chat_total_rounds === String(t.ok) && R.chat_llm_rounds === String(t.llm) && R.chat_send_attempts === String(t.sends) && R.chat_api_error_count === String(t.errors) && errs.length === t.errors,
    `total ${R.chat_total_rounds}/${t.ok}, llm ${R.chat_llm_rounds}/${t.llm}, sends ${R.chat_send_attempts}/${t.sends}, errors ${R.chat_api_error_count}/${t.errors}`);
  ck('chat_min_message_threshold_met = (successful exchanges >= 8)', R.chat_min_message_threshold_met === String(t.ok >= 8), R.chat_min_message_threshold_met);
  const nLate = run.live.chat.lateReply ? 1 : 0;
  const lateLog = log.filter((e) => e.role === 'assistant' && e.after_end);
  ck(`chat_after_end_replies = ${nLate}; chat_duration_seconds = 600; chat_start/end ISO`, R.chat_after_end_replies === String(nLate) && lateLog.length === nLate && R.chat_duration_seconds === '600' && ISO.test(R.chat_start_time) && ISO.test(R.chat_end_time), `chat_after_end_replies=${R.chat_after_end_replies}`);
  ck('[FIX-8] chat_timeout_time = timer at zero; chat_end_time = probe 3 answered (>= chat_timeout_time, so chat_end_time - chat_start_time includes all probe time, §6.9)',
    ISO.test(R.chat_timeout_time || '') && Date.parse(R.chat_end_time) >= Date.parse(R.chat_timeout_time) && Date.parse(R.chat_end_time) - Date.parse(R.chat_timeout_time) >= 0,
    `timeout ${R.chat_timeout_time} end ${R.chat_end_time}`);
  if (nLate) ck('late reply saved in the final record: chat_log entry after_end=true, displayed=true, with usage/finish_reason; ai_msg_<round> holds it; chat_timeout_time precedes it (C11, FIX-8)',
    lateLog[0].displayed === true && !!lateLog[0].usage && lateLog[0].finish_reason === 'stop' && R['ai_msg_' + lateLog[0].round] === lateLog[0].content && Date.parse(lateLog[0].ts) > Date.parse(R.chat_timeout_time), `round ${lateLog[0].round}`);
  if (t.errors) ck('system_error entries carry error_type, http_status, round, elapsed, ts', errs.every((e) => e.error_type && e.http_status === 500 && typeof e.round === 'number' && typeof e.elapsed === 'number' && ISO.test(e.ts)));

  // ---- probes
  for (const k of [1, 2, 3]) {
    ck(`ios_t${k} present = answered value ${run.probeValues[k]}`, R['ios_t' + k] === String(run.probeValues[k]), R['ios_t' + k]);
    ck(`ios_t${k}_shown_ts / _rt_ms / _elapsed / _round present`, ISO.test(R[`ios_t${k}_shown_ts`] || '') && +R[`ios_t${k}_rt_ms`] > 0 && /^\d+$/.test(R[`ios_t${k}_elapsed`] || '') && /^\d+$/.test(R[`ios_t${k}_round`] || ''),
      `rt ${R[`ios_t${k}_rt_ms`]} ms, elapsed ${R[`ios_t${k}_elapsed`]}, round ${R[`ios_t${k}_round`]}`);
  }
  ck('ios_t1_round = 1; ios_t2_elapsed >= 300; ios_t2_round = sends at trigger; ios_t3_elapsed = 600; ios_t3_round = all sends',
    R.ios_t1_round === '1' && +R.ios_t2_elapsed >= 300 && R.ios_t2_round === String(run.probe2Sends) && R.ios_t3_elapsed === '600' && R.ios_t3_round === String(t.sends),
    `t1 round ${R.ios_t1_round}; t2 elapsed ${R.ios_t2_elapsed}, round ${R.ios_t2_round}; t3 elapsed ${R.ios_t3_elapsed}, round ${R.ios_t3_round}`);
  ck("ios_t2_status = 'answered'; probe_format = 'ios'", R.ios_t2_status === 'answered' && R.probe_format === 'ios', `${R.ios_t2_status}, ${R.probe_format}`);
  const openSum = [1, 2, 3].reduce((a, k) => a + +R[`ios_t${k}_rt_ms`], 0) / 1000;
  ck('chat_probe_seconds = sum of the three probe open times (0.1-s steps)', Math.abs(+R.chat_probe_seconds - openSum) <= 0.15 && +R.chat_probe_seconds >= 5, `chat_probe_seconds ${R.chat_probe_seconds}, sum of rt ${openSum.toFixed(2)}`);

  // ---- vignette 2
  const v2ids = [...Object.keys(spec.v2Items), 'v2_severity'];
  const v2bad = v2ids.filter((id) => R[id] !== run.answers[id]);
  ck('all nine v2_* items + v2_severity present with the answered values', v2bad.length === 0, v2bad.length ? 'missing/wrong: ' + v2bad.join(',') : v2ids.map((id) => R[id]).join(''));
  const ord = (R.v2_item_order || '').split(';');
  ck('v2_item_order = presented order (10 ids, permutation, = DOM order)', ord.length === 10 && new Set(ord).size === 10 && v2ids.every((id) => ord.includes(id)) && JSON.stringify(ord) === JSON.stringify(run.live.v2DomOrder), R.v2_item_order);
  ck('v2_page_ms >= 10000; v2_items_page_ms > 0', +R.v2_page_ms >= 10000 && +R.v2_items_page_ms > 0, `${R.v2_page_ms} / ${R.v2_items_page_ms}`);
  ck("v2_version = 'D4'; v2_severity_included = true", R.v2_version === 'D4' && R.v2_severity_included === 'true');

  // ---- vignette 1
  const liab = Array.from({ length: 12 }, (_, i) => 'liab_' + (i + 1));
  const lbad = liab.filter((id) => !has(id) || R[id] !== run.answers[id]);
  ck('vignette 1: liab_1..liab_12 present with the answered values', lbad.length === 0, lbad.join(',') || liab.map((id) => R[id]).join(''));

  // ---- page sequence
  const expSeq = expectedPageSequence(run.order, { attnFail: run.attnFail });
  const seq = (R.page_sequence || '').split(';');
  ck(`page_sequence = prereg §3.6 order for ${run.order} (${expSeq.length} pages)`, JSON.stringify(seq) === JSON.stringify(expSeq), firstDiff(seq, expSeq));
  ck('pages actually walked = page_sequence', JSON.stringify(run.live.pidSeq) === JSON.stringify(seq), firstDiff(run.live.pidSeq, seq));

  // ---- recorded answers = what the synthetic participant entered
  const mism = [];
  for (const [name, v] of Object.entries(run.answers)) {
    if (name.startsWith('chat_msg_') || name.startsWith('ios_t')) continue;
    const col = fieldOf(name);
    if (name === 'consent' || name === 'attn1') { if (R[col] !== v) mism.push(`${col}=${R[col]} (entered ${v})`); continue; }
    const want = Array.isArray(v) ? v.join(';') : String(v);
    if (R[col] !== want) mism.push(`${col}=${JSON.stringify(R[col])} (entered ${JSON.stringify(want)})`);
  }
  ck('every response entered is recorded unchanged (radios, checkboxes, text, age 20)', mism.length === 0, mism.slice(0, 6).join('; ') || `${Object.keys(run.answers).length} fields`);

  // ---- Study 2 columns
  const s2 = ctx.s2cols;
  const condOk = (c) => (c === 'attn1_retry' || c === 'attn1_retry_pass') ? !run.attnFail : !!s2.conditional[c];
  const missing = s2.all.filter((c) => !has(c) && !REMOVED_BY_DESIGN.includes(c));
  const missingUnexpected = missing.filter((c) => !condOk(c));
  ck(`no Study 2 column missing (${s2.all.length} columns from the Study 2 code; ${REMOVED_BY_DESIGN.length} removed by design, C5)`, missingUnexpected.length === 0,
    missingUnexpected.length ? 'MISSING: ' + missingUnexpected.join(',') : `conditional and absent in this run: ${missing.join(',') || 'none'}`);
  ck('columns removed by design (C5) are absent: ' + REMOVED_BY_DESIGN.join(', '), REMOVED_BY_DESIGN.every((c) => !has(c)));
  if (ctx.s2raw) {
    const m2 = ctx.s2raw.always.filter((c) => !has(c) && !REMOVED_BY_DESIGN.includes(c));
    ck(`no column present in every Study 2 raw file is missing (${ctx.s2raw.always.length} header columns, ${ctx.s2raw.nFiles} files; headers only)`, m2.length === 0, m2.join(',') || 'all present');
  }
  if (run.attnFail) ck('failed-attention path recorded: attn1_pass=false, attn1_retry=3, attn1_retry_pass=true', R.attn1_pass === 'false' && R.attn1_retry === '3' && R.attn1_retry_pass === 'true');

  // ---- other Study 3 fields
  const other = {
    study_id: '3', study_mode: '1d', completed: 'true', model: 'meta-llama/llama-3.3-70b-instruct', temperature: '0.7', max_tokens: '400',
    api_endpoint: 'https://openrouter.ai/api/v1/chat/completions', mc_e_items_included: 'true', prior_sylva_included: 'true', prior_sylva: 'No',
    device_type: run.mobile ? 'mobile' : 'desktop', screen_width: String(run.screen.w), d_age: '20', captcha_pass: 'true', comprehension_correct: 'true',
    sona_id: run.pid, pid_url: run.pidViaUrl ? run.pid : '', pid_mismatch: 'false', reload_count: '0', fullscreen_entered: 'yes',
  };
  const ob = Object.entries(other).filter(([k, v]) => R[k] !== v).map(([k, v]) => `${k}=${JSON.stringify(R[k])} (want ${v})`);
  ck('Study 3 instrumentation fields (study_id, completed, settings, design switches, device, pid fields)', ob.length === 0, ob.join('; '));
  ck('session_uuid (v4), consent_ts, start_time, end_time ISO; experiment_version set; total_duration_ms > 0',
    UUID.test(R.session_uuid || '') && ISO.test(R.consent_ts || '') && ISO.test(R.start_time || '') && ISO.test(R.end_time || '') && /^study3-/.test(R.experiment_version || '') && +R.total_duration_ms > 0, R.experiment_version);
  ck('mc_e_energetic and mc_length recorded', /^[1-5]$/.test(R.mc_e_energetic || '') && /^[1-5]$/.test(R.mc_length || ''));
  let pts = null; try { pts = JSON.parse(R.page_timestamps); } catch { /* */ }
  ck('page_timestamps is JSON (Study 2 field)', Array.isArray(pts) && pts.length >= seq.length);
  ck('no checkpoint fields in the final record', !has('checkpoint_stage') && !has('checkpoint_ts'));
  ck('the CSV holds no API key or credit token', ctx.secretCount(csvText) === 0);

  // ---- in-page builder vs. stored CSV
  if (run.events.finalInPage) ck(`stored CSV = in-page builder output${run.mode === 'pavlovia' ? ' (after the multipart CRLF normalization)' : ''}`, lf(csvText) === lf(run.events.finalInPage));
  else ck('in-page builder output captured', false, 'no capture');

  // ---- checkpoints (C12)
  const cps = run.events.checkpoints;
  const safe = String(run.pid).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  // Before the SONA ID is known (no URL ID and the SONA ID page not yet submitted) the key has an
  // empty ID part; afterwards it carries the sanitized SONA ID.
  const keyRe = (p) => new RegExp(`^data/char-ai-study_${p}_SESSION_\\d{4}-\\d{2}-\\d{2}_\\d{2}h\\d{2}\\.\\d{2}\\.\\d{1,3}_PARTIAL\\.csv$`);
  const keyOk = (c) => keyRe(safe).test(c.key || '') || (!run.pidViaUrl && c.t <= run.marks.sonaSubmit && keyRe('nopid-[0-9a-f-]{36}').test(c.key || ''));
  const stages = cps.map((c) => c.stage);
  const renders = stages.filter((s) => /^render_\d+$/.test(s)).length;
  const noPid = cps.filter((c) => keyRe('nopid-[0-9a-f-]{36}').test(c.key || '')).length;
  const consentPos = seq.indexOf('consent');
  const staged = cps.filter((c) => !!c.key);
  ck('[FIX-6] nothing is staged before consent: the first staged checkpoint is the consent checkpoint',
    staged.length > 0 && staged[0].stage === 'consent', `first staged stage: ${staged[0] && staged[0].stage}; consent page at position ${consentPos}`);
  ck('partial checkpoint keys produced (…_PARTIAL.csv) at consent, every later page render, every model reply, chat end and each probe',
    staged.length > 0 && staged.every(keyOk) && ['consent', 'chat_end', 'probe_1', 'probe_2', 'probe_3'].every((s) => stages.includes(s)) && stages.some((s) => /^chat_turn_\d+$/.test(s)) && consentPos >= 0 && renders >= seq.length - consentPos - 2,
    `${staged.length} staged checkpoints, ${renders} render_* stages (pages shown ${seq.length}, consent at ${consentPos})${noPid ? `, ${noPid} before the SONA ID was entered ('nopid-<session_uuid>' in the key)` : ''}; e.g. key ${staged[staged.length - 1] ? staged[staged.length - 1].key.replace(safe, '<pid>') : 'none'}`);
  const cpc = cps.find((c) => c.stage === 'consent' && c.csv);
  if (cpc) {
    const r = csvRecord(cpc.csv).record;
    ck("staged partial record at consent: completed=false, checkpoint_stage='consent'", r.completed === 'false' && r.checkpoint_stage === 'consent' && ISO.test(r.checkpoint_ts || ''));
    ck('[FIX-6] consent partial record holds nothing typed on pre-consent pages beyond the Study 2 fields recorded there (slim record flag set)', r.partial_slim === 'true');
  }
  const cpe = cps.find((c) => c.stage === 'chat_end' && c.csv);
  if (cpe) {
    const r = csvRecord(cpe.csv).record;
    ck('staged partial record at chat end holds chat_log and ios_t1/ios_t2', !!r.chat_log && !!r.ios_t1 && !!r.ios_t2 && r.completed === 'false');
    ck('[FIX-6] slim partial record: no user_msg_/ai_msg_ duplicates, no system_prompt text (hash kept), partial_slim=true',
      !Object.keys(r).some((k) => /^(user_msg_|ai_msg_)/.test(k)) && !('system_prompt' in r) && !!r.system_prompt_sha256 && r.partial_slim === 'true');
    ck('[FIX-5] staged partial record is far below the 64 KiB beacon limit', Buffer.byteLength(cpe.csv, 'utf8') < 60000, `${Buffer.byteLength(cpe.csv, 'utf8')} bytes`);
  }

  // ---- upload / download path and SONA redirect
  const pav = run.net.pavlovia;
  if (run.mode === 'pavlovia') {
    const opens = pav.filter((e) => e.kind === 'open'), res = pav.filter((e) => e.kind === 'results'), closes = pav.filter((e) => e.kind === 'close'), beacons = pav.filter((e) => e.resourceType === 'Ping');
    const finalKeyRe = new RegExp(`^data/char-ai-study_${safe}_SESSION_\\d{4}-\\d{2}-\\d{2}_\\d{2}h\\d{2}\\.\\d{2}\\.\\d{1,3}\\.csv$`);
    ck('Pavlovia (mock): session opened once at load, one results upload with the final key, session closed with isCompleted=true',
      opens.length === 1 && res.length === 1 && finalKeyRe.test(res[0].form && res[0].form.key || '') && closes.length === 1 && closes[0].form && closes[0].form.isCompleted === 'true' && closes[0].path.endsWith(MOCK_SESSION_TOKEN),
      `open ${opens.length}, results ${res.length} (${res[0] && res[0].form && res[0].form.key.replace(safe, '<pid>')}), close ${closes.length}`);
    ck('no partial beacon sent for a completed session', beacons.length === 0, `${beacons.length} beacon(s)`);
    const sona = run.net.sona;
    ck('SONA redirect after the upload: experiment_id, survey_code = SONA ID, credit token present and = the code constant (value not shown)',
      sona.length === 1 && sona[0].resourceType === 'Document' && sona[0].experiment_id === '3286' && sona[0].survey_code === run.pid && sona[0].tokenPresent && sona[0].tokenMatchesCode && res[0] && sona[0].t > res[0].t,
      sona[0] ? `experiment_id=${sona[0].experiment_id}, survey_code ok=${sona[0].survey_code === run.pid}, token present=${sona[0].tokenPresent}, matches=${sona[0].tokenMatchesCode}` : 'no redirect');
  } else {
    ck('local mode (config.json projectId TODO, C17): no request to pavlovia.org', pav.length === 0, `${pav.length}`);
    ck('local mode: the CSV was downloaded by the browser', !!run.download && run.download.state === 'completed', run.download ? run.download.suggestedFilename.replace(run.pid, '<pid>') : 'no download');
    const sona = run.net.sona;
    ck('SONA redirect: experiment_id, survey_code = SONA ID, credit token present and = the code constant (value not shown)',
      sona.length === 1 && sona[0].resourceType === 'Document' && sona[0].experiment_id === '3286' && sona[0].survey_code === run.pid && sona[0].tokenPresent && sona[0].tokenMatchesCode, sona[0] ? `experiment_id=${sona[0].experiment_id}, token present=${sona[0].tokenPresent}, matches=${sona[0].tokenMatchesCode}` : 'no redirect');
  }
  return { checks: out, record: R, header };
}

export function checkAbandon(run, ctx) {
  const out = [];
  const ck = (name, pass, detail = '') => out.push({ name, pass: !!pass, detail: String(detail) });
  const pav = run.net.pavlovia;
  const safe = String(run.pid).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const res = pav.filter((e) => e.kind === 'results');
  const beacon = res.find((e) => e.resourceType === 'Ping');
  const close = pav.find((e) => e.kind === 'close-beacon');
  ck('leaving mid-chat sends exactly one results beacon with a …_PARTIAL.csv key', res.length === 1 && !!beacon && new RegExp(`^data/char-ai-study_${safe}_SESSION_.*_PARTIAL\\.csv$`).test(beacon.form && beacon.form.key || ''), `${res.length} results request(s)`);
  ck('…and a close beacon with isCompleted=false', !!close && close.form && close.form.isCompleted === 'false');
  let R = {};
  if (beacon && beacon.form) {
    R = csvRecord(beacon.form.value).record;
    ck('partial record: completed=false, checkpoint_stage and checkpoint_ts set', R.completed === 'false' && !!R.checkpoint_stage && !!R.checkpoint_ts, `stage ${R.checkpoint_stage}`);
    let log = []; try { log = JSON.parse(R.chat_log || '[]'); } catch { /* */ }
    const last = run.events.checkpoints[run.events.checkpoints.length - 1];
    ck('the exit beacon sends the last staged checkpoint (same key and stage) — prereg §6.12', !!last && beacon.form.key === last.key && R.checkpoint_stage === last.stage, `last checkpoint stage ${last && last.stage}; beacon stage ${R.checkpoint_stage}`);
    ck('partial record holds the chat up to that checkpoint (opener, S0, message 1, S1) and ios_t1', log.length >= 4 && log[1].script_slot === 'S0' && log[3].script_slot === 'S1' && !!R.ios_t1, `${log.length} chat_log entries; ios_t1=${R.ios_t1}`);
    const sent = run.answers.chat_msg_2;
    ck('[FIX-7] the exit beacon carries the chat up to the last model reply (message 2 and its reply, chat_turn checkpoint)', !!sent && log.some((e) => e.content === sent) && /^chat_turn_\d+$/.test(R.checkpoint_stage || ''), `stage ${R.checkpoint_stage}`);
    if (sent && !log.some((e) => e.content === sent)) run.notes.push(`exit beacon: the record is the checkpoint staged at '${R.checkpoint_stage}'; message 2 and its reply, sent after that checkpoint, are not in it (sendPartial() does not rebuild the record at pagehide; no checkpoint is taken on chat turns). Consistent with prereg §6.12 (checkpoints at consent, page renders, chat end), but a mid-chat dropout loses the turns after the last probe.`);
    ck('partial record: cell/order = requested', R.cell === run.cell && R.order === run.order);
    ck('partial record holds no API key or credit token', ctx.secretCount(beacon.form.value) === 0);
  }
  ck('Worker called once; no SONA redirect', run.net.workerCalls.length === 1 && run.net.sona.length === 0);
  return { checks: out, record: R, csv: beacon && beacon.form ? beacon.form.value : null };
}

function firstDiff(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return `first difference at position ${i + 1}: got '${a[i]}', expected '${b[i]}' (lengths ${a.length}/${b.length})`;
  return `${a.length} pages`;
}

// Extra scenarios: condition assignment after the SONA ID page (C3, C4; readiness 2.10, 2.13).
// `first` / `second` are in-page snapshots {r: ST.r, stored: sessionStorage assignment}.
export function checkAssign(run, first, second, ctx) {
  const out = [];
  const ck = (name, pass, detail = '') => out.push({ name, pass: !!pass, detail: String(detail) });
  const spec = ctx.spec;
  const R = first.r;
  const code = run.testId ? '1d_test' : '1d';
  const lv = CELL_LEVELS[R.cell];
  ck('assigned cell is one of the four cells and the cell fields are consistent', !!lv && R.a_level === lv.a_level && R.e_level === lv.e_level && R.a_block === lv.a_block && R.e_block === lv.e_block && R.n_block === 'MOD_LOW_N' && String(R.condition_id) === String(lv.condition_id), `${R.cell} / ${R.order}`);
  ck('order is impression_first or bonding_first', ['impression_first', 'bonding_first'].includes(R.order), R.order);
  ck('system prompt of the assigned cell = prereg §3.4 / Appendix A hash; script hash matches', !!lv && R.system_prompt === spec.prompts[R.cell] && R.system_prompt_sha256 === spec.appendixA[R.cell].sha256 && R.system_prompt_sha256_match === true && R.script_sha256_match === true);
  let st = null; try { st = JSON.parse(first.stored); } catch { /* */ }
  ck(`assignment stored in sessionStorage under cb_assignment_${code}_<SONA ID> (reload protection)`, !!st && st.study === code && st.cell === R.cell && st.order === R.order, st ? `${st.study} ${st.cell} ${st.order}` : 'none');
  const wc = run.net.workerCalls;
  ck(`[FIX-13] Worker request carries a req id that is recorded as cb_req_id`, !!R.cb_req_id && wc.length >= 1 && wc[0].req === R.cb_req_id, `req ${wc[0] && wc[0].req ? 'present' : 'missing'}`);
  ck(`Worker called exactly once with study=${code}`, wc.length === 1 && wc[0].study === code, `${wc.length} call(s)`);
  ck(`is_test_session = ${!!run.testId}`, R.is_test_session === !!run.testId);
  if (run.workerMode === 'mismatch') {
    ck("rejected Worker response (study mismatch) -> uniform fallback: cb_source = order_source = 'fallback_random', cb_slot = '' (NA, FIX-12), cb_error names the mismatch",
      R.cb_source === 'fallback_random' && R.order_source === 'fallback_random' && R.cb_slot === '' && /Study mismatch/.test(R.cb_error || ''), `cb_source=${R.cb_source} order_source=${R.order_source} cb_slot=${R.cb_slot} cb_error=${JSON.stringify(R.cb_error)}`);
  } else if (run.workerMode === 'http500') {
    ck("TEST session, Worker HTTP 500 -> cb_source = order_source = 'test' (never 'fallback_random'), cb_slot = '' (NA, FIX-12), cb_error = 'HTTP 500', cb_study_code = '1d_test'",
      R.cb_source === 'test' && R.order_source === 'test' && R.cb_slot === '' && R.cb_error === 'HTTP 500' && R.cb_study_code === '1d_test', `cb_source=${R.cb_source} order_source=${R.order_source} cb_error=${JSON.stringify(R.cb_error)}`);
  } else if (run.workerMode === 'timeout') {
    ck("Worker silent for 10 s -> request aborted (AbortController, COUNTERBALANCE_TIMEOUT_MS) and uniform fallback: cb_source = order_source = 'fallback_random', cb_slot = '' (NA, FIX-12), cb_error set, cb_fetch_ms about 10000",
      R.cb_source === 'fallback_random' && R.order_source === 'fallback_random' && R.cb_slot === '' && !!R.cb_error && R.cb_fetch_ms >= 9900 && R.cb_fetch_ms < 12000,
      `cb_source=${R.cb_source} order_source=${R.order_source} cb_error=${JSON.stringify(R.cb_error)} cb_fetch_ms=${R.cb_fetch_ms}`);
  } else if (run.workerMode === 'no_order') {
    ck("Worker response without `order` -> cell from the Worker, order drawn by the client (order_source = 'client')",
      R.cb_source === 'worker' && R.order_source === 'client' && R.cell === run.cell && R.cb_slot === run.slot && R.cb_error === '', `cell=${R.cell} cb_source=${R.cb_source} order_source=${R.order_source}`);
  } else {
    ck("Worker response accepted: cell/order as returned, cb_source = order_source = 'worker'", R.cell === run.cell && R.order === run.order && R.cb_source === 'worker' && R.order_source === 'worker' && R.cb_reused === false && R.reload_count === 0);
  }
  if (second) {
    const S = second.r;
    ck('after a reload in the same tab: the Worker is NOT called again (no second slot)', wc.length === 1, `${wc.length} call(s) in total`);
    ck('after a reload: same cell and order, cb_reused = true, reload_count = 1, same slot',
      S.cell === R.cell && S.order === R.order && S.cb_reused === true && S.reload_count === 1 && S.cb_slot === R.cb_slot, `cell ${S.cell}, order ${S.order}, cb_reused ${S.cb_reused}, reload_count ${S.reload_count}`);
    ck('after a reload: new session_uuid; cb_first_session_uuid = the first session_uuid', S.session_uuid !== R.session_uuid && S.cb_first_session_uuid === R.session_uuid);
  }
  return out;
}

// Extra scenario: no Sylva reply displayed at >= 300 s active, so probe 2 is not shown (prereg
// §6.13). `snap` = in-page snapshot after the chat page {r: ST.r, probeShown2, pid}.
export function checkNoProbe2(run, snap, ctx) {
  const out = [];
  const ck = (name, pass, detail = '') => out.push({ name, pass: !!pass, detail: String(detail) });
  const R = snap.r;
  ck("no reply displayed at >= 300 s active: probe 2 not shown, ios_t2_status = 'not_triggered' (§6.13)", R.ios_t2_status === 'not_triggered' && snap.probeShown2 === false, `ios_t2_status=${R.ios_t2_status}`);
  const t2 = ['ios_t2', 'ios_t2_shown_ts', 'ios_t2_rt_ms', 'ios_t2_elapsed', 'ios_t2_round'].filter((k) => k in R);
  ck('no ios_t2 response or timing fields recorded', t2.length === 0, t2.join(',') || 'none');
  ck('ios_t1 and ios_t3 recorded with the answers; ios_t1_round = 1; ios_t3_elapsed = 600', String(R.ios_t1) === String(run.probeValues[1]) && String(R.ios_t3) === String(run.probeValues[3]) && R.ios_t1_round === 1 && R.ios_t3_elapsed === 600, `ios_t1=${R.ios_t1} ios_t3=${R.ios_t3}`);
  const cpe = run.events.checkpoints.find((c) => c.stage === 'chat_end' && c.csv);
  const r = cpe ? csvRecord(cpe.csv).record : {};
  ck("chat_end checkpoint record: ios_t2_status = 'not_triggered', ios_t1 present, no ios_t2, completed = false", r.ios_t2_status === 'not_triggered' && !!r.ios_t1 && !('ios_t2' in r) && r.completed === 'false', cpe ? `stage ${r.checkpoint_stage}` : 'no chat_end checkpoint captured');
  const cp3 = run.events.checkpoints.find((c) => c.stage === 'probe_3' && c.csv);
  const r3 = cp3 ? csvRecord(cp3.csv).record : {};
  ck("probe_3 checkpoint record: ios_t3 = answer, ios_t2_status still 'not_triggered'", r3.ios_t3 === String(run.probeValues[3]) && r3.ios_t2_status === 'not_triggered');
  ck('one OpenRouter call (message 2 only); next page after the chat is the comprehension check', run.net.orCalls.length === 1 && snap.pid === 'comprehension', `${run.net.orCalls.length} call(s); page ${snap.pid}`);
  ck('the record holds no API key or credit token', ctx.secretCount(JSON.stringify(R)) === 0 && (!cpe || ctx.secretCount(cpe.csv) === 0));
  return out;
}
