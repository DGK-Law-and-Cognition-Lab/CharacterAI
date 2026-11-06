# Study 3 experiment: changelog

Source: `Analysis/Study 2/experiment/` (Study 2 deployment, `experiment.js` 824 lines, MD5 `d71548311ddd715a8aebf491a3a7465c`), copied unchanged on 2026-10-14. Spec: preregistration draft revision 2, `Docs/Preregistration/Study3_Preregistration_Update_DRAFT_2026-10-01.md` (cited as §, App. A/C/D). "S2 L" = Study 2 line; "S3 L" = line in this folder's `experiment.js`. In the build part 1 table, S3 L refers to v0.1 (1,111 lines); in the build part 2 table, to v0.2.1 (1,425 lines).

Status: **build parts 1 (core) and 2 (revision-2 features) done**; build part 2 re-run and re-verified on 2026-10-15, `EXPERIMENT_VERSION = 'study3-v0.2.1-2026-10-15-staging'`. Not deployed. No data collected. All new participant-facing text is DRAFT wording pending PI sign-off (constants marked `[PI SIGN-OFF NEEDED]`). Secrets: the OpenRouter key [key present] and the SONA credit token [token present] are carried over unchanged, by PI decision, and appear in this folder only in `experiment.js`, once each (count-only scan of this folder and the IRB draft folder, 2026-10-15). The same scan found one more copy of both values in the session scratchpad, in `backup_v02/experiment.js`, a byte-identical backup of v0.2 made by a later workflow step on 2026-10-14. That copy should be deleted (open question 11).

## Files

| File | Change |
|---|---|
| `index.html`, `captcha.png` | Copied, unchanged (MD5 identical to Study 2). |
| `style.css` | Build part 2: probe-card rules (C23) appended after the unchanged Study 2 rules. v0.2.1: fixed IOS grid breakpoints (row 49). |
| `config.json` | C17: new Pavlovia project placeholder (below). |
| `experiment.js` | Build part 1 and build part 2 changes (below). |
| `worker/counterbalance_worker.js`, `worker/wrangler.toml.example`, `worker/README_worker.md` | New: Worker source for C3, C4, C25 (order), C27. Not deployed. Unchanged in build part 2. |
| `dev_tests/static_checks.js`, `dev_tests/worker_test.mjs`, `dev_tests/e2e_mocked.js` | New: offline tests (no network). Not needed on Pavlovia. `static_checks.js` and `e2e_mocked.js` extended in build part 2; `e2e_mocked.js` expects the v0.2.1 version string. |
| `test/` (`run_e2e.mjs`, `lib/`, `README_test.md`, `output/`, `screenshots/`) | Added after build part 2 by the workflow's test step: a CDP end-to-end harness with no npm packages. Code unchanged by the build re-run; re-run on v0.2.1, which regenerated `output/` and `screenshots/`. Not needed on Pavlovia. |
| `README.md` | New: placeholders and TODO constants for the PI. Build part 2 adds the design switches. |

## experiment.js, build part 1

