# The game's README

The game's `README.md` is its front page: the first thing someone sees on
GitHub. Write it for players first, then for the curious. Friendly, short,
and full of screenshots. Hoard Hopper's README (github.com/zeveck/hoardhopper)
is a good model.

```markdown
# <Game name>

*<Tagline.>*

<Two or three inviting sentences: what you do and why it's fun.>

**[▶ Play <Game name>](<link, once it's published>)** in your browser. No
install, works on desktop and on phones.
<!-- Until it's published, replace the line above with how to play locally. -->

![<Title screen>](media/screenshots/title.png)

## <The levels / The world / The enemies: whatever the game has>

A short tour with screenshots, a line each. A table of two screenshots side by
side works well.

## How to play

- **Move:** ...
- **<Action>:** ...
- **Pause:** Esc or P. **Mute:** M.
- On a phone, use the on-screen buttons<, holding the phone sideways>.
  <You can install it from your browser's menu to play full screen, even
  offline.>

<One or two lines on winning, losing and what's saved.>

## How it was made

<Game name> was made by [Claude Code](https://claude.com/claude-code) with
[gamegen](https://github.com/zeveck/gamegen), from this request:

> <the request, exactly as typed>

gamegen designed the game, had review agents polish the design, made the art,
animation, music and sound with these plugins, built it, and play-tested it:

- [nanogen](https://github.com/zeveck/nanogen): <what it made>
- [imagegen2](https://github.com/zeveck/imagegen2): <what it made>
- [anim8gen](https://github.com/zeveck/anim8gen): <what it animated>
- [audiogen](https://github.com/zeveck/audiogen): <the music and sounds>

<Leave out any plugin that wasn't used.>

## Playing locally

<Game name> is a plain web page with no build step. Serve the `game` folder
with any static web server, for example:

    cd game
    python3 -m http.server 8000

then open http://localhost:8000.

## Credits

<The font, with its license (bundled next to the font file). Only if the
setup check reported ElevenLabs' free plan: "Music and sound effects created
with ElevenLabs." Anything else bundled, with its license.>
```

For targets other than web, replace "Playing locally" with how to open and run
the project in its engine, and drop the "Play in your browser" line.
