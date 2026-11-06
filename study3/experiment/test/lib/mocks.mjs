// Network interception for one run (CDP Fetch domain, pattern '*', request stage).
//   127.0.0.1:<port>                      -> served by the local python http.server (continue);
//                                            /config.json is replaced in 'pavlovia' mode (harness only)
//   study3-counterbalance.dgkamper.workers.dev   -> mock Worker (GET /assign?study=<code>)
//   openrouter.ai                         -> mock chat completions (canned synthetic replies)
//   pavlovia.org                          -> mock Pavlovia API (session open, results, close)
//   ucla.sona-systems.com                 -> stub page for the credit redirect
//   anything else                         -> Fetch.failRequest (BlockedByClient) and logged
// Every request is also observed through the Network domain, so a request that bypassed the
// Fetch interception would be detected (and, because the browser runs behind a dead proxy, it
// could not have reached the network either).
// Secrets: request headers and the SONA redirect query are never logged. The Authorization header
// and the credit token are checked with boolean predicates supplied by the caller.
import { parseMultipart } from './csv.mjs';

export const MOCK_PROJECT_ID = '999999';
export const MOCK_SESSION_TOKEN = 'harness-mock-session';
const WORKER_HOST = 'study3-counterbalance.dgkamper.workers.dev';
const OR_HOST = 'openrouter.ai';
const PAV_HOST = 'pavlovia.org';
const SONA_HOST = 'ucla.sona-systems.com';