| # | App. C / item | Change | S2 L | S3 location | Prereg |
|---|---|---|---|---|---|
| 1 | C1 | `STUDY_MODE = '1d'` (new code for the 2 x 2; '1b' kept as the superseded May 7 two-arm config). Header and mode comments updated. | L1-16 | L1-21 | §3.1, §3.3, Change 21 |
| 2 | C1 | `STUDY_CONFIGS['1d']`: four cells `HighA_HighE`, `HighA_LowE`, `LowA_HighE`, `LowA_LowE` (id 1-4, `a_level`, `e_level`, `a_block`, `e_block`), `nBlock: 'MOD_LOW_N'`, `orders: ['impression_first','bonding_first']`. Configs 1a, 1b, 1c unchanged. | L115-140 | L215-235 | §3.1, §3.3, §5 |
| 3 | C1 | `buildPersonalityPrompt(cond)`: for `design==='2x2'` emits `HOW YOU BEHAVE IN CONVERSATION:`, blank line, A block, blank line, E block, blank line, MOD_LOW_N. Legacy branch unchanged. New `buildSystemPrompt(cond)` = `SYLVA_BASE_S3` + blocks. New `cellByName()`. | L143-154, L360 | L237-276 | §3.4 |
| 4 | C2 | New `SYLVA_BASE_S3`: `SYLVA_BASE` with only the fourth rule replaced by "Every reply is about 4 sentences and 70-100 words. Be conversational and natural." `SYLVA_BASE` itself unchanged. | L61 | L128-134 | §3.4, Change 3 |
| 5 | C2 | New `TRAIT_BLOCKS` keys `HIGH_E_S3`, `LOW_E_S3`, verbatim §3.4 text. May 7 `HIGH_E`/`LOW_E` keys left in place, unused. All other blocks byte-identical. | L80-103 | L168-173 | §3.4, Change 2 |
| 6 | C5 | `EXPECTED_PROMPT_SHA256` with the four App. A hashes. Verified: the four assembled prompts reproduce App. A exactly (length and SHA-256), and HighA_HighE equals the full text printed in App. A. | — | L265-272 | App. A, §3.4 |
| 7 | C3 | Assignment moved from page load to submission of the SONA ID page. `fetchCondition(code,isTest)` calls `GET /assign?study=<code>`; accepts only `{study===code, cell in 4 cells}`; `order` taken from the Worker if valid, else drawn by the client (`order_source='client'`); 10 s timeout (AbortController). On any failure or a rejected response: uniform draw over the 4 cells and an independent .5 draw of order, `cb_source = order_source = 'fallback_random'`, `cb_error` recorded. | L804-815, L819 | `fetchCondition` L1021 | §3.3 |
| 8 | C3 | `assignCondition(pid)`: reuses an assignment stored in `sessionStorage` (`cb_assignment_<code>`) after a reload in the same tab, so a reload never takes a second slot; otherwise calls the Worker and stores the result. Never rejects. | — | L1048 | §3.3; readiness 2.10 |
| 9 | C3, C5 | `applyAssignment()`: sets `ST.condition`, `ST.order`, `ST.systemPrompt`; records `cell`, `condition_id`, `condition_label` (= cell), `a_level`, `e_level`, `a_block`, `e_block`, `n_block`, `order`, `order_source`, `cb_source`, `cb_slot`, `cb_study_code`, `cb_error`, `cb_fetch_ms`, `cb_fetch_ts`, `cb_reused`, `cb_first_session_uuid`, `is_test_session`, `system_prompt`, `system_prompt_sha256` (`crypto.subtle.digest('SHA-256')`), `system_prompt_sha256_match`. The condition recording formerly in `buildAll()` moved here. | L357-369 | L1068 | §3.3, §5, §6.12 |
| 10 | C3 | SONA ID page `val`: on first submit records `sona_id`, disables Next, makes the ID read-only, runs `assignCondition()` and renders the next page when it resolves (page HTML unchanged). | L447-449 | L627-638 | §3.3, §3.6 step 6 |
| 11 | C3 | Init IIFE no longer fetches a condition before `buildAll()`. | L817-824 | L1104 | §3.3 |
| 12 | C3 | `reload_count` (page loads earlier in this tab, from `sessionStorage`). | — | L298, L544 | readiness 2.10 |
| 13 | C4 | TEST routing: SONA ID matching `/^test/i` (URL-filled or typed) calls the Worker with `study=1d_test`, `cb_source='test'`, `order_source='test'`; on Worker failure the session stays `cb_source='test'` and an investigator-only `alert()` appears (readiness 2.13). The participant counter is never called. | L804-815 | L36-37, `fetchCondition`, `assignCondition` | §3.3 (TEST), §9.2 rule 1 |
| 14 | C5 | Recorded per session in `buildAll()`: `study_id = 3`, `experiment_version`, `max_tokens` (`CHAT_API.maxTokens`), `api_endpoint` (`CHAT_API.apiUrl`). No longer written: `manipulated_trait`, `condition_level`, `held_constant_1`, `held_constant_2`. `study_mode`, `model`, `temperature`, `start_time` unchanged. | L357-372 | L533-552 | §5, §6.12, Change 21 |
| 15 | C5 | `EXPERIMENT_VERSION = 'study3-v0.1-2026-10-14-staging'`, `STUDY_ID = 3`. | — | L24-26 | §6.12, §11.1 |
| 16 | C7 | `CHAT_API.send` passes `(text, usage, meta)`; `meta` = `finish_reason`, `native_finish_reason`, `provider`, `model_served` (served `model`), `gen_id` (generation `id`), `latency_ms` (`t0` set immediately before `xhr.send`). Stored on every assistant `chatLog` entry (greeting and replies) via `addReplyMeta()`; the greeting entry now also stores `usage`. | L44-51, L267-269, L290-292 | L98-118, L407-410, L433-436, L454 | §6.12 (per-reply metadata) |
| 17 | C8 | Every failed API call is pushed to `chatLog` as `{role:'system_error', content, error_type, http_status, latency_ms, ts, round, elapsed}` by `logApiError()`; `chat_api_error_count` recorded. `send()` now calls exactly one callback per request (Study 2 could call `onError` twice on a timeout); a client-side exception in the reply handler is reported as 'Client error'. Participant-facing error texts unchanged. | L45-50, L274-278, L295-298 | L106-117, L416, L445, L457-463 | §3.6 step 13, §6.12 |
| 18 | C10 | `CS.okRounds` (successful exchanges) and `CS.llmRounds` (exchanges answered by the model) incremented in the success callback; `chat_total_rounds = CS.okRounds`, `chat_send_attempts = CS.rounds`, `chat_llm_rounds = CS.llmRounds`; `chat_min_message_threshold_met` uses `CS.okRounds >= 8`. | L240, L286, L337-340 | L377-379, L439, L503-506, L514-524 | §6.9, §6.12 |
| 19 | C11 | `CS.ended` set in `chatEnd()`. A reply arriving after the end is pushed with `after_end:true` and `displayed` (chat page still open), shown if the chat page is open, and does not re-enable Send (Study 2 re-enabled it). A failure after the end is logged without the retry message. `serializeChat()` rewrites `chat_log`, `user_msg_*`, `ai_msg_*` and the counters and is called in `chatEnd()`, `chatFinish()`, `buildFlat()` (so `submitData()` and every checkpoint). `chat_after_end_replies` recorded. `chatMsg()` returns if the chat area is gone. | L291-294, L301-302, L333-344, L791-797 | L437-448, L465, L496-526, L983-996 | §6.9, §6.12 |
| 20 | C12 | `checkpoint(stage)`: builds the full record (`buildFlat()`), adds `checkpoint_stage`, `checkpoint_ts`, and stages it in `PAVLOVIA._lastCSV` / `_lastKey` = `data/char-ai-study_<pid>_SESSION_<ts>_PARTIAL.csv` without closing the session. Called on every page render (`render()`), after consent, and at the end of the chat. `completed=false` from load; `rec('completed', true)` in the debrief page's `val`. | L28, L178-180, L333-342, L781-783, L791 | L316, L508, L546, L621, L973, L1000-1009 | §6.12 (Partial data) |
| 21 | C12 | Exit beacon: `PAVLOVIA.sendPartial()` (same two beacons as the Study 2 unload handler: results upload, then close with `isCompleted=false`), bound to `pagehide` (skipped when `persisted`) and `unload`, sent at most once. `pagehide` added because browsers are retiring `unload`. | L28 | L72-77 | §6.12 |
| 22 | C12 | `PAVLOVIA.toCSV()` and `PAVLOVIA.stamp()` split out of `save()` (same CSV and timestamp code); `buildFlat()` shared by `submitData()` and `checkpoint()`. Upload logic in `save()` unchanged. | L29, L791-797 | L79-83, L983-996 | — (refactor for C12) |
| 23 | C13 | SONA credit redirect built from `SONA_EXPERIMENT_ID` and `SONA_CREDIT_TOKEN_TODO` (top of file, marked TODO; current values kept, so the URL is byte-identical, verified in the mocked run). | L194 | L44-48, L330-331 | Change 21; App. C13, C18 |
| 24 | C14 | Consent link from `CONSENT_URL_TODO` (current Study 1 Box link kept; page HTML byte-identical). | L440 | L50, L619-620 | §11.3; App. C14 |
| 25 | C17 | `PAVLOVIA.init` stops before contacting Pavlovia while `gitlab.projectId` starts with `TODO` (local-download mode). See `config.json` below. | L28 | L68-69 | Change 21; App. C17 |
| 26 | 2.2 | Age must be a whole number 18-100 (`AGE_VALIDATION_ENABLED`, `AGE_MIN`, `AGE_MAX`, `ageValid()`); the existing message "Please answer all questions." is shown unless the PI sets `AGE_ERROR_TEXT`. **Conflicts with prereg §6.12 and Change 18** ("The form does not validate age"): see open questions. | L702-706 | L52-60, L301, L896-897 | §9.3 (analysis rule 18-100) |
| 27 | 2.12a | `session_uuid` (`crypto.randomUUID`, v4 fallback), `consent_ts` (ISO time when consent is given), `pid_url` (SONA ID from the URL), `pid_mismatch` (typed ID differs from the URL ID); SONA ID sanitized (`[A-Za-z0-9_-]`, max 64) in the Pavlovia file key (`PAVLOVIA.safePid`). Key prefix `data/char-ai-study_` unchanged. | L29, L353, L441, L449 | L82-83, L290, L296, L543-545, L621, L635 | readiness 2.12a |
| 28 | 2.6 | **Not implemented.** The prereg registers "No automatic regeneration. Every reply returned by the API is shown to the participant as received" (§3.4, §1.2 item 4); the readiness-audit guard is only a `[CONFIRM]` alternative. `finish_reason` is logged per reply (C7), so E10 can count `length` truncations. | L290-294 | — | §3.4 |
| 29 | — | Stale comment "CONDITION DEFINITIONS (2x2x2 = 8 conditions)" corrected. | L56 | L123 | readiness 1.2 |

