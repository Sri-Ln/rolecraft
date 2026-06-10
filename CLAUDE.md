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
- Customization guide: `docs/CUSTOMIZATION.md — Phase 3`
- End-user guide: [`docs/HOW-TO.md`](docs/HOW-TO.md)

Personal customization (target roles, framing, deal-breakers, comp targets) goes in `user/profile/_profile.md` and `user/profile/profile.yml`. Never edit System Layer files for user-specific content — see `docs/DATA_CONTRACT.md` for the full rule.
