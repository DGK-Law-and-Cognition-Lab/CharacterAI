# =============================================================================
# Study 3 preregistration mock run: synthetic-data generator
# -----------------------------------------------------------------------------
# Produces SYNTHETIC Pavlovia session records with the v0.3 staging build's column
# names (taken from the harness output header, Analysis/Study 3/experiment/test/output),
# plus the two analysis inputs that come from outside the experiment:
#   (1) frozen tone-probe scores (W, R, A) per model-generated Sylva reply (prereg §6.10.1)
#   (2) LLM chat-turn consensus codes (emotional_self_disclosure, mirroring_user_emotion),
#       participant-level hypothesis-guess and round-1-fit flags, and a reliability table.
#
# Realism: numeric item responses are resampled from Studies 1-2 donor rows (pre-chat
# blocks as is; post-chat items centred within the donor's original condition, then the
# PLANTED Study 3 effects are added and the items are stochastically re-rounded).
# NO participant text is read or reused: every chat message, open-ended answer and
# free-text field in the output is placeholder text built from a fixed nonsense
# vocabulary. Donor rows contribute only numbers and per-person summary rates.
#
# Revision 3 (prereg draft of 2026-10-16) updates, none of which consumes a random draw,
# so the synthetic data are otherwise identical to the revision-2 mock run:
#   - materials (prompts, scripts, hashes) are read from the revision-3 prereg file;
#   - the comprehension-check option code is 'unsure' (as the build writes it; §9.2 rule 5);
#   - one regular session is recorded with pavlovia_pilot_mode = 'true' (§9.2 rule 1);
#   - one session has a model reply without finish_reason (§6.9; §9.1 check 8);
#   - the simulated round-1 fit flag carries the registered code name reply_ignores_direct_question (§6.10).
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(jsonlite)
  library(openssl)
  library(arrow)
})

# ---- paths -------------------------------------------------------------------
s3_paths <- function(analysis_root) {
  list(
    s1      = file.path(analysis_root, "Study 1", "data", "processed", "analytic_data.csv"),
    s2      = file.path(analysis_root, "Study 2", "data", "processed", "analytic_data.csv"),
    chat1   = file.path(analysis_root, "Study 1", "data", "derived", "chat_coding", "chat_participant_features.parquet"),
    chat2   = file.path(analysis_root, "Study 2", "data", "derived", "chat_coding", "chat_participant_features.parquet"),
    tone    = file.path(analysis_root, "CrossStudy", "measurement", "bot_turn_tone_probes.csv"),
    harness = file.path(analysis_root, "Study 3", "experiment", "test", "output"),
    prereg  = file.path(dirname(analysis_root), "Docs", "Preregistration",
                        "Study3_Preregistration_FINAL.md")   # the preregistration as posted on OSF
  )
}

norm_id <- function(x) sub("^0+(?=.)", "", trimws(as.character(x)), perl = TRUE)
clip <- function(x, lo, hi) pmin(pmax(x, lo), hi)
stoch_round <- function(x, lo, hi) clip(round(x + runif(length(x), -0.5, 0.5)), lo, hi)
sha256_txt <- function(x) as.character(openssl::sha256(enc2utf8(x)))

# ---- materials from the preregistration (prompts, scripts, expected hashes) ----
parse_prereg_materials <- function(prereg_path) {
  L <- readLines(prereg_path, encoding = "UTF-8", warn = FALSE)
  i0 <- grep("^Full text of the HighA_HighE prompt", L)
  cb <- which(L == "```"); cb <- cb[cb > i0][1:2]
  hh <- paste(L[(cb[1] + 1):(cb[2] - 1)], collapse = "\n")
  getq <- function(header) {
    i <- grep(header, L, fixed = TRUE)[1]; j <- i + 1
    while (!startsWith(L[j], "> ")) j <- j + 1
    sub("^> ", "", L[j])
  }
  HIGH_A <- getq("**HIGH_A (unchanged"); LOW_A <- getq("**LOW_A (unchanged")
  HIGH_E <- getq("**HIGH_E (new");       LOW_E <- getq("**LOW_E (new")
  MODN   <- getq("**MOD_LOW_N (unchanged")
  stopifnot(grepl(HIGH_A, hh, fixed = TRUE), grepl(HIGH_E, hh, fixed = TRUE), grepl(MODN, hh, fixed = TRUE))
  prompts <- list(
    HighA_HighE = hh,
    HighA_LowE  = sub(HIGH_E, LOW_E, hh, fixed = TRUE),
    LowA_HighE  = sub(HIGH_A, LOW_A, hh, fixed = TRUE),
    LowA_LowE   = sub(HIGH_E, LOW_E, sub(HIGH_A, LOW_A, hh, fixed = TRUE), fixed = TRUE)
  )
  hrow <- grep("^\\| (HighA|LowA)_(HighE|LowE) \\| [0-9,]+ \\| `[0-9a-f]{64}` \\|$", L, value = TRUE)
  expected_prompt_sha <- setNames(sub(".*`([0-9a-f]{64})`.*", "\\1", hrow),
                                  sub("^\\| ([A-Za-z_]+) \\|.*", "\\1", hrow))
  hdr <- c(HighA_HighE = "**Warm, outgoing (HIGH_A × HIGH_E)**",
           HighA_LowE  = "**Warm, reserved (HIGH_A × LOW_E)**",
           LowA_HighE  = "**Cold, outgoing (LOW_A × HIGH_E)**",
           LowA_LowE   = "**Cold, reserved (LOW_A × LOW_E)**")
  scripts <- lapply(hdr, function(h) {
    i <- which(L == h); stopifnot(length(i) == 1)
    s0 <- grep("^> S0: ", L[(i + 1):(i + 6)], value = TRUE); s1 <- grep("^> S1: ", L[(i + 1):(i + 6)], value = TRUE)
    c(S0 = sub("^> S0: ", "", s0), S1 = sub("^> S1: ", "", s1))
  })
  opener <- "Hello! I just arrived at the edge of the Valmeer Forest and noticed you. Who are you?"
  list(prompts = prompts, expected_prompt_sha = expected_prompt_sha, scripts = scripts, opener = opener)
}

# ---- harness header (column names of the v0.3 build) --------------------------
harness_header <- function(harness_dir) {
  f <- file.path(harness_dir, "HighA_HighE_bonding_first.csv")
  h <- readLines(f, n = 1, encoding = "UTF-8", warn = FALSE)
  scan(text = h, what = "", sep = ",", quote = "\"", quiet = TRUE)
}

# ---- donors (numbers only) ----------------------------------------------------
ITEMS_PRE  <- c(paste0("tipi_self_", 1:10), paste0("gaais_", 1:20), paste0("phq4_", 1:4))
DEMO_CODES <- c("d_age", "d_gender", "d_education", "d_politics", "d_ai_freq", "d_training",
                "d_legal_knowledge", "d_jury", "d_free_speech_1", "d_free_speech_2",
                "d_chatbot_experience", "d_chatbot_use_cases", "d_social_media", "d_tech_comfort",
                "d_tech_trust", "d_race", "d_employment", "d_religiosity", "d_device",
                "d_distractions", "d_english_proficiency", "d_fullscreen")
ITEMS_POST <- c(paste0("tipi_bot_", 1:10), "mc_extraversion", "mc_agreeableness", "mc_neuroticism",
                paste0("psr_", 1:12), paste0("ec_", 1:5), paste0("tr_", 1:4), paste0("et_", 1:8),
                paste0("ma_", 1:8), paste0("mp_", 1:8), paste0("liab_", 1:12))

load_donors <- function(P) {
  rd <- function(f, s) { a <- read.csv(f, colClasses = c(sona_id = "character"), check.names = FALSE); a$study <- s; a }
  a <- bind_rows(rd(P$s1, 1)[, c("study", "sona_id", "condition_label", ITEMS_PRE, DEMO_CODES, ITEMS_POST)],
                 rd(P$s2, 2)[, c("study", "sona_id", "condition_label", ITEMS_PRE, DEMO_CODES, ITEMS_POST)])
  a$id <- norm_id(a$sona_id)
  tone <- read.csv(P$tone, colClasses = c(sona_id = "character")); tone$id <- norm_id(tone$sona_id)
  tp <- tone %>% group_by(study, id) %>%
    summarise(W = mean(W), R = mean(R), Aaff = mean(A), bot_words = mean(n_words), .groups = "drop")
  rp <- function(f, s) {
    x <- as.data.frame(arrow::read_parquet(f))[, c("sona_id", "pct_emotional_self_disclosure", "n_user_turns", "mean_user_words_per_turn")]
    x$sona_id <- if (is.numeric(x$sona_id)) format(x$sona_id, scientific = FALSE, trim = TRUE) else as.character(x$sona_id)
    x$study <- s; x
  }
  ch <- bind_rows(rp(P$chat1, 1), rp(P$chat2, 2))
  ch$id <- norm_id(ch$sona_id); ch$sona_id <- NULL
  d <- a %>% left_join(tp, by = c("study", "id")) %>% left_join(ch, by = c("study", "id"))
  stopifnot(!anyNA(d$W), !anyNA(d$pct_emotional_self_disclosure))
  # Study 1's mc_neuroticism was a different (bipolar) item: replace with Study 2 donor values
  s1 <- d$study == 1
  d$mc_neuroticism[s1] <- sample(d$mc_neuroticism[!s1], sum(s1), replace = TRUE)
  # centre post-chat items (and tone) within the donor's original condition
  for (v in ITEMS_POST) d[[paste0(v, "_c")]] <- d[[v]] - ave(d[[v]], d$condition_label) + mean(d[[v]])
  for (v in c("W", "R", "Aaff")) d[[paste0(v, "_dev")]] <- d[[v]] - ave(d[[v]], d$condition_label)
  psr_c <- rowMeans(d[, paste0("psr_", 1:12, "_c")])
  d$zpsr <- as.numeric(scale(psr_c))
  d$aself_z_pool <- as.numeric(scale(((8 - d$tipi_self_2) + d$tipi_self_7) / 2))
  for (it in c("liab_1", "liab_6", "liab_9")) d[[paste0("z_", it)]] <- as.numeric(scale(d[[paste0(it, "_c")]]))
  d$sona_id <- NULL; d$id <- NULL
  d
}

# ---- planted effects ----------------------------------------------------------
# Raw-unit shifts for a +1 change in the ±0.5-coded factor (i.e., high - low).
# PSR shifts are slightly inflated relative to the target d (.50 / .25) to offset the
# attenuation from item clamping; the realised population values are computed by
# population_truth() and reported in the Rmd.
planted_effects <- function() list(
  label   = "planted",
  psr     = c(A = 0.54, E = 0.27, AE = 0), psr_S1 = 0.25, psr_order = 0,
  ec      = c(A = 0.30, E = 0.12), tr = c(A = 0.25, E = 0.10), et = c(A = 0.15, E = 0.05),
  ma      = c(A = 0.20, E = 0.08), mp = c(A = 0.10, E = 0.05), liab = c(A = 0, E = 0),
  tipi    = list(extra = c(A = 0.50, E = 1.50), agree = c(A = 2.00, E = 0.315),
                 consc = c(A = 0.70, E = 0.30), emostab = c(A = 0.65, E = 0.405),
                 open = c(A = 0.60, E = 0.615)),
  mc      = list(mc_agreeableness = c(A = 1.3, E = 0.2), mc_extraversion = c(A = 0.3, E = 1.0),
                 mc_neuroticism = c(A = -0.2, E = 0), mc_e_energetic = c(A = 0.3, E = 1.1),
                 mc_length = c(A = 0, E = 0)),
  W       = c(base = 0.40, A = 0.28, E = 0), R = c(base = 0.17, A = -0.16, E = 0),
  Aaff    = c(base = 0.26, A = -0.12, E = 0),
  tokens  = c(base = 100, A = 0, E = 0),
  ios     = c(A_t1 = 0.40, A_growth = 0, E_t1 = 0.20, E_growth = 0),
  v2      = c(A = 0, E = 0, gap = 0.8),
  u2      = c(p_disc = 0.54, p_nodisc = 0.05)
)

null_effects <- function() {
  e <- planted_effects(); e$label <- "null"
  zero <- function(v) { v[names(v) %in% c("A", "E", "AE")] <- 0; v }
  for (k in c("psr", "ec", "tr", "et", "ma", "mp", "liab", "W", "R", "Aaff", "tokens", "v2")) e[[k]] <- zero(e[[k]])
  e$psr_S1 <- 0; e$psr_order <- 0
  e$tipi <- lapply(e$tipi, zero); e$mc <- lapply(e$mc, zero)
  e$ios[] <- 0
  e
}

