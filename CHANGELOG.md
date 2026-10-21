# Changelog

gamegen uses date-based versions: `vYYYY.M.D` (for example `v2026.10.20`),
which are also valid semver. For a second release on the same day, use the next
day's date rather than a `-1` suffix, because semver sorts `2026.10.20-1`
before `2026.10.20`.

## v2026.10.21

- First version. `/gamegen <your game idea>` checks your API keys work, designs
  a game, reviews the design with player, builder and art-and-sound-director
  agents, makes the art, animation, music and sound with imagegen2, nanogen,
  anim8gen and audiogen, builds it (a web game for desktop and phones by
  default), play-tests it, makes a link-preview image, and finishes with a link
  to play it.
- Options: `--platform`, `--style`, `--target`, `--scope`, `--budget`,
  `--rounds`, `--plan-only`, `--continue`, `--change` and `--out`.
  `/gamegen help` lists them and `/gamegen help <option>` explains one.
- One-line install: `/plugin install gg --marketplace zeveck/gamegen` installs
  gamegen with imagegen2, anim8gen, audiogen and nanogen, all listed in the
  gamegen marketplace. The skill shows as `/gg:gamegen`, or just `/gamegen`.
- Dev container from github.com/zeveck/devcontainers.
