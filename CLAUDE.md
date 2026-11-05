# gamegen: working on the plugin

gamegen is a Claude Code plugin: one skill, `/gamegen`, that designs, reviews,
builds and play-tests a game, using the imagegen2, nanogen, anim8gen and
audiogen plugins for art and sound, and meshgen for 3D games.

## Layout

- `skills/` is the plugin root (what Claude Code copies on install):
  `skills/.claude-plugin/plugin.json`, `skills/LICENSE`, and the skill in
  `skills/gamegen/`.
- `skills/gamegen/SKILL.md` is the pipeline. Detail for each phase lives in
  `skills/gamegen/references/`, read by the skill when it reaches that phase.
  Keep SKILL.md readable end to end; move long detail into a reference file.
- 3D is opt-in (`--3d`, or "3D" in the request). All 3D guidance lives in
  `references/3d.md`, which only 3D games read; SKILL.md has just the gate.
- The plugin is named `gamegen`, so its skill shows as `/gamegen:gamegen` (and
  plain `/gamegen`). It was `gg` until v2026.11.2.2; `renames` in
  `marketplace.json` moves old installs over (keep it, and keep it
  append-only).
- `.claude-plugin/marketplace.json` is the marketplace. It lists gamegen and
  the five companion plugins (from their own repositories, via `git-subdir`),
  so `/plugin install gamegen --marketplace zeveck/gamegen` installs everything.
  anim8gen's imagegen2 dependency is declared on its entry here (anim8gen's
  own `plugin.json` declares none, so each marketplace can supply its own).
- `skills/gamegen/scripts/check-setup.sh` tests the API keys with free requests
  before a run spends anything, and warns (never blocks) when a plugin is out
  of date.
- DNS providers: `GAMEGEN_DNS` (opt-in) names one, and
  `scripts/dns-<provider>.sh` talks to it, with its own keys in `.env`. Each
  provider script answers the same three commands (`access`, `lookup`,
  `add-cname`; see `dns-godaddy.sh`), and `publish.sh dns-add` only ever adds
  a record, never overwrites one. To add a provider: a new script, its keys
  in `dns_provider` in `publish.sh`, the template, README and help, and tests.
- `skills/gamegen/companions.json` lists the companions, where they live, and
  the oldest version of each that gamegen works with. When gamegen starts
  relying on something new in a companion, raise its `minimum` (and say why
  in `needs`) in the same change, and add the check to
  `tests/companions.test.mjs`, which the companions workflow runs daily
  against each companion's latest main. Don't use version requirements in
  `plugin.json`'s `dependencies`: a companion that's behind would stop
  gamegen from loading at all.

## Rules

- Versions are CalVer (`YYYY.M.D`). A release updates `plugin.json` and adds a
  `## vYYYY.M.D` heading at the top of CHANGELOG.md; the tests check they match.
- Every flag must appear in SKILL.md's flag table, the README options table,
  and `help.md`; the tests check this too. The `argument-hint` lists only the
  common ones and stays short (110 characters at most), so it can be read in
  full.
- User-facing text (README, the skill's report to the person) is friendly and
  plain, not technical.
- Keep `skills/LICENSE` identical to `LICENSE`.

## Tests

`node --test`, plus `claude plugin validate --strict skills` before a release.
To try the plugin locally without installing it:
`claude --plugin-dir skills` (with the companion plugins installed).
