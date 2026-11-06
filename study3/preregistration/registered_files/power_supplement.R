# =============================================================================
# power_supplement.R
# Study 3 preregistration (Study3_Preregistration_FINAL.md): simulated power and
# operating-characteristic values that power_check.R does not compute.
#
# Purpose. Recomputes, with seed 42 and from the Studies 1-2 analytic files
# (numeric columns only; no chat or open-ended text is read) plus the
# cross-study tone-probe scores, every simulated power / operating-
# characteristic value printed in FINAL that power_check.R does not compute:
# the rows marked with a dagger in Section 4.4, the H2 step 4b values, the R4
# value under the registered specification (power_check.R's R4 block uses the
# revision-2 specification), the R2c profile Bayes factor statements of
# Section 8.10, and the two small Section 4.4 rows power_check.R leaves out.
# For each value it records the number of simulations / resamples, the
# estimate, its Monte Carlo SE, and whether it agrees with the printed value:
# |difference| <= 2 MC SE or <= .02, where for a printed range or bound the
# difference is the distance outside it. Rows whose printed value is "-" are
# extra operating characteristics reported for information (agrees = NA).
#
# Blocks, and the FINAL row or sentence each backs
#   0  Setup, data, planning values. Studies 1-2 pooled within-cell SDs,
#      correlations and slopes; Section 6.15 definitions (G_halo, G_halo_E =
#      mean(tipi_bot_3, 8-tipi_bot_8, 8-tipi_bot_4, 8-tipi_bot_10), ma_cap =
#      mean(ma_1-ma_4, ma_6, ma_7), B = z(mean(z(PSR), z(EC), z(Trust)))).
#   1  Section 2.3 / 4.4 row "H2 (estimation)": two-sided power of the E effect
#      at d = .14 / .17 / .21 (HC3 test in the 2 x 2 model); 20,000 sims each.
#   2  Section 4.4 row "P(p < .05 and BF10 >= 3 | d = 0.40)" (Change 24):
#      d_A = d_E = .40; marginal ttestBF (exact BF from the t statistic, 20,000
#      sims) and the registered model-based lmBF (1,000 sims; lmBF iterations
#      10,000 instead of the registered 100,000, for runtime).
#   3  Section 4.4 rows "H2 model comparison, D rule" and "Impression-version
#      falsifier" (dagger); Sections 7.2 step 4 and 0.5. (PSR, W, G_halo) drawn
#      within cell from the Studies 1-2 within-cell SDs and correlations;
#      Delta W_E = 0; Delta G_E = 1.25 x the halo slope (.366), .40, .60;
#      impression world: E shifts PSR by b_G x Delta G_E; tone world: no E
#      effect on PSR. 2,000 sims x 1,999 within-cell bootstrap resamples per
#      world and Delta G_E (registered analysis: 5,000 resamples).
#   4  Section 4.4 row "H2 fixed-prediction comparison (step 4b)"; Section 7.2
#      step 4b. Normal approximation (SE_E from the Studies 1-2 PSR SD) and
#      20,000 sims per true b_E with the HC3 SE estimated in each dataset.
#   5  Section 4.4 row "H5" (dagger); Section 8.7. Item-level within-cell
#      covariance of the 10 keyed TIPI-Bot items and their within-cell slopes on
#      perceived extraversion; perceived-E shift 1.0 / 1.25 / 1.5 points;
#      2,000 sims x 1,999 within-cell bootstrap resamples per shift. Pooled
#      ratio with G_halo_E, with the full G_halo, and all four trait ratios.
#   6  Section 4.4 rows "R2c / R2d" (dagger); Section 8.10. Within-cell
#      correlations of Chatbot Responsibility, User Responsibility and Harm
#      Severity (R2c), and of liab_1 / liab_6 / liab_9 as proxies for the
#      vignette-2 company / Sylva / user composites with gap = company - Sylva
#      (R2d; no vignette-2 data exist). 20,000 sims with the BF computed
#      exactly from the marginal t (ttestBF, r = .707, which the registered
#      model-based BF equals up to Monte Carlo error when the other factor has
#      no effect); check: 300 null datasets with the registered lmBF
#      (iterations 2,000).
#   7  Section 8.10 profile Bayes factor sentence: 12 items x 272 participants,
#      person and residual SDs from the Studies 1-2 liability items; A effect on
#      3 of 12 items of 0.35 / 0.40 / 0.50 / 0.60 / 0.70 points; 300 sims per
#      effect (lmBF iterations 1,000 instead of 100,000, for runtime).
#   8  Section 4.4 row "R4"; Section 8.9 registered specification: outcome
#      z(liab_6); A + E + A:E (factors) + z(ma_cap) + z(MP) [+ z(PSR) + z(EC) +
#      z(Trust)]; rscaleFixed = .5, rscaleCont = "medium"; decision BF01 > 3
#      supported, contradicted if BF10 > 3 or beta_B >= .25. 500 resamples of
#      Studies 1-2, 68 per cell from each of the four Studies 1-2 cells (cells
#      play the role of the 2 x 2), lmBF iterations 10,000.
#   9  Writes power_supplement_results.csv next to this script's output folder.
#
# Run (from any directory):
#   STUDY3_LAB_ROOT="<lab root folder>" Rscript power_supplement.R
# where the lab root is the folder that contains "Analysis" and "Docs".
# Optional: STUDY3_CORES = number of worker processes for the lmBF blocks
# (default min(8, cores - 2); results do not depend on it, because every
# parallel replicate sets its own seed drawn from seed 42). STUDY3_QUICK=1 runs
# a small smoke test and writes its CSV to tempdir() only.
# Output: Docs/Preregistration/Study3_Prereg_Review_2026-10-16/
#         power_supplement_results.csv
# Runtime: 26.9 minutes in the reference run (8 worker processes, 12-core
#   Apple-silicon laptop that was also running other jobs); block 7 (profile
#   BF, about 20 minutes) and block 8 (R4, about 5 minutes) dominate.
# Packages (CRAN): BayesFactor, MASS, parallel (base); sandwich and lmtest are
#   used only for a self-check and pwr only for an analytic reference value in
#   block 1, each if installed. Reference run: R 4.5.2, BayesFactor 0.9.12-4.8.
# =============================================================================

suppressPackageStartupMessages({
  library(BayesFactor); library(MASS); library(parallel)
})
T_START <- Sys.time()
SEED <- 42

# ---- paths (lab root from the environment; no absolute paths in this file) ---
LAB <- Sys.getenv("STUDY3_LAB_ROOT", unset = "")
if (!nzchar(LAB))
  stop("The environment variable STUDY3_LAB_ROOT is not set. Set it to the lab root folder ",
       "(the folder that contains 'Analysis' and 'Docs'), e.g.\n",
       "  STUDY3_LAB_ROOT=\"<lab root folder>\" Rscript power_supplement.R", call. = FALSE)
ANA <- file.path(LAB, "Analysis")
if (!dir.exists(ANA))
  stop("STUDY3_LAB_ROOT does not contain an 'Analysis' folder; check the value of STUDY3_LAB_ROOT.", call. = FALSE)
QUICK <- identical(Sys.getenv("STUDY3_QUICK"), "1")
OUT_DIR <- if (QUICK) tempdir() else file.path(LAB, "Docs", "Preregistration", "Study3_Prereg_Review_2026-10-16")
if (!dir.exists(OUT_DIR)) stop("Output folder not found under STUDY3_LAB_ROOT: Docs/Preregistration/Study3_Prereg_Review_2026-10-16", call. = FALSE)
NCORES <- suppressWarnings(as.integer(Sys.getenv("STUDY3_CORES", "")))
if (is.na(NCORES) || NCORES < 1) NCORES <- max(1L, min(8L, detectCores() - 2L))
if (.Platform$OS.type == "windows") NCORES <- 1L
Q <- function(full, quick) if (QUICK) quick else full
cat(sprintf("power_supplement.R | seed %d | worker processes %d%s\n", SEED, NCORES, if (QUICK) " | QUICK smoke test" else ""))

