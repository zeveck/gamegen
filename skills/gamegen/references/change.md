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
   labels, social card, GitHub preview image and README; new art matches the
   style anchor and style line.
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

## Changes from GitHub issues

`--change` can name issues instead of (or as well as) describing the change:
`#12`, several (`#12 #15`), or an issue's address
(`https://github.com/owner/repo/issues/12`). `#12` means the game's own
repo: its `origin` (or `github`, a remote an earlier publish added) on
GitHub. If the game has no GitHub repo yet, say an issue number needs one,
and stop.

1. **Read each issue** with
   `gh issue view <n> -R <owner/repo> --json number,title,body,comments,labels,state,url`,
   and look at any screenshots in it or its comments (download them, then
   Read them; if one can't be downloaded, as can happen in a private repo,
   say so rather than guess what it shows). Anything the person typed after the issues adds to them, or
   overrides them where it disagrees.
2. **Check it's something to do.** A closed issue, a question, a duplicate,
   or a report of something that works as designed (a "bug" that's really
   the game's rules): say so and ask what they'd like, rather than changing
   the game. With `--no-confirm`, leave those out and say so in the report.
3. **Record it:** add `#12: <its title> (<its address>)` to the requests
   list in `design/STATUS.md`, plus anything typed with it, exactly as
   typed.
4. **Make the change** as above (steps 1 to 5 of "Changing a finished
   game"), one issue at a time when there are several, each with its own
   commit whose message ends `Fixes #12`. The play-test at the end covers
   them all.
5. **Never touch the issue itself** (no comments, labels or closing).
   GitHub closes it when the commit reaches the repo, which happens when the
   person publishes (`/gamegen --publish`). The report lists each issue and
   what changed for it, and says they'll close on the next publish.
