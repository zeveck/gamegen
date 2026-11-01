# Play-testing

The game isn't done until it's been played: every screen, every level, at
every targeted size, with no errors. This guide is for web games; for other
targets, see other-targets.md.

## Set up once

**Work from one folder.** Run every `playwright-cli` command from the project
root (the folder holding `game/`), and don't `cd` elsewhere: `playwright-cli`
reads its settings from `.playwright/cli.config.json` in the current folder,
and its sessions belong to that folder. If the config is missing, create it:

```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": { "headless": true, "args": ["--no-sandbox"] }
  },
  "outputDir": ".playwright/output"
}
```

**Serve the game** from the project root, in the background, and leave it
running for the whole play-test (any free port):

```bash
python3 -m http.server 8123 --bind 127.0.0.1 --directory game
```

Stop it with the background task controls when you're done. Never use
`kill -9`, `pkill` or `killall`: they can take down other things in the
container.

**The service worker stays off while testing.** The game registers its
offline service worker only when it isn't on `localhost`/`127.0.0.1`, or when
the address has `?sw=1` (see web-target.md). Otherwise a cached copy would
keep serving old files after every fix.

## Open it at each size

Use one session per size, so desktop and phone stay separate:

```bash
playwright-cli -s=desktop open http://127.0.0.1:8123/
playwright-cli -s=desktop resize 1280 720

playwright-cli -s=phone open --device "iPhone 15" http://127.0.0.1:8123/
playwright-cli -s=phone eval "matchMedia('(pointer: coarse)').matches"
```

The device name is case-sensitive: `"iPhone 15"` works, while a lowercase
name silently opens a desktop browser. The last command must print `true`; if
it doesn't, the phone session isn't really a phone.

Test the sizes the platform setting covers:

- **desktop:** 1280x720, and a small window such as 800x600.
- **mobile:** the phone in the game's orientation (`resize 852 393` for
  landscape on an iPhone 15), and the wrong orientation to check the "turn
  your phone" overlay.
- **both:** all of the above.

## Play it with real input

Drive the game the way a player would: real key presses, clicks and touches.
Use JavaScript in the page (`eval`) only to read state, check results and jump
to a level with the debug hook; never to fake the player's actions.

**Single actions** work as separate commands:

```bash
playwright-cli -s=desktop press Enter
playwright-cli -s=desktop eval "JSON.stringify(window.__game.state())"
```

**Timed play** (holding a direction while jumping) doesn't: each command
takes about half a second, and `press` holds a key for a millisecond. Script
the timing inside one `run-code`, which takes a function:

```bash
playwright-cli -s=desktop run-code "async page => {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.down('Space');
  await page.waitForTimeout(150);
  await page.keyboard.up('Space');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  return await page.evaluate(() => window.__game.state());
}"
```

**Touch.** A tap is `page.touchscreen.tap(x, y)`. Holding a button, or two
fingers at once (move and jump), needs the browser's touch events:

```bash
playwright-cli -s=phone run-code "async page => {
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const move = { x: 80, y: 330, id: 1 }, jump = { x: 780, y: 330, id: 2 };
  await touch('touchStart', [move]);
  await page.waitForTimeout(300);
  await touch('touchStart', [move, jump]);
  await page.waitForTimeout(200);
  await touch('touchEnd', [move]);
  await page.waitForTimeout(300);
  await touch('touchEnd', []);
  return await page.evaluate(() => window.__game.state());
}"
```

Read the controls' real positions from the page (`eval` on their bounding
boxes) rather than guessing coordinates.

## Prove every level can be finished

For each level, record a solution while building it: an input timeline (keys
or touches with timings) that finishes the level, saved as
`design/solutions/level-<n>.json`. The play-test replays each one with
`run-code` from the start of its level (`window.__game.goToLevel(n)`) and
checks `window.__game.state()` says the level is complete. Replay all of them
after every change to levels, physics or controls; a solution that stops
working means the level broke (or the solution needs re-recording, if the
level was meant to change).

Generated levels: the generator itself checks each level is solvable before
using it (for example, a search over the moves the player can make), and the
play-test replays a few seeds.

## What to check

Work through the design's definition of done. At minimum:

1. **No errors.** `playwright-cli -s=desktop console` after loading and after
   each screen; no errors, and no failed requests (`requests`).
2. **Every screen, and everything they open.** Title, how to play, gameplay,
   pause, level complete, game over, victory, settings, and everything every
   button on them opens (see "Open every screen" below). Each one looks right
   and can be left again.
