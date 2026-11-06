#!/usr/bin/env python3
"""Study 3 collection monitor (prereg Section 4.5; posted on OSF with the dated note).

Reads the Pavlovia session files (one CSV per session: complete, _PARTIAL or _PARTIAL_MIN) and reports
only what Section 4.5 allows the authors to see during collection:
  - session counts by cell and order, and the number of eligible (analyzable) sessions, for the stopping
    rule: recruitment closes at 272 eligible sessions or 300 completed non-TEST sessions (Section 4.5);
  - the count removed by each exclusion criterion of Section 9.2 (criterion 10, age under 18, is applied
    first and its files are listed for deletion);
  - error and save rates, probe completion (counts of answered probes, never their values), and the count
    of ios_t2_status = 'not_triggered';
  - contract violations (wrong version, study id, block names, or prompt/script hashes).

Every other column is dropped as each file is read: no outcome, manipulation check, probe value,
vignette, chat text or reply length is read or summarized.

Usage:  python3 monitor_study3.py <folder with the Pavlovia data CSVs> [--out summary.csv]
Standard library only.
"""
import argparse
import csv
import os
import re
import sys
from collections import Counter, defaultdict

FROZEN_VERSION = "study3-v1.0-2026-11-05"
CELLS = ["HighA_HighE", "HighA_LowE", "LowA_HighE", "LowA_LowE"]
ORDERS = ["impression_first", "bonding_first"]
BLOCKS = {"HighA_HighE": ("HIGH_A", "HIGH_E_S3"), "HighA_LowE": ("HIGH_A", "LOW_E_S3"),
          "LowA_HighE": ("LOW_A", "HIGH_E_S3"), "LowA_LowE": ("LOW_A", "LOW_E_S3")}
# Registered hashes: Appendix A (system prompt) and Appendix D.1 (scripted turns)
PROMPT_SHA = {"HighA_HighE": "d13545a7ddfed0dc9300d4a6d7bda0f4323974f42a7a8de044a10d1a139d28e9",
              "HighA_LowE": "524b4aed4889534cc1d7ee653c18ffb0367d2fbce7b661a050ff53e3741a75c9",
              "LowA_HighE": "c2cc5cb1e0d06394ed8c1ea650b2ecffd33e8772aa09a3597e9bb56c64c07e0a",
              "LowA_LowE": "277bf9dd7456c509fe6232f7079d8c28f5f28322e72e1ea1b978a6bea7268e95"}
SCRIPT_SHA = {"HighA_HighE": "466e7e92b2e782f104f065b994f603d5c7e9ca1e020486c5787e3401c85fed54",
              "HighA_LowE": "9a0c6f60375e024bfefb52602733d601bf54c7ae4fce7ca0e7d0688babc6c20a",
              "LowA_HighE": "f1f3dbef4d8cd4ebccc94e6d84a3b3cab888996ee0ba41c3ff975a99c73c1412",
              "LowA_LowE": "50863588d7175f8e68c7e3a65b0f8b98c0368583f8d345b73be343a76ae90eff"}
TARGET_ELIGIBLE, CAP_COMPLETED = 272, 300

# The only columns this script keeps (Section 4.5 list plus the Section 9.2 exclusion fields).
ALLOWED = {"cell", "cb_source", "cb_slot", "study_id", "a_block", "e_block", "n_block", "system_prompt_sha256",
           "script_sha256", "order", "experiment_version", "chat_api_error_count", "pavlovia_pilot_mode",
           "is_test_session", "d_age", "completed", "checkpoint_stage", "ios_t2_status",
           # Section 9.2 exclusion fields
           "sona_id", "session_uuid", "consent_ts", "chat_start_time", "attn1_pass", "attn1_retry_pass",
           "comprehension_correct", "captcha_pass", "d_ai_used_in_study", "d_serious", "prior_sylva"}
PROBES = ["ios_t1", "ios_t2", "ios_t3"]   # read only as answered / not answered


def record_type(name):
    if "_PARTIAL_MIN" in name:
        return "partial_min"
    return "partial" if "_PARTIAL" in name else "complete"


