# How to use rolecraft

A 5-minute guide for end users. For architecture details, see `ARCHITECTURE.md`. For the user/system layer split, see `DATA_CONTRACT.md`.

## Install

```
/plugin marketplace add Sri-Ln/rolecraft
/plugin install rolecraft
```

You can verify it installed with `/plugin list`.

## First-run onboarding

Full detail on every step: [`ONBOARDING.md`](ONBOARDING.md).

The first time you invoke any rolecraft mode (or open a Claude Code session after installing), rolecraft notices `user/profile/` is empty and runs `onboard` automatically. The flow asks for:

1. Your CV (paste it, give a LinkedIn URL, or describe your experience)
2. Identity + target archetypes + industries + comp + location + visa
3. Proof points (optional but recommended — hero project, supporting roles)
4. Framing & narrative (hero pitch, adaptive framing per archetype, energy/drain mapping, deal-breakers)
5. Personalization round (free-form context that makes the skill smarter)
6. Confirmation

Everything onboarding asks goes into `user/profile/`. You can edit those files directly any time — see `docs/CUSTOMIZATION.md` (Phase 3).

## Daily flow

```
/rolecraft                  # paste a JD into the chat or into user/data/inbox.md → process
/rolecraft analyze          # paste a JD → one-off gap analysis, nothing saved
/rolecraft concepts         # paste a JD → update only the concepts tracker
/rolecraft stack            # paste a JD → update only the stack tracker
/rolecraft projects         # paste a JD → propose a niche project (or extend one)
/rolecraft companies        # paste a JD → find similar-role companies
/rolecraft dashboard        # refresh the summary (no JD needed)
```

After each run, look at `user/data/dashboard.md` for the current state of your radar.

## Customizing

- Change target roles / industries / comp: `/rolecraft profile` (Phase 3), or edit `user/profile/profile.yml` directly
- Change framing / narrative / deal-breakers: edit `user/profile/_profile.md`
- Add proof points: edit `user/profile/article-digest.md`
- Update CV: edit `user/profile/cv.md`

After significant profile changes, run `/rolecraft recurate` to re-rank existing trackers against your new targets.

## Wiping data

- `/rolecraft clear` (Phase 3) — confirmation-gated wipe of `user/data/` only. Keeps your identity.
- Manual full reset: `rm -rf user/` then re-run any mode (re-triggers `onboard`).

## Updating the skill

When new versions of rolecraft ship:

- `/rolecraft update` (Phase 5) — check upstream, diff against local System Layer, apply if you accept.
- Your `user/` directory is never touched by updates.

## Getting help

- Plugin docs: this directory and `AGENTS.md`
- Spec and plans: `docs/superpowers/`
- Issues: https://github.com/Sri-Ln/rolecraft/issues
