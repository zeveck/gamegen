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
- **Orientation:** if the game needs landscape (or portrait), show a friendly
  "turn your phone" overlay in the wrong orientation, and lock it in the
  manifest.
- A fullscreen button on phones is a nice touch (`requestFullscreen`, where
  supported).

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

Players notice the words, the icons and the first two seconds before
anything else. Build these in from the start; the play-test checks them (see
playtest-guide.md).

### Text that looks finished

- **No lone last words.** `text-wrap: balance` on headings, labels, buttons
  and captions, and `text-wrap: pretty` on running text. Keep names and
  short phrases together with non-breaking spaces (`Sir&nbsp;Bramble`).
- **Never cut a name off.** Where space is tight (a top bar, a map label, a
  battle tag), shrink the text to fit, then let it go to two lines, and only
  then cut it with "…". Test the longest name in the game at the smallest
  size.
- **Nothing spills out of its box.** Size boxes to their longest text at every
  size, and test them with it.
- **Build text from strings, never by turning objects into text.** A helper
  that makes elements flattens its children all the way
  (`children.flat(Infinity)`) and appends elements as elements; text goes in
  with `textContent`. That's how `[object HTMLElement]` or `undefined` ends
  up on screen.
- **A screen that might scroll** on a short display: put the scrolling on an
  inner box, and keep wide things (a logo, a title) sized to fit
  (`max-width: 100%`, or scaled down) so the scrolling box can't clip them.
- **One way of writing each name.** Items, characters and places are
  spelled and capitalised the same everywhere; keep them in one list in the
  code and use it.
- **Text drawn on the canvas** gets the same care: wrap it with a helper
  that measures the words (`measureText`) and never leaves one alone on the
  last line, and shrinks a name to fit its space.

### The first load

The title should appear once, finished, and then stay still.

- **Preload what the title needs**: its fonts (`<link rel="preload"
  as="font" crossorigin>`, then `document.fonts.load(...)`) and its art.
- **Keep the title hidden until they're ready**, with a failsafe (show it
  anyway after about 3 seconds), then fade it in once. A plain background in
  the game's colors meanwhile is fine; text on a blank screen isn't.
- **Reserve space** for anything that appears later, so nothing shifts when
  it does.
- **Decide device-dependent words before showing them**: "Tap to begin" or
  "Click to begin" (from `matchMedia('(pointer: coarse)')`) is settled before
  the title appears, never swapped after.

### Icons

One set of matching icons, drawn as inline SVG in the text color
(`fill: currentColor`), for mute, pause, settings, fullscreen and the rest.
No emoji or symbol characters (🔊, ⚙, ⌨): they look different on every
device, and some phones show them as empty boxes.

### Pop-up messages

Send every pop-up message (an item found, a level up, a hint) through one
queue: messages of the same kind arriving together merge into one, the rest
wait their turn or stack neatly below any tip instead of on top of it, and
none ever covers the action (on a phone, in battle, keep them clear of the
fighters).

## Install and offline

- `manifest.webmanifest` with the name, short name, `display: fullscreen` (or
  `standalone`), orientation, colors and the three icons (192, 512, and a 512
  maskable icon with a safe margin).
- Make the icon sizes from one square image in code, for example with
  Python's Pillow (`python3 -c "from PIL import Image; ..."`); anim8gen
  already needs Pillow.
- A service worker for offline play, using the template below. Once
  installed it serves cached files, so register it only when the game isn't
  running locally, or when asked to with `?sw=1` (how the play-test checks
  offline play):

  ```js
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && (!local || new URLSearchParams(location.search).has('sw'))) {
    navigator.serviceWorker.register('sw.js');
  }
  ```

- Installing as an app needs the game published over https (GitHub Pages is
  fine). From `localhost` on the same computer it works too, but not from
  another device over plain http on your network.

```js
// sw.js: offline play. The GitHub Pages workflow stamps VERSION with the
// commit and fills FILES with everything in the game folder, so each deploy
// caches a fresh copy on the next launch. Unstamped (local) copies cache as
// they go.
'use strict';
const VERSION = '__BUILD__';
const FILES = [/*__FILES__*/];
const PREFIX = 'GAME-SLUG-';            // replace with the game's slug
const CACHE = PREFIX + VERSION;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(['./', ...FILES].map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './' : req;
  event.respondWith(caches.open(CACHE).then(cache =>
    cache.match(key, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }))));
});
```

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
     relative paths). Keep the name large and away from the edges; previews
     crop a little.
  2. Screenshot it with `playwright-cli` at exactly 1200x630: serve the
     project root on 127.0.0.1 only (it may hold `.env`), open the page,
     `resize 1200 630`, `screenshot --filename=design/social-card.png`, then
     stop that server.
  3. Look at it, then save it as `game/social-card.jpg` (Pillow, quality
     about 85).
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
  levels: () => /* number of levels */,
  goToLevel: (n) => { /* start level n fresh, as if just arrived */ },
  audioState: () => ({ context: audioCtx?.state, musicMuted, sfxMuted }),
  // Only when menus are drawn on the canvas: what's pressable on screen now.
  buttons: () => [{ label: 'Credits', x, y, w, h }],
};
```

Keep it harmless: it shouldn't change normal play. The play-test drives the
game with real key presses and touches, and uses the hook only to read state
and jump to a level. Each level gets a recorded solution that finishes it
(see playtest-guide.md), so make levels deterministic: same start, same
result for the same inputs (seed any randomness per level).

## Publishing on GitHub Pages

When the game is in a git repository, add `.github/workflows/pages.yml` at the
**repository's root** (GitHub ignores workflows anywhere else), with `GAME_DIR`
replaced by the game's folder relative to that root (`game`, or for example
`hoard-hopper/game`). Skip this if the repository already has a Pages workflow
or a Pages site: don't replace someone's existing site. After the repository is
on GitHub, turning on Pages (Settings, Pages, Source: GitHub Actions) publishes
the game on every push to `main`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      # Only the game folder is published. Stamp the service worker with this
      # version and the list of files to cache.
      - name: Stamp service worker
        working-directory: GAME_DIR
        run: |
          files=$(find . -type f ! -name sw.js | sed 's|^\./||' | sort | sed 's/.*/"&"/' | paste -sd, -)
          sed -i "s|'__BUILD__'|'${GITHUB_SHA::12}'|; s|/\*__FILES__\*/|$files|" sw.js
          ! grep -q -e __BUILD__ -e __FILES__ sw.js
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: GAME_DIR
      - id: deployment
        uses: actions/deploy-pages@v4
```
