## What & why

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

- [ ] `claude plugin validate .` passes
- [ ] If plugin content changed: version bumped in `plugin.json`, `marketplace.json`, `SKILL.md` frontmatter, and `VERSION`
- [ ] `CHANGELOG.md` entry added (one-line summary first)
- [ ] Mode changes smoke-tested with a synthetic persona; `git ls-files | grep ^user/` comes back empty
- [ ] No personal data in any committed file (see `docs/DATA_CONTRACT.md`)
