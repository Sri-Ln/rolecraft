# Mode: concepts

Scoped slice of `process`: update the concepts tracker and nothing else.

**Reads:** all sources of truth (`_shared.md` table) + `user/data/concepts.md` + an optional inline JD.
**Writes:** `user/data/concepts.md` ONLY. No archive entry, no dashboard refresh, no inbox read or clear. A JD passed here is not tracked anywhere else — tell the user that, and point at `/rolecraft process` for full tracking.

## Input

- A JD pasted with the invocation (or a URL to fetch) → extract concepts from it, then merge into the tracker.
- No JD → maintenance pass: re-merge, dedupe, and re-rank what's already in the file (useful after hand-edits).

## Update mechanics

1. Merge newly extracted concepts with the existing ranked list. Collapse synonyms into one entry (keep the clearest name).
2. Drop or 🎓-mark anything in the user's prior-domain-knowledge list (`_profile.md`) — 🎓 items get no learning resources, ever.
3. Re-rank by total demand across everything the tracker has seen (previous-rank comment block + this run).
4. Each non-🎓 concept keeps 1–2 curated FREE sources (docs, talks, university notes — no paywalls).
5. Apply Δ markers vs the previous-rank block; mark the top 3 with 🔥; mark new entries 🆕.
6. Rewrite the previous-rank comment block with this run's ranks.

## Report

Brief: new entries, biggest movers, 🎓 exclusions applied. Remind the user the JD wasn't archived (if one was given).