Unchanged by design after build part 1 (verified by `dev_tests/static_checks.js`): all 51 pages' HTML, timers and flags are byte-identical to Study 2 (same page count and order); handler code differs only on Consent (consent_ts, checkpoint), SONA ID (assignment), the chat page (`chatInit`), Demographics Q4-6 (age check) and Debriefing (`completed`). All Study 1-2 trait blocks, `SYLVA_BASE`, `SYLVA_BACKSTORY`, item wording, vignette 1 and its 12 items, the opener text, model, `max_tokens` 400, temperature 0.7 and the 90 s timeout are unchanged.

## experiment.js, build part 2 (revision-2 features)

All new participant-facing text sits in one block near the top of `experiment.js` ("STUDY 3 NEW PARTICIPANT-FACING TEXT"). Each constant is marked `// [PI SIGN-OFF NEEDED]` with its source (prereg Appendix D.x, or §6.4 / §4.2 / §11.3 where Appendix D has no text). The constants were generated from the prereg file, not retyped, and `static_checks.js` compares them with the prereg verbatim. The design switches are in the block above it ("STUDY 3 DESIGN SWITCHES").

| # | App. C / item | Change | S2 L | S3 L (v0.2) | Prereg |
|---|---|---|---|---|---|
| 30 | C5 | `EXPERIMENT_VERSION = 'study3-v0.2-2026-10-14-staging'`; `'study3-v0.2.1-2026-10-15-staging'` after the re-run (row 49). | — | L25 | §6.12 |
| 31 | — | Two new sections near the top. (1) Design switches: `PROBE_FORMAT = 'ios'` (`'ios'` or `'slider'`), `PROBE2_ACTIVE_S = 300`, `INCLUDE_V2_SEVERITY = true`, `INCLUDE_MC_E_ITEMS = true`, `INCLUDE_PRIOR_SYLVA = true`, and the typing-delay constants with `scriptDelayMs()`. (2) New participant-facing text (rows 32-47). | — | L64-197 | App. D |
| 32 | C22 | `CHAT_OPENER` (the unchanged Study 1-2 opening message, now a constant). `SCRIPTS[cell] = {S0, S1}` for the four cells, App. D.1 verbatim (word counts 87/73, 85/84, 84/80, 87/77, as in the D.1 table). `SCRIPT_VERSION = 'D1-rev2-draft-2026-10-01'`. `EXPECTED_SCRIPT_SHA256` holds the SHA-256 of S0 + "\n" + S1 (the App. D.1 definition) computed from the draft texts: HighA_HighE `466e7e92…`, HighA_LowE `9a0c6f60…`, LowA_HighE `f1f3dbef…`, LowA_LowE `50863588…`. App. D.1 has no hashes yet. | L262 (opener) | L96-125 | §3.4, §6.12, App. D.1 |
| 33 | C22 | `chatInit` no longer calls the API for the greeting. The opener is pushed to `ST.chatHistory` as the first user turn. Study 1-2 sent it only with the greeting request, so later calls lacked it. The opener goes to `chat_log` as `{role:'user_scripted', content, round:0, ts}` and is recorded as `chat_opener`. S0 is shown by `chatScriptedTurn('S0',0)` after the typing delay, and Send stays disabled until then. The greeting-failure path ("Connection issue. Please try refreshing.") is removed, because C6 and C9 are superseded. | L259-279 | L540-558 | §3.4, §3.6 step 13 |
| 34 | C22 | `chatScriptedTurn(slot, round)` shows the "Sylva is typing..." indicator for `scriptDelayMs(text)` and makes no API call. The delay is clamp(1500 ms + 8 ms × characters, 2-6 s), the same formula for every cell and both slots; for the draft texts it is 4.6-4.8 s. The function then pushes the text to the model context as an assistant turn and to `chat_log` as `{role:'assistant', scripted:true, script_slot, round, ts, elapsed, delay_ms}`. S1 increments `CS.okRounds` but not `CS.llmRounds`. | — | L564-578 | §3.4, §6.9, §6.12 |
| 35 | C22 | `chatSend`: the participant's first message is answered by S1 (round 1) with no API call. From message 2 on, the model replies with the context: system prompt, opener, S0, message 1, S1, then later turns. | L281-299 | L580-613 | §3.4 |
| 36 | C22 | `applyAssignment` records `script_version`, `script_sha256` (`crypto.subtle`; the S0 + "\n" + S1 texts of the cell that `chatScriptedTurn` shows) and `script_sha256_match`. | — | L1404-1410 | §6.12, App. D.1 |
| 37 | C23 | `showProbe(k)` appends a card to `#chatArea` below the latest message, disables the message box and Send, and sets `CS.probeOpen`. A response is required: Next stays disabled until one is given. When the card is shown, the function records `ios_tK_shown_ts`, `ios_tK_elapsed` (active seconds) and `ios_tK_round` (participant messages so far). On Next it records `ios_tK` (1-7) and `ios_tK_rt_ms`, removes the card, shifts the idle clock (`CS.lastActivity`) by the time the card was open, and calls `checkpoint('probe_K')`. | — | L699-742 | §6.12, §6.13 |
| 38 | C23 | `chatTick` returns early while `CS.probeOpen`, which pauses both the countdown and the idle timer. The timer shows the existing "(paused)" display. | L240-257 | L637-640 | §3.6 step 13, §6.13 |
| 39 | C23 | Triggers: probe 1 directly after S1. Probe 2 in the model-reply callback, after the first reply displayed at ≥ `PROBE2_ACTIVE_S` (300) active seconds, once probe 1 has been shown. Probe 3 in `chatEnd` after the end message; the Continue button appears only after it is answered. `ios_t2_status` is `'answered'` or `'not_triggered'` (set in `chatEnd`). | L281-299, L333-342 | L575, L604, L663-678 | §3.6 step 13, §6.13 |
| 40 | C23 | `chatMsg`: while a card is open, a new bubble (for example a reply that arrives at time-out) is inserted above the card, so the card stays below the latest message. `serializeChat` records `chat_probe_seconds`, the total time the cards were open, in 0.1 s steps. | L301-302, L333-344 | L626-635, L693 | §6.9 |
| 41 | C23 | `probeIosHTML` draws seven inline-SVG pairs of circles labeled You and Sylva, from 1 (separate) to 7 (almost complete overlap), in ascending order. The labels have a white outline so the circle lines do not hide them. The `.ios-grid` CSS grid has fixed breakpoints (since v0.2.1, row 49): one row of 7 in windows 760 px wide or more, 4 + 3 from 440 to 759 px, and 3 + 3 + 1 below 440 px (for example 375 px), always in ascending order. `probeSliderHTML` (`PROBE_FORMAT='slider'`) is a 1-7 range with the numbers 1-7 under the track, the two D.3 end labels and no default position: the thumb is hidden, there is no filled track, and Next is disabled until the participant clicks or moves the slider. The submit button reuses the existing label "Next →". | — | L745-773; `style.css` L41-69 | App. D.3 |
| 42 | C24 | "Getting Ready to Chat": `PRECHAT_PROBE_NOTICE` (App. D.2 verbatim) is appended as a paragraph after the self-disclosure instruction box. The rest of the page HTML is unchanged. | L508-515 | L964-974 | §3.6 step 12, App. D.2 |
| 43 | C25 | Page identifiers: `addPages(builder, ids, cond)` tags every page with `pid`. `render()` appends the `pid` of each page actually shown to `ST.pageSeq`, which is recorded as `page_sequence` (separated by ';'). `order` and `order_source` were already recorded at assignment in part 1. | L178-180 | L438, L455, L810-843 | §6.12 |
| 44 | C25 | Counterbalanced block: the impression block (TIPI-Bot, MC) is pushed both before and after the bonding block (PSR, EC, Trust). The first copy has the cond `order !== 'bonding_first'`, the second `order === 'bonding_first'`, and both copies have identical pages. `impression_first` is the Study 1-2 order. ET, MA and MP follow in both orders. | L384-388 | L818-825, L843 | §3.6 steps 15-17, App. C25 |
| 45 | C26 | `buildVignette2()`, after `buildOpenEnded()`: a vignette page (App. D.4 text in the vignette-1 page frame, `timer:10`), then `mkItemPage('Questions About the Scenario', <vignette-1 lead-in>, V2_ITEMS + v2_severity, mkS5b, 'err-v2')` in randomized order. It records the nine §6.14 items (`v2_resp_*`, `v2_cause_*`, `v2_oblig_*`), `v2_severity`, `v2_page_ms` (time on the vignette page), `v2_items_page_ms` and `v2_item_order` (presented order). `V2_ITEMS` is the §6.14 table verbatim. Draft C (vignette brief §7.3) and its D.5 variant are kept as commented constants. | after L669; L393 | L139-167, L831, L1134-1156 | §3.6 step 19a, §6.12, §6.14, App. D.4 |
| 46 | C16 | `INCLUDE_MC_E_ITEMS = true` adds `mc_e_energetic` and `mc_length` (§6.4 wording) to the MC page, on the same page and scale and in the same random order. `INCLUDE_PRIOR_SYLVA = true` adds `prior_sylva` (§4.2 wording; Yes / No / Not sure, stored as the label) on its own page after Q25-28 and before the AI-use page; its error text reuses "Please answer." from the AI-use page. The prereg gives the wording and marks all three items "adopted here `[CONFIRM]`", so the switches are on. Setting them to `false` restores the Study 2 pages exactly. | MC page; demographics | L77-81, L169-174, L1017-1024, L1258-1263 | §4.2, §6.4, §9.2 rule 9 |
| 47 | C15, C30 | Debrief: the Study 2 text is unchanged. Inserted after its "Important note" paragraph: "What We Varied" (the warmth and extraversion versions; that a cold Sylva was not a response to the participant; the scripted first two messages; the closeness question and the question order); "About the Scenarios" ("Both scenarios you read about a chatbot user were fictional.", followed directly by the App. D.5 sentence verbatim); "Withdrawing Your Data"; and "If You Experienced Discomfort" (988, CAPS, 911). Inserted after the investigator contact: the OHRPP contact. The C15 wording is not in App. D; it is taken from `Docs/IRB/Study3_Amendment_DRAFT_2026-10-14/Study3_Debrief_DRAFT.md` so that the code and the IRB amendment agree. | L781-790 | L176-197, L1274-1280 | §11.3, App. D.5 |
| 48 | — | `buildAll` records the build's design switches for every session: `probe_format`, `v2_version`, `v2_severity_included`, `mc_e_items_included`, `prior_sylva_included`. | — | L798-803 | — |
| 49 | C23 | Build part 2 re-run (v0.2.1). The `.ios-grid` rule `repeat(auto-fit,minmax(70px,1fr))` gave 6 + 1 or 5 + 2 rows of IOS pictures in windows about 600-720 px wide (for example a laptop browser at half screen width), which breaks the single ascending row. It now has fixed breakpoints: 7 columns at 760 px or more (73-78 px per picture), 4 columns from 440 to 759 px (68-133 px), and 3 columns below 440 px (53-92 px; 3 + 3 + 1 at 375 px as before). Only the CSS and one comment in `probeIosHTML` changed; the probe logic, texts and recorded fields are unchanged. `EXPERIMENT_VERSION` raised to `study3-v0.2.1-2026-10-15-staging`. | — | `style.css` L44-49; L25, L753-754 | App. D.3, §6.13 |

