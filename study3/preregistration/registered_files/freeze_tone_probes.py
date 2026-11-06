"""Freeze the Study 3 tone probes W, R and A (prereg §6.10.1; Appendix C28).

Fits each probe ONCE on Study 1-2 data with exactly the specification used in the Study 1-2
exploratory modeling (Analysis/CrossStudy/measurement/tone_probes.py, full-data model):
  W  expressed warmth           trained on all Study 1 bot turns, target `expressed_warmth`
  R  resistance / disagreement  trained on all Study 1 bot turns, target `resistance_or_disagreement`
  A  aversive / anxious affect  trained on all Study 2 bot turns, target = any of expressed_anxiety,
                                insecurity_self_doubt, emotional_volatility, reassurance_seeking
  LogisticRegression(C=1.0, max_iter=2000) on L2-normalized all-mpnet-base-v2 embeddings.

Writes (in --out-dir, default ./frozen_probes):
  tone_probes_frozen.json   coefficients, intercepts, targets, training sizes, embedding spec
  MANIFEST.txt              SHA-256 of the JSON and the checks below (post this to OSF)

Checks (the script stops if any fails):
  1. Equivalence: the frozen models reproduce the transfer scores the Study 1-2 modeling used
     (bot_turn_tone_probes.csv: W and R on Study 2 turns, A on Study 1 turns), max |diff| < 1e-9.
  2. Embedding reproducibility: a seeded sample of Study 1 bot turns re-embedded on this machine
     with the pinned model revision matches the stored Study 1 vectors (min cosine > 0.999).
Inputs are read-only. Nothing is refit on Study 3 data, ever.
Usage: python3 freeze_tone_probes.py [--out-dir DIR] [--n-reembed 200]
"""
import argparse
import os
import hashlib
import importlib.util
import json
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression

ANALYSIS = Path(os.environ.get("STUDY3_ANALYSIS_ROOT", Path(__file__).resolve().parents[2]))   # the lab's Analysis folder
EMBED_MODEL = "sentence-transformers/all-mpnet-base-v2"
EMBED_REVISION = "e8c3b32edf5434bc2275fc9bab85f82640a19130"   # Hugging Face commit cached on the analysis machine
SEED = 42

spec = importlib.util.spec_from_file_location("tone_probes", ANALYSIS / "CrossStudy/measurement/tone_probes.py")
tp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tp)


