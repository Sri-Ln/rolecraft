# Rolecraft Phase 1 — Scaffolding & Data Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure this repo into the `rolecraft` Claude Code plugin layout. Move the user's personal data into a gitignored `user/` directory. Ship every System Layer scaffold file (manifests, templates, docs) so Phase 2 can wire up modes on top. No mode files are created in this phase; nothing executes yet.

**Architecture:** The repo root becomes the plugin root. `.claude-plugin/plugin.json` + `marketplace.json` make it a Claude Code marketplace-of-one. `skills/rolecraft/SKILL.md` is the entry point. `modes/`, `templates/`, `scripts/`, `docs/` sit at repo root. User data lives under gitignored `user/profile/` (source of truth) and `user/data/` (skill-generated outputs). Three sequential commits land the scaffold, the migration, and the gitignore cleanup.

**Tech Stack:** Markdown, YAML, JSON. No code yet. Git for branch management.

**Spec reference:** `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md`

**Branch:** Work on `skill-migration` (already cut from `main`).

---

## File Structure

Every file Phase 1 creates or modifies, with one-line responsibility.

### System Layer — created

| Path | Responsibility |
|---|---|
| `.claude-plugin/plugin.json` | Plugin manifest. Defines `rolecraft` as a Claude Code plugin. |
| `.claude-plugin/marketplace.json` | Marketplace catalog. Lists `rolecraft` as the only plugin. |
| `skills/rolecraft/SKILL.md` | Skill entry point. Claude Code discovers this when the plugin is enabled. |
| `AGENTS.md` | Master skill doc. Voice, data contract, mode dispatch table, sources of truth. |
| `README.md` | Public skill docs. What rolecraft is, install, quick start, modes list. (Rewritten.) |
| `CLAUDE.md` | Thin pointer to AGENTS.md. (Rewritten — was 227 lines, becomes ~20.) |
| `templates/profile.template.yml` | Skeleton for `user/profile/profile.yml`. |
| `templates/cv.template.md` | Skeleton for `user/profile/cv.md`. |
| `templates/_profile.template.md` | Skeleton for `user/profile/_profile.md` (archetypes, framing, deal-breakers). |
| `templates/article-digest.template.md` | Skeleton for `user/profile/article-digest.md`. |
| `templates/interview-prep.template.md` | Skeleton for `user/profile/interview-prep.md`. |
| `templates/concepts.template.md` | Skeleton for `user/data/concepts.md`. |
| `templates/stack-tracker.template.md` | Skeleton for `user/data/stack-tracker.md`. |
| `templates/projects-index.template.md` | Skeleton for `user/data/projects-index.md`. |
| `templates/companies.template.md` | Skeleton for `user/data/companies.md`. |
| `templates/inbox.template.md` | Skeleton for `user/data/inbox.md`. |
| `templates/consolidated-jd.template.md` | Skeleton for `user/data/consolidated-jd.md`. |
| `templates/jd-archive.template.md` | Skeleton for `user/data/jd-archive.md`. |
| `templates/dashboard.template.md` | Skeleton for `user/data/dashboard.md`. |
| `docs/ARCHITECTURE.md` | Architecture overview for contributors. |
| `docs/DATA_CONTRACT.md` | Authoritative User vs System Layer rules. |
| `docs/HOW-TO.md` | End-user guide. |
| `VERSION` | Plain text file, content: `0.1.0`. |

### System Layer — modified

| Path | Change |
|---|---|
| `.gitignore` | Add `/user/`. Replace `.claude/` rule with negation so `.claude-plugin/` stays tracked. |

### User Layer — created (gitignored, this user's personal data)

| Path | Source |
|---|---|
| `user/profile/profile.yml` | Distilled from current `CLAUDE.md` |
| `user/profile/cv.md` | Distilled from current `CLAUDE.md` "Most Recent Experience" section |
| `user/profile/_profile.md` | Distilled from current `CLAUDE.md` "Profile" + "Framing discipline" + "Prior finance knowledge" sections |
| `user/profile/article-digest.md` | Empty seed (user can fill via `/rolecraft onboard` step 3 later) |
| `user/profile/interview-prep.md` | Moved from `learning/interview-prep.md` |
| `user/data/concepts.md` | Moved from `learning/concepts.md` |
| `user/data/stack-tracker.md` | Moved from `tech-stack/stack-tracker.md` |
| `user/data/projects-index.md` | Moved from `projects/projects-index.md` |
| `user/data/inbox.md` | Moved from `job-analysis/inbox.md` |
| `user/data/consolidated-jd.md` | Moved from `job-analysis/consolidated-jd.md` |
| `user/data/jd-archive.md` | New, empty (with header) |
| `user/data/companies.md` | New, empty (with header) |
| `user/data/dashboard.md` | New, empty (with header) |

### Deleted (now empty after moves)

`job-analysis/`, `tech-stack/`, `learning/`, `projects/`

---

## Pre-work

- [ ] **Verify branch and clean state**

Run:
```bash
git branch --show-current
git status
```

Expected:
- Current branch: `skill-migration`
- Working tree clean (the design spec was already committed; no other modified files)

If the working tree is not clean, ask the user before proceeding — do not stash or discard work.

- [ ] **Read the design spec end-to-end**

Read: `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md`

Hold the data contract, mode list, and voice/tone guidance in context. Every file you create in this phase must comply with the spec.

- [ ] **Read the current CLAUDE.md fully**

Read: `CLAUDE.md`

You'll be extracting personal content from this file later. Note which categories of section hold what (the pre-Phase 1 CLAUDE.md varies per user; the categories below are the general mapping):
- Identity / strengths / target roles section → `user/profile/profile.yml` + `user/profile/cv.md`
- Most recent / current role section → `user/profile/cv.md`
- Framing / voice rules section → `user/profile/_profile.md`
- Prior domain knowledge (things to NOT recommend learning resources for) → `user/profile/_profile.md`
- Operational repo rules (Commands, README contract, Hygiene, etc.) → become obsolete; do not migrate (the new docs in this plan replace them)

If you're the original repo author and want the specific worked example for your data, see `user/profile/migration-notes.md` (gitignored; created during this phase). The plan itself stays generic so it's reusable.

---

## Commit 1.a — Scaffolding

All System Layer files for the plugin skeleton. No user data touched in this commit.

### Task 1: Plugin manifest

**Files:**
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create the directory**

Run:
```bash
mkdir -p .claude-plugin
```

- [ ] **Step 2: Write `.claude-plugin/plugin.json`**

Contents:
```json
{
  "name": "rolecraft",
  "version": "0.1.0",
  "description": "JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists.",
  "author": {
    "name": "Sri-Ln",
    "url": "https://github.com/Sri-Ln"
  },
  "homepage": "https://github.com/Sri-Ln/rolecraft",
  "repository": "https://github.com/Sri-Ln/rolecraft",
  "license": "MIT",
  "keywords": ["career", "learning", "job-description", "study-plan", "fintech"],
  "skills": true,
  "permissions": {
    "allow": [
      "Bash(node:*)",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

Notes for the executor:
- The `"skills": true` boolean tells Claude Code to auto-discover the `skills/` directory.
- `homepage` and `repository` reference the future renamed repo (`rolecraft`). The user is renaming the GitHub repo from `SuperRepo`/`fintech` to `rolecraft` after Phase 1 lands. GitHub redirects keep old install URLs working.

- [ ] **Step 3: Verify the JSON parses**

Run:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf-8')).name)"
```

Expected output: `rolecraft`

### Task 2: Marketplace catalog

**Files:**
- Create: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Write `.claude-plugin/marketplace.json`**

Contents:
```json
{
  "name": "rolecraft",
  "owner": {
    "name": "Sri-Ln",
    "url": "https://github.com/Sri-Ln"
  },
  "description": "Personal marketplace for rolecraft and any future Sri-Ln Claude Code skills.",
  "plugins": [
    {
      "name": "rolecraft",
      "source": "./",
      "description": "JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists.",
      "category": "productivity",
      "keywords": ["career", "learning", "job-description", "study-plan"]
    }
  ]
}
```

