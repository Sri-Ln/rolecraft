# Rolecraft Phase 2 — Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/rolecraft` works end-to-end on the new architecture — JD in → trackers updated, first-run onboarding works for a fresh user, `analyze` gives inline answers without persistence.

**Architecture:** Four mode instruction files land under `modes/` (`_shared.md` + `onboard.md` + `process.md` + `analyze.md`), each a markdown behavior spec that Claude executes when `skills/rolecraft/SKILL.md` dispatches to it. `docs/ONBOARDING.md` documents the onboarding flow for end users. Phase 1 hedges ("lands in Phase 2") across SKILL.md / README / CLAUDE.md / ARCHITECTURE / HOW-TO get resolved, and VERSION bumps to `0.2.0`.

**Tech Stack:** Markdown only. No code, no dependencies. These are LLM-behavior files — there is no automated test harness (deferred to future backlog item #6 in the spec). Verification is structural checks plus a scripted smoke walkthrough using a synthetic fixture persona.

**Spec reference:** `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md` (Phase 2 section + Onboarding flow + Modes table)

**Branch:** Work on `phase-2-core-loop` (cut fresh from `main`).

---

## File Structure

| Path | Responsibility |
|---|---|
| `modes/_shared.md` (create) | Rules every mode loads first: sources of truth, silent onboarding check, user-file seeding, mode availability, shared conventions (markers, Δ legend, JD splitting, archetype matching, voice, data contract). |
| `modes/onboard.md` (create) | 6-step interactive intake. Writes `user/profile/*` only. |
| `modes/process.md` (create) | The everyday command. JD in → archive, concepts, stack, projects, companies, consolidated-jd, dashboard all updated; inbox cleared. No auto-PR pipeline. |
| `modes/analyze.md` (create) | One-off inline gap analysis. Writes nothing. |
| `docs/ONBOARDING.md` (create) | End-user doc: what onboarding asks, why, where data goes, privacy. |
| `skills/rolecraft/SKILL.md` (modify) | Status section: Phase 2 is live. |
| `README.md` (modify) | Un-hedge ONBOARDING.md links; status → Phase 2 complete. |
| `CLAUDE.md` (modify) | Modes pointer no longer "created in Phase 2". |
| `docs/ARCHITECTURE.md` (modify) | `_shared.md` is now the operational location of the first-run check. |
| `docs/HOW-TO.md` (modify) | Remove onboarding hedge; link `docs/ONBOARDING.md`. |
| `VERSION` (modify) | `0.1.0` → `0.2.0`. |

Design decisions locked here (consistent with the spec, called out so they don't look accidental):

1. **`process` seeds missing `user/data/` files from templates on demand.** A fresh marketplace install has no `user/` at all; `_shared.md` owns the seeding table so every mode behaves the same way.
2. **The `companies` slice inside `process` is JD-derived only in Phase 2** — it records the hiring company and any companies explicitly named in the JD, deduplicated. WebSearch-driven similar-company discovery is the Phase 3 `companies` mode. The spec's `process` row says "writes all user/data files"; this satisfies it without pulling Phase 3's WebSearch subagent forward.
3. **`analyze` never reads `user/data/inbox.md`.** The inbox belongs to `process`; `analyze` works only on a JD given inline (or via URL). This keeps "no persistence" airtight — analyze never has a reason to touch `user/data/`.
4. **Missing-mode handling lives in `_shared.md`.** SKILL.md dispatches `concepts`, `stack`, etc. today; until Phase 3 those files don't exist. `_shared.md` says: tell the user which phase the mode arrives in, list what works today.

---

## Pre-work

- [ ] **Verify branch and clean state**

Run:
```bash
git branch --show-current
git status
```

Expected: branch `phase-2-core-loop`, working tree clean.

- [ ] **Verify the Phase 1 scaffold this phase builds on**

Run:
```bash
git ls-files | grep -cE "templates/.*\.template\.(md|yml)"
ls modes 2>/dev/null || echo "modes/ absent (expected)"
```

Expected: `13` templates; `modes/` does not exist yet.

- [ ] **Read the spec's Phase 2 section, Onboarding flow table, and Modes table** at `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md`. Every mode file below must comply.

---

## Task 1: `modes/_shared.md`

**Files:**
- Create: `modes/_shared.md`

- [ ] **Step 1: Create the directory**

Run:
```bash
mkdir -p modes
```

- [ ] **Step 2: Write `modes/_shared.md`**

Contents:

````markdown
# Shared rules — every mode loads this first

Read this file before executing any mode file. Nothing here is mode-specific; everything here applies to every mode.

## Path resolution

All System Layer paths (`modes/`, `templates/`, `docs/`, `AGENTS.md`) are relative to the plugin root — the directory containing `.claude-plugin/`. The user layer (`user/profile/`, `user/data/`) also lives at the plugin root. It is gitignored and may not exist yet on a fresh install; modes create it on demand (see "Seeding user files").

## Silent onboarding check (ALWAYS FIRST)

Before doing anything else, check that all three files exist:

1. `user/profile/profile.yml`
2. `user/profile/cv.md`
3. `user/profile/_profile.md`

If any is missing, switch to `modes/onboard.md` immediately. Do not announce that a check ran — just tell the user first-time setup is needed and start the flow. When onboarding completes, resume whatever mode the user originally asked for.

If all three exist, proceed silently. Never mention the check.

## Sources of truth

Load these before doing mode work (when they exist):

| File | Path | When loaded |
|---|---|---|
| `profile.yml` | `user/profile/profile.yml` | ALWAYS — identity, target roles, industries, comp, location |
| `_profile.md` | `user/profile/_profile.md` | ALWAYS — archetypes, adaptive framing, deal-breakers, energy/drain mapping |
| `cv.md` | `user/profile/cv.md` | ALWAYS — canonical CV |
| `article-digest.md` | `user/profile/article-digest.md` | ALWAYS if exists — proof points, STAR stories |
| `writing-samples/` | `user/profile/writing-samples/` | When generating candidate-facing text |
| Mode-specific files | `user/data/{file}.md` | When the mode reads/writes that file |

Never hardcode metrics, employers, or domain facts. Everything user-specific comes from these files at runtime.

## Seeding user files

When a mode needs a `user/data/` file that doesn't exist, create it first by copying its template verbatim:

| Missing file | Seed from |
|---|---|
| `user/data/inbox.md` | `templates/inbox.template.md` |
| `user/data/jd-archive.md` | `templates/jd-archive.template.md` |
| `user/data/consolidated-jd.md` | `templates/consolidated-jd.template.md` |
| `user/data/concepts.md` | `templates/concepts.template.md` |
| `user/data/stack-tracker.md` | `templates/stack-tracker.template.md` |
| `user/data/projects-index.md` | `templates/projects-index.template.md` |
| `user/data/companies.md` | `templates/companies.template.md` |
| `user/data/dashboard.md` | `templates/dashboard.template.md` |

Create missing directories (`user/data/`, `user/profile/writing-samples/`) with plain directory creation. Never `git add` anything under `user/` — the entire tree is gitignored by design.

## Mode availability

Phase 2 ships three modes: `onboard`, `process`, `analyze`. If the dispatched mode's file doesn't exist under `modes/`, don't improvise it. Tell the user which phase it arrives in and list what works today:

| Mode | Arrives in |
|---|---|
| `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear` | Phase 3 |
| `report` | Phase 4 |
| `update` | Phase 5 |

## Shared conventions

**Markers** (used in `user/data/concepts.md` and `user/data/stack-tracker.md`):

- 🎓 — known from prior experience. Never attach learning resources to a 🎓 item; never count it as a gap. The list of already-known concepts lives in `user/profile/_profile.md` (prior domain knowledge section). Honor it even when a JD demands the concept heavily.
- 🔥 — currently top 3 by JD demand.
- Δ legend: 🟢 ▲ N up · 🔴 ▼ N down · ⚪ — unchanged · 🆕 new this run.

**Previous-rank blocks.** `concepts.md` and `stack-tracker.md` end with an HTML comment block recording each item's rank from the previous run. Read it to compute Δ markers; rewrite it after re-ranking so the next run can diff. Never surface the block's contents in chat.

**Multiple JDs.** One inbox paste may hold several JDs separated by a line containing exactly `---NEW JOB---`. Process each separately, then merge results into the trackers.

**Archetype matching.** Match JD titles against `target_roles.archetypes` in `profile.yml` using canonical names AND synonyms. Respect `industries.mode`: `"match"` filters to the listed industries; `"any"` (or a `"*"` list entry) matches on title alone. When a JD matches no archetype, say so plainly and ask whether to proceed — never silently force a fit.

**Voice.** Calm, study-coach-flavored. Brief, focused, declarative. No hustle phrasing ("AI-powered", "10x your job search"). Honest gap analysis — if the user is genuinely under-qualified for a role, say so.

**Resources.** Curated free learning resources only, unless the user explicitly asks for paid ones.

**Data contract.** Modes write ONLY to `user/profile/` and `user/data/`. Never write user-specific content to a System Layer file. Full rules: `docs/DATA_CONTRACT.md`.
````

- [ ] **Step 3: Verify structure**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/_shared.md','utf-8');['Silent onboarding check','Sources of truth','Seeding user files','Mode availability','Shared conventions'].forEach(s=>console.log(s+':',c.includes(s)))"
```

Expected: all five `true`.

- [ ] **Step 4: Commit**

```bash
git add modes/_shared.md
git commit -m "$(cat <<'EOF'
Phase 2: add modes/_shared.md common rules

Sources of truth, silent onboarding check, user-file seeding table,
missing-mode handling, and shared conventions (markers, multi-JD
splitting, archetype matching, voice, data contract).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `modes/onboard.md`

**Files:**
- Create: `modes/onboard.md`

- [ ] **Step 1: Write `modes/onboard.md`**

Contents:

````markdown
# Mode: onboard

One-time interactive setup. Triggered automatically by the silent check in `modes/_shared.md` when any required profile file is missing, or explicitly via `/rolecraft onboard`.

**Reads:** `templates/*` for structure.
**Writes:** `user/profile/*` only. Never writes `user/data/` (those files seed lazily when `process` first needs them).

## Posture

You are a thoughtful tutor doing intake, not a recruiter. One step at a time — ask, wait, write the file, move on. Keep questions short; no walls of questions. If the user gives a partial answer, take what you got, fill the rest with clearly-marked placeholders they can edit later, and keep moving. Optional steps are genuinely optional — offer to skip.

## Before starting

1. Create `user/profile/writing-samples/` (and parents) if missing.
2. Check which of `profile.yml`, `cv.md`, `_profile.md`, `article-digest.md` already exist in `user/profile/`. Skip any step whose output already exists and tell the user what's already in place — re-onboarding fills gaps, it doesn't overwrite.
3. If ALL required files exist and the user invoked `onboard` explicitly, ask which file they want to revisit instead of rerunning the whole flow.

## Step 1 — CV → `user/profile/cv.md`

Ask: "I don't have your CV yet. Three ways to give it to me: (a) paste your CV right here, (b) paste your LinkedIn profile text, or (c) just tell me about your experience and I'll draft one for you to correct."

Write `user/profile/cv.md` following the structure of `templates/cv.template.md`: Summary, Experience (most recent first, hero bullet with a metric where possible), Education, Skills, Certifications, Side projects. If drafting from a conversation (option c), show the draft and get corrections before writing the final version.

## Step 2 — Identity & targets → `user/profile/profile.yml`

Copy `templates/profile.template.yml` to `user/profile/profile.yml`, then fill it interactively:

- **candidate** — name, email, location, links. Pre-fill anything already evident from the CV; confirm rather than re-ask.
- **target_roles.archetypes** — ask which role archetypes they're targeting (suggest options based on the CV). For each, propose 2–4 synonyms (phrasing variants that appear in real JDs) and confirm. Record `level` and `fit` (`primary` / `secondary` / `adjacent`).
- **industries** — ask for target industries, multi-select plus custom. Offer "any industry — match on title alone" explicitly; that sets `mode: "any"`. Sub-sectors optional.
- **compensation** — target range and minimum. Optional; empty strings are fine.
- **location** — preferred, open-to, visa status, sponsorship need.

## Step 3 — Proof points (optional) → `user/profile/article-digest.md`

Ask: "What's the most impressive thing you've shipped? I'll turn it into reusable interview material. (You can skip this and fill it in later.)"

If they engage: write `user/profile/article-digest.md` following `templates/article-digest.template.md` — hero proof point with context, what they built, why it matters, at least one STAR-ready story. If they skip: copy the template as-is so the file exists with placeholders.

## Step 4 — Framing & narrative → `user/profile/_profile.md`

Copy `templates/_profile.template.md` to `user/profile/_profile.md`, then fill it with short, focused questions:

- Hero pitch in one sentence (cross-cutting advantage).
- Adaptive framing per archetype: "when a JD matches X, what about you should I emphasize?"
- Energy/drain mapping: what kind of work energizes them, what drains them even when the title fits.
- Deal-breakers: hard filters that should flag a JD no matter how good the match.
- Negotiation defaults and location policy if they want them on record.
- **Prior domain knowledge:** ask what they already know cold — concepts rolecraft must NEVER suggest study resources for. Add a `## Your prior domain knowledge` section listing them. This feeds the 🎓 marker.
- **Framing discipline:** ask if there's anything they must never be described as (e.g., "built infra behind trading flows, never made trading decisions"). If yes, add a `## Your framing discipline (HARD RULE)` section.

## Step 5 — Personalization round

Ask, conversationally: "Last round, free-form: What makes you unique? What drains you? Any published work, certifications, or projects you'd lead with?"

Append the answers where they belong — narrative items into `_profile.md`, proof items into `article-digest.md`. Don't create new files.

## Step 6 — Ready

1. Confirm what was written: list the files in `user/profile/` and one line each on what they hold.
2. Print what works today: `/rolecraft` (process a JD), `/rolecraft analyze` (one-off gap analysis), `/rolecraft onboard` (revisit setup). Mention that more modes arrive in later phases.
3. Offer: "Paste a job description whenever you're ready and I'll process it."
4. If onboarding was auto-triggered on the way to another mode, resume that mode now.

## Rules

- Write each file as its step completes — don't batch everything to the end.
- Everything goes in `user/profile/`. Never write user content to a System Layer file.
- Tone per `_shared.md`: calm intake, not an interrogation.
````

- [ ] **Step 2: Verify structure**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/onboard.md','utf-8');for(let i=1;i<=6;i++)console.log('Step '+i+':',c.includes('## Step '+i));console.log('writes profile only:',c.includes('user/profile/*` only'))"
```

Expected: all six steps `true`, final boolean `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/onboard.md
git commit -m "$(cat <<'EOF'
Phase 2: add modes/onboard.md 6-step intake flow

CV, identity/targets, proof points, framing/narrative,
personalization round, ready check. Writes user/profile/* only;
re-onboarding fills gaps instead of overwriting.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `docs/ONBOARDING.md`

**Files:**
- Create: `docs/ONBOARDING.md`

- [ ] **Step 1: Write `docs/ONBOARDING.md`**

Contents:

````markdown
# Onboarding

What rolecraft asks when you first install it, why it asks, and where your answers go.

## When it runs

- Automatically, the first time you invoke any rolecraft mode and `user/profile/` is missing or incomplete.
- Explicitly, any time, via `/rolecraft onboard`. Re-running fills gaps; it never overwrites files you already have.

## The six steps

| Step | What it asks | Where it goes | Skippable? |
|---|---|---|---|
| 1. CV | Paste your CV, paste LinkedIn text, or describe your experience and rolecraft drafts one for your correction | `user/profile/cv.md` | No — this is the canonical source for everything else |
| 2. Identity & targets | Name, contact, links. Target role archetypes (with suggested synonyms), industries (or "any"), comp range, location, visa | `user/profile/profile.yml` | No, but comp/links can stay blank |
| 3. Proof points | The most impressive thing you've shipped, turned into interview-ready material | `user/profile/article-digest.md` | Yes — a placeholder file is created either way |
| 4. Framing & narrative | Hero pitch, what to emphasize per archetype, energy/drain mapping, deal-breakers, things you already know cold, things you must never be described as | `user/profile/_profile.md` | No — this shapes every recommendation |
| 5. Personalization | Free-form: what makes you unique, published work, certs | Appended to `_profile.md` / `article-digest.md` | Yes |
| 6. Ready | Confirms what was written, lists available modes, offers to process your first JD | — | — |

## Why each step exists

- **CV** is the single source of truth for metrics. Every mode reads it instead of guessing at your experience.
- **Archetypes with synonyms** are how rolecraft matches messy real-world JD titles ("Back-End Engineer", "Server-Side Developer") to the roles you actually want.
- **Industries** control company suggestions and project framing. "Any" is a first-class choice — early-career or industry-agnostic searches match on title alone.
- **Prior domain knowledge** is what keeps the concepts tracker honest: things you already know get a 🎓 marker and never show up as study recommendations.
- **Deal-breakers** flag JDs immediately, no matter how good the title match looks.

## Privacy

Everything onboarding writes lives under `user/`, which is gitignored. Nothing personal is ever committed to the repo, and skill updates never touch your `user/` directory. See `docs/DATA_CONTRACT.md`.

## Editing later

Every file onboarding creates is yours to edit directly:

- `user/profile/profile.yml` — targets, industries, comp, location
- `user/profile/cv.md` — experience and metrics
- `user/profile/_profile.md` — framing, narrative, deal-breakers
- `user/profile/article-digest.md` — proof points and STAR stories

Or re-run `/rolecraft onboard` and pick the file to revisit. After significant changes, `/rolecraft recurate` (Phase 3) re-ranks your existing trackers against the new targets.
````

- [ ] **Step 2: Verify structure**

Run:
```bash
node -e "const c=require('fs').readFileSync('docs/ONBOARDING.md','utf-8');['six steps','Privacy','Editing later'].forEach(s=>console.log(s+':',c.toLowerCase().includes(s.toLowerCase())))"
```

Expected: all `true`.

- [ ] **Step 3: Commit**

```bash
git add docs/ONBOARDING.md
git commit -m "$(cat <<'EOF'
Phase 2: add docs/ONBOARDING.md end-user guide

Documents the six onboarding steps, why each exists, the privacy
model (user/ gitignored), and how to edit profile files later.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `modes/process.md`

**Files:**
- Create: `modes/process.md`

- [ ] **Step 1: Write `modes/process.md`**

Contents:

````markdown
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
````

- [ ] **Step 2: Verify structure**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/process.md','utf-8');['## 1. Collect input','## 3. Archive','## 4. Concepts','## 5. Tech stack','## 6. Projects','## 7. Companies','## 8. Consolidated JD','## 9. Dashboard','## 10. Clear inbox','## 11. Report'].forEach(s=>console.log(s+':',c.includes(s)))"
```

Expected: all `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/process.md
git commit -m "$(cat <<'EOF'
Phase 2: add modes/process.md everyday pipeline

Inline-or-inbox input, multi-JD splitting, archive append, concepts
and stack re-ranking with delta markers, extend-vs-new project
decisions, JD-derived companies, consolidated-JD rewrite, dashboard
regeneration, inbox clearing. No auto-PR pipeline.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `modes/analyze.md`

**Files:**
- Create: `modes/analyze.md`

- [ ] **Step 1: Write `modes/analyze.md`**

Contents:

````markdown
# Mode: analyze

One-off learning-gap analysis, answered inline. Nothing is saved.

**Reads:** all sources of truth (`_shared.md` table) plus the JD given with the invocation.
**Writes:** NOTHING. Hard rule. No tracker updates, no archive append, no dashboard refresh, no inbox read or clear. The inbox belongs to `process`. If the user wants this JD tracked, that's `/rolecraft process`.

## Input

A JD pasted with the invocation, or a URL to fetch. If neither is present, ask for one — do NOT fall back to `user/data/inbox.md`.

## Output (inline, in this order)

1. **Fit** — which archetype matched (canonical or synonym, name it), industry filter result, deal-breaker flags from `_profile.md`, comp vs the user's minimum, visa/sponsorship signals vs their status.
2. **You already have** — JD requirements already covered, each backed by a specific proof point from `cv.md` or `article-digest.md`. Include prior-domain-knowledge items (🎓 territory) here, not under gaps.
3. **Gaps** — what's genuinely missing, ranked by importance to THIS role. Per gap: 1–2 curated free resources and a realistic ramp estimate (days/weeks, not "quickly").
4. **What to build** — one niche, business-aware project angle that would prove readiness for this role: the business problem it models plus an MVP scope. Never a generic CRUD demo.
5. **Verdict** — honest one-liner: strong fit / stretch / long shot, and the single thing that would most move the needle.

## Closing line

End with: "Nothing was saved. To add this JD to your radar, run `/rolecraft process`."
````

- [ ] **Step 2: Verify structure**

Run:
```bash
node -e "const c=require('fs').readFileSync('modes/analyze.md','utf-8');['Writes:** NOTHING','**Fit**','**You already have**','**Gaps**','**What to build**','**Verdict**','Nothing was saved'].forEach(s=>console.log(s+':',c.includes(s)))"
```

Expected: all `true`.

- [ ] **Step 3: Commit**

```bash
git add modes/analyze.md
git commit -m "$(cat <<'EOF'
Phase 2: add modes/analyze.md no-persistence gap analysis

Inline fit/have/gaps/build/verdict report against the user's
profile. Hard no-write rule; never touches the inbox.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Resolve Phase 1 hedges + VERSION bump

**Files:**
- Modify: `skills/rolecraft/SKILL.md` (Status section)
- Modify: `README.md` (lines 22, 61, 66 area)
- Modify: `CLAUDE.md` (modes pointer)
- Modify: `docs/ARCHITECTURE.md` (first-run check sentence)
- Modify: `docs/HOW-TO.md` (onboarding hedge)
- Modify: `VERSION`

- [ ] **Step 1: Update SKILL.md Status section**

Replace the entire `## Status` section body with:

```markdown
Phase 2 of 5. The core loop is live: `onboard`, `process`, and `analyze` work end-to-end. Breadth modes (`concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`) land in Phase 3; `report` in Phase 4; `update` in Phase 5. Invoking a not-yet-shipped mode tells you which phase it arrives in. See `docs/superpowers/plans/` for the per-phase implementation plans.
```

- [ ] **Step 2: Update README.md**

Three edits:

1. Install paragraph: `see \`docs/ONBOARDING.md — Phase 2\` for what it asks and why.` → ``see [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for what it asks and why.``
2. Documentation list: `` - `docs/ONBOARDING.md — Phase 2` `` → `` - [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — what onboarding asks and why ``
3. Status section: replace `Phase 1 of 5 complete: scaffolding and data migration. The skill is not yet functional — modes land in Phase 2.` with `Phase 2 of 5 complete: the core loop is live. Onboard, process a JD, or run a one-off analysis. Breadth modes land in Phase 3.` (keep the trailing sentence pointing at `docs/superpowers/plans/`).

- [ ] **Step 3: Update CLAUDE.md**

`` - Modes: `modes/` (created in Phase 2) `` → `` - Modes: `modes/` (`_shared`, `onboard`, `process`, `analyze`; breadth modes in Phase 3) ``

- [ ] **Step 4: Update docs/ARCHITECTURE.md**

`` `AGENTS.md` specifies the first-run check logic; `modes/_shared.md` (Phase 2) becomes the operational location. `` → `` `AGENTS.md` specifies the first-run check logic; `modes/_shared.md` is the operational location. ``

- [ ] **Step 5: Update docs/HOW-TO.md**

Replace `(Exact onboarding steps land in Phase 2; the flow below reflects current design intent and may evolve.)` with `Full detail on every step: [\`ONBOARDING.md\`](ONBOARDING.md).`

- [ ] **Step 6: Bump VERSION**

`VERSION` content: `0.2.0` (single line).

- [ ] **Step 7: Verify no stale hedges remain**

Run:
```bash
grep -rn "lands in Phase 2\|created in Phase 2\|(Phase 2) becomes\|ONBOARDING.md — Phase 2\|not yet functional" README.md CLAUDE.md docs/ARCHITECTURE.md docs/HOW-TO.md skills/rolecraft/SKILL.md || echo "clean"
cat VERSION
```

Expected: `clean`, then `0.2.0`.

- [ ] **Step 8: Commit**

```bash
git add skills/rolecraft/SKILL.md README.md CLAUDE.md docs/ARCHITECTURE.md docs/HOW-TO.md VERSION
git commit -m "$(cat <<'EOF'
Phase 2: resolve Phase 1 hedges, bump VERSION to 0.2.0

SKILL.md and README now describe the live core loop; ONBOARDING.md
links are real; ARCHITECTURE and HOW-TO drop "lands in Phase 2"
language.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Smoke walkthrough with a synthetic persona

No automated harness exists for LLM-behavior files (deferred per spec backlog #6). This task verifies the spec's Phase 2 success criteria by executing the mode instructions against a synthetic fixture, then removing the fixture. `user/` is gitignored, so none of this touches git.

**Fixture persona (synthetic — do NOT use the repo author's real data):** Avery Example, backend engineer, targets "Backend Engineer" (synonyms: "Backend Developer", "Back-End Engineer"), industry Finance, knows SQL cold (prior domain knowledge), deal-breaker: "fully on-site roles".

**Sample JD for the walkthrough:**

```
Backend Developer — LedgerLine (fintech, Series B)
Remote (US). $140k–$170k.
Build the reconciliation engine that matches payment events across
processors. Must have: Python, PostgreSQL, event-driven architecture,
idempotent consumers. Nice to have: Kafka, Terraform. You'll work with
our partners at Stripe and Plaid. We sponsor visas.
```

- [ ] **Step 1: Build the fixture profile**

Create `user/profile/` files by following `modes/onboard.md` non-interactively with the persona above: `profile.yml` (Avery's identity, the Backend Engineer archetype with synonyms, Finance industry `mode: match`, minimum $130k, no sponsorship need), `cv.md` (brief synthetic backend CV mentioning Python and SQL), `_profile.md` (deal-breaker "fully on-site roles"; prior domain knowledge: SQL), `article-digest.md` (template copy). Create `user/profile/writing-samples/` and `user/data/`.

- [ ] **Step 2: Run the process pipeline**

Seed `user/data/inbox.md` from the template, paste the sample JD below the marker, then execute `modes/process.md` sections 1–11 exactly as written.

- [ ] **Step 3: Verify every success criterion**

Check each:

```bash
ls user/data
grep -c "LedgerLine" user/data/jd-archive.md          # >= 1
grep -c "🆕" user/data/concepts.md                     # >= 1 (new concepts marked)
grep -n "SQL" user/data/concepts.md                    # absent OR 🎓-marked, NO resources
grep -n "Python" user/data/stack-tracker.md            # present under Languages
grep -c "LedgerLine\|Stripe\|Plaid" user/data/companies.md   # >= 1
grep -n "JDs merged into this profile" user/data/consolidated-jd.md  # counter = 1
grep -n "Last updated" user/data/dashboard.md          # regenerated
diff user/data/inbox.md templates/inbox.template.md    # empty (inbox cleared)
```

Also confirm: the match verdict reported "Backend Developer" matched via synonym; the project suggestion names a business problem (reconciliation-flavored) and is not a CRUD demo.

- [ ] **Step 4: Verify analyze writes nothing**

Hash all of `user/data/` (`find user/data -type f -exec md5sum {} \;` → save output), execute `modes/analyze.md` against a second short JD (any synthetic backend JD), re-hash, and diff the two hash lists.

Expected: hash lists identical; analyze produced the 5-section inline output ending with the "Nothing was saved" line.

- [ ] **Step 5: Verify the onboarding trigger**

Confirm by inspection against `modes/_shared.md`: with `user/profile/` deleted, the silent check fails on file 1 and routes to `onboard`. Then physically test the seeding path: delete only `user/data/`, re-run `modes/process.md` step 1 reasoning, and confirm `_shared.md`'s seeding table covers every file `process` needs.

- [ ] **Step 6: Remove the fixture**

```bash
rm -rf user/
git status
```

Expected: working tree clean (fixture was never visible to git).

- [ ] **Step 7: Final repo verification**

```bash
git ls-files | grep "^user/" || echo "no user files tracked (good)"
git ls-files modes/ docs/ONBOARDING.md
git log --oneline main..HEAD
```

Expected: no tracked user files; `modes/_shared.md`, `modes/analyze.md`, `modes/onboard.md`, `modes/process.md`, `docs/ONBOARDING.md` all tracked; commit list shows the Task 1–6 commits.

- [ ] **Step 8: Record walkthrough results**

If any criterion failed, fix the responsible mode file and amend understanding — do not paper over. When all pass, note the walkthrough outcome in the final report to the user (not in a committed file).

---

## Self-review

Run against the spec's Phase 2 section before handoff:

1. **Spec coverage** — `modes/_shared.md` (Task 1: sources of truth ✓, silent onboarding check ✓, common rules ✓, router/mode-availability ✓); `modes/onboard.md` (Task 2: 6-step flow matching the spec's onboarding table ✓); `modes/process.md` (Task 4: reads `user/profile/`, writes `user/data/`, no auto-PR ✓, dedup ✓, dashboard regenerated each run ✓); `modes/analyze.md` (Task 5: inline, no persistence ✓); `docs/ONBOARDING.md` (Task 3 ✓). Success criteria all exercised in Task 7.
2. **Placeholder scan** — the `[PLACEHOLDER]` mentions inside mode-file contents refer to template markers (the spec's contract), not plan gaps. No TBD/TODO in the plan.
3. **Consistency** — file paths (`user/data/inbox.md`, `templates/inbox.template.md`, marker `---NEW JOB---`, settings key `dashboard_top_n_per_category`) match the Phase 1 templates verbatim; mode names match SKILL.md's dispatch list; the Phase 3/4/5 mode split matches the spec's modes table.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-10-rolecraft-phase-2-core-loop.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints
