---
name: rolecraft
description: JD-driven study companion. Paste a job description; get back what to study, what to build, and where else this role exists. Use when the user pastes a job description, says "process this", asks "what would this role take", or wants concepts, tech stacks, companies, projects, or a dashboard summary derived from past JDs.
version: 0.3.2
user-invocable: true
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

Phase 3 of 5. All everyday modes are live: `onboard`, `process`, `analyze`, plus the breadth modes (`concepts`, `stack`, `projects`, `companies`, `dashboard`, `profile`, `recurate`, `clear`). Still to come: `report` (Phase 4) and `update` (Phase 5). See `docs/superpowers/plans/` for the per-phase implementation plans.