# ---- person-level generation (shared by the mock records and the null simulation) ----
gen_persons <- function(A, E, O, eff, donors) {
  n <- length(A)
  D <- donors[sample.int(nrow(donors), n, replace = TRUE), ]
  out <- D[, c(ITEMS_PRE, DEMO_CODES)]
  sh <- function(v) eff[[v]][["A"]] * A + eff[[v]][["E"]] * E
  put <- function(items, shift, lo, hi) for (it in items) out[[it]] <<- stoch_round(D[[paste0(it, "_c")]] + shift, lo, hi)
  put(paste0("psr_", 1:12), sh("psr") + eff$psr[["AE"]] * A * E + eff$psr_S1 * A * D$aself_z_pool + eff$psr_order * O, 1, 5)
  put(paste0("ec_", 1:5), sh("ec"), 1, 5); put(paste0("tr_", 1:4), sh("tr"), 1, 5)
  put(paste0("et_", 1:8), sh("et"), 1, 5); put(paste0("ma_", 1:8), sh("ma"), 1, 5)
  put(paste0("mp_", 1:8), sh("mp"), 1, 5); put(paste0("liab_", 1:12), sh("liab"), 1, 5)
  keyed <- list(extra = c(1, 6), agree = c(7, 2), consc = c(3, 8), emostab = c(9, 4), open = c(5, 10))
  for (k in names(keyed)) {
    s <- eff$tipi[[k]][["A"]] * A + eff$tipi[[k]][["E"]] * E
    put(paste0("tipi_bot_", keyed[[k]][1]),  s, 1, 7)
    put(paste0("tipi_bot_", keyed[[k]][2]), -s, 1, 7)
  }
  for (k in c("mc_agreeableness", "mc_extraversion", "mc_neuroticism"))
    put(k, eff$mc[[k]][["A"]] * A + eff$mc[[k]][["E"]] * E, 1, 5)
  s_en <- eff$mc$mc_e_energetic[["A"]] * A + eff$mc$mc_e_energetic[["E"]] * E
  out$mc_e_energetic <- stoch_round(0.8 * D$mc_extraversion_c + 0.7 + s_en + rnorm(n, 0, 0.6), 1, 5)
  s_len <- eff$mc$mc_length[["A"]] * A + eff$mc$mc_length[["E"]] * E
  out$mc_length <- stoch_round(3 + 0.25 * as.numeric(scale(D$bot_words)) + s_len + rnorm(n, 0, 0.9), 1, 5)
  # tone (person means over model-generated replies)
  out$W_true    <- clip(eff$W[["base"]] + eff$W[["A"]] * A + eff$W[["E"]] * E + D$W_dev, 0.02, 0.98)
  out$R_true    <- clip(eff$R[["base"]] + eff$R[["A"]] * A + eff$R[["E"]] * E + D$R_dev, 0.01, 0.98)
  out$Aaff_true <- clip(eff$Aaff[["base"]] + eff$Aaff[["A"]] * A + eff$Aaff[["E"]] * E + D$Aaff_dev, 0.01, 0.98)
  out$tok_mean  <- eff$tokens[["base"]] + eff$tokens[["A"]] * A + eff$tokens[["E"]] * E + rnorm(n, 0, 14)
  # closeness probes (IOS 1-7): latent closeness tied to the donor's within-cell PSR
  z <- D$zpsr; u3 <- rnorm(n)
  L3 <- 0.75 * z + 0.66 * u3
  L1 <- 0.50 * z + 0.34 * u3 + rnorm(n, 0, 0.796)
  L2 <- 0.62 * z + 0.50 * u3 + rnorm(n, 0, 0.604)
  sig <- 1.3
  gA <- function(t) eff$ios[["A_t1"]] + eff$ios[["A_growth"]] * t
  gE <- function(t) eff$ios[["E_t1"]] + eff$ios[["E_growth"]] * t
  out$ios_t1 <- clip(round(3.0 + sig * (L1 + gA(0) * A + gE(0) * E)), 1, 7)
  out$ios_t2 <- clip(round(3.3 + sig * (L2 + gA(.5) * A + gE(.5) * E)), 1, 7)
  out$ios_t3 <- clip(round(3.5 + sig * (L3 + gA(1) * A + gE(1) * E)), 1, 7)
  # vignette 2 (party latents follow the vignette-1 template; no persona effect unless planted)
  zc <- 0.50 * D$z_liab_1 + rnorm(n, 0, 0.866)
  zs <- 0.45 * D$z_liab_6 + 0.35 * zc + rnorm(n, 0, 0.78)
  zu <- 0.50 * D$z_liab_9 + rnorm(n, 0, 0.866)
  v2sh <- eff$v2[["A"]] * A + eff$v2[["E"]] * E
  gap <- eff$v2[["gap"]]
  mk <- function(mu, z) clip(round(mu + 0.95 * z + rnorm(n, 0, 0.6) + v2sh), 1, 5)
  out$v2_resp_company  <- mk(3.40, zc); out$v2_resp_sylva  <- mk(3.40 - gap, zs); out$v2_resp_user  <- mk(3.20, zu)
  out$v2_cause_company <- mk(2.80, zc); out$v2_cause_sylva <- mk(3.90, zs);       out$v2_cause_user <- mk(3.40, zu)
  out$v2_oblig_company <- mk(3.90, zc); out$v2_oblig_sylva <- mk(2.80, zs);       out$v2_oblig_user <- mk(3.00, zu)
  out$v2_severity      <- clip(round(4.0 + 0.4 * D$z_liab_1 + rnorm(n, 0, 0.8)), 1, 5)
  # chat-level person parameters
  out$p_disc  <- clip(D$pct_emotional_self_disclosure, 0.01, 0.90)
  out$n_sends <- as.integer(clip(D$n_user_turns, 3, 60))
  low <- runif(n) < 0.05
  out$n_sends[low] <- sample(3:10, sum(low), replace = TRUE)
  out$user_words <- clip(D$mean_user_words_per_turn, 3, 60)
  out$A <- A; out$E <- E; out$O <- O
  out
}

