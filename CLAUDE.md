# gamegen: working on the plugin

gamegen is a Claude Code plugin: one skill, `/gamegen`, that designs, reviews,
builds and play-tests a game, using the imagegen2, nanogen, anim8gen and
audiogen plugins for art and sound.

## Layout

- `skills/` is the plugin root (what Claude Code copies on install):
  `skills/.claude-plugin/plugin.json`, `skills/LICENSE`, and the skill in
  `skills/gamegen/`.
- `skills/gamegen/SKILL.md` is the pipeline. Detail for each phase lives in
  `skills/gamegen/references/`, read by the skill when it reaches that phase.
  Keep SKILL.md readable end to end; move long detail into a reference file.
- `.claude-plugin/marketplace.json` is the marketplace. It allowlists the four
  companion marketplaces (`allowCrossMarketplaceDependenciesOn`); without that,
  the dependencies don't install.

## Rules

- Versions are CalVer (`YYYY.M.D`). A release updates `plugin.json` and adds a
  `## vYYYY.M.D` heading at the top of CHANGELOG.md; the tests check they match.
- Every flag must appear in SKILL.md's flag table, its `argument-hint`, and the
  README options table; the tests check this too.
- User-facing text (README, the skill's report to the person) is friendly and
  plain, not technical.
- Keep `skills/LICENSE` identical to `LICENSE`.

## Tests

`node --test`, plus `claude plugin validate --strict skills` before a release.
To try the plugin locally without installing it:
`claude --plugin-dir skills` (with the four companion plugins installed).
