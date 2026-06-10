# Customizing rolecraft

Everything personal lives under `user/profile/`. This guide covers what each file and field controls, and the three ways to change behavior safely.

## The one rule

Personalization goes in `user/profile/` (and generated outputs in `user/data/`). System Layer files — modes, templates, docs, manifests — never hold user-specific content, which is what makes skill updates safe. Full contract: `DATA_CONTRACT.md`.

## Three ways to customize

1. **`/rolecraft profile`** — guided, one field at a time, keeps YAML valid.
2. **Edit the files directly** — they're yours; every mode re-reads them at runtime.
3. **Say it in chat** — qualitative feedback ("stop suggesting Kafka projects", "this concept doesn't apply to me") gets folded into `_profile.md` so the next run knows.

After changes that affect ranking — archetypes, industries, deal-breakers, prior knowledge — run `/rolecraft recurate` to re-rank existing trackers.

## `profile.yml` — what each field controls

| Field | Effect |
|---|---|
| `target_roles.archetypes[].canonical` + `synonyms` | JD title matching. More synonyms = fewer missed matches on phrasing variants. |
| `archetypes[].fit` (`primary`/`secondary`/`adjacent`) | How strongly a match counts in ranking and verdicts. |
| `industries.mode` (`match`/`any`) | `match` filters companies and shapes projects to the listed industries; `any` (or a `*` entry) matches on title alone. |
| `industries.sub_sectors` | Sharpen company discovery and project framing within an industry. |
| `compensation.minimum` | Optional. Comp flags in `process`/`analyze` reports; blank disables them. |
| `location.*` | Location notes in reports. |
| `visa.*` | Optional. Sponsorship flags in reports; blank means the topic never comes up. |
| `settings.dashboard_top_n_per_category` | How long each dashboard section is. |
| `settings.auto_pdf_score_threshold` | Reserved for Phase 5 PDF reports. |

## `_profile.md` — the sections that steer behavior

- **Adaptive framing** — what gets emphasized per archetype in any candidate-facing text.
- **Energy/drain mapping** — scores roles up/down beyond pure title match.
- **Deal-breakers** — hard flags raised on any JD that hits them.
- **Prior domain knowledge** — the 🎓 list. Anything here never appears as a study recommendation.
- **Framing discipline (HARD RULE)** — things you must never be described as. Modes treat this as inviolable.

## Tone matching

Drop writing samples into `user/profile/writing-samples/` and modes that generate candidate-facing text will match your voice instead of a generic one.

## Why there's no auto-PR pipeline

The pre-rolecraft version of this repo auto-committed personal trackers and opened squash-merge PRs to publish a dashboard README. rolecraft dropped that on purpose: user data is gitignored, so there's nothing to ship — trackers are local learning artifacts, not publications. If you want your tracker history in git anyway, fork the repo and remove `/user/` from `.gitignore` on your fork; updates will still never touch your data, but you give up the privacy guarantee.
