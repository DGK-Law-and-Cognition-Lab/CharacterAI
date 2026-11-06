# Study 3: automated live prompt validation (2026-10-16)

**What this is.** Pre-filing prompt validation with **synthetic participants**; no human participants are involved. The real experiment page (staging build v0.3) ran in headless Chrome and called the real model (`meta-llama/llama-3.3-70b-instruct` via OpenRouter, the key in `experiment.js`). The Worker, Pavlovia and SONA were never contacted.

**What was run.**
- 8 conversations per cell, 32 in total.
- 12 scripted participant messages each, so 11 model replies per conversation (message 1 gets the scripted S1).
- The first message rotated through an answer, a question, a greeting and a one-word reply, as prereg §4.6 asks.

Script: `test/live_openrouter_check.mjs --runs 8 --messages 12`. Transcripts are in this folder (`<cell>_run<k>.md`), and `summary.json` has the per-run detail.

These are not data and enter no analysis. Synthetic messages are friendlier and more uniform than real participants, so treat the numbers as previews.

## Does the API call work?

Yes.
- 32/32 conversations completed, with 352 model replies and **0 API errors**.
- Every reply had `finish_reason = stop`.
- The system prompt SHA-256 matched prereg Appendix A in every cell.
- Latency: median 2.7 s, 95th percentile 5.5 s, maximum 9.8 s.
- Cost: $0.08 in total, about $0.0025 per 11-reply conversation.
- Providers served: AkashML and Cloudflare. A first 4-run check also saw DeepInfra, Parasail and SambaNova.
- Account balance on 2026-10-16: $10 total credit, $2.24 used before these checks.

## Prereg §4.6 length criterion (each cell within ±10% of the grand mean words per model reply)

| Cell | Mean words per reply | % from grand mean (94.5) |
|---|---|---|
| HighA_HighE | 97.0 | +2.7 |
| HighA_LowE | 97.9 | +3.7 |
| LowA_HighE | 94.3 | −0.2 |
| LowA_LowE | 88.7 | −6.2 |

**Pass.** No revision of the length rule or the E blocks is indicated.

Caution for M2 (registered ±7.5% equivalence on participant data): warm replies were about 6.5% longer than cold ones (97.5 vs 91.5 words). Prereg §4.4 gives M2 power of .39 at a 1.05 ratio and .10 at 1.07. So M2 may well fail for the warmth factor even though the §4.6 criterion passes. Extraversion: 95.7 vs 93.3 words (ratio 1.025).

## Expressed tone (frozen probes, `Analysis/Study 3/measurement/frozen_probes`, SHA-256 a455c2b1…9c59)

These are per-conversation means of the model-generated replies.

| Cell | W (warmth) | R (resistance) | A (aversive affect) |
|---|---|---|---|
| HighA_HighE | .520 | .058 | .163 |
| HighA_LowE | .464 | .057 | .159 |
| LowA_HighE | .189 | .145 | .254 |
| LowA_LowE | .237 | .123 | .192 |

- **Warmth factor:** ΔW_A = +.279. This equals the Study 1 gap (.28), the value at which the prereg's tone version expects H1 d ≈ .52. M1 (ΔW_A > 0, and ≥ .14 for an interpretable null) would pass.
- **Extraversion factor:** ΔW_E = +.004, ΔR_E = +.012, ΔA_E = +.033. The extraversion levels do not differ in expressed warmth, so the tone version predicts no E effect on PSR (H2).
- **Drift:** with these synthetic participants the cold cells did not drift warmer over the chat (W .244 in replies 1-5 vs .187 in replies 6-11). Studies 1-2 showed drift with real participants.

## Scripted openings (Appendix D.1)

The frozen probes reproduce the Appendix D.1 table exactly, for warmth (S0/S1: .28/.94, .27/.91, .05/.09, .05/.15) and resistance.

The cold scripts also score high on the aversive-affect probe A (S0: .42 and .52). The brusque, suspicious tone partly registers as aversive affect. This matters for interpreting D2.
