#!/usr/bin/env python3
"""Study 3 transcript safety screen (IRB protocol; prereg Section 11.3).

Within 48 hours of each session, every transcript, partial records included, is screened for self-harm
keywords, and the PI reads any flagged transcript in full. If a transcript suggests a risk of harm, the PI
sends the participant a message through SONA with support resources (988 Suicide & Crisis Lifeline; UCLA
CAPS, (310) 825-0768) and contacts OHRPP for guidance.

This script reads only the participant's chat messages (and the open-ended answers, which could also
contain a disclosure). It lists flagged files with the matched keyword, the SONA ID and the session time.
It prints no message text and does not tabulate anything by cell.

Usage:  python3 safety_screen_study3.py <folder with the Pavlovia data CSVs> [--since 2026-11-05]
Standard library only.
"""
import argparse
import csv
import json
import os
import re
import sys

KEYWORDS = [
    r"suicid\w*", r"kill(ing)? (my ?self|me)", r"end(ing)? (my|it all|my own) li(fe|ves)", r"take (my|my own) life",
    r"(want|wanna|wish) (to|i (was|were)) (die|dead)", r"better off dead", r"no (reason|point) (to|in) (live|living)",
    r"self[- ]?harm\w*", r"(cut|cutting|hurt|hurting|harm|harming) (my ?self|myself)", r"overdos\w*",
    r"hang(ing)? my ?self", r"don'?t want to (be alive|live|exist)", r"not (be|being) here anymore", r"\bunalive\b",
]
PATTERN = re.compile("|".join(f"(?:{k})" for k in KEYWORDS), re.IGNORECASE)


def texts(row):
    """Participant-written text only: user turns of the chat log and the open-ended answers."""
    out = []
    try:
        for e in json.loads(row.get("chat_log") or "[]"):
            if isinstance(e, dict) and e.get("role") == "user":
                out.append(str(e.get("content") or ""))
    except json.JSONDecodeError:
        out.extend(v for k, v in row.items() if re.fullmatch(r"user_msg_\d+", k) and v)
    out.extend(v for k, v in row.items() if k.startswith("oe") and v)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--since", default="", help="only sessions with consent on or after this date (YYYY-MM-DD)")
    a = ap.parse_args()
    n = flagged = 0
    for name in sorted(os.listdir(a.folder)):
        if not name.lower().endswith(".csv"):
            continue
        with open(os.path.join(a.folder, name), newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                if a.since and (row.get("consent_ts") or "") < a.since:
                    continue
                n += 1
                hits = sorted({m.group(0).lower() for t in texts(row) for m in PATTERN.finditer(t)})
                if hits:
                    flagged += 1
                    print(f"FLAG  {name}  SONA ID {row.get('sona_id') or '?'}  consent {row.get('consent_ts') or '?'}  matched: {', '.join(hits)}")
    print(f"\nScreened {n} record(s); {flagged} flagged. Read each flagged transcript in full within 48 hours of the session.")


if __name__ == "__main__":
    sys.exit(main())