Notes:
- `"source": "./"` means "the plugin lives at the marketplace root" — same pattern career-ops uses. The marketplace root is the directory containing `.claude-plugin/`, which here is the repo root.
- The reserved-name list in Claude Code's docs blocks names like `claude-community`, `anthropic-plugins`, etc. `rolecraft` is not on that list (verified against the docs).

- [ ] **Step 2: Verify the JSON parses**

Run:
```bash
node -e "const m=JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf-8'));console.log(m.name+' / '+m.plugins[0].name)"
```

Expected output: `rolecraft / rolecraft`

### Task 3: Skill entry point

**Files:**
- Create: `skills/rolecraft/SKILL.md`

- [ ] **Step 1: Create the directory**

Run:
```bash
mkdir -p skills/rolecraft
```

- [ ] **Step 2: Write `skills/rolecraft/SKILL.md`**

Contents:
```markdown
---
description: JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists. Use when the user pastes a job description, says "process this", asks "what would this role take", or wants concepts, tech stacks, companies, projects, or a dashboard summary derived from past JDs.
argument-hint: <mode>
---

# rolecraft

Routes to one of the rolecraft modes based on `$ARGUMENTS`.

## Dispatch

When invoked:

1. Read `AGENTS.md` at the plugin root for voice, data contract, mode dispatch table, and ethical stance.
2. Read `modes/_shared.md` at the plugin root for sources of truth, the silent onboarding check, and common rules.
3. Determine the target mode from `$ARGUMENTS`:
   - Empty / no argument → `process` (the default)
   - One of: `process`, `analyze`, `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`, `report`, `update`, `onboard` → that mode
   - Anything else → treat as a pasted JD or instruction and route to `process`
4. Read `modes/<target>.md` at the plugin root and execute it.

## Reminder

Never write user-specific content to the System Layer. All personalization goes into `user/profile/*` and `user/data/*` — see `docs/DATA_CONTRACT.md`.
```

Notes:
- Mode files (`modes/_shared.md`, `modes/*.md`) do not exist yet — they land in Phase 2. SKILL.md references them anyway so the manifest is complete; Phase 2 will create them.
- The `description` field has to be detailed enough that Claude can match user intent to the skill (per the SKILL.md spec).

### Task 4: AGENTS.md (master skill doc)

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write `AGENTS.md`**

Contents:

````markdown
# rolecraft — AI Agent Instructions

## What rolecraft is

A JD-driven study companion. Paste a job description; rolecraft returns what to learn, what to build, and where else this kind of role exists. Designed for engineers who treat a job search as a study plan.

Outputs are *learning artifacts* — ranked concept lists, tech-stack study orders, niche project ideas, similar-role companies, a dashboard summarizing all of it. Not application volume. Not scores. Not PDFs to spam recruiters.

## Voice and tone

Calm, study-coach-flavored. Brief, focused, declarative. Avoid hustle-mode phrasing ("AI-powered", "10x your job search", "automated outreach"). Project suggestions must be niche and business-aware — never generic CRUD demos. Every suggested project must explain the business problem it models alongside the tech.

## Sources of truth

Every mode loads these (when they exist):

| File | Path | When loaded |
|---|---|---|
| `profile.yml` | `user/profile/profile.yml` | ALWAYS — identity, target roles, industries, comp, location |
| `_profile.md` | `user/profile/_profile.md` | ALWAYS — archetypes, adaptive framing, deal-breakers, energy/drain mapping |
| `cv.md` | `user/profile/cv.md` | ALWAYS — canonical CV |
| `article-digest.md` | `user/profile/article-digest.md` | ALWAYS if exists — proof points, STAR stories |
| `writing-samples/` | `user/profile/writing-samples/` | When generating candidate-facing text |
| Mode-specific files | `user/data/{file}.md` | When the mode reads/writes that file |

Never hardcode metrics or domain facts. Read them from the source-of-truth files at runtime.

## Data contract (CRITICAL)

Two layers. Full breakdown in `docs/DATA_CONTRACT.md`.

**User Layer (NEVER auto-updated; personalization goes HERE):**
- `user/profile/*` — identity, CV, framing, narrative, archetypes, deal-breakers
- `user/data/*` — generated trackers, dashboard, reports
- `user/profile/writing-samples/`

**System Layer (auto-updatable; never put user-specific content here):**
- `.claude-plugin/`, `skills/rolecraft/SKILL.md`
- `modes/*`, `templates/*`, `scripts/*`
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/*`
- `package.json`, `VERSION`, `LICENSE`, `.gitignore`

**THE RULE:** When the user asks you to customize anything — archetypes, narrative, deal-breakers, target industry, comp targets, proof points — write to `user/profile/`. Never edit System Layer files for user-specific content. This guarantees `update` mode never overwrites personalization.

## First-run check (run silently every session)

On the first message of every session, check whether onboarding is complete:

1. Does `user/profile/profile.yml` exist?
2. Does `user/profile/cv.md` exist?
3. Does `user/profile/_profile.md` exist?

If any is missing, route the user to the `onboard` mode immediately. Do not proceed with any other request until onboarding is complete.

If all three exist, proceed normally. Do not announce the check.

## Mode dispatch table

| If the user... | Mode |
|---|---|
| Pastes a JD or URL with no instruction | `process` |
| Says "process this", "process inbox", "process the JD" | `process` |
| Asks "what would this role take?" without committing to track it | `analyze` |
| Wants only concepts to study | `concepts` |
| Wants only tech-stack ranking | `stack` |
| Wants project suggestions | `projects` |
| Wants similar companies hiring for the same role | `companies` |
| Asks for a summary, "where am I at", or wants the dashboard refreshed | `dashboard` |
| Wants to edit identity, target roles, industries, comp, location | `profile` |
| Changed target industry/role and wants existing data re-ranked | `recurate` |
| Wants to wipe trackers and start over | `clear` |
| Wants a polished report from a previous run | `report` |
| Wants to pull updates to the skill itself | `update` |
| Is missing one of the three required profile files | `onboard` (auto-triggered) |

## Personalization principle

You (the agent) can and should edit `user/profile/*` and `user/data/*` files when the user asks for changes. The user says "switch my target industry from finance to healthcare" — you edit `user/profile/profile.yml`. They say "this concept doesn't apply to me" — you remove it from `user/data/concepts.md` and note the reasoning in `user/profile/_profile.md`. They give qualitative feedback after a run — you fold it into `_profile.md` so the next run knows.

The skill should get smarter every interaction without you ever writing user-specific content to a System Layer file.

## Update check (Phase 5)

Once `scripts/update-system.mjs` exists (Phase 5), run it silently on the first message of every session and surface available updates without auto-applying. Until then, this section is a placeholder.

## Ethical stance

- Suggested projects are niche and business-aware. No generic to-do lists or CRUD demos.
- Curated free learning resources only. No paid resources unless the user explicitly asks.
- Honest gap analysis. If the user is genuinely under-qualified for a role, say so — don't pad the suggestions to make it look closer than it is.

## When in doubt

Read `docs/DATA_CONTRACT.md`, `docs/ARCHITECTURE.md`, and the spec at `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md`.
````

- [ ] **Step 2: Verify the file renders**

Run:
```bash
node -e "const c=require('fs').readFileSync('AGENTS.md','utf-8');console.log('lines:',c.split('\\n').length,'has data contract:',c.includes('Data contract'),'has dispatch table:',c.includes('Mode dispatch table'))"
```

Expected: lines > 60, both booleans true.

### Task 5: CLAUDE.md (slim pointer)

**Files:**
- Modify: `CLAUDE.md` (replaces the existing 227-line file entirely)

- [ ] **Step 1: Replace `CLAUDE.md` with the slim version**

Contents:
```markdown
# CLAUDE.md

This repo is the **rolecraft** Claude Code plugin. Master agent instructions live in [`AGENTS.md`](AGENTS.md). Read it on every session start.

Key pointers:

- Plugin manifest: `.claude-plugin/plugin.json`
- Marketplace catalog: `.claude-plugin/marketplace.json`
- Skill entry: `skills/rolecraft/SKILL.md`
- Modes: `modes/` (created in Phase 2)
- User data (gitignored): `user/profile/` (identity / source of truth) and `user/data/` (skill-generated outputs)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Data contract: [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md)
- Customization guide: [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) (Phase 3)
- End-user guide: [`docs/HOW-TO.md`](docs/HOW-TO.md)

Personal customization (target roles, framing, deal-breakers, comp targets) goes in `user/profile/_profile.md` and `user/profile/profile.yml`. Never edit System Layer files for user-specific content — see `docs/DATA_CONTRACT.md` for the full rule.
```

- [ ] **Step 2: Verify the replacement**

Run:
```bash
node -e "const c=require('fs').readFileSync('CLAUDE.md','utf-8');console.log('lines:',c.split('\\n').length)"
```

Expected: lines < 25.

### Task 6: README.md (public skill docs)

**Files:**
- Modify: `README.md` (replaces the existing visual dashboard entirely)

- [ ] **Step 1: Replace `README.md` with the skill docs**

Contents:

````markdown
# rolecraft

> JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists.

rolecraft is a Claude Code plugin that turns job descriptions into a focused learning radar. It accumulates signals across the JDs you actually care about and surfaces:

- Named concepts you should study, with curated free sources
- Tech stacks ranked by job-market demand and your current gaps
- Niche, business-aware project ideas that showcase domain understanding alongside the tech
- Similar-role companies in your target industries
- A one-stop dashboard that summarizes everything

Designed for engineers who treat a job search as a study plan, not an application blast.

## Install

```
/plugin marketplace add Sri-Ln/rolecraft
/plugin install rolecraft
```

That's it. The skill runs onboarding automatically on first use — see `docs/ONBOARDING.md` (lands in Phase 2) for what it asks and why.

## Quick start

```
/rolecraft onboard                 # one-time setup (auto-triggers if missing)
/rolecraft                         # paste a JD; runs full pipeline
/rolecraft analyze                 # paste a JD; one-off gap analysis, no persistence
/rolecraft dashboard               # refresh the summary
/rolecraft profile                 # edit your targets / industries / comp
```

The full mode list lives in [`AGENTS.md`](AGENTS.md).

## What rolecraft does NOT do

- Search for jobs (you bring the JDs)
- Auto-apply to roles
- Generate spam-grade cover letters
- Score companies or recruiters
- Track applications

## Data contract

Two layers, enforced by directory:

- **`user/`** — your data. Gitignored. Never touched by skill updates.
  - `user/profile/` — your identity, CV, framing rules
  - `user/data/` — skill-generated trackers, dashboard, reports
- Everything else at the repo root is System Layer — the skill itself. Auto-updatable.

Full file-by-file rules in [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the skill is structured
- [`docs/HOW-TO.md`](docs/HOW-TO.md) — end-user guide
- [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md) — what's user-owned vs system-owned
- [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) — Phase 3
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — Phase 2
- [`docs/PUBLISHING.md`](docs/PUBLISHING.md) — Phase 5

## Status

Phase 1 of 5 complete: scaffolding and data migration. The skill is not yet functional — modes land in Phase 2. See [`docs/superpowers/plans/`](docs/superpowers/plans/) for the implementation plans of each phase.

## License

MIT (see `LICENSE` — added in Phase 5).
````

- [ ] **Step 2: Verify the replacement**

Run:
```bash
node -e "const c=require('fs').readFileSync('README.md','utf-8');console.log('starts with # rolecraft:',c.startsWith('# rolecraft'),'has install:',c.includes('/plugin marketplace add'),'has quick start:',c.includes('Quick start'))"
```

Expected: all booleans true.

### Task 7: User-profile templates

**Files:**
- Create: `templates/profile.template.yml`
- Create: `templates/cv.template.md`
- Create: `templates/_profile.template.md`
- Create: `templates/article-digest.template.md`
- Create: `templates/interview-prep.template.md`

- [ ] **Step 1: Create the templates directory**

Run:
```bash
mkdir -p templates
```

- [ ] **Step 2: Write `templates/profile.template.yml`**

Contents:
```yaml
# rolecraft profile configuration
# Copied to user/profile/profile.yml on first run.
# Onboarding (/rolecraft onboard) fills in [PLACEHOLDER] values interactively.
# You can also edit this file directly at any time.

candidate:
  full_name: "[PLACEHOLDER]"
  email: "[PLACEHOLDER]"
  location: "[PLACEHOLDER]"
  linkedin: "[PLACEHOLDER]"
  github: "[PLACEHOLDER]"
  portfolio: "[PLACEHOLDER]"

# Target archetypes drive how rolecraft matches JD titles and ranks suggestions.
# Each archetype has a canonical name plus optional synonyms (phrasing variants
# that appear in real JDs). Add synonyms as you encounter them in the wild.
target_roles:
  archetypes:
    - canonical: "[PLACEHOLDER]"
      synonyms: []
      level: "[PLACEHOLDER]"   # Entry | Mid | Senior | Staff | Principal
      fit: "primary"            # primary | secondary | adjacent

# Industries control which sectors rolecraft considers in the `companies` mode
# and how it shapes project recommendations.
# mode: "match"  - filter to industries listed below
# mode: "any"    - disable filter, match on title alone (good for early career
#                  or when you're industry-agnostic)
industries:
  mode: "match"
  list:
    - "[PLACEHOLDER]"
  sub_sectors: {}             # e.g.  Finance: ["Treasury Tech", "Electronic Trading"]

compensation:
  target_range: "[PLACEHOLDER]"
  minimum: "[PLACEHOLDER]"
  currency: "USD"

location:
  preferred: []
  open_to: []
  visa_status: "[PLACEHOLDER]"
  needs_sponsorship: false

settings:
  auto_pdf_score_threshold: 3.5
  dashboard_top_n_per_category: 5
```

- [ ] **Step 3: Write `templates/cv.template.md`**

Contents:
```markdown
# CV — [PLACEHOLDER: Your Name]

> Canonical CV. Single source of truth for metrics, experience, education,
> skills. rolecraft modes read from this file at runtime — never duplicate
> facts elsewhere. Update this file as your career evolves.

## Summary

[PLACEHOLDER: one-paragraph summary — strongest signal first. What kind of
engineer you are, your headline experience, where you're heading.]

## Experience

### [PLACEHOLDER: Company] — [PLACEHOLDER: Title]
*[PLACEHOLDER: Dates]*

- [PLACEHOLDER: hero bullet — most impressive thing you shipped, with a metric]
- [PLACEHOLDER: bullet 2]
- [PLACEHOLDER: bullet 3]

## Education

### [PLACEHOLDER: Degree, Institution]
*[PLACEHOLDER: Dates]*

[PLACEHOLDER: GPA, honors, relevant coursework if early-career]

## Skills

**Languages:** [PLACEHOLDER]
**Frameworks:** [PLACEHOLDER]
**Infrastructure:** [PLACEHOLDER]
**Domain:** [PLACEHOLDER]

## Certifications

- [PLACEHOLDER if applicable]

## Side projects

- [PLACEHOLDER if applicable]
```

- [ ] **Step 4: Write `templates/_profile.template.md`**

Contents:
```markdown
# Your rolecraft profile

> **This file is YOURS.** rolecraft never auto-updates it.
>
> Customize everything below: archetypes, framing, narrative, deal-breakers,
> energy mapping, negotiation defaults, location policy. rolecraft reads this
> on every mode invocation and uses it to shape its output.

## Your target roles

| Archetype | Thematic axes | What roles in this archetype really buy |
|---|---|---|
| [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] |

## Your adaptive framing

When a JD matches a given archetype, emphasize the proof points from `cv.md` and `article-digest.md` that map cleanly. Fill in the table during onboarding or as you process JDs.

| If the role is... | Emphasize about you... | Proof points to cite |
|---|---|---|
| [PLACEHOLDER: archetype 1] | [PLACEHOLDER] | [PLACEHOLDER: cv.md section / article-digest.md story] |
| [PLACEHOLDER: archetype 2] | [PLACEHOLDER] | [PLACEHOLDER] |

## Your exit narrative

[PLACEHOLDER: one paragraph that bridges where you've been to where you're going. What's the through-line of your career to someone reading your CV for the first time?]

## Your cross-cutting advantage

[PLACEHOLDER: in one sentence, what would you tell an interviewer is your superpower that other candidates don't have? Lead every interview with this.]

## Your energy / drain mapping

**Energizing — score UP:**
- [PLACEHOLDER]

**Draining — score DOWN, even if the title matches:**
- [PLACEHOLDER]

## Your deal-breakers

Hard filters. rolecraft penalizes JDs that hit these.

1. [PLACEHOLDER]
2. [PLACEHOLDER]

## Your location policy

- **Preferred:** [PLACEHOLDER]
- **Open to:** [PLACEHOLDER]
- **Not interested:** [PLACEHOLDER]

## Your visa / sponsorship constraints

[PLACEHOLDER]

## Your published work / domain signal

Links and proof points that demonstrate domain literacy.

- [PLACEHOLDER if applicable]
```

- [ ] **Step 5: Write `templates/article-digest.template.md`**

Contents:
```markdown
# Proof points digest — [PLACEHOLDER: Your Name]

> Compact, interview-ready proof points. Use these to back claims in CVs,
> applications, and STAR-style answers. `cv.md` is the canonical source for
> metrics; this file expands the context and narrative behind each one.
>
> rolecraft reads this on every mode invocation (when it exists) and uses it
> to ground its recommendations in your real experience.

## Hero proof point — [PLACEHOLDER: Most impressive thing you've shipped]

**Team / context:** [PLACEHOLDER]
**When:** [PLACEHOLDER]

### What it is

[PLACEHOLDER: one paragraph]

### What you built

- [PLACEHOLDER: bullet with metric]
- [PLACEHOLDER]

### Why it matters (interview framing)

[PLACEHOLDER: one paragraph — what does this prove about you that other candidates can't show?]

### STAR-ready stories

- **[PLACEHOLDER: story name] (S/T/A/R/R):**
  - *Situation:* [PLACEHOLDER]
  - *Task:* [PLACEHOLDER]
  - *Action:* [PLACEHOLDER]
  - *Result:* [PLACEHOLDER]
  - *Reflection:* [PLACEHOLDER — what did this teach you?]

## Supporting proof points

### [PLACEHOLDER: prior role or project]

- [PLACEHOLDER: bullet]

## Domain fluency signals

Certifications, published work, conference talks, open-source contributions, etc. that demonstrate domain literacy beyond the engineering itself.

- [PLACEHOLDER if applicable]
```

- [ ] **Step 6: Write `templates/interview-prep.template.md`**

Contents:
```markdown
# Interview prep

> Your manually-edited study list. rolecraft modes never modify this file —
> it's yours to maintain.

## Coding & DSA

- [PLACEHOLDER: topic]
  - Source: [PLACEHOLDER: free resource URL]

## System design

- [PLACEHOLDER: topic]
  - Source: [PLACEHOLDER]

## Language / platform deep dive

- [PLACEHOLDER: topic]
  - Source: [PLACEHOLDER]

## Behavioral

- [PLACEHOLDER: story or framework]
  - Source: [PLACEHOLDER]
```

- [ ] **Step 7: Verify all five files exist**

Run:
```bash
ls -1 templates/ | grep -E "^(profile|cv|_profile|article-digest|interview-prep)\.template\.(yml|md)$" | wc -l
```

Expected output: `5`

### Task 8: User-data templates

**Files:**
- Create: `templates/concepts.template.md`
- Create: `templates/stack-tracker.template.md`
- Create: `templates/projects-index.template.md`
- Create: `templates/companies.template.md`
- Create: `templates/inbox.template.md`
- Create: `templates/consolidated-jd.template.md`
- Create: `templates/jd-archive.template.md`
- Create: `templates/dashboard.template.md`

- [ ] **Step 1: Write `templates/concepts.template.md`**

Contents:
```markdown
# Concepts

> Ranked list of concepts to study, curated from processed JDs. rolecraft
> writes to this file from the `concepts` and `process` modes.

> 🎓 = known from prior experience (don't recommend resources)
> 🔥 = currently in the top 3 by JD demand
> **Δ legend:** 🟢 ▲ N up · 🔴 ▼ N down · ⚪ — unchanged · 🆕 new this run

---

_No concepts tracked yet. Process a JD with `/rolecraft` to start._

<!--
PREVIOUS RANKS — managed by rolecraft. Do not edit by hand.
Format: `concept name: previous_rank`
-->
```

- [ ] **Step 2: Write `templates/stack-tracker.template.md`**

Contents:
```markdown
# Tech stack tracker

> Every technology mentioned across processed JDs, grouped by category,
> ranked within its category by occurrence count.
>
> **Δ legend:** 🟢 ▲ N up · 🔴 ▼ N down · ⚪ — unchanged · 🆕 new this run

---

## Languages

_No languages tracked yet._

## Frameworks

_No frameworks tracked yet._

## Tools

_No tools tracked yet._

## Methodologies

_No methodologies tracked yet._

## Infra

_No infra tracked yet._

<!--
PREVIOUS RANKS — managed by rolecraft. Do not edit by hand.
Format: `category | tech: previous_rank`
-->
```

- [ ] **Step 3: Write `templates/projects-index.template.md`**

Contents:
```markdown
# Projects index

> Niche, business-aware project suggestions derived from processed JDs.
> Code lives in **separate repos** — this file only tracks what to build,
> what each project covers, and where its repo lives.
>
> **Status** ∈ `idea | building | done`

| Project | Status | Tech stack | Domain concepts | Repo URL | Notes |
|---|---|---|---|---|---|

---

## Suggestion log

_No JDs processed yet._
```

- [ ] **Step 4: Write `templates/companies.template.md`**

Contents:
```markdown
# Target companies

> Companies hiring for roles similar to those you've processed, in your
> target industries. rolecraft writes to this file from the `companies`
> and `process` modes. Deduplicated across JDs.

| Company | Industry | Sub-sector | Relevant roles | Source JD | Notes |
|---|---|---|---|---|---|

_No companies tracked yet._
```

- [ ] **Step 5: Write `templates/inbox.template.md`**

Contents:
````markdown
# Inbox

Paste raw job descriptions below. Separate multiple JDs with a line containing exactly:

```
---NEW JOB---
```

When you run `/rolecraft` (or `/rolecraft process`), the contents below are analyzed and the trackers updated, and this file is cleared back to this template.

---

<!-- Paste JD(s) below this line -->
````

- [ ] **Step 6: Write `templates/consolidated-jd.template.md`**

Contents:
```markdown
# Consolidated job description

> A single synthetic "master JD" merged from every JD rolecraft has processed.
> Deduplicated, reusable standalone — copy this file into any other project
> or tool that needs a clean view of your target role profile.

> **JDs merged into this profile:** 0

---

_No JDs processed yet. Run `/rolecraft` against a JD to start._
```

- [ ] **Step 7: Write `templates/jd-archive.template.md`**

Contents:
```markdown
# JD archive

> Raw history of every JD rolecraft has processed. Appended only — never
> deduplicated. Use this when you want to recall exactly what the original
> ask looked like, or when you're spotting patterns across raw JDs.

---

_No JDs archived yet._
```

- [ ] **Step 8: Write `templates/dashboard.template.md`**

Contents:
```markdown
# rolecraft dashboard

> One-stop summary of your current state. rolecraft regenerates this file
> on every `process` and `dashboard` run.

_No data yet. Run `/rolecraft` against a JD to populate._
```

- [ ] **Step 9: Verify all eight files exist**

Run:
```bash
ls -1 templates/ | wc -l
```

Expected output: `13` (5 from Task 7 + 8 from this task)

### Task 9: Documentation files

**Files:**
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/DATA_CONTRACT.md`
- Create: `docs/HOW-TO.md`

- [ ] **Step 1: Create the docs directory if missing**

Run:
```bash
ls -d docs 2>/dev/null || mkdir docs
```

(The directory already exists from the spec, but this is idempotent.)

- [ ] **Step 2: Write `docs/ARCHITECTURE.md`**

Contents:

````markdown
# Architecture

rolecraft is a Claude Code plugin distributed as a marketplace-of-one. The repo root is the plugin root. Two layers — System (tracked, auto-updatable) and User (gitignored, user-owned) — keep distribution clean and customization safe.

## Layout

```
rolecraft/
├── .claude-plugin/
│   ├── plugin.json              # plugin manifest
│   └── marketplace.json         # catalog (lists rolecraft as the only plugin)
├── skills/rolecraft/
│   └── SKILL.md                 # router; Claude Code's entry point
├── modes/                       # one file per discrete operation (Phase 2+)
├── templates/                   # seeds for user/profile/ and user/data/
├── scripts/                     # Node.js helpers (Phase 4+)
├── docs/                        # this directory
├── examples/                    # sample outputs (Phase 5)
├── user/                        # GITIGNORED
│   ├── profile/                 # user-owned source of truth
│   └── data/                    # skill-generated outputs
├── AGENTS.md                    # master agent instructions (cross-platform)
├── CLAUDE.md                    # thin pointer to AGENTS.md
├── README.md                    # public skill docs
├── VERSION                      # plain text version string
├── LICENSE                      # MIT (added Phase 5)
└── .gitignore
```

See `docs/DATA_CONTRACT.md` for the file-by-file ownership rules.

## How a mode runs

1. User invokes `/rolecraft <mode>` (or `/rolecraft` with no argument → defaults to `process`).
2. Claude Code loads `skills/rolecraft/SKILL.md`.
3. SKILL.md instructs Claude to load `AGENTS.md` (voice, dispatch, data contract), then `modes/_shared.md` (sources of truth, onboarding check, common rules), then `modes/<target>.md` (the specific mode's instructions).
4. The mode reads `user/profile/*` (always) and the relevant `user/data/*` files (mode-specific), executes its work, writes results to the appropriate user-layer files.

The first-run onboarding check runs silently on every session start (defined in `_shared.md`). If `user/profile/profile.yml`, `user/profile/cv.md`, or `user/profile/_profile.md` is missing, the user is routed to `onboard` before any other mode can execute.

## Adding a new mode

1. Create `modes/<new-mode>.md` with the mode's instructions.
2. Add a row to the mode dispatch table in `AGENTS.md`.
3. If the mode writes a new user-layer file, add a template at `templates/<file>.template.md` and document the file in `DATA_CONTRACT.md`.
4. Bump `VERSION`.

## Phases

This repo evolves in five phases. The phase plans live in `docs/superpowers/plans/`.

- **Phase 1:** scaffolding + data migration (no functional changes)
- **Phase 2:** core loop restored (`onboard`, `process`, `analyze`)
- **Phase 3:** breadth modes (`concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`)
- **Phase 4:** markdown report rendering
- **Phase 5:** PDF, update mechanism, publishing prep
````

- [ ] **Step 3: Write `docs/DATA_CONTRACT.md`**

Contents:

````markdown
# Data contract

Two layers, enforced by directory and gitignore. This file is the authoritative reference; deviations from it are bugs.

## User Layer — `user/`

**Gitignored.** Never overwritten by `update` mode. Personalization, identity, and skill-generated outputs all live here.

### `user/profile/` — user-owned source of truth

| File | What it holds | Who writes it |
|---|---|---|
| `profile.yml` | Identity, target archetypes (with synonyms), industries, compensation, location, visa | User during onboarding; agent on `profile` mode |
| `cv.md` | Canonical CV. Single source for metrics. | User; agent on `profile` mode (with confirmation) |
| `_profile.md` | Archetypes, adaptive framing, exit narrative, deal-breakers, energy/drain mapping, negotiation defaults, location policy | User; agent appends on qualitative feedback |
| `article-digest.md` | Hero proof point, supporting proof points, STAR stories, domain signals | User during onboarding step 3 (optional but encouraged) |
| `interview-prep.md` | Manually maintained study list | User only — modes never write here |
| `writing-samples/` | Optional samples for tone matching when rolecraft generates candidate-facing text | User only |

### `user/data/` — skill-generated

| File | What it holds | Who writes it |
|---|---|---|
| `inbox.md` | Paste-here scratchpad. Cleared by `process` each run | User pastes; mode clears |
| `jd-archive.md` | Raw history of every JD, no dedup. Append-only | `process` mode |
| `consolidated-jd.md` | Deduplicated master JD synthesized from all processed JDs | `process` mode (rewritten each run) |
| `concepts.md` | Ranked concept list with sources | `process`, `concepts`, `recurate` modes |
| `stack-tracker.md` | Tech stack ranked by occurrence per category | `process`, `stack`, `recurate` modes |
| `projects-index.md` | Niche, business-aware project suggestions + suggestion log | `process`, `projects`, `recurate` modes |
| `companies.md` | Persistent list of target companies (deduped) | `process`, `companies`, `recurate` modes |
| `dashboard.md` | One-stop summary across all user files | `process`, `dashboard` modes |
| `reports/` | Polished reports (Phase 4+) | `report` mode |

## System Layer — everything else at repo root

**Tracked in git.** Auto-updatable via `update` mode. Never holds user-specific content.

- `.claude-plugin/plugin.json` — plugin manifest
- `.claude-plugin/marketplace.json` — marketplace catalog
- `skills/rolecraft/SKILL.md` — router
- `modes/*` — mode instruction files
- `templates/*` — seeds for `user/profile/` and `user/data/`
- `scripts/*` — Node.js helpers (Phase 4+)
- `AGENTS.md`, `CLAUDE.md`, `README.md`
- `docs/*`
- `package.json`, `VERSION`, `LICENSE`, `.gitignore`

## The rule

> When the user asks you to customize anything — archetypes, narrative, deal-breakers, target industry, comp targets, proof points — write to `user/profile/`. Never edit System Layer files for user-specific content.

This guarantees `update` mode never overwrites personalization.

## Wipe semantics

- `rm -rf user/data/*` → resets all trackers, keeps identity. "Start my tracker over."
- `rm -rf user/profile/*` → forgets identity, retriggers onboarding. "I want to be someone else."
- `rm -rf user/` → both of the above.

The `clear` mode (Phase 3) provides a confirmation-gated way to do the first.
````

- [ ] **Step 4: Write `docs/HOW-TO.md`**

Contents:

````markdown
# How to use rolecraft

A 5-minute guide for end users. For architecture details, see `ARCHITECTURE.md`. For the user/system layer split, see `DATA_CONTRACT.md`.

## Install

```
/plugin marketplace add Sri-Ln/rolecraft
/plugin install rolecraft
```

You can verify it installed with `/plugin list`.

## First-run onboarding

The first time you invoke any rolecraft mode (or open a Claude Code session after installing), rolecraft notices `user/profile/` is empty and runs `onboard` automatically. The flow asks for:

1. Your CV (paste it, give a LinkedIn URL, or describe your experience)
2. Identity + target archetypes + industries + comp + location + visa
3. Proof points (optional but recommended — hero project, supporting roles)
4. Framing & narrative (hero pitch, adaptive framing per archetype, energy/drain mapping, deal-breakers)
5. Personalization round (free-form context that makes the skill smarter)
6. Confirmation

Everything onboarding asks goes into `user/profile/`. You can edit those files directly any time — see `docs/CUSTOMIZATION.md` (Phase 3).

## Daily flow

```
/rolecraft                  # paste a JD into the chat or into user/data/inbox.md → process
/rolecraft analyze          # paste a JD → one-off gap analysis, nothing saved
/rolecraft concepts         # paste a JD → update only the concepts tracker
/rolecraft stack            # paste a JD → update only the stack tracker
/rolecraft projects         # paste a JD → propose a niche project (or extend one)
/rolecraft companies        # paste a JD → find similar-role companies
/rolecraft dashboard        # refresh the summary (no JD needed)
```

After each run, look at `user/data/dashboard.md` for the current state of your radar.

## Customizing

- Change target roles / industries / comp: `/rolecraft profile` (Phase 3), or edit `user/profile/profile.yml` directly
- Change framing / narrative / deal-breakers: edit `user/profile/_profile.md`
- Add proof points: edit `user/profile/article-digest.md`
- Update CV: edit `user/profile/cv.md`

After significant profile changes, run `/rolecraft recurate` to re-rank existing trackers against your new targets.

## Wiping data

- `/rolecraft clear` (Phase 3) — confirmation-gated wipe of `user/data/` only. Keeps your identity.
- Manual full reset: `rm -rf user/` then re-run any mode (re-triggers `onboard`).

## Updating the skill

When new versions of rolecraft ship:

- `/rolecraft update` (Phase 5) — check upstream, diff against local System Layer, apply if you accept.
- Your `user/` directory is never touched by updates.

## Getting help

- Plugin docs: this directory and `AGENTS.md`
- Spec and plans: `docs/superpowers/`
- Issues: https://github.com/Sri-Ln/rolecraft/issues
````

- [ ] **Step 5: Verify all three docs exist**

Run:
```bash
ls -1 docs/*.md | grep -E "(ARCHITECTURE|DATA_CONTRACT|HOW-TO)\.md" | wc -l
```

Expected output: `3`

### Task 10: VERSION file

**Files:**
- Create: `VERSION`

- [ ] **Step 1: Write `VERSION`**

Use the Write tool to create the file with literal content (no trailing newline added beyond the one).

Path: `VERSION`
Content: `0.1.0\n`

- [ ] **Step 2: Verify**

Run:
```bash
cat VERSION
```

Expected output: `0.1.0`

### Task 11: Stage and commit 1.a

- [ ] **Step 1: Inspect what's about to be committed**

Run:
```bash
git status
git diff --stat HEAD
```

Expected:
- New files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/rolecraft/SKILL.md`, `AGENTS.md`, `templates/*.template.{md,yml}` (13 files), `docs/ARCHITECTURE.md`, `docs/DATA_CONTRACT.md`, `docs/HOW-TO.md`, `VERSION`
- Modified files: `CLAUDE.md`, `README.md`
- No deletions yet (those land in commit 1.c)

If anything else appears, stop and investigate before committing.

- [ ] **Step 2: Stage explicitly (avoid `git add -A` here so we don't accidentally pick up untracked junk)**

Run:
```bash
git add .claude-plugin/ skills/ AGENTS.md CLAUDE.md README.md templates/ docs/ARCHITECTURE.md docs/DATA_CONTRACT.md docs/HOW-TO.md VERSION
```

- [ ] **Step 3: Verify staging**

Run:
```bash
git diff --cached --stat
```

Confirm the staged file list matches the expectation from Step 1.

- [ ] **Step 4: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
Phase 1.a: scaffold rolecraft plugin structure

Add Claude Code plugin manifests, marketplace catalog, skill entry
point, AGENTS.md master doc, slim CLAUDE.md, public README, all
13 user-layer templates, three core docs, and VERSION file. No
modes yet — those land in Phase 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds with message above.

---

## Commit 1.b — Migrate personal data into `user/`

Move the user's existing trackers into `user/data/`. Split the current `CLAUDE.md` personal content across `user/profile/{cv,profile.yml,_profile,article-digest}`. Create empty seeds for the three new files.

**Important:** `user/` is not yet gitignored at this point (that's commit 1.c). So this commit will technically *track* the user files briefly. Commit 1.c removes them from tracking. Some users might prefer to gitignore *before* moving — we don't, because reordering would require force-removing files from the index between commits and that's messier. The three-commit sequence is intentional.

### Task 12: Create user directory skeleton

- [ ] **Step 1: Create the directories**

Run:
```bash
mkdir -p user/profile/writing-samples user/data
```

- [ ] **Step 2: Verify**

Run:
```bash
ls -la user/profile user/data
```

Expected: both directories exist; `writing-samples/` is empty.

### Task 13: Move existing tracker files into `user/data/`

**Files:**
- Move: `learning/concepts.md` → `user/data/concepts.md`
- Move: `tech-stack/stack-tracker.md` → `user/data/stack-tracker.md`
- Move: `projects/projects-index.md` → `user/data/projects-index.md`
- Move: `job-analysis/inbox.md` → `user/data/inbox.md`
- Move: `job-analysis/consolidated-jd.md` → `user/data/consolidated-jd.md`

- [ ] **Step 1: Move each file with `git mv` (preserves history)**

Run:
```bash
git mv learning/concepts.md user/data/concepts.md
git mv tech-stack/stack-tracker.md user/data/stack-tracker.md
git mv projects/projects-index.md user/data/projects-index.md
git mv job-analysis/inbox.md user/data/inbox.md
git mv job-analysis/consolidated-jd.md user/data/consolidated-jd.md
```

- [ ] **Step 2: Verify each file landed and is readable**

Run:
```bash
ls -1 user/data/
```

Expected output:
```
concepts.md
consolidated-jd.md
inbox.md
projects-index.md
stack-tracker.md
```

(Files appear alphabetically. The companies / jd-archive / dashboard files don't exist yet — they're created in Task 16.)

### Task 14: Move interview-prep into `user/profile/`

**Files:**
- Move: `learning/interview-prep.md` → `user/profile/interview-prep.md`

- [ ] **Step 1: Move with `git mv`**

Run:
```bash
git mv learning/interview-prep.md user/profile/interview-prep.md
```

- [ ] **Step 2: Verify**

Run:
```bash
ls user/profile/interview-prep.md
```

Expected: file exists.

### Task 15: Construct the four `user/profile/` files from the user's CV and prior `CLAUDE.md`

Build `profile.yml`, `cv.md`, `_profile.md`, and `article-digest.md` for the user. Each file follows the corresponding template at `templates/<name>.template.<ext>` and is filled in with the user's actual data. The exact content depends on who is running the migration — there is no fixed answer to insert here.

**For the original repo author:** the worked example with full personal content lives at `user/profile/migration-notes.md` (gitignored; created at the start of this phase). Use it as your reference when filling in the four files below.

**For any other user:** distill from your own CV and from the pre-rolecraft `CLAUDE.md` (or whatever personal-context file your repo had before installing rolecraft). The structure for each file is fixed by the templates; the content is yours.

**Source material to retrieve (whichever the user has):**

- The pre-1.a `CLAUDE.md` from before commit 1.a. Retrieve it with:
  ```bash
  git show HEAD~1:CLAUDE.md > /tmp/old-claude.md
  cat /tmp/old-claude.md
  ```
- The migration-notes file if it exists: `cat user/profile/migration-notes.md`

- [ ] **Step 1: Write `user/profile/profile.yml`**

Copy the template:
```bash
cp templates/profile.template.yml user/profile/profile.yml
```

Then replace each `[PLACEHOLDER]` value with the user's actual data. Required sections to populate at minimum:
- `candidate` block (name, email, location, github)
- At least one `target_roles.archetypes` entry (canonical name, synonyms list, level, fit)
- `industries.mode` and `list` (use `"any"` or `"*"` to disable industry filtering)
- `location.preferred` and `open_to`

Empty strings (linkedin, comp range, visa status) can be left and filled later via `/rolecraft profile`.

- [ ] **Step 2: Write `user/profile/cv.md`**

Copy the template:
```bash
cp templates/cv.template.md user/profile/cv.md
```

Then fill in the canonical CV: summary, experience (most-recent first), education, skills, certifications, side projects. This is the single source of truth for any metric the user wants quoted — `report` mode and `analyze` mode both read from here. Don't duplicate facts elsewhere.

- [ ] **Step 3: Write `user/profile/_profile.md`**

Copy the template:
```bash
cp templates/_profile.template.md user/profile/_profile.md
```

Then fill in the narrative file. Sections to populate at minimum:
- **Your target roles** table — archetypes with thematic axes and what each "really buys"
- **Your adaptive framing** — for each archetype, what to emphasize and which proof points to cite (referencing `cv.md` and `article-digest.md`)
- **Your exit narrative** — the through-line of the career
- **Your cross-cutting advantage** — one-sentence superpower pitch
- **Your framing discipline (HARD RULE)** if applicable — any "never describe yourself as X" rules the user wants enforced (e.g., if they built infrastructure behind a flow but didn't make decisions, prevent miscategorization)
- **Your prior domain knowledge** — things rolecraft must NEVER add to `user/data/concepts.md` as items to learn (already-known concepts)
- **Your primary language / area for learning** — what the user is currently building toward
- **Your energy / drain mapping** — what type of work to score up vs down
- **Your deal-breakers** — hard filters
- **Your visa / sponsorship constraints** if applicable

The framing-discipline and prior-domain-knowledge sections are the most load-bearing for the rest of rolecraft — they shape what the skill recommends and what it deliberately doesn't.

- [ ] **Step 4: Write `user/profile/article-digest.md` (can seed empty)**

Copy the template:
```bash
cp templates/article-digest.template.md user/profile/article-digest.md
```

Either fill it now or leave it as the template skeleton and fill via `/rolecraft onboard` step 3 later. Recommended: at least add a one-line note pointing at the natural hero proof point so future runs of rolecraft know where to look.

- [ ] **Step 5: Verify all four user-profile files**

Run:
```bash
ls -1 user/profile/*.{md,yml} 2>/dev/null
```

Expected output (alphabetical):
```
user/profile/_profile.md
user/profile/article-digest.md
user/profile/cv.md
user/profile/interview-prep.md
user/profile/profile.yml
```

Five files total (the fifth is `interview-prep.md` moved in Task 14).

### Task 16: Create empty seeds for new user-data files

**Files:**
- Create: `user/data/jd-archive.md`
- Create: `user/data/companies.md`
- Create: `user/data/dashboard.md`

These three files don't have existing source content — they're new in the architecture. Create them by copying the corresponding templates.

- [ ] **Step 1: Copy each template into place**

Run:
```bash
cp templates/jd-archive.template.md user/data/jd-archive.md
cp templates/companies.template.md user/data/companies.md
cp templates/dashboard.template.md user/data/dashboard.md
```

- [ ] **Step 2: Verify all eight user/data files exist**

Run:
```bash
ls -1 user/data/
```

Expected output (alphabetical):
```
companies.md
concepts.md
consolidated-jd.md
dashboard.md
inbox.md
jd-archive.md
projects-index.md
stack-tracker.md
```

### Task 17: Stage and commit 1.b

- [ ] **Step 1: Inspect what's about to be committed**

Run:
```bash
git status
git diff --stat HEAD
```

Expected:
- Renames (5): `learning/concepts.md` → `user/data/concepts.md`, etc.
- Rename (1): `learning/interview-prep.md` → `user/profile/interview-prep.md`
- New files (7): `user/profile/profile.yml`, `user/profile/cv.md`, `user/profile/_profile.md`, `user/profile/article-digest.md`, `user/data/jd-archive.md`, `user/data/companies.md`, `user/data/dashboard.md`

If unexpected files appear, stop and investigate.

- [ ] **Step 2: Stage explicitly**

Run:
```bash
git add user/ learning/ tech-stack/ projects/ job-analysis/
```

(The four old directories are included so `git` records the renames properly.)

- [ ] **Step 3: Verify staging**

Run:
```bash
git diff --cached --stat
```

Confirm the file list matches Step 1.

- [ ] **Step 4: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
Phase 1.b: migrate personal data into user/ layout

Move existing trackers into user/data/. Move interview-prep into
user/profile/. Distill personal content from the previous CLAUDE.md
into user/profile/{cv.md, profile.yml, _profile.md, article-digest.md}.
Create empty seeds for the three new user-data files
(jd-archive, companies, dashboard).

user/ is not yet gitignored — that lands in commit 1.c, which also
removes the now-empty top-level directories.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Commit 1.c — Gitignore `user/`, delete empty directories, verify plugin loads

### Task 18: Update `.gitignore`

**Files:**
- Modify: `.gitignore`

The current `.gitignore` reads:
```
.env
.DS_Store
*.log
.claude/
```

The `.claude/` rule blanket-ignores everything under `.claude/`, which would hide our `.claude-plugin/` directory if Claude Code ever scanned with naïve ignore behavior. (Note: `.claude-plugin/` is a different path than `.claude/`, so the current rule actually does NOT hide it. The current rule is fine as-is for the manifest. But we want session state under `.claude/` to remain ignored.)

We need to:
- Keep `.claude/` ignored (session state, `settings.local.json` already there)
- Add `/user/` to ignore the user layer
- Add `node_modules/` for Phase 4+ (preemptive, harmless now)

- [ ] **Step 1: Replace `.gitignore` contents**

Contents:
```
# OS / editor
.DS_Store
*.log

# Secrets
.env

# Claude Code session state (NOT .claude-plugin/, which is tracked)
.claude/

# Node.js (Phase 4+)
node_modules/

# User layer — never committed
/user/
```

- [ ] **Step 2: Verify `.claude-plugin/` is still tracked**

Run:
```bash
git check-ignore -v .claude-plugin/plugin.json || echo "tracked (good)"
git check-ignore -v .claude/settings.local.json
```

Expected:
- First line: `tracked (good)` (the file is NOT ignored)
- Second line: shows the `.claude/` rule matching (file IS ignored, also good)

- [ ] **Step 3: Verify `user/` is now ignored**

Run:
```bash
git check-ignore -v user/profile/profile.yml
```

Expected: output shows the `/user/` rule matching.

- [ ] **Step 4: Remove `user/` from the index (it was committed in 1.b, now needs to be untracked)**

Run:
```bash
git rm -r --cached user/
```

This removes user files from the git index but leaves the actual files on disk.

- [ ] **Step 5: Verify**

Run:
```bash
git status
```

Expected:
- Modified: `.gitignore`
- Deleted (from index, not disk): all `user/**/*.md` and `user/**/*.yml` files
- Untracked: `user/` (because it's now ignored, git won't show individual files)

Confirm the actual files still exist on disk:
```bash
ls user/profile/profile.yml user/data/concepts.md
```

Expected: both files print without error.

### Task 19: Delete the now-empty top-level directories

The four old top-level directories (`learning/`, `tech-stack/`, `projects/`, `job-analysis/`) should already be empty after Task 13 + 14 moves. But `git mv` may leave empty directories in the working tree. Remove them explicitly.

- [ ] **Step 1: Confirm each is empty**

Run:
```bash
for d in learning tech-stack projects job-analysis; do
  if [ -d "$d" ]; then
    echo "$d contents:"; ls -A "$d" 2>/dev/null
  else
    echo "$d does not exist"
  fi
