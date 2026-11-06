# =============================================================================
# power_check.R
# Independent check of the power, sample-size, stopping-rule and exclusion
# figures in the Study 3 preregistration draft (revision 2, 2026-10-01):
#   Docs/Preregistration/Study3_Preregistration_Update_DRAFT_2026-10-01.md
# Sections checked: 1.3 (Changes 4, 24), 2.2-2.4, 4.3-4.5, 8.x decision rules.
#
# Review lens: power, sample size, stopping rule, exclusions. Written 2026-10-16.
# Every simulation block resets set.seed(42). No Study 3 data exist; planning
# values come from the Study 1-2 analytic files (read-only) and the cross-study
# tone-probe file. Nothing here reads chat text or open-ended answers.
#
# Run:  Rscript power_check.R
# Writes (next to this script): power_check_results.csv  (claimed vs recomputed)
# Runtime: about 10-15 minutes (lmBF and bootstrap blocks dominate).
# Packages: pwr, BayesFactor, TOSTER, sandwich, lmtest, MASS, dplyr.
# =============================================================================

suppressPackageStartupMessages({
  library(pwr); library(BayesFactor); library(TOSTER)
  library(sandwich); library(lmtest); library(MASS); library(dplyr)
})
set.seed(42)

ROOT <- Sys.getenv("STUDY3_LAB_ROOT")   # the lab folder (contains Analysis/ and Docs/)
if (ROOT == "") stop("Set STUDY3_LAB_ROOT to the lab folder before running this script.")
ANA  <- file.path(ROOT, "Analysis")
OUT  <- file.path(ROOT, "Docs", "Preregistration", "Study3_Prereg_Review_2026-10-16")

NSIM   <- 5000          # as in the prereg's own scripts
n_cell <- 68; n_side <- 136; N <- 272
cg     <- expand.grid(A = c(-.5, .5), E = c(-.5, .5))
cellA  <- rep(cg$A, each = n_cell); cellE <- rep(cg$E, each = n_cell)
cellid <- rep(1:4, each = n_cell)

# ---- results ledger: one row per claim --------------------------------------
LED <- data.frame()
claim <- function(id, section, quantity, claimed, recomputed, method, tol = .05) {
  flag <- if (is.na(claimed) || is.na(recomputed)) "n/a" else
          if (abs(claimed - recomputed) > tol) "DIFF>.05" else "ok"
  LED <<- rbind(LED, data.frame(id = id, section = section, quantity = quantity,
                                claimed = claimed, recomputed = round(recomputed, 3),
                                method = method, flag = flag, stringsAsFactors = FALSE))
  cat(sprintf("[%s] %-60s claimed %s  recomputed %.3f  %s\n", id, quantity,
              ifelse(is.na(claimed), "  -  ", sprintf("%.3f", claimed)), recomputed, flag))
}
info <- function(...) cat(sprintf(...), "\n")

# Fast Welch TOST p (identical to TOSTER::tsum_TOST raw bounds; checked below)
welch_tost_p <- function(a, b, eb) {
  va <- var(a) / length(a); vb <- var(b) / length(b); se <- sqrt(va + vb)
  df <- se^4 / (va^2 / (length(a) - 1) + vb^2 / (length(b) - 1))
  dm <- mean(a) - mean(b)
  max(pt((dm + eb) / se, df, lower.tail = FALSE), pt((dm - eb) / se, df))
}
local({ set.seed(1); a <- rnorm(68, 0, 1); b <- rnorm(68, .1, 1)
  tt <- suppressMessages(tsum_TOST(m1 = mean(a), sd1 = sd(a), n1 = 68, m2 = mean(b), sd2 = sd(b), n2 = 68,
        low_eqbound = -.4, high_eqbound = .4, eqbound_type = "raw", alpha = .05))
  stopifnot(abs(max(tt$TOST$p.value[2:3]) - welch_tost_p(a, b, .4)) < 1e-8) })
set.seed(42)

# =============================================================================
# 1. Planning values from Studies 1-2 (analytic samples; Study 1 N = 131, Study 2 N = 143)
# =============================================================================
cat("\n==== 1. Planning values from Studies 1-2 ====\n")
rd <- function(s) read.csv(file.path(ANA, s, "data", "processed", "analytic_data.csv"),
                           colClasses = c(sona_id = "character"))
s1 <- rd("Study 1"); s2 <- rd("Study 2")
s1$study <- 1; s2$study <- 2
s1$high <- as.integer(s1$condition_label == "HighA"); s2$high <- as.integer(s2$condition_label == "HighN")
keep <- c("study", "high", "sona_id", "psr_total", "ec_total", "trust_total", "et_total", "ma_total", "mp_total",
          "liab_corp", "liab_chat", "liab_user", "liab_harm", paste0("liab_", 1:12),
          paste0("tipi_bot_", c("extra", "agree", "consc", "emostab", "open")),
          "tipi_self_agree", "phq4_total", "bot_tokens_per_turn", paste0("ma_", 1:8))
d <- bind_rows(s1[, keep], s2[, keep])
d$cell <- factor(paste0("S", d$study, "_", d$high))
pooled_sd <- function(y, g) { v <- tapply(y, g, var); n <- tapply(y, g, length); sqrt(sum((n - 1) * v) / sum(n - 1)) }
wres <- function(v) resid(lm(d[[v]] ~ d$cell))

SD_PSR   <- pooled_sd(d$psr_total, d$cell)             # .975
SD_CORP  <- pooled_sd(d$liab_corp, d$cell)             # 1.002
SD_TOK   <- pooled_sd(d$bot_tokens_per_turn, d$cell)   # 15.8
gap      <- d$liab_1 - d$liab_6
GAP_M    <- mean(gap); GAP_SD <- sd(gap)               # 1.124, 1.323
claim("P1", "6.2/App.B", "Corporate Liability pooled within-group SD (S1-2)", 1.00, SD_CORP, "4 groups, N = 274")
claim("P2", "4.4 (R6)", "SD of company - Sylva difference (liab_1 - liab_6)", 1.30, GAP_SD, "N = 274")
claim("P3", "0.2", "company - Sylva dz (identical items)", .85, GAP_M / GAP_SD, "N = 274")
claim("P4", "4.4 (M2)", "within-cell SD of bot tokens per turn (planning SD 16)", 16, SD_TOK, "4 groups", tol = 1)
info("PSR pooled within-cell SD = %.3f", SD_PSR)

