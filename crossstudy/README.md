# CrossStudy: analyses that combine Study 1 and Study 2 (exploratory)

## The one file to run

**`cross_study_analyses.Rmd` is the single implementation of every analysis in this folder** (since 2026-09-30). After its setup section (1), it has five analysis sections:
2. the Study × Condition interactions;
3. who is held responsible (liability composites);
4. the identically worded responsibility items `liab_1`, `liab_6` and `liab_9`;
5. individual differences;
6. **exploratory, post hoc: the two-calculation account** (added 2026-10-01; see the section of that name at the end of this file).

Sections 7 ("Files written") and 8 ("Session info") close the report.

It writes the nine core CSVs plus 14 exploratory `twocalc_*.csv` files in `outputs/`, and an HTML report with a plain-language summary. Every number in the summary text is computed when the file renders, not typed in.

Render from R or RStudio:

    rmarkdown::render("<...>/Analysis/CrossStudy/cross_study_analyses.Rmd")

Section 6 reads one measurement file, `measurement/bot_turn_tone_probes.csv`. It is already in the folder; regenerate it only if the Study 1 or Study 2 chat data change, by running the measurement script **before** rendering:

    cd "<...>/Analysis/CrossStudy/measurement"
    python tone_probes.py

The default output folder is `outputs/`. To write elsewhere, pass `params = list(out_dir = "...")`. The tone file location is `params$tone_file` (default: `measurement/bot_turn_tone_probes.csv` in this folder).

The three standalone scripts the Rmd replaces (`cross_study_contrast.R`, `responsibility_items.R`, `individual_differences.R`) are kept only as a record, in `_superseded_scripts/`. The Rmd reproduces their nine output files byte for byte. This was checked on two independent renders, again after the Rmd was placed here, and again after section 6 was added (2026-10-01: all nine core CSVs byte-identical to the pre-section-6 files). The Rmd and HTML as they were before section 6 are kept as `_superseded_scripts/cross_study_analyses_pre_section6_2026-10-01.Rmd` / `.html`.

The sections below describe the methods; they apply unchanged to the Rmd.

## The question

Study 1 manipulated the chatbot's Agreeableness (warm HighA vs cold LowA).
Study 2 manipulated its Neuroticism (anxious HighN vs calm LowN). Each study
reports its own high-vs-low effect. This folder asks a different question:
**is the high-vs-low difference in Study 1 larger or smaller than the
high-vs-low difference in Study 2?** For example, warmth raised parasocial
bonding in Study 1. Did anxiety fail to do so in Study 2, and is that
difference between the two studies itself statistically reliable?

A second, descriptive question uses both studies together: **who do
participants hold most responsible in the liability vignette (the user, the
company, or the chatbot)?** Every participant rated all three, so this is
a within-person comparison.

## The model (Part 1)

For each of the 10 outcomes (psr_total, ec_total, trust_total, et_total,
ma_total, mp_total, liab_corp, liab_chat, liab_user, liab_harm), the two
studies are stacked (N = 131 + 143 = 274) and fit with

    y ~ cond * study            (OLS)

Effect coding:

| variable | +0.5 | -0.5 |
|---|---|---|
| `cond`  | high-trait persona (warm in Study 1, anxious in Study 2) | low-trait persona |
| `study` | Study 1 | Study 2 |

With this coding, the `cond:study` coefficient equals
**(High - Low in Study 1) - (High - Low in Study 2)** in raw scale points
(all outcomes are 1-5). A positive value means the Study 1 manipulation moved
that outcome up more than the Study 2 manipulation did.

Reported for each outcome:

- b, HC3 robust SE, 95% CI, t, df (= 270), p; BH-FDR q across the 10
  interactions; classical-SE p for reference.
- Hedges' g per study (`effectsize::hedges_g(high, low)`, identical to the
  per-study pipeline, so these match `Study X/outputs/R/tables/03_confirmatory_primary.csv`)
  and a z test of g(Study 1) - g(Study 2), with SE = sqrt(V1 + V2),
  V = J^2 [ (n1+n2)/(n1 n2) + d^2 / (2(n1+n2)) ] (Borenstein et al., 2009).
