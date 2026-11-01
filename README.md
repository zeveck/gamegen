# gamegen

*Describe your game. Play it.*

You have a game in mind. [gamegen](https://github.com/zeveck/gamegen) is a [Claude Code](https://claude.com/claude-code) plugin that makes it: describe what you play, how it works, and how it should look and feel, and gamegen works out what you're after, plans the game, has a team of review agents poke holes in the design and polish it, makes all the art, animation, music and sound effects, builds it, plays every level to make sure it works, and hands you a link to play it.

```
/gamegen <describe your game>
```

For example, this is the whole request that [Bloom Hop](#bloom-hop) was made from:

> /gamegen Make an overhead puzzle game in which you're a frog hopping from lilipad to lilipad and each one can only handle so many hops before it sinks and the goal is to hop on every lilipad, perhaps each one has a fly on it or something, and there's music and maybe a dozen level that get harder as you go. They can be generated, but, should always be possible to beat. You could also use your tongue to nudge enemies or something. There could also be turtle pads that surface and sink or fish that come up and give you power ups. When you hop to every lilipad flowers around the level all bloom and you celebrate before moving on.

The more of your idea you describe, the more of it ends up in the game: every mechanic, creature and moment above is in Bloom Hop. A short idea works too; gamegen fills in the rest in the same spirit. Have a platform, a look or an engine in mind? There are [options](#options) for that, or just say so in your description.

## Contents

- [Make a game](#make-a-game)
  - [Options](#options)
  - [Change your game](#change-your-game)
  - [Share your game](#share-your-game)
- [What you get](#what-you-get)
  - [Playing it](#playing-it)
- [Install](#install)
  - [Your API keys](#your-api-keys)
- [What it uses](#what-it-uses)
- [How it works](#how-it-works)
- [Costs](#costs)
- [Tips](#tips)
- [Examples](#examples)
  - [Bloom Hop](#bloom-hop)
  - [Porchlight](#porchlight)
  - [Sim Shire](#sim-shire)
  - [Pomegranate Panic 2](#pomegranate-panic-2)
  - [Hoard Hopper](#hoard-hopper)
- [Development](#development)
- [License](#license)

## Make a game

Once it's [installed](#install), describe your game:

```
/gamegen <describe your game>
```

Then walk away. A game takes a good while to make: planning and review, art and sound, building, and play-testing every level. gamegen first checks that your [API keys](#your-api-keys) work, posts a short update after each step, and tells you the estimated cost before it spends anything. Press Esc to stop it at any time.

When it's done, you get a link to play your game, plus what's in it and what it cost.

Think of it as a great first version. gamegen tells you plainly about anything that didn't work out, and you can [change anything you like](#change-your-game) afterwards.

The [examples](#examples) below show full requests and the games they became. You can add options too:

```
/gamegen <describe your game> --platform mobile
/gamegen <describe your game> --style "like an old Game Boy game"
/gamegen <describe your game> --scope small --budget 5
```

### Options

All optional. Unless you say otherwise, gamegen makes a web game that plays in any browser on desktop and phones, with nothing to install. You can also just say these things in your description ("for phones", "keep it tiny", "in Godot"). `/gamegen help` lists them, and `/gamegen help <option>` explains one, such as `/gamegen help style`.

| Option | What it does | Default |
|---|---|---|
| `--platform desktop`, `mobile` or `both` | Where it'll be played. Phones get touch controls. | `both` |
| `--style <description or link>` | The look and feel to aim for: a description, a game's name, or a link to a game, store page or screenshot. Use it more than once to mix influences. | gamegen picks a look that suits your idea |
| `--target <web or an engine>` | What to build it in: `web`, or an engine such as `godot` or `pygame`. Engines are experimental: gamegen makes the project and all its art and sound, but it can only play-test what it can run, and editors like Unity and Unreal usually can't run here. | `web` |
| `--scope small`, `medium` or `large` | How big a game: a polished 5-minute game, a 20-minute game with several levels, or more. | sized from your idea |
| `--budget <dollars>` | The most to spend on generated art and audio. `0` makes a free game with everything drawn in code. | `20` |
| `--rounds <1 to 4>` | How many rounds of design review. More rounds, more polish, a bit more time. | `2` |
| `--plan-only` | Stop after the design, before spending anything, so you can read it and suggest changes. | off |
| `--continue` | Build a `--plan-only` design, or finish a game that was interrupted. | off |
| `--change <what to change>` | Change something in a finished game, keeping everything else. | off |
| `--publish [address]` | Put a finished game online with GitHub Pages, free: at `<you>.github.io/<game>`, or at your own domain (`--publish example.com` gives `<game>.example.com`). See [Share your game](#share-your-game). | off |
| `--gallery <repo>` or `none` | With `--publish`: add the game to a gallery of your games, a page in a GitHub repository of yours. gamegen offers to start it the first time. | none |
| `--making-of` | The README also shows how the game was made: every request you typed, and what gamegen and each plugin did. | off |
| `--3d` | Make a 3D game, with 3D characters and models from meshgen. Saying "3D" in your idea works too; otherwise every game is 2D, and if your idea sounds like 3D without saying so, gamegen asks first. Needs a Meshy key. | off |
| `--out <folder>` | Where to put the game. | here, or a new folder if this one isn't empty |

### Change your game

Like your game but want something different? Say what to change, and gamegen keeps everything else:

```
/gamegen --change a bolder font for the title
/gamegen --change a new logo, and call it Lily Leap
/gamegen --change make the frog green instead of blue
/gamegen --change add a double jump
/gamegen --change make the first level easier
```

It follows each change through (a new name also updates the logo, the link preview and the README), makes any new art in the game's existing style, plays the game again to make sure nothing broke, and gives you a fresh link.

Want a say before anything's made? Run with `--plan-only`, read `design/GAME_DESIGN.md`, then build it with any changes:

```
/gamegen --continue make the levels shorter and add a double jump
```

### Share your game

When you like it, put it online:

```
/gamegen --publish
```

gamegen makes a GitHub repository for it and publishes it at `https://<you>.github.io/<game>/`, free. You need a GitHub account, signed in here (`gh auth login`, or `auth` in the dev container). Before it changes anything, it shows you where the game will go and asks.

Have your own domain? `/gamegen --publish example.com` puts it at `<game>.example.com`, and gamegen tells you the one DNS record to add. When it's done, you get the game's link, title, description and picture, ready to add to your own site. Want all your games on one page? `--gallery you/my-games` adds each one to a gallery, and starts it for you the first time.

Made a change? `/gamegen --publish` again updates the live game.

To use the same settings every time, put them in your `.env`:

```
GAMEGEN_DOMAIN=example.com
GAMEGEN_GALLERY=you/my-games
GAMEGEN_MAKING_OF=on
GAMEGEN_CREDIT=Your Name
```

`GAMEGEN_CREDIT` is the name your games' credits give for the idea. Without it, gamegen uses your GitHub name, or your git name, and if it can't find one it leaves the credit out rather than guess. Either way, it checks the name with you before the game goes online.

## What you get

```
your-game/
  game/               the game itself
  design/             the design, review notes, asset list with costs, and every play-test screenshot
  media/screenshots/  the best screenshots, for the README
  README.md           a README for your game, with screenshots and how to play (and how it was made, with --making-of)
```

gamegen makes the game right where you run it if the folder is empty, or in a new folder named after the game if it isn't. It never overwrites your files.

While you work on a game, its name shows above the prompt (🎮 Hoard Hopper), so you always know which one you're on. Click `[-]` beside it to fold it away.

Web games save your progress, come with a link-preview image for sharing, and are ready to put online with `/gamegen --publish`. Once published, players can install your game as an app on their phone and play it offline.

### Playing it

When gamegen finishes a web game, it starts it and gives you a link like `http://localhost:8000`. Just click it. (For a game made in an engine, it tells you how to open it there instead.)

To play again another time, start it yourself. Browsers won't run a game you open by double-clicking the file, so it needs a tiny local web server:

```
cd your-game/game
python3 -m http.server 8000
```

then open http://localhost:8000.

Working in a [dev container](https://github.com/zeveck/devcontainer-plus)? VS Code forwards the link to your computer (if it doesn't open, the Ports tab shows where it went). With `dc`, first run `dc forward 8000` in the project folder on your computer (add `--network` to try it on your phone over Wi-Fi).

## Install

In Claude Code:

```
/plugin install gg --marketplace zeveck/gamegen
```

That installs gamegen and the five plugins it uses for art, sound and 3D models. Run `/reload-plugins` (or restart Claude Code), and `/gamegen` is ready. (It's listed as gamegen in `/plugin`, and installs as `gg`.)

**Keep it up to date.** Turn on auto-update for the gamegen marketplace, so gamegen and its plugins stay current: `/plugin` → Marketplaces → gamegen → Enable auto-update. Updating gamegen by itself (`claude plugin update gg@gamegen`) doesn't update the plugins it uses. Each time you make or change a game, gamegen checks, and if any of them is behind, it tells you the command that updates it.

**To remove it,** with the plugins it brought along:

```
claude plugin uninstall gg@gamegen --prune
```

Already installed imagegen2, anim8gen, audiogen, nanogen or meshgen on their own? Remove those first, so you don't end up with two copies of each:

```
/plugin uninstall imagegen2@imagegen2
```

(and the same for any of the others you have).

You'll also need [Node.js](https://nodejs.org/) and Python 3, which the art and sound plugins use. gamegen tests your game in a real browser with `playwright-cli`, which comes with the [devcontainer-plus](https://github.com/zeveck/devcontainer-plus) dev container; without it, gamegen tries Playwright, and if that's not possible either, it tells you the game wasn't play-tested in a browser.

### Your API keys

The plugins make art and sound with online services, so they need your keys. You get them from each service's website: [OpenAI](https://platform.openai.com/), [Google AI Studio](https://aistudio.google.com/) and [ElevenLabs](https://elevenlabs.io/). Put them in a `.env` file in the folder where you'll make your games (and keep that file out of git):

```
OPENAI_API_KEY=...       # imagegen2 and anim8gen
GEMINI_API_KEY=...       # nanogen
ELEVENLABS_API_KEY=...   # audiogen
MESHY_API_KEY=...        # meshgen, only for 3D games
```

The Meshy key is only needed for 3D games (`--3d`). Get it at [meshy.ai](https://www.meshy.ai) under Settings > API; Meshy's API needs a paid plan.

Before it starts, gamegen tries each key with a free request. If one is missing or doesn't work, it stops right away, before spending anything, and tells you how to fix it. No `.env` yet? gamegen makes one for you, with links to where you get each key, and keeps it out of git: just paste your keys in and run your command again.

Don't have all three? Say what to do without one in your description: "no music" or "no sound" skips ElevenLabs, "only use OpenAI for the art" skips Gemini, and `--budget 0` needs no keys at all (everything is drawn and made in code).

## What it uses

gamegen does the planning, building and testing itself, and uses companion plugins for the art, sound and 3D models:

| Plugin | What it makes |
|---|---|
| [nanogen](https://github.com/zeveck/nanogen) | Backgrounds, scenery, tiles, items (Google Gemini) |
| [imagegen2](https://github.com/zeveck/imagegen2) | Characters and sprites with clean transparent edges, icons (OpenAI GPT Image) |
| [anim8gen](https://github.com/zeveck/anim8gen) | Character animations: running, jumping, idling, attacking |
| [audiogen](https://github.com/zeveck/audiogen) | Music and sound effects (ElevenLabs) |
| [meshgen](https://github.com/zeveck/meshgen) | 3D models and animated 3D characters, for 3D games (Meshy) |

## How it works

1. **Check.** gamegen makes sure your keys and tools work.
2. **Brief.** It reads your description, looks up any style references, and writes a one-page creative brief.
3. **Design.** It writes a full game design: the core idea, controls for every platform, levels and difficulty, art and audio direction, every asset it'll need, and what to cut if things get tight.
4. **Review.** Three review agents read the design independently: a **player** who wants it to be fun, a **builder** who looks for everything that could go wrong, and an **art and sound director** who makes sure it'll look and sound like one game. A fourth agent fixes the design based on what they found. This repeats for a couple of rounds.
5. **Art, animation and sound.** It makes the main character first, so everything else can match it, then the rest: backgrounds, items, animations, music and sound effects. It looks at every image and redoes the ones that aren't right, and keeps track of the cost.
6. **Build.** It builds the game in stages, playing each one: first the core idea with simple shapes (to make sure it's fun), then the art and sound, the levels, the menus and phone controls, and finally the polish.
7. **Play-test.** It plays the game in a real browser at desktop and phone sizes: every screen and every level, start to finish, checking for errors, sound, saving and offline play. It opens everything every button opens, reads the words on every screen, and films the game loading to catch anything that flickers.
8. **Final review.** A **playtester** and a **bug hunter** go over the finished game, and gamegen fixes what they find.
9. **Polish pass.** A fresh reviewer who didn't build the game goes over every screen at every size with a checklist of what players notice first: stray code showing as text, a word left alone on a line, text that's cut off, messages covering the action, a title that flickers as it loads. gamegen fixes all of it.
10. **Wrap up.** It makes the link-preview image, writes your game's README, starts the game and gives you the link.

## Costs

You set the limit with `--budget` (default $20), and gamegen keeps a running total in `design/ASSETS.md`. Most of the money goes to images and music, so a bigger game with more art costs more. gamegen tells you its estimate before it makes anything; run with `--plan-only` to see it before deciding. The services' own prices apply, so check your accounts with each one.

gamegen also uses your Claude Code usage while it works, which for a whole game is a fair amount.

## Tips

- **Describe as much as you like.** A sentence works; a paragraph about the look, the mechanics and the feel works better. Bloom Hop's request below was a paragraph, and the game has every idea in it.
- **Say what makes it fun.** "A platformer" is fine; "a platformer where you can only jump while the music is playing" is better.
- **Name the feel you want.** A game, a film, an era ("like an old Game Boy game"), a mood ("cozy", "frantic").
- **Say how big, if you like.** gamegen sizes the game from your description and tells you what it picked; `--scope small` or `large` sets it. You can always add more with `--change`.
- **Look at the design first** with `--plan-only` when you have strong opinions.
- **Keep your keys in `.env`** and that file out of git.
- **Style references inspire, they don't copy.** A link or a game's name sets the mood, look and feel; gamegen always makes original characters, art, music and names.

## Examples

Every game below was made by gamegen from the request shown with it, then play-tested. Click a picture to play.

### Bloom Hop

[![A cleared pond in full bloom](https://raw.githubusercontent.com/zeveck/bloom-hop/main/media/screenshots/bloom.png)](https://bloomhop.synapticnoise.com)

A cozy frog puzzle on a lily pond: hop every pad before it sinks, eat every fly, flick beetles away with your tongue, ride turtles before they dive, and catch gifts from friendly koi. Twelve ponds that are always beatable (each one is built by walking a frog through it, then checked again by a solver), 150 more in Wild Pond, a song for each time of day, and a pond that bursts into bloom every time you clear it.

**[▶ Play Bloom Hop](https://bloomhop.synapticnoise.com)** · [How it was made](https://github.com/zeveck/bloom-hop#how-it-was-made)

<details>
<summary>The request</summary>

> /gg:gamegen Make an overhead puzzle game in which you're a frog hopping from lilipad to lilipad and each one can only handle so many hops before it sinks and the goal is to hop on every lilipad, perhaps each one has a fly on it or something, and there's music and maybe a dozen level that get harder as you go. They can be generated, but, should always be possible to beat. You could also use your tongue to nudge enemies or something. There could also be turtle pads that surface and sink or fish that come up and give you power ups. When you hop to every lilipad flowers around the level all bloom and you celebrate before moving on.

</details>

### Porchlight

[![Trick-or-treating on a moonlit street of houses with glowing jack-o'-lanterns](https://raw.githubusercontent.com/zeveck/porchlight/main/media/screenshots/night.png)](https://porchlight.synapticnoise.com)

A cozy pixel-art Halloween puzzle: every house with a pumpkin loves one costume, so read the clues, bribe other kids with candy to swap outfits, and light every jack-o'-lantern. A brand new town every night, fifty costumes that each have a power, and when the last jack is lit, the whole town comes out to dance with you.

**[▶ Play Porchlight](https://porchlight.synapticnoise.com)** · [How it was made](https://github.com/zeveck/porchlight#how-it-was-made)

<details>
<summary>The request</summary>

> /gg:gamegen I want a game about Halloween in which you select from a small collection of costumes and go trick or treating around a large down, probably pixely, maybe 3/4 overhead view. The town should have dozens of houses. Each house likes a given costume more/less and you get more/better candy the more they like your costume. A bunch of other kids are also trick-or-treating. You can bribe other kids to swap costumes if you have enough candy, and once you gain a costume its in your initial set next time you play. Costumes have powers and some costumes cost more than othes. There should probably be like 50 total costumes, though maybe any given run of the game only includes 20-50 with more as levels get harder. Costumes can repeat a bit, maybe with color swaps in a given run. Not every house has candy every game. The streets should probably layout differently each game. Any house with candy has a pumpkin in the yard, and once you trick-or-treat there with the costume that house likes best, it becomes a jack-o-lantern so you know, and you get that jack-o-lantern in your jack collection. For a given run you can solve it by properly matching up enough houses. In early runs you may only need 10, but as you do better there are more. More houses offer candy on future runs, but you need more jack-o-lanterns to solve that board. it's fundamentally a puzzle game in which you're trying to match the costume to the house while keeping the most candy and there should always be the right costumes on the board to fulfill enough houses and you can always get more candy by re-trick-or-treating a house after a while, so you can always solve a board, but it gets harder as there are more kids and you need more houses. There should be music and effects and some costumes should have fun powers. Once you've gotten a house's jack-o-lantern instead of having a pumpkin it starts with that jack, just not lit yet, and if you go near it it'll let you just switch to the right costume, so you don't have to resolve every house every time if you don't want. In the final run you use every costume and match it to the right house and all the kids dance with you Thriller style and you all share the massive candy haul or something.

</details>

### Sim Shire

[![A busy shire village of burrows, farms and a river, with a dragon among the folk](https://raw.githubusercontent.com/zeveck/simshire/main/media/screenshots/village.png)](https://simshire.synapticnoise.com)

A cozy village builder in the spirit of SimCity, set in a Hobbit-like shire: arrange burrows, halls, farms, orchards and bridges so halflings, dwarves, elves, trolls, goblins and finally a dragon all live happily side by side, then gather for a lantern-lit festival with fireworks.

**[▶ Play Sim Shire](https://simshire.synapticnoise.com)** · [How it was made](https://github.com/zeveck/simshire#how-it-was-made)

<details>
<summary>The request</summary>

> /gg:gamegen I want a game called Sim Shire that harkens to games like SimCity or Civ but in which you're building a shire evocing The Hobbit and such. Your goal is to build a large, peaceful settlement in which lots of different fantasy races live together. there are elements of balancing different desires and tensions to avoid conflict and maximize communal happiness and chill. Levels get harder by having you try to have a wider range of fantasy creates/races live together. even monsters/dragons should be able to live peacfull if it's all well arranged. You get food, build houses, commmunity structures, bridges, orchads, whatever, and in the final level you win by including every face/creature in one large happy community and they come together for a party with fireworks and such. it's friendly fun.

</details>

### Pomegranate Panic 2

<a href="https://pomegranatepanic2.synapticnoise.com"><img src="https://raw.githubusercontent.com/zeveck/pomegranatepanic2/main/media/screenshots/hades-rises.png" alt="Hades rising from the flames beneath a tumbling pomegranate" width="300"></a>

A sequel, made by pointing gamegen at the original game and its code: slap marble ramps into thin air to keep a pomegranate bouncing down through the underworld, grab Persephone's six stolen seeds, then bounce off Hades' face, again and again as he gets angrier, until he lets her go. With music that speeds up as you go, boss music, and a Hall of Heroes high-score table.

**[▶ Play Pomegranate Panic 2](https://pomegranatepanic2.synapticnoise.com)** · [How it was made](https://github.com/zeveck/pomegranatepanic2#how-it-was-made)

<details>
<summary>The request</summary>

> /gg:gamegen We want to make Pomegranate Panic 2. It's based on https://pomegranatepanic.synapticnoise.com/. https://github.com/zeveck/pomegranatepanic. We want the same basic game idea, but with better graphics and sound fx and there should maybe be a tiny cooldown if you spam placement too fast. Also, if you get all 6 pomegranite seeds you should get to "fight" Hades. My idea there is that a Hades face will come up and fill the bottom of the screen and you just let yourself bounce off him, which throws you back up, and Hades vanishes for a bit then comes back, and gets angrier each time, and you do that enough times to defeat him and free Persephone or something. The music should probably get faster as the game does and there should be boss music. There should probably be the ability to capture your high score locally if you want and you're above a certain reasonably high threshold. Maybe it keeps top 5 with initials after you clear 10000 points or something. High score would probably care how many seeds you had and whether you beat hades.

</details>

### Hoard Hopper

[![Hoard Hopper's title screen](https://raw.githubusercontent.com/zeveck/hoardhopper/main/media/screenshots/title.png)](https://hoardhopper.synapticnoise.com)

Hoard Hopper came just before gamegen: a dragon platformer made from a single request with the same four plugins, with four scrolling caves, animated characters, a theme for each cave, and a pile of treasure that grows every time you play. gamegen packages up how it was made, so every game gets the same care: a reviewed design, consistent art, real music, and a full play-test before it's called done.

**[▶ Play Hoard Hopper](https://hoardhopper.synapticnoise.com)** · [How it was made](https://github.com/zeveck/hoardhopper#how-it-was-made)

## Development

Run the tests with `node --test`. The plugin lives in `skills/`: the skill itself is `skills/gamegen/SKILL.md`, with the detail for each step in `skills/gamegen/references/`. See [CLAUDE.md](CLAUDE.md) for working on gamegen itself.

## License

MIT. See [LICENSE](LICENSE).
