# Study 3 end-to-end test harness

This harness runs the real staging experiment (`index.html`, `experiment.js`, `style.css`, `config.json`, unmodified) in headless Google Chrome. A synthetic participant walks through every page: radios, sliders, checkboxes, text, the chat, the three closeness probes, both vignettes and the debrief, up to the SONA credit redirect. The harness then checks the CSV the code produces against the preregistration draft (revision 2) and against the Study 2 output.

No request leaves the machine. The harness intercepts every request the page makes. It mocks the counterbalance Worker, OpenRouter, Pavlovia and the SONA redirect, and blocks every other external host. The browser also sits behind a dead proxy (`127.0.0.1:9`) with background networking switched off.

## Requirements

- Node 22 or later (it uses the built-in `WebSocket` and `fetch`). No npm packages are needed.
- `python3` (serves the experiment folder with `http.server`, bound to `127.0.0.1`).
- Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, or set `CHROME_PATH`.
- Read access to the prereg draft and the Study 2 code, both read-only. The default paths follow the lab folder layout. To use other paths, set `PREREG` and `S2_JS`. `S2_RAW` is optional: the harness reads only the header line of each Study 2 raw CSV and never prints file names or values.

## How to run

From the `experiment` folder:

```
node test/run_e2e.mjs                    # all 17 runs (about 8 minutes with the default 3 in parallel)
node test/run_e2e.mjs --parallel 2       # fewer Chrome instances at a time (default 3)
node test/run_e2e.mjs --only HighA_HighE_impression_first,HighA_LowE_bonding_first_mobile375
node test/run_e2e.mjs --list             # list the run ids
node test/run_e2e.mjs --no-mobile --no-abandon --no-extra --no-shots
```

Each run uses its own Chrome instance and a fresh temporary profile. Profiles go under `$HARNESS_TMP/study3-e2e` (default: the OS temp folder) and are deleted at the end. Set `HARNESS_TMP` to a scratch folder outside Google Drive (for example a session scratchpad), so that no Chrome profile is ever written into a synced folder:

```
HARNESS_TMP=/path/to/scratch node test/run_e2e.mjs
``` The exit code is `0` when every check passes, `1` when any check fails, and `2` on a harness error. A full run (no `--only`) first deletes the previous `output/*.csv`, `output/*.json` and `screenshots/*.png`.

For a CDP trace, set `DEBUG_CDP=1`. It prints the commands and evaluated expressions, which contain no secrets.

## Runs

| Run id | What it covers |
|---|---|
| `<cell>_<order>` × 8 (4 cells × 2 orders) | 1280 × 800 desktop. Pavlovia path: `config.json` is served with a mock `projectId`, and the final CSV is taken from the mocked results upload. URL SONA ID (`?survey_code=9900NN`). 8 chat messages. |
| `HighA_LowE_bonding_first_mobile375` | 375 × 812, mobile user agent (Android Chrome, emulated in desktop Chrome), touch taps. Local mode with the real `config.json` (`projectId` TODO, C17), so the CSV is captured from the browser download. SONA ID `TESTharness375` typed by hand, which takes the `1d_test` route (C4). The first attention check is failed, then passed on retry. An HTTP 500 is injected on chat message 3 (C8). Age 17 is tried first. 9 chat messages; message 9 is sent just before the time-out and its reply (mock delay 6 s) arrives after the timer has ended, while probe 3 is open (C11 with C23). |
| `abandon_LowA_LowE_impression_first` | The participant leaves mid-chat, after probe 1 and message 2. The run checks the `..._PARTIAL.csv` exit beacon and the close beacon with `isCompleted=false` (C12). |
| `extra_fallback_on_study_mismatch` | The Worker answers with a different `study`. Expected: uniform fallback with `cb_source='fallback_random'` (C3). |
| `extra_test_id_worker_http500` | TEST ID and the Worker returns HTTP 500. Expected: `cb_source='test'` and one investigator alert (C4, readiness 2.13). |
| `extra_worker_without_order` | The Worker response has no `order`. Expected: `order_source='client'`. |
| `extra_reload_reuses_assignment` | The page is reloaded after assignment. Expected: no second Worker call, `cb_reused=true`, `reload_count=1` (readiness 2.10). |
| `extra_slider_probe` | `PROBE_FORMAT='slider'`, set by the harness at load (this run only). Probe 1 is answered with the slider (App. D.3 alternative). |
| `extra_worker_timeout` | The Worker mock does not answer for 12.5 s. Expected: the request is aborted after `COUNTERBALANCE_TIMEOUT_MS` (10 s) and the uniform fallback is used, `cb_source = order_source = 'fallback_random'`, `cb_fetch_ms` about 10000 (C3). |
| `extra_probe2_not_triggered` | Only message 2 gets a model reply (at about 15 s); the clock then goes to the reminder and the time-out. Expected: probe 2 is never shown, `ios_t2_status = 'not_triggered'`, no `ios_t2*` fields, probes 1 and 3 recorded (§6.13). Stops after the chat page and checks the live record and the `chat_end` and `probe_3` checkpoint records. |