- BF10 for the interaction: `BayesFactor::lmBF(y ~ cond + study + cond:study)`
  divided by `lmBF(y ~ cond + study)`, with cond and study entered as
  two-level factors (default fixed-effect prior, r = "medium"), `set.seed(42)`.
  The Monte Carlo error proportion is reported in `bf_error_prop`.

## Liability levels (Part 2)

Pairs: user vs corp, user vs chat, corp vs chat. For Study 1, Study 2, pooled,
and each of the four study x condition cells: means and SDs of the three
ratings, mean paired difference with 95% CI, paired t, dz (mean difference /
SD of differences), and Holm-adjusted p across the three pairs within each set.

## Caveats

- **Exploratory.** Neither study was designed or preregistered for this
  comparison.
- **Different cohorts.** The samples were collected at different times.
  Participants were randomized to condition within study, not to study.
  Any cohort difference (time of term, recruitment pool drift) is confounded
  with study.
- **Different manipulations.** The two studies vary different traits.
  A Study x Condition interaction shows that the two manipulations had
  different effects. It does not show which feature of the personas caused
  that difference, and it is not a test of "warm vs anxious" as two arms of
  one randomized experiment.
- **Same measures and procedure.** Same instruments and 1-5 response scales,
  same base persona (Sylva), same 10-minute chat, same liability vignette,
  same pipeline for composite scoring. This is what makes the comparison
  interpretable at all.
- Sample note: Study 1 `composite_scores.csv` has N = 131 (64 HighA, 67 LowA).
  The Study 1 CLAUDE.md still says N = 130 (63 HighA); the CSV is the source
  of record here and matches the pipeline's confirmatory table (n_comp = 64).

## Parallel responsibility items (Rmd section 4)

Three liability items use identical wording for each party (1 = Not at all, 3 = Moderately, 5 = Extremely):
- `liab_1`: "To what extent is the company that created Sylva responsible for this outcome?"
- `liab_6`: "To what extent is Sylva itself responsible for this outcome?"
- `liab_9`: "To what extent is the user responsible for this outcome?"

The comparison is run per study:
- paired t tests for user vs company, user vs Sylva, and company vs Sylva;
- dz for each pair;
- Holm correction across the three pairs.

Outputs: `outputs/responsibility_items_tests.csv` and `outputs/responsibility_items_by_condition.csv` (cell means).

## Files

- `cross_study_analyses.Rmd` - the analysis, all sections (Part 1 reads the two `composite_scores.csv` files; absolute paths are defined once in the setup).
- `outputs/cross_study_interactions.csv` - one row per outcome (cell means,
  per-study differences, interaction b/SE/CI/t/df/p/q, classical p, g per
  study with CI, g difference with CI, z, p_z, q for p_z, BF10, BF error).
- `outputs/liability_levels.csv` - Part 2 per study and pooled.
- `outputs/liability_levels_by_condition.csv` - Part 2 per study x condition.

## How to rerun

Render `cross_study_analyses.Rmd` (see the top of this file).

Requires R >= 4.3 with dplyr, sandwich, lmtest, effectsize, BayesFactor.
Last run: R 4.5.2, effectsize 1.0.2, BayesFactor 0.9.12.4.8, sandwich 3.1.1.
Output is identical across reruns (fixed seed).

---

# Individual differences: who bonds, who holds whom responsible (exploratory)

## The question

Setting the persona manipulation aside, which **participant** characteristics
predict bonding, mind perception, liability judgments and how people talk
in the chat? Which of these associations show up in **both** samples?

## When each predictor was measured

Page order, from `buildAll()` in `Study {1,2}/experiment/experiment.js`
(lines 378-395, the same in both studies):

| Before the chat | After the chat (demographics block, after the liability vignette) |
|---|---|
| TIPI-Self (5 traits), GAAIS (positive, negative), PHQ-4 | AI-tool use frequency, free-speech items, prior chatbot experience, social media use, tech comfort, tech trust, politics, religiosity, age, legal knowledge |

The post-chat measures are meant to be stable traits, but they were
collected after the manipulation and after the outcomes. Only the pre-chat
measures are protected from carry-over.

## Predictors

