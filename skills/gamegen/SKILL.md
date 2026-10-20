---
name: gamegen
description: >-
  Make a complete, playable game from a description. Plans the game, has review
  agents vet and polish the design, generates the art, animation, music and
  sound effects with imagegen2, nanogen, anim8gen and audiogen, builds it (a
  web game for desktop and phones unless asked otherwise), play-tests every
  part of it, and reports when it's ready to play.
argument-hint: "<description> [--platform desktop|mobile|both] [--style <description or URL>] [--target <web or an engine>] [--scope small|medium|large] [--budget <dollars>] [--rounds <n>] [--plan-only] [--continue] [--out <folder>]"
---

# /gamegen — make a game from a description

You are making a real, finished game that someone will play and enjoy. The
person typed one line and walked away; they come back to a game they can play
right now, plus a short, friendly report. Work autonomously from start to
finish. Don't stop to ask questions unless the request is genuinely unusable;
make sensible choices, write them down in the design, and keep going.

Three rules beat everything else:

1. **Fun and finished beats big.** A small game with one great mechanic,
   tight controls and real polish is the goal. Cut scope before you cut
   quality. Every design has a cut list; use it.
2. **Never call it done without playing it.** Every screen, every level, on
   every platform you're targeting, must be played (by the play-test tools in
   this skill) before you report success. If something can't be made to work,
   say so plainly in the report.
3. **Original work only.** Style references show the mood, mechanics and
   look to aim for. Never copy another game's characters, names, logos, art,
   music or text.

**Keep the person posted.** After each phase, write one short, plain line
about what just happened ("The design's done: a cave platformer with four
levels and about 30 pieces of art."). A long run with no word feels broken,
and it lets them stop you (Esc) if it's heading the wrong way. Talk about
their game, not about phases, agents or files.

The reference files in `references/` hold the detail for each phase. Read each
one when you reach its phase, not all up front.

## Preflight

### 1. Check you can dispatch agents

The design reviews and final reviews depend on several independent agents
looking at the work at once. Check that your tool list includes `Agent` (or
`Task`). If it doesn't, stop and say:

> Please type `/gamegen ...` directly in the main chat. It brings in its own
> team of helpers to review the design, so it can't be started from inside
> another task.

### 2. Read the request

Arguments can come in any order. Everything that isn't a flag (or a flag's
value) is the game description. Flags and defaults:

| Flag | Values | Default |
|---|---|---|
| `--platform` | `desktop`, `mobile`, `both` | `both` |
| `--style` | a description, or a URL (a game, a store page, a screenshot, a video). Can be given more than once. | none: pick a look that suits the idea |
| `--target` | `web`, or an engine or language such as `godot`, `unity`, `unreal`, `pygame`, `love2d` | `web` |
| `--scope` | `small`, `medium`, `large` | `medium` |
| `--budget` | dollars to spend on generated art and audio, such as `20` or `$20`. `0` means no generated assets: all the art is drawn in code | `20` |
| `--rounds` | design review rounds, 1 to 4 | `2` |
| `--plan-only` | stop after the reviewed design, before spending anything on assets | off |
| `--continue` | pick up an earlier run (after `--plan-only`, or one that was interrupted) | off |
| `--out` | folder for the game | see below |