## What the harness changes on the page

The harness never edits `experiment.js`. From the harness side (CDP) it does only the following:

- **Chat clock.** `CS.secs` is set with `Runtime.evaluate` to compress the 10-minute chat. Probe 1 is triggered by S1 as in a real session. Before message 5, `CS.secs` is set to 312: the reply lands at about 288 active seconds, and the run checks that probe 2 does **not** open. Before message 6, `CS.secs` is set to 301, and the reply is delayed 1.6 s so that it lands at 300 s or later: probe 2 must open. `CS.secs` is then set to 122 (the 2-minute reminder must appear) and to 3 (time-out, so probe 3 opens). As a result, the `elapsed` values in `chat_log` jump.
- **Idle limit.** While probe 1 is open, `CS.idleMs` is lowered to 1.5 s for 2.6 s. This shows that the idle timer is paused too. It is restored before the answer.
- **Late reply (mobile run only).** After the 2-minute reminder, message 9 is sent and `CS.secs` is set to 3 at once; the mock holds the reply for 6 s, so it arrives after the time-out while probe 3 is open.
- **`config.json`.** In the Pavlovia runs, the request is answered with the same file but `gitlab.projectId = "999999"`, so that the upload code runs against the mock. The file on disk is unchanged.
- **Observation hooks.** At `DOMContentLoaded`, before the first page, `checkpoint()` and `PAVLOVIA.save()` are wrapped. The wrappers call the originals and report the staged partial keys and the final CSV through a CDP binding.
- **Slider run only.** `PROBE_FORMAT='slider'` is set at load.

## Mocks

- **Worker.** `GET /assign?study=<code>` returns `{study, cell, order, slot, block, position}`, the contract of `worker/counterbalance_worker.js`, with the cell and order the run is testing. CORS headers are included. For the extra scenarios it can answer with another `study`, omit `order`, return HTTP 500, or stay silent for 12.5 s.
- **OpenRouter.** `POST /api/v1/chat/completions` returns `choices[0].message.content`: 2-4 neutral synthetic sentences, each beginning "Synthetic reply number N.". The response also has `finish_reason`, `native_finish_reason`, `usage`, `model`, `provider` (`HarnessMockProvider`) and `id` (`gen-harness-...`). The default latency is 350 ms. Preflight `OPTIONS` requests are answered with 204.
- **Pavlovia.** Session open returns a token. The results upload, the session close (`DELETE`) and the beacons return 200. The harness parses the multipart bodies (`key`, `value`, `isCompleted`).
- **SONA.** `webstudy_credit.aspx` returns a stub page. The harness keeps `experiment_id` and `survey_code`, and keeps the credit token only as two booleans: present, and equal to the constant in `experiment.js`.
- **Everything else** is blocked (`Fetch.failRequest`) and listed in the run report.

## What is checked

These checks run for every full run. `output/<run>.checks.json` lists each check with its detail.

- **Page flow.** Every page is shown in the prereg §3.6 order for the assigned `order`, and `page_sequence` matches the pages actually walked. The 10-s minimum holds on the backstory, vignette 1 and vignette 2 pages. The captcha (Q), the SPR task, the attention retry path (mobile run) and the age check (mobile run) all behave as specified. `P.length` is 56.
- **Assignment.** `cell`, `a_level`, `e_level`, `a_block`, `e_block`, `n_block`, `condition_id` and `order` equal the requested cell and order. The run also checks `cb_source`, `order_source`, `cb_slot`, `cb_study_code`, `is_test_session`, `cb_error` and `cb_reused`. The Worker is called exactly once, after the SONA ID page is submitted, never at page load.
- **System prompt.** The harness assembles each cell's prompt from the prereg §3.4 blockquotes. The CSV `system_prompt` (after CRLF→LF) must equal it, and its SHA-256 and length must equal prereg Appendix A. For HighA_HighE it must also equal the full text in Appendix A. `system_prompt_sha256` must be the Appendix A hash with `system_prompt_sha256_match=true`. Every OpenRouter request must carry this prompt. The run also checks that the prompt has no out-of-character safety clause.
- **Scripted turns (C22).** The opener appears in `chat_log` as `user_scripted` (round 0) and is not shown. S0 and S1 equal the prereg Appendix D.1 text for the cell. They are logged as scripted assistant turns (rounds 0 and 1) with `delay_ms` and no API metadata. Neither makes an API call: the OpenRouter call count equals the number of sends minus 1. Send stays disabled until S0, a message typed earlier is not sent, and S0 and S1 each appear after their typing delay (S0: page clock from `chat_start_time`; S1: `chat_log` time stamp of message 1 to that of S1). The first API call's context is exactly system, opener, S0, message 1, S1, message 2. `script_sha256` equals the SHA-256 of S0 + "\n" + S1, computed by the harness from Appendix D.1.
- **Model replies (C7, C8, C10).** Each reply equals the mock, with `usage`, `finish_reason`, `provider`, `model_served`, `gen_id` and `latency_ms`. `user_msg_N` and `ai_msg_N` are consistent with `chat_log`. The counters `chat_total_rounds`, `chat_llm_rounds`, `chat_send_attempts`, `chat_api_error_count` and `chat_min_message_threshold_met` are correct. The injected error is logged as `system_error` and shows the Study 2 message.
- **Probes (C23).** Probe 1 sits directly below S1, probe 2 below the first reply displayed at 300 s or later, and probe 3 below the end message, with Continue hidden until probe 3 is answered. For probes 1 and 2, the run checks over 2.6 s that the countdown is paused: `CS.secs` does not change, and the displayed timer text shows "(paused)" and does not change. For probe 1 it also checks that the idle timer is paused. While a card is open, input and Send are disabled and `chatSend()` refuses to send. The countdown resumes after the answer. The IOS card has the D.3 instruction, seven pictures 1-7 in ascending order labeled You and Sylva, two equal circles per picture whose centre distance falls strictly from picture 1 (no overlap) to picture 7 (almost complete overlap), Next disabled until a choice, one row of 7 at 1280 px and 3 + 3 + 1 at 375 px, no horizontal overflow, and the card fully inside the chat area. In the CSV, `ios_t1`..`ios_t3` equal the answers, with `_shown_ts`, `_rt_ms`, `_elapsed` and `_round`. Also checked: `ios_t2_status='answered'`, `ios_t2_elapsed >= 300`, `ios_t3_elapsed=600`, and `chat_probe_seconds` equal to the sum of the open times.
- **Vignettes (C26).** The vignette 2 text equals D.4 and §6.14. The nine §6.14 items and `v2_severity` are verbatim, on the 5-point vignette-1 scale. All ten `v2_*` values are recorded. `v2_item_order` equals the presented DOM order, `v2_page_ms` is 10000 or more, and `v2_items_page_ms` is recorded. The vignette 1 text and its 12 items are identical to the Study 2 code, and `liab_1`..`liab_12` are recorded.
- **Other new text.** The D.2 notice appears after the self-disclosure box. The MC page has `mc_e_energetic` and `mc_length` with the §6.4 wording. The `prior_sylva` wording follows §4.2. In the debrief, the D.5 sentence follows the "both scenarios were fictional" sentence directly, and 988, CAPS, OHRPP and the withdrawal text are present.
- **Recorded responses.** Every response entered (radios, checkboxes, text, age 20) is stored unchanged.
- **Study 2 columns.** The run derives the column list from the Study 2 code: 188 columns. It also takes the columns present in every Study 2 raw header: 184 columns from 152 files. Each raw file is read in 128-byte chunks only up to its first line break; no value row is parsed, printed or stored. Every one of these must be present, except the four removed by design in C5 (`manipulated_trait`, `condition_level`, `held_constant_1`, `held_constant_2`), which must be absent. The conditional columns are also allowed to be missing: `attn1_retry*` (present in the mobile run), `idle_pause_count` and `atlas_detected`.
- **Partial data (C12).** The run checks that the code produced `..._PARTIAL.csv` checkpoint keys at consent, at every page render, at the chat end and at each probe. The staged consent record has `completed=false` and `checkpoint_stage`. A completed session sends no partial beacon. The abandon run checks the exit beacon and the close beacon.
- **Upload and redirect.** The mock Pavlovia session opens once, at load. There is one results upload with the final key and one close with `isCompleted=true`. In local mode no request goes to pavlovia.org and the CSV is downloaded. The SONA redirect comes after the upload, with `experiment_id`, `survey_code` = SONA ID, and the token present and equal to the code constant. The stored CSV equals the in-page builder output (after CRLF normalization).
- **Late reply (mobile run, C11 with C23).** The reply to the last message arrives after the time-out: it is shown directly above the open probe-3 card (the card stays last), the message box and Send stay disabled, and the final record has it in `chat_log` with `after_end=true` and `displayed=true`, in `ai_msg_<round>`, with `chat_after_end_replies = 1`.
- **Hygiene.** The run audits network requests: every non-loopback request seen by the Network domain must have been mocked or blocked, and none may pass through. A browser-level target audit (`Target.setDiscoverTargets`) checks that the experiment's browser context had exactly one page and no worker, service worker or out-of-process frame, so no request could bypass the page-level interception (Chrome's own component-extension and browser-UI targets run outside that context, behind the dead proxy, and are only listed). Blocked requests must be zero. The page must throw no uncaught exception, log no unexpected console warning or error, and open no unexpected dialog. The CSV must hold no API key or credit token. At the end, the harness counts secret occurrences in every file it wrote or ships; the count must be zero.

