/**
 * Counterbalance Worker for Study 3 (Cloudflare Workers + one Durable Object class).
 * NOT DEPLOYED. See README_worker.md before deploying.
 *
 * Implements prereg (2026-10-01 rev. 2) §3.3 and Appendix C rows C3, C4, C25, C27:
 *   - Four cells x two measurement orders = eight combinations.
 *   - Allocation in randomly permuted blocks of eight: each block of eight consecutive
 *     slots contains every cell x order combination exactly once, in a random order
 *     drawn with crypto.getRandomValues when the block's first slot is assigned.
 *   - One counter per study code. The participant code ("1d") and the TEST code
 *     ("1d_test") are separate Durable Object instances, so a TEST session never
 *     advances the participant counter. Both start at slot 0.
 *   - The response echoes the study code; the experiment rejects any response whose
 *     `study` differs from the code it sent.
 *   - Counter updates are atomic: each study code maps to exactly one Durable Object
 *     instance, and every assignment runs inside blockConcurrencyWhile(), so two
 *     concurrent requests can never receive the same slot.
 *   - Every assignment is logged in the Durable Object's storage (slot log: slot, block,
 *     position, cell, order, timestamp, req). No participant identifier is sent or stored.
 *   - Idempotent requests: the experiment sends a random request id (`req`, a UUID created in
 *     the browser and kept in sessionStorage; not linked to the SONA ID). A repeated `req`
 *     returns the slot already assigned to it ("repeat": true) instead of a new slot, so a
 *     reload or retry while the first call was pending does not use up a second slot, and a
 *     call the browser aborted can be matched to the session record (cb_req_id).
 *
 * Public endpoint (used by experiment.js; no credentials):
 *   GET /assign?study=<code>[&req=<uuid>]  ->  200 {"study","cell","order","slot","block","position"[,"repeat"]}
 *
 * Admin endpoints (read-only; never assign; require the ADMIN_TOKEN secret as a
 * bearer token):
 *   GET /status?study=<code>            -> {"study","next_slot","assigned","counts":{...},...}
 *   GET /log?study=<code>[&format=csv]  -> the slot log (JSON array, or CSV)
 *
 * Bindings (wrangler.toml; see wrangler.toml.example):
 *   COUNTER          Durable Object namespace bound to class CounterDO   (required)
 *   ADMIN_TOKEN      secret (wrangler secret put ADMIN_TOKEN)             (required for /status, /log)
 *   ALLOWED_STUDIES  var, comma-separated study codes; default "1d,1d_test"
 *   ALLOWED_ORIGINS  var, optional comma-separated list of browser origins allowed to call
 *                    /assign (e.g. "https://run.pavlovia.org"). Unset = any origin.
 *   COUNTER_EPOCH    var, optional. Changing it (e.g. "" -> "2") points every study code at a
 *                    fresh Durable Object, i.e. a counter that starts again at slot 0. The old
 *                    counter and its slot log are kept, not deleted. Use only before launch.
 */

export const CELLS = ['HighA_HighE', 'HighA_LowE', 'LowA_HighE', 'LowA_LowE'];
export const ORDERS = ['impression_first', 'bonding_first'];
// Index k (0-7) -> combination; fixed listing order, only used through the permutation.
export const COMBOS = CELLS.flatMap((cell) => ORDERS.map((order) => ({ cell, order })));
export const BLOCK_SIZE = COMBOS.length; // 8
const DEFAULT_STUDIES = ['1d', '1d_test'];
export const REQ_RE = /^[A-Za-z0-9-]{8,64}$/;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

