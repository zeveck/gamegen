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
| `--publish [address]` | Put a finished game online, free, with GitHub Pages |
| `--gallery <repo>` or `none` | With `--publish`: add the game to a gallery of your games |
| `--making-of` | Show in the README how the game was made |
| `--3d` | Make a 3D game |
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
```

gamegen changes what you asked for and follows it through (a new name also
updates the logo, the link preview and the README), makes any new art in the
game's existing style, plays the game again to make sure nothing broke, and
gives you a fresh link.

## --publish

**Put a finished game online**, free, with GitHub Pages. You need a GitHub
account, signed in here (`gh auth login`, or `auth` in the dev container).

```
/gamegen --publish
```

That makes a public repository for the game and publishes it at
`https://<you>.github.io/<game>/`. To use a web address of your own, give
the domain (the game gets `<game>.example.com`) or the full address:

```
/gamegen --publish example.com
/gamegen --publish frog.example.com
```

For your own address, add a DNS record pointing it at `<you>.github.io`
(gamegen checks, and tells you exactly what to add if it's missing). Before
changing anything, gamegen shows you where it'll go and asks; "no" changes
nothing.

Publishing again after a `--change` updates the live game. To use the same
domain every time, put `GAMEGEN_DOMAIN=example.com` in your `.env`.

Before it goes online, gamegen also tells you whose name the game credits
for the idea: `GAMEGEN_CREDIT` from your `.env` if you've set one, otherwise
your GitHub or git name. If it can't find a name, it leaves the credit out
rather than guess. Give it another name when it asks, if you like.

## --gallery

**Show your published games together** on one page, a gallery kept in a
GitHub repository of yours:

```
/gamegen --publish --gallery you/my-games
```

The first time, if `you/my-games` doesn't exist yet, gamegen offers to start
it: a page with each game's picture, name, a line about it and a Play
button, at `https://<you>.github.io/my-games/`. Each game you publish after
that is added at the top, or just before the game it's a sequel to, so a series reads newest first (say where instead when it asks, if you like). Change the page however you like; gamegen adds new
games the way the page already shows the others. A games page you already
have works too, if it's a GitHub repository you can push to.

To use it every time, put `GAMEGEN_GALLERY=you/my-games` in your `.env`;
`--gallery none` skips it for one game. Without either, there's no gallery.
Either way, every publish ends with the game's link, title, description and
picture, for adding it to any other site yourself.

## --making-of

**Show how the game was made**, in its README: every request you typed,
exactly as you typed it, and what gamegen and each art and sound plugin did,
with pictures. Publishing then includes the design notes too.

```
/gamegen a frog who hops between lily pads --making-of
```

Without it, the README is all about the game. To always have it, put
`GAMEGEN_MAKING_OF=on` in your `.env`.

## --3d

**Make a 3D game**, with 3D characters and models made by meshgen (Meshy),
instead of a 2D one:

```
/gamegen a knight exploring a ruined castle --3d
```

Saying "3D" in your idea works too ("a 3D platformer about a bouncing
snail"). Without either, every game is 2D, even in Godot. If your idea
sounds like 3D without saying so (first-person, Unreal, low-poly), gamegen
asks you first, before it starts. 3D games need a
Meshy key in your `.env` (`MESHY_API_KEY`, from meshy.ai under Settings >
API, on a paid plan); gamegen checks it before starting, like the others.
Characters are made from a picture first, then turned into 3D and animated
(walking, running, jumping, attacking). 3D models cost more than pictures,
so a 3D game fits fewer of them in the same budget.

## --out

**Where to put the game**, as a folder name or path.

Without it, gamegen makes the game right here if this folder is empty, or in
a new folder named after the game if it isn't. It never overwrites your
files.

```
/gamegen a snowball fight game --out snowball
```
