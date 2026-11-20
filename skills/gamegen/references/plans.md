# The plans page (`GAMEGEN_PLANS`)

Read this when `publish.sh settings` shows an address for `GAMEGEN_PLANS`
(such as `example.com/plans`) and the run doesn't say `--plans none`. It
keeps one page of every game's plans at that address: a card per game,
linking to its plan as files anyone can read or download, so a plan can be
shared, discussed, or picked up on another machine.

The page lives in the gallery repo (`GAMEGEN_GALLERY`), in the folder the
address adds to the gallery's own address (`gh api repos/<gallery>/pages
--jq .html_url`, ignoring `https://` and a trailing `/`): `plans/` for
`example.com/plans` with the gallery at `example.com`, and for
`you.github.io/my-games/plans` with it at `you.github.io/my-games`. If the
address isn't on the gallery's site, is the gallery's own address, or no
gallery is set, say so and carry on. It's a page of its
own: the gallery page never links to it (the plans page links to the
gallery, from the template).

It only ever puts up a plan the game already has (its `design/` folder); it
never writes one. A game without one gets "there's no plan for this game".

## When

- At the end of the design, with `--plan-only` or `--share-design`: add the
  game's card (status "Planned"). With `--repo` too, after the repo is made
  (repo.md's last step adds the card).
- At the end of a build (Phase 9): "Built". After `--publish`: "Published",
  with a link to play. After `--continue` or `--change` that changed the
  design: update its plan files.

- `--plans` on its own, in a game's folder: add or update just this game's
  card now, and do nothing else (no setup check: nothing is generated). If
  `GAMEGEN_PLANS` isn't set, say so, show the line to add to `.env`
  (`GAMEGEN_PLANS=<your gallery's address>/plans`), and stop.

Never for a game with `--plans none` in its requests; say so once.

## Asking first

A plan goes public, so before a game's first card, show what will go up
(its name, one line, the mock picture if any, and the files below, or,
for a game whose repo already shows its plan, just the card) and ask,
as publishing does: "Add Bloom Hop's plan to your plans page at …? It
includes your request in your words. Go ahead?" With `--no-confirm`, go
on. Record "Plans page: yes" (or "no", and then never ask again for it) in
`design/STATUS.md`. Updates don't ask.

## The gallery repo

Check it as publish.md step 1.4 does: clone it into `.gamegen/gallery/` if
it isn't there, or `git pull --ff-only` if it is (another computer may have
added plans). If it doesn't exist yet, offer to start it in the same
question (publish.md step 5, "Starting a new gallery"), or skip the plans
page and say why. If they can't push to it, say so and carry on. If it's
private, say so in the question: the cards' links open only for people
with access.

## What goes up

**A game with its own repo holding its `design/` folder** (made with
`--repo`, or published with `--making-of`), public or private, shows its
plan there: its card's Plan links to that folder
(`https://github.com/<owner>/<repo>/tree/main/design`, or where the game
folder is), and nothing is copied. A private repo's link opens only for
people with access, and its readable Design page (below) stays here. Its
`STATUS.md` is in that repo already; that's the only exception to the rule
below.

**A game with no repo yet** has its plan in `<plans folder>/<game-slug>/`:

- Copies of `BRIEF.md`, `GAME_DESIGN.md` and `REVIEW_LOG.md`, cleaned as
  share-design.md's "What goes in" says (no prices or dollar figures, the
  effort instead; no paths, keys or `.env` values; the person's words
  kept), and the mock pictures, if any (`--share-design`'s).
- A short `README.md`: the name, one line, the mock picture, the status, the
  links (the design and art pages below, or their claude.ai links if
  that's where they are; the game, once published), and how
  to build it: "Run `/gamegen --continue <this page's address>`."

Never copy `design/STATUS.md` (it holds costs and settings), `.env`, prices, or
paths on this machine. The credit name only if the person allowed it for
publishing (`publish.sh credit`).

`<plans folder>/index.html` is the page of cards, from
`${CLAUDE_SKILL_DIR}/templates/plans.html` the first time ("<their name>'s
game plans", the credit as for a new gallery; `GALLERY_URL` the gallery's
address). Each card: the mock picture (or the game's social card, once
there is one), name, one line, status, and its links: **Plan** (the game
repo's `design/` folder, or
`https://github.com/<gallery repo>/tree/main/<plans folder>/<game-slug>`;
GitHub shows the README and lets anyone download the files, however the
gallery site is built), **Design** and **Art** when it has those pages
(below, or their claude.ai links if they're shared there), and **Play**
once it's published. Check each link whenever the card is updated (a
`--publish` without `--making-of` takes `design/` out of a game repo not
made with `--repo`: then the plan is copied as above). Newest first; a game already there gets its card
updated, not a second one. Never change the gallery's own page.

## Design and art pages

With the plans page on for a game, `--share-design page` and `--art-sheet`
make their pages here instead of on claude.ai, in
`<plans folder>/<game-slug>/design/` and `.../art/`, and its card links
them. (`--share-design doc` is still a Claude Doc: that's where people
comment.) Their pictures and sound link to the game's own files wherever
someone can reach them, so nothing big is copied:

| The game | Pictures and sound come from |
|---|---|
| Published (its site is public, even from a private repo) | Its site: base `https://<its address>/`, without the game folder's path |
| A public repo, not yet published | `https://raw.githubusercontent.com/<owner>/<repo>/main/` |
| A private repo, not yet published | Pictures: small copies here. Sound: links to `https://github.com/<owner>/<repo>/raw/main/…`, which open for people with access |

For the art sheet, give art-sheet.md's manifest a `links` entry saying so
(`"pictures": "copy"` and `"audio": "links"` for a private repo), build it
as usual, and copy its folder here. The design page's mock pictures are its
web-sized copies, not the full-size originals in `design/mockups/`: linked
from the repo when it's public, otherwise copied. When a game
is published later, rebuild its pages to use its site and remove the
copies.

If the gallery is a Jekyll site (it has a `_config.yml`), add
`<plans folder>/*/` to its `exclude:` list once, so the plan files are left
to GitHub's own view.
Commit ("Plans: add Bloom Hop", "Plans: Bloom Hop is published"), push, and
give the plans page's address in the report.
