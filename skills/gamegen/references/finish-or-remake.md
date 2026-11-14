# Finishing or remaking a game the person started

`--finish <folder or repo>` and `--remake <folder or repo>` take a game the
person began some other way (by hand, or with earlier AI help) that stalled,
or whose assets they'd like gamegen to do better, and make it whole, without
losing what they put in. This isn't for copying other people's games: the
source must be the person's own project (their folder, or a repo under their
account or one they say is theirs). If it plainly isn't, say so and stop.

## Where the result goes

This decides where the person's work ends up, so it's never guessed from
wording; the flags say it. Nothing is created (no copy, branch, folder or
records) until the person approves the plan (step 2):

| Flags | The result | The original |
|---|---|---|
| `--finish <src>` | a **copy** in a new folder next to the original, with its full history, as its own new repo | untouched |
| `--finish <src> --in-place` | the original project, on a new branch (`gamegen-finish`) | its main line untouched until the person merges |
| `--remake <src>` | a **new folder and new repo**, fresh history, with the person's assets and ideas copied in | untouched |

- **Never touch the original** outside that branch: no new files or folders
  inside it, no edits, no deletions, no pushes to its remote.
- **New folders go next to the original** (beside a local folder; in the
  current folder for a GitHub repo), named after the game in kebab-case,
  plus `-finished` or `-remake` if that name is taken (`snakez-finished`).
  `--out` chooses another name or place.
- **A copy** (`--finish`): `git clone <original> <new folder>` (it keeps the
  history), then `git remote rename origin original` so nothing can ever be
  pushed back by mistake; publishing later gives it its own repo. A clone
  carries only what was committed, so first list the rest in the original
  (`git status --porcelain --ignored`): edited and new files, and ignored
  ones. Bring the game's own work into the copy (its code, art, sound,
  levels and notes, including ignored assets such as big audio files), but
  never secrets (`.env`, keys), dependencies (`node_modules/`) or build
  output, and commit it as "The game as it was, before gamegen". A source
  that isn't in git, or a repo with no commits yet: copy the folder (without
  any `.git`), then `git init -b main` and commit it the same way.
