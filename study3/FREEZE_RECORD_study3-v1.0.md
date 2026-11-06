# Study 3 frozen build: record for the dated OSF note

The prereg (Section 4.6) requires that the code be frozen after IRB approval, that the checks be rerun on the frozen build, and that the TEST sessions use that build. This record gives what the dated note needs. Fill in the blanks after the push and the TEST sessions.

## IRB

- Modification IRB-25-1121-AM-001 was approved on **November 4, 2026**. The approval covers Study 1a and Study 1b; Study 1b is this study.
- Approval notice: `Docs/IRB/Amendment_Study3_2026-10-19/Correspondence_for_IRB-25-1121-AM-001 (1).pdf`.
- The approved documents include `Study1b_Consent_clean`, `Study1b_Debrief.pdf` and `SONA_Posting`.
- The consent download link points to the approved consent PDF on UCLA Box (https://ucla.box.com/s/aetncw10cuf1cijrii2lytieizvae0pv).

## Frozen build (2026-11-05)

| Item | Value |
|---|---|
| `experiment_version` | `study3-v1.0-2026-11-05` |
| `script_version` | `D1-2026-10-19` (the scripted texts are unchanged since revision 3) |
| `STUDY_MODE` | `1d` |
| Pavlovia project | `characters/study-2`, projectId 518701 |
| SONA study | 3286 |
| Git commit on Pavlovia | `b6dcab1ea9846a90082e7277753db028e7f1eb82` (pushed 2026-11-05 11:23 PST; tagged `study3-v1.0-2026-11-05`) |

SHA-256 of the five files in `pavlovia_upload/` (the deployed copy, which still contains the credentials):

| File | SHA-256 |
|---|---|
| `index.html` | `a255753f61ec71387965de27f0dfe2916551c3292adcedd771a230d9c3254b64` |
| `experiment.js` | `29076533ef17710cd28c5aaf46b0b1415c8042381e13d9b8128389c07c0dd005` |
| `style.css` | `500d181826a33626d140ff1d470548775401dddfc661b02473b490e8adf59798` |
| `config.json` | `f0c8db8872a49128426c8be741f65c538e80d57a40bdbb6a8bffede876cb450f` |
| `captcha.png` | `e02af16df40b6e190d66df08928d44c509e73e007701374460e90345626304ab` |

The `experiment.js` posted on OSF has its credential constants replaced by `REDACTED` (prereg Section 11.2), so its hash differs from the one above.

## Checks on the frozen build (2026-11-05)

- Static checks (`dev_tests/static_checks.js`): all PASS. This includes the registered prompt and script hashes (Appendices A and D.1) and the consent page matching the consent form word for word.
- Worker tests (`dev_tests/worker_test.mjs`): all PASS.
- End-to-end harness (`test/run_e2e.mjs`): **2,347 checks passed, 0 failed, across 17 runs**. The secret scan found 0 files containing the key or token.
- Upload check (`test/deploy_smoke.mjs`):
  - the upload folder holds exactly the five files;
  - on a Pavlovia hostname, the page starts and opens a Pavlovia session.

## Counterbalancing Worker

- Worker `study3-counterbalance` at https://study3-counterbalance.dgkamper.workers.dev, deployed 2026-10-29.
- Source SHA-256: `de0be5a0d3984991c39eff75074a3f26bacf6f854e8d3d9e22997ddb14745893`.
- `/status`, read on 2026-11-05 (read-only, no slot used):
  - `1d`: `next_slot 0`, `assigned 0`;
  - `1d_test`: `next_slot 0`, `assigned 0`.

## Deviation and clarification to report in the dated note

- **SONA disqualifier (Section 4.2, Change 21) could not be set.** SONA study 3112, which served Studies 1–2, was removed from the SONA system when old studies were cleaned up, so it cannot be selected as a disqualifier for study 3286 (checked 2026-11-05). Prior participants are excluded instead by:
  - the consent eligibility statement ("You cannot take part if you have already taken part in an earlier study in which you chatted with a character named Sylva");
  - `prior_sylva = "Yes"` (exclusion criterion 9, Section 9.2).
- **TEST sessions use the regular run link with `?participant=TEST…`, not Pavlovia's pilot link.** They are identified by the SONA ID prefix "TEST" (`is_test_session`) and use the Worker's `1d_test` counter, as Section 4.6 specifies. `pavlovia_pilot_mode` is therefore FALSE for them.

## TEST sessions (to fill in)

- **TEST01** (2026-11-05): LowA_LowE, bonding_first, test slot 0. Its record (`data/data_char-ai-study_TEST01_SESSION_2026-11-05_14h24.48.646.csv`) was saved to Pavlovia, with no partial file left behind. Checked 2026-11-05:
  - Logging: `experiment_version` `study3-v1.0-2026-11-05`; `is_test_session` TRUE; `cb_source` test.
  - Prompt hash: `system_prompt_sha256` recomputes and equals Appendix A for the cell; `system_prompt_sha256_match` TRUE.
  - Script: `script_sha256` equals Appendix D.1 for the cell; `script_sha256_match` TRUE; S0 and S1 are word for word the registered texts.
  - Data contract: all fields of the prereg's data contract are present.
  - Chat: 18 model replies, `finish_reason` stop for all, 0 API errors; mean 108.3 words per model reply.
  - Closeness probe: answered at t1, t2 and t3 (`ios_t2_status` answered).
  - Credit redirect to SONA: to be confirmed by the PI. `d_serious` = 1 ("not serious"), as entered by the tester.
  - Total duration 167 min (the investigator left the page open); chat 600 s.

- Number per version and order, and dates: ______
- `system_prompt_sha256_match` and `script_sha256_match` TRUE in every TEST session: ______
- Outcome of the length criterion and of the S1 check: ______
- Median TEST-session duration: ______
- `/status?study=1d` just before the first participant (`next_slot` must be 0): ______
- Second coder for the transcript coding: ______
- Monitoring script: ______
- SONA subject-pool allocation (at least 300 sessions) and recruitment window: ______
