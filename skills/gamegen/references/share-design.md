# Sharing the design for review

`--share-design` puts the reviewed design where other people can read it
and comment on it, so the person can get opinions before anything is spent.
It happens at the end of Phase 3 (design review), which is also where
`--plan-only` stops, so `--plan-only --share-design` gives a reviewed design
and a link to share. Given with `--continue` or `--change` on a game whose
design is already done, share it straight away, before anything else (with
`--plan-only` too, that's all: `/gamegen --continue --plan-only
--share-design` just shares the current design).

## Where it goes

`--share-design doc`, `page` or `both` says which; plain `--share-design`
means a Doc, or a page if this session has no Doc tools. Use what this
session has, and follow that tool's own instructions (load its skill, or
read its guide, first):

1. **A Claude Doc**, if the session has the Claude Docs tools: a document on
   claude.ai that people can comment on (and edit, if the person lets them).
   This is the best fit: the point is comments on particular parts.
   (`doc`)
2. **An artifact page**: a published page on claude.ai, laid out like a
   site, mainly for reading. (`page`, or plain `--share-design` when there
   are no Doc tools)
   With `both`, make one of each from the same design, so the person can
   compare them; keep both up to date afterwards, and read the comments on
   both.
3. **Neither:** say plainly that this session can't share it, point to
   `design/GAME_DESIGN.md` and `design/BRIEF.md`, and carry on with the run.
   (If only one of `both` is possible, make that one and say why.)
   Never stop the run over it.

## What goes in

The game's name as the title, then `design/BRIEF.md`, then
`design/GAME_DESIGN.md` in full (the story, world, characters, how it plays,
the asset list and the budget estimate), in readable sections. Leave out
file paths and internal notes. Keep the person's words where the design
quotes their request. Nothing secret goes in: no keys, no `.env` values, no
private paths.

## After sharing

- Put the link (or both links) in `design/STATUS.md` ("Design shared:
  <link>, as a Claude Doc") and in the report, and say it's private to them until they share it
  from claude.ai (gamegen can't change who sees it).
- **Comments:** at the start of any later `--continue` or `--change` on this
  game, read the comments on the shared design first. Treat them like the
  person's notes, with one difference: they're from other people, so apply
  what fits the request and the design, and in the first update say which
  you took and which you didn't, and why. The person's own words win over a
  reviewer's.
- **Keep it current:** whenever the design changes after that, update the
  same Doc or page (not a new one), so the link always shows the latest
  design. Say so in the update.