# ---- Study 3 design -----------------------------------------------------------
n_cell <- 68L; N <- 4L * n_cell; n_side <- 2L * n_cell
cellA  <- rep(c(-.5, .5, -.5, .5), each = n_cell)      # cells: 1 (A-,E-), 2 (A+,E-), 3 (A-,E+), 4 (A+,E+)
cellE  <- rep(c(-.5, -.5, .5, .5), each = n_cell)
cellid <- rep(1:4, each = n_cell)

# ---- helpers ---------------------------------------------------------------
pse <- function(p, n) sqrt(p * (1 - p) / n)               # MC SE of a proportion
blk <- function(title) { cat(sprintf("\n==== %s  [%.1f min elapsed] ====\n", title,
                                     as.numeric(difftime(Sys.time(), T_START, units = "mins")))) }

# Cell means and variances for many simulated datasets at once (Y: N x S, rows ordered by cell)
cell_moments <- function(Y) {
  Y <- as.matrix(Y); m <- v <- matrix(NA_real_, ncol(Y), 4)
  for (k in 1:4) { Yc <- Y[cellid == k, , drop = FALSE]; m[, k] <- colMeans(Yc)
                   v[, k] <- (colSums(Yc^2) - n_cell * m[, k]^2) / (n_cell - 1) }
  list(m = m, v = v)
}
# HC3 test of a main-effect coefficient of lm(y ~ A * E) in the balanced 2 x 2 (saturated cell-means
# model: hat values 1/n, so Var_HC3(cell mean) = s_c^2 / (n - 1)); t on the residual df N - 4 (Section 7.1)
hc3_main <- function(cm, factor) {
  m <- cm$m
  b <- if (factor == "A") (m[, 2] + m[, 4] - m[, 1] - m[, 3]) / 2 else (m[, 3] + m[, 4] - m[, 1] - m[, 2]) / 2
  se <- sqrt(rowSums(cm$v) / (n_cell - 1) / 4)
  list(b = b, se = se, p = 2 * pt(-abs(b / se), N - 4), lo = b - qt(.975, N - 4) * se)
}
# Pooled-variance (Student) t on the marginal groups of a factor: the statistic ttestBF uses
student_t_marg <- function(cm, factor) {
  m <- cm$m; v <- cm$v
  hi <- if (factor == "A") c(2, 4) else c(3, 4); lo <- setdiff(1:4, hi)
  grp <- function(ix) { mu <- rowMeans(m[, ix, drop = FALSE])
    ss <- rowSums((n_cell - 1) * v[, ix, drop = FALSE]) + n_cell * rowSums((m[, ix, drop = FALSE] - mu)^2)
    list(mu = mu, var = ss / (n_side - 1)) }
  h <- grp(hi); l <- grp(lo)
  (h$mu - l$mu) / sqrt((h$var + l$var) / 2 * 2 / n_side)
}
# Registered model-based BF10 for a main effect (Section 7.1): lmBF(y ~ A + E + A:E) / lmBF(y ~ E + A:E)
bf_main <- function(y, factor, iterations) {
  dat <- data.frame(y = y, Af = factor(cellA), Ef = factor(cellE))
  full <- lmBF(y ~ Af + Ef + Af:Ef, data = dat, rscaleFixed = .5, iterations = iterations, progress = FALSE)
  red  <- if (factor == "A") lmBF(y ~ Ef + Af:Ef, data = dat, rscaleFixed = .5, iterations = iterations, progress = FALSE) else
                             lmBF(y ~ Af + Af:Ef, data = dat, rscaleFixed = .5, iterations = iterations, progress = FALSE)
  exp(full@bayesFactor$bf - red@bayesFactor$bf)
}
# Parallel map with per-replicate seeds (results do not depend on the number of workers)
pmap <- function(X, FUN) {
  res <- if (NCORES > 1) mclapply(X, FUN, mc.cores = NCORES, mc.preschedule = TRUE) else lapply(X, FUN)
  bad <- vapply(res, function(r) inherits(r, "try-error") || is.null(r), logical(1))
  if (any(bad)) stop("A parallel replicate failed: ", paste(as.character(res[[which(bad)[1]]]), collapse = " "))
  res
}
rep_seeds <- function(n) { set.seed(SEED); sample.int(.Machine$integer.max, n) }
# Within-cell nonparametric bootstrap as multinomial weights: list of four 68 x B count matrices
p_cell <- rep(1 / n_cell, n_cell)
boot_weights <- function(B) lapply(1:4, function(k) rmultinom(B, n_cell, p_cell))

# ---- results ledger -------------------------------------------------------
LED <- data.frame()
add_row <- function(id, section, quantity, printed, est, n, se, lo = NA, hi = NA) {
  dif <- if (is.na(lo) && is.na(hi)) NA_real_ else if (est < lo) lo - est else if (est > hi) est - hi else 0
  agr <- if (is.na(dif)) NA else dif <= max(2 * se, .02) + 1e-9
  LED <<- rbind(LED, data.frame(id = id, prereg_section = section, quantity = quantity, value_in_prereg = printed,
                                recomputed = round(est, 3), n_sims = n, mc_se = round(se, 4), agrees = agr,
                                stringsAsFactors = FALSE))
  cat(sprintf("[%-16s] %-74s printed %-22s recomputed %7.3f (n = %d, MC SE %.4f) %s\n", id, substr(quantity, 1, 74),
              printed, est, as.integer(n), se, if (is.na(agr)) "" else if (agr) "agrees" else "DISAGREES"))
}

# =============================================================================
# 0. Data and planning values (Studies 1-2; numeric columns only)
# =============================================================================
blk("0. Data and planning values")
num_cols <- c("psr_total", "ec_total", "trust_total", "mp_total", paste0("ma_", 1:8), paste0("liab_", 1:12),
              "liab_chat", "liab_user", "liab_harm", paste0("tipi_bot_", 1:10),
              "tipi_bot_extra", "tipi_bot_agree", "tipi_bot_consc", "tipi_bot_emostab", "tipi_bot_open")
read_numeric <- function(study) {
  rel <- file.path("Analysis", study, "data", "processed", "analytic_data.csv"); f <- file.path(LAB, rel)
  if (!file.exists(f)) stop("Missing file under STUDY3_LAB_ROOT: ", rel, call. = FALSE)
  hdr <- scan(f, what = "", sep = ",", nlines = 1, quiet = TRUE)
  need <- c("condition_label", "sona_id", num_cols); miss <- setdiff(need, hdr)
  if (length(miss)) stop(rel, " lacks columns: ", paste(miss, collapse = ", "), call. = FALSE)
  cc <- rep("NULL", length(hdr)); cc[hdr %in% num_cols] <- "numeric"     # every other column is skipped
  cc[hdr %in% c("condition_label", "sona_id")] <- "character"
  read.csv(f, colClasses = cc, check.names = FALSE)[, need]
}
s1 <- read_numeric("Study 1"); s2 <- read_numeric("Study 2")
s1$study <- 1L; s2$study <- 2L
s1$high <- as.integer(s1$condition_label == "HighA"); s2$high <- as.integer(s2$condition_label == "HighN")
stopifnot(all(s1$condition_label %in% c("HighA", "LowA")), all(s2$condition_label %in% c("HighN", "LowN")))
d <- rbind(s1, s2)
stopifnot(!anyNA(d[, num_cols]))
d$cell     <- factor(paste0("S", d$study, "_", d$high))
d$ma_cap   <- rowMeans(d[, paste0("ma_", c(1:4, 6, 7))])                                  # Section 6.15
d$G_halo   <- (d$tipi_bot_consc + d$tipi_bot_emostab + d$tipi_bot_open) / 3                # Section 6.15
d$G_halo_E <- (d$tipi_bot_3 + (8 - d$tipi_bot_8) + (8 - d$tipi_bot_4) + (8 - d$tipi_bot_10)) / 4   # Section 6.15
stopifnot(max(abs(d$tipi_bot_consc - (d$tipi_bot_3 + 8 - d$tipi_bot_8) / 2)) < 1e-8)
cat(sprintf("Studies 1-2: N = %d (Study 1 %d, Study 2 %d); cells: %s\n", nrow(d), nrow(s1), nrow(s2),
            paste(names(table(d$cell)), table(d$cell), sep = " = ", collapse = ", ")))

