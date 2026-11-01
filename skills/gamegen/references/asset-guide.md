# Making the art, animation and audio

gamegen makes assets through four plugins. Use each through its own skill
(`/imagegen2`, `/nanogen`, `/anim8gen`, `/audiogen`) and follow that skill's
instructions: they know their flags, limits and quirks better than this file.
This guide is about choosing the right tool and keeping the game looking and
sounding like one game.

**Spending is pre-approved up to `--budget`.** Running `/gamegen` with a budget
(default $20) is the person's approval to spend that much. Some plugins ask
before a batch of generations (audiogen asks before 3 or more); don't stop to
ask: say in your own words that the batch fits the approved budget, and go
ahead. Do stop generating when the budget runs out. `--budget 0` means make no
generated assets at all: draw everything in code.

**Working through agents.** To keep your own context free, hand groups of
assets to agents (one for audio, one or two for images), and have them look at
their own results. Each agent's prompt must carry: the style line and the path
to the style anchor; the exact asset list it owns, with sizes and file names;
its share of the budget; the note above that spending is pre-approved (it
can't ask the person anything); the rule to work in the candidates folder
(below); and what to return: for each asset, the final file, the tool, the
number of tries, the estimated cost, and a one-line verdict. You keep
`design/ASSETS.md` yourself from what they return. Agents use the plugins the
same way you do: load the skill (`imagegen2`, `nanogen`, `anim8gen`,
`audiogen`), or read its `SKILL.md` and run its CLI as it describes.

## Which tool for what

| Job | Best tool | Why |
|---|---|---|
| The style anchor: main character, key art | nanogen or imagegen2 | Try the one that suits the style; keep the one that looks best |
| Characters and objects with clean transparent edges (sprites, items, UI, icons) | imagegen2 with `--background transparent` | Native transparency, soft edges like fire, glow and fur. Use it whenever an image needs both transparency and the style anchor as a reference |
| Backgrounds, scenery, parallax layers, title art | nanogen | Fast, cheap, good at painterly scenes; 72 style presets |
| Tiles and textures | nanogen | Cheap iteration; check seams |
| Quick variations and edits of an existing image | nanogen (multi-turn editing) or imagegen2 (`--image` edits) | Keeps the look while changing details |
| Characters that move: walk, run, jump, idle, attack, hurt | anim8gen | Turns one reference character into short, consistent loops. Needs imagegen2, so it needs `OPENAI_API_KEY` |
| Background music | audiogen `music` | One track per area or mood |
| Sound effects | audiogen `sfx` | One per action; `--loop` for ambience |
| Voice lines (rarely needed) | audiogen `voice` | Short barks only |
| 3D models and characters (3D games only) | meshgen | See 3d.md |
| Text: titles, scores, menus, dialogue | code | Draw text in code with a bundled font, never inside generated images |

If only one image tool has a key, use it for everything. Without
`OPENAI_API_KEY` there's no anim8gen: give characters a few separately drawn
poses, or animate them in code (bobbing, squash and stretch, rotation).

## Keep it looking like one game

1. **Make the style anchor first** and get it right: the main character, in
   the game's style, at the size it will appear. Look at it. Regenerate until
   it's clearly the character you want. Save it as
   `game/assets/style-anchor.png`.
2. **Write a style line** into the design and paste it into every image
   prompt: the art style, palette, lighting and line quality, for example
   "16-bit pixel art, warm cave palette of amber, deep purple and teal, crisp
   dark outlines, soft top lighting".
3. **Use the anchor as a reference image** for every later character and
   object (`--image` in imagegen2, the reference input in nanogen), so they
   share its look.
4. **Animate from the anchor.** Give anim8gen the anchor as the reference
   character for every animation of it (see "Animations with anim8gen"
   below).
5. **Pick one size and scale.** For pixel art, generate large and downscale to
   the game's pixel scale with nearest-neighbor resampling, so every sprite has
   the same pixel size. For painted styles, keep sprites at the size they're
   drawn on screen (2x for sharp phone screens).

## Asset rules of thumb

- **Transparency.** Sprites, items, UI pieces and icons need transparent
  backgrounds. Check every edge: no halo, no leftover background color, no
  stray pixels.
- **No text or logos in images.** Generators misspell words, and text can't be
  translated or resized. Draw it in code.
- **Backgrounds.** Make them wider than the screen when the game scrolls, and
  check they tile or extend cleanly. Separate layers (far, middle, near) make
  parallax easy and cheap.
- **Tiles.** Ask for seamless tiles and check them repeated side by side
  before using them.
- **Animations.** Keep them short: 2 to 8 frames (anim8gen's sweet spot), 4
  for most actions. One animation per action. Check the character stays the
  same character in every frame, and that loops loop.
- **Music.** audiogen makes 30-second clips unless told otherwise; ask for 60
  to 120 seconds (`--length-ms 60000` to `120000`) and no vocals
  (`--force-instrumental`). Loop it in the game; music has no seamless-loop
  option, so crossfade at the loop point if the seam is audible.
- **Sound effects.** Short and punchy (0.5 to 2 seconds) for actions, `--loop`
  for ambience. One distinct sound per action. Keep the mp3 files audiogen
  makes; every browser plays them.
- **Icons.** For web games, make a square app icon from the style anchor (with
  a safe margin for the maskable icon), then make the favicon and app icon
  sizes from it in code (see web-target.md).

## Animations with anim8gen

anim8gen is built for a person at the keyboard, so set it up to run on its
own:

- **Always pass `noshow`**, or it starts a preview web server for every
  animation.
- **Give it a complete brief,** so it has nothing to ask: the subject (with the
  style anchor as the reference image), the camera view, the action, the frame
  count (2 to 8; 4 for most actions), the frame labels, the canvas size and the
  frame rate. It asks for clarification when any of these are unclear.
- **Collect the frames.** anim8gen writes accepted frames to
  `assets/anim8gen/<animation-id>/frames/` in the project root (plus a preview
  GIF). Copy the frames into `game/assets/sprites/<name>/`, or pack them into
  one sprite sheet with Pillow, and load them from there.

## Candidates and final files

Make every image and sound in a candidates folder, `.gamegen/candidates/`, and
copy only the accepted take to its final name in `game/assets/`. The plugins
don't overwrite existing files (they add `-v2` and so on), so making retries
straight into `game/assets/` leaves rejected takes behind under the names the
game loads. Delete `.gamegen/` when the game is finished, or keep it out of
git.

## Look at everything

Read every image after making it, and listen for problems you can detect
(file size, duration) in every sound. An asset that doesn't match the design,
the anchor or the rules above gets a better prompt and another try, at most
twice. Then simplify it, swap in a code-drawn version, or cut it (check the
cut list).

## Budget

Keep `design/ASSETS.md` as you go:

| ID | File | Tool | Prompt (short) | Tries | Est. cost |
|---|---|---|---|---|---|

with a running total. These are estimates, so round up:

- **nanogen** lists its prices in its skill (roughly 2 to 24 cents an image,
  depending on model and size).
- **audiogen** lists its prices in its skill (roughly 30 cents a minute of
  music and 12 cents a sound effect).
- **imagegen2** reports token usage for every image, but no prices. Look up
  OpenAI's current image pricing once at the start, note it and the date in
  `ASSETS.md`, and estimate from the reported usage.
- **anim8gen** makes several imagegen2 images per animation and doesn't add
  them to imagegen2's history. Count its tries in the run's `candidates.jsonl`
  (under `.anim8gen/runs/`) and estimate them like imagegen2 images.

Spend in order:

- The style anchor and the must-have assets first; nice-to-haves last.
- At 80% of the budget, say so in `design/STATUS.md` and get thrifty: lower
  quality and smaller sizes where they won't show, and fewer retries.
- At 100%, stop generating. Use the cut list and code-drawn art for anything
  missing, and say so in the report.

## Credits and licenses

- **Fonts:** use a font under the SIL Open Font License (Google Fonts has
  many), bundle the font file in the game, and copy its license file next to
  it.
- **ElevenLabs:** only audio made on ElevenLabs' free plan must credit
  ElevenLabs. Go by the plan the setup check reported (it's in
  `design/STATUS.md`), never by guessing:
  - `free`: add "Music and sound effects created with ElevenLabs." to the
    README's credits.
  - any other plan (`starter`, `creator`, `pro` and so on): no credit line, and
    nothing about it in the report.
  - unknown (a restricted key can't read the account): settle it with the
    first sound or song you make. Free accounts can only get 64 kbps audio
    (`mp3_44100_64`), so if audiogen's default `mp3_44100_128` works, the plan
    is a paid one: record that in `design/STATUS.md`, and no credit line. If
    audiogen reports the free-tier `output_format` restriction instead, it's
    the free plan: use `--output-format mp3_44100_64` from then on, and add
    the credit. If no audio gets made at all, there's nothing to credit.

## Where files go

```
game/assets/
  style-anchor.png
  sprites/      characters and animation frames or sheets
  items/        pickups, props, projectiles
  bg/           backgrounds and parallax layers
  tiles/        tiles and textures
  ui/           buttons, panels, icons
  audio/music/  music tracks
  audio/sfx/    sound effects
```

Name files for what they are (`dragon-run.png`, `cave-ember-bg.png`,
`coin-pickup.mp3`), lowercase with dashes. Keep the generators' own working
files (anim8gen's `.anim8gen/runs/`, history files) out of the game folder
the player downloads, and out of git if they're large.
