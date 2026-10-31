# Changelog

gamegen uses date-based versions: `vYYYY.M.D` (for example `v2026.10.20`),
which are also valid semver. For a second release on the same day, use the next
day's date rather than a `-1` suffix, because semver sorts `2026.10.20-1`
before `2026.10.20`.

## v2026.11.1

- `--site` is now `--gallery` (and `GAMEGEN_SITE` is `GAMEGEN_GALLERY`): a
  GitHub repository showing all your games together. If it doesn't exist
  yet, publishing offers to start it; each game is added the way the gallery
  already shows the others. It's only used when you set it: publishing no
  longer searches your repositories for a site.
- Every publish ends with the game's link, title, description and picture,
  for adding it to any other site by hand.

## v2026.10.31

- **Publish a game:** `/gamegen --publish` puts a finished web game online with
  GitHub Pages, free. It makes a public repository and publishes at
  `<you>.github.io/<game>`, or at your own domain (`--publish example.com`
  gives `<game>.example.com`, with a check of the DNS record and HTTPS
  switched on). If the site at that domain is yours on GitHub Pages, the game
  is added to its list of games (`--site` picks another site, `--site none`
  skips it). It shows where everything will go and asks first; "no" changes
  nothing. It never reuses an existing repository without asking. Publishing
  again updates the live game.
- **`--making-of`:** the README shows how the game was made: every request,
  exactly as typed (changes and notes included now, not just the first), and
  what gamegen and each plugin did. Publishing then includes the design notes.
  Without it, the README is all about the game.
- `GAMEGEN_DOMAIN`, `GAMEGEN_SITE` and `GAMEGEN_MAKING_OF` in your `.env` set
  your defaults; the `.env` gamegen makes lists them.
- A `.env` is made for any missing keys, and kept out of git.
- ElevenLabs is credited only when your plan is the free one, going by the
  setup check, or by the first sound when the key can't read the plan.
- The dev container comes from
  [devcontainer-plus](https://github.com/zeveck/devcontainer-plus).

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
- Dev container from github.com/zeveck/devcontainer-plus.
