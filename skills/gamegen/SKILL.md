---
name: gamegen
description: >-
  Make a complete, playable game from a description. Plans the game, has review
  agents vet and polish the design, generates the art, animation, music and
  sound effects with imagegen2, nanogen, anim8gen and audiogen, builds it (a
  web game for desktop and phones unless asked otherwise), play-tests every
  part of it, and reports when it's ready to play.
argument-hint: "<your game idea> [--scope small|medium|large] [--3d] | --change <what> | --continue | --publish | help"
allowed-tools: "Bash(bash ${CLAUDE_SKILL_DIR}/scripts/check-setup.sh), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/check-setup.sh --3d), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/prepare-env.sh), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/prepare-env.sh --3d), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/publish.sh *), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/package.sh *), Bash(bash ${CLAUDE_SKILL_DIR}/scripts/first-load.sh *), Bash(python3 -m http.server *), Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/serve.py *), Bash(playwright-cli *)"
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
request is genuinely unusable (or, right at the start, it may mean 3D: see
"3D only when asked"); make sensible choices, write them down in the
design, and keep going. When you do need to ask, ask in plain words as the
last line of your reply and end your turn to wait for the answer; never use a
question tool or a multiple-choice prompt.

**`--no-confirm`** means: don't stop for approvals the person would give
anyway (publishing's "Go ahead?", the plan for `--finish` and `--remake`):
say what you're doing and carry on. A "did you mean…?" question isn't an
approval: with `--no-confirm`, take the cautious choice (2D, when it might
be 3D) and say so in the first update. Safety stops always stop, flag or
not: anything that looks like a key or private path about to go online,
making a private repo public, using a repo or folder that isn't this
game's, overwriting the person's files, and a merge that isn't a plain
fast-forward.

Three rules beat everything else:

1. **Racing to say "done" but producing slop is a fail.** It's fine to take
   longer to get it right. Be careful. Make every asset that clearly improves
   the game. The budget is a limit to stay within, not a target to stay well
   under.
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
one when you reach its phase, not all up front. Their commands start paths
with the `CLAUDE_SKILL_DIR` placeholder, which only this file fills in: it
means this skill's folder, `${CLAUDE_SKILL_DIR}`. Use that real path when you
run them, and give it to any agent you hand a reference file to.

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
| `--gamepad` | play with a controller: a PS5 controller (USB or Bluetooth) or the like (`references/gamepad.md`) | off |
| `--feedback` | `on`, `hidden` or `off`: a "Report a bug" button that files GitHub issues (`references/feedback.md`) | off (`on` alone) |
| `--style` | a description, or a URL (a game, store page, screenshot, video); repeatable | a look that suits the idea |
| `--target` | `web`, or an engine or language (`godot`, `unity`, `unreal`, `pygame`, `love2d`…) | `web` |
| `--scope` | `small`, `medium`, `large` | sized from the request |
| `--budget` | dollars for generated art and audio (`20`, `$20`); `0`: all art drawn in code | `20` |
| `--rounds` | design review rounds, 1 to 4 | `2` |
| `--plan-only` | stop after the reviewed design, before spending (except `--share-design`'s mock pictures) | off |
| `--share-design` | `page`, `doc` or `both`: share the reviewed design for comments (`references/share-design.md`) | off (`page` alone) |
| `--mockups` | with `--share-design`: dollars for mock pictures, out of `--budget`; `0` for none | `5` |
| `--continue` | pick up an unfinished game (`references/change.md`) | off |
| `--change` | change a finished game: the words after it say what, or GitHub issues (`#12`) (`references/change.md`) | off |
| `--3d` | a 3D game, with models from meshgen | off: 2D |
| `--publish` | put a finished web game online: optionally the address (`example.com`, a full host, or `github.io`) (`references/publish.md`) | off |
| `--gallery` | with `--publish`: the GitHub repo of a gallery of their games, or `none` | none |
| `--making-of` | the README also tells how the game was made; publishing includes `design/` | off |
| `--package` | `steam`, `windows` or `linux`: desktop apps of a finished web game (`references/package.md`) | off (`steam` alone) |
| `--finish` | a folder or repo of a game they started: finish it, in a copy (`references/finish-or-remake.md`) | off |
| `--remake` | a folder or repo of a game they started: make it again, keeping their assets and ideas | off |
| `--in-place` | with `--finish`: work in the original, on a new branch | off: a copy |
| `--leeway` | with `--finish`/`--remake`: `little`, `some` or `lots` freedom to change it | chosen from the original |
| `--no-confirm` | don't stop for approvals (see below); safety stops still stop | off: ask first |
| `--out` | folder for the game | see below |

`--publish`, `--gallery` and `--making-of` can also be set as defaults in the
nearest `.env` (`GAMEGEN_DOMAIN`, `GAMEGEN_GALLERY`, `GAMEGEN_MAKING_OF=on`);
read them with `bash "${CLAUDE_SKILL_DIR}/scripts/publish.sh" settings`, never
by opening `.env` (it holds the keys). Flags win over these.

The description can also carry these wishes in plain words ("for phones", "in
the style of an old Game Boy game", "for Godot", "keep it tiny"). Honor them
when no flag says otherwise. If a flag and the description disagree, the flag
wins; note it in the design.

**3D only when asked.** A game is 3D only with `--3d`, or when the request
asks for 3D in so many words ("a 3D platformer", "in 3D"). A request that
says 2D, or gives no sign either way, is 2D: that includes `--target godot`,
top-down, isometric, 2.5D and pixel art.

If the request looks like it means 3D without saying so (with `--no-confirm`,
make it 2D and say so instead), ask straight away,
before the setup check or anything else: building the wrong kind of game
wastes the whole run. Only these count as signs: `--target unreal` or
`unity` with neither 2D nor 3D said; a first-person or third-person view, or
a camera you steer around the world; "low-poly", "voxel" or "polygons"; a
3D game as the style reference. Ask one short question and wait, for
example: "Did you mean a 3D game? "First-person" sounds like it, but you
didn't say. 3D games need a Meshy key and cost more for models. Say 3D or
2D." Add their answer to the requests in `design/STATUS.md`, exactly as typed.

For a 3D game, write `3D: yes` in the settings in `design/STATUS.md` (so
`--continue` and `--change` know, and never ask again), and read
`references/3d.md` now: it says what changes in each phase. Never read it
for a 2D game. Turning a finished 2D game into 3D is a new game: suggest one.

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

**Finding an existing game** (for `--continue`, `--change` and `--publish`): use `--out`
if given. Otherwise the current folder, if it holds a game (a
`design/STATUS.md`). Otherwise the game folders directly below it: if there's
one, use it; if there are several, use the one changed most recently and say
which in your first update (they can pick another with `--out`).

**Continuing and changing.** `--continue` picks up an unfinished game;
`--change <what>` changes a finished one, keeping everything not mentioned
(`--continue` with notes on a finished game counts as a change). Follow
`references/change.md`.

**Publishing.** `--publish` on its own (or with `--gallery`, `--out`) publishes
the finished game: follow `references/publish.md`, and do nothing else. With a
game description, or "and publish it" in one, make the game first, then
publish it at the end of Phase 9. With `--change`, make the change, then
publish. A game that isn't finished can't be published yet: suggest
`--continue`.

**Finishing or remaking a game the person started.** `--finish` or
`--remake` (with `--in-place`, `--leeway`) takes a project they began some
other way and makes it whole without losing what they put in: follow
`references/finish-or-remake.md`. It decides where their work ends up, so
it's never guessed from wording, and their original is never changed
(except on a new branch, with `--in-place`).

**Controllers and bug reports.** With `--gamepad` (or a request for
controller play in words), read `references/gamepad.md` when you write the
design: it covers the design, the build and the play-test. With
`--feedback`, read `references/feedback.md` when you build. Either one alone
on a finished game is a change: add it (or, for `--feedback hidden` or
`off`, switch it) as change.md says.

**Packaging.** `--package` on its own (with `steam`, `windows` or `linux`)
turns the finished game into desktop apps: follow `references/package.md`,
and do nothing else. With a game description or `--change`, make the game
or the change first, then package (after publishing, if `--publish` is
there too).

### 3. Check everything works, before spending anything

Run the setup check from the folder `/gamegen` was run in (with `--3d` for a
3D game, which also checks the Meshy key):

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/check-setup.sh"
```

**Every key the game needs must pass before anything else happens.** If one is
missing or refused, stop right there, before any design work or spending, and
tell the person in plain words: which service, what the check said, and how
to fix it (`references/setup.md` covers making a `.env` for their keys, and
when a key isn't needed). Don't quietly fall back to something worse.

Write the ElevenLabs plan it reports (`tier`) in `design/STATUS.md`: only
the free plan's audio needs a credit (see asset-guide.md), so later steps go
by this, never a guess. It also prints an `update:` line for gamegen or any
plugin that's out of date, with the command that updates it. These never
stop a run: mention them in your first update in plain words, with the
command, and suggest turning on auto-update (`/plugin` → Marketplaces →
gamegen → Enable auto-update). Then carry on.

The art and sound plugins (`imagegen2`, `nanogen`, `anim8gen`, `audiogen`,
and `meshgen` for 3D) install with gamegen; run them from the folder with the
`.env`, with output paths into the game folder. If one fails partway for a
reason a retry won't fix (a key stops working, credits run out), stop
generating and tell the person how to fix it; they pick up with `--continue`.
Don't swap in code-drawn art unless they agree.

### 4. Start the progress file

Create `design/STATUS.md` in the game folder. Its first line is the game's
name as a heading, `# Hoard Hopper`: a working name until the design settles
it, then the real one, and the new one whenever a change renames the game.
gamegen shows it above the prompt, so the person knows which game they're on.
Then add a "Requests" list starting
with the request exactly as typed (later `--change` and `--continue` notes are
added to it, also exactly as typed), the settings you settled on, the credit
(what `bash "${CLAUDE_SKILL_DIR}/scripts/publish.sh" credit` said, or "none"), what's available, and a checklist of the phases
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
(which tool makes each asset), the tech plan, a cut list, an effort and cost
estimate (a forecast, not a promise),
and the definition of done.

Size it to `--scope`, or without it, to what the request describes, as you
do for the platform and style: a quick idea in a sentence is small; a long
request with chapters, a cast and a story is large. Say which size and why
in your first update, so they can correct it.

- **small:** one strong idea, done really well; a few minutes of play.
- **medium:** several levels or areas, each with something new; about twenty
  to thirty minutes.
- **large:** a full game with a world or story to work through; an hour or
  more. Say in that first update that it takes longer and costs more.

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

**With `--share-design`**, share the design now, with a few mock pictures
(`--mockups`, $5 unless set): follow `references/share-design.md`. If the design was shared before (its link is
in `design/STATUS.md`), keep that copy up to date instead.

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
3. **Re-plan with real prices.** Once the style anchor and the first assets
   show what things actually cost, look at the asset list again and add what
   would make the game look and feel more finished.
4. **Look at every image you make** (Read it). Check it matches the design and
   the style anchor, has a clean transparent background where it needs one,
   has no stray text or watermark, and is the right size. Regenerate a bad one
   up to twice with a better prompt. If that doesn't fix it, change
   approach: a simpler version, another tool, or drawn in code. Drop it only
   if nothing works, and say so.
5. **Track spending** in `design/ASSETS.md`: every asset, its file, the tool,
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
   screens, mute, saving progress, touch controls, phone layout, (for web)
   installing as an app, and the controller and "Report a bug" button when
   the settings ask for them.
5. **Polish.** Screen shake, particles, little bounces, transitions and
   feedback sounds that make it feel alive (the design's "juice" list).

When a game has a lot of content (chapters, worlds, level sets), settle it
first in a shared bible (story, characters and voice, or rules and themes),
then give each part to its own helper, who builds it and plays it through.

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
can be completed, and once, after the last fixes, play the whole game from New
Game to the win screen in one run. Open everything every button opens, not just the main
screens. Take screenshots of each screen and level into `design/screenshots/`,
run the text scanner at each one, film the first load, check screen changes
frame by frame, and look at them all.

Checking that it works isn't enough: it has to look finished too. Junk text
on screen is a bug like any other.

When something's broken, fix it and play again. If something truly can't be
made to work, say so plainly in the report.

## Phase 7 — Final review

Dispatch two agents in parallel, with instructions from
`references/review-roles.md`:

- **Playtester:** plays the finished game at every targeted size and reviews
  the screenshots for fun, clarity, difficulty and sound. Give it the skill
  folder.
- **Bug hunter:** reads the code and pokes at the game for crashes, stuck
  states, phone problems, audio problems and lost saves.

Fix what they find, then re-run the play-test for anything you changed. If
they found any must-fix problem, run a second round once it's fixed.

From here to the end (and in the play-test before it), make new art or sound
whenever it clearly improves the game: a missing portrait, a scene the
story needs, an effect a moment lacks. The design's estimate is a forecast,
not a limit: going past it is never a reason to hold back. Only `--budget`
is (see asset-guide.md).

## Phase 8 — Polish pass

Dispatch one **Polish reviewer** (its role is in `references/review-roles.md`):
a fresh agent that didn't build the game. Serve the game as the play-test
does, and give it the address, the targeted sizes, the play-test guide and
the skill folder,
but not your screenshots or anyone's opinions of them. It goes through every
screen at every size against the polish checklist in its role. (For other
targets, it checks what can be run here, and the screenshots.)

Fix everything it finds, then scan and screenshot those screens again at
every size, and replay every level's solution if anything in play changed.
A fix can break something else, so re-check the whole screen, not just the
fixed spot.

## Phase 9 — Wrap up

1. **Make the preview pictures and check the page's details** (web games):
   the social card (1200x630) and the GitHub preview image (1280x640), from
   the game's own art, screenshotted with `playwright-cli`; then check the
   title, description and preview tags. See "Sharing and search" in
   `references/web-target.md`.
2. **Write the game's README** from `references/readme-template.md`: what the
   game is, how to play on desktop and phone, screenshots, and how to run it.
   With `--making-of`, also how it was made: every request in
   `design/STATUS.md`, exactly as typed, and what gamegen and each plugin did.
   Here and in the game's own credits, credit the person by the name
   `publish.sh credit` gave (in `design/STATUS.md`), or leave the line out if
   it gave none.
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
   - Who it credits and where the name came from ("The credits say it's your
     idea, Rich Conlan, from your GitHub name."), or that it credits no one
     because no name was known, and that they can tell you what it should say.
   - Anything that didn't make it in, or doesn't work, said plainly.
   - How to share it (web games): `/gamegen --publish` puts it online, free,
     with GitHub Pages.
   - Two or three ideas for what to add next, as ready-to-paste commands
     (`/gamegen --change add a boss at the end of the last cave`).

Keep the report short and enthusiastic but honest. The game is the star.
