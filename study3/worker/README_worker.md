# Counterbalance Worker for Study 3

`counterbalance_worker.js` is the Cloudflare Worker that assigns each Study 3 session to a cell and a measurement order (prereg §3.3; Appendix C rows C3, C4, C25, C27).

## Deployment (done 2026-10-29)

| | |
|---|---|
| URL | `https://study3-counterbalance.dgkamper.workers.dev` (`COUNTERBALANCE_URL` in `experiment.js`) |
| Cloudflare account | the PI's account |
| Worker name | `study3-counterbalance` (a new Worker) |
| Version ID | `21eaf335-7f6f-4667-a7c7-0a0d7d1e4838`. Setting the secret adds a version; `wrangler deployments status --name study3-counterbalance` shows the current one. |
| Source SHA-256 | `de0be5a0d3984991c39eff75074a3f26bacf6f854e8d3d9e22997ddb14745893` (this folder's `counterbalance_worker.js`) |
| Admin password (`ADMIN_TOKEN`) | Stored in `~/Study3_worker_admin_token.txt` on the PI's Mac, readable only by that user and not on Google Drive. Move it to the password manager if you like. |
| Counters at deployment | `1d` and `1d_test` both `next_slot 0`, `assigned 0`, all eight counts 0. `/status` was read twice and did not assign. |

The details are in `deploy_record_2026-10-29.md`.

The Studies 1–2 Worker (`counterbalance.dgkamper.workers.dev`, KV-backed) is a separate Worker on the same account. It was not changed.

## What it does

- `GET /assign?study=1d` returns `{"study":"1d","cell":...,"order":...,"slot":...,"block":...,"position":...}`.
  - `cell` is one of `HighA_HighE`, `HighA_LowE`, `LowA_HighE`, `LowA_LowE`.
  - `order` is one of `impression_first`, `bonding_first`.
- **Permuted blocks of eight.** Slots 0–7 form block 0, slots 8–15 form block 1, and so on. Each block contains each cell × order combination exactly once. The order within a block is a random permutation, drawn when the block's first slot is assigned.
- **Separate counters.** `study=1d_test` (TEST sessions) has its own counter, so TEST sessions never advance the participant counter.
- **Study code echoed.** The response repeats the study code it was asked for. Any other code, such as `1a` or `1c`, gets HTTP 400 and consumes nothing.
- **Atomic counter.** Each study code has exactly one Durable Object instance, and each assignment runs inside `blockConcurrencyWhile()`. Two simultaneous sessions can never get the same slot.
- **Slot log.** Every assignment is stored with its slot, block, position, cell, order and timestamp. This log gives attrition by cell (prereg E9). No SONA ID or other participant identifier is sent to the Worker or stored.
- **Admin endpoints.** `GET /status` and `GET /log` are read-only and never assign. They require the admin password.

## Bindings

| Name | Kind | Purpose |
|---|---|---|
| `COUNTER` | Durable Object namespace, class `CounterDO` (SQLite-backed) | The counters and slot logs. Required. |
| `ADMIN_TOKEN` | Secret | Bearer token for `/status` and `/log`. |
| `ALLOWED_STUDIES` | Variable | Comma-separated study codes. Default `1d,1d_test`. |
| `ALLOWED_ORIGINS` | Variable, optional | If set (for example `https://run.pavlovia.org`), `/assign` refuses browser calls from other origins. Not set. |
| `COUNTER_EPOCH` | Variable, optional | Changing it points every study code at fresh counters that start at 0. The old counters and logs are kept. Use it only before launch, and only if a slot was consumed by mistake. Record the change in the deviations log. |

## Checking the counters WITHOUT using a slot

Never call `/assign?study=1d` to test the Worker: **every such call uses up a real participant slot.** Use `/status`, which only reads:

```bash
curl -s -H "Authorization: Bearer $(cat ~/Study3_worker_admin_token.txt)" "https://study3-counterbalance.dgkamper.workers.dev/status?study=1d"
```

```bash
curl -s -H "Authorization: Bearer $(cat ~/Study3_worker_admin_token.txt)" "https://study3-counterbalance.dgkamper.workers.dev/status?study=1d_test"
```

Before the first participant, `1d` must show `"next_slot":0`. The dated OSF note reports this check.

- TEST sessions use `1d_test`. After eight TEST sessions, the following should list all eight cell × order combinations once each:

  ```bash
  curl -s -H "Authorization: Bearer $(cat ~/Study3_worker_admin_token.txt)" "https://study3-counterbalance.dgkamper.workers.dev/log?study=1d_test&format=csv"
  ```

- If `1d` shows a non-zero count before the first participant, set `COUNTER_EPOCH` (for example to `2`), redeploy, check again, and record the change.

## Redeploying

Use this only if the code changes, which would require a dated amendment.

1. From this folder, run `cp wrangler.toml.example wrangler.toml`, then `wrangler deploy`. Wrangler must be signed in to the the PI's account account (`wrangler whoami`).
2. A redeploy does not reset any counter. The counters live in Durable Object storage, not in the script.

## During and after data collection

- Export the slot log for attrition by cell (E9):

  ```bash
  curl -s -H "Authorization: Bearer $(cat ~/Study3_worker_admin_token.txt)" "https://study3-counterbalance.dgkamper.workers.dev/log?study=1d&format=csv" > worker_slot_log_1d_$(date +%F).csv
  ```

- The experiment records `cb_source`, `cb_slot`, `order_source` and `cb_error`. Sessions with `cb_source = 'fallback_random'` form the sensitivity stratum in §3.3.
