"""Score Sylva replies with the FROZEN Study 3 tone probes (prereg §6.10.1). Measurement only.

The frozen file's SHA-256 is checked against MANIFEST.txt before scoring, and the embedding
model is loaded at the pinned revision. Nothing is refit.

Usage (any of):
  python3 score_tone_probes.py --texts-json replies.json --out scores.csv
      replies.json = [{"id": ..., "text": ...}, ...]
  from score_tone_probes import score; score(["reply one", "reply two"])  -> DataFrame W, R, A
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent / "frozen_probes"


def load_frozen(d=HERE):
    j = (d / "tone_probes_frozen.json").read_bytes()
    want = re.search(r"SHA-256 ([0-9a-f]{64})", (d / "MANIFEST.txt").read_text()).group(1)
    got = hashlib.sha256(j).hexdigest()
    if got != want:
        raise SystemExit(f"frozen probe file hash {got} does not match MANIFEST {want}")
    return json.loads(j), got


def score(texts, d=HERE):
    fz, sha = load_frozen(d)
    from sentence_transformers import SentenceTransformer
    e = fz["embedding"]
    st = SentenceTransformer(e["model"], revision=e["revision"], device="cpu")
    X = st.encode(list(texts), batch_size=32, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False).astype(np.float64)
    out = {}
    for name, p in fz["probes"].items():
        z = X @ np.asarray(p["coef"]) + p["intercept"]
        out[name] = 1.0 / (1.0 + np.exp(-z))
    df = pd.DataFrame(out)
    df.attrs["frozen_sha256"] = sha
    return df


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--texts-json", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    items = json.loads(Path(a.texts_json).read_text())
    s = score([it["text"] for it in items])
    s.insert(0, "id", [it["id"] for it in items])
    s.to_csv(a.out, index=False)
    print(f"scored {len(s)} replies with frozen probes {s.attrs['frozen_sha256'][:12]}…")
