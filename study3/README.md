# Study 3: Chatbot warmth and extraversion, closeness, and judgments of responsibility

Materials, code and preregistration files for Study 3 of the DGK Law and Cognition Lab's Character AI research program (UCLA Department of Psychology). Authors: David G. Kamper, Alice Lin, and Keith J. Holyoak.

- **Preregistration:** posted on the OSF project <https://osf.io/cnxdu>. A copy is in `preregistration/`.
- **IRB:** UCLA IRB-25-1121, modification AM-001, approved November 4, 2026. The IRB application calls this study "Study 1b".
- **Design:** participants chat for 10 minutes with "Sylva", an AI chatbot that plays a fictional character. Sylva's warmth (warm or cold) and extraversion (outgoing or reserved) are varied between subjects in a 2 × 2 design, and her emotional stability is held constant. Participants then rate Sylva and their experience, and judge responsibility in two fictional scenarios. Target: 272 analyzable participants from the UCLA SONA pool.

## Contents

| Folder | What it holds |
|---|---|
| `preregistration/` | The preregistration as posted (PDF and Markdown). |
| `preregistration/registered_files/` | The files whose SHA-256 hashes are registered in Appendix E: frozen tone probes and their scripts, the analysis notebook and data generator (mock run), the power scripts and results, and the live validation report. These files are not edited; any later change goes in a new file with a dated note. |
| `dated_note/` | The dated note posted before the first participant session (Section 4.6), with the files it lists and the summary of the 32 TEST conversations. |
| `experiment/` | The experiment as deployed on Pavlovia (frozen build `study3-v1.0-2026-11-05`), with its tests. |
| `worker/` | The Cloudflare Worker that assigns each session to a cell and a questionnaire order (permuted blocks of eight). |
| `monitor/` | The collection monitor (stopping-rule counts, Section 4.5) and the 48-hour transcript safety screen (Section 11.3). |
| `materials/` | The IRB-approved consent form and debrief, the measures and materials document, the structured conversation outline, and the SONA posting. |
| `FREEZE_RECORD_study3-v1.0.md` | The record of the frozen build: file hashes, checks, and TEST sessions. |

## About `experiment/experiment.js`

This copy differs from the deployed file only in two constants: the OpenRouter API key and the SONA credit token are replaced by `REDACTED` (prereg Section 11.2). It is byte-identical to `dated_note/experiment_study3-v1.0-2026-11-05_REDACTED.js`, whose SHA-256 is listed in the dated note. To run it locally, the page needs a valid OpenRouter key; without one, the chat cannot fetch replies.

Tests (Node 22 or later, Google Chrome; run from `experiment/`):

- static checks: `node dev_tests/static_checks.js <Study 2 experiment.js> experiment.js <prereg .md> <vignette brief .md>`
- Worker unit tests: `node dev_tests/worker_test.mjs`
- end-to-end harness, with every network call simulated: `node test/run_e2e.mjs`

## Data

Participant data are not in this repository. After collection, de-identified data and transcripts are posted as the preregistration describes (Section 11.2): SONA IDs replaced by random codes, and identifying details removed by hand.

Contact: David G. Kamper, davidgkamper@ucla.edu.
