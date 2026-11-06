"""Unit-level measurement: tone probes for every Sylva (bot) turn in Studies 1 and 2.

MEASUREMENT ONLY. This script scores each bot turn; it does no aggregation, no
person-level summaries and no tests. Every reported number is computed in
CrossStudy/cross_study_analyses.Rmd (section 6), which reads the CSV written here.

Probes (ridge-penalised logistic regression, C = 1.0, on the all-mpnet-base-v2 bot-turn
embeddings that the Study pipelines already store):
  W  expressed warmth            target: Study 1 LLM consensus code `expressed_warmth`
  R  resistance / disagreement   target: Study 1 LLM consensus code `resistance_or_disagreement`
  A  aversive / anxious affect   target: Study 2 LLM consensus codes, 1 if any of
                                 expressed_anxiety, insecurity_self_doubt,
                                 emotional_volatility, reassurance_seeking
Within the training study each turn gets an OUT-OF-FOLD score: GroupKFold(5) with
participant (sona_id) as the group, so no participant's turns are scored by a model
that saw them. GroupKFold is deterministic (no shuffling), so the folds are fixed.
The other study is scored by the model fit to the full training study (transfer).

This reproduces exactly the probe step of the exploratory pilot
(scratchpad/models/bond-accumulation/01_features.py; its v2 re-run in
bond-accumulation/v2/repro/ is byte-identical). Inputs are read-only.

Outputs (in --out-dir, default: the folder this script lives in):
  bot_turn_tone_probes.csv  study, sona_id (string, leading zeros stripped), turn_idx,
                            W, R, A, n_words
  probe_validation.csv      AUCs: out-of-fold within the training study (overall and
                            within each persona condition) and transfer sanity checks
                            against the other study's own codes

Usage:  python tone_probes.py [--out-dir DIR]
Tested with numpy 1.26.4, pandas 2.2.2, scikit-learn 1.5.2, pyarrow.
"""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold

ROOT = Path("<HOME>/Library/CloudStorage/GoogleDrive-<PI>/My Drive/DGK Lab/"
            "Reasoning Lab/DGK Lab - AI Training Data, CharacterAI, Tort Liability/Analysis")
AVERSIVE = ["expressed_anxiety", "insecurity_self_doubt", "emotional_volatility", "reassurance_seeking"]


def load(s):
    """Bot turns of study s with their LLM consensus codes and embeddings."""
    d = ROOT / f"Study {s}/data/derived"
    t = pd.read_parquet(d / "chat_turns_long.parquet")
    w = pd.read_parquet(d / "chat_coding/chat_consensus_wide.parquet")
    e = pd.read_parquet(d / "embeddings/all_mpnet_base_v2.parquet")
    e = e[e.unit_type == "bot_turn"][["sona_id", "turn_idx", "embedding"]]
    for x in (t, w, e):
        x["sona_id"] = x["sona_id"].astype(str).str.lstrip("0")
    bot = t[t.role == "assistant"][["sona_id", "condition_label", "turn_idx", "n_words"]]
    wb = w[w.role_normalized == "bot"].drop(columns=["role_normalized", "condition_label"])
    bot = bot.merge(wb, on=["sona_id", "turn_idx"], how="left").merge(e, on=["sona_id", "turn_idx"], how="left")
    bot["study"] = s
    return bot


def probe(train, apply, target, name):
    """Out-of-fold scores in `train` (GroupKFold by participant); full-model scores in `apply`."""
    tr = train.dropna(subset=["embedding"]).copy()
    tr = tr[tr[target].notna()]
    X = np.vstack(tr.embedding.values)
    y = tr[target].astype(int).values
    g = tr.sona_id.values
    oof = np.zeros(len(y))
    for a, b in GroupKFold(5).split(X, y, g):
        m = LogisticRegression(C=1.0, max_iter=2000).fit(X[a], y[a])
        oof[b] = m.predict_proba(X[b])[:, 1]
    full = LogisticRegression(C=1.0, max_iter=2000).fit(X, y)
    tr[name] = oof
    ap = apply.copy()
    ap[name] = full.predict_proba(np.vstack(ap.embedding.values))[:, 1]
    rows = [dict(probe=name, set="train OOF all", n=len(y), auc=roc_auc_score(y, oof), base_rate=y.mean())]
    for c, sub in tr.groupby("condition_label"):
        yy = sub[target].astype(int)
        if yy.nunique() == 2:
            rows.append(dict(probe=name, set=f"train OOF within {c}", n=len(sub),
                             auc=roc_auc_score(yy, sub[name]), base_rate=yy.mean()))
    return tr[["sona_id", "turn_idx", name]], ap[["sona_id", "turn_idx", name]], rows


def auc(df, p, c):
    d = df[df[c].notna()]
    return roc_auc_score(d[c].astype(int), d[p])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out-dir", default=str(Path(__file__).resolve().parent))
    out = Path(ap.parse_args().out_dir)
    out.mkdir(parents=True, exist_ok=True)

    b1, b2 = load(1), load(2)
    n_missing = (int(b1.embedding.isna().sum()), int(b2.embedding.isna().sum()))
    if n_missing != (0, 0):
        raise SystemExit(f"bot turns without an embedding: {n_missing}")
    b2["aversive"] = b2[AVERSIVE].max(axis=1)

    val = []
    w1, w2, r = probe(b1, b2, "expressed_warmth", "W"); val += r
    r1, r2, r = probe(b1, b2, "resistance_or_disagreement", "R"); val += r
    a2, a1, r = probe(b2, b1, "aversive", "A"); val += r
    b1 = b1.merge(w1).merge(r1).merge(a1)
    b2 = b2.merge(w2).merge(r2).merge(a2)

    # transferred probes against the other study's own codes (sanity checks, as in the pilot)
    val += [dict(probe="W", set="S2 transfer vs calm_stability", n=len(b2), auc=auc(b2, "W", "calm_stability"),
                 base_rate=b2.calm_stability.mean()),
            dict(probe="A", set="S1 transfer vs resistance_or_disagreement", n=len(b1),
                 auc=auc(b1, "A", "resistance_or_disagreement"), base_rate=b1.resistance_or_disagreement.mean()),
            dict(probe="A", set="S1 transfer vs expressed_warmth", n=len(b1), auc=auc(b1, "A", "expressed_warmth"),
                 base_rate=b1.expressed_warmth.mean()),
            dict(probe="W", set="S2 transfer vs aversive", n=len(b2), auc=auc(b2, "W", "aversive"),
                 base_rate=b2.aversive.mean())]
    pd.DataFrame(val).to_csv(out / "probe_validation.csv", index=False)

    cols = ["study", "sona_id", "turn_idx", "W", "R", "A", "n_words"]
    df = pd.concat([b1[cols], b2[cols]], ignore_index=True)
    df["sona_id"] = df.sona_id.astype(str)
    df["n_words"] = df.n_words.astype(int)
    df = df.sort_values(["study", "sona_id", "turn_idx"]).reset_index(drop=True)
    if df.duplicated(["study", "sona_id", "turn_idx"]).any():
        raise SystemExit("duplicate bot turns")
    df.to_csv(out / "bot_turn_tone_probes.csv", index=False)
    print(f"wrote {len(df)} bot turns ({df.groupby('study').sona_id.nunique().to_dict()} participants) to {out}")
    print(pd.DataFrame(val).round(3).to_string())


if __name__ == "__main__":
    main()
