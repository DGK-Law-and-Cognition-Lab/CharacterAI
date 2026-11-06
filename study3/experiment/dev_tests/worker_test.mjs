#!/usr/bin/env node
// Offline unit test of worker/counterbalance_worker.js. No network: the Durable Object
// namespace and its storage are in-memory mocks, and requests are built locally.
//
//   node dev_tests/worker_test.mjs
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(path.join(here, '..', 'worker', 'counterbalance_worker.js')).href);
const worker = mod.default;
const { CounterDO, CELLS, ORDERS } = mod;

let failures = 0;
const check = (c, label) => { console.log((c ? 'PASS ' : 'FAIL ') + label); if (!c) failures++; };

// ---- mocks
class MockStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.has(k) ? structuredClone(this.m.get(k)) : undefined; }
  async put(k, v) { if (typeof k === 'object') { for (const [kk, vv] of Object.entries(k)) this.m.set(kk, structuredClone(vv)); } else this.m.set(k, structuredClone(v)); }
  async list({ prefix = '' } = {}) { return new Map([...this.m.entries()].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, structuredClone(v)])); }
}
class MockState {
  constructor() { this.storage = new MockStorage(); this.chain = Promise.resolve(); }
  blockConcurrencyWhile(fn) { const run = this.chain.then(fn); this.chain = run.catch(() => {}); return run; }
}
function mockNamespace() {
  const objs = new Map();
  return {
    idFromName: (name) => name,
    get: (id) => {
      if (!objs.has(id)) objs.set(id, new CounterDO(new MockState(), {}));
      const obj = objs.get(id);
      return { fetch: (u) => obj.fetch(new Request(typeof u === 'string' ? u : u.url)) };
    },
  };
}
const ADMIN = 'test-admin-token-not-real';
const env = { COUNTER: mockNamespace(), ADMIN_TOKEN: ADMIN };
const call = (p, headers = {}) => worker.fetch(new Request('https://worker.invalid' + p, { headers }), env);

// ---- status at 0 without consuming a slot
let r = await call('/status?study=1d', { Authorization: 'Bearer ' + ADMIN });
let s = await r.json();
check(r.status === 200 && s.next_slot === 0 && s.assigned === 0, 'participant counter starts at 0 (/status)');
r = await call('/status?study=1d', { Authorization: 'Bearer ' + ADMIN });
s = await r.json();
check(s.next_slot === 0, '/status does not consume a slot');
r = await call('/status?study=1d');
check(r.status === 401, '/status without the admin token is refused');
r = await call('/status?study=1d', { Authorization: 'Bearer wrong-token-xxxxxxxxx' });
check(r.status === 401, '/status with a wrong token is refused');

// ---- unknown study
r = await call('/assign?study=1c');
check(r.status === 400, 'unknown study code (1c) is refused with 400');

// ---- 80 concurrent participant assignments
const res = await Promise.all(Array.from({ length: 80 }, () => call('/assign?study=1d').then((x) => x.json())));
const slots = res.map((x) => x.slot).sort((a, b) => a - b);
check(slots.every((v, i) => v === i), '80 concurrent calls receive slots 0..79 exactly once');
check(res.every((x) => x.study === '1d'), 'every response echoes study=1d');
check(res.every((x) => CELLS.includes(x.cell) && ORDERS.includes(x.order)), 'every response has a valid cell and order');
let blocksOk = true;
for (let b = 0; b < 10; b++) {
  const inBlock = res.filter((x) => x.block === b).map((x) => x.cell + '|' + x.order);
  if (inBlock.length !== 8 || new Set(inBlock).size !== 8) blocksOk = false;
}
check(blocksOk, 'each of the 10 blocks of eight contains all 8 cell x order combinations once');
const perms = new Set();
for (let b = 0; b < 10; b++) perms.add(res.filter((x) => x.block === b).sort((a, c) => a.position - c.position).map((x) => x.cell + x.order).join(','));
check(perms.size > 1, 'block orders are permuted (not a fixed rotation): ' + perms.size + ' distinct orders in 10 blocks');