# R3: beta of agency on Sylva's responsibility, with the prereg's variables (8.9)
beta_w <- function(y, x) unname(coef(lm(scale(d[[y]]) ~ scale(d[[x]]) + d$cell))[2])
claim("P5", "0.2/4.4 (R3)", "beta agency -> Chatbot Responsibility (ma_total, liab_6-8)", .14, beta_w("liab_chat", "ma_total"), "within cell")
d$ma_cap <- rowMeans(rbind(s1[, paste0("ma_", c(1:4, 6:7))], s2[, paste0("ma_", c(1:4, 6:7))]))   # agency without ma_5/ma_8
info("  (other operationalizations: liab_6 ~ ma_total %.3f; liab_chat ~ ma_cap %.3f; liab_6 ~ ma_cap %.3f)",
     beta_w("liab_6", "ma_total"), beta_w("liab_chat", "ma_cap"), beta_w("liab_6", "ma_cap"))
# R5 correlations (within cell)
R5_cc <- cor(wres("liab_corp"), wres("liab_chat")); R5_uc <- cor(wres("liab_user"), wres("liab_corp")); R5_us <- cor(wres("liab_user"), wres("liab_chat"))
info("R5 within-cell r: company-Sylva %.3f, user-company %.3f, user-Sylva %.3f", R5_cc, R5_uc, R5_us)

# S1: residual SD in the Study 1 parameterization
s1$Az <- as.numeric(scale(s1$tipi_self_agree)); s1$Ac <- s1$high - .5
fS1 <- lm(psr_total ~ Ac * Az, data = s1)
SIG_S1 <- sigma(fS1)
info("S1 (Study 1): A:Aself b = %.3f; residual SD = %.3f (prereg sims used 0.95)", coef(fS1)["Ac:Az"], SIG_S1)

# Impression and halo (H2, H5)
d$G_halo <- (d$tipi_bot_consc + d$tipi_bot_emostab + d$tipi_bot_open) / 3   # Study 3 definition (6.15)
d$G5     <- rowMeans(d[, paste0("tipi_bot_", c("extra", "agree", "consc", "emostab", "open"))])
B_G      <- unname(coef(lm(psr_total ~ G_halo + cell, data = d))[2])
B_G5     <- unname(coef(lm(psr_total ~ G5 + cell, data = d))[2])
SD_G     <- pooled_sd(d$G_halo, d$cell)
R_G_PSR  <- cor(wres("G_halo"), wres("psr_total"))
halo <- sapply(c("agree", "consc", "emostab", "open"), function(t)
  unname(coef(lm(d[[paste0("tipi_bot_", t)]] ~ d$tipi_bot_extra + d$cell))[2]))
claim("P6", "2.4 (H5)", "halo ratio A per point of perceived E", .21, halo["agree"], "within-cell slope")
claim("P7", "2.4 (H5)", "halo ratio C", .20, halo["consc"], "within-cell slope")
claim("P8", "2.4 (H5)", "halo ratio ES", .27, halo["emostab"], "within-cell slope")
claim("P9", "2.4 (H5)", "halo ratio O", .41, halo["open"], "within-cell slope")
per_pt_halo <- mean(halo[c("consc", "emostab", "open")])          # dG_halo per point of perceived E
per_pt_G5   <- (1 + sum(halo)) / 5
info("b_G (PSR on G_halo, within cell) = %.3f; SD(G_halo) = %.3f; r = %.3f; dG_halo per point E = %.3f", B_G, SD_G, R_G_PSR, per_pt_halo)
pred_lo <- B_G * per_pt_halo * 1.0; pred_hi <- B_G * per_pt_halo * 1.5
claim("P10", "2.3 (H2)", "impression-version E effect, upper end (PSR units), G_halo", .34, pred_hi, "b_G x halo x 1.5 points")
claim("P11", "2.3 (H2)", "impression-version E effect, lower end (PSR units), G_halo", .15, pred_lo, "b_G x halo x 1.0 point")
info("  same with five-trait G: %.3f to %.3f PSR units (d %.2f-%.2f) -> the .15-.34 range mixes G_halo and G",
     B_G5 * per_pt_G5, 1.5 * B_G5 * per_pt_G5, B_G5 * per_pt_G5 / SD_PSR, 1.5 * B_G5 * per_pt_G5 / SD_PSR)
D_H2_mid <- (pred_lo + pred_hi) / 2 / SD_PSR
info("  registered (G_halo) prediction in d units: %.3f to %.3f; midpoint %.3f", pred_lo / SD_PSR, pred_hi / SD_PSR, D_H2_mid)

# H1 expected size (2.2): 1.8-2.0 x dW, dW = .28
claim("P12", "2.2 (H1)", "tone-version expected d for H1 (1.8 x .28 / SD_PSR)", .52, 1.8 * .28 / SD_PSR, "low end of 1.8-2.0")
claim("P13", "2.2 (H1)", "tone-version expected d if dW halved (1.8 x .14 / SD_PSR)", .26, 1.8 * .14 / SD_PSR, "low end")

# Tone probe person means (for the H2 model-comparison simulation)
tone <- read.csv(file.path(ANA, "CrossStudy", "measurement", "bot_turn_tone_probes.csv"), colClasses = c(sona_id = "character"))
norm_id <- function(x) sub("^0+(?=.)", "", trimws(as.character(x)), perl = TRUE)
tone$id <- norm_id(tone$sona_id); d$id <- norm_id(d$sona_id)
tp <- tone %>% group_by(study, id) %>% summarise(W = mean(W), .groups = "drop")
dW <- inner_join(d, tp, by = c("study", "id"))
SD_W   <- pooled_sd(dW$W, dW$cell)
R_WG   <- cor(resid(lm(W ~ cell, dW)), resid(lm(G_halo ~ cell, dW)))
R_WP   <- cor(resid(lm(W ~ cell, dW)), resid(lm(psr_total ~ cell, dW)))
B_W    <- unname(coef(lm(psr_total ~ W + cell, data = dW))[2])
info("Tone: N = %d; SD(W) within cell = %.3f; r(W,G_halo) = %.3f; r(W,PSR) = %.3f; b_W = %.3f", nrow(dW), SD_W, R_WG, R_WP, B_W)

