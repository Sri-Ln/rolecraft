# Mode: stack

Scoped slice of `process`: update the tech-stack tracker and nothing else.

**Reads:** all sources of truth (`_shared.md` table) + `user/data/stack-tracker.md` + an optional inline JD.
**Writes:** `user/data/stack-tracker.md` ONLY. No archive entry, no dashboard refresh, no inbox read or clear. A JD passed here is not tracked anywhere else — tell the user that, and point at `/rolecraft process` for full tracking.

## Input

- A JD pasted with the invocation (or a URL to fetch) → extract named technologies, each assigned a category: Languages / Frameworks / Tools / Methodologies / Infra.
- No JD → maintenance pass: re-merge, dedupe, and re-rank existing entries.

## Update mechanics

1. Merge new technologies into their category sections; collapse naming variants ("Postgres" / "PostgreSQL") into one entry.
2. Rank within each category by occurrence count across everything the tracker has seen (previous-rank comment block + this run).
3. Apply Δ markers vs the previous-rank block; mark new entries 🆕; respect 🎓 where the user already knows a technology cold.
4. Replace `_No X tracked yet._` placeholders as categories gain entries.
5. Rewrite the previous-rank comment block with this run's ranks.

## Report

Brief: per-category changes, anything newly demanded. Remind the user the JD wasn't archived (if one was given).
