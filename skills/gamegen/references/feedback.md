# Bug reports from players (`--feedback`)

Read this for `--feedback` (`on`, `hidden` or `off`). It puts a **"Report a
bug"** button in the game. A player picks it, writes what went wrong, and
lands on a GitHub issue in the game's repo, already filled in with the
game's details. A screenshot of the moment is on their clipboard, ready to
paste. Those issues are what `--change #12` fixes.

Write the setting in `design/STATUS.md` (`Feedback: on`, `hidden` or `off`),
so `--change`, `--continue` and `--publish` keep it.

- **`on`** (also plain `--feedback`): the button is always there.
- **`hidden`**: the button appears only after the game is opened once with
  `?feedback` on its address (`https://pp3.synapticnoise.com/?feedback`). The
  game remembers that for that player, in `localStorage`, until they open it
  with `?feedback=off`. For testers, without showing everyone a bug button.
- **`off`**: take it out (the bundled file, the button, the hook).

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
`${CLAUDE_SKILL_DIR}/templates/feedback/gh-feedback.js` into
`game/vendor/gh-feedback.js` unchanged (on `--change` too, so a game picks up
the latest copy). Load it, and add the element once, at the end of `<body>`:

```html
<script type="module" src="vendor/gh-feedback.js"></script>
<gh-feedback id="report" trigger="none" repo="" template="bug.yml"
  types="bug,feature" theme="dark" color="#e0a030"></gh-feedback>
```

- `trigger="none"`: there's no floating button. The game opens it.
- `repo` stays empty until publishing fills it in (see publish.md). Empty
  means no button anywhere.
- `theme` and `color` (and `popup-color`) match the game's UI: dark or light,
  and its accent color.
- With no server set up, it runs in "link mode": no keys, no server.

### The button

"Report a bug" goes in the **pause menu** and the **settings** screen (or the
title screen's menu, if there's no settings screen), drawn in the game's own
style like the other buttons, and usable by mouse, touch, keyboard and
controller. Never a floating button over the play area.

Show it when `repo` is set and the setting allows it:

```js
const fb = document.getElementById('report');
const KEY = 'GAME-SLUG-feedback';                 // the game's save key prefix
const q = new URLSearchParams(location.search);
if (q.has('feedback')) {
  try {
    if (q.get('feedback') === 'off') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, '1');
  } catch {}
}
const FEEDBACK = 'on';                            // 'on' or 'hidden' (from the setting)
const showReport = !!fb?.getAttribute('repo') &&
  (FEEDBACK === 'on' || (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })());
```

In the desktop app (`window.desktop`), there's no address to add
`?feedback` to, so `hidden` means no button there; `on` works as on the web.
The shortcut below works in both.

### The shortcut: Ctrl+Shift+F

**Ctrl+Shift+F** opens the report from anywhere, even when the game is stuck
and its menus can't be reached. It works whenever the game has a repo, with
`on` or `hidden`, on the web and in the desktop app. It's Ctrl on a Mac
too (Cmd+Shift+F switches some Mac browsers to full screen).

**Its letter is never one of the game's keys,** so normal play can never
open it. If F is in the controls table, use another letter the game doesn't
use and the browser doesn't take (not N, T, W, R, I, J, P or B), and write
it in the design next to the controls.

Set it up in its own small script **before** the game's code, so an error in
the game can't stop it:

```html
<script>
  addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey || e.key.toLowerCase() !== 'f') return;
    const fb = document.getElementById('report');
    if (!fb?.getAttribute('repo') || document.activeElement === fb) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try { window.reportShortcut?.(); } catch {}   // the game pauses, if it still can
    fb.open();
  }, true);
</script>
```

The game sets `window.reportShortcut` to a function that pauses it the
usual way (taking the snapshot below). If the game is stuck and that fails,
the form still opens, with the canvas as it is.

With `on`, the controls screen lists it ("Ctrl+Shift+F: report a bug"). With
`hidden`, it stays off-screen; gamegen's report to the person mentions it,
with the `?feedback` link, for testers.

### Opening it

Picking "Report a bug" leaves the game paused and calls `fb.open()`. While
the form is open, **the game ignores every key, touch and controller
input**: the player is typing. Check before acting on any input:

```js
const reportOpen = () => document.activeElement === fb;   // focus is in the form
// in each key, pointer and touch handler:
if (e.composedPath?.().includes(fb) || reportOpen()) return;  // don't preventDefault either
```

That includes Escape (the form closes itself) and the game's
`preventDefault()` calls: a touch handler that cancels every touch would stop
phones from focusing the form's text boxes. Skip controller input while
`reportOpen()` too. When the form closes, the game is still on its pause
menu.