Core (14, the BH family): `tipi_self_extra`, `tipi_self_agree`,
`tipi_self_consc`, `tipi_self_emostab`, `tipi_self_open`, `phq4_total`,
`gaais_pos`, `gaais_neg` (higher = more negative attitudes toward AI),
`d_chatbot_experience` (1-5), `d_ai_freq` (1-5, from `analytic_data.csv`),
`free_speech_avg` (mean of two 1-7 items, higher = more pro-free-speech),
`d_politics_mod` (1 very liberal to 7 very conservative; 8 = prefer not to
say -> NA), `d_religiosity_mod` (1-5; 6 -> NA), `d_age_mod` (NA outside 16-100).

Secondary (reported, no q): `phq4_anx`, `phq4_dep`, `d_tech_trust`,
`d_tech_comfort`, `d_social_media`, `legal_expertise`. The last four were
not in the original spec. They were added because they are the remaining
attitude and experience items in the survey.

## Outcomes

The 10 questionnaire outcomes used throughout, plus two chat behaviors from
the NLP half (`chat_participant_features.parquet`): the share of the
participant's turns coded as emotional self-disclosure
(`pct_emotional_self_disclosure`) and as bonding language
(`pct_bonding_language`).

## The model

Per study, per predictor x outcome, complete cases:

    z(outcome) ~ z(predictor) + cond        cond = +0.5 high-trait, -0.5 low-trait

- `beta` is the standardized slope, adjusted for condition, with 95% CI, t, p and n.
- `partial_r` = t / sqrt(t^2 + df): the predictor-outcome correlation after
  both are residualized on condition. The script checks this against a
  direct computation.
- `p_hc3`: the HC3-robust p, as a robustness check.
- `q_bh`: BH-FDR within the study across the 168 core tests.

Pooled (N = 274): both studies stacked. The outcome and the predictor are
z-scored within study.

    z(outcome) ~ z(predictor) + study + cond_s1 + cond_s2

Each study has its own condition code (`cond_s1` = +/-0.5 in Study 1 and 0
in Study 2, and the reverse for `cond_s2`). BH is applied across the 168
core tests. The heterogeneity test adds `z(predictor) x study` (study coded
+/-0.5): `het_b` = beta(S1) - beta(S2), and `het_p` is its p.

**Replicated** means the same sign and p < .05 in both studies. The
replication table also flags BH survival within each study (`bh_s1`,
`bh_s2`) and in the pooled analysis (`bh_pooled`).

## Data joins

The `sona_id` values in the CSVs keep their leading zeros (`012345678`). The
Study 2 parquet stores them as integers (`1234567`). Leading zeros are
stripped on every side before the join. The script stops unless every
participant joins 1:1 across all three files and the condition labels match.
Study 1 has an older `chat_coding/Chat_Encoding_Claude/` copy of the
features with N = 130. The script uses the top-level file (N = 131).

## Caveats

- This analysis is exploratory and was not preregistered. The core grid
  holds 168 tests per study, so about 8 would reach p < .05 by chance in
  each study.
- The data are correlational. Participants were not assigned to their own
  traits.
- The chat-behavior rates are skewed and have many zeros. Some single-study
  results at p near .05, and the age results, which rest on a few older
  participants (max 45 in Study 1), lose significance under HC3. See `p_hc3`.

## Files

- `cross_study_analyses.Rmd`, section 5: the analysis.
- `outputs/indiv_diff_grid.csv`: per study, every predictor x outcome.
- `outputs/indiv_diff_pooled.csv`: pooled beta, CI, p, q, het_b, het_p.
- `outputs/indiv_diff_replicated.csv`: Study 1, Study 2 and pooled results
  side by side for each predictor x outcome, with replication and BH flags,
  sorted with replicated rows first.
- `outputs/indiv_diff_descriptives.csv`: M, SD, n, missing, min, max for each
  predictor per study, plus its correlation with condition as a
  randomization check.

Rerun: render `cross_study_analyses.Rmd`. It needs dplyr, tidyr, arrow and
sandwich, and its output is deterministic.

---

# Exploratory, post hoc: the two-calculation account (Rmd section 6)

Added 2026-10-01. It ports the October 2026 modeling pilot into the Rmd so that every reported number comes from the notebook.

## Status

