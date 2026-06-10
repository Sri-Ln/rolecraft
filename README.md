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

That's it. The skill runs onboarding automatically on first use — see `docs/ONBOARDING.md — Phase 2` for what it asks and why.

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
- `docs/CUSTOMIZATION.md — Phase 3`
- `docs/ONBOARDING.md — Phase 2`
- `docs/PUBLISHING.md — Phase 5`

## Status

Phase 1 of 5 complete: scaffolding and data migration. The skill is not yet functional — modes land in Phase 2. See [`docs/superpowers/plans/`](docs/superpowers/plans/) for the implementation plans of each phase.

## License

MIT (see `LICENSE` — added in Phase 5).
