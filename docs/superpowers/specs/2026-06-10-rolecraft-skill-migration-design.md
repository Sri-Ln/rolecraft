# Rolecraft — Skill Migration Design

**Date:** 2026-06-10
**Branch:** `skill-migration`
**Status:** Draft for user review
**Authors:** Sri-Ln, with Claude

---

## Purpose

Evolve the current `SuperRepo` (Finance Portfolio Journey) — today a personal,
markdown-only JD tracker hardcoded to one user's profile — into **rolecraft**,
a distributable Claude Code skill that any engineer can install, onboard with
their own profile, and use to drive learning and project decisions from real
job descriptions.

The current `process inbox` loop is preserved as the everyday flow. Everything
else — persistence model, profile structure, output artifacts, install path —
is rebuilt so the skill is genuinely cloneable.

---

## Locked design decisions

Resolved during brainstorming. Not open to revision unless something
downstream forces a change.

| # | Decision | Rationale |
|---|---|---|
| 1 | Same repo, lift the markdown-only rule | One git history; CLAUDE.md's "no application code" rule is removed because the skill needs scripts, manifests, templates |
| 2 | User data is gitignored | Personal trackers stop being the artifact; the skill itself is the artifact |
| 3 | README becomes public skill docs | Personal dashboard regenerated locally as gitignored `user/data/dashboard.md` |
| 4 | Auto-PR / squash-merge pipeline dropped | Existed to ship personal data to GitHub; with user data gitignored, nothing to ship |
| 5 | Profile split (career-ops pattern) | `profile.yml` + `cv.md` + `article-digest.md` + `_profile.md` — each file has one focused job |
| 6 | User layer split into `profile/` + `data/` | `user/profile/` user-owned source of truth; `user/data/` skill-generated; clean wipe semantics |
| 7 | Skill / plugin / marketplace name: `rolecraft` | All three share one name. Catchy, single-word, action-oriented |
| 8 | Phasing: 5 phases | Smaller reviewable diffs over fewer larger ones |
| 9 | PDF deferred to Phase 5 | Phase 1 ships dependency-light; markdown report first in Phase 4 |
| 10 | career-ops integration: documented hook, no code in v1 | Not installed locally; WebSearch-only `companies` mode for now |
| 11 | Distribution: marketplace-only at launch | Cross-CLI npx wrapper deferred to a follow-on phase |
| 12 | AGENTS.md as master skill doc | Multi-platform pattern from career-ops; CLAUDE.md becomes thin pointer |
| 13 | Industry filtering supports `*` wildcard | "Any industry, match on title alone" is a first-class option |
| 14 | Title-expansion (canonical + synonyms) | Without synonyms, archetype matching breaks on phrasing variants |
| 15 | Community marketplace submission targeted for Phase 5 | Self-publish via `Sri-Ln/rolecraft` first; submit to `claude-community` once stable |

---

## Naming model

Four distinct identifiers. All independent. All renameable later by editing a
single field. None lock in permanently.