- **In place** (`--finish --in-place`): only for a local git repository with
  no uncommitted changes (if there are some, say so and stop: they're the
  person's). `git switch -c gamegen-finish`, and commit there. A source that
  isn't in git: refuse, and suggest plain `--finish` (a copy).
- **A remake** (`--remake`): a new folder, `git init -b main`, and a normal
  gamegen game, with the assets to keep copied into `game/assets/` (keep
  their file names where possible) and the original's notes in
  `design/original/` for reference.
- `--in-place` without `--finish` (with `--remake`, or on its own): say it
  only goes with `--finish`, and stop before doing anything.
- `--finish` and `--remake` together: say to pick one, and stop.
- Say exactly where everything is in the first update: "Finishing a copy of
  snakez in `../snakez-finished`, a new repo; your original in `../snakez`
  is untouched."

## How closely to follow it: `--leeway`

| `--leeway` | Means |
|---|---|
| `little` | Keep what's there and make it whole: the same mechanics, assets and feel. Fill the gaps, fix what's clearly broken, and match the person's style for anything new. |
| `some` | Keep the core idea and the best parts; free to rework structure, controls and weaker assets. |
| `lots` | Treat it as a sketch: build what it was reaching for, reusing whatever still fits. |

Without `--leeway`, choose from what the survey finds (nearly finished:
`little`; a rough start: more) and say which, and why, in the first update.
The person's own words beat the leeway for anything they name ("keep my art
exactly", "it should be an RPG with a town you swim around, not a text
adventure"): record each as a request.

## 1. Survey (change nothing)

Look at the original as a careful new teammate would, without changing
anything in it or creating anything anywhere. A GitHub repo: clone it to a
temporary folder outside both the original and where the result will go
(the system's temp folder), and look there.

- **What it is:** the README, notes, TODO lists, design docs, comments, and
  `git log` (the last few dozen commits: what was being worked on when it
  stalled). Its target (web, or an engine: an engine game stays in that
  engine when finished, see other-targets.md; a remake is a web game unless
  `--target` says otherwise).
- **Work that isn't committed** (`git status --porcelain --ignored`): what's
  edited, new or ignored, so the plan can say what comes along.
- **Play it**, if it runs (for a web game, serve its folder as the play-test
  does): what works, what's broken, what's missing, how it feels.
- **Every asset**, and look at each image: what it is, where it's used, its
  style, whether it's hand-made, and whether it's good enough to keep at
  this leeway.
- **Quirks that might be intended.** Anything that looks like a bug but
  could be a choice (a swarm so big the game slows down, odd physics that
  make a puzzle work) goes on its own list, apart from the clear bugs. At
  `little` leeway, keep them unless the person says otherwise.
- **Its layout.** gamegen keeps a web game in `game/` (the page, its code
  and assets), with `design/`, `media/` and the README beside it; publishing
  and packaging work only from there. Note whether the original already
  does.

## 2. The plan (the one stop)

Show the plan in a few plain lines and ask:

- where it'll be (the new folder and repo, or the branch);
- what comes along that wasn't committed, if anything;
- what's kept exactly; what changes and what's added; the quirks it'll keep
  (and any it's unsure about, as a question);
- **moving the game into `game/`**, if it isn't already there, as one commit
  ("Move the game into game/"), and what that affects: with `--in-place`, a
  site already published from the project's top level changes once the
  branch is merged and published again (if gamegen didn't set that site up,
  publishing says so and asks before replacing it with the game);
- the estimated cost of new assets;
- and, if the survey says so, that the other verb would suit better ("This
  would be easier to remake than finish, because…: say so if you'd like
  that instead."). Never switch by yourself.

A plain "no" changes nothing anywhere. If they agree to everything but the
move, finish it where it is: publishing and packaging then say they need
the game in `game/` and stop, with the command that moves it later
(`/gamegen --change move the game into game/`). With `--no-confirm`, don't
wait (the plan goes in the first update), and do the move.

## 3. Set it up, and write gamegen's records

Now make the copy, the branch or the new folder (see "Where the result
goes"), move the game into `game/` if agreed (one commit), and write the
records there, so the rest of the pipeline, and later `--continue` and
`--change`, work as for any gamegen game:

- `design/STATUS.md`: the name heading; the request exactly as typed; "From:
  <source>, <finish a copy / finish in place / remake>, leeway <x>"; the
  settings; the phase checklist.
- `design/BRIEF.md`: the game as it was meant to be, from the original and
  the request; "what they asked for" includes the person's words and what
  the original clearly aimed at.
- `design/GAME_DESIGN.md` (from design-template.md): the game as it is, then
  what it becomes. Its asset list marks each existing asset **keep**,
  **improve** or **replace**, and adds what's missing. The person's art, if
  kept, is the style anchor: new art matches it.
- `design/ORIGINAL.md`: what the survey found: what works, what's broken,
  the possibly intended quirks, and what will be kept as is.

## 4. Then the usual pipeline

From Phase 3 (design review) on, with these differences:

- **Reviewers** get the original's survey and the leeway: they don't
  propose cutting what's marked keep, and they check the plan is faithful
  to it.
- **Assets:** make only what's new, improved or replaced, matching the
  kept art. Kept assets cost nothing; list them in `design/ASSETS.md` as
  "original" with their source path.
- **Building:** to finish, work within the original code's structure (fix
  and extend it; refactor only what blocks the work). To remake, build to
  gamegen's standards (web-target.md), carrying the mechanics, levels and
  feel across.
- **Play-testing** also checks that every kept quirk is still there, as
  well as everything else.
- Commit as usual (on the branch, for in place).

## 5. Report

Where the result is and that the original is untouched (or, in place, the
branch, and that publishing will offer to merge it into `main` first); what
came along that wasn't committed; what was kept, changed and added; the
quirks kept; and anything that couldn't be done.
