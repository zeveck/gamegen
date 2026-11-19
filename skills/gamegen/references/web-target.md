# Web games (the default target)

A gamegen web game is a plain web page: HTML, CSS and JavaScript, with no
build step, no frameworks to install and nothing loaded from the internet
while playing. Anyone can serve the `game/` folder with any static server, or
publish it on GitHub Pages, and it works on desktop and on phones, online or
offline. Hoard Hopper (github.com/zeveck/hoardhopper) is a good example of
the result.

## Layout

```
game/
  index.html            the page: canvas, touch controls, meta tags
  game.js               the game (or src/*.js as ES modules for bigger games)
  manifest.webmanifest  install as an app
  sw.js                 offline play
  favicon.png  apple-touch-icon.png  icon-192.png  icon-512.png  icon-maskable-512.png
  social-card.jpg       1200x630, for link previews
  fonts/                any font used, bundled, with its license file
  assets/               art and audio (see asset-guide.md)
README.md               the game's README (see readme-template.md)
media/screenshots/      screenshots for the README
media/github-social.png 1280x640, the GitHub repo's preview picture
design/                 gamegen's design documents and play-test screenshots
.github/workflows/pages.yml
```

Plain JavaScript is fine, and a single `game.js` is fine for small and
medium games. For larger ones, split into ES modules (`<script type="module">`)
by job: input, audio, levels, entities, screens. A library is allowed only if
it's vendored into `game/` (no CDNs), and only when it saves a lot of work; a
2D canvas game rarely needs one.

## The page

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Stop the page from scrolling, zooming or selecting text while playing:
  `touch-action: none; user-select: none; overflow: hidden` on the body, and
  `preventDefault` on touch and key events the game uses (arrow keys and space
  scroll the page otherwise).
- A theme color, favicon, apple-touch-icon and manifest link, plus the title,
  description and link-preview tags (see "Sharing and search" below).

## Drawing and scaling

- Pick a fixed logical resolution in the design (such as 480x270 for pixel
  art, or 1280x720 for painted art) and draw everything in those units.
- Scale the canvas to fit the window, keeping the aspect ratio (letterbox the
  rest), and multiply the canvas's backing size by `devicePixelRatio` so it's
  sharp on phones. For pixel art, scale by whole numbers when possible and set
  `image-rendering: pixelated` and `ctx.imageSmoothingEnabled = false`.
- Recompute on `resize` and `orientationchange`.
- Respect the notch and home bar: keep HUD and touch controls inside
  `env(safe-area-inset-*)`.

## The game loop

- `requestAnimationFrame` with a fixed-timestep update (for example 60 updates
  a second, with an accumulator), so the game plays the same at any frame rate.
- Clamp a huge frame gap (after the tab was hidden) so nothing teleports.
- Pause automatically when the page is hidden (`visibilitychange`) or loses
  focus, and show the pause screen.

## Input

Build one small input layer that turns keyboard, touch (and optionally
gamepad) into the same game actions, so the game code only asks "is jump
pressed?".

- **Keyboard:** arrow keys and WASD, Space or Enter to act, Escape or P to
  pause, M to mute.
