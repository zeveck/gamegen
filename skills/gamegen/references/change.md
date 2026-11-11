# Continuing a game, and changing a finished one

Read this for `--continue` and `--change`. Find the game first (see "Finding
an existing game" in SKILL.md).

## Continuing

With `--continue`, read the game's `design/STATUS.md` and design, and resume
at the first unfinished phase. A description given with `--continue` is a
note on what to change; add it to the requests list in `design/STATUS.md`
and apply it to the design before resuming. If the design was shared, read
its comments first (see `references/share-design.md`); with `--share-design`
on a game whose design is done, share it first. On a finished game, treat it
as `--change`.

## Changing a finished game

`--change <what to change>` (or `--continue` with notes, on a finished game)
means: keep everything they didn't mention, and change what they asked for,
whether it's small (the font, the title, one character's look) or big (a new
level, a double jump, a boss). If there's no game, say so and suggest
starting one; if the game isn't finished yet, suggest `--continue`. Then:

1. Add the change request, exactly as typed, to the requests list in
   `design/STATUS.md`. Update the design with the change, and follow it
   through: a new title also means the title screen, logo, app name and icon
   labels, social card and README; new art matches the style anchor and
   style line.
2. For anything that changes how the game plays, run one short design review
   round on the change.
3. Make only the assets the change needs. Each change gets its own budget:
   `--budget` if given now, otherwise the default $20.
4. Build it, play-test what changed (with the text scanner on every screen
   it touched, at every size), and replay every level's solution to make
   sure nothing else broke.
5. Wrap up as usual: update the README and screenshots, start the game, and
   report with a fresh link and what changed. If the game is published, end
   with "Run `/gamegen --publish` to put this version online." Never publish
   without being asked.
