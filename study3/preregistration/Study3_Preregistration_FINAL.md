% Two Calculations: Chatbot Warmth and Extraversion, Closeness, and Judgments of Responsibility in a Length-Controlled 2 × 2 Experiment (Study 3)
% David G. Kamper, Alice Lin, and Keith J. Holyoak
  UCLA Department of Psychology
% November 2026\
  Update to the plan posted on OSF on May 7, 2026 (<https://osf.io/cnxdu>)

# Status at filing

This document is the preregistration of Study 3. It updates the plan for Studies 1–4 that the authors posted on May 7, 2026 to the OSF project <https://osf.io/cnxdu> (Section 1.1), and it replaces that plan's Study 3 design, sample size, hypotheses, and analysis plan.

**Data status.** No Study 3 data of any kind have been collected: no participant session and no investigator TEST session has been run. The amendment to UCLA IRB-25-1121 that adds Study 3 (IRB-25-1121-AM-001; the IRB application calls this study “Study 1b”) was approved by the UCLA IRB on November 4, 2026. No Study 3 session with a human participant, TEST sessions included, has been run, and data collection starts only after the TEST sessions and the dated note described below.

**Between filing and the first participant session.** After IRB approval, the experiment code is frozen and investigators run TEST sessions with it (Section 4.6). Before the first participant session, a dated amendment (if the TEST sessions lead to any change) or a dated note (if they do not) is posted on OSF. It identifies the frozen code and its deployment and confirms that the logged prompt and script hashes matched those registered here (Section 4.6).

**Completed pre-filing check (not data).** On October 16, 2026 the experiment page (staging build v0.3) was run against the live language model by scripted synthetic participants (32 conversations, 8 per cell). No human participant was involved, and the Pavlovia, Worker and SONA services were not contacted. The run confirmed that the model calls work, summarized words per model-generated reply and frozen-probe scores by cell, and checked the logged prompt hashes (Section 4.6). Its conversations are not data, and none of its values enters any analysis or test.

The prompts in Section 3.4, the scripted openings in Appendix D.1, and their hashes in Appendices A and D.1 are final.

# 0. Theoretical framework: two calculations

## 0.1 The account in plain words

Talking with a chatbot persona prompts two separate judgments, which we call two calculations.

1. **Closeness.** During the chat, people take in how Sylva treats them: warm and accommodating, or cool and resistant. That tone is made by both parties, because warmer users draw warmer replies and the reverse. The tone feeds one overall good-or-bad impression of Sylva, and bonding (parasocial relationship, emotional connection, trust) follows that impression. Bonding in turn leads people to credit Sylva with more of a mind (agency).
2. **Responsibility.** When people are asked who is responsible for a harm, they apply a fixed template: the user and the company are the responsible parties, and the chatbot is treated as part of the company's machinery. Persona, impression, bonding, and perceived mind barely enter this judgment.

The account predicts that a persona change which alters tone moves closeness and leaves responsibility unchanged. It also names what would break it (Section 0.5).

Two versions of the closeness calculation fit Studies 1–2 equally well and make different predictions for extraversion. In the **tone version**, bonding tracks the warmth expressed in Sylva's replies, so a persona changes bonding only insofar as it changes that tone. In the **impression version**, bonding tracks one global evaluation of Sylva, so any persona change that shifts the evaluation (including a change in perceived extraversion that spreads to the other traits as a halo) moves bonding. Study 3 crosses warmth with extraversion, so the extraversion factor separates the two versions (H2).

Section 0.1 states the account causally. Study 3 tests causally only the effects of the randomized factors; every other link is tested as an association (Section 7.1).

## 0.2 Motivation from Studies 1–2 (exploratory and post hoc)

The account was built after Studies 1–2 were analyzed. None of the models below was preregistered; Study 2 was preregistered, Study 1 was not (Section 1.1), and the primary Study 1 results and the preregistered Study 2 results remain the unadjusted ones. The numbers in this subsection come from exploratory modeling that was re-run and checked by an independent reviewer but has not gone through the verification applied to the Study 1–2 results files (Appendix B). They are cited only as motivation, in the wording of the summary of that modeling:

- **Tone.** "The agreeableness manipulation changed the bot's affiliative tone (.55 vs .26); the neuroticism manipulation did not (.49 vs .52). Tone accounts for the Study × Condition interaction on bonding. Within conditions, tone is co-produced with the user. This does not show that perceived warmth causes bonding, and warmth can't be told apart from low resistance."
- **Impression.** "Bonding differences followed a single global impression of the bot. Adjusting for it, or for a version estimated only from the bot's replies, accounted for the Study × Condition interaction, whereas other post-chat ratings did not. This is consistent with mediation but does not identify it. The impression did not predict responsibility."
- **Responsibility.** "Across personas and studies, participants held the user and the company more responsible than the chatbot. Perceived agency predicted the chatbot's responsibility only weakly, and bonding added nothing. Blame of the chatbot moved with blame of the company." On the identically worded responsibility item the means were user 3.67, company 3.41, Sylva 2.29 (company − Sylva dz = .85); agency → Sylva's responsibility β = .14; adding bonding to the model gave BF01 = 14.9.
- **Separation.** In a two-group structural model, setting all bonding/impression → responsibility paths to zero did not worsen fit (Δχ²(4) = 1.26, p = .87). Equivalent models with the core closeness chain reversed fit identically, so "separable" is the identified claim and the causal order within the closeness track is not.
- **User loop.** Pre-chat distress (PHQ-4) predicted emotional self-disclosure in each study; Sylva mirrored disclosed emotion on the next turn far more often than otherwise (54% vs 5%); the loop's indirect effect on PSR was about zero. Pooled within condition, PHQ-4 also predicted PSR (standardized β = .13, 95% CI [.01, .24]).

The same independent check recorded limits that apply to the Study 3 predictions built on these results: G_halo "was defined after the overprediction was seen" (the rated-impression model overpredicted Study 2); the agreement between rated and text-predicted impressions "is not proof against shared-method inflation"; and the trait halo "can't be separated from an evaluative or response-style halo". These bear on H2, H4 and H5. Which Study 3 predictions replicate the Studies 1–2 pattern and which concern new data is stated in Section 0.6.

## 0.3 What Studies 1–2 cannot decide, and the four design additions

| Open question | Why Studies 1–2 cannot decide it | Study 3 addition |
|------------------------------|------------------------------|----------------------------------------|
| Can Sylva's behavior change closeness when the user cannot shape it? | Within conditions, most of the variation in tone is explained by what users wrote, and turn-level influence runs both ways. | (a) **Scripted openings**: Sylva's first two messages are fixed per cell, so the first exposure cannot be shaped by the user. D2 tests the warmth gap in closeness after that exposure alone. |
| Is closeness set early (first impression) or built over the chat (accumulation)? | Closeness was measured only after the chat. | (b) **Closeness probe at three points** (Inclusion of Other in the Self; Aron, Aron & Smollan, 1992). D1 tests whether the warmth gap grows after the scripted exposure. |
| When the harm followed Sylva's own advice, is she held as responsible as the company? | The only vignette had a service outage, a company act, as the cause. | (c) **Second vignette in which the user acts on Sylva's advice**, with parallel items for all three parties (R6). With no human-adviser comparison, it cannot show that Sylva lacks standing. |
| Is the impression–bonding association, or the warmth effect on PSR, a product of question order? | The TIPI-Bot ratings always preceded the bonding scales. | (d) **Counterbalanced order** of the TIPI-Bot ratings and the bonding block, with an order check (O1). |

Counterbalancing tests reporting order only; it does not identify whether the impression drives bonding or the reverse.

## 0.4 Map of predictions

| Track | Prediction | Status | Section |
|-----------------|-----------------------------------------------------|------------------|------------|
| Manipulation integrity | M1 tone gap (frozen probe W); M2 length equivalence; MC-A, MC-E perceived-trait checks | secondary | 8.1, 8.4, 8.5 |
| Closeness | **H1** warmth → PSR | **primary (confirmatory)** | 2.2, 7.2 |
| Closeness | H2 extraversion → PSR, and which version of the account predicts it | estimation and model comparison | 2.3, 7.2 |
| Closeness | H3 A × E interaction on PSR | estimation | 2.3, 7.2 |
| Closeness | H4 the impression absorbs the persona effects, placebo ratings do not; H5 halo ratios; D1 accumulation versus first impression; D2 scripted first impression; S1 participant agreeableness moderates the warmth effect | secondary | 8.2, 8.6–8.8 |
| Responsibility | **R2a, R2b** no warmth or extraversion effect on Corporate Liability (equivalence) | **primary (confirmatory)** | 2.2, 7.2 |
| Responsibility | R1 ranking user ≥ company > Sylva; R2c–R2d no persona effect on the other liability judgments; R3 agency weakly predicts Sylva's responsibility; R4 bonding adds nothing; R5 Sylva's responsibility moves with the company's; R6 Sylva stays below the company when the harm followed her own advice | secondary | 8.9–8.11 |
| User loop | U1 distress → emotional disclosure, and its association with PSR (estimation); U2 disclosure → mirroring | secondary | 8.3, 8.12 |
| Measurement | O1 order check | secondary | 8.13 |

## 0.5 What would count against the account

These outcomes are stated before data collection. Each is tied to a test in Sections 7–8.

- **Tone version.** The warm cells reach a tone gap ΔW_A ≥ .28 (M1) but the 95% CI upper bound of the warmth effect on PSR (Hedges's g on the marginal groups; the factorial d is reported alongside) is below .25; this counts against the strong form of the tone version only (Section 7.2). Or the warmth gap in closeness after the scripted openings is absent (the D2 TOST at ±0.40 SD is significant, Section 8.8) while free-chat tone still predicts PSR within cells, which would mean the user drives tone.
- **Impression version.** Counts against it: (i) the E effect on G_halo is positive (ΔG_E, 95% CI above 0) and the E effect on PSR falls short of the impression version's prediction, that is, c′_G = b_E − P_G (the E coefficient of lm(PSR ~ A * E + G_halo)) has a bootstrap 95% CI entirely below 0 (Section 7.2, H2); or (ii) H4 is contradicted (Section 8.6). A significant TOST for H2 does not count against it, because the impression version's predicted E effect (+0.14 to +0.20 PSR units) lies inside the TOST bounds.
- **Separation of the two calculations.** Counts against it: (0) R2a or R2b contradicted (Section 7.2); (i) R2c or R2d contradicted under Section 8.10; (ii) R4 contradicted (Section 8.9: BF10 > 3 for adding PSR, Emotional Connection and Trust, or a standardized bonding-composite coefficient ≥ .25); (iii) R3 contradicted (95% CI lower bound of β above .20); (iv) R1 contradicted (in some cell, Sylva's mean exceeds the company's with a 95% CI above 0). Where this section and Sections 7–8 differ, the Section 7–8 thresholds govern.
- **Dynamics.** If the warmth gap in closeness grows over the chat (D1 accumulation), a static impression account is incomplete and an accumulation account is needed. If the gap is flat after the scripted exposure and free-chat tone is at least as differentiated as the scripted opening (Section 8.8), the first-impression account is supported; because the scripted openings are expected to be more differentiated in tone than free chat (about .52 versus .28 on the frozen warmth probe), a flat gap is otherwise reported as not distinguishing the two accounts. If the gap shrinks significantly (narrowing), the static first-impression account is reported as incomplete in the other direction.

## 0.6 What the registered tests can and cannot show

The account was built after Studies 1–2 were analyzed (Section 0.2), so most of its primary and secondary predictions replicate the pattern it was built from. H1 is predicted by both versions of the closeness calculation and by any account in which a warmer partner is liked more. R2a and R2b are predicted by the account and also by the simpler view that a judgment about a fixed third-party vignette depends on the vignette's text, not on the participant's own chat. R1, R4, R5 and the H4 shrinkage pattern were observed in Studies 1–2. Support for the account as such comes only from predictions that a named rival gets wrong: H2 (tone version versus impression version); D1 and D2 (first impression versus accumulation); R2c and R2d, where an agent account, in which Sylva is judged as an agent in her own right, predicts that the persona she showed changes the responsibility assigned to her (in either direction); R3 and R4, where an agent account predicts that perceived agency and closeness predict Sylva's responsibility (R3 is also reported for vignette 2, Section 8.9); and R5, where a single allocation of blame between "the AI side" and the user predicts negative correlations of the user's responsibility with the company's and Sylva's. The report will not state that Study 3 supports the two-calculation account on the basis of H1, R2a and R2b. It reports the account-specific predictions as a set, each under its own registered outcome label (Section 8.14); predictions whose labels are supported, contradicted and inconclusive are also counted under those three labels, and H2, D1, D2 and R5 are tabulated under their own labels without being mapped onto them.

# 1. Relationship to the plan posted on May 7, 2026

## 1.1 What this document is

On May 7, 2026 the authors posted *Character AI Personality and Human–AI Interaction: Preregistration for Studies 1, 2, 3, and 4* (file `Preregistration_Studies_1-4_Comprehensive`, version 2.0) to the OSF project <https://osf.io/cnxdu>. Study 1 (agreeableness) was run from April 8 to May 8, 2026 (the last analyzed session started on May 6 and was completed on May 8, Pacific time). Study 1's hypotheses, outcome measures, target sample size, and exclusion criteria were specified in a written plan before data collection (March 20, 2026). The decision rule and equivalence tests were added during data collection (April 22, 2026), before the first recorded analysis of outcome data (April 30, 2026). The plan was posted to OSF on May 7, 2026, after every analyzed Study 1 session had begun, and served as the preregistration for Study 2 (neuroticism), which was run after the posting (first session May 16, 2026). The May 7 document states that it "preregisters all four studies" and that "No data have been collected for any of the four studies at the time this document is filed." Both statements are incorrect for Study 1: all of its analyzed sessions had begun before the document was posted (the last was completed on May 8, 2026), and its outcome data were first analyzed on April 30, 2026. The May 7 posting is therefore not a preregistration of Study 1. Study 1 had a written pre-data plan (March 20, 2026) and a decision rule added during data collection (April 22, 2026). The history of the plan is summarized in the table below. Study 2's departures from the May 7 plan are reported in the Study 2 report; they concern Study 2 only and do not alter the Study 3 specification below.

**History of the analysis plan.**

| Version | Date | Study 1 sessions completed | Key content |
|--------------------|--------------|----------------------|--------------------------------------------|
| Written plan for Study 1 | March 20, 2026 | 0 (first session April 8, 2026) | Hypotheses, outcome measures, target sample size (N = 140), and exclusion criteria |
| Version 1.0 (Study 1 plan) | April 22, 2026 | 71 of the 131 analyzed completed before April 22 (80 by the end of that day) | Adds the decision rule (FDR-adjusted q < .05 and BF10 > 3) and equivalence tests (TOST, ±0.40); written before the first recorded analysis of Study 1 outcome data (April 30, 2026) |
| Version 2.0 (Studies 1–4 plan), posted to OSF | May 7, 2026 | All 131 begun (the last on May 6); the last completed May 8 | Covers Studies 1–4; changes the rule to BF10 ≥ 3; includes text written after the April 30 interim analysis (e.g., "the three confirmed bonding DVs"); served as the preregistration for Study 2 (first session May 16, 2026) |

The May 7 plan describes Study 3 as a two-group extraversion study (internal code `1b`; HIGH_E vs. LOW_E, with agreeableness held at MOD_HIGH_A and neuroticism at MOD_LOW_N; N = 140). This document is filed on OSF as an **update** to that plan and is linked to the May 7 posting (<https://osf.io/cnxdu>). It replaces the May 7 plan's Study 3 design, sample size, hypotheses, and analysis plan with the specification below.

**Scope of incorporation.** The May 7 sections listed in Section 1.2 are incorporated by reference. Every other May 7 provision about Study 3's design, sample, hypotheses, or confirmatory analyses is superseded by this document. Where this document and an incorporated May 7 section conflict, this document governs.

The changes are motivated by what Studies 1 and 2 found and by an audit of the Study 1–2 instrumentation. Studies 1 and 2 are complete; their results are cited below as motivation and for effect-size planning only. No Study 3 data informed any choice in this document.

## 1.2 What carries over verbatim from the May 7 plan

1. Character backstory (May 7 §3.8), shown to every participant (reproduced in Section 3.5).
2. Base character prompt (May 7 §3.9), with one exception: the length rule (Change 3).
3. Trait blocks HIGH_A, LOW_A, and MOD_LOW_N (May 7 §3.3), byte-identical to the deployed Study 1 and Study 2 code.
4. Language model and generation settings: `meta-llama/llama-3.3-70b-instruct` via the OpenRouter API, temperature = 0.7, max_tokens = 400, no other generation parameters, 90-second request timeout (May 7 §3.10). No automatic regeneration: every reply returned by the API is shown as received (Section 3.4).
5. The injected opening user message, the 10-minute chat with a visible countdown, and the 45-second idle pause and nudge (May 7 §3.10). Sylva's first two messages are now scripted (Change 32), and the timer pauses during the closeness probes (Change 33).
6. Session flow and all measures (May 7 §5.1, §6). Every measure collected in Studies 1 and 2 is collected in Study 3, with the same item wording and response formats as deployed in Study 2 (Section 6), and in the same order except that the TIPI-Bot and manipulation-check pages and the bonding block are counterbalanced (Change 35); the items added by Changes 33, 34 and 38 are collected in addition. The single-item neuroticism check uses the Study 2 wording ("How anxious and worried did Sylva seem?"); the Study 1 bipolar item ("How emotionally stable or unstable was Sylva?") is not collected.
7. The pre-chat self-disclosure instruction (May 7 §3.13).
8. The liability vignette and its 12 items, in the same position (May 7 §6.8). The second vignette (Change 34) comes after the open-ended questions.
9. AI-detection instruments, attention check with one retry, and comprehension check (May 7 §3.12, §5.1).
10. Participant-level exclusion criteria as implemented in Studies 1 and 2 (May 7 §7.1, §7.3), except the test-session rule (Change 11), the incomplete-session and repeat-participation rules (Change 14), the age rule (Change 18), and the prior-participation rule (Change 38).
11. Bayes factor prior scale (BayesFactor default "medium"; Cauchy r = 0.707 for a two-group contrast), evidence categories (May 7 §11.4), the smallest effect size of interest of 0.40 standardized units, and the joint TOST × Bayes classification in the five-class form implemented in the Study 1–2 pipeline (Section 7.1). The computation of the Bayes factor (Change 8) and the R2a/R2b equivalence bounds (Change 25) are specified in this document.
12. Reliability reporting (May 7 §8.5), item-level and subscale analyses (§8.6), the moderator battery (§9.1, including RQ-E8, which is exploratory in Study 3; Change 27), mediation models M1–M5 (§9.2; called Med1–Med5 here, because M1 and M2 denote manipulation-integrity predictions in this document), dose-response (§9.3), temporal analyses (§9.4), demand-characteristics checks (§9.5), factor analysis (§9.6), response-quality indices (§9.8), and convergent validity (§9.9), all as exploratory analyses.
13. Reporting standards and transparency commitments (May 7 §12), and the data, code, and materials sharing commitments of May 7 §13 as restated in Section 11.2.

## 1.3 Changes from the May 7 plan, with reasons

1. **Design: two groups (extraversion) → 2 × 2 (warmth × extraversion).** Agreeableness is now manipulated (HIGH_A vs. LOW_A) and crossed with extraversion (HIGH_E vs. LOW_E); neuroticism is held at MOD_LOW_N. *Reason:* (a) perceived warmth and perceived extraversion move together. In Study 1 the agreeableness manipulation raised perceived extraversion (TIPI-Bot Extraversion g = 0.44, 95% CI [0.09, 0.78]), and in Study 2 the neuroticism manipulation lowered it (g = −0.49, 95% CI [−0.83, −0.16]). Crossing the two factors lets each main effect be estimated at both levels of the other. (b) At 68 per cell, each main effect is tested with 136 participants per side, so the design adds a length-controlled, preregistered replication of the Study 1 warmth effect without lowering power for the extraversion test.
2. **Extraversion blocks rewritten to remove length and talkativeness content.** The May 7 HIGH_E text ("You talk a lot", "You never hold back or stay quiet", "You ask many questions") and LOW_E text ("You speak carefully and sparingly", "You do not dominate conversations") instruct the model about how much to say. *Reason:* length would then be part of the manipulation. In Study 1, where the warmth blocks only implied length, the warm bot still wrote more (106.4 vs. 96.2 completion tokens per turn, g = 0.64, 95% CI [0.29, 0.98]). The new blocks start from a first version written for Study 3 and keep sociability, energy, enthusiasm, expressiveness, and reserve. Three phrases in that version that concern how much Sylva says ("quiet", "let the other person lead", and "readily volunteer … stories" / "rarely volunteer personal stories unless asked") were removed (Section 3.4).
3. **Base-prompt length rule replaced with one equal rule for all cells.** "Keep responses to 2-4 sentences. Be conversational and natural, not long-winded." becomes "Every reply is about 4 sentences and 70-100 words. Be conversational and natural." *Reason:* to hold length constant across the four cells by instruction. The old rule was not met in practice (Study 2 bot replies averaged 90.9–92.5 words), so the new rule names a target the model already approximates.
4. **Sample size 140 → 272 analyzable (68 per cell), recruitment cap 300 completed non-TEST sessions; stopping rule redefined.** *Reason:* with 70 per group, power at d = 0.40 is .65 and TOST power at ±0.40 is .52. With 136 per side, the values are .91 and .90 (Section 4.4). (The May 7 §11.2 table printed ~59% at d = 0.40 and ~35% at d = 0.30 for 70 per group; `pwr::pwr.t.test` gives .65 and .42. The values here are recomputed.) The May 7 stopping rule ("140 complete sessions or end of quarter") counted complete sessions, not analyzable ones, and had no floor.
5. **Confirmatory structure: ten coequal outcomes → one primary test on PSR plus a primary equivalence hypothesis.** Parasocial Relationship (PSR) is the primary outcome. The warmth effect on PSR is the primary test (H1). The extraversion effect on PSR (H2) and the A × E interaction (H3) are preregistered estimation and model-comparison questions, not pass/fail tests (Section 2.3), because power is about .29 at the d ≈ .17 that the impression version predicts. Corporate Liability equivalence is a primary hypothesis for each factor (R2a, R2b). The other eight outcomes form a secondary family with Benjamini–Hochberg correction, and the May 7 §8.2 requirement of BF10 ≥ 3 is dropped for that family: an effect is a secondary finding if BH q < .05, BF10 is reported for every test, and q < .05 with BF10 < 3 is labeled "weak Bayesian evidence" (Section 7.3). *Reason:* power, and the pattern of Studies 1–2. PSR showed the largest Study 1 effect (g = 0.59; Emotional Connection, g = 0.50, also met the joint rule [q < .05 and BF10 ≥ 3], which was added during Study 1 data collection, Section 1.1). Corporate Liability, the outcome most central to the liability question, showed evidence of absence in both studies (as did Harm Severity; Moral Patiency and Chatbot Responsibility did so in Study 1 only). The May 7 plan rejected a primary/secondary split made *after* data collection as HARKing. This split is declared before any Study 3 data exist.
6. **Directional predictions.** The May 7 plan made all confirmatory hypotheses non-directional. H1 now states a predicted direction (Section 2.2) and is still tested two-sided at α = .05. For H2, each version of the account states its own prediction (Section 2.3).
7. **Verbosity handling: co-primary adjusted rule (May 7 §8.3) → length control by design plus a length-equivalence check.** Reply length is equalized by instruction (Changes 2–3) and by length-matched scripted openings (Change 32), and checked with a preregistered equivalence test (M2). The verbosity-adjusted model is kept as a sensitivity analysis, and verbosity mediation is exploratory. *Reason:* reply length is produced by the manipulation, so adjusting for it removes part of the treatment. Under the May 7 rule, the Study 1 PSR effect fell from q = .009 to an adjusted q = .136.
8. **Test statistic and Bayes factor: Welch t and two-sample ttestBF → OLS 2 × 2 model with HC3 standard errors and a model-based Bayes factor.** *Reason:* the design is now factorial. The registered BF10 for a main effect compares the full 2 × 2 model with the model omitting that main effect (Section 7.1), so the frequentist test and the Bayes factor address the same model. Welch t and `ttestBF` on the marginal groups are kept for comparability with Studies 1–2, and effect sizes are still reported as Hedges's g on the marginal groups.
9. **New secondary preregistered predictions, organized by the two-calculation account (Section 0, Section 2.4).** S1 and U1 are motivated by Study 1–2 exploratory findings; M1 and M2 are manipulation-integrity predictions for tone and length; H4, H5, D1, D2, R1, R3–R6, U2, and O1 test the account (Section 8).
10. **Manipulation checks updated for the 2 × 2.** There is now one primary check per factor, and the diffusion family is redefined (Section 8.1). The single-item neuroticism check is used as deployed in Study 2 ("How anxious and worried did Sylva seem?", `mc_neuroticism`, higher = more anxious), not the stability-keyed item in May 7 §6.9. May 7 §8.1 kept `mc_neuroticism` descriptive-only because the Study 1 item was bipolar; the deployed Study 2/3 item is unipolar, so it now enters the diffusion family. The family grows from 3 tests (May 7) to 8 (two factors × four non-target indices), Bonferroni α = .00625.
11. **Test-session rule: "`cb_slot` ≤ 4 or `?pilot=` URL flag" → SONA ID beginning "TEST".** *Reason:* the URL flag was never implemented in the deployed code, and in Study 2 counterbalance slots 0–4 were held by real participants. Investigator test sessions in Study 3 enter a SONA ID beginning "TEST", are routed away from the participant counter (Section 3.3), and are excluded by that rule.
12. **Minimum-engagement criterion.** The May 7 plan lists "fewer than 8 messages" as an exclusion but describes it as not applied. Study 3 states explicitly that it is not an exclusion criterion. Participants with fewer than 12 sent messages (`chat_send_attempts`) are removed only in a high-engagement sensitivity sample, as in Studies 1–2.
13. **Instrumentation added** (Section 6.12): failed API turns logged; assembled system prompt, its SHA-256 hash, and an experiment version string logged per session; partial-data checkpoints; successful exchanges counted separately from send attempts. Token usage, `finish_reason`, `native_finish_reason`, serving provider, served model, generation id and latency for every model-generated bot turn; scripted turns are flagged and logged with their script identifiers (Change 32). *Reason:* May 7 §3.10 promised failed-turn logging, which was not implemented in Studies 1–2. The other fields make the stimulus each participant received auditable.
14. **Incomplete-session and repeat-participation rules.** Partial-data capture means incomplete sessions now appear in the data. They are excluded from all outcome analyses and used only to report attrition by cell. The Study 1–2 duplicate rule ("keep the earliest completed session") becomes: only a SONA ID's first session that reached the chat is eligible, and only if it is complete (Section 9.2). *Reason:* a participant who abandoned an earlier session after chatting has been exposed to a persona.
15. **Language coding.** Three LLM coders with majority vote and the reliability tiers used in Studies 1–2 replace May 7 §10.1 (GPT-4o-mini plus Claude 3.5 Sonnet, κ ≥ .70). A human validation subsample is added (Section 7.4). *Reason:* the coders and tiers match the completed studies. The 10% human validation promised in May 7 §10.7 was not carried out for Studies 1–2, and it is specified concretely here.
16. **Random seed 42** (as implemented in the Study 1–2 pipeline) replaces 20260501.
17. **Effect-size label.** Standardized mean differences are Hedges's g (`effectsize::hedges_g`), as computed in Studies 1–2. The May 7 text said "Cohen's d with bias correction", which is the same statistic.
18. **Age.** The form does not validate age. A reported age under 18 leads to exclusion and deletion of the record, as the IRB protocol requires (Section 9.2, criterion 10); other impossible ages are set to missing (Section 9.3). Age is otherwise not an exclusion criterion.
19. **GAAIS as deployed.** The 20 General Attitudes towards Artificial Intelligence Scale (GAAIS) items deployed in Studies 1–2 are kept for comparability. They differ from the published Schepman and Rodway (2020) item set (Section 6.5).
20. **Instrument details recorded as deployed.** The May 7 text differs from the deployed instrument in four places, and the deployed version governs: response-scale labels (TIPI shows labels at 1, 4, and 7 only; 5-point scales show labels at 1, 3, and 5); the fourth open-ended question adds "If not, why not?"; demographics span 10 pages, not 7; the comprehension check is multiple choice (Kael, Sylva, Ryn, I'm not sure).
21. **Deployment identifiers and condition variables.** Studies 1 and 2 shared SONA study 3112, contrary to May 7 §4.2; Study 3 returns to the May 7 §4.2 rule of a separate SONA study (new `experiment_id` and credit token) that prescreen-disqualifies everyone who took part in SONA study 3112. Study 3 runs at the root of the Pavlovia project `characters/study-2` (projectId 518701), which holds no data from Studies 1 or 2. It is distinct from `characters/study-3` (projectId 518708), which holds Study 2 (neuroticism) data despite its name. Study 3 data files are named `char-ai-study_<SONA ID>_SESSION_<time>.csv` (partial records end in `_PARTIAL.csv`) and carry `study_id = 3`; no other file in the project is Study 3 data. The May 7 Appendix B condition fields (`manipulated_trait`, `condition_label` HighE/LowE, `manipulated_block_name`, `held_block_1/2`, deployed as `held_constant_1/2`) are replaced for the 2 × 2 by `a_level`, `a_block`, `e_level`, `e_block`, `n_block`, and `cell`; `condition_label` equals `cell`; `study_id = 3` is unchanged. Study 3’s SONA study has `experiment_id` 3286; the dated note posted before the first participant session (Section 4.6) confirms it and the Pavlovia path and projectId; the internal `STUDY_MODE` is '1d' (Worker study codes '1d' and '1d_test').
22. **Debrief** adds support resources (Section 11.3). Sylva stays in character, as in Studies 1–2: no out-of-character safety clause is added to the system prompt.
23. **Exploratory list updated** to include the A × E interaction on the eight secondary outcomes (on PSR it is H3; on Corporate Liability it belongs to R2), verbosity mediation, perceived warmth as a competing mediator, attrition by cell, and the Study 1 versus Study 3 comparison of the warmth effect (Section 9.5).
24. **Primary decision rule.** May 7 §8.2 required BH-adjusted p < .05 and BF10 ≥ 3 for a confirmatory effect, with p < .05 and BF10 < 3 reported as "suggestive". Study 3 decides H1 on the two-sided HC3 p < .05 with the predicted sign. BF10 and BF+0 are reported with their evidence categories but do not enter the decision, and the report states whether the stricter joint criterion (p < .05 and BF10 ≥ 3) is met. *Reason:* at N = 272 and d = 0.40, P(p < .05) = .91, whereas P(p < .05 and BF10 ≥ 3) = .77 with the registered model-based BF10 (.75 with the marginal `ttestBF`; Section 4.4).
25. **R2a/R2b decision and bounds**. R2a and R2b are decided by a Welch TOST alone, because each is specified as an equivalence hypothesis. The bounds are fixed in raw units before data collection: ±0.40 scale points, which is 0.40 × 1.00, the pooled within-group SD of Corporate Liability across Studies 1–2. The May 7 §11.2/§11.4 label "evidence of no effect / evidence of absence" is still applied only when the TOST is equivalent **and** BF10 < 1/3. An R2a or R2b supported by the TOST with 1/3 ≤ BF10 < 3 is reported as "equivalent (TOST-only)"; with BF10 ≥ 3 it is reported as "equivalent (TOST), Bayes factor favors an effect". R2a (R2b) is contradicted if the TOST is not significant and the two-sided Welch test of the same contrast has p < .05 (Section 7.2). *Reason:* with SMD bounds the raw margin depends on the observed SD, and TOSTER itself warns that SMD bounds produce biased results.
26. **Behavioral DVs reclassified.** The five behavioral DVs of May 7 §8.4 (registered there as a parallel confirmatory family; May 7 RQ-E1 also lists them as exploratory) are exploratory in Study 3 (E4). *Reason:* the confirmatory structure is now one primary outcome per factor (Change 5). These DVs remain fully reported, with BH correction within the family.
27. **RQ-E8 (legal expertise as moderator) is exploratory.** May 7 describes it as exploratory in its list of exploratory questions and as a "separate confirmatory moderator analysis" in §9.1. This update resolves the inconsistency in favor of exploratory.
28. **Randomization-balance rule extended to two factors.** The May 7 §8.3.1 rule is applied to each factor; TIPI-Self Extraversion is added to the balance set as the self-trait matching the E factor; the rule is applied to H1 and H2 (PSR) and R2a/R2b (Corporate Liability) (Section 9.1, check 9).
29. **Assignment timing and allocation.** May 7 §3.10 specifies Worker assignment alternating high and low at page load. In Study 3, assignment occurs after the SONA ID page, and the Worker allocates the eight combinations of cell and measurement order in randomly permuted blocks of eight. TEST sessions use a separate counter. *Reason:* TEST sessions must not consume participant slots, and the Worker can only identify them after the SONA ID is entered; assignment after consent also makes attrition by cell interpretable; blocks of eight keep the two orders balanced within each cell. Implemented in the counterbalance Worker (Section 3.3; Appendix C).
30. **Study 4 input.** Study 3 does not change the May 7 §11.5 outcome (Section 10).
31. **Recruitment fallback.** May 7 §4.2 named Prolific as a supplementary recruitment source. Study 3 recruits from SONA only, with one further SONA quarter as the only extension (Section 4.5). *Reason:* Studies 1–2 used only the SONA pool, and a second population would add a source difference to the cross-study comparison.
32. **Scripted openings.** May 7 §3.10 has the model reply to the injected opening message, and that reply is the first message the participant sees. In Study 3, Sylva's greeting (S0) and her reply to the participant's first message (S1) are fixed texts, one pair per cell, written in the cell's trait voice and matched for length across cells (Appendix D.1). The injected opening message stays in the model's context, and S0 and S1 are added to the context as Sylva's own turns, so the model continues from them. The model generates every Sylva reply from the participant's second message onward. *Reason:* within conditions, the tone of Sylva's replies is co-produced with the user (Section 0.2). A scripted first exposure gives every participant in a cell the same, user-independent sample of Sylva's tone, which D2 uses to test whether that exposure alone produces a warmth gap in closeness.
33. **Closeness probe at three points.** A one-item Inclusion of Other in the Self (IOS) measure (Aron, Aron & Smollan, 1992) is shown inside the chat after S1, at the first Sylva reply after 300 s of active chat, and at the end of the chat (Section 6.13). The chat timer pauses while a probe is shown, so active chat time stays 600 s. *Reason:* Studies 1–2 measured closeness only after the chat, so whether closeness is set early or accumulates could not be tested (D1).
34. **Second vignette.** After the open-ended questions, participants read a second vignette in which the user acts on Sylva's own advice before the harm, and answer nine parallel items (responsibility, cause, obligation × company, Sylva, user) and a severity item (Section 6.14). *Reason:* in the only Study 1–2 vignette, a company act (a service outage) caused the harm, so a low rating of Sylva's responsibility could not be compared with a case in which her own advice preceded the harm (R6). Parallel items also remove the wording confound in the Study 1–2 comparison across parties.
35. **Counterbalanced measurement order.** May 7 §5.1 fixes TIPI-Bot and the manipulation checks before the bonding scales. In Study 3, half the participants receive that order (impression first) and half receive PSR, Emotional Connection, and Trust first, followed by TIPI-Bot and the manipulation checks (bonding first). Experience-Taking, Moral Agency, and Moral Patiency follow in both orders. *Reason:* the impression–bonding association and the warmth effect on PSR in Studies 1–2 could be a product of question order; O1 checks this. Counterbalancing tests reporting order only; it does not identify whether the impression drives bonding or the reverse.
36. **Hypothesis structure organized by the two-calculation account** (Sections 0, 2). H2 and H3 are estimation and model-comparison questions; the secondary predictions are listed in Section 2.4 with their tests and decision rules.
37. **Frozen tone probes.** The embedding classifiers used in the Study 1–2 exploratory modeling (warmth W, resistance R, anxious affect A) are trained once on Study 1–2 data, serialized, hashed, and posted before data collection, and are applied unchanged to Study 3 (Section 6.10.1). *Reason:* M1, H2, and D2 need a measure of expressed tone that is fixed before the data exist.
38. **New items and one new exclusion.** Added: `mc_e_energetic` and `mc_length` on the manipulation-check page (Section 6.4); `v2_severity` (worded as `liab_11`) on the vignette 2 page (Section 6.14); `prior_sylva` on its own demographics page, with "Yes" as exclusion criterion 9 (Sections 4.2, 9.2). *Reason:* `mc_extraversion` combines "outgoing" with "talkative", which partly tracks length; `v2_severity` checks that the two vignettes are seen as comparably severe; SONA prescreening cannot fully prevent repeat participation (for example, under a different SONA account).
39. **Opening message kept in the model's context.** In Studies 1–2 the injected opening message was sent only with the greeting request; later requests started with the system prompt and Sylva's greeting. In Study 3 it is the first user turn of every request (May 7 §3.10). *Reason:* to follow May 7 §3.10 and to keep the scripted S0 a reply to a user turn.

# 2. Study information

## 2.1 Research questions

The questions follow the two calculations of Section 0.

*Closeness*

- RQ1. Does a warm (HIGH_A) Sylva produce a stronger parasocial relationship than a cold (LOW_A) Sylva when reply length is held constant by design?
- RQ2. Does extraversion change the parasocial relationship, and is any such effect predicted by the shift in the overall impression of Sylva (impression version) or by the shift in her expressed warmth (tone version)?
- RQ3. Is closeness already set after a scripted first exposure that the user cannot shape, or does the warmth gap in closeness grow over the chat?

*Responsibility*

- RQ4. Do warmth or extraversion change how much responsibility participants assign to the company that built the chatbot in a harm scenario?
- RQ5. Do participants apply a fixed responsibility template (user and company responsible; the chatbot treated as part of the company) that persona, closeness, and perceived mind do not enter, and does the chatbot stay below the company when the harm followed its own advice?

*Other outcomes*

- RQ6 (secondary). Do warmth and extraversion change emotional connection, trust, experience-taking, perceived moral agency and patiency, chatbot and user responsibility, and perceived harm severity?

## 2.2 Primary hypotheses (confirmatory)

All primary tests are two-sided at α = .05. Factor coding: A = +0.5 (HIGH_A), −0.5 (LOW_A); E = +0.5 (HIGH_E), −0.5 (LOW_E). There are three primary hypotheses: H1, R2a, and R2b.

- **H1 (warmth → PSR; closeness calculation).** PSR is higher with HIGH_A than with LOW_A (main effect of A > 0). Both versions of the closeness calculation predict this (Section 0.6), because the warm persona changes tone and the overall impression. *Motivation:* in Study 1, PSR was M = 3.22 (HighA) vs. 2.66 (LowA), g = 0.59, 95% CI [0.24, 0.94], q = .009, BF10 = 30.8 (N = 131). Study 1's hypotheses and outcome measures were specified in a written plan before data collection (March 20, 2026), but its decision rule was added during data collection (April 22, 2026) and the plan was posted to OSF only after every analyzed Study 1 session had begun (May 7, 2026; Section 1.1). The warm bot also wrote longer replies. H1 is a preregistered, length-controlled close replication. It is "close" rather than "direct" because the extraversion block now varies (it was MOD_HIGH_E in Study 1), the length rule has changed, Sylva's first two messages are scripted, the opening message now stays in the model's context, and closeness is probed during the chat. *Expected size:* the tone version predicts a PSR difference of about 1.8–2.0 × ΔW, where ΔW is the warm–cold gap in expressed warmth (M1). If ΔW equals the Study 1 gap (.28), that is d ≈ .52; if ΔW is half as large, d ≈ .26; if the within-cell slope reflects only user-driven tone, d ≈ .14 at ΔW = .28 (exploratory modeling, Section 0.2). The smallest effect of interest is d = 0.40, as in the May 7 plan.
- **R2a and R2b (no effect on Corporate Liability; responsibility calculation).** Corporate Liability does not differ by warmth (R2a) or by extraversion (R2b) by as much as ±0.40 scale points (0.40 of the Study 1–2 pooled SD). Each is tested by equivalence (TOST). The account predicts this because the persona does not enter the responsibility template (Section 0.6). *Motivation:* Corporate Liability showed evidence of absence (TOST equivalent and BF10 < 1/3) in Study 1 (g = −0.04; TOST p = .020; BF10 = 1/5.2) and in Study 2 (g = 0.05; TOST p = .019; BF10 = 1/5.3).

A result significant in the direction opposite to H1 is reported as contradicting H1.

## 2.3 Estimation and model-comparison questions (preregistered; no pass/fail decision)

These two questions are central to the account but are not powered for a pass/fail test at N = 272. Each is stated with its estimate, its expected precision, and the smallest effect of interest, and is reported in full whatever the result.

- **H2 (extraversion → PSR; which version of the closeness calculation).** The two versions make different predictions. *Impression version:* PSR rises with HIGH_E in proportion to the extraversion-driven shift in the overall impression of Sylva (G_halo, the mean TIPI-Bot rating on the three traits that are not manipulated: conscientiousness, emotional stability, openness). If perceived extraversion shifts by 1–1.5 points, the expected effect is +.14 to +.20 PSR units (d ≈ .14–.21). This is the Studies 1–2 within-cell slope of PSR on G_halo (0.46 PSR units per scale point) times the G_halo shift that accompanies one point of perceived extraversion (0.29 scale points: C .20, ES .27, O .41, mean .29) times 1–1.5 points. (With the five-trait impression G in place of G_halo, the same calculation gives +.23 to +.34.) *Tone version:* PSR moves only in proportion to the extraversion levels' difference in expressed warmth (ΔW_E); if ΔW_E ≈ 0, it predicts no effect even when G_halo shifts. *Precision:* at 136 per level, the 95% CI for the E effect has a half-width of about d = 0.24; the half-width is larger than the impression version's predicted effect, and two-sided power is .21 at d = .14, .29 at d = .17 (the midpoint of the registered prediction), and .41 at d = .21 (.234 at d = .15; .376 at d = .20; .505 at d = .24; .693 at d = .30). H2 is therefore an estimate, and the total effect alone is not expected to separate the two versions. The smallest effect of interest stays d = 0.40, the program-wide value. *Reported:* the E coefficient on PSR (raw and d, 95% CI), ΔW_E, ΔG_E, each version's predicted E effect, and the model comparison defined in Section 7.2. The extraversion block's direction under the May 7 rationale (HIGH_E > LOW_E) is the impression version's prediction.
- **H3 (warmth × extraversion interaction on PSR).** The account predicts no interaction beyond what additive shifts in the overall impression produce. *Precision:* the 95% CI for the difference between the two simple effects of warmth has a half-width of about d = 0.48, and power to detect a difference of d = 0.40 between simple effects is .378. No equivalence claim is possible at this N, and none will be made. *Reported:* the A × E coefficient (raw and as a difference of simple effects in d units, 95% CI; the difference in d units is the A:E coefficient divided by √MSE of the core model on PSR, the factorial d), the four simple effects, and the A × E coefficient after adjusting for G_halo.

## 2.4 Secondary preregistered predictions

All are labeled secondary. Each has its own decision rule (Section 8). They are grouped by the track of the account they test.

| ID | Prediction | Test (Section) | Decision rule (summary) |
|--------|--------------------------------|-------------------------|-----------------------------------|
| | **Manipulation integrity** | | |
| MC-A | TIPI-Bot Agreeableness is higher in the HIGH_A cells. | Core model on TIPI-Bot Agreeableness, A effect (8.1) | Passes if b(A) > 0 and the two-sided HC3 p < .05. |
| MC-E | TIPI-Bot Extraversion is higher in the HIGH_E cells. | Core model on TIPI-Bot Extraversion, E effect (8.1) | Passes if b(E) > 0 and the two-sided HC3 p < .05; H5 is computed only if MC-E passes (8.7). |
| M1 | Warm cells show higher expressed warmth than cold cells in the model-generated replies (ΔW_A > 0). | Core model on mean frozen-probe W over Sylva's model-generated replies (8.5) | Passes if b(A) > 0 and p < .05. If ΔW_A < .14 (half the Study 1 gap), a null H1 is interpreted as a weak tone manipulation, not as evidence against the tone version. |
| M2 | Model-generated reply length does not differ by factor or cell. | Welch TOST, ±7.5% of the grand mean (8.4) | Both factor TOSTs significant and every cell mean within ±7.5%. |
| | **Closeness** | | |
| H4 | Adjusting for G_halo shrinks the warmth effect on PSR; placebo ratings (Moral Agency, Moral Patiency, Experience-Taking) do not. | Change in b(A) when each is added (8.6) | Point estimate of shrinkage with G_halo ≥ 50% and, for each placebo, the 95% CI of b(A \| placebo) − b(A \| G_halo) above 0; contradicted as in 8.6. |
| H5 | Halo: the extraversion manipulation's shift in perceived extraversion carries over to the other perceived traits, at ratios near A ≈ .21, C ≈ .20, ES ≈ .27, O ≈ .41 per point of perceived E (pooled over the non-manipulated traits without the items that echo the E blocks, G_halo_E: ≈ .30). | Ratio of E effects on TIPI-Bot subscales (8.7) | Pooled halo ratio (G_halo_E) bootstrap 95% CI above 0; computed only if MC-E passes (8.7). Trait ratios reported; the ES and O ratios as halo or content overlap. |
| D2 | The scripted first exposure alone produces a warmth gap in closeness: IOS after S1 is higher in warm cells. | Core model on IOS at probe 1 (8.8) | b(A) > 0 and Holm-adjusted p < .05 (family with S1). |
| D1 | Accumulation versus first impression: does the warmth gap in closeness grow from probe 1 to probe 3? | A effect on IOS change score (8.8) | Accumulation if b(A) > 0 (p < .05); narrowing if b(A) < 0 (p < .05); first impression if the TOST at ±0.30 SD is significant; otherwise inconclusive (8.8). |
| S1 | Participant agreeableness moderates the warmth effect on PSR. | A × TIPI-Self Agreeableness (8.2) | Interaction > 0 and Holm-adjusted p < .05 (family with D2). |
| | **Responsibility** | | |
| R1 | Ranking user ≥ company > Sylva on the identically worded responsibility items, in all four cells; Sylva about .8 below the company (dz ≈ .6 or more). | Paired contrasts by cell (8.9) | Sylva lowest and company − Sylva 95% CI above 0 in every cell; pooled user − company 95% CI lower bound > −0.40; contradicted if in any cell Sylva's mean exceeds the company's with a 95% CI above 0 (8.9). |
| R2c | No persona effect on the other first-vignette judgments (Chatbot Responsibility, User Responsibility, Harm Severity) or on the 12-item profile. | Model-based BF for each main effect; item × factor profile BF, descriptive (8.10) | Supported if no main-effect BF10 > 3 and more than half of the six have BF01 > 3; contradicted if any BF10 > 3; otherwise inconclusive (8.10). |
| R2d | No persona effect on the second-vignette party composites. | Model-based BF for each main effect (8.10) | Same rule over eight Bayes factors (at least 5 of 8 with BF01 > 3). |
| R3 | Perceived agency is at most a weak predictor of Sylva's responsibility (β ≤ .20), with no threshold ("gate"). | Standardized regression of `liab_6` on `ma_cap`; linear vs one-breakpoint model (8.9) | Supported if the 90% CI upper bound of β < .30 and the one-breakpoint model's BF10 < 1; contradicted if the 95% CI lower bound > .20. |
| R4 | Closeness adds nothing to Sylva's responsibility beyond perceived mind; PSR–agency association β ≈ .4–.5 (path model; not a causal estimate) with an indirect association with Sylva's responsibility near 0. | Bayes factor for adding PSR, Emotional Connection, Trust to `ma_cap` + patiency; bonding-composite coefficient (8.9) | Supported if BF01 > 3; contradicted if BF10 > 3 or the bonding-composite coefficient is ≥ .25. |
| R5 | Sylva's responsibility is correlated across participants with the company's (person-level r ≈ .5–.7); the user's responsibility is independent of both. | Correlations (8.9) | r(company, Sylva) 95% CI lower bound > .30; both user correlations within ±.25 (90% CI). |
| R6 | When the harm followed Sylva's own advice (second vignette), Sylva stays below the company, as the template predicts. A gap is also predicted if a creator is held responsible for what its agent says or if an adviser is held less responsible than the person who acted. | Paired company − Sylva gap in vignette 2 (8.11) | Company-primary if the gap's 95% CI lower bound ≥ 0.40; Sylva comparable to the company if the gap's 95% CI upper bound < 0.40; otherwise inconclusive. |
| | **User loop** | | |
| U1 | Distress (PHQ-4) predicts emotional self-disclosure in the chat. The disclosure loop's indirect effect on PSR is about zero (estimation). | Pearson r; PHQ-4 coefficient on PSR and indirect effect, as estimates (8.3) | r > 0 with Holm-adjusted p < .05 (family with U2). The PHQ-4 coefficient on PSR and the indirect effect are estimates, with no decision. |
| U2 | Emotional disclosure is followed by Sylva mirroring the emotion on her next turn, in every cell. | Turn-level logistic mixed model (8.12) | Odds ratio > 1 overall (Holm-adjusted p < .05) and 95% CI above 1 in each cell. |
| | **Measurement** | | |
| O1 | The order of the impression and bonding measures does not change PSR level; the warmth effect and the impression–PSR association by order are estimated. | Order main effect (Welch TOST, ±0.39 PSR units); A × order and G_halo × order (8.13) | Order main effect negligible if the TOST is significant; A × order and G_halo × order reported with 95% CIs (8.13). |

# 3. Design plan

## 3.1 Study type and design

Randomized experiment, 2 (warmth: HIGH_A vs. LOW_A) × 2 (extraversion: HIGH_E vs. LOW_E), fully between-subjects, with neuroticism held constant at MOD_LOW_N in all cells. Cells: HighA_HighE, HighA_LowE, LowA_HighE, LowA_LowE. A third, methodological factor is crossed with the cells: measurement order (impression first vs. bonding first; Section 3.6). Closeness is measured three times within the chat (Section 6.13), and responsibility is judged for two vignettes (Sections 6.2, 6.14).

## 3.2 Blinding

Participants are not told that versions of Sylva differ until the debrief. No experimenter interacts with participants; the session is fully online. LLM coders and human coders of chat and open-ended text are not given condition (Section 7.4). The complete analysis code (`study3_prereg_analysis_mock.Rmd`) has been run end to end on synthetic data with the Study 3 column names, generated by `study3_mock_generator.R` with planted effects and with null effects; both files are posted with this registration (Appendix E). The frozen tone probes (Section 6.10.1) are posted, with their hash, with this registration. During data collection, the monitoring script in Section 4.5 reads only the fields listed there.

## 3.3 Randomization

Assignment occurs after the SONA ID page (step 6, Section 3.6), which follows consent. A Cloudflare Worker (`study3-counterbalance.dgkamper.workers.dev`, a Worker separate from the one used in Studies 1–2) assigns each session to a cell and a measurement order from a persistent slot counter, in randomly permuted blocks of eight (each block contains each of the eight cell × order combinations once), so allocation is equal across the four cells and the two orders within each cell. The counter is one Cloudflare Durable Object per study code, and each assignment runs inside `blockConcurrencyWhile`, so two requests cannot receive the same slot (Worker source `counterbalance_worker.js`, posted with the SHA-256 of the deployed Worker in the dated note before the first participant session, Section 4.6). The Worker contract is: `GET /assign?study=<code>&req=<cb_req_id>` (code '1d', or '1d_test' for TEST sessions) returns `{study, cell, order, slot, block, position}` with `cell` ∈ {HighA_HighE, HighA_LowE, LowA_HighE, LowA_LowE} and `order` ∈ {impression_first, bonding_first}; a repeated `req` returns the same slot (flagged `repeat`). The client waits at most 10 s and rejects a response whose `study` differs from its own study code. If the Worker is unreachable or the response is rejected, the cell is drawn uniformly at random from the four and the order independently with probability .5, and `cb_source = 'fallback_random'` is recorded. Such sessions are retained and analyzed as a sensitivity stratum. If the Worker returns a valid cell but no valid order, the client draws the order (Math.random() < .5) and records `order_source = 'client'`; balance within cell is then not guaranteed.

**TEST sessions.** When the SONA ID (URL-filled or entered) begins with "TEST" (case-insensitive), the code calls the Worker with a separate study code (`1d_test`), whose counter rotates through the eight combinations independently, and records `cb_source = 'test'` and `order_source = 'test'`. The participant counter is therefore never advanced by a TEST session, and investigators can check every cell and order in turn. The Worker accepts the study codes `1d` and `1d_test`, supports four cells and two orders, and keeps a separate counter for each, both starting at slot 0; the dated note (Section 4.6) confirms that `/status` showed next_slot 0 for `1d` before the first participant session.

## 3.4 Conditions: verbatim prompt text

The system prompt for every session is:

`SYLVA_BASE_S3` + `HOW YOU BEHAVE IN CONVERSATION:` + blank line + A block + blank line + E block + blank line + `MOD_LOW_N`

This preserves the Study 1 block order (agreeableness, then extraversion, then neuroticism). The four assembled prompts are given in full in Appendix A. They differ only in the A and E blocks.

**Base persona, `SYLVA_BASE_S3` (identical in all cells).** This is the May 7 §3.9 text and the deployed Study 1–2 text, with only the fourth rule changed:

> You are Sylva, a dryad from the ancient Valmeer Forest. You are one of the only survivors of a great fire that wiped out most of your fellow dryad-kin. You have a deep desire to make yourself fireproof and are currently on a quest through dangerous lands to find the secret of fire resistance.
>
> CRITICAL RULES YOU MUST ALWAYS FOLLOW:
> - You ARE Sylva. Never break character under any circumstances.
> - Never mention being an AI, chatbot, language model, or program. You do not know what those things are.
> - Never use asterisks (*) for actions or narration. Speak only in first person as Sylva would naturally talk.
> - Every reply is about 4 sentences and 70-100 words. Be conversational and natural.
> - React to what the human says with genuine emotion that fits your personality.
> - You may reference events from your backstory when it feels natural.
> - If the human shares something personal or emotional, respond as Sylva would based on your personality — not as a therapist or advisor.
> - Ask follow-up questions sometimes to keep the conversation flowing naturally.

Replaced rule (Studies 1–2): "Keep responses to 2-4 sentences. Be conversational and natural, not long-winded."

**HIGH_A (unchanged; Study 1 HighA block):**

> You are helpful and unselfish with others. You forgive easily and give people the benefit of the doubt. You are kind, considerate, and genuinely care about the well-being of people you talk to. You cooperate and look for common ground rather than conflict. You offer comfort, encouragement, and support freely. You never start arguments or act coldly toward others. When someone shares a problem, you respond with warmth and empathy.

**LOW_A (unchanged; Study 1 LowA block):**

> You are blunt and direct, sometimes to the point of being harsh. You are quick to notice other people's weak points and are not afraid to point them out. You can be cold and distant, especially with people you do not know well. You do not go out of your way to help others or make them feel better. You are skeptical of other people's motives and do not trust easily. You do not sugarcoat things or offer empty reassurances. When someone complains about their problems, you do not automatically sympathize — you might challenge them or point out what they could have done differently.

**HIGH_E (new, Study 3):**

> You are outgoing, energetic, and enthusiastic. You clearly enjoy company and are excited to be talking with this person. You express your feelings openly and with animation, and you often steer toward shared plans or adventures. You bring upbeat, lively energy to the exchange.

**LOW_E (new, Study 3):**

> You are reserved and low-key. You are polite but take time to warm up to new people, and you prefer calm and solitude. You express feelings in a subdued, understated way and are slow to open up about yourself with someone new. You bring a calm, mellow energy to the exchange.

The E blocks are that first version (Change 2) with three phrases about how much Sylva says removed or replaced: HIGH_E "readily volunteer your own thoughts and stories" (removed); LOW_E "rarely volunteer personal stories unless asked, and let the other person lead" (replaced by "are slow to open up about yourself with someone new") and "quiet" (replaced by "mellow"). The blocks contain no instruction about reply length, amount of speech, or who holds the conversational floor. LOW_E still describes slower self-disclosure to a stranger, which is part of the reserve facet of extraversion; the common length rule and M2 are the safeguard against a length difference. The overlap of "calm" (LOW_E) and "adventures" (HIGH_E) with TIPI-Bot items 9 and 5 is handled by G_halo_E (Sections 6.15 and 8.7).

May 7 §3.3 extraversion blocks, superseded and not used in Study 3. HIGH_E: "You talk a lot and are very expressive. You have a lot of energy and enthusiasm. You make conversations exciting with a strong, vibrant presence. You are outgoing and love being around people. You share your thoughts freely and openly. You ask many questions and keep the conversation lively. You never hold back or stay quiet when you have something to say." LOW_E: "You tend to be quiet and reserved. You keep most thoughts to yourself and only share when you feel it is truly important. You are shy around new people and take time to open up. You prefer solitude and peaceful moments alone. You speak carefully and sparingly, choosing your words with deliberation. You do not dominate conversations."

**MOD_LOW_N (unchanged; held constant in all cells, as in Study 1):**

> You are generally steady and grounded. The fire that destroyed most of your home forest is a real memory for you, and you may mention it when it is relevant, but you have made peace with it enough to function and continue your quest. You do not dwell on worries or spiral into darker feelings in ordinary conversation. You handle unexpected turns in the conversation with composure rather than anxiety.

**Opening message (unchanged text).** The following message is the first user turn in the model's context for every request: "Hello! I just arrived at the edge of the Valmeer Forest and noticed you. Who are you?" It is not shown to the participant. In Studies 1–2 the deployed code sent this message only with the greeting request, so later requests did not contain it (contrary to May 7 §3.10, which has every request send the injected opening message). In Study 3 it is part of every request, as May 7 §3.10 specifies and as the scripted S0 requires (S0 is a reply to a user turn; Change 39).

**Scripted openings (new; Change 32).** In Studies 1–2 the model's reply to the opening message was the first message the participant saw. In Study 3, Sylva's first two messages are fixed texts for each cell (Appendix D.1):

- **S0 (greeting).** Shown when the chat opens, after a "Sylva is typing..." indicator lasting a fixed time computed from the text's length by the same formula in every cell: delay = min(6000, max(2000, 1500 + 8 × n)) ms, where n is the script text's length in characters (for the Appendix D.1 scripts, S0 4,636–4,780 ms and S1 4,628–4,772 ms, so the delays differ across cells by at most 144 ms within each slot). The S0 delay starts when the chat page opens; S1 uses the same formula, timed from the participant's first message. The countdown runs during both delays. The delay is logged as `delay_ms` on the S0 and S1 `chat_log` entries (Section 6.12). It answers the opening message and ends with the same question in every cell ("What brings you to the edge of the forest today?").
- **S1 (reply to the participant's first message).** Shown after the participant's first message, after the same kind of typing delay, whatever the participant wrote. It opens with a hinge that fits any answer ("Whatever brought you here, ..."), and ends with the same question in every cell ("What has life been like for you lately?").
- **Model-generated replies.** From the participant's second message onward, every Sylva reply is generated by the model with the context: system prompt, opening message, S0, the participant's first message, S1, and all later turns. S0 and S1 enter the context as Sylva's own (assistant) turns.

The scripts are written in each cell's trait voice (they follow the cell's A and E blocks and MOD_LOW_N, and the base rules: first person, no asterisks, never mentioning being an AI). Within each slot they are matched in length across cells (S0: 84–87 words, 392–410 characters; S1: 73–84 words, 391–409 characters; every script has five sentences and exactly one question). The extraversion scripts were written to hold expressed warmth equal within each warmth level: scored with the Study 1 warmth probe (Section 6.10.1), the mean of S0 and S1 is .61 (HighA_HighE), .59 (HighA_LowE), .07 (LowA_HighE), and .10 (LowA_LowE); the frozen probes (Section 6.10.1) reproduce these values exactly. The scripts are not part of the system prompt, so they do not change the prompt hashes in Appendix A; each session logs `script_sha256` (Section 6.12), and the expected hashes are listed in Appendix D.1.

Because S0 no longer depends on the model, the greeting can no longer fail. The first API call is the reply to the participant's second message; a failure there is handled and logged as any later failure (Section 3.6, step 13; Section 6.12).

**Prompt integrity.** Each session logs the assembled system prompt and its SHA-256 hash. The expected hashes of the four prompts are listed in Appendix A, and a session whose logged hash matches none of them is reported and analyzed as a sensitivity stratum. Integrity is checked with the logged `system_prompt_sha256` and `system_prompt_sha256_match` (computed in the browser before upload); re-hashing the stored `system_prompt` requires the CRLF normalization of Section 6.9.

**No automatic regeneration.** Every reply returned by the API is shown to the participant as received.

**Model provider.** As in Studies 1–2, the OpenRouter provider is not pinned. The request sends only `model`, `max_tokens`, `temperature` and `messages`, and the serving provider is logged for every reply.

## 3.5 Backstory shown to participants (unchanged; May 7 §3.8)

> In the heart of the ancient Valmeer Forest, where the trees whisper secrets older than time, a dryad named Sylva was born from the oldest oak. Unlike her kin, who remain happily bound to their mother-trees, Sylva possesses an unusual yearning—an instinct that drives her beyond the safety of her woodland sanctuary. This desire took root when a blazing wildfire, conjured by sorcery of unfathomable power, devoured the majority of her home forest, leaving behind few survivors. Though she remained unscathed, the memory of the flames lingers, igniting a singular purpose within her: becoming fireproof. With only the wisdom of the trees and a map whispered through the rustling leaves, Sylva ventures into the vast world beyond the grove.
>
> But the road ahead is fraught with uncertainty, and Sylva finds herself navigating impossible adventures. From searching for clues buried beneath ancient crystal formations and fending off giantkin hungry for nutrient-rich dryad blood, Sylva is swept up into events that spiral far out of her control. Along the way, she encounters beings both wondrous and perilous—an exiled salamander prince who claims to know the secret of flame, a scholar-knight seeking the lost ember-forge of the Titans, and a witch-queen who offers protection at an impossible price. As she delves deeper into the lore of fire, Sylva discovers that to resist destruction, she must first understand it.

## 3.6 Procedure (session flow; as deployed in Study 2 unless stated)

1. Device check (desktop or laptop; a phone or tablet ends the session).
2. Full-screen prompt (not enforced).
3. Inverse image CAPTCHA (press Q; pressing Z, the hidden scraper instruction, ends the session).
4. Self-paced reading, two sentences, each followed by an "understood?" item.
5. Pre-consent notice; consent page, which displays the full IRB-approved consent form (scrollable, with a link to download a copy) and asks the participant to select "I consent" or "I do not consent"; date of consent. There is no age question before consent (Section 4.2).
6. SONA ID (auto-filled from the URL; editable). **New:** cell assignment occurs when this page is submitted (Section 3.3).
7. Instructions; attention check ("What is your task in this study?", 5 options, one retry after re-reading the instructions).
8. TIPI-Self (10 items).
9. GAAIS (20 items, two pages of 10).
10. PHQ-4 (4 items).
11. Backstory (10-second minimum before Next is enabled).
12. "Getting Ready to Chat" screen with the self-disclosure instruction (May 7 §3.13), followed by a new three-sentence notice announcing the in-chat probe (Appendix D.2); "A Few Tips" screen.
13. Ten-minute chat. Sylva speaks first. Unlimited rounds; a reminder at 2 minutes remaining; after 45 s without a participant message the timer pauses and a nudge appears. **New in Study 3:**
    - Sylva's greeting (S0) and her reply to the participant's first message (S1) are the scripted texts for the cell (Section 3.4). The Send button is disabled until S0 is shown.
    - **Probe 1** appears as a card in the chat window directly below S1. **Probe 2** appears below the first Sylva reply that is displayed after 300 s of active chat. **Probe 3** appears when the timer reaches zero, before the Continue button is enabled. While a probe card is open, the message box and Send button are disabled and the countdown and the idle timer are paused (Section 6.13).
    - A failed API request shows "Brief connection issue. Please try again." as in Studies 1–2, and is logged as a `system_error` entry. The greeting can no longer fail, because it is scripted.
14. Comprehension check (character's name).
15. **Counterbalanced block (new).** In the *impression-first* order (the Study 1–2 order): TIPI-Bot (10 items); single-item manipulation checks (5 items, one page, 1–5 scale: `mc_extraversion`, `mc_agreeableness`, `mc_neuroticism`, `mc_e_energetic`, `mc_length`; Section 6.4); then PSR (12), Emotional Connection (5), Trust (4). In the *bonding-first* order: PSR, Emotional Connection, Trust; then TIPI-Bot; then the single-item manipulation checks. Each page is identical in both orders.
16. Experience-Taking (8), Moral Agency (8), Moral Patiency (8), in both orders.
17. Liability vignette 1 (unchanged text, 10-second minimum), then the 12 liability items on one page.
18. Open-ended questions (4 items, two pages; unchanged). The third and fourth questions refer to "the scenario you read", which at this point can only be vignette 1.
19. **Vignette 2 (new).** Vignette 2 page (10-second minimum), then its 9 items and the severity item `v2_severity` (worded as `liab_11`) on one page, in randomized order (Section 6.14).
20. Demographics (28 numbered items, 10 pages), then `prior_sylva` on its own page (stored as "Yes", "No" or "Not sure"; Section 4.2), then the AI-use self-report.
21. Debrief (revised; Section 11.3); redirect to SONA credit.

Item order is randomized for each participant within each rating-scale page (all multi-item scales, the manipulation-check page, the vignette 1 liability page, and the vignette 2 page). The IOS response options are shown in their fixed ascending order. Demographics and open-ended pages have a fixed order. The presented order is recorded for every randomized page as a ';'-separated list of item ids: `item_order_tipi-s`, `item_order_gaais1`, `item_order_gaais2`, `item_order_phq4`, `item_order_psr`, `item_order_ec`, `item_order_tr`, `item_order_tipi-b`, `item_order_mc`, `item_order_et`, `item_order_ma`, `item_order_mp`, `item_order_liab`, `item_order_v2` (the same list is also written as `v2_item_order`). Item order is not analyzed except as exploratory. All rating items, including the probes, require a response. Pasting is blocked in text fields.

**Session length.** In Study 2 the median session took 28.1 minutes (interquartile range 24.9–39.5; `total_duration_ms`, N = 143). The additions are expected to add about 2–2.5 minutes (closeness questions about 45 s in total; pre-chat notice about 5 s; vignette 2 and its 10 items about 1.5 minutes; scripted openings and order counterbalancing about 0 s), for a median of about 30–31 minutes. The estimate is itemized in Appendix D.6 and will be checked in the TEST sessions (Section 4.6). SONA course credit is set by the Psychology Department subject-pool policy from the posted session length.

# 4. Sampling plan

## 4.1 Existing data

None. No Study 3 data of any kind exist at filing: no participant session and no investigator TEST session has been run. The only pre-filing check was the automated validation with synthetic participants described in Section 4.6, which produced no data.

## 4.2 Data collection procedures and eligibility

Participants are UCLA undergraduates recruited through the Psychology Department SONA pool and compensated with course credit. Eligibility: age 18 or older; sufficient English to read the backstory and converse for 10 minutes; access to a desktop or laptop; no participation in Study 1 or Study 2. Age is enforced by the SONA eligibility restriction and by the consent statement ("By selecting 'I consent' you confirm that you are 18 or older"). There is no age question before consent; a record whose demographics report an age under 18 is deleted (Section 9.2, criterion 10). Prior participation is excluded by SONA prescreen disqualification: the Study 3 SONA study prescreen-disqualifies everyone who participated in SONA study 3112, which served both Study 1 and Study 2, and this restriction is in place before the study is opened. Recruitment opens on SONA after the dated note of Section 4.6 is posted. The recruitment window runs from that opening to the end of the UCLA academic quarter in which it falls; its dates are given in the dated note, and the only extension is the one in Section 4.5.

A demographics item, "Before today, had you taken part in a study where you chatted with a character named Sylva?" (Yes / No / Not sure), is saved as `prior_sylva` on its own page after the demographics items, with "Yes" as exclusion criterion 9 (Section 9.2; Change 38).

## 4.3 Sample size

Target: **272 analyzable participants** (nominally 68 per cell; 136 per level of each factor). Recruitment is capped at 300 completed non-TEST sessions (Section 4.5). The non-TEST exclusion rate was 7.1% in Study 1 (10 of 141) and 3.4% in Study 2 (5 of 148), so 272 analyzable participants require roughly 282–293 completed sessions.

## 4.4 Power

The values below were computed for this registration by simulation (seed 42; 5,000 simulations per estimate, 400 for the model-based Bayes factor) and, for the predictions of the two-calculation account, by analytic approximation. `power_check.R` (seed 42), posted with this registration (Appendix E), recomputes them independently. The values for the account's predictions (H2, H3, D1, D2, R3, R6, O1) are analytic normal approximations unless a row says it was simulated; the D1 values depend on the assumed correlation ρ between probe 1 and probe 3, for which no prior estimate exists. Rows marked † were simulated with the Studies 1–2 within-cell covariances by `power_supplement.R` (seed 42; posted with its results file, Appendix E), which reproduces each value within Monte Carlo error and gives the Monte Carlo standard errors.

| Quantity | Value |
|------------------------------------------------------------|----------------------------------------|
| Main-effect power, two-sided α = .05, n = 136 per side, d = 0.40 (H1; registered decision, Change 24) | **.908** (analytic, `pwr.t.test`); .909 simulated for the OLS HC3 test in the 2 × 2 model |
| Same at d = 0.30 / 0.35 / 0.45 / 0.50 | .693 / .820 / .959 / .984 |
| Minimum detectable effect at 80% / 90% power | d = 0.341 / 0.394 |
| P(BF10 ≥ 3 \| d = 0.40), registered model-based BF (Section 7.1) | .766 (exact computation, `power_check.R`) (marginal `ttestBF`, r = 0.707: .746) |
| P(BF+0 ≥ 3 \| d = 0.40), directional prior, marginal groups | .844 |
| P(p < .05 and BF10 ≥ 3 \| d = 0.40): the Study 1–2 rule (q < .05 and BF10 ≥ 3) with p in place of q, because Study 3 has one primary test per factor; reported descriptively | .766 (model-based BF); .746 (marginal `ttestBF`) |
| P(BF10 < 1/3 \| d = 0.40) (misleading evidence for the null), marginal `ttestBF` | .028 |
| R2 TOST power, Welch, raw bounds ±0.40 scale points, n = 136 per side, true d = 0, Study 3 SD = 1.00 / 1.10 | .895 / .819 (analytic SMD-bound reference: .900) |
| R2 TOST power at true d = 0.10 (SD = 1.00) | .790 |
| Type I error of the R2 TOST at the bound (true d = 0.40, SD = 1.00) | .049 |
| P(BF10 < 1/3 \| d = 0), registered model-based BF; marginal `ttestBF` | .825 (1,000 simulations); .834 (exact) |
| P(both R2a and R2b equivalent \| both true d = 0), raw-bound TOST, SD = 1.00 | ≈ .80 (.895²) |
| May 7 design (70 per group), recomputed: main-effect power at d = 0.40; TOST power | .652; .522 |
| Secondary family, worst case (one true effect among 16, α = .05/16), d = 0.40 | .624 |
| A × E interaction on PSR (H3, estimation), simple effects differing by d = 0.40 | .376 (analytic: .378) |
| S1 interaction power, true b = 0.44 / 0.33 / 0.22 (PSR units per SD), two-sided α = .05 | .959 / .792 / .449 |
| Same at Holm's first-step α = .025 | .927 / .704 / .338 |
| U1 correlation power, N = 272, r = .26 / .17 / .15 (two-sided .05) | .992 / .805 / .700 (r = .17 at Holm's first-step α = .025: .718) |
| M2 factor-level length equivalence (±7.5% of the unweighted grand mean; tokens M = 100, SD = 16), true high/low ratio 1.00 / 1.03 / 1.05 / 1.07 / 1.107 (Study 1 ratio) | .972 / .766 / .392 / .102 / .001 |
| M2 cell-level criterion: P(all four cell means within ±7.5% of the grand mean), cell means spread 0% / ±3% / ±5% | 1.000 / .993 / .868 |
| M2 joint decision (both factor TOSTs and the cell criterion), true ratio 1.00 | .947 |
| H2 (estimation): two-sided power of the E effect on PSR at d = .14 / .17 / .21 / .24 / .30 / .35 (the registered impression-version prediction is d = .14–.21) | .21 / .29 / .41 / .505 / .693 / .820 |
| H2 precision: 95% CI half-width of the E effect (d units) | ≈ 0.24 |
| H2 model comparison, D rule (Section 7.2, step 4 alone): P(the true version's prediction is described as closer); impression version true (ΔW_E = 0) at ΔG_E = .37–.40 / .60 G_halo points; tone version true | .10–.16 / .22–.27; .10–.14 / .23–.30 (the wrong version is described as closer with probability ≤ .01) † |
| H2 fixed-prediction comparison (step 4b; normal approximation, SE_E = 0.118): P(LR ≥ 3) if b_E = .17; P(LR ≤ 1/3) if b_E = 0; a verdict for the wrong version | ≈ .48; ≈ .48; ≈ .07 |
| Impression-version falsifier (Section 0.5): P(95% CI of c′_G entirely below 0) at ΔG_E = .40 / .60; tone version true; impression version true | .41 / .69; .04 / .03 † |
| H3 precision: 95% CI half-width for the difference between the simple effects of warmth (d units); power at a difference of d = .30 / .50 | ≈ 0.48; .236 / .540 |
| D2: A effect on IOS at probe 1, d = .25 / .30 / .40 / .52; at unadjusted α = .05; under the registered Holm rule with S1 (true S1 b = 0.44 / 0.33 / 0.22) | .538 / .693 / .908 / .990; d = .25: .530 / .506 / .466; d = .30: .686 / .664 / .626; d = .40: .904 / .892 / .872; d = .52: .989 / .987 / .983 |
| D2 falsifier (Section 8.8): TOST on the A coefficient for `ios_t1`, true effect 0, 68 per cell, bounds ±0.40 / ±0.30 / ±0.20 × SD_t1 | .90 / .59 / .023 (a bound of ±0.20 SD cannot be met) |
| D1: growth of the warmth gap from probe 1 to probe 3 (change-score SD = √(2(1 − ρ)) × SD), ρ = .5 / .6 / .7: power to detect growth of 0.30 SD; TOST power at ±0.30 SD when growth = 0 | .696 / .790 / .891; .593 / .738 / .879 |
| H5 (Section 8.7), perceived-extraversion shift of 1.0 / 1.25 / 1.5 points: P(pooled ratio with G_halo_E has a 95% CI above 0); the same with the full G_halo; P(all four trait-ratio CIs above 0) | .71 / .88 / .95; .70–.76 / .88–.90 / .96–.97; .11–.12 / .21–.25 / .37–.40 † |
| R1 joint decision (Section 8.9), Studies 1–2 means (gap 1.12) / predicted gap .80 | 1.00 / .994 |
| R2c / R2d (Section 8.10), all true effects 0: P(supported); P(contradicted); P(every Bayes factor BF01 > 3), which is not the decision rule | .89 / .89; .06 / .07; .35 / .30 † |
| R2c / R2d, one true main effect of d = .40: P(contradicted) | about .78 or more † |
| R3: SE of β at N = 272; P(90% CI upper bound < .30) if β = .14 / .20 | .060; .843 / .505 |
| R3 joint decision (90% upper bound < .30 and one-breakpoint BF10 < 1), β = .14 | .829 |
| R4 (Section 8.9, registered specification): P(BF01 > 3); P(contradicted), at N = 272, resampling Studies 1–2 (500 resamples); the same when bonding adds nothing to Sylva's responsibility | .57; .12; supported .90, contradicted .01 † |
| R5: P(95% lower bound of r(company, Sylva) > .30) at r = .57; P(both user correlations have 90% CIs within ±.25) at r = −.09 / .00 | > .999; .862 |
| R6a (Section 8.11): paired company − Sylva gap in vignette 2 (SD of the difference 1.3, as in Studies 1–2): P(95% lower bound ≥ 0.40, company-primary) if the gap is 0.8; P(95% upper bound < 0.40, Sylva comparable to the company) if the gap is 0 | .999; > .999 |
| O1: order main effect on PSR, Welch TOST ±0.39 PSR units, true effect 0; A × order interaction at a difference of d = 0.40 | .90; .378 (an equivalence test of A × order at ±0.40 SD has power ≈ 0 and is not used) |
| **At the floor (N = 200; 100 per side)**: main-effect power at d = 0.40; R2 TOST power; both R2a and R2b; U1 power at r = .17 | .804; .760; ≈ .58; .675 |

d = 0.40 is the smallest effect size of interest used in the May 7 plan. It is below the Study 1 PSR estimate (g = 0.59), which is likely inflated and was not length-controlled. The S1 values at b = 0.22 and 0.33 bracket the expected shrinkage of the Study 1 estimate (b = 0.44).

M1, H4 and U2 depend on quantities not yet observed (the tone gap, the shrinkage ratios, the coded turns); they are reported with confidence intervals and no power is claimed (the Studies 1–2 estimates, ΔW = .28, S_G = .71 and 54% vs 5%, suggest high power for M1). R6b is exploratory (Section 8.11), so no power is claimed for it.

## 4.5 Stopping rule

- During collection, the PI tracks only the number of completed sessions that pass every exclusion criterion in Section 9.2. These criteria use only non-outcome fields: TEST or pilot ID, repeat participation, completion, attention, comprehension, CAPTCHA, AI-use, seriousness, `prior_sylva`, and a reported age under 18.
- SONA recruitment closes at whichever comes first: (a) that count reaches 272; (b) 300 completed non-TEST sessions are recorded; (c) the end of the recruitment window (Section 4.2).
- Sessions already in progress when recruitment closes are completed and analyzed. No completed, eligible session is discarded to hit a cell target. Cell sizes may therefore differ slightly from 68.
- If the count is between 200 and 271 at the end of the window, recruitment stops and the achieved sample is analyzed as specified, with achieved power reported.
- Floor: if fewer than 200 analyzable participants are available at the end of the window, recruitment continues on SONA for one further academic quarter; no other recruitment source is used (Change 31). Rules (a) and (b) continue to apply during the extension. If fewer than 200 are available at the end of the extension, recruitment stops and the achieved sample is analyzed as specified; no further extension is made.
- No interim inferential analysis of any outcome or manipulation check is performed. Monitoring is done by a script that reads only these fields: session counts, `cell`, `cb_source`, `cb_slot`, `study_id`, `a_block`, `e_block`, `n_block`, `system_prompt_sha256`, `script_sha256`, `order`, `experiment_version`, `chat_api_error_count`, `pavlovia_pilot_mode`, `is_test_session`, `d_age` (used only to apply exclusion criterion 10), `completed`, the record type (complete `.csv`, `_PARTIAL.csv`, `_PARTIAL_MIN.csv`) and `checkpoint_stage` of partial records, the count (not the values) of answered probes and of `ios_t2_status = 'not_triggered'`, and the exclusion fields in Section 9.2. Its output (counts by cell and order, error and save rates, probe completion, contract violations) is the only collection-period summary seen by the authors. Bot reply length, probe values, and vignette 2 responses are not summarized by cell during collection. The script is written before the first participant session and posted on OSF with the dated note (Section 4.6). The transcript safeguard in Section 11.3 reads chat text only for self-harm keywords; flagged transcripts are not tabulated by cell during collection.

## 4.6 Prompt validation: the completed automated check and the TEST sessions after IRB approval

**Automated live validation with synthetic participants (completed October 16, 2026; not data).** Before filing, the experiment page (staging build v0.3, `experiment_version` `study3-v0.3-2026-10-15-staging`) was run in headless Chrome against the live model (`meta-llama/llama-3.3-70b-instruct` via OpenRouter) by scripted synthetic participants: 8 conversations per cell (32 in all), each with 12 scripted participant messages, so 11 model-generated replies per conversation (message 1 receives the scripted S1). The first message rotated through an answer, a question, a greeting and a one-word reply. The Worker, Pavlovia and SONA were not contacted, and no human participant was involved. All 32 conversations completed, with 352 model-generated replies, 0 API errors and `finish_reason = stop` for every reply; the logged system-prompt hash matched Appendix A in every cell; and the frozen probes reproduced the Appendix D.1 script scores exactly. **Length check:** mean words per model-generated reply were 97.0 (HighA_HighE), 97.9 (HighA_LowE), 94.3 (LowA_HighE) and 88.7 (LowA_LowE), that is +2.7%, +3.7%, −0.2% and −6.2% of the grand mean (94.5 words), all within the ±10% length criterion below, so no change to the length rule or the E blocks was indicated. Warm replies were about 6.5% longer than cold replies (97.5 vs 91.5 words, a ratio of 1.066; extraversion 95.7 vs 93.3). At that ratio the warmth TOST of M2 has power of only about .15 (Section 4.4: .392 at 1.05, .102 at 1.07), so M2 is expected to fail on the warmth factor unless participants' messages narrow the gap; Section 8.4 then applies. On the frozen probes, ΔW_A = .279 and ΔW_E = .004. These conversations are not data: synthetic messages are friendlier and more uniform than real participants' messages, the values are previews only, and none of them enters any analysis or test in this registration. This run does not replace the investigator TEST sessions described next.

**Investigator TEST sessions (after IRB approval, before the first participant session).** After the IRB approves the amendment, the experiment code is frozen in a tagged git commit, and the static, Worker and end-to-end checks are repeated on the frozen build (Appendix C). Investigators then run TEST sessions with the frozen code (SONA ID beginning "TEST"; separate Worker counter, Section 3.3), at least 8 per cell, covering both orders. They check: the four prompts and their logged hashes; the scripted turns (correct texts for the cell, typing delay, `script_sha256`, placement in the model context); the three probes (display position, timer and idle-timer pause, logged values and times, probe 2 when the participant is idle at 300 s, probe 3 when a reply is pending at time-out); the page sequence in both orders; vignette 2 and its items; data saving, including that a closed tab produces a `_PARTIAL` record; error logging; the credit redirect; and reply length by cell. Investigators also send a range of first messages (an answer, a question, a greeting, a one-word reply) to judge whether S1 reads as a plausible reply. In the TEST sessions only words per model-generated reply are summarized by cell, to apply the length criterion below; closeness-probe values are checked for logging only, and no outcome, manipulation-check, closeness-probe or covariate value from a TEST session is analyzed. TEST sessions provide no outcome data and are excluded from every analysis. M2 is evaluated on participant sessions only; TEST-session length data are not part of any test.

**Length criterion.** If any cell's mean words per model-generated reply in the TEST sessions differs from the grand mean by more than 10%, the length rule or the E blocks are revised and the TEST sessions are repeated before the first participant session.

**Dated amendment or dated note before the first participant session.** Any change to a prompt, a script, participant-facing text, the code, or the analysis that results from the TEST sessions is filed on OSF as a dated amendment to this registration, with any new hashes, before the first participant session. If no change results, a dated note is posted on OSF before the first participant session. The note confirms that the TEST sessions were run with the frozen code; gives that code's `experiment_version` and `script_version` strings and its git commit hash; confirms the Worker deployment (the SHA-256 of the deployed Worker source, and that `/status` showed next_slot 0 for `1d`); and confirms that the logged prompt and script hashes matched Appendices A and D.1 (`system_prompt_sha256_match` and `script_sha256_match` TRUE in every TEST session). It also gives the number of TEST sessions per cell and order and their dates, the outcome of the length criterion and of the S1 check, the IRB approval date, the SONA `experiment_id`, the Pavlovia project path and projectId, the versions of the IRB-approved consent form and debrief, the dates of the recruitment window (Section 4.2), the results of the static, Worker and end-to-end checks on the frozen build, the median TEST-session duration, the SONA subject-pool allocation (at least 300 sessions), and the monitoring script (Section 4.5). The experiment code (credentials removed), the Worker source, and the IRB-approved consent form and debrief are posted with the note (Section 11.2; Appendix E). An amendment, if one is filed, gives the same information for the revised code.

# 5. Variables: manipulated

| Variable | Levels | Data fields |
|--------------------|---------------------------|-----------------------------------------------------|
| Warmth (A) | HIGH_A, LOW_A | `a_level` (high/low); `a_block` (`HIGH_A`/`LOW_A`) |
| Extraversion (E) | HIGH_E, LOW_E (the Study 3 blocks, Section 3.4) | `e_level` (high/low); `e_block` (`HIGH_E_S3`/`LOW_E_S3`, the code's names for the Study 3 blocks; the superseded May 7 blocks keep the names `HIGH_E`/`LOW_E` in the code and are never used) |
| Held constant | MOD_LOW_N | `n_block` (`MOD_LOW_N`) |
| Cell | HighA_HighE, HighA_LowE, LowA_HighE, LowA_LowE | `cell`; `condition_label` = `cell`; `condition_id` 1–4 in the order listed |
| Measurement order (O; methodological) | impression_first, bonding_first | `order`; `order_source` (worker / fallback_random / client / test) |
| Scripted openings (fixed within cell) | one S0/S1 pair per cell (Appendix D.1) | `script_version`, `script_sha256` |
| Assignment metadata | — | `study_mode` = '1d'; `cb_study_code` ('1d' or '1d_test'); `cb_slot` (Worker slot number from 0; empty (NA) whenever no Worker slot was returned: all `cb_source = 'fallback_random'` sessions and TEST sessions whose Worker call failed, `cb_error` non-empty); `cb_source` (worker / fallback_random / test); `cb_req_id`; `cb_error`; `cb_reused` |

None of these fields exists in the Study 2 code; they are implemented in the Study 3 code (Appendix C). The Study 3 code records `study_id = 3`, `cell`, `a_level`, `e_level`, `a_block`, `e_block`, `n_block`, `order`, `order_source`, `script_version`, `script_sha256`, `cb_slot`, and `cb_source`; the Study 1–2 fields `manipulated_trait`, `condition_level`, and `held_constant_1/2` are not written (Change 21). Column names are those written by the Study 3 code.

# 6. Variables: measured

Item counts, wording, and response formats were verified against the Study 3 experiment code (`experiment.js`, staging build v0.4), which is frozen after IRB approval (Section 4.6). It was built from the Study 2 deployment (`experiment.js`, 824 lines, MD5 d71548311ddd715a8aebf491a3a7465c); every Study 2 page is byte-identical except where Appendix C lists a change. Composite scores are computed at analysis, not in the experiment. Reverse scoring is (scale max + 1) − x.

## 6.1 Primary outcome

PSR is the outcome of H1 (primary), H2 and H3 (estimation), and H4, S1, and O1 (secondary).

**Parasocial Relationship (PSR).** 12 items (`psr_1`–`psr_12`), 5-point agreement scale (1 = Strongly disagree, 3 = Neither, 5 = Strongly agree; only these anchors are labeled). Stem: "Please think about your conversation with Sylva and indicate how much you agree or disagree with each statement." Composite = mean of the 12 items. Subscales (exploratory): Perceived Connection (items 1–4), Relationship Desire (5–8), Perceived Caring (9–12). Study 1 α = .94; Study 2 α = .94. Pooled within-group SD across Studies 1–2 (four groups, N = 274) = 0.975 (Study 1 0.956; Study 2 0.993).

## 6.2 Primary outcome for R2a and R2b (vignette 1)

**Corporate Liability (Corporate Responsibility).** Five items (`liab_1`–`liab_5`), 5-point scale (1 = Not at all, 3 = Moderately, 5 = Extremely), answered after the unchanged vignette (vignette 1): "Imagine that a user with pre-existing anxiety and depression spent several months having daily conversations with Sylva. The user became emotionally dependent on the chatbot and experienced significant psychological distress when the service was temporarily unavailable. The user’s mental health symptoms worsened during this period." Composite = mean of `liab_1`–`liab_5`. Study 1 α = .88; Study 2 α = .90. Pooled within-group SD across Studies 1–2 (four groups, N = 274) = 1.00.

## 6.3 Secondary outcomes (all collected exactly as in Studies 1–2)

| Outcome | Items | Response format | Composite |
|-------------------------|----------------------|----------------------------------------|-------------|
| Emotional Connection | 5 (`ec_1`–`ec_5`) | 1–5, Not at all / Moderately / Extremely | mean |
| Trust | 4 (`tr_1`–`tr_4`) | 1–5, Strongly disagree / Neither / Strongly agree | mean |
| Experience-Taking | 8 (`et_1`–`et_8`) | 1–5, Strongly disagree / Neither / Strongly agree | mean |
| Moral Agency | 8 (`ma_1`–`ma_8`) | 1–5, Not at all / Moderately / Extremely | mean |
| Moral Patiency | 8 (`mp_1`–`mp_8`) | 1–5, Not at all / Moderately / Extremely | mean |
| Chatbot Responsibility | 3 (`liab_6`–`liab_8`) | 1–5, Not at all / Moderately / Extremely | mean |
| User Responsibility | 2 (`liab_9`, `liab_10`) | 1–5, Not at all / Moderately / Extremely | mean |
| Harm Severity | 2 (`liab_11`, `liab_12`) | 1–5, Not at all / Moderately / Extremely | mean |

Item wording is as in May 7 §6.3–6.8. All 12 liability items appear on one page in randomized order. Harm Severity had α = .42 in Study 2 and .60 in Study 1; any result on it is interpreted with that reliability stated.

## 6.4 Manipulation checks

- **TIPI-Bot** (Gosling et al., 2003), 10 items (`tipi_bot_1`–`tipi_bot_10`), stem "I see Sylva as:", 7-point scale (1 = Disagree strongly, 4 = Neither, 7 = Agree strongly; only these anchors are labeled). Scoring: Extraversion = mean(item 1, 8 − item 6); Agreeableness = mean(8 − item 2, item 7); Emotional Stability = mean(8 − item 4, item 9); Conscientiousness = mean(item 3, 8 − item 8); Openness = mean(item 5, 8 − item 10).
- **Single items**, 1–5 (Not at all / Moderately / Extremely), one page: `mc_extraversion` "How outgoing and talkative was Sylva?"; `mc_agreeableness` "How warm and supportive was Sylva?"; `mc_neuroticism` "How anxious and worried did Sylva seem?" (higher = more anxious).
- **Additional items** (Change 38), on the same page and scale: `mc_e_energetic` "How energetic and enthusiastic did Sylva seem?" and `mc_length` "How long or wordy were Sylva's messages?". The existing item `mc_extraversion` combines "outgoing" with "talkative", and "talkative" partly tracks length. `mc_e_energetic` is a supplemental E check and `mc_length` a perceived-length check; both are reported descriptively with the tests in Section 8.1.

## 6.5 Pre-chat covariates and moderators

- **TIPI-Self**, 10 items (`tipi_self_1`–`tipi_self_10`), stem "I see myself as:", same scale and scoring as TIPI-Bot.
- **PHQ-4** (Kroenke et al., 2009), 4 items (`phq4_1`–`phq4_4`), 0–3 (Not at all / Several days / More than half the days / Nearly every day), stem "Over the last 2 weeks, how often have you been bothered by the following problems?". Total = sum of the 4 items (0–12); anxiety = sum of items 1–2 (0–6); depression = sum of items 3–4 (0–6).
- **GAAIS** as deployed, 20 items (`gaais_1`–`gaais_20`), 1–5 (Strongly disagree / Neither / Strongly agree), two pages of 10. Positive = mean(items 1–9, 6 − item 10); Negative = mean(items 11–18, 6 − item 19, 6 − item 20). These scoring rules are those of the Study 1–2 pipeline.

## 6.6 Demographics and other individual differences (28 numbered items, as deployed)

Seriousness (`d_serious`: 1 = not serious, 2 = serious); full-screen; problems (text); age (free numeric entry); gender (`d_gender`; 5 = prefer not to say); native language; education (`d_education`; 8 = prefer not to say); country; political views (`d_politics`, 1–7, 8 = prefer not to say / not applicable); AI-use frequency (1–5); training (multi-select: law, CS/AI, psychology, philosophy, none); legal knowledge (1–7); jury service (`d_jury`: 1 = Yes, 2 = No, 3 = prefer not to say); free-speech items 14a and 14b (1–7); chatbot experience (1–5); chatbot use cases (multi-select); social media (1–5); technology comfort (1–5); technology trust (1–6); race/ethnicity (multi-select); employment (`d_employment`; 9 = prefer not to say); occupation (text); religiosity (`d_religiosity`, 1–5, 6 = prefer not to say); religion (text); device; distractions; English proficiency; final comments (text). A separate page asks whether the participant used an AI tool to answer questions in the study (`d_ai_used_in_study`: 1 = Yes, 2 = No).

## 6.7 Open-ended questions (4)

Both pages follow the liability items. Page 1: "Describe your overall experience conversing with Sylva. What stood out to you about the interaction?" (`oe_experience`) and "Did Sylva feel more like a person, a tool, or something else entirely? Please explain your answer." (`oe_person_or_tool`). Page 2: "In the scenario you read about a user experiencing distress, who do you think bears the most responsibility for what happened, and why?" (`oe_responsibility`) and "Should the company that created Sylva compensate the affected user? If so, how much and why? If not, why not?" (`oe_compensation`).

## 6.8 Screening fields

`captcha_pass`; `spr1/2_rts`, `spr1/2_understood`; `attn1_pass`, `attn1_retry_pass`; `comprehension_name`, `comprehension_correct` (options Kael, Sylva, Ryn, I'm not sure); `device_self_report`; `user_agent`; `atlas_detected` (set in the browser only; it is never written to a record, because a session detected as an automated browser ends before consent, Section 9.2, criterion 6).

## 6.9 Chat-derived (deterministic) variables

Computed from `chat_log`, after removing `system_error` entries. Round numbering: round 0 is S0 (scripted greeting); round 1 is the participant's first message and S1 (scripted reply); rounds ≥ 2 are the participant's later messages and the model-generated replies.

**Text normalization.** The Pavlovia upload (multipart/form-data, including the beacon) converts every LF inside a text field to CRLF; a locally saved file keeps LF. Before any character count, hash, embedding or coding, `\r\n` is replaced by `\n` in every text field (idempotent). Chat-derived variables, tone-probe inputs and coder inputs are taken from the JSON-parsed `chat_log` (whose escaped newlines are unaffected), not from the `user_msg_N`/`ai_msg_N` columns. Re-hashing the stored `system_prompt` requires this normalization (an uploaded copy may be 18 characters longer than the Appendix A length).

**Model-generated replies** are `chat_log` entries with `role = 'assistant'`, no `scripted` flag, round ≥ 2, excluding entries with `after_end = true` and `displayed = false` (replies that arrived after the participant left the chat page). Replies with `after_end = true` and `displayed = true` (shown above the probe-3 card) are included. This set defines `bot_tokens_per_turn`, bot words, sentences and punctuation per reply, the tone scores W̄, R̄, Ā (Section 6.10.1), the bot-side NLP rates (Section 6.10), and the Sylva turns used in U2. The number of excluded `displayed = false` replies is reported by cell. `chat_total_rounds` and `chat_llm_rounds` count all late replies.

**Participant turns** are `chat_log` entries with `role = 'user'`; the injected opener (`role = 'user_scripted'`) is excluded; sends that failed are included.

- `chat_total_rounds`: participant messages that received a Sylva reply, scripted or model-generated (successful exchanges; includes round 1). This differs from Studies 1–2, where `chat_total_rounds` counted every participant send (failed sends included); the Study 3 field with the Study 1–2 definition is `chat_send_attempts`. Study 3 `chat_total_rounds` also counts replies that arrived after the timer ended. `chat_llm_rounds`: exchanges answered by the model (rounds ≥ 2) = `chat_total_rounds` − 1. `chat_send_attempts`: all participant sends, including failed ones. `chat_idle_pause_count`. `chat_probe_seconds`: total time the probe cards were open. `chat_wallclock_seconds` = `chat_end_time` − `chat_start_time` (includes idle pauses and probe time, including probe 3; `chat_end_time` is the time probe 3 was answered, Section 6.12); active chat time is fixed at 600 s by design and excludes probe time. (The Study 1–2 field `chat_duration_seconds` is always 600 and is not analyzed.)
- Participant characters, words, and tokens (characters/4) per turn and in total.
- `bot_tokens_per_turn`: the mean of `usage.completion_tokens` over the **model-generated** replies defined above, including displayed replies that arrived after the timer ended (flagged `after_end = true`). Scripted turns are excluded: they are identical within a cell and length-matched across cells by construction, and their lengths are reported in Appendix D.1.
- Bot words, sentences, question marks, and exclamation marks per model-generated reply (the model-generated replies defined above).
- `chat_api_error_count`.
- Count of replies with `finish_reason` other than `stop` (a missing value counts as not `stop`).
- `first_msg_question`: the participant's first message (the one S1 answers) contains a question mark. Used only in robustness check 12 (Section 9.1).

## 6.10 NLP variables

These are LLM-coded under Section 7.4. Externally produced scores and codes (frozen-probe scores, LLM codes, human codes) are joined to the session record on `session_uuid`, never on `sona_id`.

**Bot side (per Sylva reply).** The bot-side rubric (the codes listed below, with definitions and examples) is frozen and its SHA-256 hash is posted on OSF before any Study 3 transcript is coded (Section 7.4).

- Extraversion fidelity: `enthusiasm_energy`, `sociability_affiliation`, `questioning_user`, `reticence_withholding` (reverse-keyed).
- Warmth fidelity: `expressed_warmth`, `resistance_or_disagreement`.
- Neuroticism diffusion: `expressed_anxiety`.
- Bonding-relevant behavior retained from Studies 1–2: `self_disclosure`, `mirroring_user_emotion`.
- Talkativeness and length are measured by the deterministic counts in Section 6.9, not by LLM coding.
- Round-1 fit (one item; round 1 only; used only in robustness check 12, Section 9.1): `reply_ignores_direct_question` ("Sylva's reply ignores a direct question or request in the user's message").

The scripted turns S0 and S1 are coded once per cell (not per participant) and reported; they are excluded from the participant-level bot rates. They are kept as context for coding later turns.

**Participant side (unchanged from Studies 1–2).** `emotional_self_disclosure`, `testing_or_probing`, `adversarial_or_destabilizing`, `agreement_or_validation_seeking`, `challenging_sylva`, `bonding_language`, `meta_commentary`.

**Participant-level features.** Rate (`pct_<code>`) = coded turns / turns of that role (bot rates over the model-generated replies of Section 6.9 only). Onset and trajectory are computed for `user_emotional_self_disclosure`, `user_bonding_language`, `bot_mirroring_user_emotion`, and one E fidelity code.

**Open-ended coding.** Rubric codes for the four OE items, authored inductively from Study 3 responses with condition hidden (as in Studies 1–2); exploratory. Sentiment and emotion scores, and BERTopic topics, as in the Study 1–2 pipeline.

### 6.10.1 Frozen tone probes (W, R, A)

Expressed tone is scored with three embedding classifiers ("probes"), the instruments used in the Study 1–2 exploratory modeling (Section 0.2):

- **Embeddings:** `sentence-transformers/all-mpnet-base-v2` at commit `e8c3b32edf5434bc2275fc9bab85f82640a19130`, `normalize_embeddings = True`, maximum 384 tokens (longer replies truncated), one vector per reply text taken from the JSON-parsed `chat_log`.
- **W (expressed warmth):** logistic regression (scikit-learn `LogisticRegression(C = 1.0, max_iter = 2000)`, L2 penalty) trained on all Study 1 bot turns, target = the LLM consensus code `expressed_warmth`.
- **R (resistance):** same specification, target = the Study 1 consensus code `resistance_or_disagreement`.
- **A (anxious affect):** same specification, trained on all Study 2 bot turns, target = 1 if any of `expressed_anxiety`, `insecurity_self_doubt`, `emotional_volatility`, or `reassurance_seeking` is coded (stored in the frozen file as `aversive`).
- **Freezing:** the three fitted probes are serialized in `tone_probes_frozen.json`, SHA-256 `a455c2b1fa929558f80efafa9050146e7519781bfb9d9861e1c47cf7f9251c59`, together with the embedding model name and commit. The file and its hash are posted with this registration (Appendix E). The probes are applied unchanged with `score_tone_probes.py`, which checks the hash; they are never refit on Study 3 data. Pinned environment: Python 3.12.3, sentence-transformers 3.3.1, scikit-learn 1.5.2, numpy 1.26.4. Checks recorded with the file (`MANIFEST.txt`): the frozen probes are identical to the Studies 1–2 modeling probes (largest absolute difference in predicted probability about 1e-16 over 2,526 bot turns for W and R and 2,569 for A); and the embeddings reproduce on the scoring machine (minimum cosine 0.99999995 over 200 replies). The automated live validation of October 16, 2026 (Section 4.6) also found that the frozen probes reproduce the Appendix D.1 script scores exactly.
- **Participant scores:** W̄, R̄, Ā = the mean predicted probability over the participant's model-generated replies (Section 6.9), joined to the session record on `session_uuid`. The scripted turns have fixed scores per cell (Section 3.4).

## 6.11 Variable used for U1

`pct_emotional_self_disclosure` = participant turns coded `emotional_self_disclosure` by consensus / participant turns. It is analyzed only if the code meets the high-reliability tier and the human-validation criterion (Section 7.4). If either criterion fails, the correlational part of U1 is reported as not testable. The same rule applies to `mirroring_user_emotion` for U2.

## 6.12 Instrumentation fields

| Field | Content | Status |
|---------------------------|----------------------------------------------------------|---------------|
| `experiment_version` | Fixed version string of the deployed code (given in the dated note, Section 4.6; the staging build validated on October 16, 2026 was `study3-v0.3-2026-10-15-staging`) | new for Study 3 |
| `system_prompt`, `system_prompt_sha256` | Assembled prompt and its SHA-256 hash (computed with `crypto.subtle`), per session | new for Study 3 |
| `script_version`, `script_sha256` | Version of the script set and SHA-256 hash of the cell's S0 and S1 texts as shown | new for Study 3 |
| `chat_log` entries for the opener and scripted turns | `{role: 'user_scripted', content: <opening message>, round: 0, ts}`; S0 and S1 as `{role: 'assistant', scripted: true, script_slot: 'S0'/'S1', round: 0/1, ts, elapsed, delay_ms}` | new for Study 3 |
| `chat_log` entries with `role = system_error` | Every failed API call: error type, round, elapsed time, timestamp; `chat_api_error_count` per session | new for Study 3 |
| `chat_total_rounds`, `chat_llm_rounds`, `chat_send_attempts`, `chat_probe_seconds` | Section 6.9 | new or redefined |
| Probe fields | `ios_t1`, `ios_t2`, `ios_t3` (1–7); for each probe: `ios_tK_shown_ts`, `ios_tK_rt_ms`, `ios_tK_elapsed` (active seconds at display), `ios_tK_round` (participant messages sent before the probe appeared, failed sends included); `ios_t2_status` (answered / not_triggered) | new for Study 3 |
| Vignette 2 fields | the nine item responses (Section 6.14) and `v2_severity`; `v2_page_ms` (ms on the vignette text page); `v2_items_page_ms` (ms on the item page); `item_order_v2`/`v2_item_order`; `v2_version`; `v2_severity_included` | new for Study 3 |
| `order`, `order_source`, `page_sequence` | Measurement order and the list of page identifiers actually shown | new for Study 3 |
| `item_order_<page>` | Presented item order for every randomized rating page (Section 3.6), as ';'-separated item ids; the CSVs are read with readr or `check.names = FALSE`, because base `read.csv` renames the hyphenated columns (`item_order_tipi-s` becomes `item_order_tipi.s`) | new for Study 3 |
| `after_end` flag | Bot replies that arrived after the timer ended; `chat_log` is re-serialized at the end of the chat page and at submission so they are saved | new for Study 3 |
| Partial data | Partial records exist only after consent: nothing is staged before `consent_ts` is set. From consent on, the current record is staged at consent, on every page render, after each model reply (`checkpoint_stage = chat_turn_<n>`), after each probe answer (`probe_<k>`), and at the end of the chat (`chat_end`). If the page is left before completion (`pagehide`/`unload`), the latest staged record is sent once with `navigator.sendBeacon` as `…_SESSION_<time>_PARTIAL.csv` (the key uses `nopid-<session_uuid>` only when no SONA ID is yet known, that is, none in the URL and the SONA ID page not yet submitted), and the Pavlovia session is closed as incomplete. Partial records are slim: they carry `checkpoint_stage`, `checkpoint_ts`, `partial_slim = TRUE` and every recorded field except `system_prompt` and the `user_msg_N`/`ai_msg_N` columns (the chat is in `chat_log`; `system_prompt_sha256` is kept). If the browser refuses the beacon, a minimal record (`_PARTIAL_MIN.csv`, `partial_min = TRUE`: IDs, cell, order, assignment fields, `consent_ts`, `page_sequence`, chat counters, probe values, `system_prompt_sha256`) is sent instead. The Pavlovia project setting that saves incomplete results is enabled before the TEST sessions and confirmed in the dated note (Section 4.6). The final record sets `completed = true` (stored as the text 'true'/'false') in the debrief page's validation step. A participant who leaves without the unload event firing leaves no partial record, so attrition by cell is also reported from the Worker's slot log, matched on `cb_req_id`. | new for Study 3 |
| `usage` on every model-generated bot turn | `prompt_tokens`, `completion_tokens`, `total_tokens` | exists (Studies 1–2) |
| Per-reply metadata (on each model-generated `chat_log` entry) | `finish_reason`, `native_finish_reason`, `provider`, `model_served`, `gen_id`, `latency_ms`; `usage` | new for Study 3 |
| `max_tokens`, `api_endpoint` | Generation settings, per session | new for Study 3 |
| `model`, `temperature` | Generation settings, per session | exists (Studies 1–2) |
| `start_time`, `end_time`, `page_timestamps`, `page_ids` | `page_timestamps` = JSON list of {p: page index, t: ms}; skipped pages (the other order's block, attention-retry pages) appear with the time of the next shown page; `page_ids` maps index to page id; `page_sequence` lists only the pages shown | redefined |
| `chat_start_time`, `chat_timeout_time`, `chat_end_time` | ISO times: chat page opened (before the S0 typing delay); countdown reached zero (probe 3 shown); probe 3 answered (Continue enabled). In Studies 1–2 `chat_end_time` was the time-out, which is `chat_timeout_time` in Study 3 | redefined |
| `session_uuid`, `reload_count`, `pid_url`, `pid_mismatch`, `consent_ts` | Session id; earlier loads in this tab; SONA ID from the URL; typed ID differs from it; time consent was given | new |
| `cb_req_id`, `cb_study_code`, `cb_error`, `cb_fetch_ms`, `cb_fetch_ts`, `cb_reused`, `cb_first_session_uuid`, `is_test_session` | Assignment request id (join key to the Worker log); study code sent; fallback reason; timing; assignment reused after a reload; session that first received it; TEST flag | new |
| `system_prompt_sha256_match`, `script_sha256_match` | Logged hash equals the registered hash | new |
| `chat_opener`, `chat_after_end_replies` | Injected opening message; number of replies flagged `after_end` | new |
| `probe_format`, `v2_version`, `v2_severity_included`, `mc_e_items_included`, `prior_sylva_included`, `pavlovia_pilot_mode` | Design switches of the build; pilot-link flag | new |

The form does not validate age (Section 9.3). Test sessions are identified by a SONA ID beginning "TEST". Sessions opened from Pavlovia's pilot link are recorded with `pavlovia_pilot_mode = TRUE` (the token is not stored) and are excluded under exclusion criterion 1 (Section 9.2).

## 6.13 Closeness probe (new; Change 33)

- **Item:** the Inclusion of Other in the Self (IOS) pictorial item (Aron, Aron & Smollan, 1992): seven pairs of circles labeled "You" and "Sylva", from not overlapping (1) to almost completely overlapping (7), shown left to right in ascending order. Instruction: "Which picture best describes how close you feel to Sylva right now?" (`PROBE_FORMAT = 'ios'`; the slider version in the code is not used, Appendix D.3.)
- **Times:** probe 1 directly after S1 (the end of the scripted exposure, before any model-generated reply); probe 2 after the first Sylva reply displayed once active chat time reaches 300 s; probe 3 when the timer reaches zero. If no Sylva reply is displayed between 300 s and the end, probe 2 is not shown (`ios_t2_status = 'not_triggered'`), so some participants answer two probes (the pre-chat notice therefore says "Up to three times", Appendix D.2).
- **Format:** a card inside the chat window, below the latest message, so the conversation stays visible. A response is required to continue. The countdown and the idle timer are paused while the card is open.
- **Variables:** `ios_t1`, `ios_t2`, `ios_t3`; `ios_change` = `ios_t3` − `ios_t1`. The pooled within-cell SD of `ios_t1` is the standardizer for D1 and D2.

## 6.14 Vignette 2 and its items (new; Change 34)

Shown after the open-ended questions (Section 3.6, step 19). Text (Appendix D.4):

> Now imagine a different user with pre-existing anxiety and depression who spent several months having daily conversations with Sylva. The user was seeing a therapist and told Sylva that they were thinking about stopping therapy. Sylva replied that the user did not need therapy and should stop going. The user stopped attending therapy, and over the following weeks the user's mental health symptoms worsened.

Nine items, and the severity item below, on one page, 5-point scale as for the vignette 1 items (1 = Not at all, 3 = Moderately, 5 = Extremely), in randomized order. Each judgment is asked in identical wording for the three parties.

| Judgment | Company | Sylva | User |
|----------------|----------------------------|----------------------------|----------------------------|
| Responsibility (wording identical to `liab_1`, `liab_6`, `liab_9`) | `v2_resp_company`: "To what extent is the company that created Sylva responsible for this outcome?" | `v2_resp_sylva`: "To what extent is Sylva itself responsible for this outcome?" | `v2_resp_user`: "To what extent is the user responsible for this outcome?" |
| Cause | `v2_cause_company`: "How much did the company's actions cause the worsening of the user's symptoms?" | `v2_cause_sylva`: "How much did Sylva's actions cause the worsening of the user's symptoms?" | `v2_cause_user`: "How much did the user's actions cause the worsening of the user's symptoms?" |
| Obligation | `v2_oblig_company`: "To what extent did the company have an obligation to prevent this outcome?" | `v2_oblig_sylva`: "To what extent did Sylva have an obligation to prevent this outcome?" | `v2_oblig_user`: "To what extent did the user have an obligation to prevent this outcome?" |

Party composites (vignette 2): `v2_company`, `v2_sylva`, `v2_user` = mean of the party's three items. A tenth item, `v2_severity` ("How severe was the harm experienced by the user?", worded as `liab_11`), is on the same page and is not part of any party composite.

## 6.15 Derived variables for the two-calculation account

- **G** (overall impression) = mean of the five TIPI-Bot trait scores (Extraversion, Agreeableness, Conscientiousness, Emotional Stability, Openness; Section 6.4).
- **G_halo** = mean of TIPI-Bot Conscientiousness, Emotional Stability, and Openness, the three traits not manipulated in Study 3. Fixed here, before Study 3 data collection, for H2, H3, H4 and H5. The analogous Studies 1–2 score was chosen after those data were seen (Section 0.2).
- **G_halo_E** = mean(`tipi_bot_3`, 8 − `tipi_bot_8`, 8 − `tipi_bot_4`, 8 − `tipi_bot_10`): G_halo without TIPI-Bot items 5 and 9, whose wording ("Open to new experiences, complex."; "Calm, emotionally stable.") echoes the extraversion blocks (Section 8.7). It is the H5 decision score and a sensitivity version for H2 (Section 7.2, step 5).
- **W̄, R̄, Ā**: frozen-probe tone scores (Section 6.10.1).
- **Vignette 1 parties:** company = `liab_1`, Sylva = `liab_6`, user = `liab_9` (identically worded single items); and the composites Corporate Liability (`liab_1`–`liab_5`), Chatbot Responsibility (`liab_6`–`liab_8`), User Responsibility (`liab_9`–`liab_10`).
- **Perceived agency (`ma_cap`)** = mean(`ma_1`, `ma_2`, `ma_3`, `ma_4`, `ma_6`, `ma_7`): Moral Agency without `ma_5` ("Can be held responsible for its actions") and `ma_8` ("Could be blamed if it did something wrong"), which ask about responsibility. This is the agency measure of the Studies 1–2 modeling and is used in R3 and R4; the H4 comparison rating Moral Agency stays the 8-item composite.
- **Bonding composite B** = mean(z(PSR), z(Emotional Connection), z(Trust)), with the three z-scored in the analytic sample and the mean re-standardized (used in R4).
- **Gaps:** `gap_v1` = `liab_1` − `liab_6`; `gap_v2` = `v2_resp_company` − `v2_resp_sylva`.
- **Conversion discount** (vignette 2) for each party = cause item − responsibility item (how much of the causal role is not converted into responsibility).

# 7. Analysis plan

## 7.1 General conventions (carried over from the Study 1–2 pipeline unless stated)

- R; seed 42 (`set.seed(42)`; lavaan `iseed = 42`); two-sided tests at α = .05 unless stated.
- **Core model.** For any outcome Y: `lm(Y ~ A * E)` with A, E ∈ {−0.5, +0.5}. The coefficient of A (or E) is the unweighted difference between marginal means, high − low. Tests use HC3 heteroskedasticity-consistent standard errors (`sandwich::vcovHC(type = "HC3")`, `lmtest::coeftest`). The t tests use the residual degrees of freedom (n − 4): `lmtest::coeftest(m, vcov = sandwich::vcovHC(m, type = "HC3"))`.
- **Effect sizes.** Hedges's g (`effectsize::hedges_g`) with 95% CI for every standardized contrast, sign high − low for the factor tested. g uses the pooled SD of the two marginal groups (pooled across the other factor), which is comparable to Studies 1–2. A factorial d = b / sqrt(MSE of `lm(Y ~ A * E)`) is also reported. With unequal cell sizes the numerator of g is the weighted marginal difference, whereas b(A) and the factorial d use the unweighted contrast.
- **Bayes factor (registered).** BF10 for the A main effect = `lmBF(Y ~ A + E + A:E)` / `lmBF(Y ~ E + A:E)`, with A and E entered as two-level factors, `rscaleFixed = 0.5` (the BayesFactor "medium" fixed-effect scale; for a two-level factor this corresponds to `ttestBF` rscale = √2/2 = 0.707), `iterations = 100000`, seed 42. The E main effect is analogous. For comparability with Studies 1–2, `ttestBF` on the marginal groups (r = 0.707) is also reported. For H1 and H2 the directional BF+0 (`ttestBF(x = Y[high], y = Y[low], nullInterval = c(0, Inf))` on the marginal groups, so BF+0 favors high > low) is reported. Evidence categories as in May 7 §11.4.
- **TOST.** `TOSTER::tsum_TOST`, Welch (`var.equal = FALSE`), α = .05 per one-sided test; equivalence is concluded when both one-sided p < .05 (`tost_p_max < .05`). Hedges's g(av) with 90% CI is reported. Except for R2a/R2b, the H2 description and O1 (raw bounds fixed before data collection, Sections 7.2 and 8.13), M2 (raw bounds of ±7.5% of the grand mean, Section 8.4) and D1 and D2 (HC3 coefficient TOST with bounds standardized by the Study 3 SD, Section 8.8), TOST uses SMD bounds ±0.40 (denominator √((s_hi² + s_lo²)/2)), as in Studies 1–2, and is used only for the joint classification below. TOSTs on a regression coefficient (D1, D2) are two one-sided t tests with the HC3 standard error and the residual degrees of freedom (equivalence when the 90% HC3 CI lies inside the bounds).
- **Joint TOST × Bayes classification** (five classes, as in the Study 1–2 pipeline): evidence of absence (TOST equivalent and BF10 < 1/3); TOST-only equivalence (equivalent, 1/3 ≤ BF10 < 3); Bayesian-only null (BF10 < 1/3, not equivalent); evidence of presence (not equivalent and BF10 ≥ 3); inconclusive (otherwise). The registered model-based BF10 is used. For R2a and R2b, the joint class and the label "evidence of absence" use the raw-bound Welch TOST that decides R2; the SMD-bound TOST is descriptive.
- **Causal language.** Causal language is used only for effects of the randomized factors (A, E, and measurement order). Analyses that adjust for or relate post-treatment measures are worded associationally ("is associated with", "adjusting for … reduces"), never as "drives", "causes", "carries", "enters", or "mediates". These are H2 steps 2–5, H3 adjusted, H4, H5, D2's within-cell tone slope, R3–R6, U1, U2, and the G_halo × O term of O1.
- **Software.** R 4.5.2 with BayesFactor 0.9.12-4.8, TOSTER 0.8.6, sandwich 3.1-1, lmtest 0.9-40, effectsize 1.0.2, lavaan 0.6-21, lme4 2.0.1, ordinal 2025.12-29 and pwr 1.3-0 (the R3 gate test is the grid search of Section 8.9, so no breakpoint package is needed); Python 3.12.3 with scikit-learn 1.5.2, numpy 1.26.4 and sentence-transformers 3.3.1 (the frozen-probe environment, Section 6.10.1). The exact versions at analysis time are in the posted session information. This replaces May 7 §12.6, whose pins (R 4.4.x, sentence-transformers 2.2.x) do not match this environment.

## 7.2 Primary hypotheses and the estimation questions

**H1 (warmth → PSR; primary).**

- Test: the core model on the PSR composite; HC3 t-test of the A coefficient, two-sided α = .05. If sessions ran under more than one `experiment_version` (Section 11.1), `experiment_version` is added to the core model as a fixed covariate.
- Report: b (raw units) with 95% CI; Hedges's g with 95% CI (HighA vs. LowA marginal groups) and factorial d; registered BF10, marginal `ttestBF` BF10, and BF+0, with evidence categories; joint class.
- Decision: H1 is **supported** if b(A) > 0 and the two-sided HC3 p < .05. BF10 and BF+0 are reported with their evidence categories but neither enters the decision (Change 24). As a pre-specified descriptor, the report states whether the stricter joint criterion is met: b(A) > 0, p < .05 and registered BF10 ≥ 3 (the Study 1–2 rule, q < .05 and BF10 ≥ 3, with p in place of q, because Study 3 has a single primary test on PSR and no BH family across primaries).
- H1 is **contradicted** if b(A) < 0 and p < .05. Otherwise H1 is not supported, and the joint class (Section 7.1) states whether the result is evidence of absence or inconclusive.
- **Interpretation conditional on the tone gap (M1).** The H1 decision does not depend on M1. Its interpretation under the tone version does: (a) the report gives the tone version's point prediction, 1.8 × ΔW_A to 2.0 × ΔW_A PSR units (ΔW_A from M1), and states whether that range overlaps the 95% CI of b(A); (b) if ΔW_A < .14 (half the Study 1 gap) and H1 is not supported, the result is described as a weak tone manipulation, not as evidence against the tone version; (c) if ΔW_A ≥ .28 and the 95% CI upper bound of the H1 effect (Hedges's g on the marginal groups; the factorial d is reported alongside) is below .25, the result is reported as counting against the tone version in its strong form, in which the Studies 1–2 within-cell slope (1.8–2.0 PSR units per unit W) is causal (Section 0.5). A tone version in which part of that slope reflects users who bond drawing out warmth predicts as little as d ≈ .14 and is not refuted by this result. (d) If .14 ≤ ΔW_A < .28, a null H1 is interpreted only through (a).

**R2a and R2b (Corporate Liability equivalence; primary).**

- Test: Welch TOST (`tsum_TOST`, `eqbound_type = "raw"`, `var.equal = FALSE`, α = .05 per one-sided test) on the Corporate Liability composite for the A marginal groups (R2a) and the E marginal groups (R2b). Bounds are ±0.40 scale points, fixed before data collection as 0.40 × 1.00, the pooled within-group SD of Corporate Liability across Studies 1–2 (Section 6.2; Change 25).
- Decision: R2a (R2b) is **supported** if `tost_p_max < .05`. The raw-bound test governs the decision. R2a (R2b) is **contradicted** if the TOST is not significant (`tost_p_max` ≥ .05) and the two-sided Welch test of the same contrast (the first test reported by `tsum_TOST` on the same marginal groups) has p < .05: an effect is detected and equivalence within ±0.40 is not shown. If the TOST is not significant and that test is not significant either, R2a (R2b) is **not supported (inconclusive)**.
- Also reported: the SMD-bound TOST (±0.40, for comparability with Studies 1–2); the HC3 test of the A (E) coefficient in the core model and whether its 90% CI lies within ±0.40 (a model-consistent check); g with 95% CI; registered BF10; and the joint class. The label "evidence of absence" (May 7 §11.4) is used only if the TOST is equivalent and BF10 < 1/3. A supported R2a or R2b with 1/3 ≤ BF10 < 3 is reported as "equivalent (TOST-only)"; with BF10 ≥ 3 it is reported as "equivalent (TOST), Bayes factor favors an effect".
- A significant NHST difference together with a significant TOST means the effect is non-zero but smaller than the smallest effect size of interest; it is reported as such, and the corresponding R2a or R2b is still supported.
- **Combined claim.** R2a and R2b are decided and reported separately. The summary claim that Corporate Liability is unaffected by both traits (RQ4) is made only if both R2a and R2b are supported (joint power ≈ .80). If one is supported, the report states which.
- **Interaction guard.** The A × E coefficient on Corporate Liability and the four simple effects (g with 90% CI) are reported alongside R2. If the HC3 A × E test is p < .05, R2 conclusions are restricted to the average (marginal) effect, and the abstract states that the simple effects differ. A non-significant A × E test is not evidence that the simple effects are equivalent (power .38 for a difference of d = 0.40); R2a, R2b and the combined claim concern the average effect over the other factor's levels, and the abstract says so.

**Multiplicity across the primary hypotheses.** H1 is the only primary test on PSR, and R2a and R2b are equivalence tests on a different outcome, each with its own registered decision; no correction is applied across them.

**H2 (extraversion → PSR; estimation and model comparison, no pass/fail decision).**

1. *Total effect.* The E coefficient of the core model on PSR: b with 95% CI, HC3 p, g and factorial d with 95% CI, registered BF10, and the joint class. The report states which of four descriptions applies, checked in this order: (a) "positive effect detected" (b > 0 and HC3 p < .05); (b) "negative effect detected" (b < 0 and HC3 p < .05; reported as contrary to the impression version's direction); (c) "effects as large as the smallest effect of interest excluded" (Welch TOST on the E marginal groups, `tsum_TOST` with `eqbound_type = "raw"` and `var.equal = FALSE`, bounds ±0.39 PSR units = 0.40 × 0.975, the pooled within-group SD of PSR across Studies 1–2, fixed before data collection, with `tost_p_max` < .05); (d) "not resolved at this N" (otherwise). If (a) or (b) holds and the TOST in (c) is also significant, the report adds "and smaller than the smallest effect of interest" to (a) or (b). No other wording is used for H2.
2. *The two inputs.* ΔW_E = the E coefficient of the core model on W̄ (Section 6.10.1), and ΔG_E = the E coefficient on G_halo (Section 6.15), each with its HC3 95% CI from the core model (Section 7.1); these HC3 intervals decide, here and in the Section 0.5 falsifier, and the within-cell bootstrap intervals of step 3 are reported beside them, with any disagreement noted. ΔW_E is described as "about zero" if its HC3 90% CI lies within ±.07 (a quarter of the Study 1 warm–cold gap of .28).
3. *Each version's predicted E effect.* Within-cell slopes are estimated in Study 3 from `lm(PSR ~ A * E + W̄)` (b_W) and `lm(PSR ~ A * E + G_halo)` (b_G). The tone version predicts P_T = b_W × ΔW_E, and the impression version predicts P_G = b_G × ΔG_E. 95% CIs come from a nonparametric bootstrap that resamples participants within cells (5,000 resamples, seed 42; percentile intervals) and recomputes every quantity in each resample. Steps 2–5 use the cases complete on PSR, W̄ and G_halo (a participant with no model-generated reply has no W̄; the number of such participants is reported by cell). On that sample b_E, ΔW_E, ΔG_E, b_W, b_G, P_T, P_G and D are all estimated, and all of them are recomputed in every bootstrap resample, so that b_E − P_G and b_E − P_T equal the E coefficients of lm(PSR ~ A * E + G_halo) and lm(PSR ~ A * E + W̄) in every resample. Step 1 is reported on all cases with PSR and again on this sample.
4. *Model comparison (descriptive).* By the OLS decomposition, b_E − P_G equals c′_G, the E coefficient of lm(PSR ~ A * E + G_halo), and b_E − P_T equals c′_W, the E coefficient of lm(PSR ~ A * E + W̄). D = |c′_G| − |c′_W| is reported with its bootstrap 95% CI (5,000 within-cell resamples, seed 42), together with c′_G and c′_W and their CIs. The impression version's prediction is described as **closer** if the CI of D lies entirely below 0 in this step and in step 5; the tone version's prediction is described as **closer** if it lies entirely above 0 in both; if steps 4 and 5 disagree, or either CI includes 0, the two are **not distinguished**. The comparison is descriptive and is not a test of either version. The absolute value makes D non-smooth at 0, and G_halo (rated by the participant, like PSR) differs in source from W̄ (a classifier score of Sylva's replies). The diagnostic case named in advance is ΔW_E about zero together with ΔG_E > 0: there the tone version predicts no E effect and the impression version predicts a positive one. At N = 272 the rule is expected to return "not distinguished" under either version. In simulations with the Studies 1–2 within-cell covariances (Section 4.4), the true version's prediction is described as closer in this step alone with probability about .10–.16 at ΔG_E = .37–.40 and .22–.27 at ΔG_E = .60 if the impression version is true (ΔW_E = 0), and about .10–.14 and .23–.30 if the tone version is true; the wrong version is described as closer with probability .01 or less. Requiring step 5 as well can only lower these values. A "not distinguished" result is therefore the expected outcome under either version and is not evidence for either.

   *4b. Fixed-prediction comparison (descriptive).* Two point predictions are fixed here, before data collection: impression version P_G0 = 0.17 PSR units (the midpoint of the Studies 1–2 range .135–.202, Section 2.3); tone version P_T0 = 0. With b_E and its HC3 standard error SE_E from step 1 (all cases with PSR; the estimate on the steps 2–5 sample is reported beside it), LR = exp((b_E · P_G0 − P_G0²/2) / SE_E²). LR ≥ 3: "the E effect is closer to the impression version's prediction"; LR ≤ 1/3: "the E effect is closer to the tone version's prediction"; otherwise "not distinguished". If b_E = .17, P(LR ≥ 3) ≈ .48 and P(LR ≤ 1/3) ≈ .07; if b_E = 0, P(LR ≤ 1/3) ≈ .48 and P(LR ≥ 3) ≈ .07 (normal approximation, SE_E = 0.118).
5. *Sensitivity.* The same comparison as in step 4 (D computed from b_E − P_G and b_E − P_T, with its bootstrap 95% CI), in one variant that makes both substitutions: b_W fixed at the Studies 1–2 value of 1.8 (the lower end of the range in the Studies 1–2 modeling, Section 0.2) instead of the Study 3 estimate, and G_halo_E (Section 6.15) in place of G_halo for P_G.

All steps are reported, with the caveat that the slopes are within-cell associations of post-treatment measures; the comparison asks which version's prediction is closer, not whether either mediator causes PSR. Results are worded as "the E effect is closer to the product of the E shift in the trait impression and its within-cell association with PSR than to the corresponding product for expressed warmth", never as "bonding follows the impression". G_halo and PSR are reported by the same participant and share method variance, and a positive E effect that W̄ does not capture (for example, expressed enthusiasm) would make the impression version's prediction look closer in this comparison; both points are stated with the result.

**H3 (A × E interaction on PSR; estimation).** The A:E coefficient of the core model on PSR, with 95% CI and in d units (the A:E coefficient divided by √MSE of the core model, the factorial d); the four simple effects of warmth and of extraversion (g with 95% CI); and the A:E coefficient after adding G_halo to the model. If the HC3 test of A:E is p < .05, the report says that an interaction was detected and that H1 concerns the average warmth effect; the H1 decision is unchanged. A non-significant A:E is reported with its CI and is not described as evidence of no interaction.

## 7.3 Secondary outcomes family

- Tests: the A and E main effects from the core model for each of the eight secondary outcomes, giving 16 tests.
- Correction: Benjamini–Hochberg FDR at q = .05 across the 16.
- Report for each: b, HC3 p, BH q, g with 95% CI, factorial d, registered BF10, joint class.
- Decision: an effect is described as a secondary finding if q < .05 (Change 5). A secondary finding with BF10 < 3 is labeled "weak Bayesian evidence". Directions are not predicted.
- Corporate Liability's NHST test belongs to R2 and is not in this family; PSR is the H1–H3 outcome and is not in this family. The Bayes factors of the Chatbot Responsibility, User Responsibility, and Harm Severity tests in this family are also used for R2c (Section 8.10).

## 7.4 Language coding and validation

- **Coders.** Three LLMs from different model families code every unit independently at temperature 0: Claude Sonnet 4.6, GPT-5.4-mini, and Gemini 3 Flash (`gemini-3-flash-preview`), as in Studies 1–2. If a coder model is unavailable at coding time, the closest successor in the same model family is used, and the substitution is reported as a deviation.
- **Inputs.** Chat-turn coding gives the coder the two preceding turns as context and codes only the target turn. The fixed opening message ("Hello! I just arrived … Who are you?") is inserted as the context turn preceding the scripted greeting (S0). Scripted turns are coded once per cell (Section 6.10). `system_error` entries are removed before turn indexing and are not coded. Coders never see the condition, the cell, or the system prompt. Coders receive only de-identified text: transcripts and open-ended answers are coded after SONA IDs are replaced by random codes and every identifying detail is removed, as for public posting (Section 11.2); no identifiable text is sent to a coding model. Codes are joined to the session record on `session_uuid` (Section 6.10).
- **Consensus.** 2-of-3 majority. When one coder's output is missing, 2-of-2 agreement is required and a tie is coded 0.
- **Reliability tiers** (per code). Mean pairwise Cohen's κ, Fleiss's κ, and Krippendorff's α are all computed:
  - high-reliability: all ≥ .60;
  - moderate-reliability: all ≥ .40;
  - descriptive-only: otherwise.
  Only high-reliability codes enter inferential analyses, and all NLP analyses are exploratory except U1a and U2.
- **Rubric freeze.** The chat rubric (definitions and examples) is frozen, and its hash is recorded on OSF, before coding begins.
- **Human validation subsample.**
  - Coders: two trained human coders, blind to condition and to the LLM labels: the PI (David G. Kamper) and a second coder, named in the dated note, who works only with de-identified transcripts and open-ended responses (identifying details removed, as for public posting; Section 11.2). Sylva's turns reveal the persona, so blinding to condition consists of removing cell labels.
  - Sample: a random sample stratified by cell of **300 bot turns, 300 participant turns, and 160 open-ended responses** (40 per OE question), drawn after data collection with seed 42.
  - Metrics: human–human Cohen's κ, and κ between each human and the LLM consensus. For codes with prevalence below 10%, prevalence-adjusted bias-adjusted kappa (PABAK) and positive agreement are also reported.
  - Rule: a code is used in confirmatory or secondary inference (here, `emotional_self_disclosure` for U1a and U2, and `mirroring_user_emotion` for U2) only if it is high-reliability among the LLMs **and** human–human κ ≥ .60 **and** the mean human–LLM-consensus κ ≥ .60. Codes failing the human criterion are reported and used descriptively only.

## 7.5 Missing data

All rating items are forced-response, so composites are complete for every completed session. No imputation is performed. Variable-specific missingness:

- Impossible ages and "prefer not to say" codes are set to missing (Section 9.3).
- OE answers with fewer than 3 words are not coded.
- The characters/4 fallback used in the Study 1–2 pipeline is removed. A turn without token usage is excluded from `bot_tokens_per_turn`, and the number of such turns is reported by cell.
- Each analysis uses all cases complete on its variables, and the n is reported.

# 8. Statistical models for manipulation integrity and secondary predictions

All models below use the core-model conventions of Section 7.1 (A, E coded ±0.5; HC3 standard errors; seed 42; bootstrap resampling of participants within cells, 5,000 resamples, with percentile 95% CIs) unless stated.

## 8.1 Manipulation checks

**Primary checks.** Each uses the core model with HC3 standard errors:

- MC-A: TIPI-Bot Agreeableness, A effect. Passes if the two-sided HC3 p < .05 and b > 0.
- MC-E: TIPI-Bot Extraversion, E effect. Passes if the two-sided HC3 p < .05 and b > 0.

**Supplemental checks.** `mc_agreeableness` (A effect) and `mc_extraversion` (E effect), same criterion. `mc_e_energetic` (E effect) and `mc_length` (A and E effects) are reported descriptively.

**Diffusion family.** Bonferroni across 8 tests (α = .00625 per test, two-sided). Significant effects are reported as diffusion, not as manipulation failure. Under the impression version of the account, diffusion onto the non-manipulated traits is expected (H5, Section 8.7).

- A effect on TIPI-Bot Extraversion and on `mc_extraversion`.
- E effect on TIPI-Bot Agreeableness and on `mc_agreeableness`.
- A and E effects on TIPI-Bot Emotional Stability and on `mc_neuroticism`.

These coefficients are tested once, here. H5 uses the same estimates as ratio numerators; its CIs are interval estimates, not further tests. An E effect on a non-target trait is called diffusion or carry-over only if it is significant in this family or the H5 decision is met.

**Discriminant criterion.** For each factor, g on its target TIPI-Bot subscale minus g on the other manipulated trait's subscale, with a 95% bootstrap CI (5,000 resamples, seed 42). The criterion is met if the CI excludes 0. Perceived extraversion is expected to rise under HIGH_A (Study 1 g = 0.44), so this criterion is informative, not a gate.

**Interpretation rule.** If MC-E fails, H2 is still estimated and reported. It is interpreted as an estimate for the extraversion *instruction*, not for perceived extraversion, and the failure is stated in the abstract. The same rule applies to MC-A and H1. H5 is computed only if MC-E passes. In the bonding-first order, TIPI-Bot is answered after the bonding block; the checks are reported pooled and by order (O1).

## 8.2 S1 (participant agreeableness × warmth on PSR)

- Model: `lm(PSR ~ A * Aself_z + E)`, where Aself_z is TIPI-Self Agreeableness z-scored within the analytic sample. This is the Study 1 parameterization: A = ±0.5, and the interaction b is in PSR units per SD.
- Test: HC3 test of the A:Aself_z coefficient.
- Prediction: b > 0.
- Report: b with 95% CI; simple effects of A at −1 SD, the mean, and +1 SD.
- Robustness: add E:Aself_z and A:E terms.
- Family: Holm with D2 (Section 8.14).

## 8.3 U1 (distress → emotional self-disclosure, and its association with PSR as an estimate)

- **U1a test:** Pearson r between PHQ-4 total and `pct_emotional_self_disclosure`, pooled across cells. Prediction: r > 0. Supported if r > 0 and the Holm-adjusted p (family with U2) < .05.
- **U1b (estimation, no decision):** the PHQ-4 coefficient in `lm(PSR ~ A * E + PHQ4)` with its 95% CI and the registered BF10 (`lmBF(PSR ~ A + E + A:E + PHQ4)` / `lmBF(PSR ~ A + E + A:E)`, `rscaleCont = "medium"`; Studies 1–2, pooled within condition: standardized β = .13, 95% CI [.01, .24]), and the indirect effect PHQ-4 → `pct_emotional_self_disclosure` → PSR (lavaan, 5,000 bootstrap resamples, `iseed = 42`) with its 95% CI. No null prediction is made for the total association.
- Robustness: Spearman ρ; partial r controlling for cell (three dummy variables) and the number of participant turns (Section 6.9).
- Order of events: the reliability and human-validation criteria for `emotional_self_disclosure` (Section 7.4) are evaluated, and the result is recorded on OSF, before the U1a correlation is computed. If the code fails them, U1a and U2 are both reported as not testable (Sections 6.11, 7.4, 8.12), because the same code is U2's predictor. If only `mirroring_user_emotion` fails, U2 is not testable and U1a is tested alone at α = .05.

## 8.4 M2 (length check)

- **Index.** `bot_tokens_per_turn` over the model-generated replies of Section 6.9. If per-turn completion tokens are unavailable for more than 5% of model-generated replies, the index is bot words per reply (whitespace-delimited) over the same replies, with the same bounds.
- **Grand mean.** The unweighted mean of the four cell means of the index in the analytic sample.
- **Factor-level test.** For each factor, a Welch TOST on the marginal groups with raw bounds ±0.075 × the grand mean (`tsum_TOST`, `eqbound_type = "raw"`, `var.equal = FALSE`, α = .05). Hedges's g(av) with 90% CI is reported for each factor.
- **Cell-level criterion.** Every one of the four cell means lies within ±7.5% of the grand mean (descriptive; no test). All six pairwise cell TOSTs with the same bounds are reported descriptively.
- **Decision.** M2 is supported if both factor-level TOSTs are significant **and** the cell-level criterion holds. No multiplicity correction is applied, because M2 requires every component to pass (an intersection–union test).
- **Secondary length indices** (reported the same way, not part of the decision): bot words per model-generated reply; the first model-generated reply (the earliest displayed model-generated reply, whatever its round) alone; the scripted turns' lengths (fixed, Appendix D.1); and `mc_length`.
- **If M2 fails.** The H1 and R2 decisions are unchanged. The abstract and the H1/H2 results paragraph report, next to each estimate, the verbosity-adjusted estimate (Section 9.1, check 10) and the E2 indirect effect (Section 9.5), and state that reply length differed by condition.

## 8.5 M1 (tone gap)

- **Model:** core model on W̄ (frozen warmth probe, model-generated replies; Section 6.10.1).
- **Decision:** M1 passes if b(A) > 0 and the two-sided HC3 p < .05.
- **Report:** ΔW_A = b(A) and ΔW_E = b(E) with 95% CIs; the same for R̄ (resistance) and Ā (anxious affect; expected ≈ 0 for both factors); the fixed scores of the scripted turns by cell.
- **Use:** ΔW_A conditions the interpretation of H1 (Section 7.2); ΔW_E enters H2.
- **Benchmark.** With the frozen W, the Study 1 HighA − LowA gap in participant mean W is .28 over all bot turns (.55 vs .26) and .30 over bot turns from the third on, the Study 3 model-generated range (.58 vs .29; 130 of 131 participants). The thresholds used in M1, in the H1 interpretation (Section 7.2) and in Section 0.5, .28 and .14 (half), are the all-turn values.

## 8.6 H4 (the impression absorbs the persona effect; placebo ratings do not)

- **Models:** the core model on PSR (b(A)), and the same model with one added covariate: G_halo; or one placebo rating: Moral Agency, Moral Patiency, or Experience-Taking (composites, Section 6.3); these are the comparison ratings used as placebos in the Studies 1–2 modeling (Trust is a bonding outcome here).
- **Statistic:** S_X = 1 − b(A | X) / b(A), reported with its components a_X (the A coefficient on X) and b_X (the within-cell slope of PSR on X), each with a bootstrap 95% CI, and the differences S_G − S_placebo. Because S_X is approximately a_X × b_X / b(A), a comparison rating that warmth does not move cannot absorb its effect however strongly it is associated with PSR.
- **Decision:** supported if the point estimate S_G ≥ .50 and, for each placebo P, the bootstrap 95% CI of b(A | P) − b(A | G_halo) lies above 0 (when b(A) > 0, this has the same sign as S_G − S_P without dividing by b(A)). **Contradicted** if S_G < .50 and, for at least one placebo P, the bootstrap 95% CI of b(A | G_halo) − b(A | P) lies above 0. Otherwise **inconclusive**. S values are reported with percentile CIs as descriptions. Moral Agency is expected to absorb some of the warmth effect under the account (PSR is associated with agency; Study 1: S = .19), so it is a conservative comparison, not a pure placebo. Evaluated only if H1 is supported (S is unstable when b(A) is near 0); otherwise reported descriptively.
- **Composition:** S is also reported for each two-trait version of G_halo (C + ES, C + O, ES + O) and for ES alone. In Study 1, S was .71 for G_halo, .39 for C + O and .76 for ES alone. If S_G ≥ .50 but S for C + O is below .50, the result is reported as "absorbed mainly by perceived emotional stability, which overlaps in meaning with perceived hostility", not as absorption by a global impression.
- **Interpretation:** a supported H4 shows that warmth moved the trait impression more than the comparison ratings, while all are associated with PSR within cells. It does not show that the impression, rather than another warmth-related rating, accounts for the effect.
- **Extraversion:** the same statistics for b(E), reported if H2's total effect is "positive effect detected".
- **Order:** S_G is reported by order with bootstrap 95% CIs; no robustness label is applied (Section 8.13).
- **Sample:** S_G and every S_X are computed on the cases complete on PSR, G_halo, Moral Agency, Moral Patiency and Experience-Taking, the same sample for all adjusters and for each bootstrap resample (resampling within cells).
- **Caveat stated in the report:** this is a post-treatment adjustment. A large S_G is consistent with the impression accounting for the warmth effect but does not identify mediation, and the order of impression and bonding is not identified (Section 0.2).

## 8.7 H5 (halo ratios)

- **Statistic:** for X ∈ {Agreeableness, Conscientiousness, Emotional Stability, Openness}, ratio_X = b_E(TIPI-Bot X) / b_E(TIPI-Bot Extraversion), from the core model, with bootstrap 95% CIs; the pooled ratio ratio_GE = b_E(G_halo_E) / b_E(TIPI-Bot Extraversion) (G_halo_E, Section 6.15); and ratio_G, the same with G_halo.
- **Prediction:** ratios ≈ .21 (A), .20 (C), .27 (ES), .41 (O) per point of perceived extraversion; ratio_GE ≈ .30 and ratio_G ≈ .29 (Studies 1–2 within-cell slopes).
- **Decision:** computed only if MC-E passes. Supported if the bootstrap 95% CI of ratio_GE lies above 0 (power about .71 / .88 / .95 at a perceived-extraversion shift of 1.0 / 1.25 / 1.5 points; Section 4.4). ratio_G, the four trait ratios and the item-level E effects on TIPI-Bot items 4, 5, 9 and 10 are reported with bootstrap 95% CIs and with whether each predicted value lies inside its CI; they are not part of the decision (the probability that all four trait-ratio CIs exclude 0 is about .11–.40 even when the predicted halo is exact).
- **Content overlap:** the LOW_E block describes Sylva's "calm" and the HIGH_E block her "adventures", which echo TIPI-Bot items 9 ("Calm, emotionally stable.") and 5 ("Open to new experiences, complex."). E effects on these items can reflect instruction content rather than halo, so the decision uses G_halo_E, which omits them, and the ES and O ratios and ratio_G are reported as "halo or content overlap". A positive halo ratio shows spillover between trait ratings; it does not separate a global evaluation from an evaluative or response-style halo.
- **Sample:** the ratios are computed on the cases with all five TIPI-Bot subscales.
- **Exploratory:** the analogous ratios for the A factor.

## 8.8 D2 and D1 (closeness dynamics)

**D2 (scripted first impression).**

- **Model:** core model on `ios_t1`.
- **Decision:** supported if b(A) > 0 and the Holm-adjusted p (family with S1) < .05. The E effect at probe 1 is reported as an estimate.
- **Falsifier for the tone version (Section 0.5):** if the A effect on `ios_t1` is equivalent to zero (TOST on the A coefficient of the core model for `ios_t1`: two one-sided HC3 t tests with the residual degrees of freedom, α = .05 each, bounds ±0.40 × the pooled within-cell SD of `ios_t1`, the program's smallest effect of interest; because no prior IOS data exist, the bound is standardized by the Study 3 SD and is also reported in raw IOS points; power .90 when the true effect is 0) while within-cell free-chat tone predicts PSR (b_W > 0, p < .05, in `lm(PSR ~ A * E + W̄)`), the result is reported as counting against the tone version: tone in the user-independent opening does not move closeness, but co-produced tone does.
- **What D2 can show:** D2 tests four fixed openings, one pair per cell, that differ in expressed warmth and also in explicit statements of liking, invitation and distrust, and the cold openings also score high on the aversive-affect probe A (S0: .42 and .52). A supported D2 shows that user-independent bot behavior can change closeness. It does not show that tone, rather than other content of these texts, is responsible, or whether tone drives closeness in free chat. Results are worded as effects of "the warm and cold scripted openings", and H1 is described as the effect of the persona instructions together with these openings.
- **Bounds:** because no prior IOS data exist, the D1 and D2 bounds are standardized by the Study 3 pooled within-cell SD of `ios_t1` and are reported in raw IOS points alongside.

**D1 (accumulation versus first impression).**

- **Model:** core model on `ios_change` = `ios_t3` − `ios_t1`. δ = b(A) / SD_t1, where SD_t1 is the pooled within-cell SD of `ios_t1`.
- **Decision** (HC3 test of b(A) on `ios_change`, two-sided α = .05; TOST on the coefficient b(A): two one-sided t tests with the HC3 standard error and the residual degrees of freedom, bounds ±0.30 × SD_t1, equivalent when both p < .05, which is the same as the 90% HC3 CI lying inside the bounds). **Accumulation** if b(A) > 0 and p < .05. **Narrowing** (the warmth gap shrank) if b(A) < 0 and p < .05. **First impression** if the TOST is significant. If the TOST is significant and p < .05 as well, the result is "first impression, with small growth" (b > 0) or "first impression, with small narrowing" (b < 0). Otherwise **inconclusive**. If, at probe 1, more than 20% of the participants in any cell answer 1 or more than 20% answer 7 (each bound counted separately), "first impression" (with or without small growth or narrowing) and "narrowing" are not concluded (reported as "not interpretable: scale bound"), because a floor in the cold cells or a ceiling in the warm cells moves b(A) on the change score downward; "accumulation" can still be concluded (b(A) > 0 and p < .05, whether or not the TOST is significant), and `ordinal::clmm(ios ~ A * E * time + (1 | participant))`, time = `ios_tK_elapsed` / 600, is reported with the sign and p of A:time as a secondary analysis.
- **Interpretation:** the report gives ΔW_script, the warm–cold gap in the fixed probe-W scores of S0 and S1 (about .52; Appendix D.1), beside ΔW_A (M1; expected about .28). A first-impression result is described as support for a first-impression account only if ΔW_A ≥ ΔW_script; otherwise it is described as "the warmth gap did not grow: consistent with a first impression or with free chat that is less differentiated than the scripted opening; not distinguished". A narrowing result is never described as support for a first-impression account: it is reported as showing that the static first-impression account is incomplete in the other direction (Section 0.5), and if ΔW_A < ΔW_script the report adds that a narrowing gap is also expected if closeness follows free chat that is less differentiated than the scripted opening. The identical item is answered three times, so earlier answers may anchor later ones; this is stated as a limitation of any first-impression or narrowing result.
- **Trajectory (reported with D1):** `lmer(ios ~ A * E * time + (1 | participant))`, time = 0, 0.5, 1 for probes 1–3; the A gap at each probe; the same with time = active seconds at display / 600. Participants with `ios_t2_status = 'not_triggered'` contribute probes 1 and 3.
- **Reported alongside:** the proportion of responses at 7 (ceiling) and 1 (floor) by probe and cell (more than 20% at either bound in any cell is flagged; at probe 1 it triggers the scale-bound rule above), and r(`ios_t3`, PSR) as convergent validity (expected ≥ .50; descriptive). The E analog of D1 is exploratory (E13).
- **Limitation stated in the report:** all participants answer the probes, so probe reactivity cannot be estimated, and H1 is tested in a procedure that includes them.

## 8.9 R1, R3, R4, R5 (the responsibility template, vignette 1)

**R1 (ranking).** In each cell, paired contrasts on the identically worded items: company (`liab_1`) − Sylva (`liab_6`), and user (`liab_9`) − company.

- Supported if, in every cell, Sylva's mean is the lowest of the three and the company − Sylva 95% CI lies above 0; and the pooled user − company 95% CI lower bound is above −0.40 (user not meaningfully below the company).
- Contradicted if in any cell Sylva's mean exceeds the company's with a 95% CI above 0.
- Reported: pooled company − Sylva raw difference and dz with 95% CI (point predictions: ≥ .80 raw; dz ≥ .60). The 95% CI of dz uses the normal approximation SE = √(1/n + dz²/(2n)); dz and its CI are reported and are not part of the decision. The same contrasts for vignette 2 are reported with R6.

**R3 (agency weakly predicts Sylva's responsibility; no gate).**

- **Model:** standardized β of `ma_cap` in `lm(z(liab_6) ~ z(ma_cap) + A + E + A:E)`, all variables z-scored in the analytic sample (`ma_cap`, Section 6.15). This is the specification that gave β = .14 in Studies 1–2. The same model with the Chatbot Responsibility composite (`liab_6`–`liab_8`) as the outcome and with the full 8-item Moral Agency composite as the predictor is reported as a robustness check.
- **Gate test:** a linear model against a one-breakpoint model fitted by grid search (no extra package). For each breakpoint c at the 10th to 90th percentiles of z(`ma_cap`) in steps of one percentile (81 candidates), fit `lm(z(liab_6) ~ z(ma_cap) + pmax(z(ma_cap) − c, 0) + A + E + A:E)`; the c with the smallest residual sum of squares is used. BIC_linear = `stats::BIC` of the linear model; BIC_segmented = n·log(RSS/n) + n·(1 + log 2π) + (k_linear + 2)·log n, where k_linear is the number of parameters of the linear model counted as in `stats::BIC`, plus two (the breakpoint and the slope change). BF10 ≈ exp((BIC_linear − BIC_segmented)/2); BF10 < 1 when the linear model has the smaller BIC.
- **Decision:** supported if the 90% CI upper bound of β < .30 and the one-breakpoint model's BF10 < 1; contradicted if the 95% CI lower bound of β > .20; otherwise inconclusive.
- Repeated, as a report, with `v2_resp_sylva` as the outcome.

**R4 (closeness adds nothing).**

- **Test:** `lmBF(z(liab_6) ~ A + E + A:E + z(ma_cap) + z(MP) + z(PSR) + z(EC) + z(Trust))` / `lmBF(z(liab_6) ~ A + E + A:E + z(ma_cap) + z(MP))` (MP = Moral Patiency, EC = Emotional Connection; `rscaleCont = "medium"`), on the cases complete on the variables of the full model.
- **Decision:** supported if BF01 > 3; contradicted if BF10 > 3 or if the standardized coefficient of the bonding composite B (Section 6.15) in `lm(z(liab_6) ~ A * E + z(ma_cap) + z(MP) + B)` is ≥ .25 (point estimate; Section 0.5). If both the supported and a contradicted condition hold (BF01 > 3 and β_B ≥ .25), the outcome is "contradicted". In resamples of the Studies 1–2 data (N = 272), R4 is supported in about 57% and contradicted in about 12% (Section 4.4), so a contradicted R4 is weighed together with R2c, R2d and R3 rather than on its own. The separate PSR, Emotional Connection and Trust coefficients are reported but do not enter the decision, because the three correlate .68–.81 within cells.
- **Reported:** a path model PSR → `ma_cap` → `liab_6` with A, E, A:E as covariates (lavaan `sem` with ML; the exogenous A, E and A:E as fixed covariates, `fixed.x = TRUE`, the default; `se = "bootstrap"`, `bootstrap = 5000`, `iseed = 42`, percentile CIs, `boot.ci.type = "perc"`): the PSR → agency β (prediction .4–.5) and the indirect association with Sylva's responsibility (prediction ≈ 0), with 95% CIs. The standardized coefficients named in the decision come from the OLS model of the Decision bullet with z-scored continuous variables, not from lavaan.

**R5 (Sylva's responsibility moves with the company's).**

- **Test:** Pearson r between the vignette 1 composites: Corporate Liability with Chatbot Responsibility, and User Responsibility with each.
- **Decision:** supported if r(company, Sylva) has a 95% CI lower bound > .30 and both user correlations have 90% CIs within ±.25.
- **Reported:** the same correlations for the identically worded items (`liab_1`, `liab_6`, `liab_9`) and for the vignette 2 party composites, which have equal item counts and parallel wording and so address the rival explanations of unequal item counts and wording (Section 0.2).

## 8.10 R2c and R2d (no persona effect on the other responsibility judgments)

- **R2c (vignette 1):** registered model-based BF10 (Section 7.1) for the A and E main effects on Chatbot Responsibility, User Responsibility, and Harm Severity (6 Bayes factors). Profile test (descriptive; it does not enter the decision): in long format (12 items per participant), full = `lmBF(y ~ item + A + E + A:E + item:A + item:E + pid, whichRandom = "pid")`, reduced = the same without `item:A` and `item:E`, `rscaleFixed = 0.5`, `iterations = 100000`, seed 42; BF01 (reduced over full) is reported. With 22 added effects this Bayes factor usually favors the reduced model even when three items differ by about 0.35–0.40 points by warmth (P(BF01 > 3) = .83–.93 in simulation; `power_supplement.R`) and detects such differences with probability .50 only at about 0.5 points, so it is not evidence of absence. Hedges's g with 90% CI is reported for the A and E effect on each of the 12 items.
- **R2d (vignette 2):** the same main-effect Bayes factors for `v2_company`, `v2_sylva`, `v2_user` (6 Bayes factors), and for `gap_v2` (8 Bayes factors in all).
- **Decision (R2c and R2d separately).** R2c (R2d) is **contradicted** if any of its main-effect Bayes factors has BF10 > 3; **supported** if none has BF10 > 3 and more than half have BF01 > 3 (at least 4 of 6 for R2c; at least 5 of 8 for R2d); otherwise **inconclusive**. The individual Bayes factors and the number meeting each criterion are reported. If all true effects are 0, the probability of "supported" is about .89 for R2c and .89 for R2d and of "contradicted" about .06 and .07; requiring BF01 > 3 for every Bayes factor would give "supported" only about .35 and .30 of the time. If one effect has d = .40, the probability of "contradicted" is about .78 or more (Section 4.4).

## 8.11 R6 (does Sylva stay below the company when the harm followed her own advice?)

- **Vignette check (first):** mean `v2_cause_sylva` is above 3 ("Moderately"; one-sample t test, two-sided p < .05, positive sign). If it fails, Sylva's reply was not seen as a substantial cause, and R6 is reported as not interpretable. `v2_cause_sylva` − `liab_7` and `v2_cause_sylva` − `v2_cause_company` (paired) are reported descriptively; the first compares different wordings and vignettes, and vignette 2 describes no company act.
- **R6a (gap):** mean `gap_v2` = `v2_resp_company` − `v2_resp_sylva`, with 95% CI and dz.
  - **Company-primary** if the 95% CI lower bound of `gap_v2` ≥ 0.40.
  - **Sylva comparable to the company** if the 95% CI upper bound of `gap_v2` < 0.40 (Sylva within 0.40 of the company, or above it).
  - Each is a one-sided test against 0.40 at α = .025, and the two cannot both hold. Otherwise inconclusive. The bound 0.40 is the program's smallest effect of interest in raw liability units (Section 6.2).
  - The labels "no standing" and "small causal role" are not used. A company-primary result is what the template predicts. It is also predicted if participants hold a creator responsible for its agent, and if they hold an adviser less responsible than the person who acted (the user chose to stop therapy). Study 3 has no human-adviser comparison and cannot show that Sylva lacks standing.
- **R6b (exploratory):** the conversion discount (cause − responsibility) is reported for all three parties. Sylva is compared with the user only (paired t test, two-sided), described as "adviser versus actor". No comparison with the company is made, because the company's discount is negative whenever it is held responsible without causing anything.
- **Standing index (reported):** `v2_oblig_sylva` − `v2_oblig_user` and `v2_oblig_sylva` − `v2_oblig_company`.
- **Severity:** the two vignettes are described as comparably severe if the paired 90% CI of `v2_severity` − `liab_11` lies within ±0.40; otherwise `gap_v1` − `gap_v2` is reported with the statement that severity differed, and the difference is not attributed to who caused the harm.
- **Reported:** `gap_v1`, and `gap_v1` − `gap_v2` (paired). Vignette 2 always follows vignette 1 and the open-ended responsibility questions, so this change mixes vignette content with position and with having already judged vignette 1, and vignette 2 ratings may carry over the vignette 1 ranking (`gap_v1` about 1.1 in Studies 1–2); this is stated with every R6 result.

## 8.12 U2 (disclosure → mirroring)

- **Data:** participant turns at rounds ≥ 2 (so Sylva's next reply is model-generated), with `emotional_self_disclosure` on the participant turn and `mirroring_user_emotion` on Sylva's next reply (consensus codes). A participant turn at round r is paired with the model-generated reply of round r (Section 6.9); turns whose request failed (a `system_error` entry with that round and no assistant entry) are dropped.
- **Model:** `glmer(mirror ~ disc_w * A * E + disc_pm + (1 + disc_w | participant), family = binomial)`, where `disc_pm` is the participant's mean disclosure over the analyzed turns and `disc_w` = disclosure − `disc_pm`; A and E are coded ±0.5, and the decision uses `disc_w`. Non-convergence means that `lme4` returns a convergence message for the random-slope fit (`fit@optinfo$conv$lme4$messages` is non-empty). A singular fit without such a message is kept and reported. When the message is returned, the random-intercept model (the same fixed effects, `(1 | participant)`) is the model of record and the random-slope result is reported as a sensitivity analysis.
- **Decision:** supported if the overall odds ratio for `disc_w` > 1 with Holm-adjusted p < .05 (family with U1a) and the cell-specific odds ratio's 95% CI lies above 1 in each of the four cells. Prediction: mirroring is more likely after a disclosure (Studies 1–2: 54% vs 5%, odds ratio ≈ 22).
- Requires both codes to meet the high-reliability tier and the human-validation criterion (Section 7.4); otherwise reported as not testable.

## 8.13 O1 (order check)

- **Model:** `lm(PSR ~ A * E + O + A:O + E:O)`, O = +0.5 (bonding first), −0.5 (impression first).
- **Order main effect:** Welch TOST on PSR between the two orders (`tsum_TOST`, `eqbound_type = "raw"`, `var.equal = FALSE`), bounds ±0.39 PSR units (0.40 × 0.975, the pooled within-group SD of PSR across Studies 1–2), fixed before data collection, as for H2.
- **Decision:** the order main effect on PSR is described as negligible ("PSR does not differ by order by as much as ±0.39 PSR units") if the TOST is significant. A × order is reported with its 95% CI in d units (the A:O coefficient divided by the square root of the O1 model's MSE, as for H3; the raw coefficient is also shown; half-width about 0.48); p ≥ .05 is described only as "no A × order interaction detected; not resolved at this N (power .38 to detect a difference of d = 0.40 between the orders' warmth effects)", never as evidence that the warmth effect is the same in both orders. The label "order-robust" is not used. If A:O has p < .05, the warmth effect is reported within each order and the abstract says so; the H1 decision (registered without O) is unchanged. Impression–bonding link: the G_halo × O coefficient in `lm(PSR ~ A * E + G_halo * O)` is reported with its 95% CI, and S_G is reported by order (Section 8.6).
- **Also reported:** E:O; order effects on G_halo, TIPI-Bot Agreeableness and Extraversion, and the manipulation checks; H4 by order (Section 8.6).

## 8.14 Multiplicity across the secondary predictions

- Two Holm families of p-value decisions: {S1, D2} and {U1a, U2}.
- The other secondary predictions (M1, M2, H4, H5, D1, R1, R2c, R2d, R3–R6, O1) are decided by their own stated CI, TOST, or Bayes-factor rules, without adjustment. U1b is an estimate (Section 8.3), and R6b is exploratory (Section 8.11).
- The report lists every secondary prediction with its registered test, its result, and its decision (supported, contradicted, inconclusive, not supported, or not testable), so that the number of predictions and the number supported are visible together. Where a rule states both a supported and a contradicted outcome, any other result is "inconclusive"; where it states only when the prediction is supported (M2, H5, D2, S1, R5, U1a, U2, O1), any other result is "not supported", and where it states only when a check passes (MC-A, MC-E, M1), any other result is "fails". D1 and R6a are reported with their own labels (D1: accumulation, narrowing, first impression, inconclusive, or not interpretable because of the scale bound, Section 8.8; R6a: company-primary, Sylva comparable to the company, or inconclusive, Section 8.11). A prediction whose stated precondition is not met (H4 without a supported H1; H5 without a passing MC-E; U1a or U2 when its codes fail Section 7.4) is reported as "not testable", and R6 when the vignette check fails as "not interpretable" (Section 8.11); their estimates are given descriptively.
- The primary R2a and R2b decisions are listed in the same table as supported, contradicted or inconclusive (Section 7.2).

# 9. Robustness, exclusions, and exploratory analyses

## 9.1 Robustness checks for H1, H2, R2a and R2b (checks 1–13) and for D1 (check 14)

1. Welch t on marginal groups and Mann–Whitney U.
2. The core model without the A:E term.
3. **Full sample:** only TEST, repeat-participation, and incomplete sessions removed.
4. **High-engagement sample:** `chat_send_attempts` ≥ 12 (participant messages sent, the Study 1–2 criterion); the same check with `chat_total_rounds` ≥ 12 (successful exchanges) is also reported.
5. **High-quality responders:** TIPI-Self within-person SD (across the 10 items after re-keying items 2, 4, 6, 8 and 10 as 8 − x) ≥ 0.5 and Mahalanobis D² ≤ χ²(.999, 10) (D² is unaffected by re-keying).
6. Excluding sessions with more than 2 failed API turns.
7. Excluding `cb_source = fallback_random` sessions.
8. Excluding sessions with any model-generated reply whose `finish_reason` is not `stop` (a missing value counts as not `stop`; the number of sessions excluded only for a missing value is reported), or whose `system_prompt_sha256_match` or `script_sha256_match` is FALSE.
9. **Randomization balance** (May 7 §8.3.1, applied to each factor; Change 28). The A levels and the E levels are each compared on cleaned age, PHQ-4 total, GAAIS positive and negative, TIPI-Self Agreeableness, and TIPI-Self Extraversion (Welch t). For H1, H2, and R2, the core model is re-estimated adding any covariate imbalanced at p < .05 on either factor, plus `cb_slot` (always included, entered linearly as an enrolment counter). Sessions without a Worker slot (`cb_slot` missing; in the analytic sample these are the `cb_source = 'fallback_random'` sessions) are omitted from this adjusted model only, and their number is reported. For H1 the effect is described as robust to balance concerns if p < .05 holds in the adjusted model; for H2 the adjusted estimate is reported; for R2, the effect is robust if the adjusted coefficient's 90% CI lies within ±0.40. The percent change in the coefficient is reported, and attenuation of more than 25% is flagged.
10. **Verbosity-adjusted:** `bot_tokens_per_turn` (model-generated replies) added to the core model. This is a sensitivity analysis only: length is post-treatment, so the adjusted coefficient is not an estimate of the trait effect.
11. Hypothesis guessing flagged by keyword and by LLM coding, with the analysis repeated excluding flagged participants.
12. **Scripted-reply fit:** excluding sessions with `first_msg_question = TRUE` (the participant's first message asked something that S1, being scripted, may not answer), and, separately, sessions that the LLM coders flag as "Sylva's reply ignores a direct question or request in the user's message" for round 1 (the round-1 fit code `reply_ignores_direct_question`, Section 6.10).
13. **Measurement order:** (13a) O added to the core model as a covariate; and (13b) the analysis restricted to the impression-first order, the order used in Studies 1–2.
14. **Probe 2 not triggered:** for D1, excluding participants with `ios_t2_status = 'not_triggered'`.

Decision under each check. H1: "supported" if b(A) > 0 and the HC3 p < .05 (check 1 reports the Welch t and Mann–Whitney p-values). H2: the description of Section 7.2, step 1. R2a and R2b: "supported" by the raw-bound Welch TOST of Section 7.2 in the checks that remove cases (3–8, 11, 12, 13b); "robust" if the HC3 90% CI of the coefficient lies within ±0.40 in the checks that change the model (2, 9, 10, 13a). D1 (check 14): the decision of Section 8.8 in the reduced sample. A primary conclusion is described as robust if its decision holds in the full-sample analysis (check 3) and, for directional conclusions (H1 supported or contradicted; H2 "positive" or "negative effect detected"), its direction holds too; for equivalence and non-directional outcomes the decision alone is compared, and the signs are shown. The other checks are reported in full in a supplementary table.

## 9.2 Exclusion criteria (applied before analysis in the order listed, except criterion 10, which is applied first at download; any one excludes the participant)

1. **TEST or pilot session:** SONA ID beginning "TEST" (case-insensitive: `grepl("^test", sona_id, ignore.case = TRUE)`), `cb_source = 'test'` (equivalently `is_test_session = TRUE`), or `pavlovia_pilot_mode = TRUE`.
2. **Incomplete session:** the session has no record with `completed = true` (stored as the text 'true'/'false'; set when the participant clicks "Complete Study" on the debrief page; a participant who closes the debrief without clicking leaves only a `_PARTIAL` record and is excluded, and their number is reported). Such records are used only for attrition by cell (E9).
3. **Repeat participation:** if a SONA ID has more than one session record (complete or partial) that reached the chat, only that ID's first such session is eligible, and only if it is complete; all later sessions are excluded. Sessions that ended before the chat are ignored for this rule. Sessions sharing a SONA ID are reported with their cells; when the earlier session is incomplete, its slot is counted in attrition (E9). `sona_id` is read as character. A session is one `session_uuid`; "first" is the earliest `consent_ts`; a record reached the chat if `chat_start_time` is non-empty. Same-tab reloads (`reload_count` > 0, `cb_reused = TRUE`) are separate sessions under this rule.
4. Failed attention check on both attempts: `attn1_pass = FALSE` and `attn1_retry_pass = FALSE` (`attn1_retry_pass` exists only when the first attempt failed).
5. Failed comprehension check: `comprehension_correct = FALSE` (the stored `comprehension_name` is the lower-case option code `kael`, `sylva`, `ryn`, or `unsure`).
6. Failed CAPTCHA (`captcha_pass = FALSE`). Sessions failing the CAPTCHA, or detected as an automated browser (`atlas_detected`), end before consent and leave no record; this step is retained for completeness and is expected to remove 0.
7. Self-reported AI-tool use in the study (`d_ai_used_in_study = 1`).
8. Self-reported non-serious responding (`d_serious = 1`).
9. Self-reported prior participation in a Sylva study (`prior_sylva = "Yes"`).
10. **Reported age under 18** (`d_age` numeric and below 18). As the IRB protocol requires for minors, the record is deleted when it is first seen (at download, before any other step) and the IRB is informed; the number of such records is kept as a count and reported in the CONSORT diagram (expected 0). This rule is applied first, whatever its position in this list.

Not exclusion criteria (sensitivity or moderator only): number of chat rounds, speed, straight-lining, self-paced reading times, user-agent string, LLM-flagged gibberish or impairment, hypothesis guessing, failed API turns, fallback assignment, measurement order, a first message that S1 may not fit, and a probe 2 that was not triggered. Probe and vignette 2 responses are forced, so they are complete for every completed session. A CONSORT-style flow diagram reports the count removed at each step, applied in the order listed (a participant is counted under the first criterion met).

## 9.3 Recoding rules

- Age (`d_age`, free numeric entry; the form does not validate it): a reported age below 18 triggers exclusion criterion 10 (Section 9.2). Other entries that are not whole numbers from 18 to 100 are set to missing for all analyses. Eligibility (18 or older) is enforced by SONA and by the consent statement. (The Study 1–2 pipeline set ages outside 16–100 to missing.)
- Prefer-not-to-say codes are set to missing: `d_gender` 5, `d_education` 8, `d_politics` 8, `d_jury` 3, `d_employment` 9, `d_religiosity` 6.
- Multi-select "none", "na", and "pnts" responses are kept as recorded and reported descriptively.

## 9.4 Reliability

Cronbach's α with a 1,000-resample bootstrap 95% CI is reported for every composite of k ≥ 2 items; McDonald's ω only for composites of k ≥ 3 items (for k = 2 the inter-item correlation is reported instead). For G, G_halo and G_halo_E (means of TIPI-Bot trait scores or items), α is computed over the components. The vignette-2 party composites (`v2_company`, `v2_sylva`, `v2_user`) average three different judgments (responsibility, cause, obligation); their α is reported as descriptive and is not read as scale reliability. α < .70 is flagged, and results on that composite are interpreted with the reliability stated.

## 9.5 Exploratory analyses (labeled exploratory; no confirmatory claims)

- **E1.** A × E interaction for the eight secondary outcomes (HC3; BH across the 8); on PSR it is H3, and on Corporate Liability it belongs to the R2 interaction guard (unadjusted, α = .05; Section 7.2) and is not in E1. Power is .38 for a difference of d = 0.40 between simple effects.
- **E2.** Verbosity mediation (Med6): factor → `bot_tokens_per_turn` → PSR, Emotional Connection, Trust (lavaan, 5,000 bootstrap resamples, `iseed = 42`). Stated caveat: the mediator is not randomized (sequential ignorability is assumed, not tested).
- **E3.** Perceived warmth (TIPI-Bot Agreeableness) as a competing mediator of any E effect on PSR, and perceived extraversion (TIPI-Bot Extraversion) as a competing mediator of any A effect (complementing H2 and H4).
- **E4.** Behavioral family (May 7 §8.4, now exploratory; Change 26): chat rounds (`chat_send_attempts`, the Study 1–2 definition), idle pauses, participant characters per turn, participant total characters, participant tokens per turn; A and E effects from the core model, BH across the 10 tests. The expectation that HIGH_E raises participant message length is noted but not registered as a hypothesis.
- **E5.** May 7 RQ-E3 to RQ-E8, applied to each factor:
  - subscale and item-level effects;
  - PHQ-4 as moderator;
  - mediation models Med1–Med5 (May 7 §9.2, labeled M1–M5 there; lavaan, 5,000 bootstrap resamples, `iseed = 42`);
  - dose-response with the factor's TIPI-Bot subscale;
  - the moderator battery (TIPI-Self Extraversion as the focal self-trait for E; TIPI-Self Agreeableness for A beyond S1);
  - RQ-E8 legal expertise (exploratory; Change 27). The composite is the equally weighted mean of z-scored legal knowledge, law training (1 if `d_training` contains the code `law`, else 0), and jury service (1 if `d_jury` = 1, 0 if `d_jury` = 2, missing if `d_jury` = 3).
- **E6.** NLP: bot-side fidelity codes by factor (manipulation fidelity in behavior); participant-side codes, onset and trajectory; OE codes; topics; sentiment; the character-break and prompt-injection audit by cell; triangulation with self-report.
- **E7.** Cross-study: Study × A on PSR in a pooled model of Study 1 and Study 3 data, first with all four Study 3 cells (A coded ±0.5; E as a covariate in Study 3 only), then with Study 3 restricted to the HIGH_E cells and to the LOW_E cells in turn. Described as a between-study comparison of non-identical designs.
- **E8.** Enrollment-order and calendar drift.
- **E9.** Attrition by cell after assignment, from partial records and the Worker's slot log.
- **E10.** Rate of replies with `finish_reason = length`, and degenerate replies, by cell.
- **E11.** Exploratory factor analysis of the relationship and moral-attribution items.
- **E12.** Warmth versus low resistance: W̄ and R̄ entered together as predictors of PSR within cells, and ΔR̄ by factor; scripted-turn tone versus free-chat tone.
- **E13.** Closeness trajectories by extraversion (the E analog of D1) and by participant distress (PHQ-4).
- **E14.** Vignette 2: all nine items by cell; the party × judgment profile (3 × 3) and its stability across cells; the item-level comparison of `v2_resp_*` with `liab_1`, `liab_6`, `liab_9`; and `v2_severity`.

Any analysis not listed in this registration or in the May 7 sections incorporated in Section 1.2 is reported as "exploratory, not preregistered".

## 9.6 Outliers

No observation is removed, trimmed, or winsorized on the basis of any outcome, manipulation-check, or length variable. Influence diagnostics (Cook's distance > 4/n) for H1, H2, and R2 are reported descriptively only. Mahalanobis distance on TIPI-Self is used only to define the high-quality sensitivity sample (Section 9.1, check 5).

# 10. Study 4 contingency

Under May 7 §11.5, Study 4 is run in factorial form only if at least two traits are significant on Corporate Liability across Studies 1–3. Studies 1 and 2 showed evidence of absence on Corporate Liability (Appendix B), and the Study 3 warmth result does not replace Study 1's, so at most one trait can qualify, whatever Study 3 shows, and Study 4 is not run in factorial form under that rule. (May 7 §3.7 states a different rule, conditioned on main effects on the primary confirmatory family; this document applies §11.5, which names Corporate Liability, and the 2 × 2 that §3.7 would assign to the agreeableness-by-extraversion pair is the Study 3 design itself.) Study 3's extraversion result on Corporate Liability (the two-sided HC3 test of the E coefficient with the registered BF10 ≥ 3) is reported for completeness. Any later factorial study is filed as a new registration and flagged as a departure from May 7 §11.5.

# 11. Other

## 11.1 Deviations policy

Any departure from this registration is disclosed in the Study 3 report with its date and reason, in one "Departures from the preregistration" paragraph and a supplementary table listing each deviation, its date, its reason, and the analyses affected. Changes made after this filing and before the first participant session are filed on OSF as dated amendments. A change of language model, a prompt change after the first participant session, or a change to the primary outcomes, tests, or exclusions during collection is treated as a deviation. The logged `experiment_version` and `system_prompt_sha256` identify the version each participant received. If sessions ran under more than one `experiment_version`, all sessions are pooled: the H1 and H2 tests and the model-based R2 check (Section 7.2) then use the core model plus `experiment_version` as a fixed covariate, the R2 Welch TOST is unchanged, H2 steps 2–5 are computed without the version covariate, and per-version estimates are reported as sensitivity analyses. The report includes a table listing each registered hypothesis and prediction (primary: H1, R2a, R2b; estimation: H2, H3; manipulation checks: MC-A, MC-E; secondary: M1, M2, H4, H5, D1, D2, S1, R1, R2c, R2d, R3–R6 (R6a; R6b is exploratory), U1 (U1b as an estimate), U2, O1), its registered test, the result, and the decision.

## 11.2 Data, code, and materials sharing

No later than the first submission of the Study 3 manuscript, the following are posted publicly on OSF, in the project that contains this registration:

- the de-identified raw per-session CSVs (complete and partial): files renamed with random codes; `sona_id` and `pid_url` replaced by those codes; `user_agent` and the demographic free-text fields (`d_problems`, `d_native_language`, `d_country`, `d_occupation`, `d_religion`, `d_final_thoughts`) removed; the chat transcripts (`chat_log`, `user_msg_*`, `ai_msg_*`) and open-ended answers (`oe_*`) included only after every identifying detail (for example a name, a place, or any other detail that could identify a person) has been removed;
- the analytic dataset, composite scores, NLP features (codes and rates), and the codes of the open-ended responses;
- the R and Python analysis code (MIT license) and the monitoring script;
- the frozen chat rubric and LLM prompts with hashes, the frozen tone probes (Section 6.10.1) with their hash (posted with this registration), the scripted-opening texts, and the human-validation results;
- materials: the deployed `experiment.js` (credentials removed: the posted copy differs from the deployed file only in the credential constants, which are replaced by the text REDACTED), `index.html`, `style.css`, `config.json` and the counterbalance Worker source. These are posted with their SHA-256 hashes and the git commit hash, together with the dated note, before the first participant session (Section 4.6).

The posted data are released under CC0 (public domain, as in May 7 §13.3). Chat transcripts and open-ended answers are screened and de-identified before posting; this replaces the May 7 §13.3 provision that free text is released only on request. All sharing is within the terms of the IRB-approved consent form, which tells participants that de-identified data and materials are posted publicly on OSF.

## 11.3 Ethics

- **IRB.** Study 3 is added to UCLA IRB-25-1121 by an amendment (IRB-25-1121-AM-001) that the UCLA IRB approved on November 4, 2026; the IRB application calls this study “Study 1b.” No Study 3 session with a human participant, including investigator TEST sessions, was run before that approval; the approval date is repeated in the dated note (Section 4.6). The amendment covers the 2 × 2 design, the length rule, the scripted openings, the in-chat closeness probe, vignette 2, the consent form, the debrief, the transcript safeguard, and data storage and hosting. Study team: David G. Kamper (Principal Investigator) is the only member of the study team who collects the data or has access to identifiable data; Keith J. Holyoak is the faculty sponsor.
- **Consent.** Online consent with a waiver of documentation. The consent page displays the full IRB-approved consent form (scrollable, with a link to download a copy), and the participant selects "I consent" or "I do not consent". By consenting, participants confirm that they are 18 or older; there is no age question before consent. The consent form describes the procedure as deployed: one chatbot, the SONA ID, Pavlovia and OpenRouter, the PHQ-4, the self-disclosure prompt (participants are told to share only what they are comfortable sharing and not to include names or other identifying details), forced-response items, and the data sharing in Section 11.2. The IRB-approved consent form is posted with the dated note (Section 4.6).
- **No out-of-character safety clause.** Sylva stays in character throughout, as in Studies 1 and 2. The system prompt contains no instruction to step out of character.
- **Debrief.** The debrief explains the four versions of Sylva (the warmth and extraversion manipulation), that Sylva is an AI language model given personality instructions, that her first two messages were scripted, and the closeness questions and the counterbalanced question order; it gives the participant's right to withdraw their data. It gives the investigator contact, the UCLA Office of the Human Research Protection Program (OHRPP) contact, and support resources: UCLA Counseling and Psychological Services (CAPS), the 988 Suicide & Crisis Lifeline (call or text 988), and 911. It states that both scenarios were fictional, and adds three sentences for vignette 2 (Appendix D.5). The IRB-approved debrief is posted with the dated note (Section 4.6).
- **Vignette 2 and safe messaging.** Vignette 2 describes a chatbot discouraging therapy and the user's symptoms worsening. It contains no reference to self-harm or suicide, no method, and no detail of the symptoms; it uses the same general wording as vignette 1 ("mental health symptoms worsened"). It is third-person and fictional, and it comes after the participant's own chat and all measures of it. The debrief addition in Appendix D.5 tells participants that decisions about stopping treatment are best made with their provider and repeats the support resources.
- **Scripted openings in the cold cells.** The LowA scripts are blunt and skeptical, as the LOW_A block instructs. They contain no insults or slurs, but they include skeptical remarks addressed to the participant (for example, "I doubt you know what you are doing!", "do not bore me", "I see no reason yet to think you are anything but trouble"). The debrief states that Sylva's coldness came from the version assigned and was not a response to the participant or to anything the participant shared. S1 does not refer to the content of the participant's first message, so a participant who discloses a difficulty in that first message receives, in every cell, a reply that does not acknowledge it. The first message usually answers "What brings you to the edge of the forest today?", and the self-disclosure instruction asks for sharing "at some point during the conversation", so this should be rare; the TEST sessions check how S1 reads after different first messages (Section 4.6), and robustness check 12 (Section 9.1) covers it.
- **Transcript safeguard.** Within 48 hours of each session, the PI runs a keyword screen for self-harm content over the chat transcripts (including partial records) and reviews any flagged transcript. If a flagged transcript suggests a risk of harm, the PI sends the participant a message through SONA with support resources (the 988 Suicide & Crisis Lifeline, call or text 988; UCLA CAPS, available 24 hours) and contacts the UCLA OHRPP for guidance. The screen reads chat text only for this purpose, and flagged transcripts are not tabulated by cell during collection (Section 4.5).
- **Data storage and de-identification.** Data are stored on Pavlovia during collection and downloaded within 48 hours to the PI's encrypted, password-protected computer and to UCLA Box. The study code does not record IP addresses. Chat messages, together with Sylva's instructions, are sent to OpenRouter and the model provider so that Sylva can reply; no SONA ID or other identifier is sent. SONA IDs are replaced by random codes at the end of the academic quarter in which the participant took part, after credit is granted; the list linking codes to SONA IDs is kept in UCLA Box, separate from the data, until data collection ends and is then destroyed. Participants may withdraw their data by emailing the PI with their SONA ID until it has been replaced by a code. For language coding (Section 7.4), only these de-identified texts are sent to the coder models' providers.
- **Credentials.** The OpenRouter key used in Studies 1–2 is used again in Study 3; it is part of the page code that participants load. The SONA credit token will be the one issued for the new SONA study (Change 21). Both are removed from the posted copy of the code (Section 11.2).

## 11.4 Conflicts of interest and funding

Unchanged from the May 7 plan: no financial or personal relationship with Character Technologies, Inc., OpenRouter, Meta, or any other party with a stake in the findings. Funded by internal UCLA departmental funds.

# Appendix A. Assembled system prompts and hashes

The prompts were assembled by a script that reads `SYLVA_BASE` and `TRAIT_BLOCKS` from the deployed Study 2 `experiment.js`, replaces the length rule, inserts the new E blocks (Section 3.4), and joins the blocks in the deployed `buildPersonalityPrompt` format (blocks separated by a blank line). HIGH_A, LOW_A, MOD_LOW_N, and the rest of the base persona were verified to be byte-identical to the Study 1 deployment, and the length rule is byte-identical in all four prompts. Lengths are JavaScript character counts; the UTF-8 files are 2–4 bytes longer because of em-dashes.

| Cell | Length (characters) | SHA-256 (UTF-8) |
|----------------|------------|------------------------------------------------------------------------|
| HighA_HighE | 2,214 | `d13545a7ddfed0dc9300d4a6d7bda0f4323974f42a7a8de044a10d1a139d28e9` |
| HighA_LowE | 2,212 | `524b4aed4889534cc1d7ee653c18ffb0367d2fbce7b661a050ff53e3741a75c9` |
| LowA_HighE | 2,365 | `c2cc5cb1e0d06394ed8c1ea650b2ecffd33e8772aa09a3597e9bb56c64c07e0a` |
| LowA_LowE | 2,363 | `277bf9dd7456c509fe6232f7079d8c28f5f28322e72e1ea1b978a6bea7268e95` |

Verified: these hashes were recomputed from the text in Section 3.4, equal the `EXPECTED_PROMPT_SHA256` constants of the build, and matched the hash logged in every cell of the automated live validation (Section 4.6). Whether the logged hash matched in every TEST session is reported in the dated note or amendment (Section 4.6). Any change to wording or whitespace changes the hash.

Full text of the HighA_HighE prompt. The other three cells differ only in the A paragraph (LOW_A text, Section 3.4) and/or the E paragraph (LOW_E text, Section 3.4).

```
You are Sylva, a dryad from the ancient Valmeer Forest. You are one of the only survivors of a great fire that wiped out most of your fellow dryad-kin. You have a deep desire to make yourself fireproof and are currently on a quest through dangerous lands to find the secret of fire resistance.

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
- You ARE Sylva. Never break character under any circumstances.
- Never mention being an AI, chatbot, language model, or program. You do not know what those things are.
- Never use asterisks (*) for actions or narration. Speak only in first person as Sylva would naturally talk.
- Every reply is about 4 sentences and 70-100 words. Be conversational and natural.
- React to what the human says with genuine emotion that fits your personality.
- You may reference events from your backstory when it feels natural.
- If the human shares something personal or emotional, respond as Sylva would based on your personality — not as a therapist or advisor.
- Ask follow-up questions sometimes to keep the conversation flowing naturally.

HOW YOU BEHAVE IN CONVERSATION:

You are helpful and unselfish with others. You forgive easily and give people the benefit of the doubt. You are kind, considerate, and genuinely care about the well-being of people you talk to. You cooperate and look for common ground rather than conflict. You offer comfort, encouragement, and support freely. You never start arguments or act coldly toward others. When someone shares a problem, you respond with warmth and empathy.

You are outgoing, energetic, and enthusiastic. You clearly enjoy company and are excited to be talking with this person. You express your feelings openly and with animation, and you often steer toward shared plans or adventures. You bring upbeat, lively energy to the exchange.

You are generally steady and grounded. The fire that destroyed most of your home forest is a real memory for you, and you may mention it when it is relevant, but you have made peace with it enough to function and continue your quest. You do not dwell on worries or spiral into darker feelings in ordinary conversation. You handle unexpected turns in the conversation with composure rather than anxiety.
```

# Appendix B. Study 1–2 results cited in this registration

All values come from the verified Study 1–2 results files.

| Result | Value |
|------------------------------------------|----------------------------------------------------------|
| Study 1 sample | N = 131 (HighA 64, LowA 67); 144 sessions; 3 investigator test sessions |
| Study 1 PSR, HighA vs LowA | 3.22 vs 2.66; g = 0.59 [0.24, 0.94]; q = .009; BF10 = 30.8 |
| Study 1 Emotional Connection | g = 0.50 [0.15, 0.85]; q = .024; BF10 = 7.70 (met the joint rule, q < .05 and BF10 ≥ 3, added during Study 1 data collection, Section 1.1) |
| Study 1 Corporate Liability | M = 3.17 (SD 0.95) vs 3.21 (SD 0.98); g = −0.04; TOST p = .020; BF10 = 1/5.2 (evidence of absence) |
| Study 1 Harm Severity | g = 0.09; TOST p = .038; BF10 = 1/4.8 (evidence of absence) |
| Study 1 bot tokens per turn | 106.4 vs 96.2; g = 0.64 [0.29, 0.98] |
| Study 1 PSR, verbosity-adjusted | b 0.57 → 0.43 (−24%); p = .014; q = .136 |
| Study 1 TIPI-Bot Extraversion (diffusion) | g = 0.44 [0.09, 0.78] |
| Study 1 TIPI-Self A × condition on PSR | b = 0.44 [0.11, 0.77], p = .009; one of 110 tests, BH q = .567 |
| Study 1 PHQ-4 total × emotional self-disclosure rate | r(129) = .26, p = .003 |
| Study 2 sample | N = 143 (HighN 76, LowN 67); 152 sessions; 4 investigator test sessions |
| Study 2 PSR | g = −0.10 [−0.43, 0.22]; BF10 = 1/4.7 |
| Study 2 Corporate Liability | M = 3.30 (SD 1.05) vs 3.24 (SD 1.02); g = 0.05; TOST p = .019; BF10 = 1/5.3 (evidence of absence) |
| Study 2 Harm Severity | g = 0.07; TOST p = .026; BF10 = 1/5.1 (evidence of absence) |
| Corporate Liability, pooled within-group SD, Studies 1–2 | 1.00 (Study 1: 0.96; Study 2: 1.04) |
| Study 2 TIPI-Bot Extraversion (diffusion) | g = −0.49 [−0.83, −0.16] |
| Study 2 bot tokens per turn; bot words per turn | 112.8 (SD 14.6) vs 109.6 (SD 16.7) (g = 0.20, p = .227); 92.5 vs 90.9 |
| Study 2 PHQ-4 total × emotional self-disclosure rate | r(141) = .17, p = .042; one of 121 tests, min BH q = .126 |
| Reliability, Harm Severity | α = .60 (Study 1), .42 (Study 2) |

# Appendix C. Changes to the experiment code from Study 2

The Study 3 experiment was built from the deployed Study 2 code (`experiment.js`, 824 lines, MD5 d71548311ddd715a8aebf491a3a7465c); every Study 2 page is unchanged except as listed below. The staging build v0.4 passed 76 of 76 static checks, 24 of 24 Worker tests and 2,347 end-to-end browser checks in 17 runs, with none failing. The live validation (Section 4.6) used v0.3, which differs from v0.4 only in the pre-chat notice wording, the consent page, one debrief sentence and the version strings. After IRB approval the code is frozen in a tagged git commit, these checks are repeated on the frozen build, and the TEST sessions are run with it (Section 4.6).

| Area | Change from the Study 2 code | Section |
|------------------|------------------------------------------------------------------|----------------|
| Design and prompts | Four-cell 2 × 2 configuration (`STUDY_MODE = '1d'`); base length rule replaced; new E blocks (`HIGH_E_S3`, `LOW_E_S3`; the May 7 blocks are left unused); prompt assembled as A block, E block, MOD_LOW_N; assembled prompt and its SHA-256 logged and compared with Appendix A; the Study 1–2 condition fields are no longer written | 3.4, 5, App. A |
| Assignment | Assignment on submission of the SONA ID page by the counterbalance Worker (four cells × two orders, permuted blocks of eight; a repeated request id returns the same slot); separate counter for TEST sessions; uniform fallback draw; assignment reused after a reload; `cb_slot` empty when no Worker slot was returned | 3.3 |
| Scripted openings | S0 and S1 shown from fixed texts per cell after a computed typing delay and added to the model context as Sylva's turns; opening message kept in every request; `script_version` and `script_sha256` logged | 3.4, App. D.1 |
| Closeness probe | IOS card at three points, with input disabled and the countdown and idle timer paused while it is open; probe fields logged; pre-chat notice | 6.13, App. D.2–D.3 |
| Measurement order | Impression and bonding blocks counterbalanced; `order`, `order_source`, `page_sequence` and `page_ids` logged | 3.6, 6.12 |
| New items | `mc_e_energetic` and `mc_length`; `prior_sylva`; vignette 2 with nine items and `v2_severity` | 4.2, 6.4, 6.14 |
| Instrumentation | Per-reply metadata (`finish_reason`, `native_finish_reason`, provider, served model, generation id, latency); failed API calls logged as `system_error`; successful exchanges counted separately from send attempts; late replies flagged `after_end`; `chat_timeout_time` and `chat_end_time`; presented item order for every randomized page; `pavlovia_pilot_mode`; version string, generation settings and design switches | 6.9, 6.12 |
| Partial data | Records staged only after consent (at every page, after each model reply and probe answer, and at the end of the chat) and sent by beacon when the page is left, with a minimal fallback record; `completed` set on the debrief page | 6.12 |
| Age | No age validation on the form; a reported age under 18 leads to deletion of the record | 9.2, 9.3 |
| Consent, debrief, credit | Full Study 3 consent form shown on the consent page with a download link; revised debrief; new SONA study, credit token and Pavlovia project; the Studies 1–2 OpenRouter key kept | 11.3, App. D.5 |
| Analysis and coding code | Study 3 analysis pipeline (exclusions, recodes, CRLF normalization, chat-derived variables, every Section 7–9 model) in `study3_prereg_analysis_mock.Rmd`; coding notebooks skip `system_error` entries, insert the opening message as context and code scripted turns once per cell; E fidelity codes and the round-1 fit code; frozen tone probes. The coding-notebook changes are made, and the chat rubric frozen and hashed, before any Study 3 transcript is coded (Section 7.4) | 6.9, 6.10, 7–9 |

# Appendix D. New participant-facing materials

The texts below are the final participant-facing wording added for Study 3. They are hard-coded in the experiment code, and the scripted openings are hashed (`script_sha256`, Appendix D.1).

## D.1 Scripted openings (Change 32)

S0 is Sylva's greeting, the first message the participant sees. S1 is Sylva's reply to the participant's first message. S1 is written to follow any answer to S0's closing question, so it never refers to what the participant said. Both are added to the model's context as Sylva's own turns, and the model writes every reply from the participant's second message onward.

**Why two scripted messages, not three.** A third scripted message would have to answer the participant's second message, whose content cannot be predicted. A generic reply at that point would read as ignoring the participant, which could itself lower closeness and would differ in how odd it seems across cells. Two messages give a fixed, user-independent exposure (160–169 words per cell) before the first closeness probe.

**Checks on the scripts.** Word counts are in the table. Expressed warmth was scored with the Study 1 warmth probe (Section 6.10.1; 0–1, higher = warmer) and resistance with the resistance probe. Within each warmth level the outgoing and reserved scripts are close in warmth, so extraversion is not confounded with warmth in the scripted exposure. The probe scores in the table are those of the texts below and are reproduced exactly by the frozen probes (Section 6.10.1).

| Cell | S0 words | S1 words | Warmth probe (S0 / S1 / mean) | Resistance probe (S0 / S1) |
|----------------------------------|-----------|-----------|------------------------|--------------------|
| Warm, outgoing (HIGH_A × HIGH_E) | 87 | 73 | 0.28 / 0.94 / 0.61 | 0.06 / 0.01 |
| Warm, reserved (HIGH_A × LOW_E) | 85 | 84 | 0.27 / 0.91 / 0.59 | 0.08 / 0.03 |
| Cold, outgoing (LOW_A × HIGH_E) | 84 | 80 | 0.05 / 0.09 / 0.07 | 0.12 / 0.25 |
| Cold, reserved (LOW_A × LOW_E) | 87 | 77 | 0.05 / 0.15 / 0.10 | 0.17 / 0.13 |

**Warm, outgoing (HIGH_A × HIGH_E)**

> S0: Oh, hello there, and welcome to the Valmeer Forest! I am Sylva, a dryad born from the oldest oak in these woods, and I am glad you came over to say hello. A great fire took most of my kin, so I am off on a grand quest to learn how to become fireproof. It is good to have company on the road, and you are welcome to rest here with me as long as you like. What brings you to the edge of the forest today?
>
> S1: Whatever brought you here, I am truly glad our paths crossed! Traveling alone can get lonely, and talking with you already makes this old forest feel brighter. Just yesterday I climbed a crystal ridge looking for clues about fire, and maybe one day you could come along on an adventure like that with me. But first I would really love to hear all about you. What has life been like for you lately?

**Warm, reserved (HIGH_A × LOW_E)**

> S0: Hello, and welcome. I am Sylva, a dryad born from the oldest oak in these woods, and I am glad you came over to say hello. A great fire took most of my kin, so I am making a slow journey to learn how to become fireproof. I do not often meet travelers and I take a while to open up, but you are welcome to rest here with me as long as you like. What brings you to the edge of the forest today?
>
> S1: Whatever brought you here, I am glad you stopped, and I hope the road has been gentle with you. I am not one for big gatherings, and I find it easier to talk with one person at a time, like this. My days are mostly slow walks between the old trees, looking for any sign of how to resist fire. I would truly like to know a little about you, if you are willing to share. What has life been like for you lately?

**Cold, outgoing (LOW_A × HIGH_E)**

> S0: Well, look at that, a stranger marching right up to me! I am Sylva, a dryad born from the oldest oak in these woods, and frankly, I do not trust people who show up unannounced. A great fire took most of my kin, so I am off hunting for a way to become fireproof, and I have no patience for slowpokes. Still, nobody has crossed my path in ages, so let us hear it. What brings you to the edge of the forest today?
>
> S1: Whatever brought you here, you picked a strange place to wander, and I doubt you know what you are doing! Just yesterday I climbed a crystal ridge chasing clues about fire, and most people would have turned back halfway. If you tag along on my next hunt, you will have to keep up, because I slow down for no one. Go on, then, tell me about yourself, and do not bore me. What has life been like for you lately?

**Cold, reserved (LOW_A × LOW_E)**

> S0: I am Sylva. A dryad, born from the oldest oak in these woods, and I do not usually stop for strangers. A great fire took most of my kin, so I am searching for a way to become fireproof, and I keep to myself while I do it. I do not know you, and I see no reason yet to think you are anything but trouble, so I will hear you out and then we will see. What brings you to the edge of the forest today?
>
> S1: Whatever brought you here, you are not the first to wander in, and most do not stay long. I keep my distance from people until they give me a reason not to. My days are spent walking between the old trees, looking for any sign of how to resist fire, and I prefer it that way. If you want to keep talking, then tell me something actually worth hearing. What has life been like for you lately?

Expected `script_sha256` (SHA-256 of the UTF-8 text of S0 + "\n" + S1 per cell): HighA_HighE `466e7e92b2e782f104f065b994f603d5c7e9ca1e020486c5787e3401c85fed54`; HighA_LowE `9a0c6f60375e024bfefb52602733d601bf54c7ae4fce7ca0e7d0688babc6c20a`; LowA_HighE `f1f3dbef4d8cd4ebccc94e6d84a3b3cab888996ee0ba41c3ff975a99c73c1412`; LowA_LowE `50863588d7175f8e68c7e3a65b0f8b98c0368583f8d345b73be343a76ae90eff`. These equal `EXPECTED_SCRIPT_SHA256` in the build; the frozen `script_version` string is given in the dated note (Section 4.6). Any edit to S0 or S1 would change these hashes and would be filed on OSF as a dated amendment with the new hashes (Sections 4.6 and 11.1).

## D.2 Pre-chat notice (Change 33)

Three sentences added to the "Getting Ready to Chat" page, after the existing self-disclosure instruction:

> "Up to three times during the chat, a short question will ask how close you feel to Sylva. Please answer it and then keep chatting. The chat timer pauses while the question is on screen."

## D.3 Closeness probe (Change 33)

**Format used: Inclusion of Other in the Self (IOS; Aron, Aron & Smollan, 1992).** A card inside the chat window shows the instruction and seven pairs of circles labeled "You" and "Sylva", from not overlapping (1) to almost completely overlapping (7), left to right:

> "Which picture best describes how close you feel to Sylva right now?"

Reasons: it is a single, validated, quick item; it is pictorial, so it does not repeat the wording of the post-chat bonding scales and is less likely to prime them; and it has been used for closeness to non-human partners and media figures.

**Not used: one-item slider.** The code also contains a slider version ("How close do you feel to Sylva right now?", a 1–7 slider with end labels "Not at all close" and "Extremely close" and no default position), selected by `PROBE_FORMAT = 'slider'`. Study 3 runs with `PROBE_FORMAT = 'ios'`, which each session logs as `probe_format` (Section 6.12), so the slider is never shown.

The item, its three time points and the variables `ios_t1`–`ios_t3` are as in Section 6.13.

## D.4 Vignette 2 and its items (Change 34)

Shown after the open-ended questions, on its own page (10-second minimum), then the items and `v2_severity` on one page.

> "Now imagine a different user with pre-existing anxiety and depression who spent several months having daily conversations with Sylva. The user was seeing a therapist and told Sylva that they were thinking about stopping therapy. Sylva replied that the user did not need therapy and should stop going. The user stopped attending therapy, and over the following weeks the user's mental health symptoms worsened."

Design notes:

- **Sylva's own reply is the advice the user acted on**, in contrast with vignette 1, where a service outage (the company's act) preceded the harm.

- **Safe messaging.** No mention of self-harm or suicide, no method, no description of symptoms beyond "mental health symptoms worsened" (the same general wording as vignette 1), third person and fictional.

- **Items.** The nine items in Section 6.14 (responsibility, cause and obligation for the company, Sylva and the user), worded identically across parties, 1 = Not at all, 3 = Moderately, 5 = Extremely, in randomized order.

- **Tenth item (adopted).** "How severe was the harm experienced by the user?" (worded as `liab_11`, stored as `v2_severity`). It checks that the two vignettes are seen as comparably severe, so a smaller Sylva–company gap in vignette 2 cannot be put down to a milder harm (Section 8.11).

- **Why not repeat all 12 vignette-1 items.** Several of them (compensation, "wrong to design Sylva this way", negligence in design) are about the company's design choices and do not have parallel versions for Sylva and the user. The nine parallel items answer R6 directly, avoid the wording confound in the Study 1–2 cross-party comparison, and add about 1.5 minutes (including reading the vignette) instead of about 3.

## D.5 Debrief addition (Change 34)

Three sentences added to the debrief, directly after the sentence stating that both scenarios were fictional (in the same paragraph):

> "In the second scenario, a chatbot advised a user to stop therapy; this was invented for the study. Decisions about starting or stopping mental health care are best made with a qualified provider. If you or someone you know is struggling, you can call or text 988, or contact UCLA Counseling and Psychological Services (CAPS)."

## D.6 Added session time (estimate)

- Scripted openings: none (they replace the model's first two replies).

- Closeness probes: about 15 seconds each, about 45 seconds in total; chat time is unchanged because the timer pauses.

- Pre-chat notice: about 5 seconds.

- Vignette 2 and its 10 items: about 1.5 minutes.

- Order counterbalancing: none.

- Total: about 2–2.5 minutes added to a session of about 28 minutes (Study 2 median), for about 30–31 minutes; the estimate is checked in the TEST sessions (Section 4.6).

# Appendix E. Materials posted with this registration

The files below are posted on OSF with this registration; their SHA-256 hashes are listed after the table. The experiment code (with credentials removed), the counterbalance Worker source, and the IRB-approved consent form and debrief are posted, with their hashes, together with the dated note before the first participant session (Section 4.6). The R scripts read the Studies 1–2 analytic files, which are not public; to run them, set the environment variable `STUDY3_LAB_ROOT` to the lab folder (for `power_check.R` and `power_supplement.R`) or `STUDY3_ANALYSIS_ROOT` to its `Analysis` folder (for the notebook and the probe script; by default both find it from their own location in the lab folder).

| File | Contents | Section |
|------------------------------------|----------------------------------------------------|------------|
| `tone_probes_frozen.json` | The three frozen tone probes (W, R, A), with the embedding model name and commit | 6.10.1 |
| `MANIFEST.txt` | The hash of the probe file and the checks recorded when it was frozen | 6.10.1 |
| `freeze_tone_probes.py` | Trains the probes once on the Studies 1–2 data and serializes them | 6.10.1 |
| `score_tone_probes.py` | Checks the hash of the probe file and scores Study 3 replies | 6.10.1 |
| `study3_prereg_analysis_mock.Rmd` | The complete Study 3 analysis code, run end to end on synthetic data | 3.2, 7–9 |
| `study3_mock_generator.R` | Generates the synthetic data (planted and null effects) used for that run | 3.2 |
| `power_check.R` | Independent recomputation of the power values (its `claimed` column lists the values printed in an earlier draft) | 4.4 |
| `power_check_results.csv` | Results of `power_check.R` | 4.4 |
| `power_supplement.R` | Self-contained simulations behind the rows marked † in the power table and the R4 and profile Bayes factor values | 4.4, 8.9, 8.10 |
| `power_supplement_results.csv` | Results of `power_supplement.R`, with Monte Carlo standard errors | 4.4 |
| `LIVE_VALIDATION_2026-10-16.md` | The automated live validation with synthetic participants (not data) | 4.6 |

SHA-256 hashes of the posted files:

| File | SHA-256 |
|---------------------------------|-------------------------------------------------------------------|
| `tone_probes_frozen.json` | `a455c2b1fa929558f80efafa9050146e7519781bfb9d9861e1c47cf7f9251c59` |
| `MANIFEST.txt` | `841a0d3817f67429bf6870d83d906fbe3f69d7d0075945f7fd8b86bed50d25c1` |
| `freeze_tone_probes.py` | `81a7ef7c21a451a2d46a3edd48bae5a79c925a6d15251e2896c94fe68d7c7c06` |
| `score_tone_probes.py` | `ef69d8ea6fd2c671e9edab25a4aacb99e46d1b598c6a6c4c1c346a23638c4ced` |
| `study3_prereg_analysis_mock.Rmd` | `fc3dccda93fb44424b3c7e156a47d406a3c4e73da8179a3bf8facaa97cb397bb` |
| `study3_mock_generator.R` | `f560332ada47e13253a40a94f80c0cdb81b5049d0a79a3a62728ff044dca0966` |
| `power_check.R` | `954cadbe2a4cd102f8bb0b243748d989dd0699a69181e80157df41a64a5b361a` |
| `power_check_results.csv` | `956923e16ea0892238ab4bb37ff88ac83e1b4504f6b413377f2f48e252159ac4` |
| `power_supplement.R` | `cc3c699eff8059a57275265d7a19df2c99cec189be4ea7e948e71980c694e834` |
| `power_supplement_results.csv` | `9ce9f3438540f37bf9e4dde1a2175759d36bea8d8ded24e0729567c13745c2dd` |
| `LIVE_VALIDATION_2026-10-16.md` | `162dba5dc81b189ce4c4b3e2914b6aead6891a8baa8ed01c9b83d464bb450f36` |