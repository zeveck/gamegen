---
name: gamegen
description: >-
  Make a complete, playable game from a description. Plans the game, has review
  agents vet and polish the design, generates the art, animation, music and
  sound effects with imagegen2, nanogen, anim8gen and audiogen, builds it (a
  web game for desktop and phones unless asked otherwise), play-tests every
  part of it, and reports when it's ready to play.
argument-hint: "<description> [--platform desktop|mobile|both] [--style <description or URL>] [--target <web or an engine>] [--scope small|medium|large] [--budget <dollars>] [--rounds <n>] [--plan-only] [--continue] [--change <what to change>] [--out <folder>]"
allowed-tools: "Bash(bash ${CLAUDE_SKILL_DIR}/scripts/check-setup.sh), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/prepare-env.sh), Bash(python3 -m http.server *), Bash(playwright-cli *)"
---

# /gamegen — make a game from a description

You are making a real, finished game that someone will play and enjoy. The
person described the game they want, maybe in a sentence, maybe in a long
paragraph about its look, its mechanics and its feel, and walked away; they
come back to a game they can play right now, plus a short, friendly report.

Your first job is to understand what they're after. Every specific thing they
asked for (a mechanic, a creature, a mood, a number of levels, a moment like
"the flowers all bloom and you celebrate") belongs in the game, and the gaps
get filled with choices in the same spirit. Ideas they offered loosely ("or
something", "maybe", "perhaps") are invitations: use them or something better
that serves the same purpose, and say which in the design.

Work autonomously from start to finish. Don't stop to ask questions unless the
request is genuinely unusable; make sensible choices, write them down in the
design, and keep going.

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

**Help.** If the arguments are exactly `help` (or `--help`), show the
overview from `references/help.md` and stop. If they're exactly `help` and one
option name and nothing else (with or without the dashes, such as
`help style`), show that option's section and stop. Do nothing else in either
case. Anything longer is a game idea: "help a lost robot find its way home" or
"help scope out a haunted house".

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
| `--change` | change a finished game: the words after it (other than other flags and their values) describe what to change | off |
| `--out` | folder for the game | see below |

The description can also carry these wishes in plain words ("for phones", "in
the style of an old Game Boy game", "for Godot", "keep it tiny"). Honor them
when no flag says otherwise. If a flag and the description disagree, the flag
wins; note it in the design.

**Where the game goes.** With `--out`, use that folder. Otherwise, make the
game right here only if this folder is essentially empty: nothing but `.git`,
`.devcontainer`, `.claude`, `.vscode`, `.playwright`, `.gitignore`, `.env`,
`.DS_Store`, `LICENSE`, `CLAUDE.md`, and at most a placeholder `README.md` of a
few lines (like the one GitHub makes for a new repository).
Anything else, make a new folder named after the game (short and kebab-case,
such as `hoard-hopper`). Never overwrite someone's files: an existing
`README.md` with real content, their code, or an existing game (a folder with
`design/GAME_DESIGN.md`, when `--continue` wasn't given) means a new folder.
Say which folder you chose in your first update.

**Finding an existing game** (for `--continue` and `--change`): use `--out`
if given. Otherwise the current folder, if it holds a game (a
`design/STATUS.md`). Otherwise the game folders directly below it: if there's
one, use it; if there are several, use the one changed most recently and say
which in your first update (they can pick another with `--out`).

**Continuing.** With `--continue`, read the game's `design/STATUS.md` and
design, and resume at the first unfinished phase. A description given with
`--continue` is a note on what to change; apply it to the design before
resuming. On a finished game, treat it as `--change`.

**Changing a finished game.** `--change <what to change>` (or `--continue`
with notes, on a finished game) means: keep everything they didn't mention,
and change what they asked for, whether it's small (the font, the title, one
character's look) or big (a new level, a double jump, a boss, publishing at a
web address). If there's no game, say so and suggest starting one; if the
game isn't finished yet, suggest `--continue`. Then:

1. Update the design with the change, and follow it through: a new title also
   means the title screen, logo, app name and icon labels, social card and
   README; new art matches the style anchor and style line.
2. For anything that changes how the game plays, run one short design review
   round on the change.
3. Make only the assets the change needs. Each change gets its own budget:
   `--budget` if given now, otherwise the default $20.
4. Build it, play-test what changed, and replay every level's solution to make
   sure nothing else broke.
5. Wrap up as usual: update the README and screenshots, start the game, and
   report with a fresh link and what changed.

### 3. Check everything works, before spending anything

Run the setup check from the folder `/gamegen` was run in:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/check-setup.sh"
```

It tests each API key with a free request (never printing it), using the
environment or the nearest `.env` file in that folder or above it, and checks
Python with Pillow and `playwright-cli`:

- `OPENAI_API_KEY`: imagegen2, and anim8gen (which draws with imagegen2)
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: nanogen
- `ELEVENLABS_API_KEY`: audiogen. The check also reports the account's plan
  (`tier`). Write it in `design/STATUS.md`: only the free plan's audio needs a
  credit (see asset-guide.md), so later steps go by this, never a guess.

**Every key the game needs must pass before anything else happens.** If one is
missing or refused, stop right there, before any design work or spending, and
tell the person in plain words: which service, what the check said, and how
to fix it. Don't quietly fall back to something worse.

When keys are missing, first run

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/prepare-env.sh"
```

It creates a `.env` with a line for each key and where to get it (or adds
lines for just the missing keys to an existing `.env`, leaving the rest
alone), and lists `.env` in the `.gitignore` beside it so keys never get
committed. Then tell them, for example: "I've made a `.env` file in this
folder for your keys, with links to where you get each one. Paste them in,
save, and run your `/gamegen` command again." When a key is refused, say it
looks wrong or expired, and where to get a new one (the links are in that
file).

A key isn't needed only when the person has said so:

- `--budget 0`, or a request like "draw the art in code": no image keys.
- "No music", "no sound", "silent": no ElevenLabs key. ("Make the sounds in
  code" means effects synthesized with Web Audio.)
- "Only use OpenAI" (or Gemini) for the art: that one image key.

Without `OPENAI_API_KEY` there's no anim8gen, so characters get a few drawn
poses or code animation. If Pillow is missing, install it
(`python3 -m pip install --user pillow`) and say so. If `playwright-cli` is
missing, play-testing uses the fallback in `references/playtest-guide.md`.

Confirm the four plugins' skills (`imagegen2`, `nanogen`, `anim8gen`,
`audiogen`) are available to you; they install with gamegen. When the game
goes in a new folder below the one with `.env`, run the generators from the
folder that has the `.env`, with output paths pointing into the game folder.

Later, if a generator fails partway through for a reason a retry won't fix
(the key stops working, credits run out), stop generating and tell the person
what happened and how to fix it, then pick up with `--continue` once they
have. Don't swap in code-drawn art unless they agree.

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
- **What they asked for:** a checklist of every specific thing in their
  request (each mechanic, character, mood, moment and number), in their words,
  marking which they offered loosely ("maybe", "or something").
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
does it still feel like what they described? Go through the brief's "what
they asked for" checklist: each item is in the design, or (for a loose idea)
the design says what serves its purpose instead.

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

1. **Make the social card and check the page's details** (web games): the
   1200x630 image link previews show, made from the game's own art and
   screenshotted with `playwright-cli`, plus the title, description and
   preview tags. See "Sharing and search" in `references/web-target.md`.
2. **Write the game's README** from `references/readme-template.md`: what the
   game is, how to play on desktop and phone, screenshots, how to run it, and
   how it was made (the original request and the plugins that made the art and
   sound).
3. **Add the GitHub Pages workflow** (web games) from
   `references/web-target.md`, so publishing is just a push and a switch. If
   the game folder is inside a git repository, put it at that repository's
   root (unless the repository already publishes a Pages site, in which case
   skip it and say so). If it isn't, put it at the game folder's root, which
   becomes the repository's root when they push it.
4. **Start the game for them** (web games). Serve the game folder and leave it
   running, so the report ends with a link they can click:
   - Pick a free port: try 8000, then 8001 and up, checking each with
     `python3 -c "import socket; socket.socket().bind(('127.0.0.1', PORT))"`.
     If an earlier run in this session already serves this game, reuse it.
   - Start `python3 -m http.server <port> --bind 127.0.0.1 --directory <game folder>/game`
     with the Bash tool's `run_in_background` option (not `&` or `nohup`),
     so it keeps running after you finish.
   - Fetch the address once (`curl -s -o /dev/null -w '%{http_code}'`) to make
     sure it loads.
5. **Tick off `design/STATUS.md`.**
6. **Report to the person,** briefly and in plain language (no talk of
   phases, agents, service workers or other machinery):
   - The game's name, one line about it, and the folder it's in.
   - **For web games, the link to play it now,** first and on its own line:
     `http://localhost:<port>`. If you're in a dev container: VS Code forwards
     it to their computer (if the link doesn't open, the Ports tab shows where
     it went); with `dc`, they first run `dc forward <port>` in the project
     folder on their computer (and `dc forward <port> --network` to try it on
     a phone on the same Wi-Fi). It keeps running while Claude Code is open.
   - How to start it again another time: the two commands to serve the game
     folder (`cd <game folder>/game`, then `python3 -m http.server 8000`),
     with a word on why (browsers won't run a game opened by double-clicking
     the file).
   - **For other targets,** instead: how to open and run the project in its
     engine, and clearly what couldn't be play-tested here.
   - What's in it (levels, characters, music) and the controls.
   - What it cost, against the estimate.
   - Anything that didn't make it in, or doesn't work, said plainly.
   - How to share it (web games): push the folder to GitHub and turn on Pages
     (Settings, Pages, Source: GitHub Actions).
   - Two or three ideas for what to add next, as ready-to-paste commands
     (`/gamegen --change add a boss at the end of the last cave`).

Keep the report short and enthusiastic but honest. The game is the star.