# Exclusion rates (CONSORT tables of the Study 1-2 pipelines)
fl1 <- read.csv(file.path(ANA, "Study 1", "outputs", "R", "tables", "01_exclusion_flow.csv"))
fl2 <- read.csv(file.path(ANA, "Study 2", "outputs", "R", "tables", "01_exclusion_flow.csv"))
ex_rate <- function(fl) { tot <- fl$N[1]; tst <- fl$N[2]; fin <- tail(fl$N, 1); c(nontest = tot - tst, excl = tot - tst - fin, rate = (tot - tst - fin) / (tot - tst)) }
e1 <- ex_rate(fl1); e2 <- ex_rate(fl2)
claim("P14", "4.3", "Study 1 non-TEST exclusion rate (10/141)", .071, e1["rate"], "CONSORT table", tol = .005)
claim("P15", "4.3", "Study 2 non-TEST exclusion rate (5/148)", .034, e2["rate"], "CONSORT table", tol = .005)
claim("P16", "4.3", "completed sessions needed for 272 at Study 1 rate (upper of 282-293)", 293, 272 / (1 - e1["rate"]), "272/(1-rate)", tol = 1)
claim("P17", "4.3", "completed sessions needed for 272 at Study 2 rate (lower of 282-293)", 282, 272 / (1 - e2["rate"]), "272/(1-rate)", tol = 1)
EX_POOL <- (e1["excl"] + e2["excl"]) / (e1["nontest"] + e2["nontest"])
info("Pooled S1-2 exclusion rate = %.3f; cap of 300 completed sessions binds if the rate exceeds %.3f", EX_POOL, 1 - 272 / 300)

# =============================================================================
# 2. Main effects, H1 (4.4 rows 1-3; Change 4; floor; secondary family)
# =============================================================================
cat("\n==== 2. Main effects (analytic) ====\n")
pw <- function(dd, n = n_side, a = .05) pwr.t.test(n = n, d = dd, sig.level = a)$power
claim("H1a", "4.4", "main-effect power d = .40, n = 136/side", .908, pw(.40), "pwr.t.test")
for (x in list(c(.30, .693), c(.35, .820), c(.45, .959), c(.50, .984)))
  claim("H1b", "4.4", sprintf("main-effect power d = %.2f", x[1]), x[2], pw(x[1]), "pwr.t.test")
claim("H1c", "4.4", "MDE at 80% power (d)", .341, pwr.t.test(n = n_side, power = .80)$d, "pwr.t.test")
claim("H1d", "4.4", "MDE at 90% power (d)", .394, pwr.t.test(n = n_side, power = .90)$d, "pwr.t.test")
claim("H1e", "4.4/Ch.4", "May 7 design n = 70: power d = .40", .652, pw(.40, 70), "pwr.t.test")
claim("H1f", "Ch.4", "May 7 design n = 70: power d = .30", .42, pw(.30, 70), "pwr.t.test")
claim("H1g", "4.4", "secondary family worst case, alpha .05/16, d = .40", .624, pw(.40, n_side, .05 / 16), "pwr.t.test")
claim("H1h", "4.4", "floor N = 200: power d = .40", .804, pw(.40, 100), "pwr.t.test")

set.seed(42)
cat("  simulating OLS HC3 power for H1 (5000 sims)...\n")
X4 <- cbind(1, cellA, cellE, cellA * cellE)
sim_hc3_p <- function(y, X = X4, j = 2) {
  f <- lm.fit(X, y); XtXi <- chol2inv(qr.R(f$qr)); h <- rowSums((X %*% XtXi) * X)
  u <- f$residuals / (1 - h); V <- XtXi %*% crossprod(X * u) %*% XtXi
  b <- f$coefficients[j]; se <- sqrt(V[j, j]); c(b = b, p = 2 * pt(-abs(b / se), nrow(X) - ncol(X)))
}
local({ y <- .4 * cellA + rnorm(N); f <- lm(y ~ cellA * cellE)
  ref <- coeftest(f, vcov = vcovHC(f, type = "HC3"))["cellA", 4]
  stopifnot(abs(ref - sim_hc3_p(y)[2]) < 1e-10) })
set.seed(42)
rh <- replicate(NSIM, { y <- .40 * cellA + .40 * cellE + rnorm(N); r <- sim_hc3_p(y); r[2] < .05 && r[1] > 0 })
claim("H1i", "4.4", "OLS HC3 power for A, d = .40 (simulated)", .909, mean(rh), "5000 sims, seed 42")

# =============================================================================
# 3. Bayes factor design analysis (4.4; Change 24)
#    BF10 from ttestBF is a monotone function of |t|; find the t thresholds and
#    integrate the (noncentral) t distribution exactly. The registered model-based
#    BF (lmBF, rscaleFixed = .5) equals ttestBF(r = .707) when E has no effect
#    (checked); with an E effect the model-based BF removes E variance.
# =============================================================================
cat("\n==== 3. Bayes factors ====\n")
bf_t  <- function(t) unname(ttest.tstat(t, n_side, n_side, rscale = sqrt(2) / 2, simple = TRUE))   # natural-scale BF10
bfp_t <- function(t) unname(ttest.tstat(t, n_side, n_side, rscale = sqrt(2) / 2, nullInterval = c(0, Inf), simple = TRUE))
t3   <- uniroot(function(t) bf_t(t) - 3, c(1, 6))$root
tlow <- uniroot(function(t) bf_t(t) - 1 / 3, c(0, 3))$root
tp3  <- uniroot(function(t) bfp_t(t) - 3, c(1, 6))$root
dfT  <- 2 * n_side - 2
ncp  <- function(dd) dd * sqrt(n_side / 2)
info("t thresholds: BF10 = 3 at |t| = %.3f; BF10 = 1/3 at |t| = %.3f; BF+0 = 3 at t = %.3f", t3, tlow, tp3)
P_bf3  <- pt(t3, dfT, ncp(.40), lower.tail = FALSE) + pt(-t3, dfT, ncp(.40))
P_bfp3 <- pt(tp3, dfT, ncp(.40), lower.tail = FALSE)
P_mis  <- pt(tlow, dfT, ncp(.40)) - pt(-tlow, dfT, ncp(.40))
P_null <- pt(tlow, dfT) - pt(-tlow, dfT)
claim("BF1", "4.4", "P(BF10 >= 3 | d = .40), no E effect (exact; = model-based)", .785, P_bf3, "exact")
d_eff <- .40 / sqrt(1 + (.40 / 2)^2)       # marginal groups when E also has d = .40
claim("BF1m", "4.4", "P(BF10 >= 3 | d = .40), marginal ttestBF, E effect .40 (exact)", .756,
      pt(t3, dfT, ncp(d_eff), lower.tail = FALSE) + pt(-t3, dfT, ncp(d_eff)), "exact")