function listVar(value, fallback) {
  if (!value) return fallback;
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

// Constant-time comparison of the bearer token with the ADMIN_TOKEN secret.
function authorized(request, env) {
  const secret = env.ADMIN_TOKEN;
  if (!secret) return false;
  const header = request.headers.get('Authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

// Uniform random integer in [0, n) without modulo bias.
function randInt(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

// Fisher-Yates shuffle of [0..BLOCK_SIZE-1].
export function permuteBlock() {
  const p = Array.from({ length: BLOCK_SIZE }, (_, i) => i);
  for (let i = p.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

const pad = (n) => String(n).padStart(7, '0');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, corsHeaders());

    const study = url.searchParams.get('study') || '';
    const allowed = listVar(env.ALLOWED_STUDIES, DEFAULT_STUDIES);
    if (!allowed.includes(study)) return json({ error: 'unknown study', study }, 400, corsHeaders());
    const doName = env.COUNTER_EPOCH ? study + '#epoch-' + env.COUNTER_EPOCH : study;
    const stub = env.COUNTER.get(env.COUNTER.idFromName(doName));

    if (url.pathname === '/assign') {
      const origins = listVar(env.ALLOWED_ORIGINS, null);
      if (origins) {
        const origin = request.headers.get('Origin') || '';
        if (!origins.includes(origin)) return json({ error: 'origin not allowed' }, 403, corsHeaders());
      }
      const req = url.searchParams.get('req') || '';
      if (req && !REQ_RE.test(req)) return json({ error: 'bad req' }, 400, corsHeaders());
      const res = await stub.fetch('https://counter/assign?study=' + encodeURIComponent(study) + (req ? '&req=' + encodeURIComponent(req) : ''));
      return new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...corsHeaders() } });
    }

    if (url.pathname === '/status' || url.pathname === '/log') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const fmt = url.searchParams.get('format') || 'json';
      return stub.fetch('https://counter' + url.pathname + '?study=' + encodeURIComponent(study) + '&format=' + encodeURIComponent(fmt));
    }

    return json({ error: 'not found' }, 404, corsHeaders());
  },
};

/**
 * One instance per study code (idFromName(study)). Storage keys:
 *   next_slot          integer, the next slot to assign (starts at 0)
 *   study              the study code this instance serves
 *   block_<n>          permutation (array of 8 combo indices) for block n
 *   slot_<0000000>     log record for each assigned slot
 */
export class CounterDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const study = url.searchParams.get('study') || '';
    if (url.pathname === '/assign') return this.assign(study, url.searchParams.get('req') || '');
    if (url.pathname === '/status') return this.status(study);
    if (url.pathname === '/log') return this.log(study, url.searchParams.get('format') || 'json');
    return json({ error: 'not found' }, 404);
  }

  async assign(study, req = '') {
    let result;
    if (req && !REQ_RE.test(req)) req = '';
    await this.state.blockConcurrencyWhile(async () => {
      const storage = this.state.storage;
      const owner = await storage.get('study');
      if (owner !== undefined && owner !== study) throw new Error('Durable Object study mismatch');
      if (req) {
        const prev = await storage.get('req_' + req);
        if (prev) { result = { ...prev, repeat: true }; return; }
      }
      const slot = (await storage.get('next_slot')) ?? 0;
      const block = Math.floor(slot / BLOCK_SIZE);
      const position = slot % BLOCK_SIZE;
      let perm = await storage.get('block_' + block);
      if (!perm) {
        perm = permuteBlock();
        await storage.put('block_' + block, perm);
      }
      const combo = COMBOS[perm[position]];
      const record = { study, slot, block, position, cell: combo.cell, order: combo.order, ts: new Date().toISOString(), req };
      result = { study, cell: combo.cell, order: combo.order, slot, block, position };
      const puts = { study, next_slot: slot + 1, ['slot_' + pad(slot)]: record };
      if (req) puts['req_' + req] = result;
      await storage.put(puts);
    });
    return json(result);
  }

  async status(study) {
    const storage = this.state.storage;
    const next = (await storage.get('next_slot')) ?? 0;
    const counts = {};
    for (const c of COMBOS) counts[c.cell + '|' + c.order] = 0;
    const rows = await storage.list({ prefix: 'slot_' });
    for (const rec of rows.values()) counts[rec.cell + '|' + rec.order] += 1;
    return json({
      study,
      next_slot: next,
      assigned: rows.size,
      complete_blocks: Math.floor(next / BLOCK_SIZE),
      position_in_current_block: next % BLOCK_SIZE,
      counts,
    });
  }

  async log(study, format) {
    const rows = [...(await this.state.storage.list({ prefix: 'slot_' })).values()];
    if (format === 'csv') {
      const head = 'study,slot,block,position,cell,order,ts,req';
      const body = rows.map((r) => [r.study, r.slot, r.block, r.position, r.cell, r.order, r.ts, r.req || ''].join(','));
      return new Response([head, ...body].join('\n') + '\n', { headers: { 'Content-Type': 'text/csv', 'Cache-Control': 'no-store' } });
    }
    return json(rows);
  }
}