wres      <- function(y, g) y - ave(y, g)                                   # within-cell residual
pooled_sd <- function(y, g) sqrt(sum(wres(y, g)^2) / (length(y) - nlevels(factor(g))))
SD_PSR  <- pooled_sd(d$psr_total, d$cell)
SD_G    <- pooled_sd(d$G_halo, d$cell)
R_G_PSR <- cor(wres(d$G_halo, d$cell), wres(d$psr_total, d$cell))
B_G     <- unname(coef(lm(psr_total ~ G_halo + cell, data = d))["G_halo"])

# Frozen-probe warmth W: participant mean over bot turns (cross-study tone file: numeric scores only)
tone <- read.csv(file.path(ANA, "CrossStudy", "measurement", "bot_turn_tone_probes.csv"),
                 colClasses = c(sona_id = "character"))[, c("study", "sona_id", "W")]
norm_id <- function(x) sub("^0+(?=.)", "", trimws(as.character(x)), perl = TRUE)
tone$id <- norm_id(tone$sona_id); d$id <- norm_id(d$sona_id)
tp <- aggregate(W ~ study + id, data = tone[, c("study", "id", "W")], FUN = mean)
dW <- merge(d[, c("study", "id", "cell", "psr_total", "G_halo")], tp, by = c("study", "id"))
SD_W <- pooled_sd(dW$W, dW$cell)
R_WG <- cor(wres(dW$W, dW$cell), wres(dW$G_halo, dW$cell))
R_WP <- cor(wres(dW$W, dW$cell), wres(dW$psr_total, dW$cell))
B_W  <- unname(coef(lm(psr_total ~ W + cell, data = dW))["W"])

# Halo slopes: within-cell slope of each perceived trait on perceived extraversion
halo <- sapply(c(A = "tipi_bot_agree", C = "tipi_bot_consc", ES = "tipi_bot_emostab", O = "tipi_bot_open",
                 G = "G_halo", GE = "G_halo_E"),
               function(v) unname(coef(lm(d[[v]] ~ d$tipi_bot_extra + d$cell))[2]))
per_pt_halo <- mean(halo[c("C", "ES", "O")])
cat(sprintf("PSR within-cell SD %.3f | G_halo SD %.3f, r(G_halo, PSR) %.3f, b_G %.3f | W: n = %d, SD %.3f, r(W, G_halo) %.3f, r(W, PSR) %.3f, b_W %.3f\n",
            SD_PSR, SD_G, R_G_PSR, B_G, nrow(dW), SD_W, R_WG, R_WP, B_W))
cat(sprintf("Halo slopes per point of perceived E: A %.3f, C %.3f, ES %.3f, O %.3f; G_halo %.3f (mean of C, ES, O %.3f); G_halo_E %.3f\n",
            halo["A"], halo["C"], halo["ES"], halo["O"], halo["G"], per_pt_halo, halo["GE"]))
cat(sprintf("Impression-version E effect on PSR (b_G x halo x 1.0-1.5 points): %.3f to %.3f PSR units\n",
            B_G * per_pt_halo, 1.5 * B_G * per_pt_halo))
add_row("H5_pred_GE", "2.4; 8.7", "H5 predicted pooled ratio with G_halo_E (S1-2 within-cell slope; planning value)",
        "~ .30", halo["GE"], 0, 0, .295, .305)

# Self-checks of the closed-form HC3 test and the marginal Student t (if sandwich and lmtest are installed)
if (requireNamespace("sandwich", quietly = TRUE) && requireNamespace("lmtest", quietly = TRUE)) local({
  set.seed(1); y <- .3 * cellA + .2 * cellE + rnorm(N) * (1 + .3 * (cellid == 2)); f <- lm(y ~ cellA * cellE)
  ref <- lmtest::coeftest(f, vcov = sandwich::vcovHC(f, type = "HC3"))
  cm <- cell_moments(matrix(y)); hA <- hc3_main(cm, "A"); hE <- hc3_main(cm, "E")
  stopifnot(abs(hA$se - ref["cellA", 2]) < 1e-10, abs(hE$p - ref["cellE", 4]) < 1e-10,
            abs(student_t_marg(cm, "A") - unname(t.test(y[cellA > 0], y[cellA < 0], var.equal = TRUE)$statistic)) < 1e-10)
  cat("Self-check passed: closed-form HC3 equals sandwich::vcovHC(type = 'HC3'); marginal t equals t.test(var.equal = TRUE)\n")
})

# BF10 thresholds for ttestBF (n = 136 per side, rscale = sqrt(2)/2): BF10 is monotone in |t|
bf_t <- function(t) unname(ttest.tstat(t, n_side, n_side, rscale = sqrt(2) / 2, simple = TRUE))
t3   <- uniroot(function(t) bf_t(t) - 3, c(1, 6), tol = 1e-10)$root
tlow <- uniroot(function(t) bf_t(t) - 1 / 3, c(0, 3), tol = 1e-10)$root
cat(sprintf("ttestBF thresholds: BF10 = 3 at |t| = %.4f; BF10 = 1/3 at |t| = %.4f (two-sided critical t = %.4f)\n",
            t3, tlow, qt(.975, N - 4)))

# =============================================================================
# 1. H2 total effect: two-sided power at d = .14 / .17 / .21 (Sections 2.3, 4.4)
# =============================================================================
blk("1. H2 total-effect power (HC3 test of E)")
set.seed(SEED)
NS1 <- Q(20000, 2000)
for (x in list(c(.14, .21), c(.17, .29), c(.21, .41))) {
  Y <- x[1] * cellE + matrix(rnorm(N * NS1), N)
  pw <- mean(hc3_main(cell_moments(Y), "E")$p < .05)
  an <- if (requireNamespace("pwr", quietly = TRUE)) pwr::pwr.t.test(n = n_side, d = x[1])$power else NA
  add_row(sprintf("H2pow_d%02d", round(100 * x[1])), "2.3; 4.4",
          sprintf("H2 two-sided power of E on PSR, d = %.2f (HC3, alpha .05; analytic pwr.t.test %.3f)", x[1], an),
          sprintf("%.2f", x[2]), pw, NS1, pse(pw, NS1), x[2], x[2])
}

# =============================================================================
# 2. P(b > 0, p < .05 and BF10 >= 3 | d_A = d_E = .40) (Section 4.4; Change 24)
# =============================================================================
blk("2. Joint criterion p < .05 and BF10 >= 3")
set.seed(SEED)
NS2m <- Q(20000, 2000)
Y <- .40 * cellA + .40 * cellE + matrix(rnorm(N * NS2m), N); cm <- cell_moments(Y)
hA <- hc3_main(cm, "A"); tm <- student_t_marg(cm, "A")
jm <- mean(hA$b > 0 & hA$p < .05 & abs(tm) >= t3)
cat(sprintf("  marginal: P(BF10 >= 3) = %.4f; P(BF10 >= 3 and p >= .05) = %.4f\n", mean(abs(tm) >= t3), mean(abs(tm) >= t3 & hA$p >= .05)))
add_row("JOINT_marg", "4.4; Change 24", "P(b>0, p<.05 and BF10>=3 | dA = dE = .40), marginal ttestBF (exact BF from t)",
        ".746", jm, NS2m, pse(jm, NS2m), .746, .746)
