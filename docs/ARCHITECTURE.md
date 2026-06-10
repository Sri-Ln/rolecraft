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

The first-run onboarding check runs silently on every session start. `AGENTS.md` specifies the first-run check logic; `modes/_shared.md` (Phase 2) becomes the operational location. If `user/profile/profile.yml`, `user/profile/cv.md`, or `user/profile/_profile.md` is missing, the user is routed to `onboard` before any other mode can execute.

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