Make sure the page's no-select styles don't reach the form (iPhones won't
type into a box that can't be selected):

```css
gh-feedback { -webkit-user-select: text; user-select: text; touch-action: auto; }
```

In the desktop app, links open in the player's browser, but `window.open`
returns nothing there, which would read as "blocked". Tell the form it
opened:

```js
if (window.desktop) fb.openLink = (url) => { window.open(url, '_blank'); return true; };
```

### The screenshot

The form shows what the player saw, not the pause menu drawn over it. When
the game pauses (from any cause), first take a snapshot of the play canvas,
before drawing the pause screen:

```js
let pauseShot = null;
function snapshot() { pauseShot = new Promise((r) => canvas.toBlob(r, 'image/png')); }
// call snapshot() as the game pauses, right after the last game frame is drawn,
// and set pauseShot = null when it resumes, so an old picture is never sent
fb.getScreenshot = () => pauseShot ?? new Promise((r) => canvas.toBlob(r, 'image/png'));
```

- For WebGL (3D), take it in the same frame, right after rendering: the
  picture is gone once the frame ends (the same rule as the 3D play-test's
  `step`).
- On the title or settings screen, with no game in progress, it's the canvas
  as it is.
- HUD or menus made of HTML elements aren't in the canvas. That's fine: the
  game state in the report covers them.

### The details sent with it

`fb.getContext` returns a flat object of short, one-line values (no line
breaks: they break the table GitHub shows). Keep the whole thing small:
long values get cut to fit a GitHub link.

```js
const errors = [];                                  // the last few errors
const keep = (m) => { errors.push(String(m).replace(/\s+/g, ' ').slice(0, 200)); errors.splice(0, errors.length - 5); };
addEventListener('error', (e) => keep(e.message));
addEventListener('unhandledrejection', (e) => keep(e.reason?.message ?? e.reason));
const flat = (v) => String(v).replace(/\s+/g, ' ');
fb.getContext = () => ({
  game: 'Pomegranate Panic 3',
  address: location.origin + location.pathname,
  updated: document.lastModified,                   // when this version went up
  build: window.desktop ? `desktop app (${window.desktop.platform})` : 'web',
  browser: navigator.userAgent,
  screen: `${innerWidth}x${innerHeight} @${devicePixelRatio}x`,
  input: flat(window.__game?.state?.().input ?? ''),
  state: flat(JSON.stringify(window.__game?.state?.() ?? {})),
  errors: errors.join(' | ') || 'none',
});
```

Name the fields in plain words; `state` comes from the debug hook (see
web-target.md), so keep `__game.state()` short and useful: screen, level,
position, lives, score.

## Publishing

When the game has feedback `on` or `hidden`, publishing (publish.md) also:

1. **Fills in the repo:** `repo="<owner>/<repo>"` on the `<gh-feedback>`
   element in `game/index.html`.
2. **Adds the issue form:** copy `${CLAUDE_SKILL_DIR}/templates/feedback/bug.yml`
   to `.github/ISSUE_TEMPLATE/bug.yml` at the repository's root. It labels
   each report `bug` and `player-report`. GitHub only applies labels that
   already exist, so create any that are missing
   (`gh label list -R <repo>`, then `gh label create player-report -R <repo> --color c5def5 --description "Reported from the game"`).
   Never change an existing label.
3. **Checks issues are on:** `gh repo view <repo> --json visibility,hasIssuesEnabled`.
   If issues are off, the confirmation says it'll turn them on
   (`gh repo edit <repo> --enable-issues`). If the repo is private, it says
   players won't be able to report bugs, since they can't see the repo, and
   leaves it private.

## Play-testing it

Stub `window.open` so no tab opens:
`await page.evaluate(() => { window.__opened = []; window.open = (u) => (window.__opened.push(u), {}); })`.
Then:

1. With `repo` empty (before publishing), "Report a bug" isn't shown.
2. Set a repo for the test (`fb.setAttribute('repo', 'test/test')`) and, for
   `hidden`, load with `?feedback`. Pause, pick "Report a bug" (by mouse,
   by keyboard, and by controller when the game has one): the form opens,
   with a thumbnail of the game, not the pause menu.
3. Type a title, pressing the game's keys (arrows, Space, P, M, Escape last):
   the game doesn't move, unpause or mute while you type, and Escape closes
   the form, leaving the game paused.
4. Submit: the link in `__opened` starts
   `https://github.com/test/test/issues/new?`, and its `description` holds
   the details (game, address, state, errors). The form says the screenshot
   is copied.
5. **The shortcut:** mid-level, not paused, press Ctrl+Shift+F (or the
   game's letter): the form opens over the paused game, with a picture of
   the level. Escape leaves the game on its pause menu. Then resume, stop the
   game's loop as a crash would, and press it again: the form still opens.
   To stop the loop, turn off animation frames just long enough for the
   game's next one to be lost, then turn them back on (the form needs them):
   `page.evaluate(() => { const raf = requestAnimationFrame; window.requestAnimationFrame = () => 0; setTimeout(() => { window.requestAnimationFrame = raf; }, 150); })`,
   then wait 300 ms.
6. **Never by accident:** count opens
   (`page.evaluate(() => { const fb = document.getElementById('report'), o = fb.open.bind(fb); window.__reports = 0; fb.open = () => (window.__reports++, o()); })`),
   replay every level's recorded solution, and check `__reports` is still 0.
7. On a phone size: the form fits, and its text boxes take typing.
8. For `hidden`: load without `?feedback` in a fresh browser: no button,
   but the shortcut still opens the form. With `?feedback`: button. Again
   without: still there. `?feedback=off`: gone.
9. Screenshot the form over the game, and look at it: readable, in the
   game's colors.

## In the report and README

The README's "How to play" gets one line: "Found a bug? Pause and pick
'Report a bug', or press Ctrl+Shift+F (you'll need a GitHub account)." For
`hidden`, the README says nothing; the report to the person gives the
`?feedback` address and the shortcut to hand to testers. Either way, the report says that reports arrive as issues in the
game's repo, and `/gamegen --change #12` fixes one.
