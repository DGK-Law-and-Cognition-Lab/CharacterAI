# Study 3 Worker deployment record, 2026-10-29

- **Deployed by:** wrangler 4.88.0, signed in to the PI's Cloudflare account.
- **Worker:** `study3-counterbalance`, a new Worker. The Studies 1–2 Worker `counterbalance` was not modified.
- **URL:** https://study3-counterbalance.dgkamper.workers.dev
- **Version ID at deploy:** 21eaf335-7f6f-4667-a7c7-0a0d7d1e4838. Setting the `ADMIN_TOKEN` secret afterwards creates a new version with the same code.
- **Source:** `counterbalance_worker.js`, SHA-256 `de0be5a0d3984991c39eff75074a3f26bacf6f854e8d3d9e22997ddb14745893`.
- **Bindings:** `COUNTER` (Durable Object `CounterDO`, SQLite, migration `study3-v1`); `ALLOWED_STUDIES = "1d,1d_test"`; secret `ADMIN_TOKEN`. `ALLOWED_ORIGINS` and `COUNTER_EPOCH` are not set.
- **Admin password:** 64 hex characters, generated with `openssl rand -hex 32`. Stored in `~/Study3_worker_admin_token.txt` (mode 600, not on Google Drive). It is not written anywhere else.

## Checks run right after deployment (no slot used)

| Check | Result |
|---|---|
| `GET /status?study=1d`, read twice | `next_slot 0`, `assigned 0`, `complete_blocks 0`, all eight counts 0, both times |
| `GET /status?study=1d_test` | `next_slot 0`, `assigned 0`, all eight counts 0 |
| `GET /status?study=1d` without the password | HTTP 401 |
| `GET /assign?study=1c` (old study code) | HTTP 400 `{"error":"unknown study","study":"1c"}`; nothing assigned |
| CORS (`Origin: https://run.pavlovia.org`) | `access-control-allow-origin: *`, `access-control-allow-methods: GET, OPTIONS` |
| Old Worker `counterbalance.dgkamper.workers.dev/status` | Unchanged: 1a 223, 1b 2, 1c 237 |

`/assign?study=1d` and `/assign?study=1d_test` were not called, so both counters are still at 0.