3. **Every level can be finished:** replay every recorded solution. Play the
   first level from the title screen with no help.
4. **Losing works.** Lose a life and lose the game; retry; nothing gets stuck.
5. **Controls.** Every action on the keyboard; on the phone, every on-screen
   control, holding a button, and two at once.
6. **Audio.** After the first input, `eval "JSON.stringify(window.__game.audioState())"`
   shows the audio context `running`, and after pressing mute it shows muted.
7. **Saving.** Make progress, reload, and check it's still there
   (`localstorage-list`).
8. **Pausing.** Pausing, switching tabs and coming back, and resizing in the
   middle of a level all work.
9. **The first load** (see "The first load" below): the title appears once,
   in its real fonts and art, and nothing jumps afterwards.
10. **The words on screen** pass the text scanner at every screenshot (see
    "Screenshots").
11. **Offline** (web games that install): in a fresh session, open the game
   with `?sw=1`, reload once so the service worker takes over, then
   `network-state-set offline`, reload, and play. Close that session after,
   so the cached copy doesn't follow you into later tests.

## Open every screen

A screen nobody opened is a screen nobody checked. On the title, pause,
game-over and end screens (and settings, and anything else with buttons),
press every button that opens something: credits, help, settings, about,
achievements, a map. Screenshot what it opens, scan its text, and close it
again the way a player would. Read each screen's buttons from the page
(`snapshot`, or `eval` over the visible `button` and `[role=button]`
elements); for menus drawn on the canvas, the debug hook's `buttons()` lists
them (see web-target.md). Do this at every size: a popup that fits a desktop
can run off a phone held sideways.

## The first load

Screenshots are taken after the page has settled, so they can't show what a
player sees while it loads: text in a stand-in font that then jumps, words
on a blank screen before the art arrives, a button whose label changes.
Film it instead, on a slowed connection, in a fresh session at each size
(open the session, `resize`, then):

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/first-load.sh" phone http://127.0.0.1:8123/ design/screenshots/first-load-phone.png
```

It saves a filmstrip of about 20 frames and prints when the fonts finished
loading and when the picture changed. Look at the filmstrip. The title should
appear once, in its real fonts and with its art, and then stay put: every
change after it appears is a flicker or a jump to fix (see "Looking finished"
in web-target.md). A fade-in as the title appears is fine.

## Screenshots

Take a screenshot of every screen and every level at each size, straight into
the design folder:

```bash
playwright-cli -s=desktop screenshot --filename=design/screenshots/desktop-level-2.png
```

**Scan the text at every screenshot.** `scripts/scan-text.js` reads the words
on screen the way a player sees them:

```bash
playwright-cli -s=desktop run-code "async page => {
  await page.addScriptTag({ path: '${CLAUDE_SKILL_DIR}/scripts/scan-text.js' });
  return await page.evaluate(() => window.__scanText());
}"
```

It reports three kinds of problem, each with the text and the element:

- `junk`: code or markup showing as text (`undefined`, `NaN`,
  `[object HTMLElement]`, tags, `&amp;`, template braces). Always a bug: fix
  it before going on.
- `orphan`: a heading, button, caption or other short text whose last line
  is one lone word.
- `clipped`: text cut off by its own box (including a "…"), by a box around
  it, or by the edge of the screen.

Clear every `orphan` and `clipped` finding too: fix the cause (see "Looking
finished" in web-target.md), then scan again. The scanner can't read
text drawn on the canvas; check that in the screenshots.

Then look at the screenshots (Read each image), or have a review agent look
at them and report back, to keep your own context free, against the polish
checklist in review-roles.md, plus controls covering the action and things
too small to read on a phone. Copy the best few into `media/screenshots/`
for the README.

## Never silence a check

When a check flags something, fix the cause or make the check more precise.
Never tell it to skip an element: the skip stays after the harmless thing it
was added for changes, and hides the real problem that comes next. If an
exception truly can't be avoided, write down why beside it, take a
screenshot showing it looks right, and check it again whenever the CSS
around it changes.

## When something's broken

Fix it, then play that part again. If something truly can't be made to work,
say so plainly in the report, with what works and what doesn't.

## Without playwright-cli

If `playwright-cli` isn't installed, try `npx playwright` (it may need
`npx playwright install chromium` first) and run the same checks as a short
Playwright script. If no browser automation works at all, check what you can
(replaying solutions headlessly if the game's update loop runs in Node, a
syntax check with `node --check`, loading the page with `curl`), and in the
report, say clearly that the game hasn't been played in a browser and list
what to try first.