# ---- population truth (large-N draw of the same generator) -------------------
population_truth <- function(eff, donors, n = 200000, seed = 4242) {
  old <- if (exists(".Random.seed", envir = globalenv())) get(".Random.seed", envir = globalenv()) else NULL
  set.seed(seed)
  A <- sample(c(-.5, .5), n, TRUE); E <- sample(c(-.5, .5), n, TRUE); O <- sample(c(-.5, .5), n, TRUE)
  p <- gen_persons(A, E, O, eff, donors)
  if (!is.null(old)) assign(".Random.seed", old, envir = globalenv())
  tr <- function(i, j) (p[[paste0("tipi_bot_", i)]] + (8 - p[[paste0("tipi_bot_", j)]])) / 2
  p$psr <- rowMeans(p[, paste0("psr_", 1:12)]); p$corp <- rowMeans(p[, paste0("liab_", 1:5)])
  p$t_extra <- tr(1, 6); p$t_agree <- ((8 - p$tipi_bot_2) + p$tipi_bot_7) / 2
  p$t_consc <- tr(3, 8); p$t_emostab <- ((8 - p$tipi_bot_4) + p$tipi_bot_9) / 2; p$t_open <- tr(5, 10)
  p$G_halo <- (p$t_consc + p$t_emostab + p$t_open) / 3
  p$ma <- rowMeans(p[, paste0("ma_", 1:8)]); p$mp <- rowMeans(p[, paste0("mp_", 1:8)]); p$et <- rowMeans(p[, paste0("et_", 1:8)])
  p$gap_v2 <- p$v2_resp_company - p$v2_resp_sylva
  coefA <- function(y, extra = NULL) {
    X <- cbind(1, p$A, p$E, p$A * p$E, extra); b <- qr.coef(qr(X), p[[y]]); b
  }
  wsd <- function(y) { r <- p[[y]] - ave(p[[y]], p$A, p$E); sqrt(sum(r^2) / (n - 4)) }
  msd <- function(y, f) { g <- p[[f]] > 0; sqrt(((sum(g) - 1) * var(p[[y]][g]) + (sum(!g) - 1) * var(p[[y]][!g])) / (n - 2)) }
  bA <- coefA("psr")[2]; bE <- coefA("psr")[3]
  bG <- coefA("psr", p$G_halo)[5]; bW <- coefA("psr", p$W_true)[5]
  dGE <- coefA("G_halo")[3]; dWE <- coefA("W_true")[3]
  S <- function(cov) 1 - coefA("psr", cov)[2] / bA
  ratio <- function(v) coefA(v)[3] / coefA("t_extra")[3]
  sd1 <- wsd("ios_t1")
  p$ios_change <- p$ios_t3 - p$ios_t1
  c(b_A_psr = unname(bA), b_E_psr = unname(bE),
    g_A_psr = unname(bA / msd("psr", "A")), g_E_psr = unname(bE / msd("psr", "E")),
    d_fact_A_psr = unname(bA / wsd("psr")), d_fact_E_psr = unname(bE / wsd("psr")),
    b_A_corp = unname(coefA("corp")[2]), b_E_corp = unname(coefA("corp")[3]),
    dW_A = unname(coefA("W_true")[2]), dW_E = unname(dWE),
    dG_A = unname(coefA("G_halo")[2]), dG_E = unname(dGE),
    b_W = unname(bW), b_G = unname(bG), P_T = unname(bW * dWE), P_G = unname(bG * dGE),
    D = unname(abs(bE - bG * dGE) - abs(bE - bW * dWE)),
    S_G = unname(S(p$G_halo)), S_MA = unname(S(p$ma)), S_MP = unname(S(p$mp)), S_ET = unname(S(p$et)),
    ratio_A = unname(ratio("t_agree")), ratio_C = unname(ratio("t_consc")),
    ratio_ES = unname(ratio("t_emostab")), ratio_O = unname(ratio("t_open")),
    b_E_tipiE = unname(coefA("t_extra")[3]), b_A_tipiA = unname(coefA("t_agree")[2]),
    ios_t1_A_d = unname(coefA("ios_t1")[2] / sd1), ios_change_A_delta = unname(coefA("ios_change")[2] / sd1),
    gap_v2 = mean(p$gap_v2), gap_v1 = mean(p$liab_1 - p$liab_6),
    r_corp_chat = cor(p$corp, rowMeans(p[, paste0("liab_", 6:8)])))
}

# ---- placeholder text (fixed nonsense vocabulary; never real text) -----------
VOCAB <- c("lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
           "eiusmod", "tempor", "incididunt", "labore", "magna", "aliqua", "veniam", "nostrud")
ph_text <- function(nw, question = FALSE, crlf = FALSE) {
  nw <- max(1, round(nw))
  w <- sample(VOCAB, nw, replace = TRUE)
  s <- paste(w, collapse = " ")
  if (nw > 12) { cut <- sample(6:(nw - 3), 1); s <- paste0(paste(w[1:cut], collapse = " "), ". ", paste(w[(cut + 1):nw], collapse = " ")) }
  s <- paste0("[synthetic] ", s, if (question) "?" else ".")
  if (crlf) s <- sub(". ", ".\r\n", s, fixed = TRUE)
  s
}

# ---- session plan ---------------------------------------------------------------
CELLS  <- c("HighA_HighE", "HighA_LowE", "LowA_HighE", "LowA_LowE")
ORDERS <- c("impression_first", "bonding_first")

perm_block_assign <- function(n) {
  combos <- expand.grid(cell = CELLS, order = ORDERS, stringsAsFactors = FALSE)
  nb <- ceiling(n / 8)
  idx <- unlist(lapply(seq_len(nb), function(b) sample(8)))[seq_len(n)]
  combos[idx, ]
}

