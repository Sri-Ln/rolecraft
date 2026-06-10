# Contributing

Workflow rules for this repo. They apply to human contributors and agent sessions alike.

## Git workflow

- `main` is protected: all changes land via pull request, from feature branches only
- One branch per phase/feature, cut from `main`, deleted after merge
- Implementation plans go in `docs/superpowers/plans/` before execution; match the structure of the existing phase plans there

## Commits

- Single-line subject, no body; write naturally and avoid repeating templated prefixes across commits
- Small commits (1–2 files): author attribution only
- Larger commits (3+ files): add a `Co-Authored-By` trailer for AI collaborators

## Testing changes to modes

- Smoke-test with a synthetic persona under gitignored `user/` — never real personal data
- Delete the fixture afterward and verify `git ls-files | grep ^user/` comes back empty
- Mode files must declare what they read and write; writes outside a mode's declared files are bugs (see [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md))

## The data contract, always

Never put user-specific content in System Layer files — personalization belongs in gitignored `user/`. Full rules: [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md).
