# Changelog

Each release leads with a one-line summary — update notices show only that line. Finer details are tracked underneath, categorized, for anyone who wants them.

## 0.3.6 — 2026-06-12

Long runs now show live progress.

**Improvements**
- Multi-file runs render a live task checklist per pipeline stage where the platform supports it; otherwise a single expectation-setting line plus the platform spinner

## 0.3.5 — 2026-06-12

Cleaner processing: tables for trackers, smarter companies and projects, quieter runs.

**Improvements**
- Concepts and stack trackers are single scannable tables now
- Companies: real employers only, with careers-page links; anonymous recruiter postings stay out of the file; similar-company discovery stays in `/rolecraft companies`
- Projects: suggestions wait until 3 JDs are processed, extend-vs-new is decided by tech type (competitor swaps don't count), and table rows anchor-link to their log entries
- Multi-role pastes: rolecraft asks before splitting — only the `---NEW JOB---` marker splits automatically
- Multi-file modes run in a subagent when the platform supports it, keeping the chat to one status line and the report

**Fixes**
- Update check pinned to WebFetch only (no shell commands, no cache inspection) and fully silent unless a newer version exists

## 0.3.4 — 2026-06-10

Release policy refined: tags and GitHub releases for minor versions only.

## 0.3.3 — 2026-06-10

rolecraft now tells you when a new version is available.

**Added**
- Silent once-per-session update check: if a newer version exists, you get a one-line notice with the summary and the update commands
- This changelog, with the one-line-summary convention
- Release rule in CONTRIBUTING.md: every version bump gets a changelog entry, a git tag, and a GitHub release

## 0.3.2 — 2026-06-10

Gentler onboarding: smarter compensation, location, and visa questions.

**Improvements**
- Location asked on its own, with a prefill offer drawn from your CV
- Compensation optional, with market-rate context for your target title shown first; co-op/intern experience maps to the full-time entry title
- Visa in its own `visa:` block, asked only when your CV suggests it; blank means the topic never comes up

## 0.3.1 — 2026-06-10

Minor fixes and metadata polish.

**Fixes**
- Slash menu shows `/rolecraft` instead of `/rolecraft:rolecraft`
- Marketplace metadata completed (schema, version, author, homepage)

## 0.3.0 — 2026-06-10

All everyday modes are live (Phase 3).

**Major**
- Eight breadth modes: `concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`

**Minor**
- Customization guide at `docs/CUSTOMIZATION.md`
- Install fix: invalid `skills` field removed from the plugin manifest

## 0.2.0 — 2026-06-10

The core loop is live (Phase 2): onboard, process a JD, analyze.

## 0.1.0 — 2026-06-10

Initial scaffolding (Phase 1): plugin structure, templates, docs, gitignored user data.