const CORS = [
  { name: 'Access-Control-Allow-Origin', value: '*' },
  { name: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
  { name: 'Access-Control-Allow-Headers', value: 'content-type, authorization' },
  { name: 'Access-Control-Max-Age', value: '600' },
];
const JSONH = [...CORS, { name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' }];

// Neutral synthetic sentences for the mocked model replies (2-4 per reply).
const SENTENCES = [
  'This is a synthetic reply written by the test harness.',
  'The path between the old trees is quiet this morning.',
  'I am still looking for clues about how to resist fire.',
  'The river near the grove is running high after the rain.',
  'Tell me a little more about that if you like.',
  'I have been walking since sunrise and the air is cool.',
  'Some of the crystal ridges are hard to climb in the wet season.',
];
export function mockReplyText(n) {
  const k = 2 + (n % 3);
  const out = [`Synthetic reply number ${n}.`];
  for (let i = 0; i < k - 1; i++) out.push(SENTENCES[(n + i) % SENTENCES.length]);
  return out.join(' ');
}

// URL without its query string (for logs).
export const redact = (u) => { try { const x = new URL(u); return x.protocol.startsWith('http') ? `${x.protocol}//${x.host}${x.pathname}` : x.protocol; } catch { return '[unparseable url]'; } };

function header(headers, name) {
  const k = Object.keys(headers || {}).find((h) => h.toLowerCase() === name.toLowerCase());
  return k ? headers[k] : undefined;
}

async function bodyOf(cdp, sid, p) {
  const r = p.request;
  if (r.postDataEntries && r.postDataEntries.length) return Buffer.concat(r.postDataEntries.map((e) => Buffer.from(e.bytes || '', 'base64')));
  if (typeof r.postData === 'string') return Buffer.from(r.postData, 'utf8');
  if (r.hasPostData && p.networkId) {
    try { const d = await cdp.send('Network.getRequestPostData', { requestId: p.networkId }, sid); return Buffer.from(d.postData || '', d.base64Encoded ? 'base64' : 'utf8'); } catch { /* fall through */ }
  }
  return Buffer.alloc(0);
}

export async function installNetwork(cdp, sid, run, ctx) {
  const net = run.net = {
    paused: 0, local: 0, mocked: [], blocked: [], workerCalls: [], orCalls: [], pavlovia: [], sona: [],
    configOverridden: false, networkReqs: new Map(), fetchDisp: new Map(), handlerErrors: [],
  };
  let orCount = 0;
  const fulfill = (requestId, code, headers, body) => cdp.send('Fetch.fulfillRequest', {
    requestId, responseCode: code, responseHeaders: headers,
    ...(body !== undefined ? { body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString('base64') } : {}),
  }, sid);

  cdp.on('Network.requestWillBeSent', (p, s) => {
    if (s !== sid) return;
    let host = '';
    try { host = new URL(p.request.url).host; } catch { /* ignore */ }
    if (!net.networkReqs.has(p.requestId)) net.networkReqs.set(p.requestId, { url: redact(p.request.url), host, type: p.type, method: p.request.method, scheme: (p.request.url.split(':')[0] || '') });
  });

  cdp.on('Fetch.requestPaused', async (p, s) => {
    if (s !== sid) return;
    net.paused++;
    const { requestId, request } = p;
    let u;
    try { u = new URL(request.url); } catch { u = null; }
    const disp = (d) => { if (p.networkId) net.fetchDisp.set(p.networkId, d); };
    try {
      if (!u || !/^https?:$/.test(u.protocol)) { disp('continue-nonhttp'); return await cdp.send('Fetch.continueRequest', { requestId }, sid); }
      const host = u.hostname, method = request.method, t = Date.now();
      if ((host === '127.0.0.1' || host === 'localhost') && String(u.port) === String(ctx.port)) {
        net.local++;
        if (u.pathname === '/config.json' && run.mode === 'pavlovia') {
          const cfg = JSON.parse(JSON.stringify(ctx.realConfig));
          cfg.gitlab = Object.assign({}, cfg.gitlab, { projectId: MOCK_PROJECT_ID });
          net.configOverridden = true; disp('local-config-override');
          return await fulfill(requestId, 200, [{ name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' }], cfg);
        }
        disp('local'); return await cdp.send('Fetch.continueRequest', { requestId }, sid);
      }
      if (method === 'OPTIONS' && [WORKER_HOST, OR_HOST, PAV_HOST].includes(host)) {
        net.mocked.push({ t, host, path: u.pathname, method }); disp('mock-preflight');
        return await fulfill(requestId, 204, CORS);
      }
      if (host === WORKER_HOST) {
        disp('mock-worker');
        const study = u.searchParams.get('study');
        const call = { t, method, path: u.pathname, study, req: u.searchParams.get('req'), resourceType: p.resourceType };
        net.workerCalls.push(call); net.mocked.push({ t, host, path: u.pathname, method });
        if (u.pathname !== '/assign' || method !== 'GET') return await fulfill(requestId, 404, JSONH, { error: 'not found' });
        const slot = run.slot;
        const resp = { study, cell: run.cell, order: run.order, slot, block: Math.floor(slot / 8), position: slot % 8 };
        // extra scenarios: a rejected response (study mismatch), an HTTP error, a response without `order`
        if (run.workerMode === 'http500') { call.response = { http: 500 }; return await fulfill(requestId, 500, JSONH, { error: 'harness-injected Worker error' }); }
        if (run.workerMode === 'timeout') {
          // No answer for 12.5 s: the page must abort the request after COUNTERBALANCE_TIMEOUT_MS
          // (10 s) and fall back. The late answer is then refused by Chrome (request gone).
          call.response = { timeout: true };
          await new Promise((r) => setTimeout(r, 12500));
          try { await fulfill(requestId, 200, JSONH, resp); call.response.lateAnswerAccepted = true; } catch { call.response.lateAnswerAccepted = false; }
          return;
        }
        if (run.workerMode === 'mismatch') resp.study = 'harness_other_study';
        if (run.workerMode === 'no_order') delete resp.order;
        call.response = resp;
        return await fulfill(requestId, 200, JSONH, resp);
      }
      if (host === OR_HOST) {
        disp('mock-openrouter');
        net.mocked.push({ t, host, path: u.pathname, method });
        if (u.pathname !== '/api/v1/chat/completions' || method !== 'POST') return await fulfill(requestId, 404, JSONH, { error: { message: 'not found' } });
        const body = await bodyOf(cdp, sid, p);
        let parsed = null; try { parsed = JSON.parse(body.toString('utf8')); } catch { /* keep null */ }
        const plan = run.replyPlan.shift() || {};
        orCount++;
        const auth = header(request.headers, 'Authorization');
        const call = {
          t, n: orCount, messages: parsed && parsed.messages, model: parsed && parsed.model, max_tokens: parsed && parsed.max_tokens,
          temperature: parsed && parsed.temperature, authPresent: !!auth, authMatchesCode: ctx.authMatches(auth), status: plan.status || 200,
        };
        net.orCalls.push(call);
        await new Promise((r) => setTimeout(r, plan.delay ?? 350));
        if (plan.status && plan.status !== 200) return await fulfill(requestId, plan.status, JSONH, { error: { message: 'harness-injected error', code: plan.status } });
        const text = mockReplyText(orCount);
        call.reply = text; call.gen_id = `gen-harness-${run.slotTag}-${orCount}`;
        const promptTokens = Math.round(JSON.stringify(parsed && parsed.messages || []).length / 4);
        const completionTokens = Math.max(1, Math.round(text.length / 4));
        return await fulfill(requestId, 200, JSONH, {
          id: call.gen_id, provider: 'HarnessMockProvider', model: 'meta-llama/llama-3.3-70b-instruct', object: 'chat.completion',
          created: Math.floor(t / 1000),
          choices: [{ index: 0, logprobs: null, finish_reason: 'stop', native_finish_reason: 'stop', message: { role: 'assistant', content: text, refusal: null } }],
          usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
        });
      }
      if (host === PAV_HOST) {
        disp('mock-pavlovia');
        net.mocked.push({ t, host, path: u.pathname, method });
        const ct = header(request.headers, 'Content-Type');
        const body = await bodyOf(cdp, sid, p);
        const form = /multipart\/form-data/i.test(ct || '') ? parseMultipart(body, ct) : null;
        const ev = { t, method, path: u.pathname, resourceType: p.resourceType, form, bodyBytes: body.length };
        net.pavlovia.push(ev);
        const base = `/api/v2/experiments/${MOCK_PROJECT_ID}/sessions`;
        if (method === 'POST' && u.pathname === base) { ev.kind = 'open'; return await fulfill(requestId, 200, JSONH, { token: MOCK_SESSION_TOKEN, experiment: { fullPath: ctx.realConfig.experiment.fullpath } }); }
        if (method === 'POST' && u.pathname === `${base}/${MOCK_SESSION_TOKEN}/results`) { ev.kind = 'results'; return await fulfill(requestId, 200, JSONH, { message: 'results saved (harness mock)' }); }
        if (method === 'DELETE' && u.pathname === `${base}/${MOCK_SESSION_TOKEN}`) { ev.kind = 'close'; return await fulfill(requestId, 200, JSONH, { message: 'session closed (harness mock)' }); }
        if (method === 'POST' && u.pathname === `${base}/${MOCK_SESSION_TOKEN}/delete`) { ev.kind = 'close-beacon'; return await fulfill(requestId, 200, JSONH, { message: 'session closed (harness mock)' }); }
        ev.kind = 'unknown'; return await fulfill(requestId, 404, JSONH, { message: 'unknown endpoint (harness mock)' });
      }
      if (host === SONA_HOST) {
        disp('mock-sona');
        if (u.pathname !== '/webstudy_credit.aspx') { // e.g. the stub page's favicon
          net.mocked.push({ t, host, path: u.pathname, method });
          return await fulfill(requestId, 404, [{ name: 'Content-Type', value: 'text/plain' }], 'not found (harness stub)');
        }
        const q = u.searchParams;
        const tok = q.get('credit_token');
        net.sona.push({
          t, method, path: u.pathname, resourceType: p.resourceType, experiment_id: q.get('experiment_id'), survey_code: q.get('survey_code'),
          tokenPresent: !!tok, tokenMatchesCode: ctx.tokenMatches(tok), params: [...q.keys()],
        });
        net.mocked.push({ t, host, path: u.pathname, method });
        return await fulfill(requestId, 200, [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
          '<!doctype html><html><head><meta charset="utf-8"><title>SONA credit (harness stub)</title></head><body><h1>SONA credit redirect reached (harness stub; no request left the machine)</h1></body></html>');
      }
      disp('blocked');
      net.blocked.push({ t, url: redact(request.url), method, resourceType: p.resourceType });
      return await cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }, sid);
    } catch (e) {
      net.handlerErrors.push(`${redact(request.url)}: ${e.message}`);
      try { await cdp.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }, sid); } catch { /* ignore */ }
    }
  });

  await cdp.send('Network.enable', {}, sid);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, sid);
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] }, sid);
}

// Every external (non-loopback) http(s) request seen by the Network domain must have been
// fulfilled by a mock or failed by the harness. Returns a list of violations (empty = OK).
export function externalRequestAudit(run, port) {
  const v = [];
  for (const [id, r] of run.net.networkReqs) {
    if (!/^https?$/.test(r.scheme)) continue;
    const isLocal = r.host === `127.0.0.1:${port}` || r.host === `localhost:${port}`;
    const d = run.net.fetchDisp.get(id);
    if (isLocal) { if (!d) v.push(`local request not seen by Fetch: ${r.method} ${r.url}`); continue; }
    if (!d) v.push(`external request NOT intercepted: ${r.method} ${r.url} (${r.type})`);
    else if (!(d.startsWith('mock-') || d === 'blocked')) v.push(`external request passed through (${d}): ${r.method} ${r.url}`);
  }
  return v;
}
