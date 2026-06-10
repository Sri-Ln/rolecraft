# Rolecraft Phase 3 — Breadth Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every breadth mode works — scoped slices (`concepts`, `stack`, `projects`, `companies`), `dashboard` refresh without a JD, the `profile` field editor, `recurate` re-ranking with a mismatch warning, and confirmation-gated `clear`.

**Architecture:** Eight new mode files under `modes/`, each self-contained (loads `_shared.md` plus itself, no cross-mode file reads at runtime) and each writing ONLY its domain file(s). `docs/CUSTOMIZATION.md` documents field-by-field customization plus the dropped auto-PR rationale. The `_shared.md` mode-availability table and all "Phase 3" hedges across the docs get resolved; VERSION bumps to `0.3.0`.

**Tech Stack:** Markdown only. No automated harness (spec backlog #6); verification is structural checks plus a fixture-based smoke walkthrough per mode.

**Spec reference:** `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md` (Phase 3 section + Modes table)

**Branch:** `phase-3-breadth-modes` (cut fresh from `main`).

**Commit style (user preference):** subject line only, no body, varied natural phrasing — avoid identical templated subjects across commits. Keep the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

## File Structure

| Path | Responsibility |
|---|---|
| `modes/concepts.md` (create) | Scoped slice: concepts tracker only. |
| `modes/stack.md` (create) | Scoped slice: stack tracker only. |
| `modes/projects.md` (create) | Scoped slice: project suggestions only, extend-vs-new. |
| `modes/companies.md` (create) | WebSearch discovery of similar-role companies; merge + dedupe. |
| `modes/dashboard.md` (create) | Read-only summary refresh, no JD needed. |
| `modes/profile.md` (create) | Interactive single-field profile editor. |
| `modes/recurate.md` (create) | Re-rank all trackers against the current profile; mismatch warning. |
| `modes/clear.md` (create) | Confirmation-gated reset of `user/data/` to templates. |
| `docs/CUSTOMIZATION.md` (create) | Field-by-field customization guide + no-auto-PR rationale. |
| `modes/_shared.md` (modify) | Mode-availability section: Phase 3 modes now live. |
| `skills/rolecraft/SKILL.md`, `README.md`, `CLAUDE.md`, `docs/HOW-TO.md`, `docs/ONBOARDING.md`, `docs/DATA_CONTRACT.md` (modify) | Resolve "(Phase 3)" hedges. |
| `VERSION` (modify) | `0.2.0` → `0.3.0`. |

Design decisions locked here:

1. **Scoped slices take inline JDs only and never touch the inbox or archive.** The inbox and `jd-archive.md` belong to `process`. A JD passed to `concepts`/`stack`/`projects`/`companies` updates only that domain file and is NOT tracked elsewhere — each mode says so to the user. Run without a JD, a slice does a maintenance pass (re-merge, dedupe, re-rank existing content).
2. **`companies` uses WebSearch directly** (dispatching a search subagent when the platform supports it). The career-ops integration stays a documented hook with no code, per locked decision #10.
3. **`recurate` demotes, never deletes.** Off-target items get demoted/flagged; only `clear` removes data. `jd-archive.md` and `inbox.md` are never touched by recurate.
4. **`clear` re-seeds from templates** (rather than deleting files) so the directory stays valid, and requires the user to type `clear` to proceed.

---

## Pre-work

- [ ] **Verify branch and clean state**

Run:
```bash
git branch --show-current && git status --short
```

Expected: `phase-3-breadth-modes`, no output from status.

- [ ] **Confirm Phase 2 modes exist** (this phase builds on their conventions):

Run:
```bash
ls modes/
```

Expected: `_shared.md  analyze.md  onboard.md  process.md`

---

## Task 1: `modes/concepts.md` and `modes/stack.md`

**Files:**
- Create: `modes/concepts.md`
- Create: `modes/stack.md`

- [ ] **Step 1: Write `modes/concepts.md`**

Contents:

````markdown
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
````

- [ ] **Step 2: Write `modes/stack.md`**

Contents:

````markdown
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
````

- [ ] **Step 3: Verify both files**

Run:
```bash
node -e "['concepts','stack'].forEach(m=>{const c=require('fs').readFileSync('modes/'+m+'.md','utf-8');console.log(m+':',c.includes('ONLY')&&c.includes('maintenance pass')&&c.includes('## Report'))})"
```

Expected: both `true`.

- [ ] **Step 4: Commit**

```bash
git add modes/concepts.md modes/stack.md
git commit -m "add concepts and stack slice modes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: `modes/projects.md`

**Files:**
- Create: `modes/projects.md`

- [ ] **Step 1: Write `modes/projects.md`**

Contents:

````markdown
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
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/projects.md','utf-8');console.log(c.includes('extend vs new')&&c.includes('business problem')&&c.includes('Suggestion log'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/projects.md
git commit -m "projects mode: extend-vs-new suggestions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: `modes/companies.md`

**Files:**
- Create: `modes/companies.md`

- [ ] **Step 1: Write `modes/companies.md`**

Contents:

````markdown
# Mode: companies

Find companies hiring for the user's target roles beyond the ones their JDs already named.

**Reads:** all sources of truth + `user/data/companies.md` + `user/data/consolidated-jd.md` (role profile context).
**Writes:** `user/data/companies.md` ONLY.

## Discovery

Use WebSearch — dispatch a search subagent when the platform supports it — to find companies currently hiring for the user's archetypes (canonical names AND synonyms from `profile.yml`) in their target industries:

- Respect `industries.mode`: `"match"` searches within the listed industries and sub-sectors; `"any"` searches on titles alone.
- Useful query shapes: `"<archetype>" jobs <industry> <sub-sector>`, `companies hiring "<synonym>" <location/remote>`, `<industry> startups "<archetype>"`.
- For each candidate company capture: industry, sub-sector, the matching role(s) seen, and a one-line note (size/stage/why relevant). Source column: `websearch YYYY-MM-DD`.
- Skip recruiting agencies and job boards — the user wants employers.

## Merge

- Dedupe by company name against existing rows (case-insensitive; "Stripe, Inc." = "Stripe").
- Never remove or rewrite rows that came from processed JDs or that the user added — only append.
- Respect the industries filter for new rows.

## Future hook (documented, not implemented)

If the user has career-ops installed, its company-scan tooling could replace raw WebSearch here. v1 is deliberately WebSearch-only — see the spec's future backlog.

## Report

New companies added (with one-line why each), duplicates skipped, searches that came back empty.
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/companies.md','utf-8');console.log(c.includes('WebSearch')&&c.includes('Dedupe')&&c.includes('career-ops'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/companies.md
git commit -m "companies mode with websearch discovery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: `modes/dashboard.md`

**Files:**
- Create: `modes/dashboard.md`

- [ ] **Step 1: Write `modes/dashboard.md`**

Contents:

````markdown
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
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/dashboard.md','utf-8');console.log(c.includes('Read-only')&&c.includes('dashboard.md` ONLY')&&c.includes('no data yet'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/dashboard.md
git commit -m "dashboard refresh works without a JD

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 5: `modes/profile.md`

**Files:**
- Create: `modes/profile.md`

- [ ] **Step 1: Write `modes/profile.md`**

Contents:

````markdown
# Mode: profile

Interactive editor for the user's profile — one field at a time.

**Reads:** `user/profile/*`.
**Writes:** `user/profile/*` ONLY (`profile.yml`, `_profile.md`, `cv.md`, `article-digest.md` — whichever owns the field). Never touches `user/data/`.

## Flow

1. If the user didn't say what to change, ask which area: identity · target roles/archetypes · industries · compensation · location/visa · framing & narrative · deal-breakers · prior domain knowledge · CV · proof points.
2. For each change: show the current value, ask for the new one, confirm, write. One field at a time — never bulk-rewrite a file for a single-field change.
3. File ownership: identity/archetypes/industries/comp/location/visa → `profile.yml` · framing/narrative/deal-breakers/prior knowledge/energy mapping → `_profile.md` · experience/metrics → `cv.md` · proof points/STAR stories → `article-digest.md`.
4. When editing archetypes, offer synonym suggestions the same way onboarding does.
5. After changes that affect ranking (archetypes, industries, deal-breakers, prior domain knowledge): point out that existing trackers were ranked against the old profile and suggest `/rolecraft recurate`. Don't run it unasked.

## Rules

- Keep `profile.yml` valid YAML — preserve structure and comments.
- Confirm before overwriting any CV content; the CV is the canonical metrics source.
- This mode edits identity; it never edits trackers. Tracker complaints ("this concept doesn't apply to me") are handled conversationally per AGENTS.md, not here.
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/profile.md','utf-8');console.log(c.includes('one field at a time')&&c.includes('valid YAML')&&c.includes('recurate'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/profile.md
git commit -m "interactive profile editor

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: `modes/recurate.md`

**Files:**
- Create: `modes/recurate.md`

- [ ] **Step 1: Write `modes/recurate.md`**

Contents:

````markdown
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
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/recurate.md','utf-8');console.log(c.includes('Mismatch check')&&c.includes('demoted, not deleted')&&c.includes('NEVER touches'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/recurate.md
git commit -m "recurate re-ranks trackers after profile changes, warns on heavy mismatch

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 7: `modes/clear.md`

**Files:**
- Create: `modes/clear.md`

- [ ] **Step 1: Write `modes/clear.md`**

Contents:

````markdown
# Mode: clear

Wipe the trackers; keep the identity. Confirmation-gated.

**Reads:** `user/data/*` (to describe what's about to be lost) + `templates/*`.
**Writes:** resets every `user/data/` file to its template. NEVER touches `user/profile/` — identity, CV, framing all survive, and onboarding will NOT retrigger.

## Flow

1. **Show what's at stake.** List each `user/data/` file with one line of current contents ("concepts.md — 12 tracked concepts", "jd-archive.md — 4 archived JDs"). If everything is already template-empty, say so and stop — nothing to clear.
2. **Require typed confirmation.** Ask the user to type `clear` to proceed. Anything else cancels. Don't accept "yes" / "ok" — this deletes history that can't be regenerated (the JD archive especially).
3. **Reset.** Copy each template over its `user/data/` file (seeding table in `_shared.md`). If `user/data/reports/` exists (Phase 4+), delete its contents too.
4. **Confirm completion.** One line: trackers reset, `user/profile/` untouched.

Wipe-semantics reference: `docs/DATA_CONTRACT.md`.
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/clear.md','utf-8');console.log(c.includes('typed confirmation')&&c.includes('NEVER touches `user/profile/')&&c.includes('Anything else cancels'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/clear.md
git commit -m "confirmation-gated clear mode

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 8: `docs/CUSTOMIZATION.md`

**Files:**
- Create: `docs/CUSTOMIZATION.md`

- [ ] **Step 1: Write `docs/CUSTOMIZATION.md`**

Contents:

````markdown
# Customizing rolecraft

Everything personal lives under `user/profile/`. This guide covers what each file and field controls, and the three ways to change behavior safely.

## The one rule

Personalization goes in `user/profile/` (and generated outputs in `user/data/`). System Layer files — modes, templates, docs, manifests — never hold user-specific content, which is what makes skill updates safe. Full contract: `DATA_CONTRACT.md`.

## Three ways to customize

1. **`/rolecraft profile`** — guided, one field at a time, keeps YAML valid.
2. **Edit the files directly** — they're yours; every mode re-reads them at runtime.
3. **Say it in chat** — qualitative feedback ("stop suggesting Kafka projects", "this concept doesn't apply to me") gets folded into `_profile.md` so the next run knows.

After changes that affect ranking — archetypes, industries, deal-breakers, prior knowledge — run `/rolecraft recurate` to re-rank existing trackers.

## `profile.yml` — what each field controls

| Field | Effect |
|---|---|
| `target_roles.archetypes[].canonical` + `synonyms` | JD title matching. More synonyms = fewer missed matches on phrasing variants. |
| `archetypes[].fit` (`primary`/`secondary`/`adjacent`) | How strongly a match counts in ranking and verdicts. |
| `industries.mode` (`match`/`any`) | `match` filters companies and shapes projects to the listed industries; `any` (or a `*` entry) matches on title alone. |
| `industries.sub_sectors` | Sharpen company discovery and project framing within an industry. |
| `compensation.minimum` | Comp flags in `process`/`analyze` reports. |
| `location.*`, `needs_sponsorship` | Location/visa flags in reports. |
| `settings.dashboard_top_n_per_category` | How long each dashboard section is. |
| `settings.auto_pdf_score_threshold` | Reserved for Phase 5 PDF reports. |

## `_profile.md` — the sections that steer behavior

- **Adaptive framing** — what gets emphasized per archetype in any candidate-facing text.
- **Energy/drain mapping** — scores roles up/down beyond pure title match.
- **Deal-breakers** — hard flags raised on any JD that hits them.
- **Prior domain knowledge** — the 🎓 list. Anything here never appears as a study recommendation.
- **Framing discipline (HARD RULE)** — things you must never be described as. Modes treat this as inviolable.

## Tone matching

Drop writing samples into `user/profile/writing-samples/` and modes that generate candidate-facing text will match your voice instead of a generic one.

## Why there's no auto-PR pipeline

The pre-rolecraft version of this repo auto-committed personal trackers and opened squash-merge PRs to publish a dashboard README. rolecraft dropped that on purpose: user data is gitignored, so there's nothing to ship — trackers are local learning artifacts, not publications. If you want your tracker history in git anyway, fork the repo and remove `/user/` from `.gitignore` on your fork; updates will still never touch your data, but you give up the privacy guarantee.
````

- [ ] **Step 2: Verify**

Run:
```bash
node -e "const c=require('fs').readFileSync('docs/CUSTOMIZATION.md','utf-8');console.log(c.includes('Three ways')&&c.includes('what each field controls')&&c.includes('auto-PR'))"
```

Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add docs/CUSTOMIZATION.md
git commit -m "write the customization guide

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 9: Resolve "(Phase 3)" hedges, update mode availability, bump VERSION

**Files:**
- Modify: `modes/_shared.md`, `skills/rolecraft/SKILL.md`, `README.md`, `CLAUDE.md`, `docs/HOW-TO.md`, `docs/ONBOARDING.md`, `docs/DATA_CONTRACT.md`, `VERSION`

- [ ] **Step 1: `modes/_shared.md` — mode availability section**

Replace the section body (keep the heading):

Old:
```markdown
Phase 2 ships three modes: `onboard`, `process`, `analyze`. If the dispatched mode's file doesn't exist under `modes/`, don't improvise it. Tell the user which phase it arrives in and list what works today:

| Mode | Arrives in |
|---|---|
| `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear` | Phase 3 |
| `report` | Phase 4 |
| `update` | Phase 5 |
```

New:
```markdown
Available today: `onboard`, `process`, `analyze`, `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`. If the dispatched mode's file doesn't exist under `modes/`, don't improvise it. Tell the user which phase it arrives in:

| Mode | Arrives in |
|---|---|
| `report` | Phase 4 |
| `update` | Phase 5 |
```

- [ ] **Step 2: `skills/rolecraft/SKILL.md` — Status section**

Replace the Status body with:
```markdown
Phase 3 of 5. All everyday modes are live: `onboard`, `process`, `analyze`, plus the breadth modes (`concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`). Still to come: `report` (Phase 4) and `update` (Phase 5). See `docs/superpowers/plans/` for the per-phase implementation plans.
```

- [ ] **Step 3: `README.md`**

1. Docs list: `` - `docs/CUSTOMIZATION.md — Phase 3` `` → `` - [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) — make rolecraft yours ``
2. Status: `Phase 2 of 5 complete: the core loop is live. Onboard, process a JD, or run a one-off analysis. Breadth modes land in Phase 3.` → `Phase 3 of 5 complete: all everyday modes are live. Still to come: markdown reports (Phase 4) and the update mechanism (Phase 5).`

- [ ] **Step 4: `CLAUDE.md`**

1. `` - Modes: `modes/` (`_shared`, `onboard`, `process`, `analyze`; breadth modes in Phase 3) `` → `` - Modes: `modes/` (all everyday modes; `report` and `update` land in Phases 4–5) ``
2. `` - Customization guide: `docs/CUSTOMIZATION.md — Phase 3` `` → `` - Customization guide: [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) ``

- [ ] **Step 5: `docs/HOW-TO.md`** (three hedges, exact current strings)

1. `see \`docs/CUSTOMIZATION.md\` (Phase 3).` → `see [\`CUSTOMIZATION.md\`](CUSTOMIZATION.md).`
2. `` - Change target roles / industries / comp: `/rolecraft profile` (Phase 3), or edit `user/profile/profile.yml` directly `` → `` - Change target roles / industries / comp: `/rolecraft profile`, or edit `user/profile/profile.yml` directly ``
3. `` - `/rolecraft clear` (Phase 3) — confirmation-gated wipe of `user/data/` only. Keeps your identity. `` → `` - `/rolecraft clear` — confirmation-gated wipe of `user/data/` only. Keeps your identity. ``

- [ ] **Step 6: `docs/ONBOARDING.md`**

`/rolecraft recurate\` (Phase 3) re-ranks` → `/rolecraft recurate\` re-ranks`

- [ ] **Step 7: `docs/DATA_CONTRACT.md`**

`The \`clear\` mode (Phase 3) provides` → `The \`clear\` mode provides`

- [ ] **Step 8: `VERSION`** → `0.3.0`

- [ ] **Step 9: Verify no stale hedges**

Run:
```bash
grep -rn "(Phase 3)" README.md CLAUDE.md modes/ docs/HOW-TO.md docs/ONBOARDING.md docs/DATA_CONTRACT.md skills/ || echo "clean"
cat VERSION
```

Expected: `clean`, then `0.3.0`.

- [ ] **Step 10: Commit**

```bash
git add modes/_shared.md skills/rolecraft/SKILL.md README.md CLAUDE.md docs/HOW-TO.md docs/ONBOARDING.md docs/DATA_CONTRACT.md VERSION
git commit -m "docs caught up with phase 3, v0.3.0

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 10: Smoke walkthrough (fixture persona, every success criterion)

Reuse the Phase 2 fixture approach: synthetic persona Avery Example (Backend Engineer archetype + synonyms, Finance/Payments, knows SQL cold, deal-breaker "fully on-site"), with `user/data/` pre-populated to the post-Phase-2-walkthrough state (LedgerLine JD processed once). Build the fixture, run each mode's logic, verify, then `rm -rf user/`.

- [ ] **Step 1: Rebuild fixture** — recreate `user/profile/{profile.yml,cv.md,_profile.md,article-digest.md}` and `user/data/*` exactly as the Phase 2 walkthrough left them (Phase 2 plan Task 7 has the persona; the data files reflect one processed LedgerLine JD).

- [ ] **Step 2: Slice isolation** — hash all of `user/`, execute `modes/concepts.md` with a second inline JD (any synthetic fintech backend JD mentioning e.g. "double-entry ledgers" and "Kafka"), then verify ONLY `user/data/concepts.md` changed (hash diff shows exactly one file). Repeat the reasoning for `stack` against `stack-tracker.md`.

- [ ] **Step 3: Dashboard without a JD** — hand-edit a value in `user/data/concepts.md` ranks, execute `modes/dashboard.md`, verify only `dashboard.md` changed and it reflects current tracker contents.

- [ ] **Step 4: Profile single-field edit** — execute `modes/profile.md` logic to change `industries.list` from `Finance` to `Healthcare` (single-field YAML edit), verify `profile.yml` is still valid YAML (`node` + a YAML-less structural check: the changed line only) and nothing in `user/data/` moved.

- [ ] **Step 5: Recurate with mismatch warning** — execute `modes/recurate.md` against the now-Healthcare profile. Verify the mismatch check WOULD warn (all tracked data is Finance-sourced → warning required), choose "re-rank anyway", verify: concepts/stack re-ranked with Finance-specific items demoted (not deleted), projects/companies rows flagged in Notes, dashboard regenerated, `jd-archive.md` and `inbox.md` byte-identical to before.

- [ ] **Step 6: Clear** — execute `modes/clear.md`: verify it lists current contents, requires the literal word `clear`, then reset `user/data/` files to templates. Verify every `user/data/` file is byte-identical to its template and `user/profile/` untouched.

- [ ] **Step 7: Companies (structural only)** — don't run live WebSearch in the walkthrough; verify `modes/companies.md` instructions cover discovery, dedupe-by-name, append-only merge, and the career-ops hook note. (Live search behavior is inherently non-deterministic; structural review is the verification here.)

- [ ] **Step 8: Teardown** — `rm -rf user/`, `git status --short` empty, `git ls-files | grep ^user/` empty.

- [ ] **Step 9: Final check**

```bash
ls modes/
git log --oneline main..HEAD
```

Expected: 12 mode files (`_shared` + 11 modes), commits from Tasks 1–9.

---

## Self-review

1. **Spec coverage** — modes table rows for all eight Phase 3 modes have tasks (1–7); `docs/CUSTOMIZATION.md` (Task 8) including the auto-PR rationale the spec parked there; every Phase 3 success criterion is exercised in Task 10 (isolation, dashboard-without-JD, profile field walk, Finance→Healthcare recurate, confirmation-gated clear preserving profile).
2. **Placeholder scan** — none; the `_No X tracked yet._` strings are template literals, not gaps.
3. **Consistency** — mode names match SKILL.md's dispatch list; write-scopes match the spec's persistence column; dashboard structure matches `modes/process.md` section 9 verbatim; seeding/template paths match `_shared.md`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-10-rolecraft-phase-3-breadth-modes.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute in this session using `executing-plans`