| Name | Defined in | What it controls | Value |
|---|---|---|---|
| GitHub repo | github.com settings | URL in `/plugin marketplace add` | `rolecraft` (renamed from `SuperRepo`/`fintech` at user's discretion) |
| Marketplace `name` | `.claude-plugin/marketplace.json` | Internal catalog identifier; appears in `/plugin list` and as `@suffix` for disambiguation | `rolecraft` |
| Plugin `name` | `.claude-plugin/plugin.json` | What users type in `/plugin install` | `rolecraft` |
| Skill invocation | `skills/rolecraft/SKILL.md` frontmatter | What users type to invoke the skill | `rolecraft` (`/rolecraft <mode>`) |

**Typical user install flow (no `@marketplace` suffix needed):**

```
/plugin marketplace add Sri-Ln/rolecraft
/plugin install rolecraft
```

The `@rolecraft` suffix is a tiebreaker only — only needed if a user has
multiple marketplaces installed that both contain a plugin called `rolecraft`.
Vanishingly rare in practice.

---

## Architecture

### Repo layout (final)

```
rolecraft/                                     # repo root = plugin root
├── .claude-plugin/
│   ├── plugin.json                            # plugin manifest (Phase 1)
│   └── marketplace.json                       # marketplace-of-one (Phase 1)
├── skills/rolecraft/
│   └── SKILL.md                               # entry point Claude Code discovers
├── modes/
│   ├── _shared.md                             # Sources of Truth, silent onboarding
│   │                                          # check, update check, common rules,
│   │                                          # mode router
│   ├── _profile.template.md
│   ├── onboard.md
│   ├── process.md                             # everyday command (replaces current
│   │                                          # `process inbox`)
│   ├── analyze.md
│   ├── concepts.md
│   ├── stack.md
│   ├── projects.md
│   ├── companies.md
│   ├── dashboard.md
│   ├── profile.md
│   ├── recurate.md
│   ├── clear.md
│   ├── report.md                              # Phase 4
│   └── update.md                              # Phase 5
├── templates/
│   ├── profile.template.yml
│   ├── cv.template.md
│   ├── article-digest.template.md
│   ├── _profile.template.md
│   ├── concepts.template.md
│   ├── stack-tracker.template.md
│   ├── projects-index.template.md
│   ├── companies.template.md
│   ├── interview-prep.template.md
│   ├── inbox.template.md
│   ├── consolidated-jd.template.md
│   ├── jd-archive.template.md
│   ├── dashboard.template.md
│   └── report.md.tmpl                         # Phase 4
├── scripts/                                   # Phase 4+
│   ├── render-report.mjs                      # Phase 4
│   ├── generate-pdf.mjs                       # Phase 5
│   ├── update-system.mjs                      # Phase 5
│   ├── doctor.mjs                             # Phase 5
│   ├── version.mjs                            # Phase 5
│   └── test-all.mjs                           # Phase 5
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_CONTRACT.md
│   ├── CUSTOMIZATION.md
│   ├── ONBOARDING.md
│   ├── HOW-TO.md
│   ├── PUBLISHING.md                          # Phase 5
│   └── superpowers/specs/                     # this spec lives here
├── examples/                                  # Phase 5
│   ├── sample-report.md
│   └── sample-report.pdf
├── user/                                      # GITIGNORED
│   ├── profile/                               # user-owned source of truth
│   │   ├── profile.yml
│   │   ├── cv.md
│   │   ├── article-digest.md
│   │   ├── _profile.md
│   │   ├── interview-prep.md
│   │   └── writing-samples/
│   └── data/                                  # skill-generated outputs
│       ├── inbox.md
│       ├── jd-archive.md
│       ├── consolidated-jd.md
│       ├── concepts.md
│       ├── stack-tracker.md
│       ├── projects-index.md
│       ├── companies.md
│       ├── dashboard.md
│       └── reports/                           # Phase 4+
├── AGENTS.md                                  # master skill doc
├── CLAUDE.md                                  # thin pointer (~20 lines)
├── README.md                                  # public skill docs
├── package.json                               # Phase 4+
├── VERSION                                    # Phase 5
├── LICENSE                                    # Phase 5 (MIT default)
└── .gitignore                                 # adds /user/, /node_modules/, etc.
```

### Data contract

Two layers, enforced by directory + gitignore. The full file-level breakdown
lives in `docs/DATA_CONTRACT.md` (Phase 1 deliverable). Summary:

**System Layer** — tracked in git, auto-updatable, never holds user-specific
content:

- `.claude-plugin/`, `skills/rolecraft/SKILL.md`
- `modes/*.md`, `templates/*`, `scripts/*`
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/*`
- `package.json`, `VERSION`, `LICENSE`, `.gitignore`

**User Layer** — gitignored, never touched by `update`:

- `user/profile/*` — user-owned (identity, CV, framing, narrative)
- `user/data/*` — skill-generated (trackers, dashboard, reports)

**The rule:** when the user asks to customize anything — archetypes, narrative,
deal-breakers, target industry, comp targets, proof points — Claude writes to
`user/profile/`. Claude never edits System Layer files for user-specific
content. This guarantees `update` mode never overwrites personalization.

### Sources of Truth (loaded by every mode)

Goes into `modes/_shared.md`:

| File | Path | When loaded |
|---|---|---|
| `profile.yml` | `user/profile/profile.yml` | ALWAYS — identity, targets, industries |
| `_profile.md` | `user/profile/_profile.md` | ALWAYS — archetypes, framing, deal-breakers |
| `cv.md` | `user/profile/cv.md` | ALWAYS — canonical CV |
| `article-digest.md` | `user/profile/article-digest.md` | ALWAYS if exists — proof points |
| `writing-samples/` | `user/profile/writing-samples/` | When generating candidate-facing text |
| (mode-specific) | `user/data/{file}.md` | When the mode reads/writes that file |

---

## User-layer files (what each one holds)

### `user/profile/profile.yml`

Structured config. Read programmatically by modes (industries, archetypes,
synonyms, comp, location, visa, thresholds). Schema:

```yaml
candidate:
  full_name: ""
  email: ""
  location: ""
  linkedin: ""
  github: ""
  portfolio: ""

target_roles:
  archetypes:
    - canonical: "Backend Engineer"
      synonyms: ["Backend Developer", "Back-End Engineer", "Server-Side Engineer"]
      level: "Mid"
      fit: "primary"

industries:
  mode: "match"          # "match" = filter to list; "any" = title-only match
  list:
    - "Finance"
  sub_sectors:
    Finance:
      - "Treasury Tech"

compensation:
  target_range: ""
  minimum: ""
  currency: "USD"

location:
  preferred: []
  open_to: []
  visa_status: ""
  needs_sponsorship: false

settings:
  auto_pdf_score_threshold: 3.5
  dashboard_top_n_per_category: 5
```

### `user/profile/cv.md`

Canonical CV. Single source for metrics. Read by `report`, `analyze`, and any
candidate-facing text generation.

### `user/profile/article-digest.md`

Proof-points digest: hero proof point, supporting proof points, STAR stories,
domain signals, side projects. Optional but strongly recommended — it turns
vague learning advice into "you already have X; here's how it applies."

### `user/profile/_profile.md`

Narrative file. Adaptive framing tables ("if backend role → emphasize X"),
exit narrative, cross-cutting advantage, energy/drain mapping, deal-breakers,
negotiation defaults, location policy. The file Claude updates when the user
gives qualitative feedback.

### `user/profile/interview-prep.md`

Manually maintained study list. Untouched by modes. Carried over from current
`learning/interview-prep.md`.

### `user/profile/writing-samples/`

Optional directory. Ships empty. Used by `report` and candidate-facing
generation for tone matching. Cached writing-style summary lives in
`_profile.md`.

### `user/data/inbox.md`

Paste-here scratchpad. Cleared by `process` after each run.

### `user/data/jd-archive.md`

Raw history of every JD processed. Appended only. Never deduplicated.

### `user/data/consolidated-jd.md`

Deduplicated master JD synthesized from all processed JDs. Rewritten each
`process` run.

### `user/data/concepts.md`

Ranked concept list with sources. Today's file becomes this. Seeded with the
current user's MS-known concepts (🎓 marker) during Phase 1 migration.

### `user/data/stack-tracker.md`

Tech stack ranked by occurrence per category. Today's file becomes this.

### `user/data/projects-index.md`

Project suggestions + suggestion log. Suggestions are niche, business-aware,
include MVP scope + rough timeline. Today's file becomes this.

### `user/data/companies.md`

Persistent list of target companies (deduplicated across JDs). Generated by
`companies` mode.

### `user/data/dashboard.md`

One-stop summary across all user files. Regenerated by `dashboard` mode and
incidentally by `process`.

### `user/data/reports/`

Polished reports. Markdown in Phase 4; PDF in Phase 5.

---

## Modes

The router (`skills/rolecraft/SKILL.md` + `modes/_shared.md`) dispatches on
`/rolecraft <mode>`. Every mode loads `modes/_shared.md` + the mode file +
user-layer sources of truth.

| Mode | Invocation | Persistence | Purpose | Phase |
|---|---|---|---|---|
| `process` | `/rolecraft` (default) or `/rolecraft process` | writes all user/data files | JD in → run every slice (concepts, stack, projects, companies, consolidated-jd, jd-archive, dashboard). The everyday command. | 2 |
| `analyze` | `/rolecraft analyze` | none | JD in → inline learning-gap analysis. No persistence. | 2 |
| `onboard` | `/rolecraft onboard` (auto-triggered if profile missing) | writes user/profile/* | Interactive 6-step Q&A. | 2 |
| `concepts` | `/rolecraft concepts` | writes user/data/concepts.md | Scoped slice: concepts only, merged + deduped + re-ranked. | 3 |
| `stack` | `/rolecraft stack` | writes user/data/stack-tracker.md | Scoped slice: tech stack only. | 3 |
| `projects` | `/rolecraft projects` | writes user/data/projects-index.md | After ≥2 JDs, decide extend-vs-new project. Niche, business-aware, MVP + timeline. | 3 |
| `companies` | `/rolecraft companies` | writes user/data/companies.md | WebSearch subagent finds similar-role companies; merges + dedupes. | 3 |
| `dashboard` | `/rolecraft dashboard` | writes user/data/dashboard.md | Read-only summary refresh. | 3 |
| `profile` | `/rolecraft profile` | writes user/profile/* | Interactive editor for individual fields. | 3 |
| `recurate` | `/rolecraft recurate` | rewrites user/data/* rankings | After profile change, re-rank concepts/stack/companies/projects against new targets. Warns on heavy mismatch. | 3 |
| `clear` | `/rolecraft clear` | wipes user/data/* | Confirmation-gated. Preserves user/profile/*. | 3 |
| `report` | `/rolecraft report` | writes user/data/reports/<slug>.md | Polished markdown report (Phase 4); PDF in Phase 5. | 4 / 5 |
| `update` | `/rolecraft update` | updates System Layer | Pull upstream system files; never touches user/. | 5 |

### Mode dispatch heuristics (goes in AGENTS.md)

| If the user... | Mode |
|---|---|
| Pastes a JD or URL with no instruction | `process` |
| Says "process this" / "process inbox" | `process` |
| Asks "what would this role take?" without committing | `analyze` |
| Wants only concepts to study | `concepts` |
| Wants only tech-stack ranking | `stack` |
| Wants project suggestions | `projects` |
| Wants similar companies | `companies` |
| Asks for a summary / "where am I at" | `dashboard` |
| Wants to update profile / goals | `profile` |
| Changed industry/role and wants everything re-ranked | `recurate` |
| Wants to wipe trackers and start over | `clear` |
| Wants a polished report | `report` |
| Wants to update the skill | `update` |
| Hasn't set up yet | `onboard` (auto-triggered) |

---

## Onboarding flow

Triggered:

- Silently on session start if any of `user/profile/{profile.yml, cv.md,
  _profile.md}` is missing
- Explicitly via `/rolecraft onboard`

| Step | What it asks | What it writes |
|---|---|---|
| 1. CV | "I don't have your CV yet. Either: (a) paste your CV, (b) paste your LinkedIn URL, (c) tell me about your experience and I'll draft one." | `user/profile/cv.md` |
| 2. Identity & Targets | Name, email, location, links. Target archetypes (multi-select + custom + suggested synonyms). Industries (multi-select + `*` for any). Comp range. Visa. | `user/profile/profile.yml` |
| 3. Proof Points *(optional)* | "What's the most impressive thing you've shipped? I'll turn it into reusable interview material." | `user/profile/article-digest.md` |
| 4. Framing & Narrative | Hero pitch in one sentence. Adaptive framing per archetype. Energy/drain mapping. Deal-breakers. Negotiation defaults. | `user/profile/_profile.md` |
| 5. Personalization round | "What makes you unique? What drains you? Any published work, certs, or projects you'd lead with?" | Appended to `_profile.md` and `article-digest.md` |
| 6. Ready | Confirm. Print available modes. Offer to process a first JD. | — |

---

## Voice / tone

rolecraft is a **calm, study-coach-flavored learning companion**, not an
automation hustle tool. Templates, README, AGENTS.md, and mode prompts all
reflect this:

- Outputs are *what to learn and what to build to become the engineer this
  role wants* — not "scores" or "PDFs to spam recruiters"
- Quality stance applies to *projects and concepts*: niche, business-aware,
  curated free sources only
- Onboarding tone: a thoughtful tutor doing intake, not a recruiter

Project suggestions are explicitly forbidden from being generic CRUD demos.
Every suggested project must explain the business problem it models alongside
the tech.

**Voice samples for templates** (avoid sounding like career-ops):

career-ops (avoided):
> "AI-powered, CLI-agnostic job search automation: pipeline tracking, offer
> evaluation, CV generation, portal scanning, batch processing."

rolecraft (target):
> "rolecraft turns job descriptions into a focused learning radar. Paste a
> JD; get back what to study, what to build, and where else this role exists.
> Designed for engineers who treat a job search as a study plan."

---

## Phasing

### Phase 1 — Scaffolding & data migration (no functional changes)

**Goal:** Repo restructured to the new layout. Existing data preserved under
`user/`. Modes don't exist yet — purely structural.

**Files created (System Layer):**

- `.claude-plugin/plugin.json` (name: `rolecraft`, version `0.1.0`)
- `.claude-plugin/marketplace.json` (name: `rolecraft`, listing the plugin)
- `skills/rolecraft/SKILL.md` (manifest + frontmatter, points at AGENTS.md)
- `AGENTS.md` (master skill doc — generic, no personal data)
- `CLAUDE.md` (thin pointer, replaces today's 227-line file)
- `README.md` (public skill docs, replaces today's dashboard)
- `templates/*.template.{md,yml}` (all 14 templates with `[PLACEHOLDER]` markers)
- `docs/DATA_CONTRACT.md`, `docs/ARCHITECTURE.md`, `docs/HOW-TO.md`
- `VERSION` (`0.1.0`)
- `.gitignore` updated: add `/user/`, revise `.claude/` rule with negation so
  `.claude-plugin/` is tracked but session state remains ignored

**Files migrated (current → User Layer):**

Personal content from current `CLAUDE.md` is split across four files in
`user/profile/`. Generated trackers move to `user/data/`. See "Migration
notes" section below for the specific mapping.

**Directories deleted:** `job-analysis/`, `tech-stack/`, `learning/`,
`projects/` (now empty after moves).

**Commits:** ~3 commits on `skill-migration` branch

1. `Phase 1.a: scaffold plugin structure, manifests, templates, docs`
2. `Phase 1.b: migrate personal data into user/ layout`
3. `Phase 1.c: gitignore user/, remove empty top-level dirs`

**Success criteria:**

- `git ls-files` shows only System Layer files (no `user/*` tracked)
- `user/profile/` contains filled-in personal files
- `user/data/` contains migrated trackers
- `claude --plugin-dir .` loads the plugin without errors
- Old top-level directories are gone
- No mode is functional yet (mode files don't exist until Phase 2)

### Phase 2 — Core loop restored

**Goal:** `/rolecraft` works again, end-to-end, on the new architecture. JD in
→ trackers updated. First-run onboarding works for a fresh user.

**Files created:**

- `modes/_shared.md` — Sources of Truth, silent onboarding check, mode router,
  common rules
- `modes/onboard.md` — 6-step interactive flow
- `modes/process.md` — replaces today's `process inbox`; reads `user/profile/`
  and writes to `user/data/`; **no auto-PR pipeline**
- `modes/analyze.md` — inline analysis, no persistence
- `docs/ONBOARDING.md`

**Success criteria:**

- Paste a JD into `user/data/inbox.md`; run `/rolecraft`; trackers update with
  dedup
- `/rolecraft analyze` returns inline analysis and writes nothing
- Delete `user/profile/`; session start triggers `onboard`; complete
  onboarding; process works after
- `dashboard.md` regenerated each `process` run

### Phase 3 — Breadth modes

**Files created:**

- `modes/{concepts,stack,projects,companies,dashboard,profile,recurate,clear}.md`
- `docs/CUSTOMIZATION.md`

**Success criteria:**

- Each mode runs in isolation against a JD and updates only its domain file
- `/rolecraft dashboard` regenerates the dashboard without a JD
- `/rolecraft profile` walks through editing one field at a time
- Change industry from Finance → Healthcare; `/rolecraft recurate` shifts
  rankings
- `/rolecraft clear` wipes `user/data/` after confirmation; `user/profile/`
  preserved

### Phase 4 — Markdown report

**Files created:**

- `package.json` (Node 20+, `js-yaml` only — no Playwright yet)
- `scripts/render-report.mjs` (markdown-only renderer)
- `modes/report.md`
- `templates/report.md.tmpl`

**Success criteria:**

- `/rolecraft report` produces clean `user/data/reports/<slug>.md`
- Renderer reads exclusively from user files — no hardcoded content

### Phase 5 — PDF, update, publishing prep

**Files created:**

- `scripts/generate-pdf.mjs` (Playwright HTML→PDF, ATS-normalized)
- `templates/report.html` (print CSS, page-break-aware)
- `scripts/update-system.mjs` (check / apply / dismiss / rollback)
- `scripts/doctor.mjs` (health check)
- `scripts/version.mjs`
- `scripts/test-all.mjs` (smoke tests for scripts)
- `modes/update.md`
- `docs/PUBLISHING.md` (marketplace submission steps; verified)
- `examples/sample-report.md`, `examples/sample-report.pdf`
- `LICENSE` (MIT)
- `package.json` modified to add Playwright
- `VERSION` bumped to `1.0.0`

**Success criteria:**

- `/rolecraft report` produces both markdown and PDF
- `/rolecraft update` reports up-to-date when in sync; offers apply when out
  of sync
- `node scripts/doctor.mjs` returns green
- `claude plugin validate` passes
- `docs/PUBLISHING.md` contains exact, verified submission steps for the
  Anthropic `claude-community` marketplace

---

## Publishing path

**Phase 1 onwards — self-publish via your own marketplace:**

Anyone can install rolecraft immediately after Phase 1 lands:

```
/plugin marketplace add Sri-Ln/rolecraft
/plugin install rolecraft
```

No Anthropic approval needed for self-publishing.

**Phase 5+ — submit to Anthropic's `claude-community` marketplace:**

1. Run `claude plugin validate` locally; fix any flagged issues.
2. Submit via in-app form:
   - Claude.ai: https://claude.ai/settings/plugins/submit
   - Console: https://platform.claude.com/plugins/submit
3. Anthropic review pipeline runs the same `claude plugin validate` plus
   automated safety screening plus manual review.
4. On approval, the plugin is pinned to a commit SHA in
   `anthropics/claude-plugins-community` and CI auto-bumps the pin as new
   commits land.
5. Verify visibility by searching for `rolecraft` in
   https://github.com/anthropics/claude-plugins-community/blob/main/.claude-plugin/marketplace.json.

**Name availability confirmed (2026-06-10):** No plugin named `rolecraft`,
`role-craft`, or `rolecrafter` exists in the community marketplace. The name
is free to claim.

`docs/PUBLISHING.md` (Phase 5 deliverable) documents the verified submission
flow. Submission itself stays manual — the user clicks the submit button when
ready.

---

## Migration mapping (generic)

Phase 1 splits the pre-existing personal content of any user-author's repo as follows. Each file rolecraft creates seeds one user-layer destination; existing trackers move as-is. This section describes the *categories* of content and where each goes — the original author's worked example is intentionally NOT in this committed doc (it lives in their gitignored `user/profile/migration-notes.md`, which they can reference locally or share separately if they choose).

### What the pre-Phase 1 `CLAUDE.md` should split into

- **`user/profile/profile.yml`** — identity, target archetypes (with synonyms), industries (with `mode: match` or `any`), comp range, location, visa.
- **`user/profile/cv.md`** — canonical CV: experience, education, skills, certifications.
- **`user/profile/_profile.md`** — framing rules, adaptive framing matrix, exit narrative, cross-cutting advantage, deal-breakers, energy/drain mapping.
- **`user/profile/article-digest.md`** — proof points and STAR stories (can seed empty; filled in `onboard` step 3).

### Files moved as-is

- `learning/concepts.md` → `user/data/concepts.md`
- `tech-stack/stack-tracker.md` → `user/data/stack-tracker.md`
- `projects/projects-index.md` → `user/data/projects-index.md`
- `job-analysis/inbox.md` → `user/data/inbox.md`
- `job-analysis/consolidated-jd.md` → `user/data/consolidated-jd.md`
- `learning/interview-prep.md` → `user/profile/interview-prep.md`

These paths reflect the pre-rolecraft repo layout the original author was migrating from. If you're a fresh installer with no existing content, skip this section — the templates seed empty versions of the same destination files.

### New empty files created

- `user/data/jd-archive.md`
- `user/data/companies.md`
- `user/data/dashboard.md`

### Why no personal example is in the committed spec

To keep this repo distributable and the spec generic. Personal migration notes for the original author live at `user/profile/migration-notes.md` (gitignored, present on disk only). Future contributors are expected to keep this section impersonal — anything user-specific belongs in the gitignored user layer.

---

## Future backlog

Deliberately deferred beyond Phase 5. To be filed as GitHub issues once
Phase 1 merges to main:

1. **Cross-CLI distribution** — npx wrapper (`npx @sri-ln/rolecraft init`) for
   Codex / Gemini / Copilot / Qwen / OpenCode users
2. **CV / portfolio PDF rendering** — extend Phase 5's PDF infra to produce
   tailored CVs
3. **Multi-persona support** — parallel job searches for two role tracks
4. **Language modes** — German / French / Japanese / Turkish, modeled on
   career-ops
5. **Anthropic community marketplace submission** — after rolecraft is stable
   in the personal marketplace
6. **Mode-output regression testing** — beyond Phase 5's smoke tests for
   scripts; LLM-output validation harness
7. **career-ops integration** — wire up `companies` mode to shell out to
   `career-ops scan.mjs` when the user has it installed; currently documented
   as a hook only

---

## Open issues resolved during design

These came up and are noted here so they don't get re-litigated:

- **Pinned GitHub Issue (#1) "Learning Tracker"** — dropped from the System
  Layer. With user data gitignored, the issue isn't part of the skill. If the
  user wants it for personal use, they set it up manually on their fork; the
  option is mentioned in `docs/HOW-TO.md`.
- **Auto-PR / squash-merge pipeline** — dropped. Documented rationale in
  `docs/CUSTOMIZATION.md` so anyone curious about the old workflow can find it.
- **`.claude/settings.local.json`** — preserved as-is. Not skill content; not
  touched by migration.
- **Multiple users on one machine** — not supported in v1. Each user clones
  the plugin to their own location (or installs via the marketplace command);
  `user/` is per-clone, gitignored, isolated.
- **Repo rename** — the user plans to rename the GitHub repo from `SuperRepo`
  / `fintech` to `rolecraft` at their discretion. Renaming after Phase 1 lands
  is harmless (GitHub redirects old URLs). The marketplace `add` command in
  documentation will use the final name.

---

## Implementation order

The next step after spec approval is invoking the `writing-plans` skill to
produce a detailed Phase 1 implementation plan. Each subsequent phase gets
its own plan when the previous phase merges.

Nothing in `main` changes until the user explicitly merges. All work happens
on the `skill-migration` branch (and per-phase sub-branches if the user
prefers).