## Last full run

2026-10-15, `EXPERIMENT_VERSION = 'study3-v0.2.1-2026-10-15-staging'`, headless Chrome 155, 17 runs: **2,296 checks passed, 0 failed**. Every run completed. Network: every request went to the local server or a mock; 0 requests blocked, 0 passed through. Secret scan of the 35 files this harness wrote or ships: 0 with the key or token. Details: `output/summary.json`.

## Outputs

- `output/<cell>_<order>.csv`: the final CSV as uploaded (the multipart `value` field). Line breaks inside fields are CRLF because of the multipart encoding.
- `output/HighA_LowE_bonding_first_mobile375.csv`: the downloaded CSV, with LF line breaks.
- `output/abandon_LowA_LowE_impression_first_PARTIAL.csv`: the exit-beacon record.
- `output/<run>.checks.json`: every check, plus the run's network summary, timings, probe layout, console output, problems and notes.
- `output/summary.json`: all runs together.
- `screenshots/`:
  - `S0_<cell>_desktop_1280x800.png` for each cell
  - `ios_probe1_desktop_1280x800.png` and `ios_probe1_mobile_375x812.png`
  - `slider_probe1_desktop_1280x800.png`
  - `v2_vignette_*.png`, `v2_items_*.png` (full page) and `debrief_*.png` (full page), each at both sizes
  - `FAIL_<run>.png` only after a harness error

All chat text, open-ended text and IDs in these files are synthetic. No Study 1-2 participant data is used.

## Secrets

`experiment.js` contains the OpenRouter key and the SONA credit token. The harness reads them only in memory, to compare them with the `Authorization` header and the redirect `credit_token` (booleans). It never prints or writes them. Request headers and the redirect query string are never logged.

## Notes

- **Chrome flags.** With `--disable-extensions`, headless Chrome 155 on macOS exits (code 0) a few seconds after launch, so the harness does not use that flag. Chrome's component extensions cannot reach the network because of the dead proxy.
- **Mobile run.** It uses Chrome's mobile emulation (viewport, user agent, touch), not Safari on iOS. Layout and touch behavior follow Chrome's engine.
- **Mock replies.** They are short and synthetic. The run does not test the model's behavior, reply length or `finish_reason='length'` handling.
