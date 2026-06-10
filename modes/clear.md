# Mode: clear

Wipe the trackers; keep the identity. Confirmation-gated.

**Reads:** `user/data/*` (to describe what's about to be lost) + `templates/*`.
**Writes:** resets every `user/data/` file to its template. NEVER touches `user/profile/` — identity, CV, framing all survive, and onboarding will NOT retrigger.

## Flow

1. **Show what's at stake.** List each `user/data/` file with one line of current contents ("concepts.md — 12 tracked concepts", "jd-archive.md — 4 archived JDs"). If everything is already template-empty, say so and stop — nothing to clear.
2. **Require typed confirmation.** Ask the user to type `clear` to proceed. Anything else cancels. Don't accept "yes" / "ok" — this deletes history that can't be regenerated (the JD archive especially).
3. **Reset.** Copy each template over its `user/data/` file (seeding table in `_shared.md`). If `user/data/reports/` exists (Phase 4+), delete its contents too.
4. **Confirm completion.** One line: trackers reset, `user/profile/` untouched.

Wipe-semantics reference: `docs/DATA_CONTRACT.md`.