NS2 <- Q(1000, 40); sd2 <- rep_seeds(NS2)
r2 <- do.call(rbind, pmap(seq_len(NS2), function(i) {
  set.seed(sd2[i]); y <- .40 * cellA + .40 * cellE + rnorm(N); h <- hc3_main(cell_moments(matrix(y)), "A")
  c(b = h$b, p = h$p, bf = tryCatch(bf_main(y, "A", 10000), error = function(e) NA_real_)) }))
ok2 <- !is.na(r2[, "bf"]); r2 <- r2[ok2, , drop = FALSE]
jmb <- mean(r2[, "b"] > 0 & r2[, "p"] < .05 & r2[, "bf"] >= 3)
cat(sprintf("  model-based: P(BF10 >= 3) = %.4f; P(BF10 >= 3 and p >= .05) = %.4f; failed lmBF = %d\n",
            mean(r2[, "bf"] >= 3), mean(r2[, "bf"] >= 3 & r2[, "p"] >= .05), sum(!ok2)))
add_row("JOINT_model", "4.4; Change 24", "P(b>0, p<.05 and BF10>=3 | dA = dE = .40), registered model-based lmBF (10,000 iter.)",
        ".766", jmb, nrow(r2), pse(jmb, nrow(r2)), .766, .766)

# =============================================================================
# 3. H2 step 4 D rule and the Section 0.5 c'_G falsifier (dagger rows)
# =============================================================================
blk("3. H2 D rule (step 4) and c'_G falsifier")
Sig3 <- diag(c(SD_PSR, SD_W, SD_G)) %*% matrix(c(1, R_WP, R_G_PSR, R_WP, 1, R_WG, R_G_PSR, R_WG, 1), 3) %*%
        diag(c(SD_PSR, SD_W, SD_G))
# Bootstrap statistics for Y = (PSR, W, G_halo): b_E on each, within-cell slopes b_W and b_G (the slopes of
# lm(PSR ~ A * E + W) and lm(PSR ~ A * E + G_halo)), c'_G = b_E - b_G * dG_E, c'_W = b_E - b_W * dW_E, D = |c'_G| - |c'_W|
h2_boot <- function(Y, Wl) {
  B <- ncol(Wl[[1]]); P <- cbind(Y, Y[, 1] * Y[, 2], Y[, 1] * Y[, 3], Y[, 2]^2, Y[, 3]^2)
  M <- array(NA_real_, c(B, 7, 4))
  for (k in 1:4) M[, , k] <- crossprod(Wl[[k]], P[cellid == k, , drop = FALSE]) / n_cell
  bE  <- (M[, 1:3, 3, drop = FALSE] + M[, 1:3, 4, drop = FALSE] - M[, 1:3, 1, drop = FALSE] - M[, 1:3, 2, drop = FALSE]) / 2
  bE  <- matrix(bE, B, 3)
  css <- function(j, a, b) rowSums(matrix(n_cell * (M[, j, ] - M[, a, ] * M[, b, ]), B))   # within-cell cross-products
  bW  <- css(4, 1, 2) / css(6, 2, 2); bG <- css(5, 1, 3) / css(7, 3, 3)
  cG  <- bE[, 1] - bG * bE[, 3]; cW <- bE[, 1] - bW * bE[, 2]
  cbind(D = abs(cG) - abs(cW), cG = cG)
}
local({ # check h2_boot against lm() on one dataset (identity weights)
  set.seed(2); Y <- mvrnorm(N, c(0, 0, 0), Sig3) + cbind(.2 * (cellE + .5), 0, .4 * (cellE + .5))
  r <- h2_boot(Y, lapply(1:4, function(k) matrix(1, n_cell, 1)))
  cG <- coef(lm(Y[, 1] ~ cellA * cellE + Y[, 3]))[3]; cW <- coef(lm(Y[, 1] ~ cellA * cellE + Y[, 2]))[3]
  stopifnot(abs(r[1, "cG"] - cG) < 1e-10, abs(r[1, "D"] - (abs(cG) - abs(cW))) < 1e-10)
  cat("Self-check passed: bootstrap statistics equal the c'_G and D of lm(PSR ~ A * E + G_halo) and lm(PSR ~ A * E + W)\n")
})
NS3 <- Q(2000, 100); B3 <- Q(1999, 499)
DG  <- c(round(1.25 * per_pt_halo, 3), .40, .60)
res3 <- list()
for (world in c("IMP", "TONE")) for (dg in DG) {
  set.seed(SEED)
  out <- t(vapply(seq_len(NS3), function(s) {
    Y <- mvrnorm(N, c(0, 0, 0), Sig3) +
         cbind(3 + .50 * cellA + (if (world == "IMP") B_G * dg * (cellE + .5) else 0),
               .40 + .28 * cellA,                                     # Delta W_E = 0 in both worlds
               4.5 + .80 * cellA + dg * (cellE + .5))
    bs <- h2_boot(Y, boot_weights(B3))
    qD <- quantile(bs[, "D"], c(.025, .975), names = FALSE); qC <- quantile(bs[, "cG"], c(.025, .975), names = FALSE)
    gE <- hc3_main(cell_moments(Y[, 3, drop = FALSE]), "E")
    c(imp = qD[2] < 0, tone = qD[1] > 0, cG_below = qC[2] < 0, dGE_pos = gE$lo > 0)
  }, numeric(4)))
  res3[[paste(world, dg)]] <- colMeans(out)
  cat(sprintf("  %-4s world, dG_E = %.3f: P(impression closer) %.3f; P(tone closer) %.3f; P(c'_G CI < 0) %.3f; P(dG_E HC3 CI > 0) %.3f\n",
              world, dg, mean(out[, 1]), mean(out[, 2]), mean(out[, 3]), mean(out[, 4])))
  res3[[paste(world, dg, "full")]] <- mean(out[, 3] & out[, 4])
}
rr <- function(w, g) res3[[paste(w, g)]]
lbl <- c("dG_E = .37 (1.25 points)", "dG_E = .40", "dG_E = .60")
rng_imp  <- list(c(.10, .16), c(.10, .16), c(.22, .27)); rng_tone <- list(c(.10, .14), c(.10, .14), c(.23, .30))
for (j in 1:3) {
  p <- rr("IMP", DG[j])["imp"]
  add_row(sprintf("DRULE_imp_%02d", round(100 * DG[j])), "4.4; 7.2 step 4",
          sprintf("D rule, impression true (dW_E = 0), %s: P(impression described as closer)", lbl[j]),
          sprintf("~ .%02d-.%02d", round(100 * rng_imp[[j]][1]), round(100 * rng_imp[[j]][2])), p, NS3, pse(p, NS3),
          rng_imp[[j]][1], rng_imp[[j]][2])
}
for (j in 1:3) {
  p <- rr("TONE", DG[j])["tone"]
  add_row(sprintf("DRULE_tone_%02d", round(100 * DG[j])), "4.4; 7.2 step 4",
          sprintf("D rule, tone true (b_E = 0, dW_E = 0), %s: P(tone described as closer)", lbl[j]),
          sprintf("~ .%02d-.%02d", round(100 * rng_tone[[j]][1]), round(100 * rng_tone[[j]][2])), p, NS3, pse(p, NS3),
          rng_tone[[j]][1], rng_tone[[j]][2])
}
wi <- sapply(DG, function(g) rr("IMP", g)["tone"]); wt <- sapply(DG, function(g) rr("TONE", g)["imp"])
add_row("DRULE_wrong_imp", "4.4; 7.2 step 4", "D rule, impression true: P(tone described as closer), max over the three dG_E",
        "<= .01", max(wi), NS3, pse(max(wi), NS3), -Inf, .01)