// ---- TEST counter is separate
r = await call('/assign?study=1d_test');
const t = await r.json();
check(t.study === '1d_test' && t.slot === 0, 'TEST counter (1d_test) is separate and starts at slot 0');
r = await call('/status?study=1d', { Authorization: 'Bearer ' + ADMIN });
s = await r.json();
check(s.next_slot === 80 && s.assigned === 80, 'participant counter not advanced by the TEST call (next_slot 80)');
check(Object.values(s.counts).every((n) => n === 10), 'status counts: 10 per cell x order after 80 slots');

// ---- log
r = await call('/log?study=1d&format=csv', { Authorization: 'Bearer ' + ADMIN });
const csv = await r.text();
check(r.status === 200 && csv.trim().split('\n').length === 81 && csv.startsWith('study,slot,block,position,cell,order,ts'), 'slot log exports as CSV (80 rows + header)');

// ---- [FIX-13] idempotent request ids: a repeated req returns the same slot and does not advance the counter
const REQ = '3f2b9c1e-0000-4000-8000-00000000abcd';
r = await call('/assign?study=1d_test&req=' + REQ);
const a1 = await r.json();
r = await call('/assign?study=1d_test&req=' + REQ);
const a2 = await r.json();
check(a1.slot === a2.slot && a1.cell === a2.cell && a1.order === a2.order && a2.repeat === true && !a1.repeat, 'repeated req returns the same slot/cell/order with repeat=true');
const concurrentReq = await Promise.all(Array.from({ length: 5 }, () => call('/assign?study=1d_test&req=aaaaaaaa-1111-4111-8111-111111111111').then((x) => x.json())));
check(new Set(concurrentReq.map((x) => x.slot)).size === 1, '5 concurrent calls with one req receive one slot');
r = await call('/assign?study=1d_test&req=bad%20id!');
check(r.status === 400, 'malformed req is refused with 400');
r = await call('/status?study=1d_test', { Authorization: 'Bearer ' + ADMIN });
s = await r.json();
check(s.next_slot === 3, 'TEST counter advanced once per distinct req (slots 0, 1, 2 used; next_slot 3)');
r = await call('/log?study=1d_test&format=csv', { Authorization: 'Bearer ' + ADMIN });
const tcsv = await r.text();
check(tcsv.startsWith('study,slot,block,position,cell,order,ts,req') && tcsv.includes(REQ), 'slot log CSV carries the req column');

// ---- CORS + origin restriction
r = await call('/assign?study=1d_test');
check(r.headers.get('Access-Control-Allow-Origin') === '*', '/assign sends Access-Control-Allow-Origin');
const env2 = { ...env, ALLOWED_ORIGINS: 'https://run.pavlovia.org' };
r = await worker.fetch(new Request('https://worker.invalid/assign?study=1d_test', { headers: { Origin: 'https://evil.invalid' } }), env2);
check(r.status === 403, 'ALLOWED_ORIGINS set: other origins are refused (403)');
r = await worker.fetch(new Request('https://worker.invalid/assign?study=1d_test', { headers: { Origin: 'https://run.pavlovia.org' } }), env2);
check(r.status === 200, 'ALLOWED_ORIGINS set: run.pavlovia.org is accepted');

// ---- COUNTER_EPOCH gives a fresh counter without deleting the old one
const env3 = { ...env, COUNTER_EPOCH: '2' };
r = await worker.fetch(new Request('https://worker.invalid/status?study=1d', { headers: { Authorization: 'Bearer ' + ADMIN } }), env3);
s = await r.json();
check(s.next_slot === 0, 'COUNTER_EPOCH=2: participant counter reads 0 again');
r = await call('/status?study=1d', { Authorization: 'Bearer ' + ADMIN });
s = await r.json();
check(s.next_slot === 80, 'old counter (no epoch) still holds its 80 slots');

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nALL WORKER TESTS PASSED');
process.exit(failures ? 1 : 0);
