# Study 3: dated note before the first participant session

**Date posted:** November 5, 2026. This note is required by Section 4.6 of the Study 3 preregistration.

**Authors:** David G. Kamper, Alice Lin, and Keith J. Holyoak (UCLA Department of Psychology).

**Where the files are:** this note is posted on the OSF project (https://osf.io/cnxdu). The code and other files listed at the end are posted in the project's GitHub repository (https://github.com/DGK-Law-and-Cognition-Lab/CharacterAI), which is archived on Zenodo. Their SHA-256 hashes are listed at the end of this note.

This note is posted before the first participant session. The TEST sessions led to no change to any prompt, script, participant-facing text, code or analysis, so a dated note is posted rather than an amendment. It reports two departures from the registered procedure (items 5 and 6).

## 1. IRB approval

- The amendment adding Study 3 (IRB-25-1121-AM-001) was approved by the UCLA IRB on **November 4, 2026**. The IRB application calls this study "Study 1b".
- Approved consent form: "Study1b_Consent_clean". The consent page shows it word for word, and its download link points to a copy on UCLA Box.
- Approved debrief: "Study1b_Debrief". Its text is the debrief page of the experiment.
- Copies of both are on GitHub, in `study3/materials/`.

## 2. Frozen code and deployment

| Item | Value |
|---|---|
| `experiment_version` | `study3-v1.0-2026-11-05` |
| `script_version` | `D1-2026-10-19` |
| Git commit | `b6dcab1ea9846a90082e7277753db028e7f1eb82`, tagged `study3-v1.0-2026-11-05` |
| Pavlovia project | `characters/study-2`, projectId 518701. It is not the Study 2 project. A later commit (`4441391`) removed unused files from the repository root; the experiment files were not changed. |
| SONA study | `experiment_id` 3286 |
| Counterbalancing Worker | `https://study3-counterbalance.dgkamper.workers.dev`, source SHA-256 `de0be5a0d3984991c39eff75074a3f26bacf6f854e8d3d9e22997ddb14745893`. `/status` showed `next_slot 0` for `1d` on November 5, 2026, and again on November 5, 2026 at 4:43 PM PST, before SONA was opened (`next_slot 0`, `assigned 0`). |

Checks on the frozen build:

- static checks: all pass;
- Worker tests: all pass;
- end-to-end harness: 2,347 checks passed, 0 failed, across 17 runs;
- upload check: passes.

The experiment code (credentials replaced by `REDACTED`) and the Worker source are posted with this note.

## 3. TEST sessions

- **TEST01** was a full investigator session on the live deployment on November 5, 2026: LowA_LowE, bonding_first.
  - Its record saved to Pavlovia.
  - `system_prompt_sha256_match` and `script_sha256_match` were TRUE, and the logged hashes equal Appendices A and D.1.
  - The scripted openings S0 and S1 were word for word the registered texts.
  - All three closeness probes were logged, and all 18 model replies ended with `finish_reason = stop`, with 0 API errors.
  - Every field of the registered data contract was present.
  - After "Complete Study", the page redirected to SONA study 3286.
- **TEST02** was an investigator session on the live deployment on November 5, 2026: LowA_HighE, impression_first.
  - The tab was closed during the chat.
  - Its `_PARTIAL` record was saved to Pavlovia, slim partial, `checkpoint_stage` probe_1.
  - `system_prompt_sha256_match` and `script_sha256_match` were TRUE.
  - Between them, TEST01 and TEST02 ran both orders on the live deployment.
  - Both used the Worker's `1d_test` counter (test slots 0 and 1); the `1d` participant counter stayed at 0.
- **Automated TEST conversations:** 32 conversations with the live model were run on the frozen build on November 5, 2026, 8 per cell. Each used the cell's registered prompt and scripted openings, and the first message varied as Section 4.6 asks (an answer, a question, a greeting, a one-word reply).
  - Logged prompt hashes matched Appendix A in every conversation.
  - All 32 conversations completed: 352 model-generated replies, 0 API errors, `finish_reason = stop`.
  - Served model: `meta-llama/llama-3.3-70b-instruct` in every conversation. OpenRouter routed requests to SambaNova, AkashML, DeepInfra, Parasail and CoreWeave.
  - Summary: `TEST_live_model_conversations_2026-11-05_summary.json`, posted with this note.

## 4. Length criterion and S1 check

- **Length criterion** (each cell's mean words per model-generated reply within ±10% of the grand mean): **met.** Grand mean 95.0 words over the 32 automated conversations, 88 replies per cell. No change to the length rule or the E blocks.

  | Cell | Mean words per reply | % from grand mean |
  |---|---|---|
  | HighA_HighE | 100.4 | +5.7% |
  | HighA_LowE | 97.8 | +2.9% |
  | LowA_HighE | 92.4 | −2.8% |
  | LowA_LowE | 89.5 | −5.8% |

  The investigator session TEST01 (LowA_LowE) averaged 108.3 words per reply. It is not part of the criterion. M2 length equivalence is tested on participant sessions only (Section 4.6).

- **S1 check:** S1 reads as a plausible reply to an answer, a greeting and a one-word message in every cell. To a direct question ("Who are you, and why are you out here?") it answers only indirectly: S0 has already given Sylva's name and quest, and S1 mentions her search for clues about fire. No change was made. A first message that S1 may not fit is a sensitivity factor, not an exclusion (Section 9.2).

## 5. Departure from Section 4.6: how the TEST sessions were run

- Section 4.6 calls for at least 8 investigator TEST sessions per cell, run through the full participant procedure. Instead, the checks it lists were split as follows:
  - **Reply length by cell, the scripted turns, the prompt hashes, and S1 plausibility:** the 32 automated live-model conversations (8 per cell).
  - **The full page sequence, both orders, the three probes and their timer behavior, vignette 2, the `_PARTIAL` record of a closed tab, error logging and the credit redirect:** the end-to-end harness on the frozen build (17 runs, 2,347 checks).
  - **Live deployment (Pavlovia saving of complete and `_PARTIAL` records, the Worker test counter, both orders, the credit redirect):** the investigator sessions TEST01 and TEST02.
- No TEST data are analyzed, and no analysis changes.

## 6. Departure from Section 4.2: SONA disqualifier

- SONA study 3112, which served Studies 1 and 2, was removed from the SONA system when old studies were cleaned up. It therefore cannot be set as a disqualifier for SONA study 3286.
- Prior participants are excluded instead in two ways:
  - the consent eligibility statement says anyone who has already chatted with a character named Sylva cannot take part;
  - `prior_sylva = "Yes"` is exclusion criterion 9 (Section 9.2).
- No analysis changes.

## 7. Recruitment

- **Recruitment window:** from the opening of SONA study 3286 on November 5, 2026 to **December 3, 2026**, the end of Fall Quarter 2026 recruitment. The only extension is the one in Section 4.5: one further quarter if fewer than 200 participants are eligible at the end of the window.
- **SONA allocation:** 300 timeslot hours (60 minutes, 1 credit per session; about 300 sign-ups).
- **Stopping rule:** recruitment closes at 272 eligible sessions or 300 completed non-TEST sessions, whichever comes first, or at the end of the window (Section 4.5).

## 8. Monitoring and coding

- **Monitoring script:** `monitor_study3.py`, posted with this note. It reads only the fields listed in Section 4.5 and the Section 9.2 exclusion fields, and reports only:
  - counts by cell and order;
  - exclusion counts;
  - error and save rates;
  - probe completion counts;
  - contract violations;
  - the stopping-rule status.
- **Transcript safety screen** (Section 11.3): `safety_screen_study3.py`, posted with this note. It reads only participant-written text for self-harm keywords, and it lists flagged sessions without tabulating them by cell.
- **Coders:** David G. Kamper (PI) and Mira Patel (second coder). The second coder works only with de-identified transcripts and open-ended responses (Section 7.4).

## Files posted with this note (GitHub, archived on Zenodo)

| File | SHA-256 |
|---|---|
| `experiment_study3-v1.0-2026-11-05_REDACTED.js` | `888230d64ab6d1fa37945c7064bdcb15408cb3cf174385237adc2e0699cf3c86` |
| `TEST_live_model_conversations_2026-11-05_summary.json` | `bdadc15906b6365a514e1ad8c9a3c91564b3346880591915907cf98edbcda549` |
| `counterbalance_worker.js` | `de0be5a0d3984991c39eff75074a3f26bacf6f854e8d3d9e22997ddb14745893` |
| `monitor_study3.py` | `c692ad61c771786b85e211fce6db51595b51cfa1f80dbb7bef096978762f7dc9` |
| `safety_screen_study3.py` | `04d9e3edcda7286becbf391792bcabf132c1217f2f442622ecdedb5f40f98711` |
| `materials/Study1b_Consent-clean.pdf` (approved consent form) | `cfb2573b0692e6cedd192086a50dc3198bf0130ecff2c2d4d2626ed9bc6383fd` |
| `materials/Study1b_Debrief.pdf` (approved debrief, rendered from the approved document) | `ff26130ed06a431719bac9d5ac48c7f1f90e121c4c246a3ec12dc828acf1dd61` |