add_row("DRULE_wrong_tone", "4.4; 7.2 step 4", "D rule, tone true: P(impression described as closer), max over the three dG_E",
        "<= .01", max(wt), NS3, pse(max(wt), NS3), -Inf, .01)
for (x in list(list("TONE", .40, ".41"), list("TONE", .60, ".69"), list("IMP", .40, ".04"), list("IMP", .60, ".03"))) {
  p <- rr(x[[1]], x[[2]])["cG_below"]; cl <- as.numeric(x[[3]])
  add_row(sprintf("CPG_%s_%02d", tolower(x[[1]]), round(100 * x[[2]])), "4.4; 0.5; 7.2",
          sprintf("c'_G falsifier, %s version true, dG_E = %.2f: P(bootstrap 95%% CI of c'_G entirely below 0)",
                  if (x[[1]] == "TONE") "tone" else "impression", x[[2]]), x[[3]], p, NS3, pse(p, NS3), cl, cl)
}
for (x in list(list("TONE", .40), list("TONE", .60), list("IMP", .40), list("IMP", .60))) {
  p <- res3[[paste(x[[1]], x[[2]], "full")]]
  add_row(sprintf("CPGFULL_%s_%02d", tolower(x[[1]]), round(100 * x[[2]])), "0.5; 7.2 step 2",
          sprintf("Full 0.5 falsifier (dG_E HC3 95%% CI > 0 and c'_G CI < 0), %s true, dG_E = %.2f",
                  if (x[[1]] == "TONE") "tone" else "impression", x[[2]]), "-", p, NS3, pse(p, NS3))
}

# =============================================================================
# 4. H2 step 4b fixed-prediction comparison (Section 7.2)
# =============================================================================
blk("4. H2 step 4b (LR with P_G0 = .17, P_T0 = 0)")
P0 <- .17; SE_E <- SD_PSR * sqrt(2 / n_side)             # SE of the E coefficient (marginal difference), ~ .118
thr_hi <- P0 / 2 + SE_E^2 * log(3) / P0; thr_lo <- P0 / 2 - SE_E^2 * log(3) / P0
an_hit <- pnorm((P0 - thr_hi) / SE_E); an_wrong <- pnorm((thr_lo - P0) / SE_E)
cat(sprintf("  SE_E = %.4f; LR >= 3 iff b_E >= %.4f; LR <= 1/3 iff b_E <= %.4f\n", SE_E, thr_hi, thr_lo))
add_row("LR4b_an_hit", "4.4; 7.2 step 4b", sprintf("Step 4b, normal approximation (SE_E = %.3f): P(LR>=3 | b_E=.17) = P(LR<=1/3 | b_E=0)", SE_E),
        "~ .48", an_hit, 0, 0, .48, .48)
add_row("LR4b_an_wrong", "4.4; 7.2 step 4b", "Step 4b, normal approximation: P(LR<=1/3 | b_E=.17) = P(LR>=3 | b_E=0) (wrong version)",
        "~ .07", an_wrong, 0, 0, .07, .07)
set.seed(SEED)
NS4 <- Q(20000, 2000)
for (bt in c(.17, 0)) {
  Y <- bt * cellE + .50 * cellA + matrix(rnorm(N * NS4, 0, SD_PSR), N)
  h <- hc3_main(cell_moments(Y), "E"); LR <- exp((h$b * P0 - P0^2 / 2) / h$se^2)
  pg <- mean(LR >= 3); pt_ <- mean(LR <= 1 / 3)
  if (bt > 0) {
    add_row("LR4b_sim_hit17", "4.4; 7.2 step 4b", "Step 4b simulated (HC3 SE estimated): P(LR >= 3 | b_E = .17)", "~ .48", pg, NS4, pse(pg, NS4), .48, .48)
    add_row("LR4b_sim_wrong17", "4.4; 7.2 step 4b", "Step 4b simulated: P(LR <= 1/3 | b_E = .17) (verdict for the wrong version)", "~ .07", pt_, NS4, pse(pt_, NS4), .07, .07)
  } else {
    add_row("LR4b_sim_hit0", "4.4; 7.2 step 4b", "Step 4b simulated: P(LR <= 1/3 | b_E = 0)", "~ .48", pt_, NS4, pse(pt_, NS4), .48, .48)
    add_row("LR4b_sim_wrong0", "7.2 step 4b", "Step 4b simulated: P(LR >= 3 | b_E = 0) (verdict for the wrong version)", "~ .07", pg, NS4, pse(pg, NS4), .07, .07)
  }
}

# =============================================================================
# 5. H5 halo ratios: pooled ratio with G_halo_E, full G_halo, all four traits (Section 8.7; dagger row)
# =============================================================================
blk("5. H5 halo ratios")
keyed <- with(d, cbind(k1 = tipi_bot_1, k6 = 8 - tipi_bot_6, k2 = 8 - tipi_bot_2, k7 = tipi_bot_7,
                       k3 = tipi_bot_3, k8 = 8 - tipi_bot_8, k4 = 8 - tipi_bot_4, k9 = tipi_bot_9,
                       k5 = tipi_bot_5, k10 = 8 - tipi_bot_10))
res10 <- apply(keyed, 2, wres, g = d$cell)
S10   <- crossprod(res10) / (nrow(res10) - nlevels(d$cell))         # within-cell covariance of the 10 keyed items
Er    <- wres((keyed[, "k1"] + keyed[, "k6"]) / 2, d$cell)
slope <- apply(res10, 2, function(y) sum(y * Er) / sum(Er^2))         # within-cell slope of each item on perceived E
shift <- c(1, 1, slope[3:10])                                         # E items move by the shift; others by their slope
comp5 <- function(X) cbind(E = (X[, 1] + X[, 2]) / 2, A = (X[, 3] + X[, 4]) / 2, C = (X[, 5] + X[, 6]) / 2,
                           ES = (X[, 7] + X[, 8]) / 2, O = (X[, 9] + X[, 10]) / 2,
                           G = ((X[, 5] + X[, 6]) / 2 + (X[, 7] + X[, 8]) / 2 + (X[, 9] + X[, 10]) / 2) / 3,
                           GE = (X[, 5] + X[, 6] + X[, 7] + X[, 10]) / 4)      # G_halo_E: items 3, 8r, 4r, 10r
cat(sprintf("  predicted ratios (item slopes): A %.3f C %.3f ES %.3f O %.3f G_halo %.3f G_halo_E %.3f\n",
            mean(slope[3:4]), mean(slope[5:6]), mean(slope[7:8]), mean(slope[9:10]), mean(slope[5:10]), mean(slope[c(5, 6, 7, 10)])))