def read_records(folder):
    recs = []
    for name in sorted(os.listdir(folder)):
        if not name.lower().endswith(".csv"):
            continue
        with open(os.path.join(folder, name), newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                keep = {k: (row.get(k) or "").strip() for k in ALLOWED}
                keep["_probes_answered"] = sum(1 for p in PROBES if (row.get(p) or "").strip() != "")
                keep["_file"], keep["_type"] = name, record_type(name)
                recs.append(keep)
    return recs


def true(x):
    return x.lower() == "true"


def one_per_session(recs):
    """A session is one session_uuid: keep its completed record, else its latest partial (Section 9.2)."""
    by = defaultdict(list)
    for r in recs:
        by[r["session_uuid"] or r["_file"]].append(r)
    out = []
    for rs in by.values():
        done = [r for r in rs if true(r["completed"])]
        out.append(done[0] if done else sorted(rs, key=lambda r: r["_file"])[-1])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    recs = read_records(a.folder)
    print(f"Files read: {len(recs)} records "
          f"({Counter(r['_type'] for r in recs)['complete']} complete, "
          f"{sum(r['_type'] != 'complete' for r in recs)} partial)")

    # Criterion 10 first: reported age under 18 -> delete the record and inform the IRB
    minors = [r for r in recs if re.fullmatch(r"\d+(\.\d+)?", r["d_age"]) and float(r["d_age"]) < 18]
    if minors:
        print(f"\n!! Criterion 10: {len(minors)} record(s) report an age under 18. Delete these files and inform the IRB:")
        for r in minors:
            print("   ", r["_file"])
    recs = [r for r in recs if r not in minors]
    sess = one_per_session(recs)

    def is_test(r):
        return (r["sona_id"].lower().startswith("test") or r["cb_source"] == "test" or true(r["is_test_session"])
                or true(r["pavlovia_pilot_mode"]))

    # Criterion 3 (repeat participation) among non-TEST sessions that reached the chat
    first_seen = {}
    for r in sorted([s for s in sess if not is_test(s) and s["chat_start_time"] and s["sona_id"]], key=lambda s: s["consent_ts"]):
        first_seen.setdefault(r["sona_id"], r["session_uuid"] or r["_file"])

    def first_criterion(r):
        if is_test(r):
            return "1 TEST or pilot"
        if not true(r["completed"]):
            return "2 incomplete"
        if r["chat_start_time"] and r["sona_id"] and first_seen.get(r["sona_id"]) != (r["session_uuid"] or r["_file"]):
            return "3 repeat participation"
        if r["attn1_pass"].lower() == "false" and r["attn1_retry_pass"].lower() == "false":
            return "4 attention (both attempts)"
        if r["comprehension_correct"].lower() == "false":
            return "5 comprehension"
        if r["captcha_pass"].lower() == "false":
            return "6 CAPTCHA"
        if r["d_ai_used_in_study"] == "1":
            return "7 AI use"
        if r["d_serious"] == "1":
            return "8 not serious"
        if r["prior_sylva"] == "Yes":
            return "9 prior Sylva study"
        return ""

    for r in sess:
        r["_excl"] = first_criterion(r)
    nontest = [r for r in sess if not r["_excl"].startswith("1")]
    completed_nontest = [r for r in nontest if true(r["completed"])]
    eligible = [r for r in sess if not r["_excl"]]

    print(f"\nSessions: {len(sess)} | TEST/pilot: {len(sess) - len(nontest)} | non-TEST: {len(nontest)} "
          f"| completed non-TEST: {len(completed_nontest)} | eligible: {len(eligible)}")
    print("\nExclusions (first criterion met, Section 9.2):")
    for k, v in sorted(Counter(r["_excl"] for r in sess if r["_excl"]).items()):
        print(f"   {k}: {v}")

    print("\nEligible sessions by cell and order (stopping rule counts only):")
    print(f"   {'cell':<12} " + " ".join(f"{o:>17}" for o in ORDERS) + f" {'total':>7}")
    rows = []
    for c in CELLS:
        n = [sum(r["cell"] == c and r["order"] == o for r in eligible) for o in ORDERS]
        print(f"   {c:<12} " + " ".join(f"{x:>17}" for x in n) + f" {sum(n):>7}")
        rows.append({"cell": c, **{o: x for o, x in zip(ORDERS, n)}, "total": sum(n)})
    print("\nNon-TEST sessions that did not complete (attrition), by cell:",
          dict(Counter(r["cell"] or "(before assignment)" for r in nontest if not true(r["completed"]))))
    print("   last checkpoint of partial records:", dict(Counter(r["checkpoint_stage"] or "-" for r in nontest if r["_type"] != "complete")))

    errs = [int(r["chat_api_error_count"] or 0) for r in nontest if r["chat_api_error_count"].isdigit()]
    print(f"\nAPI errors: {sum(errs)} failed calls in {sum(e > 0 for e in errs)} of {len(errs)} non-TEST sessions")
    print(f"Save rate: {len(completed_nontest)} completed records of {len(nontest)} non-TEST sessions")
    print("Probes answered per completed non-TEST session:", dict(Counter(r["_probes_answered"] for r in completed_nontest)),
          "| ios_t2 not_triggered:", sum(r["ios_t2_status"] == "not_triggered" for r in completed_nontest))
    print("Assignment source (non-TEST):", dict(Counter(r["cb_source"] or "-" for r in nontest)))

    viol = []
    for r in nontest:
        c = r["cell"]
        if not c:
            continue
        if r["experiment_version"] != FROZEN_VERSION:
            viol.append((r["_file"], "experiment_version " + r["experiment_version"]))
        if r["study_id"] != "3":
            viol.append((r["_file"], "study_id " + r["study_id"]))
        if c in BLOCKS and (r["a_block"], r["e_block"]) != BLOCKS[c]:
            viol.append((r["_file"], "blocks do not match the cell"))
        if r["n_block"] != "MOD_LOW_N":
            viol.append((r["_file"], "n_block " + r["n_block"]))
        if r["system_prompt_sha256"] and r["system_prompt_sha256"] != PROMPT_SHA.get(c):
            viol.append((r["_file"], "system prompt hash differs from Appendix A"))
        if r["script_sha256"] and r["script_sha256"] != SCRIPT_SHA.get(c):
            viol.append((r["_file"], "script hash differs from Appendix D.1"))
    print(f"\nContract violations: {len(viol)}")
    for f, why in viol:
        print("   ", f, "-", why)

    print("\nStopping rule (Section 4.5):")
    if len(eligible) >= TARGET_ELIGIBLE:
        print(f"   STOP: {len(eligible)} eligible sessions (target {TARGET_ELIGIBLE}). Close SONA recruitment.")
    elif len(completed_nontest) >= CAP_COMPLETED:
        print(f"   STOP: {len(completed_nontest)} completed non-TEST sessions (cap {CAP_COMPLETED}). Close SONA recruitment.")
    else:
        print(f"   Continue: {len(eligible)}/{TARGET_ELIGIBLE} eligible; {len(completed_nontest)}/{CAP_COMPLETED} completed non-TEST. "
              "Recruitment also closes at the end of the recruitment window.")
    if a.out:
        with open(a.out, "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=["cell", *ORDERS, "total"])
            w.writeheader()
            w.writerows(rows)


if __name__ == "__main__":
    sys.exit(main())