- **Never miss a quick press.** Record "just pressed" when the key or button
  goes down, and clear it after the next update reads it. A tap shorter than
  one frame still counts. (Polling only "is it held right now?" drops quick
  taps, and the play-test's key presses are that quick.)
- **Touch** (when the platform includes mobile): large on-screen buttons or a
  virtual stick, shown only on touch devices (detect the first `touchstart`,
  or `matchMedia('(pointer: coarse)')`). At least 64 CSS pixels each, placed
  where thumbs rest, semi-transparent, and never over the important action.
  Use pointer events and support several fingers at once.
- **Menus:** clickable and tappable, not only keyboard-driven.
- **Buttons that keep working:** never rebuild a clickable element every
  frame (setting its `innerHTML`, or replacing its icon). If the element under
  the pointer is replaced between press and release, the browser drops the
  click and the button does nothing. Update a button only when its state
  changes (keep the last state and compare).
- **The device it isn't made for:** see "On other devices" below.
- **Orientation:** if the game needs landscape (or portrait), show a friendly
  "turn your phone" overlay in the wrong orientation, and lock it in the
  manifest.
- A fullscreen button on phones is a nice touch (`requestFullscreen`, where
  supported).

## On other devices

A game made for one kind of device still gets opened on the other, and it
shouldn't just feel broken there. Use the design's "On other devices" line.

**A desktop-only game on a touch-only device** shows a notice first, honest
about what works, for example: "Made for a computer, or a tablet with a
keyboard or controller. With touch alone you can look around, but the
battles can't be played." Its buttons are "Send link to yourself" and a
quieter "Look around anyway"; offer "Play anyway" instead only if the game
can really be finished by touch.

**A mobile-only game on a computer** usually plays fine with a mouse. Only if
it needs what a computer lacks (several fingers at once, tilting), show a
short notice saying so, the same way. A portrait game on a computer shows as
a centred column, not a "turn your phone" message: that overlay is for
touch devices only.

Copy `${CLAUDE_SKILL_DIR}/templates/web/other-devices.js` into the game
unchanged, load it before the game's code, and call it as the game starts,
with the game waiting on its title screen behind it:

```js
window.otherDevices?.show({ kind: 'desktop-only', key: 'pp3',
  heading: 'Made for a computer', text: '…the design\'s words…',
  main: 'Send link to yourself', quiet: 'Look around anyway', onClose });
```

It decides who sees it (the device, not the window's width: never a
touchscreen laptop or the desktop app; hidden again if a mouse turns up),
draws an HTML overlay with phone-sized text and 44 px buttons, shares or
copies the game's clean address (or shows it to copy by hand), lets Tab,
Enter and Space work its buttons while any other key or Escape dismisses it
without reaching the game, makes it an accessible dialog, puts focus back
afterwards, and remembers that it was dismissed. The game:

- styles `.od-notice`, `.od-box`, `.od-main`, `.od-quiet` and `.od-link` like
  its other screens (the template's own styles are plain defaults the game's
  always win over), and passes its own words for `copied` and `shared`
  ("Link copied", "Link sent") if they differ;
- works the same whether or not the notice shows: `show()` returns `false`
  and calls nothing when it isn't needed, and `onClose` only resumes the
  `AudioContext` (the dismissing press counts as the first input);
- in its controller layer, while `window.otherDevices?.isOpen()`, keeps
  reading button states, calls `window.otherDevices.dismiss()` on a new
  press, and does nothing else with it.

## Audio

- Browsers only allow sound after the first tap or key press. Create or resume
  the `AudioContext` on that first input ("Tap to start" on the title screen
  covers it).
- Use Web Audio (`AudioBuffer`s with `loop = true` for music) for everything:
  effects overlap and start instantly, and music loops cleanly. Avoid
  `<audio>` elements for music: on iPhones they can fail to play files served
  from the offline cache.
- Mute with M and a button on screen; remember the choice in `localStorage`.
  Separate music and sound toggles are a bonus.
- Stop or duck the music when paused, and never stack two copies of a track.
- Without generated audio, synthesize simple effects with oscillators and
  noise (a jump blip, a coin chime, a hit thump).

## Saving

Save progress, best scores and settings to `localStorage` under a key named
for the game, as a small JSON object with a version number. Wrap reads in
`try`/`catch` and fall back to a fresh save if it's missing or broken.

## Looking finished

Players notice the words, the icons and the first seconds before anything
else. Aim for:

- **Text that looks finished:** no code or junk showing as text, no lone
  last words in headings, buttons and captions (`text-wrap: balance` helps),
  and nothing cut off or spilling out of its box at any size.
- **A first load that appears once and stays still:** the title shows up
  with its real fonts and art, and nothing jumps or changes after that.
- **Art that's there when a scene starts:** load what each area draws before
  the player gets there: the core art during the title, an area's key art
  (its boss, its main props) on entering the area, and the next scenes in the
  background. An image first requested when it's drawn shows up late, as a
  gap or a stand-in shape. Hide any wait that's left inside a transition the
  game already has.
- **Every symbol in its font:** a bundled font subset often has no arrows
  (← ↑ → ↓) or other symbols, and the browser's fallback can be unreadable
  (a thin ↑ looks like a 1). Include them, or draw them as icons.
- **Screens that hand over cleanly:** closing one screen never shows what's
  underneath unless that's meant to be the next view. When a full-screen
  screen (the title, a story picture, a chapter card) or an overlay in a
  sequence (a dialog line, a toast, one menu replacing another) closes, the
  next often opens a frame or more later: a script carries on after the
  frame is drawn, or awaits an image or a load. For those frames the game
  map (or the scene with no dialog box) flashes through. Any of these fixes
  it:
  - **Hold the closed screen:** keep drawing it, frozen and not clickable,
    until the next one opens, which ends the hold at once. Cap it: about 20
    frames for a full-screen screen (longer from New Game to the first story
    picture while the level loads), 2 or 3 for a dialog line or a toast, so
    the last one in a sequence doesn't hang around.
  - **Open the next before closing the current one,** with its art loaded
    first (with a stack of screens, remove the old one by name, not by
    popping the top).
  - **Reveal the game on purpose,** with a fade, never by the cover simply
    disappearing.
- **One consistent style of icons** that shows up on every device (emoji and
  symbol characters often don't).
- **Pop-up messages** that don't cover each other or the action.

The play-test checks these (see playtest-guide.md).

## Install and offline

- `manifest.webmanifest` with the name, short name, `display: fullscreen` (or
  `standalone`), orientation, colors and the three icons (192, 512, and a 512
  maskable icon with a safe margin).
- Make the icon sizes from one square image in code, for example with
  Python's Pillow (`python3 -c "from PIL import Image; ..."`); anim8gen
  already needs Pillow.
- A service worker for offline play: copy
  `${CLAUDE_SKILL_DIR}/templates/web/sw.js` into the game folder and replace
  `GAME-SLUG` in its `PREFIX` with the game's slug (keep the trailing `-`). The Pages workflow (below) stamps it with each
  deploy's version and file list. Once installed it serves cached files, so
  register it only when the game isn't running locally, or when asked to
  with `?sw=1` (how the play-test checks offline play):

  ```js
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && (!local || new URLSearchParams(location.search).has('sw'))) {
    navigator.serviceWorker.register('sw.js');
  }
  ```

- Installing as an app needs the game published over https (GitHub Pages is
  fine). From `localhost` on the same computer it works too, but not from
  another device over plain http on your network.

## Sharing and search

Every web game gets these, so links to it look good and search engines
understand it:

- **A title and description**: `<title>` (the game's name and what it is, such
  as "Hoard Hopper: a pixel dragon platformer") and a one or two sentence
  `<meta name="description">` that makes someone want to play.
- **Link previews**: Open Graph and Twitter tags (`og:title`,
  `og:description`, `og:image` with its width, height and alt text,
  `twitter:card` set to `summary_large_image`).
- **A social card**: `social-card.jpg`, 1200x630, the image link previews show.
  Make it from the game's own art, not as a new generated image:
  1. Write `design/social-card.html`: a 1200x630 page with the game's title
     art or a striking screenshot as the background, the main character, and
     the game's name in its own font and colors (load them from `game/` with
     relative paths). Keep the name large, and keep it and anything
     important inside the middle 1040x560 or so, with only background
     outside: link previews (Teams, Slack, phones) crop to their own shapes.
  2. Screenshot it with `playwright-cli` at exactly 1200x630: serve the
     project root with `python3 "${CLAUDE_SKILL_DIR}/scripts/serve.py" <port> .`
     (127.0.0.1 only, caching off, and never hidden files like `.env`), open
     the page,
     `resize 1200 630`, `screenshot --filename=design/social-card.png`, then
     stop that server.
  3. Look at it, then save it as `game/social-card.jpg` (Pillow, quality
     about 85).
- **A GitHub preview image**: `media/github-social.png`, 1280x640, the image
  shown when someone shares the link to the game's GitHub repo (otherwise
  GitHub shows a plain card of the repo's name and description, which link
  previews then cache, old wording and all). Same recipe as the social card:
  `design/github-social.html` at 1280x640 (the social card's page, resized
  and rebalanced for the wider shape), screenshotted with `resize 1280 640`
  to `media/github-social.png`, and looked at. Keep the name and characters
  inside the middle 1000x500 or so, with only background in the outer 140 px
  left and right and 70 px top and bottom, so a crop loses background, not
  the game. GitHub's limit is 1 MB: if the PNG is bigger, save
  `media/github-social.jpg` instead (quality about 85).
  GitHub has no way for gamegen to set it; publishing asks the person to
  upload it (see publish.md).
