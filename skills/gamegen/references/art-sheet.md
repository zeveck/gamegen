# The art sheet (`--art-sheet`)

`--art-sheet` makes a page showing everything made for the game (its
characters, places, animations, models, colours, music and sounds), so the
person can see and share the whole look at once. Make it as soon as all the
game's art is ready: at the end of Phase 4, once every asset is accepted.
Given on its own on a finished game, make it now and do nothing else (no
setup check: nothing is generated). After a `--change` that adds or changes
art, update the same page.

## Building it

`scripts/art-sheet.py` does the work: it makes web-sized copies of every
picture, turns frames into animations, copies the audio and the font, and
writes the page in the game's colours, with captions, alt text and a menu of
sections. It never changes the game's own files. Its opening comment shows
the manifest's format.

1. **Write `.gamegen/art-sheet/manifest.json`** from `design/ASSETS.md` and
   the design: accepted assets only, never candidates. The title ("<Game>:
   The Art"), a line on what's here, the game's font and three colours, the
   key art for the top, then the sections the game has, in this order:
   - the cast (`cards`: name and role; `mark` the important ones);
   - concept art and the style anchor (`gallery`), mock pictures included;
   - animations (`gallery`, each from its `frames`);
   - places and backgrounds (`wide`), then items, icons and the interface
     (`gallery`);
   - 3D models' preview sheets, grouped (`wide`);
   - colours (`colors`: the palette, named), textures, skies and stills;
   - music and sounds (`audio`: each track's name and where it plays).

   Every picture gets alt text describing it. Leave out prices, file paths,
   tool names and anything secret.
2. **Run** `python3 "${CLAUDE_SKILL_DIR}/scripts/art-sheet.py" .gamegen/art-sheet/manifest.json`
   from the project folder. It stops and lists any file that's missing.
3. **Look at it:** serve `.gamegen/art-sheet` (as the play-test does),
   screenshot it at desktop and phone sizes, and check every picture and
   player works. It's built outside the game's repo, so hundreds of pictures
   don't go online with the game.

## Publishing it

On claude.ai, with the session's artifact tools: read the tool's own guide
first, and publish the folder's files (index.html, `img/`, `audio/`,
`fonts/`) as a new artifact titled "<Game>: The Art". If the script lists
batches (in `batches.json`), send them in that order to the same artifact, each with the
version the last publish returned. Later, republish that artifact (its link
is in `design/STATUS.md`) so the link stays the same: list its files first,
send the first batch replacing all of them, and the rest added to it. The
folder can be rebuilt from the manifest at any time.

Put the link in `design/STATUS.md` ("Art sheet: <link>") and in the report,
and say it's private to them until they share it from claude.ai (gamegen
can't change who sees it). With no artifact tools, say how to open the page
locally instead. Never stop the run over it.
