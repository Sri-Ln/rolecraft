# Mode: analyze

One-off learning-gap analysis, answered inline. Nothing is saved.

**Reads:** all sources of truth (`_shared.md` table) plus the JD given with the invocation.
**Writes:** NOTHING. Hard rule. No tracker updates, no archive append, no dashboard refresh, no inbox read or clear. The inbox belongs to `process`. If the user wants this JD tracked, that's `/rolecraft process`.

## Input

A JD pasted with the invocation, or a URL to fetch. If neither is present, ask for one — do NOT fall back to `user/data/inbox.md`.

## Output (inline, in this order)

1. **Fit** — which archetype matched (canonical or synonym, name it), industry filter result, deal-breaker flags from `_profile.md`, comp vs the user's minimum, visa/sponsorship signals vs their status.
2. **You already have** — JD requirements already covered, each backed by a specific proof point from `cv.md` or `article-digest.md`. Include prior-domain-knowledge items (🎓 territory) here, not under gaps.
3. **Gaps** — what's genuinely missing, ranked by importance to THIS role. Per gap: 1–2 curated free resources and a realistic ramp estimate (days/weeks, not "quickly").
4. **What to build** — one niche, business-aware project angle that would prove readiness for this role: the business problem it models plus an MVP scope. Never a generic CRUD demo.
5. **Verdict** — honest one-liner: strong fit / stretch / long shot, and the single thing that would most move the needle.

## Closing line

End with: "Nothing was saved. To add this JD to your radar, run `/rolecraft process`."