The description can also carry these wishes in plain words ("for phones", "in
the style of an old Game Boy game", "for Godot", "keep it tiny"). Honor them
when no flag says otherwise. If a flag and the description disagree, the flag
wins; note it in the design.

**Where the game goes.** With `--out`, use that folder. Otherwise, make the
game right here only if this folder is essentially empty: nothing but `.git`,
`.devcontainer`, `.gitignore`, `.env`, `LICENSE`, and at most a placeholder
`README.md` of a few lines (like the one GitHub makes for a new repository).
Anything else, make a new folder named after the game (short and kebab-case,
such as `hoard-hopper`). Never overwrite someone's files: an existing
`README.md` with real content, their code, or an existing game (a folder with
`design/GAME_DESIGN.md`, when `--continue` wasn't given) means a new folder.
Say which folder you chose in your first update.

**Continuing.** With `--continue`, find `design/STATUS.md` (in `--out`, the
current folder, or the one game folder below it), read it and the design, and
resume at the first unfinished phase. A description given with `--continue` is
a note on what to change; apply it to the design before resuming.

### 3. Check the tools

Find out what's available, without printing any secret values:

- **The four plugins.** Confirm the `imagegen2`, `nanogen`, `anim8gen` and
  `audiogen` skills are available to you. They come with gamegen; if one is
  missing, plan around it and mention it in the report.
- **API keys.** Each generator needs a key, read from the environment or from
  a `.env` file: in the folder where `/gamegen` was run, or up from there to
  the top of the project (check for the key's name only, e.g. with
  `grep -c '^OPENAI_API_KEY=' .env`, never printing its value). If the game
  goes in a new folder and the keys are in a `.env` above it, run the
  generators from the folder that has the `.env`, or point them at it as their
  skills describe:
  - `OPENAI_API_KEY`: imagegen2, and anim8gen (which draws with imagegen2)
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`: nanogen
  - `ELEVENLABS_API_KEY`: audiogen
- **anim8gen's helpers** need `python3` with Pillow
  (`python3 -c "import PIL"`).
- **Play-testing** uses `playwright-cli` when it's installed (the zeveck dev
  container has it). Without it, see `references/playtest-guide.md` for the
  fallback.

Adapt instead of failing. No image keys at all (or `--budget 0`): draw the
art in code (clean vector shapes, procedural patterns) and say so up front in
the report. No `ELEVENLABS_API_KEY`: make sound effects and simple music with
the Web Audio API (for web games), or ship without sound for other targets.
Only one image key: use that tool for everything; without `OPENAI_API_KEY`
there's no anim8gen, so characters get a few drawn poses or code animation.
Write these decisions into the design.

### 4. Start the progress file

Create `design/STATUS.md` in the game folder: the request exactly as typed,
the settings you settled on, what's available, and a checklist of the phases
below. Keep it current as you go, because it's what you (or a later
`--continue`) read to pick up after an interruption or a long gap: tick each
phase off with one line on what happened, and within a phase note where you
are (which assets are done, which build milestone, open bugs and what you
tried). Detailed asset status lives in `design/ASSETS.md`.

## Phase 1 — Brief

Turn the request into a short creative brief, `design/BRIEF.md`:

- The game in one sentence, and the feeling it should give.
- Who plays it, where (desktop, phone, both) and for how long a session lasts.
- **Style references.** For each `--style` URL, look at it (WebFetch for pages;
  Read for images). For named games, search to understand their look, camera,
  controls and core mechanic. Write down what to borrow (mood, palette, camera,
  pacing, a mechanic) and what to avoid copying.
- The settings and any decisions you made on the person's behalf.

Keep it to a page. It's the yardstick the reviewers measure the design
against.

## Phase 2 — Design

Write `design/GAME_DESIGN.md` from `references/design-template.md`. It covers
the pitch, the core loop, controls for every targeted platform, the structure
and difficulty curve, screens, art and audio direction, the full asset list
(which tool makes each asset), the tech plan, a cut list, a budget estimate,
and the definition of done.

Size it to `--scope`:

- **small:** one core mechanic, one to three levels or an arena, about 10 to
  20 assets, one song. A great 5-minute game.
- **medium:** three to five levels or areas with a twist each, about 25 to 45
  assets, a song per area. A great 20-minute game.
- **large:** more levels, enemies and mechanics. Warn in the report that it
  takes longer and costs more, and still keep a cut list.

## Phase 3 — Design review

Run up to `--rounds` rounds (default 2) of review and refinement. Each round:

1. **Review, in parallel.** Dispatch these agents at once, each with the brief,
   the current design, the settings and what tools are available. Their
   instructions are in `references/review-roles.md`:
   - **Player:** is it fun, clear and satisfying, on every platform?
   - **Builder:** can it actually be built, tested and finished with these
     tools, in this scope and budget? Where will it break?
   - **Art and sound director** (skip when there are no generators at all):
     will the art and audio feel like one game, and does the asset list cover
     everything the design needs?
2. **Refine.** Dispatch one refiner agent with the design and all the
   findings. It checks each factual claim before acting on it, fixes the
   design or explains why a finding doesn't apply, and returns the improved
   design plus a table of what it did with each finding.
3. **Decide.** You, not the refiner, judge whether it has converged: stop
   early only when no must-fix or should-fix findings remain. Append the
   round's findings and outcomes to `design/REVIEW_LOG.md`.

Then re-read the final design yourself as the person who asked for the game:
does it still feel like what they described?

**With `--plan-only`, stop here.** Report the game in a few friendly lines
(the pitch, how it plays, the look and sound, the estimated cost) and tell
them to run `/gamegen --continue` to build it, optionally with notes on what
to change.

## Phase 4 — Art, animation and audio

Before spending anything, give the person a one-line heads-up: how many
pieces of art, animations and sounds, and the estimated cost against the
budget ("About 30 images, 5 animations and 12 sounds, roughly $9 of your $20.
Starting on the art now.").

Follow `references/asset-guide.md`. In short:

1. **Style anchor first.** Make the main character (or the key piece of art)
   and settle the look before anything else. Every later image uses it as a
   reference, so the game looks like one game.
2. **Make the asset list, most important first,** with the right tool for each
   job, through the plugins' own skills and following their instructions.
   Characters that move get anim8gen animations.
3. **Look at every image you make** (Read it). Check it matches the design and
   the style anchor, has a clean transparent background where it needs one,
   has no stray text or watermark, and is the right size. Regenerate a bad one
   up to twice with a better prompt, then simplify the asset instead.
4. **Track spending** in `design/ASSETS.md`: every asset, its file, the tool,
   and its estimated cost. Warn at 80% of `--budget`. When the budget runs
   out, stop generating, use the cut list, and fill any gaps with code-drawn
   art.

Hand groups of assets to agents to keep your own context free (audio can run
in parallel with the images, since it doesn't depend on them). The guide says
what each agent needs to be told. Make every take in `.gamegen/candidates/`
and copy only the accepted one into `game/assets/`.

## Phase 5 — Build

For `--target web`, follow `references/web-target.md`. For anything else,
follow `references/other-targets.md`.

Build in milestones, and play each one (Phase 6's tools) before moving on:

1. **Playable core.** The main mechanic, with simple shapes standing in for
   art: move, act, win, lose. If this isn't fun yet, fix the feel now, before
   anything else gets built on it.
2. **Art and sound in.** Sprites, animations, backgrounds, music and effects.
3. **All the content.** Every level, enemy and item in the design.
4. **The whole game.** Title screen, how to play, pause, game over and win
   screens, mute, saving progress, touch controls, phone layout, and (for web)
   installing as an app.
5. **Polish.** Screen shake, particles, little bounces, transitions and
   feedback sounds that make it feel alive (the design's "juice" list).

Record a solution for each level as you build it (see
`references/playtest-guide.md`): the proof that it can be finished.

If the game folder is in a git repository, commit after each milestone with a
plain description of what now works. Before the first commit, make sure
`.gitignore` keeps out `.env`, `.gamegen/`, `.anim8gen/`, `assets/anim8gen/`,
`.playwright/` and the generators' history files (`.*-history.jsonl`). Stage
only the game's own files, never someone else's changes. Never push.

## Phase 6 — Play-test

Follow `references/playtest-guide.md`. Serve the game, open it at desktop and
phone sizes (as the platform setting requires), and play it: every screen,
every level, start to finish, with no errors in the console. Prove each level
can be completed. Take screenshots of each screen and level into
`design/screenshots/` and look at them.

When something's broken, fix it and play again. If the same problem survives
three fixes, cut or simplify that feature (it's on the cut list for a reason)
and note it. If the game as a whole still can't be finished, stop and report
honestly what works and what doesn't.

## Phase 7 — Final review

Dispatch two agents in parallel, with instructions from
`references/review-roles.md`:

- **Playtester:** plays the finished game at every targeted size and reviews
  the screenshots for fun, clarity and polish.
- **Bug hunter:** reads the code and pokes at the game for crashes, stuck
  states, phone problems, audio problems and lost saves.

Fix what they find, then re-run the play-test for anything you changed. Run a
second round only if the first found must-fix problems.

## Phase 8 — Wrap up

1. **Write the game's README** from `references/readme-template.md`: what the
   game is, how to play on desktop and phone, screenshots, how to run it, and
   how it was made (the original request and the plugins that made the art and
   sound).
2. **For web games in a git repository,** add the GitHub Pages workflow from
   `references/web-target.md` at the repository's root (unless it already
   publishes a Pages site), so turning on Pages publishes the game.
3. **Tick off `design/STATUS.md`.**
4. **Report to the person,** briefly and in plain language (no talk of
   phases, agents, service workers or other machinery):
   - The game's name, one line about it, and the folder it's in.
   - How to play it right now: the two commands to start a small local web
     server and the address to open, with a word on why (browsers won't run a
     game opened by double-clicking the file). If you're inside a dev
     container, add that on their computer they can run `dc forward <port>`
     in the project folder, then open `http://localhost:<port>` (and
     `dc forward <port> --network` to try it on a phone on the same Wi-Fi).
   - What's in it (levels, characters, music) and the controls.
   - What it cost, against the estimate.
   - Anything that didn't make it in, or doesn't work, said plainly. For
     targets other than web, say clearly what couldn't be play-tested here.
   - How to share it: push the folder to GitHub and turn on Pages (Settings,
     Pages, Source: GitHub Actions).
   - Two or three ideas for what to add next, as ready-to-paste commands
     (`/gamegen --continue add a boss at the end of the last cave`).

Keep the report short and enthusiastic but honest. The game is the star.
