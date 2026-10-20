# gamegen

*Describe a game. Get a game.*

gamegen is a [Claude Code](https://claude.com/claude-code) plugin that turns one line into a finished, playable game. It plans the game, has a team of review agents poke holes in the design and polish it, makes all the art, animation, music and sound effects, builds it, plays every level to make sure it works, and tells you when it's ready.

```
/gamegen a tiny dragon who hops through caves collecting treasure for his hoard
```

By default you get a web game that plays on desktop and on phones, with nothing to install: open it in a browser, or publish it free on GitHub Pages.

[![Hoard Hopper's title screen](https://raw.githubusercontent.com/zeveck/hoardhopper/main/media/screenshots/title.png)](https://github.com/zeveck/hoardhopper)

gamegen grew out of [Hoard Hopper](https://github.com/zeveck/hoardhopper) (above), a dragon platformer made from a single request with the same four plugins gamegen uses. gamegen packages up how that game was made, so every game gets the same care: a reviewed design, consistent art, real music, and a full play-test before it's called done.

## What it uses

gamegen does the planning, building and testing itself, and uses four companion plugins for the art and sound:

| Plugin | What it makes |
|---|---|
| [nanogen](https://github.com/zeveck/nanogen) | Backgrounds, scenery, tiles, items (Google Gemini) |
| [imagegen2](https://github.com/zeveck/imagegen2) | Characters and sprites with clean transparent edges, icons (OpenAI GPT Image) |
| [anim8gen](https://github.com/zeveck/anim8gen) | Character animations: running, jumping, idling, attacking |
| [audiogen](https://github.com/zeveck/audiogen) | Music and sound effects (ElevenLabs) |

gamegen installs them for you.

## Before you start

- [Claude Code](https://claude.com/claude-code)
- [Node.js](https://nodejs.org/) and Python 3 (the art and sound plugins use them)
- At least one API key (below)

gamegen plays your game in a real browser to test it, using `playwright-cli`, which comes with the [zeveck dev container](https://github.com/zeveck/devcontainers). Without it, gamegen tries Playwright, and if that's not possible either, it tells you the game wasn't play-tested in a browser.

## Install

In Claude Code, add the companion plugins' marketplaces, then install gamegen (which installs the four plugins too):

```
/plugin marketplace add zeveck/imagegen2
/plugin marketplace add zeveck/anim8gen
/plugin marketplace add zeveck/audiogen
/plugin marketplace add zeveck/nanogen
/plugin install gamegen --marketplace zeveck/gamegen
```

Already have the four plugins? Just run the last line.

## Your API keys

The plugins make art and sound with online services, so they need your keys. You get them from each service's website: [OpenAI](https://platform.openai.com/), [Google AI Studio](https://aistudio.google.com/) and [ElevenLabs](https://elevenlabs.io/). Put them in a `.env` file in the folder where you'll make the game (and keep that file out of git):

```
OPENAI_API_KEY=...       # imagegen2 and anim8gen
GEMINI_API_KEY=...       # nanogen
ELEVENLABS_API_KEY=...   # audiogen
```

**One key is enough to start.** With just an OpenAI key, gamegen makes all the art and the animations with it, and makes simple sound effects in code. Add the others for more variety and real music. With no keys at all, gamegen draws everything in code. Either way, it tells you what it did.

## Make a game

```
/gamegen <your idea>
```

Then walk away. A game takes a good while to make: planning and review, art and sound, building, and play-testing every level. gamegen posts a short update after each step, and tells you the estimated cost before it spends anything. Press Esc to stop it at any time. When it's done, it tells you how to play it, what's in it, and what it cost.

Think of the result as a great first version. gamegen tells you plainly about anything that didn't work out, and you can keep improving it with `--continue`.

Some ideas:

```
/gamegen a cozy farming game where you grow glowing mushrooms under the sea
/gamegen a one-button game where a frog jumps between lily pads before they sink --scope small
/gamegen a space shooter where your ship grows bigger with every enemy you eat --platform mobile
/gamegen a puzzle game about guiding light beams with mirrors --style "clean, calm, like Monument Valley"
/gamegen a racing game with paper boats in a rain gutter --style https://example.com/screenshot.png
/gamegen a word puzzle about building sandcastles --budget 0
```

### Options

All optional. You can also just say these things in your description ("for phones", "keep it tiny").

| Option | What it does | Default |
|---|---|---|
| `--platform desktop`, `mobile` or `both` | Where it'll be played. Phones get touch controls. | `both` |
| `--style <description or link>` | The look and feel to aim for: a description, a game's name, or a link to a game, store page or screenshot. Use it more than once to mix influences. | gamegen picks a look that suits your idea |
| `--target <web or an engine>` | What to build it in: `web`, or an engine such as `godot` or `pygame`. Engines are experimental: gamegen makes the project and all its art and sound, but it can only play-test what it can run, and editors like Unity and Unreal usually can't run here. | `web` |
| `--scope small`, `medium` or `large` | How big a game: a polished 5-minute game, a 20-minute game with several levels, or more. | `medium` |
| `--budget <dollars>` | The most to spend on generated art and audio. `0` makes a free game with everything drawn in code. | `20` |
| `--rounds <1 to 4>` | How many rounds of design review. More rounds, more polish, a bit more time. | `2` |
| `--plan-only` | Stop after the design, before spending anything, so you can read it and suggest changes. | off |
| `--continue` | Pick up where it left off: build a `--plan-only` design, or finish an interrupted run. Add notes to change things. | off |
| `--out <folder>` | Where to put the game. | here, or a new folder if this one isn't empty |

Want a say before anything's spent? Run with `--plan-only`, read `design/GAME_DESIGN.md`, then:

```
/gamegen --continue make the levels shorter and add a double jump
```

## What you get

```
your-game/
  game/               the game itself
  design/             the design, review notes, asset list with costs, and every play-test screenshot
  media/screenshots/  the best screenshots, for the README
  README.md           a README for your game, with how to play and how it was made
```

gamegen makes the game right where you run it if the folder is empty, or in a new folder named after the game if it isn't. It never overwrites your files.

Web games save your progress, and come ready to publish on GitHub Pages: push the folder to a GitHub repository and turn on Pages (Settings → Pages → Source: GitHub Actions). Once published, players can install your game as an app on their phone and play it offline.

### Playing it

Browsers won't run a game you open by double-clicking the file, so it needs a tiny local web server. gamegen tells you exactly what to type, but it's usually:

```
cd game
python3 -m http.server 8000
```

then open http://localhost:8000.

Working in a [zeveck dev container](https://github.com/zeveck/devcontainers)? On your computer, run `dc forward 8000` in the project folder, then open `http://localhost:8000`. Add `--network` to try it on your phone over Wi-Fi.

## How it works

1. **Brief.** gamegen reads your idea, looks up any style references, and writes a one-page creative brief.
2. **Design.** It writes a full game design: the core idea, controls for every platform, levels and difficulty, art and audio direction, every asset it'll need, and what to cut if things get tight.
3. **Review.** Three review agents read the design independently: a **player** who wants it to be fun, a **builder** who looks for everything that could go wrong, and an **art and sound director** who makes sure it'll look and sound like one game. A fourth agent fixes the design based on what they found. This repeats for a couple of rounds.
4. **Art, animation and sound.** It makes the main character first, so everything else can match it, then the rest: backgrounds, items, animations, music and sound effects. It looks at every image and redoes the ones that aren't right, and keeps track of the cost.
5. **Build.** It builds the game in stages, playing each one: first the core idea with simple shapes (to make sure it's fun), then the art and sound, the levels, the menus and phone controls, and finally the polish.
6. **Play-test.** It plays the game in a real browser at desktop and phone sizes: every screen and every level, start to finish, checking for errors, sound, saving and offline play.
7. **Final review.** A **playtester** and a **bug hunter** go over the finished game, and gamegen fixes what they find.
8. **Wrap up.** It writes your game's README and tells you how to play.

## Costs

You set the limit with `--budget` (default $20), and gamegen keeps a running total in `design/ASSETS.md`. Most of the money goes to images and music, so a bigger game with more art costs more. The design includes a cost estimate before anything is made: run with `--plan-only` to see it first. The services' own prices apply, so check your accounts with each one.

gamegen also uses your Claude Code usage while it works, which for a whole game is a fair amount.

## Tips

- **Say what makes it fun.** "A platformer" is fine; "a platformer where you can only jump while the music is playing" is better.
- **Name the feel you want.** A game, a film, an era ("like an old Game Boy game"), a mood ("cozy", "frantic").
- **Start small.** `--scope small` games come out polished and quick to make. You can always ask for more with `--continue`.
- **Look at the design first** with `--plan-only` when you have strong opinions.
- **Keep your keys in `.env`** and that file out of git.
- **Style references inspire, they don't copy.** A link or a game's name sets the mood, look and feel; gamegen always makes original characters, art, music and names.

## Development

Run the tests with `node --test`. The plugin lives in `skills/`: the skill itself is `skills/gamegen/SKILL.md`, with the detail for each step in `skills/gamegen/references/`. See [CLAUDE.md](CLAUDE.md) for working on gamegen itself.

## License

MIT. See [LICENSE](LICENSE).