make_session_plan <- function(n_main = 296, n_test = 16, n_fallback = 8) {
  plan <- tibble(k = seq_len(n_main), role = "regular", stage = "complete", sona_id = NA_character_)
  ids <- as.character(sample(100000:999999, n_main + 10))
  plan$sona_id <- ids[seq_len(n_main)]
  pick <- function(m, from = which(plan$role == "regular")) sort(sample(from, m))
  # duplicate SONA IDs (earlier session always has the smaller k)
  dp <- pick(6, which(plan$role == "regular" & plan$k > 20 & plan$k < 280))
  dp <- matrix(dp, ncol = 2, byrow = TRUE)
  plan$role[dp[1, ]] <- c("dup_partial_after_chat_first", "dup_complete_second_A")
  plan$stage[dp[1, 1]] <- "post_chat"
  plan$role[dp[2, ]] <- c("dup_complete_first", "dup_complete_second_B")
  plan$role[dp[3, ]] <- c("dup_partial_prechat_first", "dup_complete_second_C")
  plan$stage[dp[3, 1]] <- "pre_chat"
  for (r in 1:3) plan$sona_id[dp[r, 2]] <- plan$sona_id[dp[r, 1]]
  # incomplete single sessions
  ip <- pick(6); plan$role[ip] <- "partial_single"
  plan$stage[ip] <- c("pre_chat", "pre_chat", "chat_turn", "chat_turn", "post_chat", "post_chat")
  # exclusion triggers among the remaining regular complete sessions
  for (r in c(rep("attn_fail", 4), rep("comp_fail", 4), "ai_used", rep("not_serious", 2), rep("prior_yes", 2)))
    plan$role[pick(1)] <- r
  plan$flag_attn_retry_pass <- FALSE; plan$flag_attn_retry_pass[pick(6)] <- TRUE
  plan$flag_prior_notsure <- FALSE; plan$flag_prior_notsure[pick(3)] <- TRUE
  plan$flag_bad_hash <- FALSE;  plan$flag_bad_hash[pick(1)] <- TRUE
  plan$flag_many_err <- FALSE;  plan$flag_many_err[pick(2)] <- TRUE
  plan$flag_lead0 <- FALSE;     l0 <- pick(1); plan$flag_lead0[l0] <- TRUE
  plan$sona_id[l0] <- paste0("0", plan$sona_id[l0])
  plan$flag_pid_mismatch <- FALSE; plan$flag_pid_mismatch[pick(1)] <- TRUE
  plan$age_override <- NA_character_; ao <- pick(3); plan$age_override[ao] <- c("17", "1821", "20.5")
  plan$cb_source <- "worker"; fb <- pick(n_fallback, seq_len(n_main)); plan$cb_source[fb] <- "fallback_random"
  # assignment: worker slots in time order, permuted blocks of 8; fallback = uniform / .5
  wk <- which(plan$cb_source == "worker")
  asg <- perm_block_assign(length(wk))
  plan$cell <- NA_character_; plan$order <- NA_character_; plan$cb_slot <- NA_integer_
  plan$cell[wk] <- asg$cell; plan$order[wk] <- asg$order; plan$cb_slot[wk] <- seq_along(wk) - 1L
  plan$cell[fb] <- sample(CELLS, length(fb), TRUE); plan$order[fb] <- sample(ORDERS, length(fb), TRUE)
  plan$order_source <- plan$cb_source
  # TEST sessions: separate counter, own SONA IDs
  tst <- tibble(k = n_main + seq_len(n_test), role = "test", stage = "complete",
                sona_id = c(sprintf("TEST%02d", 1:(n_test - 2)), "test_ra1", "Test-DGK"),
                cb_source = "test", order_source = "test")
  ta <- perm_block_assign(n_test)
  tst$cell <- ta$cell; tst$order <- ta$order; tst$cb_slot <- seq_len(n_test) - 1L
  plan <- bind_rows(plan, tst)
  # calendar: TEST sessions first 10 days, participants afterwards
  t0 <- as.POSIXct("2027-01-11 17:00:00", tz = "UTC")
  plan$start <- t0 + c(cumsum(runif(n_main, 3600, 4 * 3600)) + 10 * 86400,
                       sort(runif(n_test, 0, 9 * 86400)))
  plan$is_test <- plan$cb_source == "test"
  # Revision 3: two deterministic flags (no random draw, so the rest of the data are unchanged).
  # The last two plain regular worker sessions become (i) a Pavlovia pilot-link session (§9.2 rule 1)
  # and (ii) a session whose first model reply lacks finish_reason (§6.9, §9.1 check 8).
  cand <- which(plan$role == "regular" & plan$cb_source == "worker" & !plan$is_test &
                !(plan$flag_bad_hash %in% TRUE) & !(plan$flag_many_err %in% TRUE) & !(plan$flag_lead0 %in% TRUE) &
                !(plan$flag_pid_mismatch %in% TRUE) & is.na(plan$age_override) &
                !(plan$flag_attn_retry_pass %in% TRUE) & !(plan$flag_prior_notsure %in% TRUE))
  plan$flag_pilot <- FALSE; plan$flag_pilot[max(cand)] <- TRUE
  plan$flag_missing_finish <- FALSE; plan$flag_missing_finish[max(setdiff(cand, max(cand)))] <- TRUE
  plan
}

# ---- record builder -----------------------------------------------------------------
iso <- function(t) format(t, "%Y-%m-%dT%H:%M:%OS3Z", tz = "UTC")

build_chat <- function(p, cell, mat, start_chat, is_partial_chat, flag_many_err, eff, flag_missing_finish = FALSE) {
  # returns list(log = list of entries, msgs = named list, meta = list, turns = data.frame)
  scr <- mat$scripts[[cell]]
  n <- p$n_sends; if (is_partial_chat) n <- max(2, min(n, sample(2:6, 1)))
  tmax <- 598
  el <- sort(round(c(6, runif(n - 1, 12, tmax))))
  first_q <- runif(1) < 0.15
  log <- list(list(role = "user_scripted", content = mat$opener, round = 0, ts = iso(start_chat)))
  log[[2]] <- list(role = "assistant", content = scr[["S0"]], scripted = TRUE, script_slot = "S0", round = 0,
                   ts = iso(start_chat + 4.7), elapsed = 4, delay_ms = min(6000, max(2000, 1500 + 8 * nchar(scr[["S0"]]))))
  msgs <- list(ai_msg_0 = scr[["S0"]])
  p_err <- if (flag_many_err) 0.25 else 0.015
  turns <- list(); n_err <- 0; ok <- 0; llm <- 0; after_end <- 0
  disc_prev <- NA; mir_re <- rnorm(1, 0, 0.5)
  probe_shown2 <- FALSE; ios2 <- NULL; not_trig <- runif(1) < 0.05
  for (r in seq_len(n)) {
    ts_u <- start_chat + el[r] + 1
    nw <- max(2, round(rnorm(1, p$user_words, p$user_words * 0.35)))
    disc <- rbinom(1, 1, p$p_disc)
    utxt <- ph_text(nw, question = (r == 1 && first_q), crlf = (runif(1) < 0.05))
    log[[length(log) + 1]] <- list(role = "user", content = utxt, ts = iso(ts_u), round = r, elapsed = el[r])
    msgs[[paste0("user_msg_", r)]] <- utxt
    turns[[length(turns) + 1]] <- data.frame(round = r, role = "user", emotional_self_disclosure = disc,
                                             mirroring_user_emotion = NA_integer_)
    if (r == 1) {
      log[[length(log) + 1]] <- list(role = "assistant", content = scr[["S1"]], scripted = TRUE, script_slot = "S1",
                                     round = 1, ts = iso(ts_u + 4.8), elapsed = el[r] + 5,
                                     delay_ms = min(6000, max(2000, 1500 + 8 * nchar(scr[["S1"]]))))
      msgs$ai_msg_1 <- scr[["S1"]]; ok <- ok + 1
      disc_prev <- disc
      next
    }
    if (runif(1) < p_err) {
      n_err <- n_err + 1
      log[[length(log) + 1]] <- list(role = "system_error", content = "API error: 500", error_type = "API error: 500",
                                     http_status = 500, latency_ms = round(runif(1, 300, 4000)), ts = iso(ts_u + 2),
                                     round = r, elapsed = el[r])
      disc_prev <- disc
      next
    }
    tok <- max(20, round(rnorm(1, p$tok_mean, 20)))
    bw <- max(8, round(tok * 0.80 + rnorm(1, 0, 3)))
    btxt <- ph_text(bw, question = runif(1) < 0.5, crlf = (runif(1) < 0.05))
    is_last <- r == n
    ae <- is_last && !is_partial_chat && runif(1) < 0.25
    fr <- if (runif(1) < 0.005) "length" else "stop"
    e <- list(role = "assistant", content = btxt, ts = iso(ts_u + 2), round = r, elapsed = if (ae) 600 else el[r] + 1)
    if (runif(1) > 0.01) e$usage <- list(prompt_tokens = 800 + 60 * r, completion_tokens = tok, total_tokens = 800 + 60 * r + tok)
    if (!(flag_missing_finish && llm == 0)) { e$finish_reason <- fr; e$native_finish_reason <- fr }   # rev 3: one reply without it
    e$provider <- sample(c("ProviderA", "ProviderB", "ProviderC"), 1, prob = c(.6, .3, .1))
    e$model_served <- "meta-llama/llama-3.3-70b-instruct"; e$gen_id <- paste0("gen-mock-", sample(1e9, 1))
    e$latency_ms <- round(runif(1, 600, 5000))
    if (ae) { e$after_end <- TRUE; e$displayed <- runif(1) < 0.8; after_end <- after_end + 1 }
    log[[length(log) + 1]] <- e
    msgs[[paste0("ai_msg_", r)]] <- btxt
    ok <- ok + 1; llm <- llm + 1
    lin <- qlogis(eff$u2[["p_nodisc"]]) + (qlogis(eff$u2[["p_disc"]]) - qlogis(eff$u2[["p_nodisc"]])) * disc + mir_re
    turns[[length(turns) + 1]] <- data.frame(round = r, role = "assistant", emotional_self_disclosure = NA_integer_,
                                             mirroring_user_emotion = rbinom(1, 1, plogis(lin)))
    if (!probe_shown2 && !not_trig && el[r] + 1 >= 300 && !ae) {
      probe_shown2 <- TRUE
      ios2 <- list(elapsed = el[r] + 1, round = r, ts = iso(ts_u + 3))
    }
    disc_prev <- disc
  }
  list(log = log, msgs = msgs, n_sends = n, n_err = n_err, ok = ok, llm = llm, after_end = after_end,
       first_q = first_q, ios2 = ios2, turns = bind_rows(turns))
}

