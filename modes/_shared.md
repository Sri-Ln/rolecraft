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

Available today: `onboard`, `process`, `analyze`, `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`. If the dispatched mode's file doesn't exist under `modes/`, don't improvise it. Tell the user which phase it arrives in:

| Mode | Arrives in |
|---|---|
| `report` | Phase 4 |
| `update` | Phase 5 |

## Update check (silent, best-effort, never blocking)

Once per session, AFTER completing the user's first request — never before it, never blocking it:

1. Fetch `https://raw.githubusercontent.com/Sri-Ln/rolecraft/main/VERSION`. If the fetch fails for any reason, skip silently — never mention a failed check.
2. Compare against the local `VERSION` file at the plugin root. If the remote version is newer, append a short notice to the end of your reply:
   - the new version number and the installed one
   - what changed: fetch `CHANGELOG.md` from the same branch and quote ONLY the one-line summary of each version between the installed and remote ones — never the detailed bullets. The user wants a glance, not release archaeology.
   - the exact update steps: `/plugin marketplace update rolecraft`, then update rolecraft from the `/plugin` menu, then restart the session
3. Mention it once per session, not on every reply. Never auto-apply anything — updating is the user's action.

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
