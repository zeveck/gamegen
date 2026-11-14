# Checking a finished game for bugs (`--bugcheck`)

`--bugcheck` on its own checks a finished game for problems worth fixing,
reports them, and changes nothing until the person says which to fix. Find
the game as SKILL.md says; if it isn't finished, suggest `--continue`
instead. Nothing is generated, so it costs nothing beyond the time. For a
game built for another target, check what can be run here
(other-targets.md); if its engine can't run here, only the Bug hunter
reviews it, from the code, and the report says so.

## The bar

What makes a finding worth reporting is the same for every reviewer:

- **It's real:** players (or the person) would plausibly hit it in normal
  play, or it's a safety problem (anything unsafe, lost progress, a game or
  publish that breaks). An exotic edge case that needs an unusual setup or a
  deliberate misuse isn't worth reporting.
- **Weigh it:** how likely it is, how bad it is when it happens, and how big
  the fix would be. A rare, mild problem with a big fix isn't worth it; a
  serious one is, even with a bigger fix. The line is fuzzy: when it's close,
  say which way you leaned and why.
- **Fewer, better findings.** Ten small nits bury the one thing that matters.

## How

1. **Record it:** add the request to `design/STATUS.md`'s requests, exactly
   as typed.
2. **Serve the game** as the play-test does (playtest-guide.md), and keep it
   running for the check.
3. **Dispatch fresh reviewers,** with instructions from review-roles.md: the
   **Playtester**, the **Bug hunter** and the **Polish reviewer**. They
   didn't build the game and don't see each other's findings. Give each the
   address, the game folder, `design/GAME_DESIGN.md`, the settings from
   `design/STATUS.md`, the targeted sizes, the play-test guide, the skill
   folder and the bar above, plus `references/3d.md` for a 3D game, and
   `references/gamepad.md` or `references/feedback.md` when the settings
   say the game has a controller or "Report a bug". They take fresh
   screenshots into `design/bugcheck/` (not `design/screenshots/`, which
   may be out of date), and ideas for making it more fun go under "Also
   noticed", not as bugs. Run two at a time at most; each one runs a
   browser.
4. **Check each finding yourself** before reporting it: reproduce it (or
   confirm it in the code), merge duplicates, and drop anything that doesn't
   reproduce or doesn't clear the bar.
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

Write the findings into `design/STATUS.md` too, so a later `--change` can
pick them up. Then end by asking which to fix ("all", some by number, or
none), and stop. Always stop here, even with `--no-confirm`: picking what to
fix isn't an approval.

## Afterwards

- **Fixing:** what the person picks is a change: follow "Changing a finished
  game" in change.md, one finding at a time, each with its own commit. If the
  game is published, end with "Run `/gamegen --publish` to put this version
  online", as usual; never publish without being asked.
- **Filing as issues** (only when the person asks, in the game's own repo,
  as change.md finds it): one issue per finding, labelled `bug` (create the
  label if it's missing), with the steps and what goes wrong. Check the
  repo's open issues first and skip anything already reported. Never file a
  safety finding as an issue (in a public repo it tells everyone): tell the
  person, and offer to fix it now. `/gamegen --change #12` then fixes them,
  alongside players' reports.
