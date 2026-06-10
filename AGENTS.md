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
- `user/profile/writing-samples/` — optional tone samples; modes load only when generating candidate-facing text

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
