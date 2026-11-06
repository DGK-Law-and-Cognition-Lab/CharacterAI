# Pipeline bug-fix rerun — 2026-09-30 (Study 1 and Study 2)

The same file sits in `Study 1/R/` and `Study 2/R/`. Pre-fix code and outputs are archived in `Study N/_archive/2026-09-30_pre-bugfix/`.

## Procedure
1. The unmodified pipelines were re-rendered in a scratch copy. All point estimates reproduced the existing outputs exactly. Two things did not: bootstrap quantities, which were not reproducible run to run, and the Study 1 `07_cross_modal_correlations.csv`, whose labels were stale on disk.
2. Bugs were fixed in copies of the four Rmds. Every changed line is tagged `# FIX 2026-09-30 (<ID>)`.
3. Each file was adversarially reviewed for correctness and for regressions, over four rounds, until approved.
4. The fixed pipelines were rendered twice. All 108 output CSVs were byte-identical across the two runs.
5. Eight independent lanes verified the outputs by recomputing them from the data rather than from the pipeline code. All passed with no blocking problems.
6. The verified code and outputs were copied into the live folders and checked file by file.

## Fixes
| ID | File | Bug | Effect on outputs |
|---|---|---|---|
| C1 | core | The "verbosity-adjusted" partial η² used Type I SS with condition entered first, so it was not adjusted. | `05_verbosity_adjusted.csv`: `cond_eta2` is now Type II. Added `raw_b`, `raw_eta2` (exact), `pct_change_b`, `n_model`. `pct_change_eta` is exact. `interpretation_v` is descriptive. |
| C2 | core | The moderator battery used raw age (Study 1 includes an entered 1821). Politics code 8 and religiosity code 6 ("prefer not to say") were scored as scale points. | `13_moderators.csv`: only the Age, Politics and Religiosity rows changed. `*_mod` columns were added to the processed data; raw columns are kept. `run_moderator()` now stops on a missing column. |
| C3 | core | TOST `smd` columns held the raw mean difference (TOSTER row 1). | `04b`/`04c`: `smd`/`smd_lo90`/`smd_hi90` now hold Hedges's g(av) and its 90% CI. Added `raw_diff`, `raw_lo90`, `raw_hi90`, `smd_type`, `ci90_within_bounds`. TOST p-values, decisions and evidence classes are unchanged. |
| C4 | core | The confirmation flag was coded BF10 > 3; the stated rule is ≥ 3. | No change, because no BF10 equals 3. |
| C5 | core | Hard-coded or stale narrative and synthesis strings. Examples: the H-Legal direction; Study 2 evidence-class lists left over from Study 1; the Moral Agency matching framing; "null" wording that the TOST × Bayes classes do not support. | `00_key_findings_synthesis.csv` and the HTML are now generated from live objects. |
| I1 | integration | The Study 2 ID join (`012345678` vs `1234567`) silently dropped one HighN participant from every chat, sentiment and cross-modal analysis (N = 142). | All Study 2 NLP tables now use N = 143 (76 HighN). IDs are normalized at every read, with uniqueness and coverage assertions. Study 1 was unaffected. |
| I2 | integration | `welch_d()` exported pooled-SD Cohen's d with a Wald CI, although the paper reports Hedges's g. | `d` columns are now Hedges's g from `effectsize::hedges_g`, the same call the core pipeline uses. `cohens_d*` columns are kept. |
| I3 | integration | Harm Severity and Experience-Taking were missing from the cross-modal matrix, and no n or p was reported. The Study 1 labels were also inconsistent with the downstream consumers. | 07 now has 15 variables, with the published labels restored. New `07b_cross_modal_inference.csv` gives r, n, t, df, p and 95% CI for every pair. |
| I4 | integration | The narrative claimed "does not survive correction" but computed no correction. | Added `q_bh_role` to 06, and `q_bh_question` and `q_bh_all` to 05. |
| I5/I6 | integration | The personality × NLP count was capped by `head(8)`. There were stale and contradictory narrative strings. | The narrative is live. |
| R4-R1 | core | psych::alpha and lavaan bootstraps were not reproducible under `set.seed(42)` because of multicore RNG. | `options(mc.cores = 1)`, `set.seed(42)` before each stochastic call, and lavaan `iseed = 42`. Bootstrap CIs and p moved by ≤ .02. No inference flipped. Outputs are now reproducible. |
| R4-H | integration | 09 stored p rounded to 4 dp while `sig` used the unrounded p. | p is now stored unrounded. |

## What did not change
Exclusions and samples (Study 1 N = 131, 64/67; Study 2 N = 143, 76/67); `03_confirmatory_primary.csv` (all ten outcome tests in both studies); TOST p-values and evidence classes; H-Legal, item-level, subscale and robustness-subsample tables; OE-code Fisher and topic chi-square tables; seed (42); all models and the moderator list.

## Key corrected values
- **Study 1 verbosity (warm bot 106.4 vs cold 96.2 tokens/turn, p < .001).** Adjusted condition effects:
  - PSR: b = 0.43 vs 0.57 raw (−24%), p = .014, q = .136
  - EC: b = 0.35 vs 0.46 (−23%), p = .035, q = .174
  - Trust: b = 0.34 vs 0.40, p = .070
  - Partial η² (Type II): PSR .082 → .047 and EC .061 → .034 (both −43%)
- **Study 2 verbosity.** Bots did not differ in verbosity (p = .23). No outcome is significant either raw or adjusted.
- **Moderators, Study 1.** 6 of 110 at p < .05. The two new ones are Religiosity × Corporate Liability (p = .037) and Age × EC (p = .044).
- **Moderators, Study 2.** 3 of 110 at p < .05. The new one is Politics × Corporate Liability (p = .048).
- **Study 2 NLP at N = 143.** User bonding language g = +0.37, p = .022, q_BH(user family) = .12. Personality × NLP: 16 of 121 correlations at p < .05.

## Known notes (non-blocking; for the manuscript stage)
- The verbosity covariate scores the opening greeting (turn 0, no token usage logged) as characters/4. With API tokens only, conclusions are unchanged (Study 1 PSR p = .011, EC p = .029).
- `pct_change_*` is meaningless when the raw effect is near zero (e.g., Study 1 Moral Patiency). Report absolute changes instead.
- Integration `06c` `pct_change_b` uses (raw − adj)/raw, the opposite sign to core `05` (adj − raw)/raw. This is pre-existing.
- Topic χ² values use Yates' continuity correction (`chisq.test` default), which is not stated in the reports.
- GAAIS composites use the deployed 10/10 item split, not the published 12/8 key.
- Knife-edge TOST results: Study 2 Moral Agency p_max = .0524 (not equivalent) and Study 2 Experience-Taking p_max = .0497 (equivalent).
- Figure axis labels still say "Cohen's d"; the plotted values are Hedges's g. `make_supplement_tables.py` needs caption and column updates (verbosity covariate label; % Δb) before regenerating tables.
- Some HTML narrative text is stale (section cross-references, "three vs four modalities", "Significant interactions get follow-up plots"). It does not affect any CSV.
