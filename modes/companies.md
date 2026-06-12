# Mode: companies

Find companies hiring for the user's target roles beyond the ones their JDs already named.

**Reads:** all sources of truth + `user/data/companies.md` + `user/data/consolidated-jd.md` (role profile context).
**Writes:** `user/data/companies.md` ONLY.

## Discovery

Use WebSearch — dispatch a search subagent when the platform supports it — to find companies currently hiring for the user's archetypes (canonical names AND synonyms from `profile.yml`) in their target industries:

- Respect `industries.mode`: `"match"` searches within the listed industries and sub-sectors; `"any"` searches on titles alone.
- Useful query shapes: `"<archetype>" jobs <industry> <sub-sector>`, `companies hiring "<synonym>" <location/remote>`, `<industry> startups "<archetype>"`.
- Keep it curated: 3–5 strong matches per run, not a volume dump. The bar is "this team works on heavily similar products/tech to what the user's JDs and strengths point at."
- For each candidate company capture: industry, sub-sector, the matching role(s) seen, its careers page (a role-filtered search URL when the site supports it, otherwise the careers root — goes in the Careers column), and a one-line note (size/stage/why relevant). Source column: `websearch YYYY-MM-DD`.
- Skip recruiting agencies and job boards — the user wants employers.

## Merge

- Dedupe by company name against existing rows (case-insensitive; "Stripe, Inc." = "Stripe"). A company appears at most once in the file, ever.
- Never remove or rewrite rows that came from processed JDs or that the user added — only append (filling an empty Careers cell on an existing row is fine).
- Respect the industries filter for new rows.
- Columns: Company, Industry, Sub-sector, Relevant roles, Careers, Source, Notes.

## Future hook (documented, not implemented)

If the user has career-ops installed, its company-scan tooling could replace raw WebSearch here. v1 is deliberately WebSearch-only — see the spec's future backlog.

## Report

New companies added (with one-line why each), duplicates skipped, searches that came back empty.
