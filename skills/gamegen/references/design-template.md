# Game design template

Write `design/GAME_DESIGN.md` with these sections. Be concrete: a builder
should be able to make the game from this document without guessing, and a
reviewer should be able to say whether it will be fun. Short sentences and
lists beat paragraphs.

```markdown
# <Game name>

*<One-line tagline.>*

## Pitch

Two or three sentences: what you do, why it's fun, what makes it different.

## Settings

- Platform: desktop | mobile | both
- Target: web (plain HTML and JavaScript, no build step) | <engine>
- Scope: small | medium | large (and why, if judged from the request)
- Budget: $<n> for generated art and audio
- Tools available: <which generators, which keys, play-test tools>
- Credit: <the name from `publish.sh credit`, or none; never a stand-in>
- Decisions made on the player's behalf: <list>

## The player's fantasy

What the player gets to be and feel. ("A tiny dragon greedily filling a cave
with gold.")

## Core loop

The 10-second loop (what your hands do), the 1-minute loop (a level or round)
and the session loop (why you come back). Name the one mechanic the game lives
or dies by.

## Controls

A table per targeted platform:

| Action | Keyboard | Touch | (Gamepad, optional) |
|---|---|---|---|

For touch, say where each control sits on screen, how big it is, and that it
never hides the action. Say the phone orientation (landscape, portrait or
either) and why.

## Structure and difficulty

Levels, areas, rounds or waves, in order, each with what's new about it (a
mechanic, an enemy, a twist). Describe the difficulty curve: what makes the
first level easy to learn and the last one a real challenge, and how the game
avoids frustration (checkpoints, generous hitboxes, lives, retries).

## Win, lose and progress

How you win a level and the game, how you lose, what happens then, and what
is saved between sessions.

## Screens

Title, how to play, gameplay HUD, pause, level complete, game over, victory,
settings (at least mute). One line each on what's on it.

## Juice

The list of small touches that make it feel alive: screen shake, particles,
squash and stretch, hit pauses, number pop-ups, transitions, sound on every
action. Mark which are must-haves.

## Art direction

- The style in one line, and what it's like (for the image prompts).
- The style anchor: which asset is made first and sets the look.
- Palette (a few named colors), camera (side view, top down, ...), and the
  game's logical resolution and pixel scale.
- How characters and backgrounds stay consistent across tools.

## Audio direction

The mood of the music (per area if there are areas), and the list of sound
effects by action. Note looping music and short, punchy effects.

## Asset list

| ID | What it is | Tool | Size and format | Transparent | Animation | Priority |
|---|---|---|---|---|---|---|

Tool is one of: nanogen, imagegen2, anim8gen, audiogen, code (drawn in code).
Priority is must, should or nice. Include UI pieces, icons (for web:
favicon and app icons), the title art and the social card.

## Tech plan

For web: the file layout, the game loop, how scaling, input, audio, saving and
installing work (see web-target.md), and the debug hook the play-test uses.
For other targets: the project layout and how it will be tested.

## Cut list

What to drop first if the budget or a technical problem demands it, in order. The
core loop is never on it.

## Budget estimate

Roughly how much of the budget each kind of asset will use, and how many
images and sounds that means.

## Definition of done

A checklist the play-test verifies, for example (always keep the line about
every screen looking finished: it applies to every game):

- [ ] Starts with no errors at every targeted size.
- [ ] Every level can be completed, and the game can be won.
- [ ] Losing and retrying works, and nothing gets stuck.
- [ ] Every control works on every targeted platform.
- [ ] Every screen looks finished at every targeted size, from the first load.
- [ ] Music and sound play (after the first tap or key), and mute works.
- [ ] Progress is saved and restored.
- [ ] (Web) Installs as an app and works offline.
```