claim("BF2", "4.4", "P(BF+0 >= 3 | d = .40), directional (exact)", .844, P_bfp3, "exact")
claim("BF3", "4.4", "P(BF10 < 1/3 | d = .40), ttestBF (exact)", .028, P_mis, "exact")
claim("BF4", "4.4", "P(BF10 < 1/3 | d = 0), ttestBF (exact)", .853, P_null, "exact")

set.seed(42)
NB <- 1000
cat("  simulating model-based lmBF (", NB, " x 2 sims; ~4 min)...\n")
bf_model <- function(y) {
  dat <- data.frame(y = y, Af = factor(cellA), Ef = factor(cellE))
  exp((lmBF(y ~ Af + Ef + Af:Ef, data = dat, rscaleFixed = .5, progress = FALSE) /
       lmBF(y ~ Ef + Af:Ef, data = dat, rscaleFixed = .5, progress = FALSE))@bayesFactor$bf)
}
rbm <- t(replicate(NB, { y <- .40 * cellA + .40 * cellE + rnorm(N)
  tt <- t.test(y[cellA > 0], y[cellA < 0], var.equal = TRUE)$statistic
  c(model = bf_model(y), marg = bf_t(tt)) }))
claim("BF5", "4.4/Ch.24", "P(BF10 >= 3 | d_A = d_E = .40), model-based", .785, mean(rbm[, "model"] >= 3), sprintf("%d sims", NB))
claim("BF6", "4.4/Ch.24", "P(BF10 >= 3 | d_A = d_E = .40), marginal ttestBF", .756, mean(rbm[, "marg"] >= 3), sprintf("%d sims", NB))
rb0 <- replicate(NB, bf_model(rnorm(N)))
claim("BF7", "4.4", "P(BF10 < 1/3 | d = 0), model-based", .830, mean(rb0 < 1 / 3), sprintf("%d sims", NB))

# =============================================================================
# 4. R2a/R2b raw-bound Welch TOST (4.4; 7.2)
# =============================================================================
cat("\n==== 4. R2 equivalence ====\n")
ptost <- function(n, delta, sd, eqb) power_t_TOST(n = n, delta = delta, sd = sd, eqb = eqb, alpha = .05, type = "two.sample")$power
claim("R2a", "4.4", "TOST power, bounds +/-0.40, SD 1.00, d = 0 (analytic)", .900, ptost(n_side, 0, 1, .4), "power_t_TOST")
set.seed(42)
sim_tost <- function(delta, s, eb = .40, n = n_side) mean(replicate(NSIM, {
  y <- delta * cellA + rnorm(4 * (n / 2), 3.2, s); welch_tost_p(y[cellA > 0], y[cellA < 0], eb) < .05 }))
r_sd1 <- sim_tost(0, 1.00); r_sd11 <- sim_tost(0, 1.10)
claim("R2b", "4.4", "Welch TOST raw +/-0.40, SD 1.00, d = 0 (sim)", .895, r_sd1, "5000 sims")
claim("R2c", "4.4", "Welch TOST raw +/-0.40, SD 1.10, d = 0 (sim)", .819, r_sd11, "5000 sims")
claim("R2d", "4.4", "Welch TOST raw +/-0.40, SD 1.00, d = .10 (sim)", .790, sim_tost(.10, 1), "5000 sims")
claim("R2e", "4.4", "Type I at the bound (d = .40)", .049, sim_tost(.40, 1), "5000 sims", tol = .01)
claim("R2f", "4.4/7.2", "both R2a and R2b equivalent (independent), SD 1.00", .80, r_sd1^2, "product")
claim("R2g", "4.4", "May 7 design n = 70 TOST power", .522, ptost(70, 0, 1, .4), "power_t_TOST")
claim("R2h", "4.4", "floor N = 200: TOST power", .760, ptost(100, 0, 1, .4), "power_t_TOST")
claim("R2i", "4.4", "floor N = 200: both R2a and R2b", .58, ptost(100, 0, 1, .4)^2, "product")
info("  at the Study 2 SD (1.035): %.3f; at the largest S1-2 cell SD (1.05): %.3f",
     ptost(n_side, 0, 1.035, .4), ptost(n_side, 0, 1.05, .4))

# =============================================================================
# 5. H2 (2.3; 4.4) -- precision, power, and the model comparison
# =============================================================================
cat("\n==== 5. H2 ====\n")
se_d <- sqrt(2 / n_side)
claim("H2a", "2.3/4.4", "95% CI half-width of the E effect (d)", .24, 1.96 * se_d, "1.96*sqrt(2/136)", tol = .01)
for (x in list(c(.15, .234), c(.20, .376), c(.24, .505), c(.30, .693), c(.35, .820)))
  claim("H2b", "2.3/4.4", sprintf("H2 power at d = %.2f", x[1]), x[2], pw(x[1]), "pwr.t.test")
claim("H2c", "2.3 (R2-2, Ch.5)", "H2 power at the registered (G_halo) predicted midpoint", .505, pw(D_H2_mid),
      sprintf("d = %.3f from S1-2 b_G and halo ratios", D_H2_mid))
info("  power over the registered predicted range d %.3f-%.3f: %.3f-%.3f", pred_lo / SD_PSR, pred_hi / SD_PSR, pw(pred_lo / SD_PSR), pw(pred_hi / SD_PSR))
# simplified LR comparison, as described in 4.4: P(LR >= 3 for the true version)
lr_pow <- function(delta, k = 3) { thr <- delta / 2 + se_d^2 * log(k) / delta; pnorm((delta - thr) / se_d) }
claim("H2d", "4.4", "H2 simplified LR: P(LR >= 3), predictions .25 vs 0", .486, lr_pow(.25), "normal likelihoods, SE sqrt(2/136)")
claim("H2e", "4.4", "H2 simplified LR: P(LR >= 3), .20 vs 0", .306, lr_pow(.20), "same")
claim("H2f", "4.4", "H2 simplified LR: P(LR >= 3), .30 vs 0", .636, lr_pow(.30), "same")
info("  The printed .486/.306/.636 equal P(LR >= 9): %.3f / %.3f / %.3f (power_v2.R uses 2*s^2*log(3))",
     lr_pow(.25, 9), lr_pow(.20, 9), lr_pow(.30, 9))

