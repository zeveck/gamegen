# Bug reports from players (`--feedback`)

Read this for `--feedback` (`on`, `hidden` or `off`). It puts a **"Report a
bug"** button in the game. A player picks it, writes what went wrong, and
lands on a GitHub issue in the game's repo, already filled in with the
game's details. A screenshot of the moment is on their clipboard, ready to
paste. Those issues are what `--fix #12` fixes.

It's for web games and web exports only, not engine targets.

Write the setting in `design/STATUS.md` (`Feedback: on`, `hidden` or `off`),
so `--change`, `--continue` and `--publish` keep it.

- **`on`** (also plain `--feedback`): the button is always there.
- **`hidden`**: the button appears only after the game is opened once with
  `?feedback` on its address (`https://pp3.synapticnoise.com/?feedback`). The
  game remembers that for that player, in `localStorage`, until they open it
  with `?feedback=off`. For testers, without showing everyone a bug button.
- **`off`**: take it out (both bundled files, the button, the `gameReport`
  calls, and `.github/ISSUE_TEMPLATE/bug.yml`).

Given alone on a finished game (`/gamegen --feedback hidden`), it's a small
change: follow "Changing a finished game" in change.md, with no design
review. With a game description, build it in with everything else. With
`--change`, do both.

## What players need

Reports are filed by the player, from their own GitHub account. That means:

