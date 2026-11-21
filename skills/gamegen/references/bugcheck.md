# Checking a finished game for bugs (`--bugcheck`)

`--bugcheck` on its own checks a finished game for problems worth fixing,
reports them, and changes nothing until the person says which to fix. Find
the game as SKILL.md says; if it isn't finished, suggest `--continue`
instead. Nothing is generated, so it costs nothing beyond the time. For a
game built for another target, check what can be run here
(other-targets.md); if its engine can't run here, only the Bug hunter
reviews it, from the code, and the report says so.

## The bar

The bar is the one every review uses: "The bar" in review-roles.md. It
counts here most of all: only what clears it is reported as worth fixing.

## How

1. **Record it:** add the request to `design/STATUS.md`'s requests, exactly
   as typed. Keep a list, for yourself, of what's already known: earlier
   "Bug check" sections there still open, and the game repo's open `bug`
   issues.
2. **Serve the game** as the play-test does (playtest-guide.md), and keep it
   running for the check.
3. **Dispatch fresh reviewers,** with instructions from review-roles.md: the
   **Playtester**, the **Bug hunter** and the **Polish reviewer**. They
   didn't build the game and don't see each other's findings. Give each the
   address, the game folder, `design/GAME_DESIGN.md`, the settings from
   `design/STATUS.md`, the targeted sizes, the play-test guide, the skill
   folder and the bar, plus `references/3d.md` for a 3D game, and
   `references/gamepad.md`, `references/feedback.md` or `references/saves.md`
   when the settings say the game has a controller, "Report a bug" or save
   slots. They take fresh
   screenshots into `design/bugcheck/` (not `design/screenshots/`, which
   may be out of date), and ideas for making it more fun go under "Also
   noticed", not as bugs. Each runs a browser: start them as
   `browsers.sh` allows ("Running helpers" in SKILL.md).
4. **Check each finding yourself** before reporting it: reproduce it (or
   confirm it in the code), merge duplicates, and drop anything that doesn't
   reproduce or doesn't clear the bar. The reviewers don't see what's
   already known (fresh eyes); you match their findings against it. A known
   one is reported as still open, not as new, and one judged below the bar
   before stays there unless the game changed.
5. **Stop the server.**

## The report

Short and plain, in words a player would use:

- **Worth fixing,** most important first: what goes wrong, where (the
  screen, the size, the steps), how often a player would meet it, and how
  big the fix is (small, medium or large). A screenshot path for anything
  visual.
- **Also noticed,** in one line: anything that didn't clear the bar but the
  person might care about, or nothing.
- **What was checked:** the sizes, and the screens and levels played.

Write the findings into `design/STATUS.md` too, under "Bug check (<date>)",
so a later `--change` or `--bugcheck` can pick them up, and mark each one
"fixed" there as it's fixed. Then end by asking which to fix ("all", some by
number, or none), and stop. Always stop here, even with `--no-confirm`: picking what to
fix isn't an approval.

## Afterwards

- **Fixing:** what the person picks is a change: follow "Changing a finished
  game" in change.md, one finding at a time, each with its own commit, and
  the proof sized to what each touched (its step 4). If the
  game is published, end with "Run `/gamegen --publish` to put this version
  online", as usual; never publish without being asked.
- **Filing as issues** (only when the person asks, in the game's own repo,
  as change.md finds it): one issue per finding, labelled `bug` (create the
  label if it's missing), with the steps and what goes wrong. Check the
  repo's open issues first and skip anything already reported. Never file a
  safety finding as an issue (in a public repo it tells everyone): tell the
  person, and offer to fix it now. `/gamegen --fix #12` (or `--fix all`) then fixes them,
  alongside players' reports.