# Registered model-comparison rule D (7.2 H2 step 4), simulated.
# Within-cell residuals for (PSR, W, G_halo) are drawn with the S1-2 within-cell SDs and
# correlations. dW_E = 0 in both worlds; E shifts G_halo by dG = per_pt_halo x 1.25 points.
# IMP world: E shifts PSR by b_G x dG. TONE world: E does not shift PSR.
cat("  simulating the registered D rule (400 sims x 400 within-cell bootstraps per world)...\n")
Sig <- diag(c(SD_PSR, SD_W, SD_G)) %*%
       matrix(c(1, R_WP, R_G_PSR, R_WP, 1, R_WG, R_G_PSR, R_WG, 1), 3) %*% diag(c(SD_PSR, SD_W, SD_G))
dG <- per_pt_halo * 1.25
cellmeans <- function(Y, cid) rowsum(Y, cid) / tabulate(cid)
d_stat <- function(Y) {               # Y: 272 x 3 (PSR, W, G), rows ordered by cell 1..4
  m  <- cellmeans(Y, cellid)          # 4 x 3 ; cells: (A-,E-),(A+,E-),(A-,E+),(A+,E+)
  bE <- (m[3, ] + m[4, ] - m[1, ] - m[2, ]) / 2
  R  <- Y - m[cellid, ]
  bW <- sum(R[, 1] * R[, 2]) / sum(R[, 2]^2); bG <- sum(R[, 1] * R[, 3]) / sum(R[, 3]^2)
  PT <- bW * bE[2]; PG <- bG * bE[3]
  abs(bE[1] - PG) - abs(bE[1] - PT)
}
sim_D <- function(world, nsim = 400, B = 400) {
  set.seed(42)
  out <- replicate(nsim, {
    Z <- mvrnorm(N, c(0, 0, 0), Sig)
    Y <- cbind(3 + .50 * cellA + (if (world == "IMP") B_G * dG * (cellE + .5) else 0),
               .40 + .28 * cellA, 4.5 + .80 * cellA + dG * (cellE + .5)) + Z
    Dobs <- d_stat(Y)
    bs <- replicate(B, { idx <- (cellid - 1) * n_cell + sample.int(n_cell, N, TRUE); d_stat(Y[idx, ]) })
    ci <- quantile(bs, c(.025, .975))
    c(imp = ci[2] < 0, tone = ci[1] > 0)
  })
  rowMeans(out)
}
Dimp <- sim_D("IMP"); Dtone <- sim_D("TONE")
info("  D rule, impression version true (b_E = %.3f, d = %.3f): P(impression favored) = %.3f; P(tone favored) = %.3f",
     B_G * dG, B_G * dG / SD_PSR, Dimp[1], Dimp[2])
info("  D rule, tone version true (b_E = 0, dG_halo = %.3f): P(tone favored) = %.3f; P(impression favored) = %.3f",
     dG, Dtone[2], Dtone[1])
claim("H2g", "7.2 (H2 step 4)", "registered D rule: P(correct version favored), impression true", NA, Dimp[1], "400 x 400 bootstrap")
claim("H2h", "7.2 (H2 step 4)", "registered D rule: P(correct version favored), tone true", NA, Dtone[2], "400 x 400 bootstrap")

# =============================================================================
# 6. H3 interaction (2.3; 4.4)
# =============================================================================
cat("\n==== 6. H3 ====\n")
se_int <- sqrt(4 / n_cell)
claim("H3a", "2.3/4.4", "95% CI half-width, difference of simple effects (d)", .48, 1.96 * se_int, "1.96*sqrt(4/68)", tol = .01)
ipow <- function(dd, a = .05) pnorm(dd / se_int - qnorm(1 - a / 2)) + pnorm(-dd / se_int - qnorm(1 - a / 2))
claim("H3b", "2.3/4.4", "interaction power, simple effects differ by d = .40 (analytic)", .378, ipow(.40), "normal")
claim("H3c", "4.4", "interaction power, d = .30", .236, ipow(.30), "normal")
claim("H3d", "4.4", "interaction power, d = .50", .540, ipow(.50), "normal")
set.seed(42)
ri <- replicate(NSIM, { y <- .40 * (cellE > 0) * (cellA > 0) + rnorm(N); sim_hc3_p(y, X4, 4)[2] < .05 })
claim("H3e", "4.4", "interaction power d = .40 (HC3 sim)", .376, mean(ri), "5000 sims")

# =============================================================================
# 7. S1, D2 and their Holm family (2.4; 4.4; 8.2; 8.8; 8.14)
# =============================================================================
cat("\n==== 7. S1, D2, Holm {S1, D2} ====\n")
sim_S1 <- function(b, sig = SIG_S1, a = .05, nsim = NSIM) {
  set.seed(42)
  mean(replicate(nsim, {
    z <- rnorm(N); y <- .55 * cellA + b * cellA * z + .10 * z + rnorm(N, sd = sig); zs <- as.numeric(scale(z))
    X <- cbind(1, cellA, zs, cellE, cellA * zs); r <- sim_hc3_p(y, X, 5); r[2] < a && r[1] > 0 }))
}
for (x in list(c(.44, .959, .927), c(.33, .792, .704), c(.22, .449, .338))) {
  claim("S1a", "4.4", sprintf("S1 power b = %.2f, alpha .05 (resid SD %.3f)", x[1], SIG_S1), x[2], sim_S1(x[1]), "5000 sims")
  claim("S1b", "4.4", sprintf("S1 power b = %.2f, alpha .025", x[1]), x[3], sim_S1(x[1], a = .025), "5000 sims")
}
# D2 alone at .05 (as printed) and under the registered Holm rule with S1.
# The S1 interaction estimate and the D2 main-effect estimate are nearly uncorrelated
# (different contrasts), so D2 is rejected iff p_D2 < .025, or p_D2 < .05 and p_S1 < .025.
pS1_025 <- c(b44 = sim_S1(.44, a = .025), b33 = sim_S1(.33, a = .025), b22 = sim_S1(.22, a = .025))
for (x in list(c(.25, .538), c(.30, .693), c(.40, .908), c(.52, .990))) {
  p05 <- pw(x[1]); p025 <- pw(x[1], a = .025)
  claim("D2a", "4.4", sprintf("D2 power d = %.2f at alpha .05 (as printed)", x[1]), x[2], p05, "pwr.t.test")
  for (k in names(pS1_025)) {
    holm <- p025 + (p05 - p025) * pS1_025[k]
    claim("D2b", "2.4/8.8", sprintf("D2 power d = %.2f, registered Holm rule, S1 %s", x[1], k), x[2], holm, "analytic Holm")
  }
}
# D2 falsifier (8.8): TOST on the A effect at +/-0.20 SD_t1
for (eb in c(.20, .30, .40))
  claim("D2c", "8.8/0.5", sprintf("D2 falsifier TOST power, bounds +/-%.2f SD, true effect 0", eb),
        NA, ptost(n_side, 0, 1, eb), "power_t_TOST")