- **Once the game's web address is known** (when publishing, see
  publish.md): a `<link rel="canonical">`, absolute URLs in the preview
  tags (some sites need them for the image), `robots.txt` and a one-page
  `sitemap.xml`. Until then, leave those out rather than guess an address.

## The debug hook (for play-testing)

Expose a small object on `window` that lets the play-test read the game's
state and set up situations, without playing for it:

```js
window.__game = {
  state: () => ({ screen, level, lives, score, player: { x, y }, levelComplete, gameWon }),
  // What was drawn, as [screen, frames] pairs: one pair per change of
  // screen, top screen last ('title', 'map', 'map>dialog'). See below.
  frames: () => frameLog,
  levels: () => /* number of levels */,
  goToLevel: (n) => { /* start level n fresh, as if just arrived */ },
  audioState: () => ({ context: audioCtx?.state, musicMuted, sfxMuted }),
  // Only when menus are drawn on the canvas: what's pressable on screen now.
  buttons: () => [{ label: 'Credits', x, y, w, h }],
};
```

**The frame log** records what each drawn frame showed, so the play-test
can catch a screen that flashes for a frame or two (see "Screens that hand
over cleanly"). Push it where the frame is drawn (`draw()` or the
`requestAnimationFrame` callback), naming what's actually on screen,
including a screen that's being held after it closed. Name screens, not
their contents: a fade or an animation keeps one name all the way through.
Keep only changes, and at most 200 of them:

