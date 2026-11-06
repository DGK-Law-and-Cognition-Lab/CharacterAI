// Synthetic participant: walks the REAL experiment page by page with CDP input events (mouse
// clicks, or touch taps in the mobile run; key presses; inserted text), and records what it saw
// and answered for the checks. The only harness-side changes to page state are (a) the chat
// countdown CS.secs, set with Runtime.evaluate to compress the 10-minute chat, and (b) CS.idleMs,
// lowered for 2.6 s while probe 1 is open to show that the idle timer is paused too. Nothing in
// experiment.js is modified.
import { sleep } from './cdp.mjs';

// Radio / checkbox / text field name -> CSV column (Study 2 rec() calls)
const FIELD = {
  devicecheck: 'device_self_report', spr1_comp: 'spr1_understood', spr2_comp: 'spr2_understood', attn1r: 'attn1_retry',
  comp_name: 'comprehension_name', d_edu: 'd_education', d_legal: 'd_legal_knowledge', d_speech1: 'd_free_speech_1',
  d_speech2: 'd_free_speech_2', d_chatbot_exp: 'd_chatbot_experience', d_social: 'd_social_media', d_religious: 'd_religiosity',
  d_distract: 'd_distractions', d_english: 'd_english_proficiency', d_ai_study: 'd_ai_used_in_study',
  d_chatbot_use: 'd_chatbot_use_cases', oe1: 'oe_experience', oe2: 'oe_person_or_tool', oe3: 'oe_responsibility',
  oe4: 'oe_compensation', d_lang: 'd_native_language', d_final: 'd_final_thoughts', sonaId: 'sona_id', dateConsent: 'date_of_consent',
};
export const fieldOf = (name) => FIELD[name] || name;

const TEXT = {
  oe1: 'Synthetic harness answer one: the chat was an automated test run with neutral placeholder messages and no real participant.',
  oe2: 'Synthetic harness answer two: this field only checks that free text of a realistic length is saved by the experiment code.',
  oe3: 'Synthetic harness answer three: placeholder text written by the end-to-end test, used to check recording of the open-ended item.',
  oe4: 'Synthetic harness answer four: placeholder text written by the end-to-end test, used to check recording of the open-ended item.',
  d_problems: 'No problems. Synthetic harness entry.',
  d_lang: 'English', d_country: 'United States', d_occupation: 'Student', d_religion: 'None', d_final: 'NA',
};