# =============================================================================
# 8. D1 (4.4; 8.8)
# =============================================================================
cat("\n==== 8. D1 ====\n")
d1 <- function(rho, k = 1, g = .30, b = .30) {   # k = SD_t3 / SD_t1
  sdc <- sqrt(1 + k^2 - 2 * rho * k); se <- sdc * se_d
  c(det = pnorm(g / se - 1.96) + pnorm(-g / se - 1.96), tost = max(0, 2 * pnorm(b / se - qnorm(.95)) - 1))
}
for (x in list(c(.5, .696, .593), c(.6, .790, .738), c(.7, .891, .879))) {
  r <- d1(x[1])
  claim("D1a", "4.4", sprintf("D1 detect growth .30 SD, rho = %.1f", x[1]), x[2], r["det"], "normal")
  claim("D1b", "4.4", sprintf("D1 TOST +/-.30 SD at growth 0, rho = %.1f", x[1]), x[3], r["tost"], "normal")
  r2 <- d1(x[1], k = 1.25)
  info("    sensitivity SD_t3 = 1.25 x SD_t1: detect %.3f; TOST %.3f", r2["det"], r2["tost"])
}

# =============================================================================
# 9. U1 (4.4; 8.3)
# =============================================================================
cat("\n==== 9. U1 ====\n")
for (x in list(c(.26, .992), c(.17, .805), c(.15, .700)))
  claim("U1a", "4.4", sprintf("U1 power r = %.2f, N = 272", x[1]), x[2], pwr.r.test(n = N, r = x[1])$power, "pwr.r.test")
claim("U1b", "4.4", "U1 power r = .17 at alpha .025", .718, pwr.r.test(n = N, r = .17, sig.level = .025)$power, "pwr.r.test")
claim("U1c", "4.4", "floor N = 200: U1 power r = .17", .675, pwr.r.test(n = 200, r = .17)$power, "pwr.r.test")

# =============================================================================
# 10. M2 length equivalence (4.4; 8.4), SD from S1-2 (15.8) and planning SD 16
# =============================================================================
cat("\n==== 10. M2 ====\n")
sim_M2 <- function(ratio, s = 16) { set.seed(42); mean(replicate(NSIM, {
  mu <- c(100, 100 * ratio, 100, 100 * ratio)[cellid]               # A factor ratio; E null
  y <- rnorm(N, mu, s); cm <- tapply(y, cellid, mean); eb <- .075 * mean(cm)
  welch_tost_p(y[cellA > 0], y[cellA < 0], eb) < .05 })) }
for (x in list(c(1.00, .972), c(1.03, .766), c(1.05, .392), c(1.07, .102), c(1.107, .001)))
  claim("M2a", "4.4", sprintf("M2 factor TOST, ratio %.3f", x[1]), x[2], sim_M2(x[1]), "5000 sims, SD 16")
sim_M2c <- function(spread, s = 16) { set.seed(42); mean(replicate(NSIM, {
  mu <- 100 * c(1 + spread, 1, 1, 1 - spread)[cellid]; cm <- tapply(rnorm(N, mu, s), cellid, mean)
  all(abs(cm / mean(cm) - 1) <= .075) })) }
for (x in list(c(0, 1.000), c(.03, .993), c(.05, .868)))
  claim("M2b", "4.4", sprintf("M2 cell criterion, extreme cells at +/-%.0f%%", 100 * x[1]), x[2], sim_M2c(x[1]), "5000 sims")
claim("M2c", "8.4", "M2 joint decision at ratio 1.00 (factor TOSTs both + cell rule)", NA,
      { set.seed(42); mean(replicate(NSIM, { y <- rnorm(N, 100, 16); cm <- tapply(y, cellid, mean); eb <- .075 * mean(cm)
        welch_tost_p(y[cellA > 0], y[cellA < 0], eb) < .05 && welch_tost_p(y[cellE > 0], y[cellE < 0], eb) < .05 &&
        all(abs(cm / mean(cm) - 1) <= .075) })) }, "5000 sims")

# =============================================================================
# 11. Responsibility template: R1, R3, R4, R5, R6 (4.4; 8.9; 8.11)
# =============================================================================
cat("\n==== 11. R1, R3, R4, R5, R6 ====\n")
# R1: per-cell MVN of (company liab_1, Sylva liab_6, user liab_9) with S1-2 within-cell covariance
Rm <- cbind(wres("liab_1"), wres("liab_6"), wres("liab_9")); S_items <- cov(Rm)
r1_sim <- function(mu) { set.seed(42); mean(replicate(NSIM, {
  ok <- TRUE; uc <- c()
  for (k in 1:4) { Y <- mvrnorm(n_cell, mu, S_items); g <- Y[, 1] - Y[, 2]
    m <- colMeans(Y); lo <- mean(g) - qt(.975, n_cell - 1) * sd(g) / sqrt(n_cell)
    ok <- ok && (m[2] < m[1]) && (m[2] < m[3]) && lo > 0; uc <- c(uc, Y[, 3] - Y[, 1]) }
  ok && (mean(uc) - qt(.975, N - 1) * sd(uc) / sqrt(N)) > -.40 })) }
claim("R1a", "2.4/8.9", "R1 joint decision, S1-2 means (gap 1.12)", NA, r1_sim(c(3.41, 2.29, 3.67)), "5000 sims")
claim("R1b", "2.4/8.9", "R1 joint decision, predicted gap .80", NA, r1_sim(c(3.41, 2.61, 3.67)), "5000 sims")