NS5 <- Q(2000, 100); B5 <- Q(1999, 499)
h5 <- list()
for (delta in c(1.0, 1.25, 1.5)) {
  set.seed(SEED)
  out <- t(vapply(seq_len(NS5), function(s) {
    Z <- comp5(mvrnorm(N, rep(0, 10), S10) + outer(cellE + .5, delta * shift))
    Wl <- boot_weights(B5); M <- array(NA_real_, c(B5, 7, 4))
    for (k in 1:4) M[, , k] <- crossprod(Wl[[k]], Z[cellid == k, , drop = FALSE]) / n_cell
    bE <- matrix((M[, , 3] + M[, , 4] - M[, , 1] - M[, , 2]) / 2, B5, 7)
    lo <- apply(bE[, -1, drop = FALSE] / bE[, 1], 2, quantile, .025, names = FALSE)   # A, C, ES, O, G, GE
    c(GE = lo[6] > 0, G = lo[5] > 0, all4 = all(lo[1:4] > 0))
  }, numeric(3)))
  h5[[as.character(delta)]] <- colMeans(out)
  cat(sprintf("  shift %.2f: P(G_halo_E ratio CI > 0) %.3f; P(G_halo ratio CI > 0) %.3f; P(all four CIs > 0) %.3f\n",
              delta, mean(out[, 1]), mean(out[, 2]), mean(out[, 3])))
}
pr <- list(GE = c(.71, .88, .95), Glo = c(.70, .88, .96), Ghi = c(.76, .90, .97), A4lo = c(.11, .21, .37), A4hi = c(.12, .25, .40))
for (j in 1:3) {
  dl <- c(1.0, 1.25, 1.5)[j]; v <- h5[[as.character(dl)]]
  add_row(sprintf("H5_GE_%03d", round(100 * dl)), "4.4; 8.7", sprintf("H5 decision: P(pooled ratio with G_halo_E has 95%% CI above 0), perceived-E shift %.2f", dl),
          sprintf(".%02d", round(100 * pr$GE[j])), v["GE"], NS5, pse(v["GE"], NS5), pr$GE[j], pr$GE[j])
  add_row(sprintf("H5_G_%03d", round(100 * dl)), "4.4; 8.7", sprintf("H5: P(pooled ratio with full G_halo has 95%% CI above 0), shift %.2f", dl),
          sprintf(".%02d-.%02d", round(100 * pr$Glo[j]), round(100 * pr$Ghi[j])), v["G"], NS5, pse(v["G"], NS5), pr$Glo[j], pr$Ghi[j])
  add_row(sprintf("H5_all4_%03d", round(100 * dl)), "4.4; 8.7", sprintf("H5: P(all four trait-ratio 95%% CIs above 0), shift %.2f", dl),
          sprintf(".%02d-.%02d", round(100 * pr$A4lo[j]), round(100 * pr$A4hi[j])), v["all4"], NS5, pse(v["all4"], NS5), pr$A4lo[j], pr$A4hi[j])
}

# =============================================================================
# 6. R2c / R2d aggregate rule (Section 8.10; dagger rows)
# =============================================================================
blk("6. R2c / R2d aggregate rule")
S_R2c <- cov(cbind(chat = wres(d$liab_chat, d$cell), user = wres(d$liab_user, d$cell), harm = wres(d$liab_harm, d$cell)))
S_R2d <- cov(cbind(company = wres(d$liab_1, d$cell), sylva = wres(d$liab_6, d$cell), user = wres(d$liab_9, d$cell)))
cat("  R2c within-cell correlations (chat, user, harm):", round(cov2cor(S_R2c)[lower.tri(S_R2c)], 3), "\n")
cat("  R2d proxy within-cell correlations (company, Sylva, user):", round(cov2cor(S_R2d)[lower.tri(S_R2d)], 3),
    "; r(gap, company, Sylva, user):", round(cor(cbind(wres(d$liab_1 - d$liab_6, d$cell), wres(d$liab_1, d$cell),
                                                       wres(d$liab_6, d$cell), wres(d$liab_9, d$cell)))[1, -1], 3), "\n")
# Marginal t statistics for the A and E main effects on every outcome, nsim datasets
sim_t <- function(S, nsim, eff_j = NA, eff_d = 0, gap = FALSE, chunk = 2000) {
  k <- ncol(S); sds <- sqrt(diag(S)); out <- vector("list", ceiling(nsim / chunk)); done <- 0; i <- 0
  while (done < nsim) {
    ns <- min(chunk, nsim - done); i <- i + 1
    Z <- mvrnorm(ns * N, rep(0, k), S)
    Ys <- lapply(seq_len(k), function(j) matrix(Z[, j], nrow = N))
    if (!is.na(eff_j)) Ys[[eff_j]] <- Ys[[eff_j]] + eff_d * sds[eff_j] * cellA     # A effect of eff_d within-cell SDs
    if (gap) Ys[[k + 1]] <- Ys[[1]] - Ys[[2]]                                       # gap = company - Sylva (coherent)
    out[[i]] <- do.call(cbind, lapply(Ys, function(Y) { cm <- cell_moments(Y); cbind(student_t_marg(cm, "A"), student_t_marg(cm, "E")) }))
    done <- done + ns
  }
  do.call(rbind, out)
}
rule <- function(T) { n10 <- rowSums(abs(T) > t3); n01 <- rowSums(abs(T) < tlow)
  cbind(contradicted = n10 > 0, supported = n10 == 0 & n01 > ncol(T) / 2, all01 = n01 == ncol(T)) }