```js
const frameLog = [];
function logFrame(name) { // call once per drawn frame
  const last = frameLog[frameLog.length - 1];
  if (last && last[0] === name) last[1]++;
  else { frameLog.push([name, 1]); if (frameLog.length > 200) frameLog.shift(); }
}
```

With a stack of screens, the name is their kinds joined with `>`. With a
single `screen` variable, it's that plus any open overlay
(`screen + (dialogOpen ? '>dialog' : '')`). For menus made of HTML elements,
log the visible ones in a `requestAnimationFrame` callback (for example the
ids of `[data-screen]:not([hidden])`, joined with `>`).

Keep it harmless: it shouldn't change normal play. The play-test drives the
game with real key presses and touches, and uses the hook only to read state
and jump to a level. Each level gets a recorded solution that finishes it
(see playtest-guide.md), so make levels deterministic: same start, same
result for the same inputs (seed any randomness per level).

## Publishing on GitHub Pages

When the game is in a git repository, copy
`${CLAUDE_SKILL_DIR}/templates/web/pages.yml` to `.github/workflows/pages.yml`
at the **repository's root** (GitHub ignores workflows anywhere else), with
`GAME_DIR` replaced by the game's folder relative to that root (`game`, or for example
`hoard-hopper/game`). Skip this if the repository already has a Pages workflow
or a Pages site that gamegen didn't add: don't replace someone's existing site.
gamegen's own site is built by this workflow (`gh api repos/<owner>/<repo>/pages --jq .build_type`
says `workflow`, and this `pages.yml`, with its "Stamp service worker" step,
is at the repository's root). Any other site is the person's. When the game
folder is that repository's root, publishing (publish.md, step 1.2) says so
and asks before switching it to this workflow, even with `--no-confirm`;
when the game is in a subfolder, the site is left alone and the game gets
its own repo when published. After the repository is on GitHub,
turning on Pages (Settings, Pages, Source: GitHub Actions) publishes the game
on every push to `main`.