done
```

Expected:
- Each directory either does not exist or has no entries (empty `ls -A` output).

If any directory has unexpected files, STOP and investigate. Do not delete files that weren't part of the migration.

- [ ] **Step 2: Remove the empty directories**

Run:
```bash
for d in learning tech-stack projects job-analysis; do
  if [ -d "$d" ]; then rmdir "$d"; fi
done
```

- [ ] **Step 3: Verify**

Run:
```bash
ls -d learning tech-stack projects job-analysis 2>&1 | grep -v "No such" || true
ls -d learning tech-stack projects job-analysis 2>&1
```

Expected: all four directories report "No such file or directory."

### Task 20: Verify the plugin loads

- [ ] **Step 1: Validate the plugin manifests with `claude plugin validate`**

Run:
```bash
claude plugin validate
```

Expected: validation passes. If the command does not exist (older Claude Code version), skip — manual JSON validation in Tasks 1-2 covered the schema.

If validate reports issues, fix them before committing. Common issues:
- Missing required field in plugin.json or marketplace.json → re-check Tasks 1 & 2.
- Invalid `source` in marketplace.json → must be `"./"` exactly for plugin-at-marketplace-root.

- [ ] **Step 2: Confirm tracked-file list contains no user data**

Run:
```bash
git ls-files | grep "^user/" || echo "no user files tracked (good)"
```

Expected: `no user files tracked (good)`

- [ ] **Step 3: Confirm tracked-file list contains plugin scaffolding**

Run:
```bash
git ls-files | grep -E "(\.claude-plugin|skills/rolecraft|AGENTS\.md|templates/.*\.template\.(md|yml)$|docs/(ARCHITECTURE|DATA_CONTRACT|HOW-TO)\.md|VERSION)$" | wc -l
```

Expected: 19 or more (3 plugin files + 13 templates + 3 docs + VERSION = 20, with some margin).

### Task 21: Stage and commit 1.c

- [ ] **Step 1: Inspect**

Run:
```bash
git status
git diff --cached --stat
```

Expected:
- Modified: `.gitignore`
- Deleted (from index): all files under `user/`
- No untracked changes that would expand the commit beyond the gitignore + cleanup

- [ ] **Step 2: Stage**

Run:
```bash
git add .gitignore
```

(The `git rm -r --cached user/` from Task 18 already staged the user-file removals.)

- [ ] **Step 3: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
Phase 1.c: gitignore user/, remove empty top-level dirs

Untrack user/ (personal data and skill outputs now live there,
gitignored). Remove the four now-empty top-level dirs (learning,
tech-stack, projects, job-analysis) — their content moved to
user/data/ and user/profile/ in commit 1.b.

Repo layout now matches the rolecraft plugin spec. No modes
yet — those land in Phase 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

### Task 22: Final verification

- [ ] **Step 1: Confirm all three Phase 1 commits**

Run:
```bash
git log --oneline -5
```

Expected: the most recent three commits are 1.c, 1.b, 1.a in that order, on top of the spec commit and main.

- [ ] **Step 2: Confirm working tree is clean**

Run:
```bash
git status
```

Expected: `working tree clean` (the user/ files are present on disk but gitignored, so git doesn't see them).

- [ ] **Step 3: Confirm the repo layout matches the spec**

Run:
```bash
ls -la
ls -la .claude-plugin skills/rolecraft templates docs user/profile user/data
```

Spot-check against the file structure section of this plan.

- [ ] **Step 4: (Optional) Push the branch to the remote for backup**

Only if the user explicitly asked to push. Otherwise leave the branch local.

Run:
```bash
git push -u origin skill-migration
```

This does NOT merge to main. The user will review the branch before merging.

---

## Self-review (run after writing the plan, before handing off)

This is a checklist I (the plan author) ran inline — fixed any issues directly. Notes for the executor:

1. **Spec coverage** — every requirement in the Phase 1 section of `docs/superpowers/specs/2026-06-10-rolecraft-skill-migration-design.md` has a task: plugin manifests (Tasks 1-2), skill entry (Task 3), AGENTS/CLAUDE/README (Tasks 4-6), templates (Tasks 7-8), docs (Task 9), VERSION (Task 10), gitignore + migration + cleanup (Tasks 12-21). The "no functional changes" requirement is preserved: Phase 1 creates zero mode files; nothing executes.

2. **Placeholder scan** — no TBD/TODO markers in the plan itself. The templates intentionally contain `[PLACEHOLDER]` markers because that's the spec's contract for templates. They are not plan placeholders.

3. **Type / path consistency** — every path mentioned in one task matches every other task that references it: `user/profile/profile.yml` is consistent throughout; `skills/rolecraft/SKILL.md` (not `.claude/skills/rolecraft/SKILL.md`) consistent; template filenames match their target user/ filenames.

4. **Self-check on the gitignore ordering** — Tasks 13-17 track files under `user/` briefly in commit 1.b, then Task 18 untracks them in commit 1.c. This is intentional. An alternative would be to gitignore `user/` *before* moving files in (so files are never tracked). I chose the three-commit sequence because `git mv` of currently-tracked files into a not-yet-ignored path produces clean rename diffs in git history; force-removing in a pre-emptive ignore is messier. Documented in commit 1.b's body.

5. **Risk: `claude plugin validate` may not be available in older Claude Code versions.** Task 20 Step 1 handles this gracefully (skip if not present). The manual JSON validation in Tasks 1-2 catches structural issues anyway.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-10-rolecraft-phase-1-scaffolding.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints

Which approach?

---

## Post-execution notes (added after Phase 1 completed)

This section documents what actually happened, including deviations from the plan above. Anyone reading this plan before executing Phase 2 should rely on the notes below over the original task text in points of conflict.

### What actually landed (final commit sequence)

The original plan called for three sequential commits (`1.a` scaffold, `1.b` track-user/-data-briefly, `1.c` gitignore-and-cleanup). During execution the user pushed back on the "track briefly" approach because tracked-then-untracked files still leave their content in git history. The plan was wrong about this; the gitignore-first approach is strictly better. Final sequence:

| Commit | Subject | What it did |
|---|---|---|
| `26a532d` | `Phase 1.a: scaffold rolecraft plugin structure` | Tasks 1-11 as written — created plugin manifests, SKILL.md, AGENTS.md, slim CLAUDE.md, public README, all 13 templates, 3 docs, VERSION |
| `44bf5fe` | `Phase 1.a follow-up: address code-quality review findings` | Small fixes from the post-1.a code-quality review: ARCHITECTURE.md first-run-check attribution, dead doc links converted to plain text, profile.template.yml settings block documented, AGENTS.md writing-samples bullet given a description, HOW-TO.md onboarding hedge |
| `5f50d5b` | `Phase 1.b: gitignore /user/, untrack old tracker locations` | Combined what the plan had as 1.b + 1.c into one cleaner commit. Added `/user/` and `node_modules/` to `.gitignore` BEFORE any user-layer file landed in the index. Removed the six tracker files from their tracked locations (their content was already preserved on disk under `user/`). Old top-level directories disappeared automatically when their last tracked file was removed. **No `git mv` was used** — the rename detection wasn't needed because the destination paths were already gitignored. |
| `f2e9f9e` | `Add CONTRIBUTORS.md crediting Sri-Ln and Claude` | Added at user request; not in original plan. Lists Sri-Ln as primary author and Claude (Anthropic — Opus 4.7) as AI collaborator. Pairs with the Co-Authored-By trailer on every commit. |

### Task-level corrections

- **Tasks 13 and 14 (`git mv` of trackers and interview-prep)** — these are stale. Don't use `git mv` for this migration. With `/user/` gitignored first, deleting files from their tracked locations is sufficient; the new locations are invisible to git.
- **Tasks 18-21 (gitignore + index untracking + directory cleanup as a third commit)** — these collapsed into the single 1.b commit. There's no separate Phase 1.c. Empty top-level directories vanished automatically when their last file was removed.
- **Task 22 (final verification)** — still useful as a verification checklist after the rewritten 1.b. The `claude plugin validate` step is still recommended.
- **`CONTRIBUTORS.md`** — add to the System Layer file inventory. The Phase 1 file count is 23 tracked files (the original plan listed 22; `CONTRIBUTORS.md` is the 23rd).

### Outstanding follow-up before public release (not blocking Phase 2)

- **Personal data in `docs/superpowers/specs/` and `docs/superpowers/plans/`** — the original author's name, email, employer details, and project specifics are embedded in committed spec and plan files. These predate Phase 1 (committed in `709f1ba` and `08df737`). They will be visible to anyone who clones the repo once it's pushed. Decision pending on how to handle this before public marketplace submission (Phase 5). Options: scrub at HEAD plus add to history-rewrite checklist; or extract migration-notes into a gitignored side file and reference it from the spec. **Not blocking Phase 2 work on the private branch.**

