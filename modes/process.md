# Mode: process

The everyday command. JD in → every tracker updated → dashboard refreshed → inbox cleared. Replaces the pre-rolecraft `process inbox` loop. There is no auto-PR or publishing pipeline — results land in `user/data/` and nowhere else.

**Reads:** all sources of truth (`_shared.md` table), plus `user/data/inbox.md` when no JD is given inline.
**Writes:** every `user/data/` file. Never writes `user/profile/`.

## 1. Collect input

Priority order:

1. A JD pasted (or a URL given) with the invocation → use it. Fetch URLs; if a page won't fetch, ask the user to paste the text.
2. Otherwise read `user/data/inbox.md` (seed it from the template first if missing). Content below the paste marker is the input.
3. Neither → explain the two ways to feed a JD in (paste with the command, or paste into `user/data/inbox.md` and run `/rolecraft`) and stop.

## 1b. Run the engine: cache pass, then LLM extraction

Skill extraction is LLM-first, with a deterministic cache for skills already seen.

**Step A — deterministic cache pass.** Run, from the plugin root:

```
node core/src/cli.mjs process <input-file>
```

The engine is plain ESM on Node built-ins — no install, no build step. If `node`
isn't available, skip 1b entirely and extract every skill yourself; the rest of
the mode is unchanged.

This returns a JSON array (one object per JD) with `jd` (canonical fields +
detected `sections` + `raw`) and `tags` — skills matched from the per-user
learned cache (`user/data/.rolecraft/learned-skills.json`, auto-seeded from the
shipped vocabulary on first run). Each tag has `source: "cache"`. It also bumps
each matched skill's `seen` count and persists the JD.

**Duplicates.** A JD whose body is byte-identical to one already processed comes
back with `duplicate: { skipped: true, firstSeenAt }` and is neither archived nor
counted — one JD pasted twice must not inflate its own stack in the rankings.
Skip skipped entries in every step below, and tell the user in the report which
ones were skipped and when they were first seen. A repost with any edit is a
different JD and counts normally. If the user says an identical repost is a
genuine new opening, re-run the same command with `--allow-duplicates`.

**Step B — LLM extraction of the rest.** Read `jd.raw` and identify every real
skill / technology / competency that is NOT already in the cache `tags`. This is
your job, not the engine's — it works for any domain (tech, finance, nursing,
etc.), so do not limit yourself to software terms. For each new skill choose a
stable lowercase `canonical` key, the `surface` form as it appeared, a `bucket`
(`required` or `nice` based on the section), and a `domain` if clear.

**Step C — persist what you learned.** Write the new skills to a temp JSON file
(an array of `{canonical, surface, domain}`) and run:

```
node core/src/cli.mjs learn --skills-file <temp-file>
```

Now those skills are in the cache and will be deterministic `source: "cache"`
hits next time — the cache converges on this user's domains over time.

Use the union of Step A (cache) + Step B (LLM) skills as the source of truth for
the remaining steps. Do not re-extract skills already tagged.

## 2. Split and parse

Split the input on lines containing exactly `---NEW JOB---`; each segment is one JD. That marker is the only automatic split — if the paste has no marker but looks like it describes more than one role, ask the user ("this reads like two distinct roles — process as two, or treat as one?") before splitting. For each JD extract:

- Company, title, location/remote policy, posted comp (if any)
- Must-have requirements vs nice-to-haves
- Named technologies and skills: the union of the engine's cache `tags` (step 1b.A) and the skills you extracted (step 1b.B). New skills must be persisted with `learn` (step 1b.C) so they become cache hits next time.
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
7. Keep the file as ONE ranked table — `| # | Concept | Why it matters | Free sources |` — with rank, Δ, and 🔥/🎓 markers together in the `#` cell (e.g. `3 🔥 🆕`). No flat lists.

## 5. Tech stack → `user/data/stack-tracker.md`

Source the technologies and their required/nice buckets from the union of the
cache `tags` and your extracted skills (step 1b). The cache is authoritative for
already-known skills; you supply the rest. You decide ranking and presentation.

Same mechanics as concepts, but ranked within each category (Languages / Frameworks / Tools / Methodologies / Infra) by occurrence count across all processed JDs. Keep the file as ONE table — `| Category | Technology | Demand | Δ |` — rows grouped by category, ranked within each group; 🎓 marks tech the user already knows. Update the previous-rank block after re-ranking.

## 6. Projects → `user/data/projects-index.md`

- **Fewer than 3 JDs processed all-time → no suggestion.** Write nothing to the file; note the count in the report ("2/3 JDs — project suggestions start at 3"). Patterns first, projects after.
- **3+ JDs → suggest from the PATTERN across all JDs, not the latest one alone.** Pick the tech and domain concepts that cover the most demanded ground with one coherent build that models a real business process — never bake every technology into one demo.
- **Extend vs new is decided by tech TYPE** (messaging queue, cache layer, serverless functions, stream processing, front-end framework…). Competitor swaps within a type (Angular↔React, Kafka↔Solace) are NOT new types — note the alternative in the existing project's row. A genuinely new type: first try fitting it into an existing project as an add-on milestone; open a new project only when it can't reasonably fit. Say which you chose and why.
- Every suggestion: the business problem it models, MVP scope, rough timeline, demanded tech exercised. Never a generic CRUD demo or to-do app.
- New projects enter the table with status `idea`; never change statuses the user has set. The Project cell in the table is an anchor link to the project's heading in the Suggestion log so summary and detail stay connected.

## 7. Companies → `user/data/companies.md`

- If the JD names the actual hiring company, add ONE row: industry, sub-sector, role, careers page (a role-filtered search URL when the company's site supports it, otherwise the careers root), notes.
- Anonymous postings (recruiter blobs, "a Tier 1 bank") get NO row — placeholder rows aren't targets. Put what's known, and what to ask the recruiter, in the chat report instead.
- Companies merely name-dropped in the JD (partners, clients, competitors) are not targets — skip them.
- Dedupe by company name: a company appears at most once in the file, ever.
- Columns: Company, Industry, Sub-sector, Relevant roles, Careers, Source, Notes.
- Similar-company discovery (WebSearch) belongs to `/rolecraft companies` — point the user there in the report, don't run it here.

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
- Aggregate: biggest movers in concepts and stack (use the Δ markers), the project suggestion made (or the JD count toward the threshold), files updated.
- Honest about weak matches — if a JD doesn't fit the user's targets, say so instead of padding.
- End with the natural next step — usually: "run `/rolecraft companies` to find similar teams hiring for this profile."

Run this pipeline per the orchestration rule in `_shared.md`: subagent does the work, the main thread shows one status line and this report.