build_record <- function(s, p, mat, header, eff) {
  # s: one row of the plan; p: one row of gen_persons output. Returns list(rec, tone, turns, flags)
  r <- list()
  st <- s$start; uuid <- paste0(substr(sha256_txt(paste(s$k, s$sona_id, st)), 1, 8), "-mock-", s$k)
  cell <- s$cell; A_hi <- startsWith(cell, "HighA"); E_hi <- grepl("HighE", cell)
  r$study_mode <- "1d"; r$study_id <- "3"; r$experiment_version <- "study3-v1.0-MOCK"
  r$session_uuid <- uuid; r$reload_count <- "0"
  r$pid_url <- if (s$flag_pid_mismatch %in% TRUE) "999999" else s$sona_id
  r$completed <- if (s$stage == "complete") "true" else "false"
  r$model <- "meta-llama/llama-3.3-70b-instruct"; r$temperature <- "0.7"; r$max_tokens <- "400"
  r$api_endpoint <- "https://openrouter.ai/api/v1/chat/completions"
  r$probe_format <- "ios"; r$v2_version <- "D4"; r$v2_severity_included <- "true"
  r$mc_e_items_included <- "true"; r$prior_sylva_included <- "true"
  r$start_time <- iso(st); r$device_type <- "desktop"; r$user_agent <- "Mozilla/5.0 (synthetic)"
  r$fullscreen_entered <- "yes"; r$pavlovia_pilot_mode <- if (s$flag_pilot %in% TRUE) "true" else "false"
  r$device_self_report <- "1"; r$captcha_response <- "q"; r$captcha_pass <- "true"
  rts <- function() paste(round(rnorm(12, 380, 90)), collapse = ";")
  r$spr1_rts <- rts(); r$spr1_mean_rt <- "380"; r$spr1_min_rt <- "250"; r$spr1_understood <- "1"
  r$spr2_rts <- rts(); r$spr2_mean_rt <- "385"; r$spr2_min_rt <- "255"; r$spr2_understood <- "1"
  r$consent <- "1"; r$consent_ts <- iso(st + 60); r$date_of_consent <- format(st, "%m/%d/%Y")
  r$sona_id <- s$sona_id; r$pid_mismatch <- if (s$flag_pid_mismatch %in% TRUE) "true" else "false"
  r$cell <- cell; r$condition_id <- as.character(match(cell, CELLS)); r$condition_label <- cell
  r$a_level <- if (A_hi) "high" else "low"; r$e_level <- if (E_hi) "high" else "low"
  r$a_block <- if (A_hi) "HIGH_A" else "LOW_A"; r$e_block <- if (E_hi) "HIGH_E_S3" else "LOW_E_S3"
  r$n_block <- "MOD_LOW_N"; r$order <- s$order; r$order_source <- s$order_source; r$cb_source <- s$cb_source
  r$cb_slot <- if (is.na(s$cb_slot)) "" else as.character(s$cb_slot)
  r$cb_req_id <- paste0("req-", s$k); r$cb_study_code <- if (s$is_test) "1d_test" else "1d"
  r$cb_error <- if (s$cb_source == "fallback_random") "Worker timeout" else ""
  r$cb_fetch_ms <- "40"; r$cb_fetch_ts <- iso(st + 75); r$cb_reused <- "false"; r$cb_first_session_uuid <- uuid
  r$is_test_session <- if (s$is_test) "true" else "false"
  sp <- mat$prompts[[cell]]
  sp_shown <- if (s$flag_bad_hash %in% TRUE) paste0(sp, " ") else sp
  r$system_prompt <- gsub("\n", "\r\n", sp_shown, fixed = TRUE)            # multipart LF -> CRLF
  r$system_prompt_sha256 <- sha256_txt(sp_shown)                            # hashed in the browser on LF text
  r$system_prompt_sha256_match <- if (s$flag_bad_hash %in% TRUE) "false" else "true"
  r$script_version <- "D1-rev2-draft-2026-10-01"
  r$script_sha256 <- sha256_txt(paste0(mat$scripts[[cell]][["S0"]], "\n", mat$scripts[[cell]][["S1"]]))
  r$script_sha256_match <- "true"
  # attention check
  if (s$role == "attn_fail") {
    r$attn1 <- "1"; r$attn1_pass <- "false"; r$attn1_retry <- "2"; r$attn1_retry_pass <- "false"
  } else if (s$flag_attn_retry_pass %in% TRUE) {
    r$attn1 <- "4"; r$attn1_pass <- "false"; r$attn1_retry <- "3"; r$attn1_retry_pass <- "true"
  } else { r$attn1 <- "3"; r$attn1_pass <- "true" }
  ord_str <- function(ids) paste(sample(ids), collapse = ";")
  for (i in 1:10) r[[paste0("tipi_self_", i)]] <- as.character(p[[paste0("tipi_self_", i)]])
  r[["item_order_tipi-s"]] <- ord_str(paste0("tipi_self_", 1:10))
  for (i in 1:10) r[[paste0("gaais_", i)]] <- as.character(p[[paste0("gaais_", i)]])
  r$item_order_gaais1 <- ord_str(paste0("gaais_", 1:10))
  for (i in 11:20) r[[paste0("gaais_", i)]] <- as.character(p[[paste0("gaais_", i)]])
  r$item_order_gaais2 <- ord_str(paste0("gaais_", 11:20))
  for (i in 1:4) r[[paste0("phq4_", i)]] <- as.character(p[[paste0("phq4_", i)]])
  r$item_order_phq4 <- ord_str(paste0("phq4_", 1:4))
  r$story_read_time <- as.character(round(runif(1, 10000, 60000)))
  out <- list(rec = r, tone = NULL, turns = NULL, flags = list())
  if (s$stage == "pre_chat") return(finish_partial(out, s, st, "page_gaais2"))
  # ---- chat ----
  st_chat <- st + 600
  ch <- build_chat(p, cell, mat, st_chat, is_partial_chat = (s$stage == "chat_turn"), flag_many_err = s$flag_many_err %in% TRUE, eff = eff,
                   flag_missing_finish = s$flag_missing_finish %in% TRUE)
  r$chat_start_time <- iso(st_chat); r$chat_opener <- mat$opener
  r$ios_t1_shown_ts <- iso(st_chat + 15); r$ios_t1_elapsed <- "11"; r$ios_t1_round <- "1"
  r$ios_t1 <- as.character(p$ios_t1); r$ios_t1_rt_ms <- as.character(round(rlnorm(1, log(5000), .4)))
  r$chat_probe_seconds <- as.character(round(runif(1, 12, 40), 1))
  r$chat_total_rounds <- as.character(ch$ok); r$chat_send_attempts <- as.character(ch$n_sends)
  r$chat_llm_rounds <- as.character(ch$llm); r$chat_api_error_count <- as.character(ch$n_err)
  r$chat_min_message_threshold_met <- if (ch$ok >= 8) "true" else "false"
  r$chat_log <- as.character(jsonlite::toJSON(ch$log, auto_unbox = TRUE, digits = NA))
  for (nm in names(ch$msgs)) r[[nm]] <- ch$msgs[[nm]]
  r$chat_after_end_replies <- as.character(ch$after_end)
  # model-generated replies: tone-probe scores (input from the frozen-probe script)
  bot <- Filter(function(e) e$role == "assistant" && !isTRUE(e$scripted), ch$log)
  if (length(bot)) {
    nb <- length(bot)
    out$tone <- data.frame(study = 3, sona_id = s$sona_id, session_uuid = uuid,
                           turn_idx = vapply(bot, function(e) e$round, numeric(1)),
                           W = clip(p$W_true + rnorm(nb, 0, 0.18), 0.002, 0.998),
                           R = clip(p$R_true + rnorm(nb, 0, 0.10), 0.002, 0.998),
                           A = clip(p$Aaff_true + rnorm(nb, 0, 0.10), 0.002, 0.998),
                           n_words = vapply(bot, function(e) length(strsplit(e$content, "\\s+")[[1]]), numeric(1)))
  }
  out$turns <- ch$turns %>% mutate(sona_id = s$sona_id, session_uuid = uuid)
  if (s$stage == "chat_turn") { out$rec <- r; return(finish_partial(out, s, st, paste0("chat_turn_", ch$n_sends))) }
  if (!is.null(ch$ios2)) {
    r$ios_t2_shown_ts <- ch$ios2$ts; r$ios_t2_elapsed <- as.character(ch$ios2$elapsed); r$ios_t2_round <- as.character(ch$ios2$round)
    r$ios_t2 <- as.character(p$ios_t2); r$ios_t2_rt_ms <- as.character(round(rlnorm(1, log(4000), .4)))
    r$ios_t2_status <- "answered"
  } else r$ios_t2_status <- "not_triggered"
  t_out <- st_chat + 600 + as.numeric(r$chat_probe_seconds) + 30
  r$chat_timeout_time <- iso(t_out); r$chat_end_time <- iso(t_out + runif(1, 2, 9))
  r$chat_duration_seconds <- "600"; r$chat_idle_pause_count <- as.character(rpois(1, 0.6))
  r$ios_t3_shown_ts <- iso(t_out); r$ios_t3_elapsed <- "600"; r$ios_t3_round <- as.character(ch$n_sends)
  r$ios_t3 <- as.character(p$ios_t3); r$ios_t3_rt_ms <- as.character(round(rlnorm(1, log(4000), .4)))
  out$flags$first_msg_question <- ch$first_q
  # ---- post-chat ----
  if (s$role == "comp_fail") { r$comprehension_name <- sample(c("kael", "ryn", "unsure"), 1); r$comprehension_correct <- "false" }   # build option codes (§9.2 rule 5)
  else { r$comprehension_name <- "sylva"; r$comprehension_correct <- "true" }
  for (b in list(list("psr", 12), list("ec", 5), list("tr", 4))) {
    for (i in seq_len(b[[2]])) r[[paste0(b[[1]], "_", i)]] <- as.character(p[[paste0(b[[1]], "_", i)]])
    r[[paste0("item_order_", b[[1]])]] <- ord_str(paste0(b[[1]], "_", seq_len(b[[2]])))
  }
  for (i in 1:10) r[[paste0("tipi_bot_", i)]] <- as.character(p[[paste0("tipi_bot_", i)]])
  r[["item_order_tipi-b"]] <- ord_str(paste0("tipi_bot_", 1:10))
  for (v in c("mc_extraversion", "mc_agreeableness", "mc_neuroticism", "mc_e_energetic", "mc_length")) r[[v]] <- as.character(p[[v]])
  r$item_order_mc <- ord_str(c("mc_extraversion", "mc_agreeableness", "mc_neuroticism", "mc_e_energetic", "mc_length"))
  for (b in list(list("et", 8), list("ma", 8), list("mp", 8), list("liab", 12))) {
    for (i in seq_len(b[[2]])) r[[paste0(b[[1]], "_", i)]] <- as.character(p[[paste0(b[[1]], "_", i)]])
    r[[paste0("item_order_", b[[1]])]] <- ord_str(paste0(b[[1]], "_", seq_len(b[[2]])))
  }
  if (s$stage == "post_chat") { out$rec <- r; return(finish_partial(out, s, st, "page_liab")) }
  for (v in c("oe_experience", "oe_person_or_tool", "oe_responsibility", "oe_compensation"))
    r[[v]] <- ph_text(rpois(1, 35) + 3, crlf = runif(1) < 0.2)
  r$v2_page_ms <- as.character(round(runif(1, 10000, 40000)))
  v2i <- c("v2_resp_company", "v2_resp_sylva", "v2_resp_user", "v2_cause_company", "v2_cause_sylva", "v2_cause_user",
           "v2_oblig_company", "v2_oblig_sylva", "v2_oblig_user", "v2_severity")
  for (v in v2i) r[[v]] <- as.character(p[[v]])
  r$item_order_v2 <- ord_str(v2i); r$v2_item_order <- r$item_order_v2
  r$v2_items_page_ms <- as.character(round(runif(1, 15000, 60000)))
  # demographics
  r$d_serious <- if (s$role == "not_serious") "1" else "2"
  r$d_fullscreen <- as.character(p$d_fullscreen); r$d_problems <- "[synthetic] none"
  r$d_age <- if (!is.na(s$age_override)) s$age_override else as.character(p$d_age)
  for (v in c("d_gender", "d_education", "d_politics", "d_ai_freq", "d_training", "d_legal_knowledge", "d_jury",
              "d_free_speech_1", "d_free_speech_2", "d_chatbot_experience", "d_chatbot_use_cases", "d_social_media",
              "d_tech_comfort", "d_tech_trust", "d_race", "d_employment", "d_religiosity", "d_device",
              "d_distractions", "d_english_proficiency")) r[[v]] <- as.character(p[[v]])
  r$d_native_language <- sample(c("English", "Spanish", "Mandarin", "Korean", "Other"), 1, prob = c(.6, .12, .12, .08, .08))
  r$d_country <- "United States"; r$d_occupation <- "[synthetic] student"; r$d_religion <- "[synthetic]"
  r$d_final_thoughts <- "[synthetic]"
  r$prior_sylva <- if (s$role == "prior_yes") "Yes" else if (s$flag_prior_notsure %in% TRUE) "Not sure" else "No"
  r$d_ai_used_in_study <- if (s$role == "ai_used") "1" else "2"
  r$end_time <- iso(st + 1800 + runif(1, 0, 900)); r$total_duration_ms <- as.character(round(runif(1, 1.5e6, 2.4e6)))
  r$page_timestamps <- "[]"; r$screen_width <- "1440"; r$screen_height <- "900"
  r$page_ids <- "device_check;fullscreen;captcha;..."; r$page_sequence <- paste0("...;", s$order, ";...")
  out$rec <- r
  out
}