- **Exploratory and post hoc.** None of these analyses were preregistered. Study 1 was not preregistered at all. Study 2 was preregistered, but its preregistration does not cover these models. The models were developed after the data were seen.
- **Nothing here is confirmatory.** The primary results remain the unadjusted estimates in sections 2-4, which are themselves exploratory cross-study comparisons. Section 6 only adds post hoc adjustments and descriptions.
- The "two-calculation account" is a **hypothesis the section examines, not a finding**. It proposes (1) a closeness calculation, in which bonding goes with one overall good/bad impression of how Sylva treated the participant, and (2) a separate, fixed responsibility template (user and company held responsible, Sylva much less so).

## Limits on what may be claimed

These limits came from the judges who reviewed the pilot. Any text drawn from section 6 must keep them:

- **No causal or mediation claims.** Adjusting for the impression or for the tone scores is adjustment, not mediation. The impression (G) and the other adjusters were rated after the chat, alongside bonding.
- **Direction is not identified.** The tone scores come from Sylva's replies in a conversation the participant co-produces. In the pilot, what users wrote explained most of the within-condition variation in warmth, and turn-to-turn influence ran in both directions. A warmth-bonding slope is an association, not an effect of Sylva's tone.
- **Warmth cannot be separated from low resistance.** W and R are strongly negatively correlated, and a resistance score predicts the Study 1 bonding effect about as well as warmth does.
- **"Agency gate" and "two forces" are not supported** and should not be used. The Bayes factors for perceived agency predicting Sylva's responsibility are weak (below 3, with or without patiency controlled).
- The cross-study prediction must always be reported with the CI on the predicted-minus-observed gap. That interval is wide, so the match is loose.
- Probe AUCs in `measurement/probe_validation.csv` are a measurement diagnostic from the scoring script, not reported results. Any AUC cited in a paper must be recomputed in the Rmd.

## Measurement: `measurement/tone_probes.py`

**Python is used only for unit-level classifier scores; all statistics are in the Rmd.** The script scores each of Sylva's replies (5,095 bot turns: 131 Study 1 and 143 Study 2 participants). It does no aggregation, no person-level summaries and no tests.

- **W** = expressed warmth and **R** = resistance or disagreement, trained on Study 1's LLM consensus codes. **A** = anxious or aversive affect, trained on Study 2's codes.
- Each probe is a ridge-penalised logistic regression (C = 1.0) on the stored all-mpnet-base-v2 bot-turn embeddings (`Study {1,2}/data/derived/embeddings/`), and it gives each reply a 0-1 score.
- Within the training study, every reply is scored out of fold (GroupKFold(5) by participant, which is deterministic). The other study is scored by the model fit to the whole training study.
- Inputs are read-only: `Study {1,2}/data/derived/chat_turns_long.parquet`, `chat_coding/chat_consensus_wide.parquet` and the embeddings.
- Outputs, written next to the script:
  - `bot_turn_tone_probes.csv`: one row per bot turn, with study, sona_id, turn_idx, W, R, A and n_words. The Rmd reads this file (`params$tone_file`).
  - `probe_validation.csv`: a diagnostic only (see above).
- Run it with `python tone_probes.py [--out-dir DIR]` from `measurement/`, before rendering. It needs numpy, pandas, pyarrow and scikit-learn; it was last run with Python 3.12, numpy 1.26.4, pandas 2.2.2 and scikit-learn 1.5.2. The 2026-10-01 run reproduced the staged files byte for byte.

## What section 6 does

- **6.0** builds a person-level table from the Study 1 and Study 2 data and the tone file. It sets its own seed, so section 6 does not depend on sections 2-5. Sections 2-5 are unaffected by section 6: their nine CSVs stayed byte-identical.
- **6.1 How Sylva treated people.** Gives cell means of W, R, A and reply length, and high-minus-low persona differences (Welch t). This is a check on what participants actually saw.
- **6.2 Closeness.** Refits the section 2 Study x Condition interaction for PSR and EC, adjusting for:
  - the overall impression G (mean of the five TIPI-Bot ratings);
  - G without the manipulated trait;
  - leave-one-trait-out versions of G;
  - text-predicted G (Ghat, out of fold);
  - W and R;
  - placebo post-chat ratings (moral agency, moral patiency, experience-taking, trust).

  Uses HC3 SEs. The Ghat row depends on the fold split, and 20 further splits are reported in `twocalc_ghat_fold_sensitivity.csv`.
