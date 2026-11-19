# The plans page (`GAMEGEN_PLANS`)

Read this when `publish.sh settings` shows `GAMEGEN_PLANS: on` and the run
doesn't say `--plans none`. It keeps one page of every game's plans in the
gallery repo (`GAMEGEN_GALLERY`), next to the published games: a card per
game, linking to its plan as files anyone can read or download, so a plan
can be shared, discussed, or picked up on another machine. Without a gallery
set, say the plans page needs one (`GAMEGEN_GALLERY`) and carry on.

## When

- At the end of the design, with `--plan-only` or `--share-design`: add the
  game's card (status "Planned").
- At the end of a build (Phase 9): "Built". After `--publish`: "Published",
  with a link to play. After `--continue` or `--change` that changed the
  design: update its plan files.

Never for a game with `--plans none` in its requests; say so once.

## Asking first

A plan goes public, so before a game's first card, show what will go up
(its name, one line, the mock picture if any, and the files below) and ask,
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

In `plans/<game-slug>/`:

- Copies of `BRIEF.md`, `GAME_DESIGN.md` and `REVIEW_LOG.md`, cleaned as
  share-design.md's "What goes in" says (no prices or dollar figures, the
  effort instead; no paths, keys or `.env` values; the person's words
  kept), and the mock pictures, if any (`--share-design`'s).
- A short `README.md`: the name, one line, the mock picture, the status, the
  links (the shared design on claude.ai, which opens only for people it's
  shared with; the art sheet, likewise; the game, once published), and how
  to build it: "Run `/gamegen --continue <this page's address>`."

Never `design/STATUS.md` (it holds costs and settings), `.env`, prices, or
paths on this machine. The credit name only if the person allowed it for
publishing (`publish.sh credit`).

`plans/index.html` is the page of cards, from
`${CLAUDE_SKILL_DIR}/templates/plans.html` the first time (its title from
the gallery's, plus " plans"). Each card: the mock picture (or the game's
social card, once there is one), name, one line, status, and a link to
`https://github.com/<gallery repo>/tree/main/plans/<game-slug>` (GitHub shows
the README and lets anyone download the files, however the gallery site is
built). Newest first; a game already there gets its card updated, not a
second one. Add a "Plans" link to the gallery page once, if it has room for
one, and ask first if it isn't clear where.

If the gallery is a Jekyll site (it has a `_config.yml`), add `plans/*/` to
its `exclude:` list once, so the plan files are left to GitHub's own view.
Commit ("Plans: add Bloom Hop", "Plans: Bloom Hop is published"), push, and
give the plans page's address in the report.
