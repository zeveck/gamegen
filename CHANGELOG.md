# Changelog

gamegen uses the release date as its version: `vYYYY.M.D` (for example
`v2026.10.20`). A second release on the same day adds `.2`, a third `.3`, and
so on (`v2026.10.20.2`).

## v2026.10.31.7

Games look finished, not just working (#1):

- **A polish pass** before wrap-up: a fresh reviewer who didn't build the
  game goes over every screen at every size with a checklist of what players
  notice first: code showing as text, lone last words, cut-off text, pop-ups
  covering the action, names written differently, icons, the first load.
- **The play-test reads the words on screen**, at every screenshot, with a
  new text scanner, and opens everything every button opens (credits,
  settings, help), not just the main screens.
- **It films the first load** on a slow connection, so a title that
  flickers, changes font or jumps as it loads gets caught.
- **Publishing looks at the live game**: screenshots at a desktop and a phone
  size, the console, and a popup or two, not just the address answering.
- Web games build in balanced line breaks, a title that waits for its fonts
  and art and then fades in once, one set of matching SVG icons, a single
  queue for pop-up messages, and names that shrink to fit before they're
  cut off.
- A check is never told to skip something: fix the cause instead.
- Every game's definition of done now says every screen looks finished at
  every size.

## v2026.10.31.6

- Games credit the right person. The name comes from `GAMEGEN_CREDIT` in
  your `.env`, or else your GitHub or git name, and with no name at all the
  credit is left out. gamegen never fills in a made-up one like "the player"
  (#2).
- Publishing tells you whose name the game credits before it goes online,
  so you can change it. The wrap-up report says which name was used.

## v2026.10.31.5

- When the repo name only redirects to one you renamed, publishing says
  that using it ends the redirect, so old links reach the new game.

## v2026.10.31.4

- Publishing sees a repo name you've renamed away from as free (GitHub only
  redirects it), instead of as taken by the renamed repo.

## v2026.10.31.3

- Publishing tells you what it's about to do in a few plain sentences before
  asking: the address, the repo and what goes in it, the gallery spot, and
  anything that comes later (DNS, HTTPS). An update says what's changed since
  the game was last published.
- A blank line above the game's name, so it stands apart from the chat.

## v2026.10.31.2

Versions are now the release date, with `.2`, `.3` for later releases the
same day. v2026.11.1 to v2026.11.6 were all released on October 31, under an
older rule that used the next day's date for each same-day release.

- Publishing's question is one short sentence: where the game goes, with a
  few words in brackets only when something's unusual (a taken repo name,
  DNS not ready yet).

## v2026.11.6

- The game's name above the prompt leaves out the "status" label older games
  have in their `design/STATUS.md` heading (`# BarbarAIn — status` shows as
  BarbarAIn).

## v2026.11.5

- While you work on a game, its name shows above the prompt, so you always
  know which game you're on. It's the game in the folder you're in, or the
  one you changed most recently in the folders below it. Click `[-]` beside
  it to fold it away.
- `design/STATUS.md` starts with the game's name as a heading.

## v2026.11.4

- Whenever gamegen needs to ask you something, not just when publishing, it
  asks in plain words and waits for your reply, never with a multiple-choice
  prompt.

## v2026.11.3

- Publishing asks its questions in plain words and waits for your reply,
  instead of with a multiple-choice prompt, so you can answer with a
  correction in your own words.

## v2026.11.2

- A new game goes at the top of your gallery, newest first, or just before
  the game it's a sequel to (Pomegranate Panic 3 before Pomegranate Panic 2).
  Publishing says where when it asks, and you can name another place. It no
  longer works out an order from the page, and never moves the games already
  there.

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