Unchanged by design after build part 2 (verified by `dev_tests/static_checks.js`):

- **Study 2 pages:** every Study 2 page is still present, in the Study 2 order, with byte-identical HTML, timers and flags. The only exceptions are the C24 notice and the C15/C30 debrief blocks; removing them gives the Study 2 HTML exactly. With the C16 switches off, the MC page is identical to Study 2 too.
- **New pages:** the second copy of the impression block (2 pages), vignette 2 (2) and `prior_sylva` (1), for 56 pages in all. Each order shows every page once.
- **Handler code** differs from Study 2 only on the part 1 pages plus the new `cond` on the TIPI-Bot and MC pages.
- **Unchanged:** `mkItemPage`, vignette 1 and its 12 items, and all Study 1-2 item wording. The word excluded by hard rule 6 occurs only in the two existing items (liab_2, ma_8).

## config.json (C17)

`experiment.name = "study3-warmth-extraversion"`, `experiment.fullpath = "characters/study3-warmth-extraversion"` (placeholder name), `gitlab.projectId = "TODO_NEW_PROJECT_ID"`. Study 2's project `characters/study-3` (projectId 518708) is no longer referenced. See `README.md`.

## Worker (C3, C4, C25 order, C27)

`worker/counterbalance_worker.js`: `GET /assign?study=<code>` returns `{study, cell, order, slot, block, position}`; permuted blocks of eight (4 cells x 2 orders, each block a fresh `crypto.getRandomValues` Fisher-Yates permutation); one Durable Object per study code (`1d`, `1d_test` separate, both from 0); assignments serialized with `blockConcurrencyWhile`; per-slot log (no participant identifiers); admin-only read endpoints `/status` and `/log` that never assign; optional `ALLOWED_ORIGINS`, `COUNTER_EPOCH`. Bindings: `COUNTER` (Durable Object, class `CounterDO`), secret `ADMIN_TOKEN`, vars `ALLOWED_STUDIES`, `ALLOWED_ORIGINS`, `COUNTER_EPOCH`. Deployment and the zero-slot check: `worker/README_worker.md`.