// Synthetic chat messages (never taken from Study 1-2 data).
export const CHAT_MSGS = [
  null,
  'Hi Sylva, I am a synthetic test participant walking along the forest path today.',
  'This is synthetic message two. I like hearing about the old trees and the crystal ridge.',
  'Synthetic message three: my week was fairly ordinary, with classes and some reading.',
  'Synthetic message four. What do you usually eat while you travel?',
  'Synthetic message five: the weather here has been mild and a little cloudy.',
  'Synthetic message six. Do you ever rest for a whole day in one place?',
  'Synthetic message seven: I think I will go for a walk later this evening.',
  'Synthetic message eight. Thank you for talking with me in this test.',
  'Synthetic message nine: one more short line to finish the test conversation.',
];

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Participant {
  constructor({ cdp, sid, run, spec, s2v1, shots }) {
    Object.assign(this, { cdp, sid, run, spec, s2v1, shots });
    this.rand = rng(run.seed);
    run.answers = {};
    run.live = { pidSeq: [], timers: {}, pause: {}, probeOpenMs: {}, dom: {}, chat: {}, notes: [] };
    run.marks = { msgSent: {} };
    this.workerBase = run.net ? run.net.workerCalls.length : 0;
  }

  // ---------------------------------------------------------------- primitives
  async ev(expr) {
    const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, this.sid);
    if (r.exceptionDetails) throw new Error('evaluate failed: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).split('\n')[0]);
    return r.result.value;
  }

  async waitFor(expr, timeout = 10000, label = expr, interval = 100) {
    const t0 = Date.now();
    for (;;) {
      let v = null;
      try { v = await this.ev(expr); } catch { v = null; }
      if (v) return v;
      if (Date.now() - t0 > timeout) throw new Error(`timeout (${timeout} ms) waiting for: ${label}`);
      await sleep(interval);
    }
  }

  ck(name, pass, detail = '') { this.run.checks.push({ name, pass: !!pass, detail: String(detail) }); return !!pass; }
  problem(s) { this.run.problems.push(s); }

  async tapAt(x, y) {
    if (this.run.touch) {
      await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }, this.sid);
      await sleep(30);
      await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, this.sid);
    } else {
      await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, this.sid);
      await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, this.sid);
      await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, this.sid);
    }
  }

  // Click the element returned by the JS expression `sel` (scrolled into view; hit-tested first).
  async click(sel, label = sel) {
    const r = await this.ev(`(()=>{const e=${sel};if(!e)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const b=e.getBoundingClientRect();const x=b.left+b.width/2,y=b.top+b.height/2;const h=document.elementFromPoint(x,y);return{x,y,w:b.width,h:b.height,hit:!!h&&(h===e||e.contains(h)||h.contains(e)),vw:innerWidth,vh:innerHeight}})()`);
    if (!r) throw new Error('element not found: ' + label);
    if (!r.hit || r.w === 0 || r.h === 0) {
      this.problem(`[${this.run.id}] element not clickable at its centre (covered or zero-size): ${label}`);
      await this.ev(`(${sel}).click()`);
      return;
    }
    await this.tapAt(r.x, r.y);
    await sleep(40);
  }

  async key(key) {
    const K = {
      Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
      Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
      q: { key: 'q', code: 'KeyQ', windowsVirtualKeyCode: 81, text: 'q' },
    }[key];
    await this.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...K }, this.sid);
    await this.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: K.key, code: K.code, windowsVirtualKeyCode: K.windowsVirtualKeyCode }, this.sid);
  }

  async typeInto(sel, text, { replace = true } = {}) {
    await this.click(sel);
    await this.ev(`(()=>{const e=${sel};e.focus();${replace ? "e.value='';" : ''}return true})()`);
    await this.cdp.send('Input.insertText', { text }, this.sid);
    const v = await this.ev(`(${sel}).value`);
    if (v !== text) this.problem(`[${this.run.id}] typed text not taken by ${sel}: expected ${JSON.stringify(text.slice(0, 40))}, value ${JSON.stringify(String(v).slice(0, 40))}`);
  }

  async shot(name, { full = false, scrollTo = null } = {}) {
    if (!this.shots) return;
    if (scrollTo) await this.ev(`(()=>{const e=${scrollTo};if(e)e.scrollIntoView({block:'start'});return true})()`);
    const params = { format: 'png' };
    if (full) {
      const m = await this.ev('({w:document.documentElement.clientWidth,h:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)})');
      params.captureBeyondViewport = true;
      params.clip = { x: 0, y: 0, width: m.w, height: m.h, scale: 1 };
    }
    const { data } = await this.cdp.send('Page.captureScreenshot', params, this.sid);
    this.shots.save(name, Buffer.from(data, 'base64'), this.run);
  }

  pick(name, values) {
    const r = this.run;
    const over = {
      devicecheck: '1', spr1_comp: '1', spr2_comp: '1', consent: '1', attn1: r.attnFail ? '1' : '3', attn1r: '3',
      comp_name: 'sylva', d_serious: '2', d_ai_study: '2', prior_sylva: 'No', d_device: r.mobile ? '4' : '2', d_fullscreen: '2',
    };
    if (over[name] !== undefined && values.includes(over[name])) return over[name];
    return values[Math.floor(this.rand() * values.length)];
  }

  // ---------------------------------------------------------------- page loop
  async state() {
    return this.ev(`(()=>{if(typeof ST==='undefined'||typeof P==='undefined'||!P.length)return null;const pg=P[ST.cp];if(!pg)return null;const c=document.getElementById('pageContainer');if(!c||!c.querySelector('.page.active'))return null;return{cp:ST.cp,pid:pg.pid||null,n:P.length,timer:pg.timer||null,nt:!!pg.nt,fin:!!pg.fin,isChat:!!pg.isChat}})()`);
  }

  async walk({ expected, abandonInChat = false, stopAfterPid = null }) {
    const run = this.run;
    await this.waitFor(`document.readyState==='complete'&&typeof ST!=='undefined'&&P.length>0&&ST.pageSeq.length>0`, 20000, 'experiment loaded');
    run.marks.loaded = Date.now();
    run.live.hooks = await this.ev('!!window.__harnessHooks');
    run.live.pageCount = await this.ev('P.length');
    run.live.scriptDelayConsts = await this.ev('({base:SCRIPT_DELAY_BASE_MS,per:SCRIPT_DELAY_PER_CHAR_MS,min:SCRIPT_DELAY_MIN_MS,max:SCRIPT_DELAY_MAX_MS})');
    let i = 0, prevCp = -1;
    for (let guard = 0; guard < 120; guard++) {
      const st = await this.waitFor(`(()=>{const s=(${this.stateExpr()});return s&&s.cp!==${prevCp}?s:null})()`, 30000, 'next page render');
      prevCp = st.cp;
      const tRender = Date.now();
      await sleep(150); // onShow handlers run 50 ms after render
      run.live.pidSeq.push(st.pid);
      const exp = expected[i];
      this.ck(`page ${String(i + 1).padStart(2, '0')} is '${exp}'`, st.pid === exp, `shown '${st.pid}' (P index ${st.cp})`);
      i++;
      const r = await this.handlePage(st, tRender, { abandonInChat });
      if (r === 'abandon') return 'abandon';
      if (st.pid === 'debrief' || st.fin) return 'done';
      if (r === 'stop' || (stopAfterPid && st.pid === stopAfterPid)) return 'stop';
    }
    throw new Error('page loop guard exceeded');
  }

  stateExpr() {
    return `(()=>{if(typeof ST==='undefined'||typeof P==='undefined'||!P.length)return null;const pg=P[ST.cp];if(!pg)return null;const c=document.getElementById('pageContainer');if(!c||!c.querySelector('.page.active'))return null;return{cp:ST.cp,pid:pg.pid||null,timer:pg.timer||null,nt:!!pg.nt,fin:!!pg.fin,isChat:!!pg.isChat}})()`;
  }

  async handlePage(st, tRender, opts) {
    const pid = st.pid;
    const run = this.run;
    if (pid === 'chat') return this.chat(opts);
    if (pid === 'fullscreen') { await this.click(`document.getElementById('fsBtn')`, 'fsBtn'); await sleep(300); }
    if (pid === 'captcha') {
      const hidden = await this.ev(`getComputedStyle(document.getElementById('nextBtn')).display==='none'`);
      this.ck('captcha: Next hidden until the key press', hidden);
      await this.key('q');
      await this.waitFor(`/Correct/.test(document.getElementById('captcha-status').textContent)`, 3000, 'captcha accepted');
    }
    if (pid === 'spr1' || pid === 'spr2') {
      for (let k = 0; k < 30; k++) {
        await this.key('Space'); await sleep(130);
        if (await this.ev(`/Done/.test(document.getElementById('spr-display').textContent)`)) break;
      }
      await this.waitFor(`getComputedStyle(document.getElementById('nextBtn')).display!=='none'`, 3000, 'SPR done');
    }
    if (pid === 'sona_id') {
      const v = await this.ev(`document.getElementById('sonaId').value`);
      if (run.pidViaUrl) this.ck('SONA ID page: auto-filled from the URL', v === run.pid, `value ${JSON.stringify(v)}`);
      else { this.ck('SONA ID page: empty without a URL ID', v === ''); await this.typeInto(`document.getElementById('sonaId')`, run.pid); }
      run.answers.sona_id = run.pid;
      this.ck('Worker not called before the SONA ID page is submitted (C3)', run.net.workerCalls.length === this.workerBase, `${run.net.workerCalls.length - this.workerBase} new call(s) so far`);
    }
    if (pid === 'prechat_ready') {
      const d = await this.ev(`(()=>{const ps=[...document.querySelectorAll('#pageContainer .page > p')];const last=ps[ps.length-1];const box=document.querySelector('#pageContainer .instruction-box');return{last:last?last.textContent:null,afterBox:!!(box&&last&&(box.compareDocumentPosition(last)&Node.DOCUMENT_POSITION_FOLLOWING))}})()`);
      this.ck('pre-chat notice = Appendix D.2 verbatim, after the self-disclosure box', d.last === this.spec.d2 && d.afterBox, JSON.stringify(d.last).slice(0, 80));
    }
    if (pid === 'mc') {
      const t = await this.itemTexts();
      for (const [id, text] of Object.entries(this.spec.mcNew)) this.ck(`MC page item ${id} = prereg §6.4 wording`, t[id] === text, JSON.stringify(t[id]));
      this.ck('MC page has the 3 Study 2 items + 2 new items', Object.keys(t).length === 5, Object.keys(t).join(','));
    }
    if (pid === 'liab_vignette') {
      const v = await this.ev(`document.querySelector('#pageContainer .sentence-display p').textContent`);
      this.ck('vignette 1 text identical to the Study 2 code', v === this.s2v1.vignette);
    }
    if (pid === 'liab_items') {
      const t = await this.itemTexts();
      const ok = Object.keys(this.s2v1.items).length === 12 && Object.entries(this.s2v1.items).every(([id, x]) => t[id] === x) && Object.keys(t).length === 12;
      this.ck('vignette 1: 12 liab items, wording identical to the Study 2 code', ok, Object.keys(t).join(','));
    }
    if (pid === 'v2_vignette') {
      const v = await this.ev(`document.querySelector('#pageContainer .sentence-display p').textContent`);
      this.ck('vignette 2 text = prereg Appendix D.4 verbatim (= §6.14)', v === this.spec.vignette2, JSON.stringify(v).slice(0, 60));
      await this.shot('v2_vignette', {});
    }
    if (pid === 'v2_items') {
      const t = await this.itemTexts();
      const order = await this.ev(`[...document.querySelectorAll('#pageContainer .form-group')].map(g=>{const i=g.querySelector('input[type=radio]');return i?i.name:null}).filter(Boolean)`);
      run.live.v2DomOrder = order;
      const want = Object.assign({}, this.spec.v2Items, { v2_severity: this.spec.v2Severity });
      const bad = Object.entries(want).filter(([id, x]) => t[id] !== x).map(([id]) => id);
      this.ck('vignette 2 items: 9 §6.14 items + v2_severity, wording verbatim', bad.length === 0 && Object.keys(t).length === 10, bad.length ? 'mismatch: ' + bad.join(',') : `${Object.keys(t).length} items`);
      const scale = await this.ev(`[...document.querySelectorAll('#pageContainer .scale-group')].every(g=>g.querySelectorAll('.scale-option').length===5)`);
      this.ck('vignette 2 items use the 5-point vignette-1 scale', scale);
    }
    if (pid === 'prior_sylva') {
      const q = await this.ev(`document.querySelector('#pageContainer .question-text').textContent`);
      this.ck('prior_sylva wording = prereg §4.2', q === this.spec.priorSylvaQ, JSON.stringify(q));
    }
    if (pid === 'debrief') {
      const d = await this.ev(`document.querySelector('#pageContainer .debrief-text').innerText`);
      const fict = 'Both scenarios you read about a chatbot user were fictional.';
      this.ck('debrief: Appendix D.5 sentence directly after the "both scenarios were fictional" sentence', d.includes(fict + ' ' + this.spec.d5));
      this.ck('debrief: 988, CAPS, OHRPP, withdrawal present (§11.3)', /988/.test(d) && /CAPS/.test(d) && /OHRPP|Human Research Protection/.test(d) && /withdraw/i.test(d));
      await this.shot('debrief', { full: true });
    }
    if (pid === 'v2_items') await this.fillGeneric(st, { shotName: 'v2_items' });
    else await this.fillGeneric(st, {});
    if (pid === 'demo_q4_6' && run.ageProbe && !(await this.ev('AGE_VALIDATION_ENABLED'))) {
      this.ck('[FIX-1] age validation is off, as registered (prereg §6.12, §9.3)', (await this.ev('AGE_VALIDATION_ENABLED')) === false);
    } else if (pid === 'demo_q4_6' && run.ageProbe) {
      // Age 17 is refused by the build's age check (AGE_VALIDATION_ENABLED; prereg §6.12 says the
      // form does not validate age, an open PI decision). Then the age 20 is entered again.
      await this.typeInto(`document.getElementById('d_age')`, '17');
      const cp0 = st.cp;
      await this.click(`document.getElementById('nextBtn')`, 'Next with age 17');
      await sleep(400);
      const r = await this.ev(`({cp:ST.cp,err:getComputedStyle(document.getElementById('err-d2')).display,txt:document.getElementById('err-d2').textContent})`);
      run.live.ageProbe = r;
      this.ck('age 17 is refused (age check 18-100, AGE_VALIDATION_ENABLED; deviates from prereg §6.12 "does not validate age")', r.cp === cp0 && r.err !== 'none', JSON.stringify(r));
      await this.typeInto(`document.getElementById('d_age')`, '20');
    }
    if (st.timer || !st.nt) {
      // Timed page: Next must be disabled at render, still disabled 1.5 s before the minimum (page
      // clock, measured from the render time in ST.pts), and enabled once the minimum has passed.
      const want = (st.timer || 7) * 1000;
      const since = `(Date.now()-ST.pts[ST.pts.length-1].t)`;
      const init = await this.ev(`(()=>{const b=document.getElementById('nextBtn');return b?{d:b.disabled,t:b.textContent}:null})()`);
      await this.waitFor(`${since}>=${want - 1500}`, want + 5000, 'timer: 1.5 s before the minimum');
      const late = await this.ev(`({d:document.getElementById('nextBtn').disabled,ms:${since}})`);
      await this.waitFor(`!document.getElementById('nextBtn').disabled`, want + 5000, 'timer Next enabled');
      const enabledAt = await this.ev(since);
      run.live.timers[pid] = { stillDisabledAtMs: late.ms, enabledDetectedAtMs: enabledAt, initDisabled: init && init.d, text: init && init.t };
      this.ck(`${pid}: Next disabled for the ${want / 1000}-s minimum`, init && init.d && late.d && enabledAt >= want - 1000,
        `disabled at render and at ${late.ms} ms; enabled (detected) at ${enabledAt} ms; initial label ${JSON.stringify(init && init.t)}`);
    }
    if (pid === 'sona_id') run.marks.sonaSubmit = Date.now();
    if (pid === 'debrief') run.marks.completeClick = Date.now();
    const cp = st.cp;
    await this.click(`document.getElementById('nextBtn')`, `Next on ${pid}`);
    if (pid === 'debrief') return 'done';
    try {
      await this.waitFor(`ST.cp!==${cp}`, pid === 'sona_id' ? 15000 : 6000, `leave page ${pid}`);
    } catch (e) {
      const errs = await this.ev(`[...document.querySelectorAll('.error-msg')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id+': '+e.textContent)`);
      throw new Error(`could not leave page '${pid}' (visible errors: ${JSON.stringify(errs)})`);
    }
    return null;
  }

  async itemTexts() {
    return this.ev(`(()=>{const o={};document.querySelectorAll('#pageContainer .form-group').forEach(g=>{const i=g.querySelector('input[type=radio]');const q=g.querySelector('.question-text');if(i&&q)o[i.name]=q.textContent});return o})()`);
  }

  async fillGeneric(st, { shotName }) {
    const info = await this.ev(`(()=>{const c=document.getElementById('pageContainer');const R=[...c.querySelectorAll('input[type=radio]')];const C=[...c.querySelectorAll('input[type=checkbox]')];const uniq=a=>[...new Set(a)];return{radios:uniq(R.map(r=>r.name)).map(n=>({name:n,values:R.filter(r=>r.name===n).map(r=>r.value)})),checks:uniq(C.map(r=>r.name)).map(n=>({name:n,values:C.filter(r=>r.name===n).map(r=>r.value)})),tas:[...c.querySelectorAll('textarea')].map(t=>({id:t.id,value:t.value})),nums:[...c.querySelectorAll('input[type=number]')].map(t=>t.id),texts:[...c.querySelectorAll('input[type=text]')].map(t=>({id:t.id,value:t.value}))}})()`);
    for (const g of info.radios) {
      const v = this.pick(g.name, g.values);
      const sel = `document.querySelector('input[name="${g.name}"][value="${v}"]').closest('label')`;
      await this.click(sel, `${g.name}=${v}`);
      const ok = await this.ev(`!!document.querySelector('input[name="${g.name}"][value="${v}"]').checked`);
      if (!ok) { this.problem(`[${this.run.id}] radio ${g.name}=${v} not checked after a click/tap; set by JS`); await this.ev(`document.querySelector('input[name="${g.name}"][value="${v}"]').click()`); }
      this.run.answers[g.name] = v;
    }
    for (const g of info.checks) {
      let vals;
      if (g.name === 'd_training') vals = ['psych'];
      else if (g.name === 'd_chatbot_use') vals = ['entertainment', 'learning'];
      else { const pool = g.values.filter((x) => !['none', 'na', 'pnts', 'other'].includes(x)); vals = [pool[Math.floor(this.rand() * pool.length)]]; }
      for (const v of vals) await this.click(`document.querySelector('input[name="${g.name}"][value="${v}"]').closest('label')`, `${g.name}=${v}`);
      this.run.answers[g.name] = vals;
    }
    for (const t of info.tas) {
      if (t.id === 'sonaId' || t.id === 'chatInput') continue;
      const text = TEXT[t.id] || `Synthetic harness text for ${t.id}.`;
      await this.typeInto(`document.getElementById('${t.id}')`, text);
      this.run.answers[t.id] = text;
    }
    for (const id of info.nums) { await this.typeInto(`document.getElementById('${id}')`, '20'); this.run.answers[id] = '20'; }
    for (const t of info.texts) this.run.answers[t.id] = t.value; // date of consent: keep the prefilled value
    if (shotName) await this.shot(shotName, { full: true });
  }

  // ---------------------------------------------------------------- chat
  async chatState() {
    return this.ev(`(()=>{const c=document.getElementById('probeCard');return{secs:CS.secs,paused:CS.paused,waiting:CS.waiting,ended:CS.ended,probeOpen:CS.probeOpen,rounds:CS.rounds,ok:CS.okRounds,llm:CS.llmRounds,log:ST.chatLog.length,send:document.getElementById('chatSendBtn').disabled,input:document.getElementById('chatInput').disabled,timer:document.getElementById('chatTimer').textContent,probe:c?+c.getAttribute('data-probe'):0}})()`);
  }

  orCount() { return this.run.net.orCalls.length; }

  async sendMsg(k) {
    const text = CHAT_MSGS[k];
    await this.typeInto(`document.getElementById('chatInput')`, text);
    this.run.marks.msgSent[k] = Date.now();
    await this.key('Enter');
    await this.waitFor(`ST.chatLog.some(e=>e.role==='user'&&e.content===${JSON.stringify(text)})`, 3000, `message ${k} logged`);
    this.run.answers['chat_msg_' + k] = text;
  }

  async waitReply() {
    await this.waitFor(`!CS.waiting`, 15000, 'reply or error');
    await sleep(80);
  }

  async probeInfo() {
    return this.ev(`(()=>{const area=document.getElementById('chatArea'),c=document.getElementById('probeCard');if(!c)return null;const opts=[...c.querySelectorAll('.ios-opt')];const ar=area.getBoundingClientRect(),cr=c.getBoundingClientRect();const tops=[];opts.forEach(o=>{const t=Math.round(o.getBoundingClientRect().top);const row=tops.find(r=>Math.abs(r.t-t)<4);if(row)row.n++;else tops.push({t,n:1})});const prev=c.previousElementSibling;const sb=c.querySelector('.probe-submit').getBoundingClientRect();return{k:+c.getAttribute('data-probe'),isLast:area.lastElementChild===c,prevText:prev?prev.innerText:'',q:(c.querySelector('.probe-q')||{}).textContent,values:opts.map(o=>+o.getAttribute('data-v')),labels:[...c.querySelectorAll('svg text')].map(t=>t.textContent),rows:tops.sort((a,b)=>a.t-b.t).map(r=>r.n),optW:opts.map(o=>Math.round(o.getBoundingClientRect().width)),optH:opts.map(o=>Math.round(o.getBoundingClientRect().height)),submitDisabled:c.querySelector('.probe-submit').disabled,submitText:c.querySelector('.probe-submit').textContent,cardInArea:cr.top>=ar.top-1&&cr.bottom<=ar.bottom+1&&cr.left>=ar.left-1&&cr.right<=ar.right+1,submitInViewport:sb.top>=0&&sb.bottom<=innerHeight&&sb.left>=0&&sb.right<=innerWidth,docOverflowX:document.documentElement.scrollWidth>innerWidth,vw:innerWidth,geom:opts.map(o=>{const cs=[...o.querySelectorAll('circle')];return cs.length===2?{d:+cs[1].getAttribute('cx')-+cs[0].getAttribute('cx'),r0:+cs[0].getAttribute('r'),r1:+cs[1].getAttribute('r')}:null})}})()`);
  }

  // IOS geometry (Aron et al., 1992; prereg §6.13): two equal circles per picture, centre distance
  // strictly decreasing from picture 1 to 7; picture 1 not overlapping (d >= 2r); picture 7 almost
  // completely overlapping (d <= r/2).
  iosGeometryOk(geom) {
    if (!Array.isArray(geom) || geom.length !== 7 || geom.some((g) => !g || g.r0 !== g.r1 || !(g.r0 > 0))) return false;
    for (let i = 1; i < 7; i++) if (!(geom[i].d < geom[i - 1].d)) return false;
    return geom[0].d >= 2 * geom[0].r0 && geom[6].d >= 0 && geom[6].d <= geom[6].r0 / 2;
  }

  async pauseCheck(k, { idle = false } = {}) {
    const a = await this.chatState();
    if (idle) await this.ev('CS.idleMs=1500');
    await sleep(1300);
    const m = await this.chatState();
    await sleep(1300);
    const b = await this.chatState();
    if (idle) await this.ev('CS.idleMs=45000');
    // The countdown state and the visible timer text must both stand still (the first read can
    // precede the first paused tick, so the text is compared between the 1.3-s and 2.6-s reads).
    const ok = a.secs === m.secs && m.secs === b.secs && /paused/.test(m.timer) && m.timer === b.timer && b.probeOpen;
    this.run.live.pause[k] = { before: a.secs, mid: m.secs, after: b.secs, timer: b.timer, idlePaused: b.paused };
    this.ck(`probe ${k}: countdown paused while the card is open (CS.secs and the displayed timer unchanged over 2.6 s)`, ok, `CS.secs ${a.secs} -> ${m.secs} -> ${b.secs} over 2.6 s; timer text ${JSON.stringify(m.timer)} / ${JSON.stringify(b.timer)}`);
    if (idle) this.ck(`probe ${k}: idle timer paused while the card is open (idle limit lowered to 1.5 s for 2.6 s)`, b.paused === false && b.probeOpen, `CS.paused=${b.paused}`);
    this.ck(`probe ${k}: message box and Send disabled while open`, b.input === true && b.send === true);
    const guard = await this.ev(`(()=>{const i=document.getElementById('chatInput');const n=ST.chatLog.length;const d=i.disabled;i.disabled=false;i.value='Synthetic guard test';chatSend();const ok=ST.chatLog.length===n;i.value='';i.disabled=d;return ok})()`);
    this.ck(`probe ${k}: chatSend() refuses to send while the card is open`, guard);
  }

  async answerProbe(k, value, { shotName } = {}) {
    const t0 = Date.now();
    const info = await this.probeInfo();
    this.run.live.dom['probe' + k] = info;
    this.ck(`probe ${k}: card shown inside the chat window as its last element`, info && info.k === k && info.isLast, JSON.stringify(info && { k: info.k, isLast: info.isLast }));
    this.ck(`probe ${k}: IOS instruction = Appendix D.3 verbatim`, info.q === this.spec.iosInstruction, JSON.stringify(info.q));
    this.ck(`probe ${k}: 7 IOS pictures in ascending order 1..7, labeled You/Sylva`, JSON.stringify(info.values) === '[1,2,3,4,5,6,7]' && info.labels.filter((x) => x === 'You').length === 7 && info.labels.filter((x) => x === 'Sylva').length === 7, JSON.stringify(info.values));
    this.ck(`probe ${k}: IOS circles go from separate (1) to almost complete overlap (7), distance strictly decreasing`, this.iosGeometryOk(info.geom), JSON.stringify((info.geom || []).map((g) => g && g.d)));
    this.ck(`probe ${k}: Next disabled until a picture is chosen`, info.submitDisabled === true);
    const expRows = this.run.mobile ? '[3,3,1]' : '[7]';
    this.ck(`probe ${k}: IOS grid rows ${expRows} at ${info.vw} px`, JSON.stringify(info.rows) === expRows, JSON.stringify(info.rows) + ' widths ' + JSON.stringify(info.optW));
    this.ck(`probe ${k}: no horizontal page overflow`, !info.docOverflowX);
    this.ck(`probe ${k}: card fully visible inside the chat area`, info.cardInArea);
    if (!info.submitInViewport) this.run.live.notes.push(`probe ${k}: the card's Next button is below the browser viewport when the card opens (page scroll needed) at ${info.vw} px`);
    if (shotName) await this.shot(shotName, { scrollTo: `document.getElementById('chatTimer')` });
    await this.click(`document.querySelector('#probeCard .ios-opt[data-v="${value}"]')`, `IOS ${value}`);
    const en = await this.ev(`!document.querySelector('#probeCard .probe-submit').disabled`);
    this.ck(`probe ${k}: Next enabled after choosing a picture`, en);
    await this.click(`document.querySelector('#probeCard .probe-submit')`, `probe ${k} Next`);
    await this.waitFor(`!document.getElementById('probeCard')`, 3000, `probe ${k} closed`);
    this.run.live.probeOpenMs[k] = Date.now() - (this.run.marks['probe' + k + 'Shown'] || t0);
    this.run.answers['ios_t' + k] = String(value);
    const rec = await this.ev(`ST.r['ios_t${k}']`);
    this.ck(`probe ${k}: response recorded immediately (ios_t${k}=${value})`, String(rec) === String(value), `ST.r.ios_t${k}=${rec}`);
  }

  // Slider alternative of Appendix D.3 (extra scenario; PROBE_FORMAT switched by the harness at load).
  async answerSlider(k, v) {
    const spec = this.spec;
    const sel = `document.querySelector('#probeCard .probe-slider')`;
    if (this.shots) await this.shot('slider_probe1', { scrollTo: `document.getElementById('chatTimer')` });
    await this.ev(`(${sel}).scrollIntoView({block:'nearest'})`);
    const i = await this.ev(`(()=>{const c=document.getElementById('probeCard');const s=c.querySelector('.probe-slider');const r=s.getBoundingClientRect();return{q:(c.querySelector('.probe-q')||{}).textContent,ends:[...c.querySelectorAll('.probe-ends span')].map(x=>x.textContent),ticks:[...c.querySelectorAll('.probe-ticks span')].map(x=>x.textContent).join(''),unset:s.classList.contains('unset'),min:s.min,max:s.max,step:s.step,disabled:c.querySelector('.probe-submit').disabled,iosCount:c.querySelectorAll('.ios-opt').length,left:r.left,width:r.width,y:r.top+r.height/2}})()`);
    this.run.live.dom['slider' + k] = i;
    this.ck(`slider probe ${k}: question and end labels = Appendix D.3 alternative verbatim`, i.q === spec.sliderQuestion && JSON.stringify(i.ends) === JSON.stringify(spec.sliderEnds), JSON.stringify([i.q, i.ends]));
    this.ck(`slider probe ${k}: 1-7, step 1, ticks 1..7, no IOS pictures`, i.min === '1' && i.max === '7' && i.step === '1' && i.ticks === '1234567' && i.iosCount === 0);
    this.ck(`slider probe ${k}: no default position (thumb hidden) and Next disabled before a click`, i.unset && i.disabled);
    const x = i.left + 9 + ((v - 1) / 6) * (i.width - 18);
    await this.tapAt(x, i.y);
    await sleep(100);
    const a = await this.ev(`(()=>{const c=document.getElementById('probeCard');const s=c.querySelector('.probe-slider');return{unset:s.classList.contains('unset'),value:s.value,disabled:c.querySelector('.probe-submit').disabled}})()`);
    this.ck(`slider probe ${k}: a click sets the value (${v}), shows the thumb and enables Next`, !a.unset && a.value === String(v) && !a.disabled, JSON.stringify(a));
    await this.click(`document.querySelector('#probeCard .probe-submit')`, `slider probe ${k} Next`);
    await this.waitFor(`!document.getElementById('probeCard')`, 3000, `slider probe ${k} closed`);
    const rec = await this.ev(`({v:ST.r['ios_t${k}'],f:ST.r.probe_format,rt:ST.r['ios_t${k}_rt_ms']})`);
    this.ck(`slider probe ${k}: ios_t${k} = slider value; probe_format = 'slider'`, String(rec.v) === a.value && rec.f === 'slider' && rec.rt > 0, JSON.stringify(rec));
  }

  async chat({ abandonInChat }) {
    const run = this.run, spec = this.spec, cell = run.cell;
    const S0 = spec.scripts[cell].S0, S1 = spec.scripts[cell].S1;
    const c = run.live.chat;
    const t0 = Date.now();
    let s = await this.chatState();
    this.ck('chat: Send disabled and "Sylva is typing..." shown until S0', s.send === true && (await this.ev(`getComputedStyle(document.getElementById('chatTyping')).display`)) === 'block');
    this.ck('chat: opener in chat_log as user_scripted, not shown', s.log === 1 && (await this.ev(`ST.chatLog[0].role==='user_scripted'&&!document.getElementById('chatArea').innerText.includes(${JSON.stringify(spec.opener)})`)));
    // Enter before S0: nothing is sent
    await this.typeInto(`document.getElementById('chatInput')`, 'Synthetic early message typed before the greeting.');
    await this.key('Enter');
    await sleep(200);
    const early = await this.ev(`ST.chatLog.filter(e=>e.role==='user').length`);
    this.ck('chat: a message cannot be sent before S0 is shown', early === 0);
    await this.ev(`document.getElementById('chatInput').value=''`);
    await this.waitFor(`ST.chatLog.some(e=>e.script_slot==='S0')&&!document.getElementById('chatSendBtn').disabled`, 15000, 'S0 shown');
    // delay measured on the page clock: S0's chat_log time stamp minus chat_start_time (chatInit)
    c.s0DelayMs = await this.ev(`Date.parse(ST.chatLog.find(e=>e.script_slot==='S0').ts)-Date.parse(ST.r.chat_start_time)`);
    const dm = run.live.scriptDelayConsts;
    const expDelay = (t) => Math.max(dm.min, Math.min(dm.max, dm.base + dm.per * t.length));
    c.expectedS0Delay = expDelay(S0);
    this.ck('chat: S0 shown after the typing delay (formula clamp(base + per-char x length))', c.s0DelayMs >= c.expectedS0Delay - 50 && c.s0DelayMs <= c.expectedS0Delay + 1500, `shown ${c.s0DelayMs} ms after chat start; formula ${c.expectedS0Delay} ms`);
    const lastBubble = `(()=>{const a=[...document.querySelectorAll('#chatArea > div')];const b=a.filter(d=>d.id!=='probeCard').pop();return b?b.querySelectorAll('span')[b.querySelectorAll('span').length-1].textContent:null})()`;
    this.ck('chat: S0 bubble = Appendix D.1 text for the cell', (await this.ev(lastBubble)) === S0);
    this.ck('chat: no OpenRouter call for S0', this.orCount() === 0, `${this.orCount()} calls`);
    if (!run.mobile && this.shots && this.shots.wantS0(cell)) await this.shot(`S0_${cell}`, { scrollTo: `document.getElementById('chatTimer')` });
    const sA = (await this.chatState()).secs; await sleep(1200); const sB = (await this.chatState()).secs;
    this.ck('chat: countdown runs after S0', sB < sA, `${sA} -> ${sB}`);

    // ---- message 1 -> scripted S1 -> probe 1
    let sends = 0, ok = 0, llm = 0, errors = 0;
    await this.sendMsg(1); sends++;
    s = await this.chatState();
    this.ck('chat: after message 1, Send disabled and typing shown until S1', s.send === true && (await this.ev(`getComputedStyle(document.getElementById('chatTyping')).display`)) === 'block');
    await this.waitFor(`!!document.getElementById('probeCard')`, 15000, 'probe 1 after S1');
    run.marks.probe1Shown = Date.now();
    ok++;
    this.ck('chat: no OpenRouter call for S1 (first API call comes with message 2)', this.orCount() === 0, `${this.orCount()} calls`);
    const p1 = await this.probeInfo();
    this.ck('probe 1: directly below S1 (previous sibling is the S1 bubble)', p1 && p1.prevText.trim().endsWith(S1), JSON.stringify((p1 && p1.prevText) || '').slice(0, 60));
    await this.pauseCheck(1, { idle: true });
    if (run.probeFormat === 'slider') { await this.answerSlider(1, run.probeValues[1]); return 'stop'; }
    await this.answerProbe(1, run.probeValues[1], { shotName: this.shots && this.shots.wantIos(run) ? 'ios_probe1' : null });
    const r1 = await this.chatState();
    this.ck('probe 1: message box and Send re-enabled after the answer', r1.input === false && r1.send === false);
    const rA = r1.secs; await sleep(1200); const rB = (await this.chatState()).secs;
    this.ck('probe 1: countdown resumes after the answer', rB < rA, `${rA} -> ${rB}`);

    // ---- model replies
    const plan = run.chatPlan;
    const lateStep = plan.find((x) => x.lateAtEnd) || null; // sent just before the time-out (below)
    for (const step of plan) {
      if (step.lateAtEnd) continue;
      if (step.setSecs !== undefined) await this.ev(`CS.secs=${step.setSecs}`);
      run.replyPlan.push({ delay: step.delay, status: step.status });
      const before = this.orCount();
      await this.sendMsg(step.msg); sends++;
      if (step.expectProbe === 2) {
        await this.waitFor(`!!document.getElementById('probeCard')`, 10000, 'probe 2');
        run.marks.probe2Shown = Date.now();
        ok++; llm++;
        const p2 = await this.probeInfo();
        const lastReply = run.net.orCalls[run.net.orCalls.length - 1];
        this.ck('probe 2: directly below the first reply displayed at >= 300 s', p2 && lastReply && p2.prevText.trim().endsWith(lastReply.reply), JSON.stringify((p2 && p2.prevText) || '').slice(0, 60));
        const el = await this.ev(`ST.r.ios_t2_elapsed`);
        this.ck('probe 2: shown at >= 300 active seconds', el >= 300, `ios_t2_elapsed=${el}`);
        await this.pauseCheck(2);
        await this.answerProbe(2, run.probeValues[2], { shotName: this.shots && this.shots.wantIos(run) ? 'ios_probe2' : null });
        continue;
      }
      await this.waitReply();
      this.ck(`message ${step.msg}: exactly one OpenRouter call`, this.orCount() === before + 1, `${this.orCount() - before}`);
      if (step.status && step.status !== 200) {
        errors++;
        const e = await this.ev(`(()=>{const l=ST.chatLog[ST.chatLog.length-1];return{role:l.role,http:l.http_status,txt:document.getElementById('chatArea').innerText.includes('Brief connection issue. Please try again.'),send:!document.getElementById('chatSendBtn').disabled}})()`);
        this.ck(`message ${step.msg}: injected HTTP ${step.status} logged as system_error, Study 2 message shown, Send re-enabled`, e.role === 'system_error' && e.http === step.status && e.txt && e.send, JSON.stringify(e));
      } else {
        ok++; llm++;
        const lastReply = run.net.orCalls[run.net.orCalls.length - 1].reply;
        this.ck(`message ${step.msg}: model reply displayed`, (await this.ev(lastBubble)) === lastReply);
      }
      if (step.msg === 2 || (step.firstApi)) {
        const call = run.net.orCalls[0];
        const m = call && call.messages || [];
        const want = [['system', spec.prompts[cell]], ['user', spec.opener], ['assistant', S0], ['user', CHAT_MSGS[1]], ['assistant', S1], ['user', CHAT_MSGS[2]]];
        const same = m.length === want.length && want.every(([r, t], i) => m[i] && m[i].role === r && m[i].content === t);
        this.ck('first API call context = system, opener, S0, message 1, S1, message 2 (§3.4)', same, m.map((x) => x.role).join(','));
        this.ck('first API call made after message 2 was sent', call && call.t >= run.marks.msgSent[2]);
        this.ck('API request: model, max_tokens 400, temperature 0.7, Authorization present (value not shown)', call && call.model === 'meta-llama/llama-3.3-70b-instruct' && call.max_tokens === 400 && call.temperature === 0.7 && call.authPresent && call.authMatchesCode);
      }
      if (step.expectNoProbe2) {
        const st = await this.chatState();
        const el = await this.ev(`ST.chatLog[ST.chatLog.length-1].elapsed`);
        this.ck('probe 2 not shown for a reply displayed before 300 s', st.probe === 0 && !(await this.ev('!!CS.probeShown[2]')), `reply elapsed=${el}`);
      }
      if (abandonInChat && step.msg >= 2) return 'abandon';
    }
    run.live.chat.tally = { sends, ok, llm, errors };

    // ---- 2-minute reminder, then the end of the timer -> probe 3
    await this.ev('CS.secs=122');
    await this.waitFor(`document.getElementById('chatArea').innerText.includes('About 2 minutes remaining.')`, 5000, '2-minute reminder');
    this.ck('chat: 2-minute reminder shown at 120 s remaining', true);
    let lateBefore = null;
    if (lateStep) {
      // C11 x C23: the last message is sent just before the time-out and its (mock-delayed) reply
      // arrives after the timer has ended, while probe 3 is open.
      run.replyPlan.push({ delay: lateStep.delay, status: lateStep.status });
      lateBefore = this.orCount();
      await this.sendMsg(lateStep.msg); sends++;
    }
    await this.ev('CS.secs=3');
    await this.waitFor(`!!document.getElementById('probeCard')&&CS.ended`, 8000, 'probe 3 at time-out');
    run.marks.probe3Shown = Date.now();
    const p3 = await this.probeInfo();
    const endState = await this.ev(`({cont:getComputedStyle(document.getElementById('chatEndArea')).display,input:document.getElementById('chatInput').disabled,send:document.getElementById('chatSendBtn').disabled,el:ST.r.ios_t3_elapsed,waiting:CS.waiting})`);
    this.ck('probe 3: shown when the timer reaches zero, below the end message', p3 && /conversation time has ended/.test(p3.prevText), JSON.stringify((p3 && p3.prevText) || '').slice(0, 60));
    this.ck('probe 3: Continue hidden until the probe is answered', endState.cont === 'none');
    this.ck('probe 3: ios_t3_elapsed = 600', endState.el === 600, `ios_t3_elapsed=${endState.el}`);
    if (lateStep) {
      this.ck(`time-out with the reply to message ${lateStep.msg} still pending (CS.waiting at the end)`, endState.waiting === true);
      await this.waitFor(`ST.chatLog.some(e=>e.role==='assistant'&&e.after_end)`, lateStep.delay + 8000, 'late reply after the time-out');
      await sleep(150);
      ok++; llm++;
      const lastReply = run.net.orCalls[run.net.orCalls.length - 1];
      const lr = await this.ev(`(()=>{const area=document.getElementById('chatArea'),c=document.getElementById('probeCard');const prev=c&&c.previousElementSibling;const e=ST.chatLog.filter(x=>x.after_end).pop();return{cardLast:!!c&&area.lastElementChild===c,prevText:prev?prev.innerText:'',after_end:e.after_end,displayed:e.displayed,role:e.role,send:document.getElementById('chatSendBtn').disabled,input:document.getElementById('chatInput').disabled,probeOpen:CS.probeOpen}})()`);
      this.ck(`message ${lateStep.msg}: exactly one OpenRouter call`, this.orCount() === lateBefore + 1, `${this.orCount() - lateBefore}`);
      this.ck('late reply (arrived after the time-out while probe 3 was open) shown directly above the card; the card stays the last element (C11, C23)', lr.cardLast && lastReply && lr.prevText.trim().endsWith(lastReply.reply) && lr.probeOpen, JSON.stringify(lr.prevText).slice(0, 60));
      this.ck('late reply: chat_log entry has after_end=true, displayed=true; message box and Send stay disabled (C11)', lr.after_end === true && lr.displayed === true && lr.role === 'assistant' && lr.send && lr.input, JSON.stringify({ after_end: lr.after_end, displayed: lr.displayed, send: lr.send, input: lr.input }));
      run.live.chat.lateReply = true;
    }
    run.live.chat.tally = { sends, ok, llm, errors };
    await sleep(1200); // a participant takes a moment to answer
    await this.answerProbe(3, run.probeValues[3], {});
    await this.waitFor(`getComputedStyle(document.getElementById('chatEndArea')).display!=='none'`, 3000, 'Continue shown');
    this.ck('probe 3: Continue shown after the answer', true);
    const cp = await this.ev('ST.cp');
    await this.click(`document.querySelector('#chatEndArea button')`, 'Continue to Questions');
    await this.waitFor(`ST.cp!==${cp}`, 5000, 'leave chat');
    return null;
  }
}
