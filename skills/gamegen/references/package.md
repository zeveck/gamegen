# Packaging a game for desktop and Steam

`--package` turns a finished web game into desktop apps that run without a
browser or a server:

- `--package windows`: a Windows app, a folder with `<Game>.exe`, and a zip
  of it.
- `--package linux`: the same for Linux (and Steam Deck).
- `--package steam`, or `--package` alone: both, plus what Steam needs: the
  store images, the files for uploading builds, and a checklist of the steps
  only the person can do in Steamworks.
- `--package mac`: not yet. Say that a Mac app has to be signed and notarized
  with a paid Apple Developer account, on a Mac, and that gamegen doesn't do
  that yet; offer Windows and Linux instead.

The game itself is unchanged: `scripts/package.sh` puts an unchanged copy of
`game/` inside a small Electron app (`templates/desktop/`), served from a
private `app://` address so its modules, files and saves work exactly as on
the web. Only web games can be packaged; for an engine target, say the
engine has its own export for desktop and Steam.

With a game description, make the game first; with `--change`, make the
change first; then package. A game that isn't finished can't be packaged
yet: suggest `--continue`. With `--publish` too, publish first, then package.

## 1. Get the game ready for a desktop

These go in the game itself, so they also work (or stay hidden) on the web.
`window.desktop` exists only in the desktop app:

- **A way to quit.** When `window.desktop` exists, the title screen gets a
  Quit button (`window.desktop.quit()`), and the pause menu a "Quit to
  desktop". Hidden on the web.
- **Full screen.** The app starts full screen and remembers the choice; F11
  or Alt+Enter switch. If the game has a settings screen, add a "Full screen"
  toggle there when `window.desktop` exists (`window.desktop.setFullscreen`).
- **A gamepad.** For `steam`, the game must play with a controller (Steam
  Deck is a controller): the stick and d-pad move, A acts or confirms, B goes
  back, Start pauses, and every menu can be used with them, with the focused
  button clearly shown. If it's missing, add it as gamepad.md says (and play
  it with the pretend controller there). For `windows` and `linux` it's worth
  adding too.
- **"Report a bug"** (games with `--feedback`): the bundled form works in
  the app, and its link opens in the player's browser once `fb.openLink` is
  set (see feedback.md). `hidden` means no button in the app.
- **Words that fit.** "Tap to start" reads "Press any key" or "Click" on a
  desktop (`pointer: fine`), and no "install this app" or "add to home
  screen" hints show in the desktop app.
- Links out of the game (the gallery, GitHub) already open in the player's
  browser; nothing to do.

Play-test these on the web first, as for any change (see playtest-guide.md).

## 2. Build

From the game's project folder (the one holding `game/`):

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/package.sh" build <windows|linux|both> "<Game name>" <version> "<credit>"
```

- The version is the game's own (`1.0.0` for the first package; raise it for
  every new build, and keep it in `design/STATUS.md`).
- The credit is the name in `design/STATUS.md` (Windows shows it as the
  publisher); leave it out if there's none.
- It downloads Electron the first time (a few hundred MB, once), and takes
  about a minute per platform. It prints where each build and its zip went:
  `dist/windows/<App>/`, `dist/linux/<App>/`, `dist/*.zip`. `<App>` is the
  game's name, made safe for file names on every system (a name like "Hades
  Rises: Part 2" gives "Hades Rises Part 2"); it prints it when it differs.
  Use it for everything below that names a file or folder.
- `dist/` is large and rebuilt every time: add it to the game's `.gitignore`
  (and never commit it or publish it).

## 3. Test

Run the Linux build on a virtual display and look at the screenshot:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/package.sh" test "dist/linux/<Game name>" design/screenshots/desktop-title.png
```

It checks the app starts, finds the desktop bridge, saves work and the
console is clean. If it says GTK libraries are missing, they're only needed
to test here: say so and suggest installing them (`sudo apt-get install
libgtk-3-0 libnss3 libasound2 libgbm1` on Ubuntu or Debian), or skip this
test and say it wasn't run. The Windows build can't be run here: say so in
the report, and suggest trying the exe on a Windows computer.

## 4. Steam (`--package steam`)

Make these in `dist/steam/`:

1. **Store images** in `dist/steam/store/`, made from the game's own art the
   way the social card is (see "Sharing and search" in web-target.md): an
   HTML page per image at exactly its size, screenshotted with
   `playwright-cli`. The sizes Steam asks for: header capsule 920x430, small
   capsule 462x174, main capsule 1232x706, vertical capsule 748x896, library
   capsule 600x900, library header 920x430, library hero 3840x1240 (no text
   or logo on it), library logo 1280x720 (the game's name on a transparent
   background). Plus at least five 1920x1080 screenshots of real play from
   the desktop build or the play-test. Look at every one.
2. **Upload files** in `dist/steam/scripts/`: copy `templates/steam/*.vdf`
   and fill in `GAME_TITLE` (the app name, `<App>`), `GAME_VERSION`, and, if `design/STATUS.md` has
   them, `STEAM_APP_ID`, `STEAM_DEPOT_WINDOWS` and `STEAM_DEPOT_LINUX`
   (otherwise leave them for the person, and say where to find them). The
   upload never goes live on its own (`SetLive` stays empty).
3. **The store text** in `dist/steam/store/description.md`: a short
   description (under 300 characters), a longer one with the features, the
   controls (keyboard and controller), and what makes it fun. From the
   README and the design, in the game's voice.
4. **The checklist** in `dist/steam/STEAM.md`: what's done, and what's left
   for the person, in order, with a link to the guide
   (https://gamegen.synapticnoise.com/steam-guide/):
   - the Steamworks account, the $100 fee, and the tax and bank forms;
   - creating the app, and putting its app and depot IDs in
     `design/STATUS.md` for next time;
   - the store page: images, text, price, the content survey, and the
     disclosure that the game was made with AI;
   - the launch options: `<App>.exe` (Windows) and `<slug>` (Linux), exactly
     as package.sh printed them;
   - Steam Cloud, if they want it (the guide has the folders);
   - uploading with SteamCMD to a private beta branch first, and trying it
     through Steam;
   - the reviews, the two-week Coming Soon period, and releasing.
5. **Licences.** If `design/STATUS.md` says the audio was made on
   ElevenLabs' free plan, its licence doesn't allow selling the game: say so
   plainly in the checklist and the report (paid-plan audio would fix it).
   Bundled fonts must allow it too (most of the ones gamegen bundles, such as
   OFL fonts, do).

## 5. Report

The folders and zips, what was tested (and what couldn't be: the Windows
build), and for Steam, the checklist's remaining steps in a few lines with
the guide's link. Say how to rebuild after a change: `/gamegen --change …
--package`.