## Build part 2 re-run (2026-10-15)

The workflow ran build part 2 again ("Try again"). The v0.2 build already held every part 2 feature, so the re-run checked each item against the prereg instead of rebuilding it. One layout fix was made (row 49).

| Item | Prereg requirement | Found in the code (v0.2.1) |
|---|---|---|
| C22 | S0/S1 per cell, App. D.1 verbatim; S0 after the typing delay and S1 in reply to message 1, no API call; both as assistant turns in the context; `script_version`, `script_sha256` (§5, §6.12, D.1) | `SCRIPTS`, `chatInit`, `chatScriptedTurn`, `chatSend`, `applyAssignment`. Static check: texts, word counts and hashes match D.1. Harness: API calls = sends - 1; first context = system, opener, S0, message 1, S1, message 2. |
| C23 | Card in `#chatArea`, input disabled, countdown and idle timer paused; probe 1 after S1, probe 2 after the first reply at >= 300 s, probe 3 at zero before Continue; `ios_t1`-`ios_t3`, `_shown_ts`, `_rt_ms`, `_elapsed`, `_round`, `ios_t2_status`; IOS = 7 pairs labeled You/Sylva, ascending; slider alternative (§3.6 step 13, §6.12, §6.13, D.3) | `showProbe`, `chatTick`, `chatSend`, `chatEnd`, `probeIosHTML`, `probeSliderHTML`, `PROBE_FORMAT`. Harness: every trigger, pause, field and the 375-px layout. Offline layout sweep 320-1280 px (v0.2.1): ascending order, card inside the chat area with Next visible, no horizontal overflow at any width. |
| C24 | D.2 sentence after the self-disclosure instruction | `PRECHAT_PROBE_NOTICE` after the instruction box; page otherwise byte-identical to Study 2. |
| C25 | Impression block, bonding block, impression block with `cond`; `order`, `order_source`, `page_sequence` (§3.6 steps 15-17, §6.12) | `addImpressionBlock` twice around the bonding block; `ST.pageSeq`. Static check and harness: both orders show every page once. |
| C26 | Vignette page (10-s minimum), then the nine §6.14 items on one page with `mkS5b`, randomized, identical wording per party; `v2_severity` optional; `v2_page_ms` (§6.12, §6.14, D.4) | `buildVignette2`, `V2_ITEMS`, `INCLUDE_V2_SEVERITY = true`, `v2_item_order`; Draft C commented. Static check: verbatim against §6.14 and the brief §7.3. |
| C30 | D.5 sentence directly after "both scenarios were fictional" | `DEBRIEF_S3_SCENARIOS_HTML`. |
| C16 | `prior_sylva` (§4.2), `mc_e_energetic`, `mc_length` (§6.4); wording given, adopted `[CONFIRM]` | Behind `INCLUDE_PRIOR_SYLVA` and `INCLUDE_MC_E_ITEMS`, both `true` because the prereg gives the wording. |
| C15 | Manipulation explanation, AI model note, right to withdraw, investigator and OHRPP contacts, CAPS and 988, both scenarios fictional (§11.3) | Study 2 debrief kept; the missing elements inserted, worded as in `Docs/IRB/Study3_Amendment_DRAFT_2026-10-14/Study3_Debrief_DRAFT.md`. Re-checked on 2026-10-15: all 19 inserted text segments, headings included, occur verbatim in that draft. The draft's other sections (purpose, AI-model paragraph, "Why We Didn't Fully Explain This Earlier", "What Happens Next", Holyoak contact, "Please Keep the Details to Yourself") are not in the code (open question 5). |
| Hard rules 4-6 | App. D texts as marked constants; Study 1-2 material byte-identical; no out-of-character clause; the excluded word only in existing items | Static checks 73/73 (below). |

## Tests run (2026-10-14 and 2026-10-15; no request left the machine)

Build part 1 (v0.1): static checks 29/29, Worker 19/19, end-to-end 78/78 (see the part 1 summary). Build part 2 (v0.2), all re-run on the final files:

- `node --check experiment.js`: OK. `node --check worker/counterbalance_worker.js`: OK.
- `dev_tests/static_checks.js <S2 experiment.js> experiment.js <prereg .md> <vignette brief .md>`: **73/73 PASS**. Checks:
  - Page identity with Study 2, with the C24 and C15/C30 insertions removed and with the C16 switches off and on.
  - The C25 page sequence in both orders, and the placement of vignette 2 and `prior_sylva`.
  - Trait blocks, the length rule, App. A lengths and hashes, and no out-of-character clause.
  - Every new text verbatim against the prereg: D.1 scripts, word counts and hashes; D.2; D.3; D.4 = §6.14 with the nine items; v2_severity = liab_11; D.5 placement; §6.4; §4.2; Draft C.
  - Hard rule 6 word count unchanged (existing items only), and a `[PI SIGN-OFF NEEDED]` mark on each Appendix D constant.
- `dev_tests/worker_test.mjs`: 19/19 PASS (Worker unchanged).
- `dev_tests/e2e_mocked.js`: **139/139 PASS**. Headless Chrome; Worker, OpenRouter, Pavlovia and SONA mocked, every other host aborted, browser behind a dead proxy; synthetic chat only. The Chrome profile was deleted afterwards. New or rewritten scenarios:
  - **S1 (LowA_HighE, bonding_first, desktop width):**
    - S0 and S1 come with no API call, with the typing delay and Send disabled until S0 is shown.
    - The `chat_log` entries for the opener, S0 and S1 are correct, and the first API call's context is system, opener, S0, message 1, S1, message 2.
    - Probe 1 sits directly below S1. While it is open, the countdown and the idle timer are paused (idle limit lowered to 1.5 s and passed) and chatSend is blocked.
    - Probe 2 follows the first reply at ≥ 300 s. Probe 3 opens at time-out with a reply pending; the late reply appears above the card, and Continue appears only after the answer.
    - All `ios_*` fields and `chat_probe_seconds` are recorded. Counters: 6 sends, 5 successful exchanges, 4 model replies, 1 error, 1 late reply.
    - `script_sha256` is correct, and `page_sequence` follows the bonding-first order.
    - Vignette 2: 10 items, `v2_item_order`, and `v2_page_ms` ≥ 10 s.
    - `mc_e_energetic`, `mc_length` and `prior_sylva` are recorded, and the debrief shows the D.5 sentence after the fictional-scenarios sentence.
  - **S10 (HighA_LowE, impression_first, 375 × 812 px):**
    - The IOS card fits with no horizontal overflow: 3 + 3 + 1 pictures, each ≥ 60 px wide, and the whole card including Next visible inside the 400-px chat area.
    - Probe 2 is not triggered (`ios_t2_status = 'not_triggered'`, no `ios_t2` fields).
    - Slider format for probe 3: D.3 texts, no default position, and Next enabled only after a click.
    - `page_sequence` follows the impression-first order.
  - S2-S9 (part 1) still pass.