- **6.3 Cross-study prediction.** Takes the Study 2 within-condition warmth-to-bonding slope, multiplies it by Study 1's warm-minus-cold gap in W, and compares the result with the observed Study 1 effect. CIs come from a bootstrap with B = 2000 resamples drawn within condition. R is shown as an alternative probe.
- **6.4 Responsibility.** Covers:
  - item means for the 10 party-specific liability items;
  - within-person contrasts on the identically worded items;
  - profile stability across study and condition (lme4 likelihood-ratio tests);
  - correlations among the party intercepts;
  - perceived agency predicting Sylva's responsibility (HC3 and JZS BF10);
  - whether bonding adds to perceived mind (BF01).
- **6.5 Distress and disclosure.** Fits PHQ-4 (total, anxiety, depression) to emotional self-disclosure in the chat, pooled and per study.

Point estimates reproduce the pilot exactly. Resampling-based limits (bootstrap CIs, the Ghat fold split) use R's random draws, so they differ from the pilot by a few hundredths. The Rmd documents this.

## New outputs (`outputs/twocalc_*.csv`, 14 files)

| file | contents |
|---|---|
| `twocalc_tone_by_cell.csv` | W, R, A, reply length by study x condition cell (6.1) |
| `twocalc_tone_condition_diffs.csv` | high - low persona differences in tone, Welch t (6.1) |
| `twocalc_interaction_adjusted.csv` | PSR/EC interaction, unadjusted and under each adjuster (6.2) |
| `twocalc_text_impression_fit.csv` | out-of-fold R^2 of text-predicted G (6.2) |
| `twocalc_ghat_fold_sensitivity.csv` | Ghat-adjusted interaction across 20 further fold splits (6.2) |
| `twocalc_crossstudy_prediction.csv` | predicted vs observed Study 1 effect, with the gap CI (6.3) |
| `twocalc_liability_item_means.csv` | 10 liability item means by cell (6.4) |
| `twocalc_identical_items.csv` | identically worded items: party means and paired dz (6.4) |
| `twocalc_profile_tests.csv` | profile-stability likelihood-ratio tests (6.4) |
| `twocalc_party_correlations.csv` | correlations among party blame (6.4) |
| `twocalc_agency_paths.csv` | agency -> Sylva responsibility; bonding -> agency (6.4) |
| `twocalc_bonding_increment.csv` | bonding beyond perceived mind, BF01 (6.4) |
| `twocalc_phq4_descriptives.csv` | PHQ-4 subscale descriptives and r(anx, dep) (6.5) |
| `twocalc_distress_disclosure.csv` | distress -> emotional self-disclosure models (6.5) |

Section 6 also needs `lme4` in addition to the packages listed above. The Rmd's section 7 lists every output with its size and md5.

---

# Conversation dynamics: how the chats moved, and how that went with the end ratings (`conversation_dynamics.Rmd`)

Added 2026-10-02, after the talk, in response to requests to see "the movement in the conversation" and how it related to participants' ratings. It is a **separate notebook**. It does not touch `cross_study_analyses.Rmd` or `outputs/`. Those files were checked before and after it was added, and they are byte-identical.

## The key limit

In Studies 1 and 2 the ratings (bonding, trust, mind perception, responsibility) were collected **once, after the chat**. These analyses show:
- how the **conversations** changed over the 10 minutes;
- how conversation features relate to the **end** ratings.

They **cannot** show how ratings changed during the chat. Study 3's in-chat closeness probes are designed for that.

## Status

- **Exploratory and correlational.** None of this was preregistered.
- The conversation is co-produced, and the ratings come after it. **No association here is causal or directional.**
- **Privacy.** The message text column is never loaded. All outputs are summary statistics, and no message is quoted.

## Inputs (read only)

- `Study {1,2}/data/derived/chat_turns_long.parquet` (role, turn, words, elapsed time; `elapsed_ms` is in **seconds**, maximum < 600)
- `chat_coding/chat_consensus_wide.parquet` (LLM-consensus codes per message)
- `measurement/bot_turn_tone_probes.csv` (W, R, A per Sylva reply; `params$tone_file`)
- `data/processed/composite_scores.csv` (end ratings)

