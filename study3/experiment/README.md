# Study 3 experiment (staging)

This is the staging copy of the Study 3 experiment, built from the Study 2 deployment. **It is not deployed, and no data have been collected.** `CHANGELOG_study3.md` lists every change from Study 2, with its prereg Appendix C id.

## config.json (Appendix C17)

Study 3 runs at the root of the existing Pavlovia project `characters/study-2` (projectId 518701, private; PI decision of 2026-10-23). It must not point to `characters/study-3` (projectId 518708), which holds the Study 2 data. A copy of the genre study was pushed to `genres/` there by mistake; `../push_study3_to_pavlovia.sh` removes it, after which the project holds only Study 3 (see `../PAVLOVIA_PUSH.md`).

- This folder's `config.json` keeps the placeholder `TODO_NEW_PROJECT_ID`, for local testing.
- `../pavlovia_upload/config.json` has `experiment.fullpath` `characters/study-2` and `gitlab.projectId` `TODO_AFTER_IRB_APPROVAL_518701`. Change it to `518701` after IRB approval.

While the project ID starts with `TODO`, the experiment never contacts Pavlovia. On a Pavlovia address it refuses to start ("This study is not available yet"); on a local host it runs in local mode and downloads the CSV at the end.

In the project's Pavlovia settings, turn on the option that saves incomplete results (C12). Without it, the `_PARTIAL.csv` records are lost.

## Deployment constants at the top of experiment.js

| Constant | Value | Note |
|---|---|---|
| `SONA_EXPERIMENT_ID` | `3286` | Study 3's own SONA study (C13), set from the PI's completion URL on 2026-10-23 |
| `SONA_CREDIT_TOKEN_TODO` | The study 3286 token [token present] | Name kept so the tests and docs find it (C13, C18) |
| `CONSENT_URL` | UCLA Box link to the Study 1b consent PDF | Set by the PI on 2026-10-30 (C14) |
| `AGE_VALIDATION_ENABLED` | `false` | Prereg §6.12 |

## Study 3 design switches and draft texts (build part 2)

Near the top of `experiment.js`, the section "STUDY 3 DESIGN SWITCHES" holds:

| Constant | Now | Meaning |
|---|---|---|
| `PROBE_FORMAT` | `'ios'` | In-chat closeness probe. `'ios'` is the 7-picture IOS item (prereg D.3, recommended); `'slider'` is the 1-7 slider alternative. |
| `INCLUDE_V2_SEVERITY` | `true` | Adds the optional tenth vignette-2 item `v2_severity` (D.4, recommended). |
| `INCLUDE_MC_E_ITEMS` | `true` | Adds `mc_e_energetic` and `mc_length` to the manipulation-check page (§6.4). `false` restores the Study 2 page exactly. |
| `INCLUDE_PRIOR_SYLVA` | `true` | Adds the `prior_sylva` page at the end of the demographics (§4.2; exclusion 9). `false` removes it. |
| `SCRIPT_DELAY_*` | 1500 ms + 8 ms per character, 2-6 s | "Sylva is typing..." delay before the scripted S0 and S1. The prereg gives no formula `[CONFIRM]`. |
| `PROBE2_ACTIVE_S` | `300` | Active seconds after which the next Sylva reply opens probe 2 (§6.13). |

The next section, "STUDY 3 NEW PARTICIPANT-FACING TEXT", holds every new participant-facing text: the scripts, the pre-chat notice, the probe texts, vignette 2 and its items, and the debrief additions. Each text is marked `[PI SIGN-OFF NEEDED]` with its prereg source and is copied verbatim from the prereg draft. Vignette Draft C (brief §7.3) is kept there as a commented alternative. If a text changes, change the prereg (and the IRB amendment) too. For the scripts, also update `SCRIPT_VERSION` and `EXPECTED_SCRIPT_SHA256`. `dev_tests/static_checks.js` reports any mismatch with the prereg.

The OpenRouter key in `CHAT_API.apiKey` [key present] is carried over unchanged, as the PI decided. C18 requires rotating it and setting a spending cap before the TEST sessions.

## Other folders

- `worker/` holds the counterbalance Worker source, its deployment notes and the zero-slot check. It belongs in the lab code repository (C21), not on Pavlovia.
- `dev_tests/` holds offline tests that use only localhost and in-process mocks. They are not needed on Pavlovia, so leave them out of the Pavlovia repository. They are run as follows:
  - `node dev_tests/static_checks.js "<Study 2>/experiment.js" experiment.js "<prereg .md>" "<Vignette2_Design_Brief .md>"` (the brief is optional; it is used for the Draft C check)
  - `node dev_tests/worker_test.mjs`
  - `PUPPETEER_DIR=... CHROME_BIN=... node dev_tests/e2e_mocked.js "<Study 2>/experiment.js"`. This needs a local puppeteer and headless Chrome. Every non-localhost request is mocked or aborted.
