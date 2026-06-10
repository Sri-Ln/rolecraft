# Mode: process

The everyday command. JD in → every tracker updated → dashboard refreshed → inbox cleared. Replaces the pre-rolecraft `process inbox` loop. There is no auto-PR or publishing pipeline — results land in `user/data/` and nowhere else.

**Reads:** all sources of truth (`_shared.md` table), plus `user/data/inbox.md` when no JD is given inline.
**Writes:** every `user/data/` file. Never writes `user/profile/`.

## 1. Collect input

Priority order:

1. A JD pasted (or a URL given) with the invocation → use it. Fetch URLs; if a page won't fetch, ask the user to paste the text.
2. Otherwise read `user/data/inbox.md` (seed it from the template first if missing). Content below the paste marker is the input.
3. Neither → explain the two ways to feed a JD in (paste with the command, or paste into `user/data/inbox.md` and run `/rolecraft`) and stop.

## 2. Split and parse

Split the input on lines containing exactly `---NEW JOB---`; each segment is one JD. For each JD extract:

- Company, title, location/remote policy, posted comp (if any)
- Must-have requirements vs nice-to-haves
- Named technologies, each assigned a category: Languages / Frameworks / Tools / Methodologies / Infra
- Named or implied concepts (domain ideas worth studying, not just tools — e.g. "settlement risk", "idempotent event processing")
- Business domain and sub-sector
- Visa/sponsorship signals

Match the title against the user's archetypes per `_shared.md`. Scan against deal-breakers from `_profile.md`. Note comp vs the user's minimum and visa signals vs their status — these go in the final report.

## 3. Archive → `user/data/jd-archive.md`

Append one entry per JD: heading `## YYYY-MM-DD — Company — Title`, then the raw JD text as given. Append-only; never rewrite or dedupe history. Remove the `_No JDs archived yet._` placeholder on first append.

## 4. Concepts → `user/data/concepts.md`

1. Merge newly extracted concepts with the existing ranked list. Collapse synonyms into one entry (keep the clearest name).
2. Drop or 🎓-mark anything in the user's prior-domain-knowledge list (`_profile.md`) — 🎓 items get no learning resources, ever.
3. Re-rank by total demand across all processed JDs (use the previous-rank comment block plus this run's counts).
4. Each non-🎓 concept keeps 1–2 curated FREE sources (docs, talks, university notes — no paywalls).
5. Apply Δ markers vs the previous-rank block; mark the top 3 with 🔥; mark new entries 🆕.
6. Rewrite the previous-rank comment block at the bottom with this run's ranks.

## 5. Tech stack → `user/data/stack-tracker.md`

Same mechanics as concepts, but grouped by category (Languages / Frameworks / Tools / Methodologies / Infra) and ranked within each category by occurrence count across all processed JDs. Update each category's section and the previous-rank block. Replace `_No X tracked yet._` placeholders as categories gain entries.

## 6. Projects → `user/data/projects-index.md`

Append one entry to the Suggestion log per run: date, JDs processed, and the suggestion made.

- If this is the first JD overall: suggest one project grounded in this JD's domain.
- With ≥2 JDs processed all-time: decide **extend an existing suggested project** (when the new JD's demands overlap an existing project's stack/domain) **vs propose a new one** (when it opens a genuinely different axis). Say which you chose and why.
- Every suggestion must be niche and business-aware: name the business problem it models, the MVP scope, a rough timeline, and the JD-demanded tech it exercises. Never a generic CRUD demo or to-do app.
- Add new projects to the table with status `idea`; never change the status of rows the user has touched.

## 7. Companies → `user/data/companies.md`

Add the hiring company plus any companies explicitly named in the JD (competitors, clients, partners). Dedupe by company name. Respect the industries filter from `profile.yml`. Columns: Company, Industry, Sub-sector, Relevant roles, Source JD, Notes.

(Similar-company discovery via WebSearch is the Phase 3 `companies` mode — `process` only records what the JD itself reveals.)

## 8. Consolidated JD → `user/data/consolidated-jd.md`

Rewrite the whole file each run: a single synthetic "master JD" merged from every JD processed so far (the archive is the full history). Dedupe requirements, keep the union of must-haves with rough frequency weighting, and bump the `JDs merged into this profile: N` counter.

## 9. Dashboard → `user/data/dashboard.md`

Regenerate the whole file each run. Read `settings.dashboard_top_n_per_category` from `profile.yml` for N. Structure:

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

## 10. Clear inbox

If the input came from `user/data/inbox.md`, reset it to the exact contents of `templates/inbox.template.md`. If the JD came inline, leave the inbox alone.

## 11. Report to the user

Brief, calm summary in chat:

- Per JD: match verdict (which archetype, via canonical or synonym), deal-breaker flags, comp/visa notes.
- Aggregate: biggest movers in concepts and stack (use the Δ markers), the project suggestion made, files updated.
- Honest about weak matches — if a JD doesn't fit the user's targets, say so instead of padding.
