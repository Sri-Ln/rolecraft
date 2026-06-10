# Mode: dashboard

Read-only refresh of the summary. No JD needed.

**Reads:** every `user/data/` file + `profile.yml` (`settings.dashboard_top_n_per_category`).
**Writes:** `user/data/dashboard.md` ONLY. Nothing else changes — no re-ranking, no tracker edits.

## Regenerate

Rewrite the whole file with this structure (same layout `process` uses, so the two stay interchangeable):

```markdown
# rolecraft dashboard

> Last updated: YYYY-MM-DD · JDs processed: N · Last processed: Company — Title

## Top concepts
(top N from concepts.md, with rank, Δ, 🔥/🎓 markers)

## Top stack
(top N per category from stack-tracker.md, one compact list per category)

## Projects
(current suggestions from projects-index.md with status)

## Companies
(count + most recent additions from companies.md)

## Files
(one-line pointers to each user/data file)
```

- `JDs processed` comes from the consolidated-jd counter (`JDs merged into this profile: N`).
- If a tracker file is missing or still template-empty, render its section as "no data yet" — don't fail, don't seed files this mode doesn't own.

## Report

One line: dashboard refreshed, plus anything that stood out (e.g., a tracker still empty).