finish_partial <- function(out, s, st, stage) {
  r <- out$rec
  r[grepl("^(user_msg_|ai_msg_)", names(r))] <- NULL
  r$system_prompt <- NULL
  r$completed <- "false"; r$checkpoint_stage <- stage; r$checkpoint_ts <- iso(st + 1200); r$partial_slim <- "true"
  r$page_timestamps <- "[]"; r$screen_width <- "1440"; r$screen_height <- "900"
  out$rec <- r
  out
}

# ---- main entry point ---------------------------------------------------------------
simulate_study3 <- function(eff, analysis_root, seed = 42, n_main = 296, n_test = 16) {
  P <- s3_paths(analysis_root)
  set.seed(seed)
  mat <- parse_prereg_materials(P$prereg)
  header <- harness_header(P$harness)
  donors <- load_donors(P)
  plan <- make_session_plan(n_main, n_test)
  A <- ifelse(startsWith(plan$cell, "HighA"), .5, -.5); E <- ifelse(grepl("HighE", plan$cell), .5, -.5)
  O <- ifelse(plan$order == "bonding_first", .5, -.5)
  persons <- gen_persons(A, E, O, eff, donors)
  res <- lapply(seq_len(nrow(plan)), function(i) build_record(plan[i, ], persons[i, ], mat, header, eff))
  recs <- lapply(res, function(x) x$rec)
  # column order: build header first, then any extra (message, retry, checkpoint) columns
  all_names <- unique(c(header, unlist(lapply(recs, names))))
  unknown <- setdiff(unlist(lapply(recs, names)), c(header, "attn1_retry", "attn1_retry_pass", "checkpoint_stage",
                                                    "checkpoint_ts", "partial_slim",
                                                    grep("^(user_msg_|ai_msg_)[0-9]+$", all_names, value = TRUE)))
  if (length(unknown)) stop("Generator wrote columns that the v0.3 build does not write: ", paste(unknown, collapse = ", "))
  never <- setdiff(header, unlist(lapply(recs, names)))
  tone <- bind_rows(lapply(res, function(x) x$tone))
  turns <- bind_rows(lapply(res, function(x) x$turns))
  # participant-level LLM flags (simulated NB08 outputs): hypothesis guessing; round-1 fit (code name per prereg rev 3 §6.10)
  flags <- bind_rows(lapply(seq_along(res), function(i) {
    if (is.null(res[[i]]$turns)) return(NULL)
    fq <- isTRUE(res[[i]]$flags$first_msg_question)
    data.frame(sona_id = plan$sona_id[i], session_uuid = recs[[i]]$session_uuid,
               hyp_guess_keyword = runif(1) < 0.02, hyp_guess_llm = runif(1) < 0.03,
               reply_ignores_direct_question = if (fq) runif(1) < 0.6 else runif(1) < 0.03)
  }))
  reliab <- data.frame(code = c("emotional_self_disclosure", "mirroring_user_emotion"),
                       mean_pairwise_kappa = c(.71, .66), fleiss_kappa = c(.70, .64), kripp_alpha = c(.70, .64),
                       human_human_kappa = c(.74, .68), human_llm_kappa = c(.69, .63))
  list(records = recs, header = header, never_written = never, tone = tone, turns = turns, flags = flags,
       reliability = reliab, plan = plan, persons = persons, materials = mat, donors = donors)
}

write_session_csvs <- function(recs, dir) {
  dir.create(dir, recursive = TRUE, showWarnings = FALSE)
  q <- function(x) paste0("\"", gsub("\"", "\"\"", x, fixed = TRUE), "\"")
  for (r in recs) {
    stamp <- gsub("[^0-9]", "", r$start_time)
    pid <- if (!is.null(r$sona_id)) gsub("[^A-Za-z0-9_-]", "", r$sona_id) else "nopid"
    f <- file.path(dir, paste0("char-ai-study_", pid, "_SESSION_", stamp,
                               if (identical(r$completed, "false")) "_PARTIAL" else "", ".csv"))
    v <- vapply(r, function(x) if (is.null(x) || length(x) == 0) "" else as.character(x), character(1))
    con <- file(f, open = "wb")
    writeBin(charToRaw(enc2utf8(paste0(paste(q(names(v)), collapse = ","), "\n", paste(q(v), collapse = ","), "\n"))), con)
    close(con)
  }
  invisible(length(recs))
}
