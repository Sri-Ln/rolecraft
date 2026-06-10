# Mode: companies

Find companies hiring for the user's target roles beyond the ones their JDs already named.

**Reads:** all sources of truth + `user/data/companies.md` + `user/data/consolidated-jd.md` (role profile context).
**Writes:** `user/data/companies.md` ONLY.

## Discovery

Use WebSearch — dispatch a search subagent when the platform supports it — to find companies currently hiring for the user's archetypes (canonical names AND synonyms from `profile.yml`) in their target industries:

- Respect `industries.mode`: `"match"` searches within the listed industries and sub-sectors; `"any"` searches on titles alone.
- Useful query shapes: `"<archetype>" jobs <industry> <sub-sector>`, `companies hiring "<synonym>" <location/remote>`, `<industry> startups "<archetype>"`.
- For each candidate company capture: industry, sub-sector, the matching role(s) seen, and a one-line note (size/stage/why relevant). Source column: `websearch YYYY-MM-DD`.
- Skip recruiting agencies and job boards — the user wants employers.

## Merge

- Dedupe by company name against existing rows (case-insensitive; "Stripe, Inc." = "Stripe").
- Never remove or rewrite rows that came from processed JDs or that the user added — only append.
- Respect the industries filter for new rows.

## Future hook (documented, not implemented)

If the user has career-ops installed, its company-scan tooling could replace raw WebSearch here. v1 is deliberately WebSearch-only — see the spec's future backlog.

## Report

New companies added (with one-line why each), duplicates skipped, searches that came back empty.