- **A GitHub account.** The form says so before they submit ("Opens GitHub to
  finish your report"), so nobody is surprised.
- **A public repo with issues turned on.** Players can't open issues in a
  private repo. The button only works once the game is published (it needs
  the repo's name), so until then it isn't shown at all.

## Building it

### The component

The form is gh-feedback (github.com/zeveck/gh-feedback), bundled with gamegen
so games stay offline and every game gets the same tested copy. Copy
`${CLAUDE_SKILL_DIR}/templates/feedback/gh-feedback.js` and
`${CLAUDE_SKILL_DIR}/templates/feedback/report.js` into `game/vendor/`
unchanged (on `--change` too, so a game picks up the latest copies). Load
`report.js` in `<head>` (or before the game's first script), so it runs
before the game and an error in the game can't stop it. Load the component
and add the element once, at the end of `<body>`:

```html
<script type="module" src="vendor/gh-feedback.js"></script>
<gh-feedback id="report" trigger="none" repo="" template="bug.yml"
  heading="Report a bug" types="bug,feature" theme="dark" color="#e0a030"></gh-feedback>
```

- `trigger="none"`: there's no floating button. The game opens it.
- `repo` stays empty until publishing fills it in (see publish.md). Empty
  means no button and no shortcut.
- `theme` and `color` (and `popup-color`) match the game's UI: dark or light,
  and its accent color. `heading` matches the button's words.
- The page's CSS gives it the game's font (`gh-feedback { font-family:
  'Fredoka', sans-serif; }`), so the whole form, buttons included, matches.
- With no server set up, it runs in "link mode": no keys, no server.

A game made before `report.js` has these pieces written into its own code.
Leave that alone, or switch it over completely, never half: remove its
shortcut script, `reportShortcut`, `showReport`, the `?feedback` block, the
error listeners, `const fb`, `pauseShot` and the `fb.*` hooks, the
`gh-feedback:open` listener and the CSS; replace `fb?.isOpen`, `fb.open()`
and `fb?.close()` with the `window.gameReport?.` calls below; have pausing
and resuming call `snapshot()` and `resumed()`; and pass its old key prefix
as `key`, so testers keep their `?feedback`.

### Connecting it to the game

`report.js` does the plumbing: the shortcut, `?feedback` and remembering it,
the screenshot, the details sent with the report (the game, its address,
when this version went up, web or desktop app, browser, screen, the game's
state and the last few errors), links in the desktop app, and the style that
lets iPhones type in the form. The game calls it once as it starts (the
calls below use `window.gameReport?.` so the game still runs if the file is
missing):

```js
window.gameReport?.setup({ game: 'Pomegranate Panic 3', key: 'pp3', visibility: 'on',
  state: () => window.__game.state(), pause, grab, releaseAll });
```

- `key`: the game's save-key prefix. `visibility`: `'on'` or `'hidden'`, from
  the setting.
- `state`: the debug hook's (web-target.md). Keep it short and useful:
  screen, level, position, lives, score.
- `pause`: pauses the game the usual way, and does nothing if it's already
  paused (never a toggle). The shortcut calls it; if the game is stuck and it
  fails, the form still opens.
- `grab`: a Promise of the play canvas as a PNG, `() => new Promise((r) =>
  canvas.toBlob(r, 'image/png'))`. In a WebGL (3D) game it calls `render()`
  first, in the same call: the canvas is blank once a frame has been shown.
- `releaseAll`: the input layer's "let go of everything", called as the form
  opens, so nothing is stuck down when the game resumes.
- `letter`: only when the shortcut isn't F (below).

Then, in the game:

- **The snapshot.** As the game pauses (from any cause), right after its last
  frame is drawn and before the pause screen, it calls
  `window.gameReport?.snapshot()`, and `window.gameReport?.resumed()` as it resumes. The form
  then shows what the player saw, not the pause menu. HUD or menus made of
  HTML elements aren't in the canvas; the state covers them.
- **While the form is open, the game ignores its own input:** the player is
  typing. Its key, pointer and touch handlers return first thing while
  `window.gameReport?.isOpen()`, before any `preventDefault()` (a touch handler that
  cancels every touch would stop phones from focusing the form's text
  boxes). The form already keeps its own keys, clicks and touches from
  reaching the page, lets go of pointer lock, leaves full screen, and closes
  on Escape, leaving the game on its pause menu.
- **With a controller** (when the game has controller support), its input
  layer keeps tracking button states while the form is open, but skips every
  action except the right face button (○ or B, button 1), which calls
  `window.gameReport?.close()`, so a player with only a controller isn't stuck.
  Because the states are tracked, the press that closes it does nothing else.

### The button

"Report a bug" goes in the **pause menu** and the **settings** screen (or the
title screen's menu, if there's no settings screen), drawn in the game's own
style like the other buttons, and usable by mouse, touch, keyboard and
controller. Never a floating button over the play area. The menus show it
when `window.gameReport?.shown()` (checked each time they draw, so a repo set later
still shows it), and picking it calls `window.gameReport?.open()`, leaving the game
paused.

In the desktop app (`window.desktop`), there's no address to add
`?feedback` to, so `hidden` means no button there; `on` works as on the web.
The shortcut works in both.

### The shortcut: Ctrl+Shift+F

**Ctrl+Shift+F** opens the report from anywhere, even when the game is stuck
and its menus can't be reached. It works whenever the game has a repo, with
`on` or `hidden`, on the web and in the desktop app. It's Ctrl on a Mac
too (Cmd+Shift+F switches some Mac browsers to full screen).

**Adding the report never changes the game's existing controls.** Not a
key, not a modifier, not how a menu is driven: the shortcut fits around the
game, never the other way round. If one of the game's own keys is Shift or
Ctrl and it also fires as the player presses the shortcut, leave it; the
game pauses a moment later anyway.

It's F even when F is one of the game's keys: the shortcut stops that F from
reaching the game, and F alone never opens it. Only if the game itself uses
Ctrl and Shift together as controls, use another letter the game doesn't
use, from L, X or Z (browsers keep most others), pass it as `letter`, and
write it in the design next to the controls.

With `on`, the controls screen lists it ("Ctrl+Shift+F: report a bug", with
the game's own letter if it isn't F). With `hidden`, it stays off-screen;
gamegen's report to the person mentions it, with the `?feedback` link, for
testers.

## Publishing

Publishing (publish.md) sets it up: in a public repo it fills in
`repo="<owner>/<repo>"` and adds the issue form
(`${CLAUDE_SKILL_DIR}/templates/feedback/bug.yml`) in step 3, item 7, then
creates the `bug` and `player-report` labels and checks issues are on once
the repo exists (after step 4.1, or "Updating" step 3). A private repo
leaves `repo` empty: no button and no shortcut.

## Play-testing it

1. With `repo` empty (before publishing), "Report a bug" isn't shown.
2. Set a repo for the test and stub `window.open` so no tab opens, before
   every load, so both survive reloads (with `run-code` and a reload, as in
   gamepad.md):

   ```js
   await page.addInitScript(() => {
     window.__opened = []; window.open = (u) => (window.__opened.push(u), {});
     addEventListener('DOMContentLoaded', () =>
       document.getElementById('report')?.setAttribute('repo', 'test/test'));
   });
   ```

   For `hidden`, load with `?feedback`. Pause, pick "Report a bug" (by mouse,
   by keyboard, and by controller when the game has one): the form opens,
   with a thumbnail of the game, not the pause menu.
3. Type a title, pressing the game's keys (arrows, Space, P, M, Escape last):
   the game doesn't move, unpause or mute while you type, and Escape closes
   the form, leaving the game paused. With a controller: open the form,
   press button 1 on the pretend controller from gamepad.md
   (`__pad.button(1, true)`, hold 50 ms, release): the form closes, the
   game still paused.
4. Submit: the link in `__opened` starts
   `https://github.com/test/test/issues/new?`, and its `description` holds
   the details (game, address, state, errors). The form says the screenshot
   is copied.
5. **The shortcut:** mid-level, not paused, press Ctrl+Shift+F (or the
   game's own letter): the form opens over the paused game, with a picture of
   the level. Escape leaves the game on its pause menu. Nothing sticks:
   hold an arrow, press the shortcut, release the arrow, Escape, resume, and
   the player doesn't move. Then resume, stop the
   game's loop as a crash would, and press it again: the form still opens.
   To stop the loop, turn off animation frames just long enough for the
   game's next one to be lost, then turn them back on (the form needs them):
   `page.evaluate(() => { const raf = requestAnimationFrame; window.requestAnimationFrame = () => 0; setTimeout(() => { window.requestAnimationFrame = raf; }, 150); })`,
   then wait 300 ms.
6. **Never by accident:** count opens
   (`page.evaluate(() => { const fb = document.getElementById('report'), o = fb.open.bind(fb); window.__reports = 0; fb.open = () => (window.__reports++, o()); })`),
   replay every level's recorded solution, and check `__reports` is still 0.
7. On a phone size: the form fits, and its text boxes take typing.
8. For `hidden`: load without `?feedback` in a fresh browser (run step 2's
   init script in the new session too): no button,
   but the shortcut still opens the form. With `?feedback`: button. Again
   without: still there. `?feedback=off`: gone.
9. Screenshot the form over the game, and look at it: readable, in the game's colors and font.

## In the report and README

The README's "How to play" gets one line: "Found a bug? Pause and pick
'Report a bug', or press Ctrl+Shift+F (you'll need a GitHub account)." (with
the game's own letter, if it isn't F). For
`hidden`, the README says nothing; the report to the person gives the
`?feedback` address and the shortcut to hand to testers. Either way, the report says that reports arrive as issues in the
game's repo, and `/gamegen --fix #12` fixes one.