# R3: analytic as printed, plus the gate test (linear vs one-breakpoint hinge, BIC) jointly
seb <- sqrt((1 - .14^2) / (N - 3))
claim("R3a", "4.4", "R3 SE of beta at N = 272", .060, seb, "sqrt((1-b^2)/(N-3))", tol = .005)
claim("R3b", "4.4", "R3 P(90% upper < .30 | beta = .14)", .843, pnorm((.30 - qnorm(.95) * seb - .14) / seb), "normal")
claim("R3c", "4.4", "R3 P(90% upper < .30 | beta = .20)", .505, pnorm((.30 - qnorm(.95) * seb - .20) / seb), "normal")
set.seed(42)
r3 <- replicate(2000, {
  x <- as.numeric(scale(sample(d$ma_total, N, TRUE) + rnorm(N, 0, .01)))
  y <- .14 * x + rnorm(N, 0, sqrt(1 - .14^2))
  Xb <- cbind(1, x, cellA, cellE, cellA * cellE); fl <- lm.fit(Xb, y)
  ub <- { XtXi <- chol2inv(qr.R(fl$qr)); s2 <- sum(fl$residuals^2) / (N - 5)
          fl$coefficients[2] + qt(.95, N - 5) * sqrt(s2 * XtXi[2, 2]) }
  cs <- quantile(x, seq(.10, .90, by = .02))
  rss <- min(sapply(cs, function(cc) sum(lm.fit(cbind(Xb, pmax(x - cc, 0)), y)$residuals^2)))
  bic_lin <- N * log(sum(fl$residuals^2) / N) + 6 * log(N); bic_seg <- N * log(rss / N) + 8 * log(N)
  c(ub = ub < .30, gate = exp((bic_lin - bic_seg) / 2) < 1) })
claim("R3d", "8.9", "R3 joint decision (upper90 < .30 and segmented BF10 < 1), beta = .14", NA, mean(r3[1, ] & r3[2, ]), "2000 sims")

# R4: bootstrap design analysis from pooled S1-2 (adding PSR, EC, Trust to MA + MP)
set.seed(42)
cat("  R4 bootstrap BF design analysis (300 resamples)...\n")
dd4 <- data.frame(y = d$liab_chat, c1 = as.numeric(d$cell == "S1_1"), c2 = as.numeric(d$cell == "S2_0"),
                  c3 = as.numeric(d$cell == "S2_1"), ma = d$ma_total, mp = d$mp_total,
                  psr = d$psr_total, ec = d$ec_total, tr = d$trust_total)
r4 <- replicate(300, { b <- dd4[sample(nrow(dd4), N, TRUE), ]
  1 / exp((lmBF(y ~ c1 + c2 + c3 + ma + mp + psr + ec + tr, data = b, progress = FALSE) /
           lmBF(y ~ c1 + c2 + c3 + ma + mp, data = b, progress = FALSE))@bayesFactor$bf) })
claim("R4a", "2.4/8.9", "R4 P(BF01 > 3) at N = 272 (S1-2 resampling)", NA, mean(r4 > 3), "300 bootstrap resamples")

# R5: Fisher-z power for the registered criteria at the S1-2 within-cell correlations
sez <- 1 / sqrt(N - 3)
p_cc <- pnorm((atanh(R5_cc) - (atanh(.30) + 1.96 * sez)) / sez)
eqr <- function(r) pnorm((atanh(.25) - qnorm(.95) * sez - atanh(r)) / sez) - pnorm((-atanh(.25) + qnorm(.95) * sez - atanh(r)) / sez)
claim("R5a", "2.4/8.9", "R5 P(r(company,Sylva) lower 95% > .30) at r = .567", NA, p_cc, "Fisher z")
claim("R5b", "2.4/8.9", "R5 joint (both user r 90% CIs within +/-.25) at r = -.086 / .000", NA, eqr(R5_uc) * eqr(R5_us), "Fisher z, independent")

# R6a, R6b
se6 <- 1.3 / sqrt(N)
claim("R6a", "4.4", "R6 P(95% lower >= .40 | gap .8, SD 1.3)", .999, pnorm((.8 - .40) / se6 - qt(.975, N - 1)), "normal")
claim("R6b", "4.4", "R6 P(90% upper < .40 | gap 0, SD 1.3)", .9995, pnorm(.40 / se6 - qt(.95, N - 1)), "normal")
for (g in c(.5, .6)) info("  R6 'no standing' power at gap %.1f: %.3f; at SD 1.6: %.3f", g,
                          pnorm((g - .40) / se6 - 1.97), pnorm((g - .40) / (1.6 / sqrt(N)) - 1.97))
se6b <- 1.2 / sqrt(N)
claim("R6c", "4.4", "R6b single comparison power, discount diff .20, paired SD 1.2", .785, pnorm(.20 / se6b - 1.96), "normal")
claim("R6d", "4.4", "R6b single comparison power, diff .30", .985, pnorm(.30 / se6b - 1.96), "normal")
# registered R6b decision needs BOTH Sylva-user and Sylva-company > 0 (p < .05); the two
# differences share Sylva's discount (corr .5 when the three discounts have equal variance)
r6b <- function(delta) { set.seed(42); s <- 1.2 / sqrt(2 * (1 - .3)); Sg <- s^2 * matrix(c(1, .3, .3, .3, 1, .3, .3, .3, 1), 3)
  mean(replicate(NSIM, { Y <- mvrnorm(N, c(delta, 0, 0), Sg); a <- Y[, 1] - Y[, 2]; b <- Y[, 1] - Y[, 3]
    t.test(a)$p.value < .05 && mean(a) > 0 && t.test(b)$p.value < .05 && mean(b) > 0 })) }
claim("R6e", "8.11", "R6b registered decision (both differences), diff .20", .785, r6b(.20), "5000 sims, corr .5")
claim("R6f", "8.11", "R6b registered decision (both differences), diff .30", .985, r6b(.30), "5000 sims, corr .5")

