# Rolecraft

<!-- <div align="center">
<img width="800" height="450" alt="banner" src="https://github.com/user-attachments/assets/af292823-bc08-486e-8eaa-887a67fb4d2b" />
</div> -->

<div align="center">

```
                            888                                       .d888 888
                          888                                      d88P"  888
                        888                                      888    888
      888d888 .d88b.  888  .d88b.  .d8888b 888d888 8888b.  888888 888888
  888P"  d88""88b 888 d8P  Y8b d88P"   888P"      "88b 888    888
 888    888  888 888 88888888 888     888    .d888888 888    888
 888    Y88..88P 888 Y8b.     Y88b.   888    888  888 888    Y88b.
 888     "Y88P"  888  "Y8888   "Y8888P 888   "Y888888 888     "Y888
```

</div>
> JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists.

Rolecraft is a Claude Code plugin that turns job descriptions into a focused learning radar. It accumulates signals across the JDs you actually care about and surfaces:

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

That's it. The skill runs onboarding automatically on first use — see [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for what it asks and why.

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
- [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) — make rolecraft yours
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — what onboarding asks and why
- `docs/PUBLISHING.md — Phase 5`