Build part 2 re-run (v0.2.1, 2026-10-15), on the final files:

- `node --check` on `experiment.js` and `worker/counterbalance_worker.js`: OK.
- `dev_tests/static_checks.js`: **73/73 PASS** (unchanged checks).
- `dev_tests/worker_test.mjs`: **19/19 PASS**.
- `test/run_e2e.mjs` (full run, 15 runs: 4 cells x 2 orders at 1280 x 800, the 375 x 812 mobile run, the abandon run and 5 extra runs): **2,120 checks passed, 0 failed**. The IOS grid was one row of 7 at 1280 px and 3 + 3 + 1 at 375 px for all three probes. The final secret scan found 0 files with the key or token. Every request went to the local server or to a mock; blocked requests: 0.
- Offline layout sweep (static copy of the chat page with probe card 1, built from the real `chatHTML`, `probeIosHTML` and `style.css`; headless Chrome, `file://`, dead proxy, widths 320-1280 px set with iframes): 7 per row from 760 px, 4 + 3 from 440 to 759 px, 3 + 3 + 1 below 440 px. At every width the order was ascending, the card and its Next button were inside the 400-px chat area, and nothing overflowed horizontally.
- `dev_tests/e2e_mocked.js` was not re-run: it needs a local puppeteer install, which would require a network download. `test/run_e2e.mjs` covers the same scenarios and more.

## Notes for the analysis pipeline (C19, C20, C29)

- **Chat log.** `chat_log` now has `role:'user_scripted'` (the opener, round 0) and the scripted assistant entries S0 (round 0) and S1 (round 1), marked `scripted:true`. They have `script_slot` and `delay_ms`, and no `usage` or API metadata. As in Studies 1-2, `ai_msg_0` and `ai_msg_1` are Sylva's first two messages, but they are now the scripted S0 and S1, not model output. Exclude them from `bot_tokens_per_turn` and the bot NLP rates (§6.9, §6.10).
- **Probe fields.** `ios_t1`-`ios_t3` (integers 1-7), and for each K: `ios_tK_shown_ts` (ISO), `ios_tK_rt_ms`, `ios_tK_elapsed` (active seconds when shown) and `ios_tK_round` (participant messages sent so far). `ios_t2_status` is `answered` or `not_triggered`.
- **Probe timing.** `chat_probe_seconds` includes probe 3. `chat_end_time` is the time-out, which comes before probe 3.
- **List fields.** `page_sequence` and `v2_item_order` are separated by ';'. `v2_page_ms` is the time on the vignette-2 text page; `v2_items_page_ms` is the time on its item page.
- **prior_sylva** is stored as the text "Yes", "No" or "Not sure" (exclusion 9 uses "Yes").
- **Design switches** are recorded per session: `probe_format`, `v2_version`, `v2_severity_included`, `mc_e_items_included`, `prior_sylva_included`, `script_version`.
- **C19 (R pipeline):** Pavlovia uploads use `multipart/form-data`, which turns every LF inside a field into CRLF. The stored `system_prompt` is therefore 2,383 instead of 2,365 characters for LowA_HighE (18 CRLF); normalize `\r\n` to `\n` before re-hashing. `system_prompt_sha256` is computed in the browser on the original LF text and matches App. A. Partial records end in `_PARTIAL.csv`, have `completed=false` and `checkpoint_stage`; the final record has `completed=true`.

## Open questions for the PI (build part 2)

