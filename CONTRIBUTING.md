# Contributing

Workflow rules for this repo. They apply to human contributors and agent sessions alike.

## Git workflow

- `main` is protected: all changes land via pull request, from feature branches only
- One branch per phase/feature, cut from `main`, deleted after merge
- Implementation plans go in `docs/superpowers/plans/` before execution; match the structure of the existing phase plans there

## Releases

Any merge that changes plugin content is a release:

- Bump the version everywhere it lives: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/rolecraft/SKILL.md` frontmatter, `VERSION` (installed copies only refetch on a version change)
- Add a `CHANGELOG.md` entry: one-line summary first (update notices show only that), categorized details underneath
- Minor releases only (`0.x.0`, `1.0.0` — phase completions and feature milestones): tag the merge commit `vX.Y.0` and create a GitHub release with the changelog summary as the notes. Patch bumps get a changelog entry but no tag.
- Run `claude plugin validate .` before merging

## Testing changes to modes

- Smoke-test with a synthetic persona under gitignored `user/` — never real personal data
- Delete the fixture afterward and verify `git ls-files | grep ^user/` comes back empty
- Mode files must declare what they read and write; writes outside a mode's declared files are bugs (see [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md))

## The data contract, always

Never put user-specific content in System Layer files — personalization belongs in gitignored `user/`. Full rules: [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md).