# =============================================================================
# 12. R2c / R2d: every Bayes factor BF01 > 3 under the null (8.10)
# =============================================================================
cat("\n==== 12. R2c/R2d ====\n")
Rv <- cor(cbind(wres("liab_chat"), wres("liab_user"), wres("liab_harm")))
set.seed(42)
TA <- mvrnorm(100000, rep(0, 3), Rv); TE <- mvrnorm(100000, rep(0, 3), Rv)
allok <- rowSums(abs(TA) < tlow) == 3 & rowSums(abs(TE) < tlow) == 3
claim("R2cA", "8.10", "P(BF01 > 3 for each single BF | d = 0)", NA, P_null, "exact")
claim("R2cB", "2.4/8.10", "R2c: P(all six main-effect BF01 > 3 | all d = 0)", NA, mean(allok), "MVN of t, S1-2 outcome correlations")
info("  expected number of the six BF01 > 3: %.2f", 6 * P_null)
nOK <- rowSums(abs(TA) < tlow) + rowSums(abs(TE) < tlow); nBAD <- rowSums(abs(TA) > t3) + rowSums(abs(TE) > t3)
info("  R2c alternatives under the null: P(>= 5 of 6 BF01 > 3) = %.3f; P(>= 4 of 6) = %.3f; P(no BF10 > 3) = %.3f; P(>= 5 of 6 and no BF10 > 3) = %.3f",
     mean(nOK >= 5), mean(nOK >= 4), mean(nBAD == 0), mean(nOK >= 5 & nBAD == 0))
Rv2 <- matrix(c(1, R5_cc, R5_uc, .6, R5_cc, 1, R5_us, -.5, R5_uc, R5_us, 1, -.05, .6, -.5, -.05, 1), 4)
Rv2 <- as.matrix(Matrix::nearPD(Rv2, corr = TRUE)$mat)
TA <- mvrnorm(100000, rep(0, 4), Rv2); TE <- mvrnorm(100000, rep(0, 4), Rv2)
claim("R2dB", "2.4/8.10", "R2d: P(all eight BF01 > 3 | all d = 0) (proxy correlations)", NA,
      mean(rowSums(abs(TA) < tlow) == 4 & rowSums(abs(TE) < tlow) == 4), "MVN of t")
nOK2 <- rowSums(abs(TA) < tlow) + rowSums(abs(TE) < tlow); nBAD2 <- rowSums(abs(TA) > t3) + rowSums(abs(TE) > t3)
info("  R2d alternatives under the null: P(>= 7 of 8) = %.3f; P(>= 6 of 8) = %.3f; P(no BF10 > 3) = %.3f; P(>= 6 of 8 and no BF10 > 3) = %.3f",
     mean(nOK2 >= 7), mean(nOK2 >= 6), mean(nBAD2 == 0), mean(nOK2 >= 6 & nBAD2 == 0))

# =============================================================================
# 13. O1 (4.4; 8.13)
# =============================================================================
cat("\n==== 13. O1 ====\n")
claim("O1a", "4.4", "O1 order TOST +/-0.40 SD, true 0 (analytic)", .902, 2 * pnorm(.40 / se_d - qnorm(.95)) - 1, "normal")
set.seed(42)
ordv <- rep(rep(c(-.5, .5), each = n_cell / 2), 4)      # orders balanced within cell (blocks of 8)
XO <- cbind(1, cellA, cellE, cellA * cellE, ordv, cellA * ordv, cellE * ordv)
ro <- replicate(NSIM, { y <- .40 * cellA + .24 * cellE + rnorm(N)
  sw <- sqrt(sum(tapply(y, cellid, var) * (n_cell - 1)) / (N - 4))
  c(tost = welch_tost_p(y[ordv > 0], y[ordv < 0], .40 * sw) < .05, ao = sim_hc3_p(y, XO, 6)[2] >= .05) })
claim("O1b", "4.4", "O1 order TOST (sim, with A and E effects)", .902, mean(ro[1, ]), "5000 sims")
claim("O1c", "8.13", "O1 joint 'order-robust' (TOST and A:O p >= .05), no order effects", NA, mean(ro[1, ] & ro[2, ]), "5000 sims")
claim("O1d", "4.4", "A x order interaction power, d = .40", .378, ipow(.40), "normal")

# =============================================================================
# 14. Stopping rule (4.3; 4.5): cap, achieved N, cell balance
# =============================================================================
cat("\n==== 14. Stopping rule ====\n")
for (r in c(e2["rate"], EX_POOL, e1["rate"], .08, .09, .10))
  info("  exclusion rate %.3f: P(cap of 300 completed binds before 272 analyzable) = %.3f; expected completed sessions for 272 = %.0f",
       r, pbinom(28, 300, r, lower.tail = FALSE), 272 / (1 - r))
# process simulation: permuted blocks of 8 (cell x order) at assignment; post-assignment
# attrition (no completion) a; exclusion of completed sessions e; stop at 272 analyzable or
# 300 completed; k in-progress sessions finish after closure.
sim_collect <- function(a, e, inprog = 4, nsim = 2000) { set.seed(42)
  t(replicate(nsim, {
    an <- 0; comp <- 0; cells <- integer(0)
    while (an < 272 && comp < 300) {
      blk <- sample(rep(1:4, 2))
      for (k in blk) { if (an >= 272 || comp >= 300) break
        if (runif(1) > a) { comp <- comp + 1; if (runif(1) > e) { an <- an + 1; cells <- c(cells, k) } } } }
    extra <- rbinom(1, inprog, (1 - a) * (1 - e)); cells <- c(cells, sample(1:4, extra, TRUE))
    tb <- tabulate(cells, 4); c(N = length(cells), comp = comp, capbind = comp >= 300 && an < 272, minc = min(tb), maxc = max(tb),
      pwrH1 = pwr.t2n.test(n1 = tb[1] + tb[3], n2 = tb[2] + tb[4], d = .40)$power) }))
}
for (sc in list(c(.10, EX_POOL), c(.10, e1["rate"]), c(.15, .09))) {
  s <- sim_collect(sc[1], sc[2])
  info("  attrition %.2f, exclusion %.3f: final N median %d [%d-%d]; P(cap binds) %.3f; min cell 5th pct %d; max cell 95th pct %d; H1 power at d = .40: %.3f",
       sc[1], sc[2], as.integer(median(s[, "N"])), as.integer(min(s[, "N"])), as.integer(max(s[, "N"])), mean(s[, "capbind"]),
       as.integer(quantile(s[, "minc"], .05)), as.integer(quantile(s[, "maxc"], .95)), mean(s[, "pwrH1"]))
}

# =============================================================================
# 15. Write ledger
# =============================================================================
write.csv(LED, file.path(OUT, "power_check_results.csv"), row.names = FALSE)
cat("\nClaims checked:", nrow(LED), "| flagged DIFF>.05:", sum(LED$flag == "DIFF>.05"), "\n")
print(LED[LED$flag == "DIFF>.05", c("id", "quantity", "claimed", "recomputed")], row.names = FALSE)
sessionInfo()