1. **Sign-off on all new participant-facing text.** This covers the D.1 scripts, the D.2 notice, the D.3 probe (format: IOS or slider), the D.4 vignette and its items, `v2_severity`, and D.5. It also covers the texts that are not in Appendix D: the C15 debrief blocks (taken from the IRB draft debrief), the C16 items (§6.4, §4.2), and the probe button label "Next →" (the study's existing label).
2. **Typing-delay formula for S0 and S1.** §3.4 says "computed from the text's length by the same formula in every cell (Section 6.12)", but no section states the formula. The code uses clamp(1500 + 8 ms × characters, 2-6 s), which gives 4.6-4.8 s for the drafts. Confirm it, or give the formula, and add it to §6.12.
3. **Probe count in the D.2 notice.** D.2 says "Three times during the chat", but probe 2 is not shown when no reply is displayed after 300 s (`not_triggered`), so some participants see two probes.
4. **Item order for the other rating pages.** `v2_item_order` is recorded, as the task asked. §3.6 still says the presented order is not recorded (`[CONFIRM]`, readiness 2.12) and the other rating pages do not record it. `itemOrderOf(pg.html)` could do so for every `mkItemPage` page if the PI wants this.
5. **Debrief.** The code keeps the Study 2 debrief text and inserts the §11.3 elements. The IRB draft debrief (`Docs/IRB/Study3_Amendment_DRAFT_2026-10-14/Study3_Debrief_DRAFT.md`) is a full rewrite and also has a Holyoak contact, "Why We Didn't Fully Explain This Earlier", "What Happens Next" and "Please Keep the Details to Yourself"; these were not added. Harmonize the two once the IRB approves the text. Both drafts still need the CAPS number (`[CONFIRM]` in the IRB draft) and the withdrawal deadline confirmed.
6. **Apostrophes.** The vignette-2 and `mc_length` texts use the prereg's straight apostrophes ("user's"), which is what the verbatim rule requires. Vignette 1 in the Study 2 code uses a curly one (`user’s`). Harmonize if wanted.
7. **Placement of `prior_sylva`.** §3.6 step 20 places it within the demographics on its own page, without a position. The code puts it after Q25-28 and before the AI-use page.
8. **Field interpretations.** These definitions are mine:
   - `ios_tK_round` is the number of participant messages sent so far.
   - `v2_page_ms` is the time on the vignette-2 text page; the item page time is added as `v2_items_page_ms`.
   - Probe 2 is triggered only by a model-generated reply after probe 1. In practice S1 cannot be shown at ≥ 300 s, because the idle pause stops the timer.
9. **C16 switches.** The switches are on because the prereg gives the wording and says "adopted here `[CONFIRM]`". If the PI drops the items, set `INCLUDE_MC_E_ITEMS` and/or `INCLUDE_PRIOR_SYLVA` to `false` (this gives the Study 2 pages exactly) and edit §3.6, §4.2, §4.5, §6.4 and §9.2.
10. **Script hashes.** `EXPECTED_SCRIPT_SHA256` was computed from the draft scripts. Once the texts are final, add the hashes to Appendix D.1 and update the constant together with `SCRIPTS` and `SCRIPT_VERSION`.
11. **Scratchpad copy of the credentials.** The session scratchpad holds `backup_v02/experiment.js`, a byte-identical copy of v0.2 that contains the OpenRouter key [key present] and the SONA credit token [token present]. A later workflow step made it on 2026-10-14. The build re-run did not delete it, because deleting files is left to the PI. The PI should delete it (together with the harness tool-output file noted in the part 1 summary).
12. **IOS label size.** On a full-width desktop window each IOS picture is about 78 px wide, so the "You" and "Sylva" labels render at about 8 px. In pictures 6 and 7 the "Sylva" label slightly crosses the outer circle line; a white outline keeps it legible. Check legibility when signing off D.3, or ask for larger pictures (for example 4 + 3 on desktop too).

## Fix pass v0.3 (2026-10-15/16): review findings verified and fixed

Three independent reviews (spec conformance, participant flow, data contract; two rounds) produced 58 candidate issues, about 25 distinct. Each was checked against the code and the prereg. The workflow's fix agent hit the account usage limit, so this pass was done directly.

| Fix | Issue (reviewer ids) | Change |
|---|---|---|
| FIX-1 | Age check contradicted prereg §6.12/§9.3 and stranded a minor without credit after data collection (spec F2/F1, flow F2, data DC-3/DC-2) | `AGE_VALIDATION_ENABLED = false` (registered behaviour); switch kept. Pre-consent 18+ question = PI/IRB decision. |
| FIX-2 | Debrief said "The question" (singular); participants answer 2-3 probes (spec F7, flow F8) | "The short questions ... help us see". Same edit in the IRB debrief draft. |
| FIX-3 | Pavlovia pilot-mode runs not identifiable (data DC-8/DC-10) | `pavlovia_pilot_mode` recorded (token value never stored). |
| FIX-4 | Placeholder projectId deployed = silent local download on participants' machines (spec F5, flow F12) | On a non-local host the study stops with a "not available yet" message instead. Local hosts keep local mode. |
| FIX-5 | Beacon bodies over 64 KiB are refused silently (spec F3, flow F3, data DC-2) | `sendPartial` checks the return value; falls back to a minimal record (`_PARTIAL_MIN.csv`). |
| FIX-6 | **Blocker:** partial records staged from the device check onward, i.e. before consent (spec F1, data DC-1) | Nothing staged until `consent_ts` exists. Slim partial records (no duplicate `user_msg_`/`ai_msg_`, no prompt text; hash kept; `partial_slim`). Key uses `nopid-<session_uuid>` before the SONA ID page. |
| FIX-7 | Mid-chat dropouts lost every turn after the last probe (data DC-1/DC-6, flow F4) | Checkpoint after every model reply (`chat_turn_<n>`). |
| FIX-8 | `chat_end_time` stamped before probe 3, so §6.9 wall-clock left out probe-3 time (spec F8/F5, flow F6, data DC-4/DC-5) | `chat_timeout_time` = timer at zero; `chat_end_time` = probe 3 answered. |
| FIX-9 | Slider alternative: Tab focus fired `keyup` and recorded the hidden default 4 (spec F10/F8, flow F5, data DC-10) | `keyup` removed from the answer events. |
| FIX-10 | IOS labels about 8 px on desktop (flow F9, spec F13) | Labels 9 -> 10.5 units, positions adjusted so "You" and "Sylva" never overlap. Size still a D.3 sign-off point. |
| FIX-11 | Item order recorded for vignette 2 only (spec F11/F7, data DC-5/DC-3) | `item_order_<page>` recorded for every randomized rating page. Prereg §3.6 should say so. |
| FIX-12 | `cb_slot = -1` sentinel would enter the §9.1 covariate as a real value (data DC-6) | `cb_slot` empty (NA) when no Worker slot was assigned. |
| FIX-13 | Assignment reused across SONA IDs in one tab (TEST runs never advanced the counter); reload or abort during the Worker call could consume an unmatched slot (flow F1/F10, data DC-7/DC-12, spec F10) | sessionStorage keyed by study code + SONA ID; random request id (`cb_req_id`) stored before the call and sent to the Worker; Worker returns the same slot for a repeated id (`repeat: true`) and logs `req`. |
| FIX-14 | `page_timestamps` keyed by page index; index layout differs from Study 2 (data DC-9) | `page_ids` (index -> page id) recorded. |

Not changed (and why):
- Probe 2 can open shortly before probe 3 (flow F7): this follows §6.13 as written. Flag for the prereg if a minimum gap is wanted.
- `chat_total_rounds` / `chat_min_message_threshold_met` now count successful exchanges (data DC-4): as C10 specifies; the analysis must use the Study 3 definition.
- `e_block` values are `HIGH_E_S3`/`LOW_E_S3` while §5 says HIGH_E/LOW_E (spec F6): prereg wording edit, not a code change.
- CRLF: the multipart upload turns LF into CRLF in **every** text field with a line break (system_prompt, ai_msg_N, user_msg_N, chat_log contents, OE answers), not just system_prompt (data DC-9/DC-8, spec F9). The R pipeline (C19) must normalize CRLF -> LF before hashing or counting characters.
- Needs PI/IRB/external action: D.2 "Three times" vs probe 2 being skippable (suggest "Up to three times"); typing-delay formula not in §6.12; debrief harmonization with the IRB draft; C13/C14/C17/C18 placeholders (SONA id/token, consent URL, Pavlovia project, credentials); version strings frozen at launch.

Tests on v0.3 (no request left the machine):
- `node --check` experiment.js and worker: OK.
- `dev_tests/static_checks.js`: 73/73 PASS (page identity with Study 2, verbatim Appendix D texts, prompts and hashes).
- `dev_tests/worker_test.mjs`: 24/24 PASS (5 new idempotency checks).
- `test/run_e2e.mjs`: full run, 17 runs, 2,254 checks passed. The 5 failures were a harness bug (a new check used a variable before its declaration), fixed; those 5 runs re-run: 177/177 passed. Secret scan: 0 files with the key or token. (test/output/summary.json now holds the 5-run re-run; the full-run log is in the session scratchpad.)

## 2026-10-19: PI decision 1 applied

`PRECHAT_PROBE_NOTICE` now reads "Up to three times during the chat, …" (prereg revision 3, Appendix D.2; same wording in the consent form and the IRB amendment). Probe 2 is skipped only when Sylva shows no reply between 300 s of active chat and the end; all 274 Study 1-2 sessions had such a reply. `dev_tests/static_checks.js` patterns now also accept revision-3 phrasing for D.3, §6.14 and §4.2; against revision 3: 73/73 PASS.

## 2026-10-19: v0.4, aligned with the IRB amendment documents

- Consent page: shows the full Study 3 consent form (`Docs/IRB/Amendment_Study3_2026-10-19/Study3_Consent_page_text.txt`) in a scrollable box, with a download link to `Study3_Consent.pdf` (served with the experiment files). The options now read "I consent" / "I do not consent" (values 1/2 unchanged). `CONSENT_URL_TODO` (the Study 1 Box link) is replaced by `CONSENT_URL = 'Study3_Consent.pdf'`.
- Debrief: the withdrawal paragraph now ends "You can do this until the end of the academic quarter in which you took part, when your SONA ID is replaced with a random code." It is identical to the IRB debrief document.
- `EXPERIMENT_VERSION = 'study3-v0.4-2026-10-19-staging'`.
- `dev_tests/static_checks.js` treats the consent page as an intended change and checks that it shows the IRB consent text word for word, and that the option labels are right. Result: 76/76 PASS.
- End-to-end harness on v0.4 (`test/run_e2e.mjs`, which now reads the D.2 notice from prereg revision 3): **2,347 checks passed, 0 failed, across 17 runs**. The secret scan found 0 files with the key or token.

## 2026-10-23: SONA study 3286 and Pavlovia project `characters/study-2`

- `SONA_EXPERIMENT_ID = '3286'`, and `SONA_CREDIT_TOKEN_TODO` now holds the study 3286 credit token. Both come from the completion URL the PI supplied on 2026-10-23. The variable name is kept so the tests and docs still find it. The redirect is unchanged: `webstudy_credit.aspx?experiment_id=…&credit_token=…&survey_code=<SONA ID>`.
- Stale comment on `CONSENT_URL` corrected.
- Tests now expect `experiment_id` 3286: `test/lib/checks.mjs` (2 checks) and `dev_tests/e2e_mocked.js`.
- Pavlovia, by PI decision: Study 3 goes at the root of `characters/study-2` (projectId 518701, private). The genre study keeps running in `genres/`.
  - `pavlovia_upload/config.json` now reads `characters/study-2` with projectId `TODO_AFTER_IRB_APPROVAL_518701`, so the page keeps refusing to start until approval.
  - This folder's `config.json` keeps `TODO_NEW_PROJECT_ID` for local tests.
- Results:
  - static checks: all PASS;
  - Worker tests: all PASS;
  - `test/run_e2e.mjs`: **2,347 checks passed, 0 failed, across 17 runs**, with the SONA redirect checked at 3286 in 9 runs; secret scan 0 files;
  - `test/deploy_smoke.mjs` on `pavlovia_upload/`: PASS.
- `pavlovia_upload/experiment.js` is byte-identical to this folder's.

## 2026-10-29: Study 3 Worker deployed; genre-study copy cleanup

- **Worker.** `worker/counterbalance_worker.js` was deployed as a new Worker, `study3-counterbalance`, on the PI's Cloudflare account.
  - URL: `https://study3-counterbalance.dgkamper.workers.dev`. Source SHA-256 `de0be5a0…`.
  - The Studies 1–2 Worker `counterbalance` was not changed.
  - After deployment, `/status` showed both `1d` and `1d_test` at `next_slot 0`. Record: `worker/deploy_record_2026-10-29.md`.
  - The admin password is in `~/Study3_worker_admin_token.txt`.
- **Code.** `COUNTERBALANCE_URL` now points to the new Worker. The test mocks (`test/lib/mocks.mjs`, `dev_tests/e2e_mocked.js`) follow it.
- **Prereg.** §3.3 now gives the new Worker address. The FINAL docx, pdf and md were rebuilt, and the OSF copy of the PDF was replaced; the Appendix E hashes all still match.
- **Pavlovia.** `../push_study3_to_pavlovia.sh` pushes the six upload files to `characters/study-2` and removes the genre-study copy (`genres/`, `deploy_to_pavlovia.sh`) that had been pushed there by mistake. It was tested against a local mock of the repository.
- **Results:**
  - static checks: all PASS;
  - Worker tests: all PASS;
  - `test/run_e2e.mjs`: **2,347 checks passed, 0 failed, across 17 runs**; secret scan 0 files;
  - `test/deploy_smoke.mjs`: PASS.
- `pavlovia_upload/experiment.js` is byte-identical to this folder's.

## 2026-10-30: IRB response (AM-001): study renamed "Study 1b" in IRB-facing and participant-facing text

- The IRB asked for the new study to be called "Study 1b" or "Study 2" instead of "Study 3" throughout the application, and "Study 1b" was chosen.
- **Consent page.** The consent title now reads "Study 1b: Relationships in Computer-Human Interaction", matching `Docs/IRB/Amendment_Study3_2026-10-19/Study3_Consent_page_text.txt`, which was updated with it. The consent PDF is now `Study1b_Consent.pdf` (`CONSENT_URL`), rebuilt from the revised consent docx; the old `Study3_Consent.pdf` was removed from this folder and from `pavlovia_upload/`. No other participant-facing text changed.
- **Tests and scripts.** `test/deploy_smoke.mjs`, `../push_study3_to_pavlovia.sh` and the READMEs now use the new PDF name.
- **Results:**
  - static checks: all PASS;
  - `test/run_e2e.mjs`: **2,347 checks passed, 0 failed, across 17 runs**; secret scan 0 files;
  - `test/deploy_smoke.mjs`: PASS, after fixing one escaped pattern that still named the old PDF.
- The preregistration keeps the research name "Study 3"; the IRB response letter states that both names refer to the same study.
- IRB response package: `Docs/IRB/Amendment_Study3_2026-10-19/Response_to_IRB_2026-10-30/`.

## 2026-10-30: consent download link points to UCLA Box

- `CONSENT_URL` is now the PI's UCLA Box link to the Study 1b consent PDF (Box file name `Study1b_Consent-clean.pdf`): https://ucla.box.com/s/aetncw10cuf1cijrii2lytieizvae0pv. The consent text shown on the page is unchanged.
- No PDF is uploaded to Pavlovia any more. `pavlovia_upload/` now holds five files; the push script and `test/deploy_smoke.mjs` were updated to match, and the smoke test checks that the link points to the Box copy.
- Results:
  - static checks: all PASS;
  - `test/deploy_smoke.mjs`: PASS;
  - `test/run_e2e.mjs`: **2,347 checks passed, 0 failed, across 17 runs**; secret scan 0 files.

## 2026-11-05: frozen build `study3-v1.0-2026-11-05` (after IRB approval of AM-001 on November 4)

- `EXPERIMENT_VERSION` is now `study3-v1.0-2026-11-05`; `SCRIPT_VERSION` is unchanged (`D1-2026-10-19`).
- `pavlovia_upload/config.json` projectId is now `518701`, matching the live Pavlovia config. A push with the old placeholder would have locked the live study.
- `test/deploy_smoke.mjs`: on a Pavlovia hostname, a placeholder projectId still must refuse to start. A live projectId must now start and open a Pavlovia session.
- `../push_study3_to_pavlovia.sh`: for a frozen build, it tags the commit with the version string and prints the commit hash.
- Results on the frozen build:
  - static checks: all PASS;
  - Worker tests: all PASS;
  - `test/run_e2e.mjs`: **2,347 checks passed, 0 failed, across 17 runs**; secret scan 0 files;
  - `test/deploy_smoke.mjs`: PASS.
- Worker `/status` (read-only): `1d` and `1d_test` both at `next_slot 0`.
- Record for the dated OSF note: `../FREEZE_RECORD_study3-v1.0.md`.
