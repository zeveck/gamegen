# Changelog

gamegen uses date-based versions: `vYYYY.M.D` (for example `v2026.10.20`),
which are also valid semver. For a second release on the same day, use the next
day's date rather than a `-1` suffix, because semver sorts `2026.10.20-1`
before `2026.10.20`.

## v2026.10.20

- First version. `/gamegen <description>` designs a game, reviews the design
  with player, builder and art-and-sound-director agents, makes the art,
  animation, music and sound with imagegen2, nanogen, anim8gen and audiogen,
  builds it (a web game for desktop and phones by default), play-tests it, and
  reports when it's ready to play.
- Options: `--platform`, `--style`, `--target`, `--scope`, `--budget`,
  `--rounds`, `--plan-only`, `--continue` and `--out`.
- Installs imagegen2, anim8gen, audiogen and nanogen as dependencies.
- Dev container from github.com/zeveck/devcontainers.
