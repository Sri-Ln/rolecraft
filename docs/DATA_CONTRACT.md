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

The `clear` mode provides a confirmation-gated way to do the first.
