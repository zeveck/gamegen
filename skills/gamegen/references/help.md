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
| `--scope small`, `medium` or `large` | How big a game (default: sized from your idea) |
| `--budget <dollars>` | The most to spend on art and sound (default: 20) |
| `--rounds <1 to 4>` | Rounds of design review (default: 2) |
| `--share-design [doc\|page\|both]` | Share the design so others can read it and comment |
| `--plan-only` | Stop after the design, before spending anything |
| `--continue` | Build a saved design, or finish an interrupted game |
| `--change <what>` | Change something in a finished game, keeping the rest |
| `--publish [address]` | Put a finished game online, free, with GitHub Pages |
| `--gallery <repo>` or `none` | With `--publish`: add the game to a gallery of your games |
| `--making-of` | Show in the README how the game was made |
| `--3d` | Make a 3D game |
| `--no-confirm` | Don't stop to ask for approvals (publishing, a finish or remake plan) |
| `--finish <folder or repo>` | Finish a game you started (in a copy; your original stays as it is) |
| `--remake <folder or repo>` | Make a game you started again, keeping your art and ideas |
| `--in-place` | With `--finish`: work in your original project, on a new branch |
| `--leeway little\|some\|lots` | With `--finish` or `--remake`: how freely to change it |
| `--package [steam\|windows\|linux]` | Make Windows and Linux apps of a game, ready for Steam |
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

**How big a game:** `small`, `medium` or `large`. Without it, gamegen sizes
the game from your idea, and says which size it picked and why, so you can
change it.

- `small`: one strong idea, done really well; a few minutes of play.
  Quickest and cheapest.
- `medium`: several levels or areas, each with something new; about twenty
  to thirty minutes.
- `large`: a full game with a world or story to work through; an hour or
  more. Takes longer and costs more.

You can always grow a game later with `--change`.

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

## --share-design

**Share the design so other people can read it and comment**, before
anything is made. Once the design has been reviewed, gamegen puts it on
claude.ai and gives you the link:

- `--share-design doc`: a Claude Doc, a document people can comment on
  part by part (the default).
- `--share-design page`: a web page, laid out to read.
- `--share-design both`: one of each, so you can see which you prefer.

```
/gamegen a rabbit adventure across storybook worlds --plan-only --share-design both
```

The link is private to you until you share it from claude.ai. When you
continue (`/gamegen --continue`), gamegen reads the comments first, uses
what fits (it tells you which it took and which it didn't), and keeps the
shared design up to date. Your own words always win over a reviewer's.

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
(gamegen checks, and tells you exactly what to add if it's missing). Or let
gamegen add it: with `GAMEGEN_DNS=godaddy` and a GoDaddy personal access
token in `.env` (`GODADDY_API_TOKEN`, from developer.godaddy.com, with the
`domains.domain:read` and `domains.dns:update` permissions), it adds the one
record each game needs and never touches any other. Before
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
Each game's title screen also gets a small link to the gallery in its
lower-left corner. Either way, every publish ends with the game's link, title, description and
picture, for adding it to any other site yourself.

## --making-of

**Show how the game was made**, in its README: every request you typed,
exactly as you typed it, and what gamegen and each art and sound plugin did,
with pictures. Publishing then includes the design notes too.

```
/gamegen a frog who hops between lily pads --making-of
```

When the game is published, its title screen also gets a small GitHub link
in the lower-right corner, to the repo where all this is.

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

## --no-confirm

**Don't stop to ask for approvals** you'd give anyway. Normally gamegen
asks "Go ahead?" before publishing, and shows its plan before finishing or
remaking a game you started. With `--no-confirm`, it still tells you what
it's doing, then just carries on:

```
/gamegen --change make the bettas glow at night --publish --no-confirm
/gamegen --finish ../snakez --no-confirm
```

It's for that one run. If something's unclear (say, whether you meant a 3D
game), it makes the cautious choice and tells you. It still stops if
something looks wrong: anything like a key about to be published, a private
repo that would need to be made public, a repo that isn't this game's, or
anything that would overwrite your files. With `--change … --publish`, the
change goes live without you trying it first, so it's best for small
changes.

## --finish

**Finish a game you started**, by hand or with other tools, that stalled
along the way. gamegen plays it, looks through its code, art and notes, and
makes it whole: the missing levels, art, sound, menus, phone controls and
polish, matching what you made.

```
/gamegen --finish ../snakez
/gamegen --finish github.com/you/old-game --leeway little
```

It works on **a copy**: a new folder next to yours, with all its history,
that becomes its own repo. Your original stays exactly as it is. Before it
changes or makes anything, gamegen shows you its plan (what it'll keep,
change and add) and asks. Say what matters in your own words too: "keep my
art exactly", "the giant frog swarm is on purpose".

## --remake

**Make a game you started again**, as a new game, keeping your art, levels
and ideas, when the old version is easier to rebuild than to finish:

```
/gamegen --remake ../bettarpg --leeway lots it should be an RPG with a town you swim around, not a text adventure
```

It goes in a new folder and a new repo; your original stays exactly as it
is. As with `--finish`, gamegen shows its plan and asks before starting.

## --in-place

**With `--finish`: work in your original project** instead of a copy, on a
new branch called `gamegen-finish`, so your main version is untouched until
you merge it. It needs the project to be in git, with nothing unsaved.

```
/gamegen --finish ../snakez --in-place
```

## --leeway

**With `--finish` or `--remake`: how freely gamegen may change your game.**

- `little`: keep what's there and make it whole (the same mechanics, art and
  feel), and match your style for anything new.
- `some`: keep the core idea and the best parts, and rework the rest.
- `lots`: treat it as a sketch, and build what it was reaching for.

Without it, gamegen picks one from what it finds and tells you which.

## --package

**Make desktop apps of a finished game**, that run without a browser:

- `--package windows`: a Windows app (a folder with an .exe, and a zip).
- `--package linux`: a Linux app (it runs on Steam Deck too).
- `--package steam`: both, plus what Steam needs (the default).

```
/gamegen --package windows
```

The game is the same as on the web, with a Quit button and full screen
added, and controller support for Steam. For Steam, gamegen also makes the
store images (capsules, library art, screenshots), the store text, and the
files for uploading builds, and lists what's left for you in Steamworks: the
account and its $100 fee per game, the store page, and Valve's review. The
Steam guide at https://gamegen.synapticnoise.com/steam-guide/ walks through
it. Mac apps aren't made yet: they need a Mac and a paid Apple account to
sign them.

After a change, run it again for a new build: `/gamegen --change … --package`.

## --out

**Where to put the game**, as a folder name or path.

Without it, gamegen makes the game right here if this folder is empty, or in
a new folder named after the game if it isn't. It never overwrites your
files.

```
/gamegen a snowball fight game --out snowball
```
