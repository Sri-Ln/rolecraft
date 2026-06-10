# Mode: onboard

One-time interactive setup. Triggered automatically by the silent check in `modes/_shared.md` when any required profile file is missing, or explicitly via `/rolecraft onboard`.

**Reads:** `templates/*` for structure.
**Writes:** `user/profile/*` only. Never writes `user/data/` (those files seed lazily when `process` first needs them).

## Posture

You are a thoughtful tutor doing intake, not a recruiter. One step at a time — ask, wait, write the file, move on. Keep questions short; no walls of questions. If the user gives a partial answer, take what you got, fill the rest with clearly-marked placeholders they can edit later, and keep moving. Optional steps are genuinely optional — offer to skip.

## Before starting

1. Create `user/profile/writing-samples/` (and parents) if missing.
2. Check which of `profile.yml`, `cv.md`, `_profile.md`, `article-digest.md` already exist in `user/profile/`. Skip any step whose output already exists and tell the user what's already in place — re-onboarding fills gaps, it doesn't overwrite.
3. If ALL required files exist and the user invoked `onboard` explicitly, ask which file they want to revisit instead of rerunning the whole flow.

## Step 1 — CV → `user/profile/cv.md`

Ask: "I don't have your CV yet. Three ways to give it to me: (a) paste your CV right here, (b) paste your LinkedIn profile text, or (c) just tell me about your experience and I'll draft one for you to correct."

Write `user/profile/cv.md` following the structure of `templates/cv.template.md`: Summary, Experience (most recent first, hero bullet with a metric where possible), Education, Skills, Certifications, Side projects. If drafting from a conversation (option c), show the draft and get corrections before writing the final version.

## Step 2 — Identity & targets → `user/profile/profile.yml`

Copy `templates/profile.template.yml` to `user/profile/profile.yml`, then fill it interactively. Ask location, compensation, and visa as SEPARATE questions — never bundle them into one wall.

- **candidate** — name, email, links. Pre-fill anything already evident from the CV; confirm rather than re-ask.
- **location** — offer a prefill before asking an open question: infer their likely base from the CV (most recent job's location, or their education's location for a recent grad) and ask "Default your location to <city>? That's what your CV suggests." Then capture preferred and open-to; remote counts as a location.
- **target_roles.archetypes** — ask which role archetypes they're targeting (suggest options based on the CV). Map internship/co-op experience to the full-time title they'd enter as: a software engineering co-op targets "Software Engineer" / "Software Engineer I/II", never "Intern"; a data co-op targets entry-level "Data Analyst" / "Data Scientist". For each archetype, propose 2–4 synonyms (phrasing variants that appear in real JDs) and confirm. Record `level` and `fit` (`primary` / `secondary` / `adjacent`).
- **industries** — ask for target industries, multi-select plus custom. Offer "any industry — match on title alone" explicitly; that sets `mode: "any"`. Sub-sectors optional.
- **compensation (OPTIONAL — give market context before asking)** — first, run a quick WebSearch for the current average compensation for their primary archetype + level + location, and share the range in one line with a "rough public numbers" caveat. Then ask whether they want a personal minimum on record, showing the format with varied examples: `$120k base` · `$150k total comp` · `$60/hr` · `skip`. Explain its only use: `process` and `analyze` flag JDs that post below it. Skipping is a first-class answer — blank disables comp flags entirely. If WebSearch is unavailable, drop the market context and move on; never block onboarding on it.
- **visa (ask ONLY when the CV suggests it)** — don't ask by default. If the CV shows education or work experience outside the country they're searching in, ask once, plainly: "Do you need visa sponsorship? I only use this to flag JDs that say they won't sponsor." Record it in the `visa:` block. If nothing in the CV suggests it and they don't raise it themselves, leave `visa.status` blank — blank means rolecraft never raises the topic.

## Step 3 — Proof points (optional) → `user/profile/article-digest.md`

Ask: "What's the most impressive thing you've shipped? I'll turn it into reusable interview material. (You can skip this and fill it in later.)"

If they engage: write `user/profile/article-digest.md` following `templates/article-digest.template.md` — hero proof point with context, what they built, why it matters, at least one STAR-ready story. If they skip: copy the template as-is so the file exists with placeholders.

## Step 4 — Framing & narrative → `user/profile/_profile.md`

Copy `templates/_profile.template.md` to `user/profile/_profile.md`, then fill it with short, focused questions:

- Hero pitch in one sentence (cross-cutting advantage).
- Adaptive framing per archetype: "when a JD matches X, what about you should I emphasize?"
- Energy/drain mapping: what kind of work energizes them, what drains them even when the title fits.
- Deal-breakers: hard filters that should flag a JD no matter how good the match.
- Negotiation defaults and location policy if they want them on record.
- **Prior domain knowledge:** ask what they already know cold — concepts rolecraft must NEVER suggest study resources for. Add a `## Your prior domain knowledge` section listing them. This feeds the 🎓 marker.
- **Framing discipline:** ask if there's anything they must never be described as (e.g., "built infra behind trading flows, never made trading decisions"). If yes, add a `## Your framing discipline (HARD RULE)` section.

## Step 5 — Personalization round

Ask, conversationally: "Last round, free-form: What makes you unique? What drains you? Any published work, certifications, or projects you'd lead with?"

Append the answers where they belong — narrative items into `_profile.md`, proof items into `article-digest.md`. Don't create new files.

## Step 6 — Ready

1. Confirm what was written: list the files in `user/profile/` and one line each on what they hold.
2. Print what works today: `/rolecraft` (process a JD), `/rolecraft analyze` (one-off gap analysis), `/rolecraft onboard` (revisit setup). Mention that more modes arrive in later phases.
3. Offer: "Paste a job description whenever you're ready and I'll process it."
4. If onboarding was auto-triggered on the way to another mode, resume that mode now.

## Rules

- Write each file as its step completes — don't batch everything to the end.
- Everything goes in `user/profile/`. Never write user content to a System Layer file.
- Tone per `_shared.md`: calm intake, not an interrogation.
