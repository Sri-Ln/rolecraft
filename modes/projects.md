# Mode: projects

Scoped slice: project suggestions only.

**Reads:** all sources of truth + `user/data/projects-index.md`, `user/data/concepts.md`, `user/data/stack-tracker.md`, `user/data/consolidated-jd.md` (for accumulated demand) + an optional inline JD.
**Writes:** `user/data/projects-index.md` ONLY. A JD passed here is not tracked anywhere else.

## Input

- A JD pasted with the invocation → suggest against it plus the accumulated demand.
- No JD → suggest against the accumulated demand in the trackers (consolidated-jd, concepts, stack). If the trackers are empty, say there's nothing to ground a suggestion in yet and point at `/rolecraft process`.

## Decide: extend vs new

- With ≥2 JDs processed all-time: decide whether to **extend an existing suggested project** (the demand overlaps an existing project's stack/domain) or **propose a new one** (a genuinely different axis). Say which you chose and why.
- Every suggestion must be niche and business-aware: name the business problem it models, the MVP scope, a rough timeline, and the demanded tech it exercises. Never a generic CRUD demo or to-do app.
- Add new projects to the table with status `idea`. Never change the status of rows the user has touched (`building` / `done` are the user's to set).
- Append one entry to the Suggestion log: date, what was suggested, extend-vs-new reasoning.

## Report

The suggestion itself, the business problem in one sentence, and the extend-vs-new call.
