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
2. **Every screen.** Title, how to play, gameplay, pause, level complete, game
   over, victory, settings. Each one looks right and can be left again.
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
9. **Offline** (web games that install): in a fresh session, open the game
   with `?sw=1`, reload once so the service worker takes over, then
   `network-state-set offline`, reload, and play. Close that session after,
   so the cached copy doesn't follow you into later tests.

## Screenshots

Take a screenshot of every screen and every level at each size, straight into
the design folder:

```bash
playwright-cli -s=desktop screenshot --filename=design/screenshots/desktop-level-2.png
```

Then look at them (Read each image), or have a review agent look at them and
report back, to keep your own context free: cut-off text, controls covering
the action, placeholder art, things too small to read on a phone. Copy the
best few into `media/screenshots/` for the README.

## When something's broken

Fix it, then play that part again. If the same problem survives three fixes,
step back: simplify or cut the feature (check the cut list) and write down
what changed. If the game as a whole can't be finished, stop and say so in the
report, with what works and what doesn't.

## Without playwright-cli

If `playwright-cli` isn't installed, try `npx playwright` (it may need
`npx playwright install chromium` first) and run the same checks as a short
Playwright script. If no browser automation works at all, check what you can
(replaying solutions headlessly if the game's update loop runs in Node, a
syntax check with `node --check`, loading the page with `curl`), and in the
report, say clearly that the game hasn't been played in a browser and list
what to try first.