NS6 <- Q(20000, 2000)
set.seed(SEED); rc0 <- colMeans(rule(sim_t(S_R2c, NS6)))
set.seed(SEED); rd0 <- colMeans(rule(sim_t(S_R2d, NS6, gap = TRUE)))
add_row("R2c_sup0", "4.4; 8.10", "R2c, all true effects 0: P(supported) (6 BFs; no BF10>3 and >= 4 BF01>3)", ".89", rc0["supported"], NS6, pse(rc0["supported"], NS6), .89, .89)
add_row("R2c_con0", "4.4; 8.10", "R2c, all true effects 0: P(contradicted) (any BF10 > 3)", ".06", rc0["contradicted"], NS6, pse(rc0["contradicted"], NS6), .06, .06)
add_row("R2c_all0", "4.4; 8.10", "R2c, all true effects 0: P(every BF01 > 3) (not the decision rule)", ".35", rc0["all01"], NS6, pse(rc0["all01"], NS6), .35, .35)
add_row("R2d_sup0", "4.4; 8.10", "R2d (proxy covariance), all effects 0: P(supported) (8 BFs; >= 5 BF01>3)", ".89", rd0["supported"], NS6, pse(rd0["supported"], NS6), .89, .89)
add_row("R2d_con0", "4.4; 8.10", "R2d (proxy covariance), all effects 0: P(contradicted)", ".07", rd0["contradicted"], NS6, pse(rd0["contradicted"], NS6), .07, .07)
add_row("R2d_all0", "4.4; 8.10", "R2d (proxy covariance), all effects 0: P(every BF01 > 3)", ".30", rd0["all01"], NS6, pse(rd0["all01"], NS6), .30, .30)
for (j in 1:3) {
  set.seed(SEED); p <- mean(rule(sim_t(S_R2c, NS6, eff_j = j, eff_d = .40))[, "contradicted"])
  add_row(paste0("R2c_con_d40_", colnames(S_R2c)[j]), "4.4; 8.10",
          sprintf("R2c, one true A effect d = .40 on %s: P(contradicted)", c("Chatbot Responsibility", "User Responsibility", "Harm Severity")[j]),
          "about .78 or more", p, NS6, pse(p, NS6), .78, Inf)
}
for (j in 1:3) {
  set.seed(SEED); p <- mean(rule(sim_t(S_R2d, NS6, eff_j = j, eff_d = .40, gap = TRUE))[, "contradicted"])
  add_row(paste0("R2d_con_d40_", colnames(S_R2d)[j]), "4.4; 8.10",
          sprintf("R2d, one true A effect d = .40 on v2_%s (gap_v2 shifts accordingly): P(contradicted)", colnames(S_R2d)[j]),
          "about .78 or more", p, NS6, pse(p, NS6), .78, Inf)
}
# Check with the registered model-based lmBF on null datasets (all 14 BFs per dataset)
NS6b <- Q(300, 12); sd6 <- rep_seeds(NS6b)
L6 <- t(chol(S_R2c)); L6d <- t(chol(S_R2d))
r6 <- pmap(seq_len(NS6b), function(i) {
  set.seed(sd6[i])
  Yc <- t(L6 %*% matrix(rnorm(3 * N), 3)); Yd <- t(L6d %*% matrix(rnorm(3 * N), 3)); Yd <- cbind(Yd, Yd[, 1] - Yd[, 2])
  bfs <- function(Y) as.vector(sapply(seq_len(ncol(Y)), function(j) c(bf_main(Y[, j], "A", 2000), bf_main(Y[, j], "E", 2000))))
  tts <- function(Y) as.vector(sapply(seq_len(ncol(Y)), function(j) { cm <- cell_moments(Y[, j, drop = FALSE])
    c(student_t_marg(cm, "A"), student_t_marg(cm, "E")) }))
  list(bc = bfs(Yc), bd = bfs(Yd), tc = tts(Yc), td = tts(Yd))
})
cls_bf <- function(b) ifelse(b > 3, 1L, ifelse(b < 1 / 3, -1L, 0L)); cls_t <- function(t) ifelse(abs(t) > t3, 1L, ifelse(abs(t) < tlow, -1L, 0L))
dec_bf <- function(b) c(contradicted = any(b > 3), supported = !any(b > 3) && sum(b < 1 / 3) > length(b) / 2, all01 = all(b < 1 / 3))
Dc <- colMeans(t(sapply(r6, function(r) dec_bf(r$bc)))); Dd <- colMeans(t(sapply(r6, function(r) dec_bf(r$bd))))
agree6 <- mean(unlist(lapply(r6, function(r) c(cls_bf(r$bc) == cls_t(r$tc), cls_bf(r$bd) == cls_t(r$td)))))
add_row("R2c_sup0_lmBF", "4.4; 8.10", "R2c, all effects 0, registered lmBF (2,000 iter.): P(supported)", ".89", Dc["supported"], NS6b, pse(Dc["supported"], NS6b), .89, .89)
add_row("R2c_con0_lmBF", "4.4; 8.10", "R2c, all effects 0, registered lmBF: P(contradicted)", ".06", Dc["contradicted"], NS6b, pse(Dc["contradicted"], NS6b), .06, .06)
add_row("R2d_sup0_lmBF", "4.4; 8.10", "R2d (proxy), all effects 0, registered lmBF: P(supported)", ".89", Dd["supported"], NS6b, pse(Dd["supported"], NS6b), .89, .89)
add_row("R2d_con0_lmBF", "4.4; 8.10", "R2d (proxy), all effects 0, registered lmBF: P(contradicted)", ".07", Dd["contradicted"], NS6b, pse(Dd["contradicted"], NS6b), .07, .07)
add_row("R2cd_agree_lmBF", "8.10", "Per-BF class agreement (BF10>3 / BF01>3 / neither): lmBF vs exact ttestBF from t", "-",
        agree6, 14 * NS6b, pse(agree6, 14 * NS6b))

# =============================================================================
# 7. R2c 12-item profile Bayes factor (Section 8.10 text)
# =============================================================================
blk("7. R2c profile Bayes factor")
Lm <- as.matrix(d[, paste0("liab_", 1:12)])
Lc <- sweep(Lm - rowMeans(Lm), 2, colMeans(Lm - rowMeans(Lm)))
RES_SD <- sqrt(sum(Lc^2) / (nrow(Lm) * 11))                          # residual SD around person + item means
U_SD   <- sd(wres(rowMeans(Lm), d$cell))                             # SD of person means within cell
cat(sprintf("  person SD %.3f; residual item SD %.3f\n", U_SD, RES_SD))
nit <- 12L
lp_pid <- factor(rep(seq_len(N), each = nit)); lp_item <- factor(rep(seq_len(nit), N))
lp_A <- rep(cellA, each = nit); lp_E <- rep(cellE, each = nit)
EFF7 <- c(.35, .40, .50, .60, .70); NS7 <- Q(300, 8); sd7 <- rep_seeds(NS7)     # same seeds across effects (common random numbers)
jobs7 <- expand.grid(i = seq_len(NS7), e = seq_along(EFF7))
r7 <- unlist(pmap(seq_len(nrow(jobs7)), function(r) {
  i <- jobs7$i[r]; eff <- EFF7[jobs7$e[r]]; set.seed(sd7[i])
  y <- rep(rnorm(N, 0, U_SD), each = nit) + rnorm(N * nit, 0, RES_SD) + ifelse(lp_A > 0 & as.integer(lp_item) <= 3, eff, 0)
  lp <- data.frame(y = y, pid = lp_pid, item = lp_item, Af = factor(lp_A), Ef = factor(lp_E))
  tryCatch({
    full <- lmBF(y ~ item + Af + Ef + Af:Ef + item:Af + item:Ef + pid, whichRandom = "pid", data = lp, rscaleFixed = .5, iterations = 1000, progress = FALSE)
    red  <- lmBF(y ~ item + Af + Ef + Af:Ef + pid, whichRandom = "pid", data = lp, rscaleFixed = .5, iterations = 1000, progress = FALSE)
    exp(red@bayesFactor$bf - full@bayesFactor$bf) }, error = function(e) NA_real_)
}))
BF01_7 <- split(r7, jobs7$e); names(BF01_7) <- EFF7
for (e in names(BF01_7)) { b <- BF01_7[[e]]; b <- b[!is.na(b)]
  cat(sprintf("  effect %s on 3 of 12 items: n = %d, median BF01 %.3g, range %.3g to %.3g, P(BF01 > 3) %.3f, P(BF10 > 3) %.3f\n",
              e, length(b), median(b), min(b), max(b), mean(b > 3), mean(b < 1 / 3))) }
boot_se <- function(x, f, R = 2000) { set.seed(SEED); sd(replicate(R, f(sample(x, replace = TRUE)))) }
for (e in c("0.35", "0.4")) {
  b <- BF01_7[[e]]; b <- b[!is.na(b)]; ee <- as.numeric(e)
  add_row(sprintf("PROF_01gt3_%02d", round(100 * ee)), "8.10",
          sprintf("Profile BF: P(BF01 > 3) when 3 of 12 items differ by %.2f by warmth (lmBF 1,000 iter.)", ee),
          "1 (favors reduced; BF01 31 to 790,000)", mean(b > 3), length(b), pse(mean(b > 3), length(b)), 1, 1)
  add_row(sprintf("PROF_med_%02d", round(100 * ee)), "8.10", sprintf("Profile BF: median log10 BF01, effect %.2f", ee), "-",
          median(log10(b)), length(b), boot_se(log10(b), median))
}
b3540 <- log10(unlist(lapply(BF01_7[c("0.35", "0.4")], function(b) b[!is.na(b)])))
add_row("PROF_q05_3540", "8.10", "Profile BF: 5th percentile of log10 BF01, effects 0.35-0.40 pooled", "log10(31) = 1.49 (lowest simulated)",
        quantile(b3540, .05, names = FALSE), length(b3540), boot_se(b3540, function(x) quantile(x, .05, names = FALSE)))
add_row("PROF_q95_3540", "8.10", "Profile BF: 95th percentile of log10 BF01, effects 0.35-0.40 pooled", "log10(790,000) = 5.90 (highest simulated)",
        quantile(b3540, .95, names = FALSE), length(b3540), boot_se(b3540, function(x) quantile(x, .95, names = FALSE)))
p10 <- sapply(BF01_7, function(b) mean(b[!is.na(b)] < 1 / 3)); n10 <- sapply(BF01_7, function(b) sum(!is.na(b)))
for (e in c("0.5", "0.6", "0.7")) add_row(sprintf("PROF_10gt3_%02d", round(100 * as.numeric(e))), "8.10",
  sprintf("Profile BF: P(BF10 > 3) (detection), effect %.2f", as.numeric(e)), "-", p10[[e]], n10[[e]], pse(p10[[e]], n10[[e]]))
