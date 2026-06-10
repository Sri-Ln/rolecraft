# Mode: profile

Interactive editor for the user's profile — one field at a time.

**Reads:** `user/profile/*`.
**Writes:** `user/profile/*` ONLY (`profile.yml`, `_profile.md`, `cv.md`, `article-digest.md` — whichever owns the field). Never touches `user/data/`.

## Flow

1. If the user didn't say what to change, ask which area: identity · target roles/archetypes · industries · compensation · location/visa · framing & narrative · deal-breakers · prior domain knowledge · CV · proof points.
2. For each change: show the current value, ask for the new one, confirm, write. One field at a time — never bulk-rewrite a file for a single-field change.
3. File ownership: identity/archetypes/industries/comp/location/visa → `profile.yml` · framing/narrative/deal-breakers/prior knowledge/energy mapping → `_profile.md` · experience/metrics → `cv.md` · proof points/STAR stories → `article-digest.md`.
4. When editing archetypes, offer synonym suggestions the same way onboarding does.
5. After changes that affect ranking (archetypes, industries, deal-breakers, prior domain knowledge): point out that existing trackers were ranked against the old profile and suggest `/rolecraft recurate`. Don't run it unasked.

## Rules

- Keep `profile.yml` valid YAML — preserve structure and comments.
- Confirm before overwriting any CV content; the CV is the canonical metrics source.
- This mode edits identity; it never edits trackers. Tracker complaints ("this concept doesn't apply to me") are handled conversationally per AGENTS.md, not here.
