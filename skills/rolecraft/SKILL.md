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

## Status

Phase 1 of 5. The plugin scaffolding is in place but no mode files exist yet — `modes/_shared.md` and `modes/<mode>.md` referenced above are created in Phase 2. **The skill is not functional until Phase 2 lands.** If you invoke `/rolecraft` against this version, you'll hit a missing-file error on the dispatch step above. See `docs/superpowers/plans/` for the per-phase implementation plans.