def fit(df, target):
    d = df.dropna(subset=["embedding"])
    d = d[d[target].notna()]
    X = np.vstack(d.embedding.values)
    y = d[target].astype(int).values
    m = LogisticRegression(C=1.0, max_iter=2000).fit(X, y)
    return m, len(y), float(y.mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=str(Path(__file__).resolve().parent / "frozen_probes"))
    ap.add_argument("--n-reembed", type=int, default=200)
    a = ap.parse_args()
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    b1, b2 = tp.load(1), tp.load(2)
    b2["aversive"] = b2[tp.AVERSIVE].max(axis=1)
    models = {}
    for name, df, target, study, apply_df in [("W", b1, "expressed_warmth", 1, b2),
                                              ("R", b1, "resistance_or_disagreement", 1, b2),
                                              ("A", b2, "aversive", 2, b1)]:
        m, n, base = fit(df, target)
        models[name] = dict(model=m, n=n, base=base, target=target, study=study, apply=apply_df)

    # Check 1: identical to the probes used in the Study 1-2 modeling (transfer scores)
    ref = pd.read_csv(ANALYSIS / "CrossStudy/measurement/bot_turn_tone_probes.csv", dtype={"sona_id": str})
    check1 = {}
    for name, info in models.items():
        other = 2 if info["study"] == 1 else 1
        ap_df = info["apply"].dropna(subset=["embedding"])
        pred = info["model"].predict_proba(np.vstack(ap_df.embedding.values))[:, 1]
        got = pd.DataFrame({"sona_id": ap_df.sona_id.astype(str).values, "turn_idx": ap_df.turn_idx.values, "new": pred})
        r = ref[ref.study == other][["sona_id", "turn_idx", name]]
        mg = got.merge(r, on=["sona_id", "turn_idx"])
        diff = float(np.max(np.abs(mg["new"] - mg[name])))
        check1[name] = dict(n_compared=int(len(mg)), max_abs_diff=diff)
        if len(mg) < 0.95 * len(got) or diff > 1e-9:
            raise SystemExit(f"Check 1 failed for {name}: {check1[name]}")

    # Check 2: embeddings computed here match the stored Study 1 vectors
    from sentence_transformers import SentenceTransformer
    import sentence_transformers
    turns = pd.read_parquet(ANALYSIS / "Study 1/data/derived/chat_turns_long.parquet")
    turns = turns[turns.role == "assistant"].copy()
    turns["sona_id"] = turns.sona_id.astype(str).str.lstrip("0")
    emb = pd.read_parquet(ANALYSIS / "Study 1/data/derived/embeddings/all_mpnet_base_v2.parquet")
    emb = emb[emb.unit_type == "bot_turn"][["sona_id", "turn_idx", "embedding"]]
    emb["sona_id"] = emb.sona_id.astype(str).str.lstrip("0")
    s = turns.merge(emb, on=["sona_id", "turn_idx"]).sample(n=min(a.n_reembed, len(turns)), random_state=SEED)
    st = SentenceTransformer(EMBED_MODEL, revision=EMBED_REVISION, device="cpu")
    new = st.encode(s.content.tolist(), batch_size=32, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)
    old = np.vstack(s.embedding.values).astype(np.float64)
    cos = np.sum(new * old, axis=1) / (np.linalg.norm(new, axis=1) * np.linalg.norm(old, axis=1))
    check2 = dict(n=int(len(s)), min_cosine=float(cos.min()), mean_cosine=float(cos.mean()))
    if cos.min() <= 0.999:
        raise SystemExit(f"Check 2 failed: {check2}")

    frozen = {
        "description": "Study 3 frozen tone probes (prereg §6.10.1). Score = 1 / (1 + exp(-(x . coef + intercept))), "
                       "x = L2-normalized all-mpnet-base-v2 embedding of one Sylva reply.",
        "embedding": {"model": EMBED_MODEL, "revision": EMBED_REVISION, "normalize_embeddings": True,
                      "max_seq_length": int(st.max_seq_length), "dim": int(new.shape[1]),
                      "sentence_transformers_version": sentence_transformers.__version__},
        "fit": {"estimator": "sklearn.linear_model.LogisticRegression(C=1.0, max_iter=2000)",
                "sklearn_version": sklearn.__version__, "numpy_version": np.__version__, "python": platform.python_version()},
        "probes": {name: {"target": info["target"], "trained_on_study": info["study"], "n_train_turns": info["n"],
                          "base_rate": info["base"], "intercept": float(info["model"].intercept_[0]),
                          "coef": [float(v) for v in info["model"].coef_[0]]}
                   for name, info in models.items()},
        "checks": {"reproduces_study12_transfer_scores": check1, "embedding_reproducibility_study1_bot_turns": check2},
    }
    jpath = out / "tone_probes_frozen.json"
    jpath.write_text(json.dumps(frozen, indent=1, sort_keys=True))
    sha = hashlib.sha256(jpath.read_bytes()).hexdigest()
    (out / "MANIFEST.txt").write_text(
        "Study 3 frozen tone probes (prereg §6.10.1, Appendix C28)\n"
        f"tone_probes_frozen.json  SHA-256 {sha}\n"
        f"embedding model {EMBED_MODEL} @ {EMBED_REVISION}, normalize_embeddings=True\n"
        f"check 1 (identical to the Study 1-2 modeling probes): {json.dumps(check1)}\n"
        f"check 2 (embedding reproducibility on this machine): {json.dumps(check2)}\n"
        "Post this file and its hash to OSF before the first participant session. Never refit on Study 3 data.\n")
    print(f"frozen probes written; SHA-256 {sha}")
    print("check 1:", json.dumps(check1))
    print("check 2:", json.dumps(check2))


if __name__ == "__main__":
    main()
