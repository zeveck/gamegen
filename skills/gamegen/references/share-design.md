# Sharing the design for review

`--share-design` puts the reviewed design where other people can read it
and comment on it, with a few mock pictures, so the person can get opinions
on the plan and the look before the real spending starts. It happens at the
end of Phase 3 (design review), which is also where `--plan-only` stops, so
`--plan-only --share-design` gives a reviewed design and a link to share.
Given with `--continue` or `--change` on a game whose design is already
done, share it straight away, before anything else (with `--plan-only` too,
that's all: `/gamegen --continue --plan-only --share-design` just shares the
current design).

## Where it goes

`--share-design page`, `doc` or `both` says which; plain `--share-design`
means a page. Use what this session has, and follow that tool's own
instructions (load its skill, or read its guide, first):

1. **An artifact page** (`page`, the default): a published page on
   claude.ai, laid out like a site, with the mock pictures in it.
2. **A Claude Doc** (`doc`), if the session has the Claude Docs tools: a
   document on claude.ai that people can comment on part by part (and edit,
   if the person lets them).
3. **Both** (`both`): one of each from the same design, so the person can
   compare them; keep both up to date afterwards, and read the comments on
   both.

If the session can't make the one asked for, make the other and say why; if
it can make neither, say so plainly, point to `design/GAME_DESIGN.md` and
`design/BRIEF.md`, and carry on with the run. Never stop the run over it.

## Mock pictures (`--mockups`)

Before sharing, make a few concept pictures so reviewers can react to the
look, not just the words: the main character (or two), the most important
other characters, and one or two key places. Spend up to `--mockups`
dollars on them (default $5; `--mockups 0` for none), out of the game's
`--budget`, with the image tools and rules in asset-guide.md (the style line
from the design, one subject per picture, no text in images). Even with
`--plan-only`, these are the only thing spent before the person approves
the rest; say so in the update ("I'm making about $5 of mock pictures for
the shared design").

Keep them in `design/mockups/`, record each in `design/ASSETS.md` as a
mockup with its cost, and put them in the shared design beside the parts
they show. Later, the best can become the style anchor (Phase 4 starts from
it if it fits), so they're rarely wasted. Comments on them are feedback on
the look: apply them to the style line and the art direction.

## What goes in

The game's name as the title, then `design/BRIEF.md`, then
`design/GAME_DESIGN.md` (the story, world, characters, how it plays, and
the asset list), in readable sections, with the mock pictures. **Leave out
prices and dollar figures** unless the person asks for them; include the
effort instead (from the design's "Effort and cost estimate": how many
areas, characters and pieces of art and music, and the biggest and riskiest
work). Leave out file paths and internal notes. Keep the person's words
where the design quotes their request. Nothing secret goes in: no keys, no
`.env` values, no private paths.

## After sharing

- Put the link (or both links) in `design/STATUS.md` ("Design shared:
  <link>, as a page") and in the report, and say it's private to them until
  they share it from claude.ai (gamegen can't change who sees it).
- **Comments:** at the start of any later `--continue` or `--change` on this
  game, read the comments on the shared design first. Treat them like the
  person's notes, with one difference: they're from other people, so apply
  what fits the request and the design, and in the first update say which
  you took and which you didn't, and why. The person's own words win over a
  reviewer's.
- **Keep it current:** whenever the design changes after that, update the
  same Doc or page (not a new one), so the link always shows the latest
  design. Say so in the update.