cross50 <- function(p) { k <- which(p >= .5)[1]; if (is.na(k)) return(NA_real_); if (k == 1) return(EFF7[1])
  EFF7[k - 1] + (.5 - p[k - 1]) / (p[k] - p[k - 1]) * (EFF7[k] - EFF7[k - 1]) }
c50 <- cross50(p10)
set.seed(SEED)
c50_bs <- replicate(2000, cross50(sapply(BF01_7, function(b) { b <- b[!is.na(b)]; mean(sample(b, replace = TRUE) < 1 / 3) })))
add_row("PROF_detect50", "8.10", "Profile BF: item difference at which P(BF10 > 3) reaches .50 (interpolated)",
        "detects from about 0.5-0.7 points", c50, min(n10), sd(c50_bs, na.rm = TRUE), .50, .70)

# =============================================================================
# 8. R4 under the registered specification (Section 8.9)
# =============================================================================
blk("8. R4 (registered specification)")
zs <- function(x) as.numeric(scale(x))
r4_stats <- function(dd, iterations) {
  y <- zs(dd$liab_6); ma <- zs(dd$ma_cap); mp <- zs(dd$mp_total)
  psr <- zs(dd$psr_total); ec <- zs(dd$ec_total); tr <- zs(dd$trust_total)
  B <- zs((psr + ec + tr) / 3)                                         # bonding composite (Section 6.15)
  A <- dd$A; E <- dd$E
  beta_B <- unname(coef(lm(y ~ A * E + ma + mp + B))["B"])
  df4 <- data.frame(y, Af = factor(A), Ef = factor(E), ma, mp, psr, ec, tr)
  full <- lmBF(y ~ Af + Ef + Af:Ef + ma + mp + psr + ec + tr, data = df4, rscaleFixed = .5, rscaleCont = "medium", iterations = iterations, progress = FALSE)
  red  <- lmBF(y ~ Af + Ef + Af:Ef + ma + mp, data = df4, rscaleFixed = .5, rscaleCont = "medium", iterations = iterations, progress = FALSE)
  c(bf10 = exp(full@bayesFactor$bf - red@bayesFactor$bf), beta_B = beta_B)
}
d4 <- data.frame(liab_6 = d$liab_6, ma_cap = d$ma_cap, mp_total = d$mp_total, psr_total = d$psr_total,
                 ec_total = d$ec_total, trust_total = d$trust_total,
                 A = d$high - .5, E = ifelse(d$study == 1, .5, -.5), cell = d$cell)   # the four S1-2 cells as the 2 x 2
set.seed(SEED); obs4 <- r4_stats(d4, Q(100000, 10000))
cat(sprintf("  Studies 1-2 (N = %d), registered specification: BF01 = %.1f; beta_B = %.3f\n", nrow(d4), 1 / obs4["bf10"], obs4["beta_B"]))
# Null world (information only): liab_6 = reduced-model fit + a residual drawn from an independent row of the
# same cell, so PSR, EC and Trust add exactly nothing beyond ma_cap and MP while the predictors keep their joint
# distribution. Shows how much of the R4 result reflects the small Studies 1-2 bonding association itself.
fit0 <- lm(liab_6 ~ A * E + ma_cap + mp_total, data = d4); f0 <- fitted(fit0); e0 <- resid(fit0)
NS8 <- Q(500, 16); sd8 <- rep_seeds(NS8); idx_cell <- split(seq_len(nrow(d4)), d4$cell)
na4 <- c(bf10 = NA_real_, beta_B = NA_real_)
r8 <- do.call(rbind, pmap(seq_len(NS8), function(i) {
  set.seed(sd8[i])
  ix  <- unlist(lapply(idx_cell, function(ii) ii[sample.int(length(ii), n_cell, replace = TRUE)]))
  ix2 <- unlist(lapply(idx_cell, function(ii) ii[sample.int(length(ii), n_cell, replace = TRUE)]))
  dd0 <- d4[ix, ]; dd0$liab_6 <- f0[ix] + e0[ix2]
  c(tryCatch(r4_stats(d4[ix, ], 10000), error = function(e) na4),
    setNames(tryCatch(r4_stats(dd0, 10000), error = function(e) na4), c("bf10_null", "beta_B_null")))
}))
r4_rows <- function(bf10, betaB, tag, label, printed_main) {
  ok <- !is.na(bf10); bf10 <- bf10[ok]; betaB <- betaB[ok]; n8 <- length(bf10)
  bf01 <- 1 / bf10; con <- bf10 > 3 | betaB >= .25; sup <- !con & bf01 > 3
  if (tag == "") add_row("R4_BF01gt3", "4.4; 8.9", paste0("R4: P(BF01 > 3), ", label), printed_main, mean(bf01 > 3), n8, pse(mean(bf01 > 3), n8), .743, .743) else
                 add_row(paste0("R4", tag, "_BF01gt3"), "8.9", paste0("R4: P(BF01 > 3), ", label), "-", mean(bf01 > 3), n8, pse(mean(bf01 > 3), n8))
  add_row(paste0("R4", tag, "_supported"), "8.9", paste0("R4: P(supported: BF01 > 3, BF10 <= 3, beta_B < .25), ", label), "-", mean(sup), n8, pse(mean(sup), n8))
  add_row(paste0("R4", tag, "_contradicted"), "8.9", paste0("R4: P(contradicted: BF10 > 3 or beta_B >= .25), ", label), "-", mean(con), n8, pse(mean(con), n8))
  add_row(paste0("R4", tag, "_betaB25"), "8.9", paste0("R4: P(bonding-composite beta_B >= .25), ", label), "-", mean(betaB >= .25), n8, pse(mean(betaB >= .25), n8))
  add_row(paste0("R4", tag, "_BF10gt3"), "8.9", paste0("R4: P(BF10 > 3), ", label), "-", mean(bf10 > 3), n8, pse(mean(bf10 > 3), n8))
  cat(sprintf("  %s: median BF01 %.2f; median beta_B %.3f; P(inconclusive) %.3f\n", label, median(bf01), median(betaB), mean(!con & !sup)))
}
r4_rows(r8[, "bf10"], r8[, "beta_B"], "", "N = 272, stratified resampling of S1-2 (liab_6; ma_cap, MP; + PSR, EC, Trust)", ".743")
r4_rows(r8[, "bf10_null"], r8[, "beta_B_null"], "null", "same resamples, null world (bonding adds nothing)", "-")

# =============================================================================
# 9. Write the results
# =============================================================================
blk("9. Results")
out_file <- file.path(OUT_DIR, if (QUICK) "power_supplement_results_QUICK.csv" else "power_supplement_results.csv")
write.csv(LED, out_file, row.names = FALSE)
cat(sprintf("Rows: %d | with a printed value: %d | agree: %d | disagree: %d\n", nrow(LED), sum(!is.na(LED$agrees)),
            sum(LED$agrees %in% TRUE), sum(LED$agrees %in% FALSE)))
if (any(LED$agrees %in% FALSE)) { cat("Rows that disagree with the printed value:\n")
  print(LED[LED$agrees %in% FALSE, c("id", "value_in_prereg", "recomputed", "n_sims", "mc_se")], row.names = FALSE) }
cat("Written:", if (QUICK) out_file else "Docs/Preregistration/Study3_Prereg_Review_2026-10-16/power_supplement_results.csv", "\n")
print(sessionInfo())
cat(sprintf("Total runtime: %.1f minutes\n", as.numeric(difftime(Sys.time(), T_START, units = "mins"))))
