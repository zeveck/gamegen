# gamegen help

Show the overview for `/gamegen help`. For `/gamegen help <option>`, show just
that option's section below. Show it as written; don't add commentary.

## Overview

**/gamegen** makes a whole game from your idea: it plans it, has it reviewed,
makes the art, animation, music and sound, builds it, plays every level, and
gives you a link to play it.

```
/gamegen <your game idea>
```

For example:

```
/gamegen a frog who hops between lily pads before they sink
/gamegen a cozy farming game under the sea --platform mobile
/gamegen a space shooter where your ship grows with every enemy you eat --scope small
```

You get a web game for desktop and phones unless you ask for something else.
All options are optional, and you can also just say what you want in your
idea ("for phones", "keep it tiny", "in Godot").

| Option | What it does |
|---|---|
| `--platform desktop`, `mobile` or `both` | Where it'll be played (default: both) |
| `--style <description or link>` | The look and feel to aim for |
| `--target <web or an engine>` | What to build it in (default: web) |
| `--scope small`, `medium` or `large` | How big a game (default: medium) |
| `--budget <dollars>` | The most to spend on art and sound (default: 20) |
| `--rounds <1 to 4>` | Rounds of design review (default: 2) |
| `--plan-only` | Stop after the design, before spending anything |
| `--continue` | Build a saved design, or finish an interrupted game |
| `--change <what>` | Change something in a finished game, keeping the rest |
| `--out <folder>` | Where to put the game |

`/gamegen help <option>` explains one, for example `/gamegen help style`.

## --platform

**Where the game will be played:** `desktop`, `mobile` or `both` (the default).

- `desktop`: keyboard controls, sized for a computer screen.
- `mobile`: on-screen touch controls, laid out for thumbs, and a phone-friendly
  orientation.
- `both`: works either way, and shows the touch controls only on touch
  screens.

```
/gamegen a rhythm game where you tap falling stars --platform mobile
```

## --style

**The look and feel to aim for.** A few words, a game's name, an era, or a link
to a game, a store page or a screenshot. Use it more than once to mix
influences.

```
/gamegen a puzzle about guiding light with mirrors --style "calm, clean, pastel"
/gamegen a dungeon crawler --style "like an old Game Boy game" --style https://example.com/mood.png
```

gamegen takes the mood, colors, camera and feel from your references, and
makes everything else original: its own characters, art, music and names.

Without `--style`, gamegen picks a look that suits your idea.

## --target

**What to build the game in.** The default, `web`, makes a game that runs in
any browser on desktop and phones, with nothing to install, and is ready to
publish free on GitHub Pages.

You can name an engine or language instead, such as `godot` or `pygame`.
gamegen makes the project and all its art and sound, and play-tests it if the
engine can run here. Engines like Unity and Unreal usually can't, so those
games come with instructions for opening them on your own computer, and
gamegen tells you what it couldn't test.

```
/gamegen a tiny racing game --target godot
```

## --scope

**How big a game:** `small`, `medium` (the default) or `large`.

- `small`: one great idea, polished: a few levels or an arena, about 5
  minutes of play. Quickest and cheapest.
- `medium`: several levels or areas, each with a twist, about 20 minutes of
  play.
- `large`: more levels, enemies and ideas. Takes longer and costs more.

Small games come out the most polished. You can always grow one later with
`--change`.

## --budget

**The most to spend on generated art, animation, music and sound**, in
dollars. The default is 20.

gamegen estimates the cost before it starts making anything and keeps a
running total in `design/ASSETS.md`. If it's about to run out, it makes the
most important things first and leaves out nice-to-haves.

`--budget 0` makes a free game: no generated art or sound, everything drawn and
synthesized in code.

## --rounds

**How many rounds of design review**, from 1 to 4. The default is 2.

In each round, a player, a builder and an art-and-sound director each read the
design and point out problems, and the design gets fixed. More rounds mean
more polish before anything gets made, and take a bit longer.

## --plan-only

**Stop after the design, before spending anything.** You get the reviewed
design in `design/GAME_DESIGN.md`, including what it'll cost to make. Read it,
then build it with `--continue`, adding any changes you want:

```
/gamegen a haunted lighthouse puzzle game --plan-only
/gamegen --continue make it spookier and add a ghost who helps you
```

## --continue

**Pick up a game where it left off,** in this folder (or `--out`):

- After `--plan-only`: builds the design. Add any changes you'd like.
- After an interruption: finishes the game.

```
/gamegen --continue
/gamegen --continue make it spookier and add a ghost who helps you
```

## --change

**Change a finished game, keeping everything you like.** Describe the change,
big or small:

```
/gamegen --change a bolder font for the title
/gamegen --change a new logo, and call it Lily Leap
/gamegen --change make the frog green instead of blue
/gamegen --change add a double jump
/gamegen --change make the first level easier
/gamegen --change it'll be published at games.example.com/frog
```

gamegen changes what you asked for and follows it through (a new name also
updates the logo, the link preview and the README), makes any new art in the
game's existing style, plays the game again to make sure nothing broke, and
gives you a fresh link.

## --out

**Where to put the game**, as a folder name or path.

Without it, gamegen makes the game right here if this folder is empty, or in
a new folder named after the game if it isn't. It never overwrites your
files.

```
/gamegen a snowball fight game --out snowball
```