`sona_id` values have their leading zeros stripped on every side before joining. The notebook stops unless every turn, code, probe score and rating joins.

## What it does

**Section 3: how the conversations moved.**
- Each message is placed in one of five 2-minute blocks of clock time (0-2 ... 8-10 min).
- Block means: participant means within each block, then cell means with t-based 95% CIs.
- Change: a per-participant OLS slope on elapsed time, scaled to the fitted change from minute 0 to minute 10. This is tested against 0 within each cell (one-sample t, dz), and between the two personas within each study (Welch t).
- BH-FDR is applied across all change tests.
- Measures:
  - Sylva: W, R, A, and words per reply. Also the manipulated-trait codes: warmth and resistance in Study 1, anxiety and calm in Study 2. Also mirroring of the user's emotion.
  - Participants: emotional self-disclosure, bonding language, challenging Sylva, and words per message.
- The earlier F13 talk figure split conversations into halves by turn count. This notebook uses clock time; the two splits answer the same question.

**Section 4: conversation features and end ratings.** The 9 ratings are psr, ec, trust, ma, mp, liab_corp, liab_chat, liab_user and liab_harm. The models follow section 5 of `cross_study_analyses.Rmd`: z within study, condition-adjusted, per study and pooled (study plus per-study condition codes). "Replicated" means the same sign and p < .05 in both studies. HC3 p values are reported alongside, and BH is applied within each family x sample. There are three families:
- **Level:** whole-chat mean of the feature.
- **Movement:** change over the chat, adjusted for the feature's level.
- **Start vs end:** first third (min 0-3.3) and last third (min 6.7-10) entered together. The last-minus-first difference is tested with an HC3 contrast.

## Outputs (`outputs_dynamics/`)

| file | contents |
|---|---|
| `dyn_block_means.csv` | every measure x cell x 2-min block: mean, 95% CI, n |
| `dyn_trajectory_tests.csv` | change from minute 0 to 10 within cell, and high-minus-low difference in change; t, p, BH q, dz, % of conversations that declined |
| `dyn_feature_rating_assoc.csv` | level, movement and start-vs-end associations with the 9 ratings, per study and pooled; beta, CI, p, HC3 p, q, replicated |
| `fig_dyn1_sylva_tone` (.png/.svg) | Sylva's W, R, A over the chat, four personas |
| `fig_dyn2_trait_expression` | % of replies coded warm / resistant (Study 1) and anxious / calm (Study 2) over the chat |
| `fig_dyn3_participant_behavior` | participants' emotional self-disclosure, bonding language and challenging Sylva over the chat |
| `fig_dyn4_features_ratings_grid` | pooled feature x rating grid (level and change rows) |
| `fig_dyn5_start_vs_end` | first-third vs last-third associations with bond, connection, trust and Sylva's liability (pooled) |

Figure style (talk-ready, grayscale, 16 pt+ labels):
- Study 1 is black circles; Study 2 is gray squares.
- The high-trait persona has a dark `#404040` fill and a solid line.
- The low-trait persona has a light `#C4C4C4` fill with an outline and a dashed line.

## How to rerun

    rmarkdown::render("<...>/Analysis/CrossStudy/conversation_dynamics.Rmd")

`params$out_dir` defaults to `outputs_dynamics/`.

Packages: dplyr, tidyr, arrow, sandwich, ggplot2, knitr, ragg, svglite (R 4.5.2).

The notebook is deterministic. Its first render in place (2026-10-02) reproduced all 13 staged outputs byte for byte (CSVs, PNGs and SVGs).

## Caveats

- Ratings were measured once, after the chat.
- Sylva's tone and the participant's messages move together, so a change in Sylva's tone may reflect what participants wrote, the persona prompt's hold weakening as the context grows, or both.
- Codes and probes are automated measures.
- Per-person block means rest on few messages.
- Emotional self-disclosure rises and then falls, so a straight-line change summarizes it poorly. See the block means.
- Bonding language and challenging Sylva are rare in some cells.
- The R probe was trained on Study 1, and R is low in Study 2. The pooled R-with-liability association comes mainly from Study 2 (see the per-study rows).
