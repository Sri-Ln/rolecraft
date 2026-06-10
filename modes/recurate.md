# Mode: recurate

Re-rank everything in `user/data/` against the CURRENT profile. Run after changing targets, industries, deal-breakers, or prior domain knowledge.

**Reads:** all sources of truth + every `user/data/` tracker.
**Writes:** rewrites rankings in `concepts.md`, `stack-tracker.md`, `projects-index.md`, `companies.md`, then regenerates `dashboard.md`. NEVER touches `jd-archive.md` (history), `inbox.md`, or anything in `user/profile/`.

## Mismatch check (BEFORE rewriting anything)

Estimate how much of the tracked data still fits the new targets: compare tracker contents against the current archetypes and industries. If roughly half or more of it comes from roles/industries that no longer match, WARN before proceeding. Show the mismatch concretely ("8 of 11 concepts came from Finance JDs; your target is now Healthcare") and offer:

- (a) re-rank anyway — off-target items get demoted, not deleted
- (b) start fresh — point at `/rolecraft clear`
- (c) cancel

Proceed only on an explicit choice.

## Re-ranking

- **Concepts / stack:** re-weight every item by relevance to the current archetypes and industries. Demote off-target items; never delete them. 🎓 rules still apply (and apply the CURRENT prior-domain-knowledge list — items may gain or lose 🎓). Recompute Δ markers and rewrite the previous-rank blocks.
- **Projects:** re-evaluate each suggestion against the new targets. Flag off-target `idea` rows in their Notes column; never change statuses the user has set. Append a Suggestion-log entry recording the recuration.
- **Companies:** re-apply the industries filter. Flag rows that no longer fit in their Notes column ("off-target since YYYY-MM-DD profile change"); don't delete them — they may still be useful, and some came from the user.
- **Dashboard:** regenerate (same structure as `modes/dashboard.md`).

## Report

What moved and why, what got flagged off-target, and a reminder that nothing was deleted.
