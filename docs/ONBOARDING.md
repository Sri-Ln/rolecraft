# Onboarding

What rolecraft asks when you first install it, why it asks, and where your answers go.

## When it runs

- Automatically, the first time you invoke any rolecraft mode and `user/profile/` is missing or incomplete.
- Explicitly, any time, via `/rolecraft onboard`. Re-running fills gaps; it never overwrites files you already have.

## The six steps

| Step | What it asks | Where it goes | Skippable? |
|---|---|---|---|
| 1. CV | Paste your CV, paste LinkedIn text, or describe your experience and rolecraft drafts one for your correction | `user/profile/cv.md` | No — this is the canonical source for everything else |
| 2. Identity & targets | Name, contact, links. Target role archetypes (with suggested synonyms), industries (or "any"), comp range, location, visa | `user/profile/profile.yml` | No, but comp/links can stay blank |
| 3. Proof points | The most impressive thing you've shipped, turned into interview-ready material | `user/profile/article-digest.md` | Yes — a placeholder file is created either way |
| 4. Framing & narrative | Hero pitch, what to emphasize per archetype, energy/drain mapping, deal-breakers, things you already know cold, things you must never be described as | `user/profile/_profile.md` | No — this shapes every recommendation |
| 5. Personalization | Free-form: what makes you unique, published work, certs | Appended to `_profile.md` / `article-digest.md` | Yes |
| 6. Ready | Confirms what was written, lists available modes, offers to process your first JD | — | — |

## Why each step exists

- **CV** is the single source of truth for metrics. Every mode reads it instead of guessing at your experience.
- **Archetypes with synonyms** are how rolecraft matches messy real-world JD titles ("Back-End Engineer", "Server-Side Developer") to the roles you actually want.
- **Industries** control company suggestions and project framing. "Any" is a first-class choice — early-career or industry-agnostic searches match on title alone.
- **Prior domain knowledge** is what keeps the concepts tracker honest: things you already know get a 🎓 marker and never show up as study recommendations.
- **Deal-breakers** flag JDs immediately, no matter how good the title match looks.

## Privacy

Everything onboarding writes lives under `user/`, which is gitignored. Nothing personal is ever committed to the repo, and skill updates never touch your `user/` directory. See `docs/DATA_CONTRACT.md`.

## Editing later

Every file onboarding creates is yours to edit directly:

- `user/profile/profile.yml` — targets, industries, comp, location
- `user/profile/cv.md` — experience and metrics
- `user/profile/_profile.md` — framing, narrative, deal-breakers
- `user/profile/article-digest.md` — proof points and STAR stories

Or re-run `/rolecraft onboard` and pick the file to revisit. After significant changes, `/rolecraft recurate` re-ranks your existing trackers against the new targets.
