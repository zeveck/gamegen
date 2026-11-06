#!/usr/bin/env bash
# Turns a finished gamegen web game into desktop apps (Electron), for
# /gamegen --package. Run it from the game's project folder (the one holding
# game/):
#
#   package.sh build <windows|linux|both> "<Game name>" [version] ["<author>"]
#       Builds dist/windows/<Game name>/<Game name>.exe and/or
#       dist/linux/<Game name>/<slug>, plus a zip of each in dist/. The game
#       folder is copied in unchanged; templates/desktop/ is the app around it.
#   package.sh test <dist/linux/<Game name>> <screenshot.png>
#       Starts the Linux build on a virtual display, drives it like the
#       play-test does, saves a screenshot and prints what it found (and any
#       console errors). Needs Xvfb, and GTK 3 for Electron (libgtk-3-0).
#
# Build tools (@electron/packager, resedit) go in .gamegen/desktop-tools, and
# Electron itself is downloaded once per platform into ~/.cache/electron.
# Prints plain "label: value" lines.
set -u

ELECTRON_VERSION="45.2.3"   # raise deliberately, and re-test a packaged game
PACKAGER_VERSION="20.3.0"
RESEDIT_VERSION="2.0.3"

die() { echo "$1"; exit 1; }
here="$(cd "$(dirname "$0")" && pwd)"
templates="$here/../templates/desktop"

cmd="${1:-}"; shift || true
case "$cmd" in
  build)
    targets="${1:?build needs windows, linux or both}"; name="${2:?build needs the game name}"; version="${3:-1.0.0}"; author="${4:-$name}"
    case "$targets" in windows|linux) ;; both) targets="windows linux" ;; *) die "package: '$targets' isn't windows, linux or both" ;; esac
    [ -f game/index.html ] || die "package: no game/index.html here (run it from the game's project folder)"
    command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 || die "package: needs Node.js and npm"
    slug="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
    [ -n "$slug" ] || die "package: '$name' has no letters or digits to name the app with"

    tools="$PWD/.gamegen/desktop-tools"
    if [ ! -x "$tools/node_modules/.bin/electron-packager" ] || [ ! -d "$tools/node_modules/resedit" ]; then
      mkdir -p "$tools"
      [ -f "$tools/package.json" ] || printf '{ "name": "gamegen-desktop-tools", "private": true }\n' > "$tools/package.json"
      (cd "$tools" && npm install --no-audit --no-fund --loglevel=error \
        "@electron/packager@$PACKAGER_VERSION" "resedit@$RESEDIT_VERSION" >/dev/null 2>&1) \
        || die "package: couldn't install the build tools (npm install failed; is there a network?)"
    fi

    # The app: the template around an unchanged copy of the game.
    stage="$PWD/.gamegen/desktop/app"; build="$PWD/.gamegen/desktop/build"
    rm -rf "$stage" "$build"; mkdir -p "$stage" "$build" dist
    cp "$templates/main.js" "$templates/preload.js" "$stage/"
    cp -R game "$stage/game"
    node -e 'const [n, s, v, a, dir] = process.argv.slice(1); require("fs").writeFileSync(dir + "/package.json",
      JSON.stringify({ name: s, productName: n, version: v, description: n, author: a, main: "main.js", private: true }, null, 2) + "\n")' \
      "$name" "$slug" "$version" "$author" "$stage"

    for target in $targets; do
      case "$target" in windows) platform=win32; exe="$name" ;; linux) platform=linux; exe="$slug" ;; esac
      "$tools/node_modules/.bin/electron-packager" "$stage" "$name" --platform="$platform" --arch=x64 \
        --electron-version="$ELECTRON_VERSION" --executable-name="$exe" --app-version="$version" \
        --asar --overwrite --quiet --out="$build" >"$build/$target.log" 2>&1 \
        || die "package: the $target build failed ($(tail -1 "$build/$target.log"))"
      out="dist/$target/$name"
      rm -rf "$out"; mkdir -p "dist/$target"
      mv "$build/$name-$platform-x64" "$out"

      if [ "$target" = windows ]; then
        icon="game/icon-512.png"; [ -f "$icon" ] || icon="game/icon-192.png"
        if [ -f "$icon" ] && python3 -c "from PIL import Image
Image.open('$icon').convert('RGBA').save('$build/icon.ico', sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])" 2>/dev/null; then
          node "$here/desktop-icon.mjs" "$tools/node_modules" "$out/$name.exe" "$build/icon.ico" "$name" "$version" \
            || echo "windows icon: couldn't be set (the game still runs, with Electron's icon)"
        else
          echo "windows icon: none (no game/icon-512.png, or no Pillow); it shows Electron's icon"
        fi
        run="$out/$name.exe"
      else
        run="$out/$exe"
      fi

      zip="dist/$slug-$target.zip"; rm -f "$zip"
      (cd "dist/$target" && zip -qry "../$slug-$target.zip" "$name") || die "package: couldn't zip the $target build"
      echo "built: $target $run ($(du -sh "$out" | cut -f1); zip $zip)"
    done
    rm -rf "$build"
    ;;

  test)
    app="${1:?test needs the Linux build folder}"; shot="${2:?test needs a screenshot path}"
    exe="$(find "$app" -maxdepth 1 -type f -perm -u+x ! -name '*.so*' ! -name chrome-sandbox ! -name chrome_crashpad_handler | head -1)"
    [ -n "$exe" ] || die "package test: no app in $app"
    command -v Xvfb >/dev/null 2>&1 || die "package test: needs Xvfb (a virtual display) to run the app"
    if command -v ldd >/dev/null 2>&1 && ldd "$exe" 2>/dev/null | grep -q 'not found'; then
      die "package test: the app can't start here: missing $(ldd "$exe" | grep 'not found' | awk '{print $1}' | tr '\n' ' ')(on Ubuntu or Debian: sudo apt-get install libgtk-3-0 libnss3 libasound2 libgbm1)"
    fi
    pw=""
    for dir in "$(npm root -g 2>/dev/null)/@playwright/cli/node_modules" "$(npm root -g 2>/dev/null)" "$PWD/node_modules"; do
      [ -d "$dir/playwright-core" ] && { pw="$dir/playwright-core"; break; }
    done
    [ -n "$pw" ] || die "package test: needs Playwright (playwright-cli, or npm install playwright-core)"

    display=":$(( (RANDOM % 400) + 100 ))"
    Xvfb "$display" -screen 0 1280x720x24 -nolisten tcp >/dev/null 2>&1 &
    xvfb=$!; trap 'kill $xvfb 2>/dev/null' EXIT; sleep 2
    DISPLAY="$display" node - "$pw" "$exe" "$shot" <<'NODE'
const [pw, exe, shot] = process.argv.slice(2);
const { _electron } = require(pw);
(async () => {
  // A virtual display has no graphics card: draw with Chrome's software
  // renderer, as the web play-test does. (Only here; players keep their GPU.)
  const app = await _electron.launch({ executablePath: exe, timeout: 60000,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const win = await app.firstWindow();
  const problems = [];
  win.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  win.on('pageerror', (e) => problems.push(e.message));
  await win.waitForTimeout(6000);
  const info = await win.evaluate(async () => ({
    address: location.href,
    title: document.title,
    desktop: typeof window.desktop === 'object',
    fullscreen: window.desktop ? await window.desktop.isFullscreen() : null,
    size: `${innerWidth}x${innerHeight}`,
    saves: (() => { try { localStorage.setItem('gamegen-test', '1'); const ok = localStorage.getItem('gamegen-test') === '1'; localStorage.removeItem('gamegen-test'); return ok; } catch { return false; } })(),
  }));
  await win.screenshot({ path: shot });
  await app.close();
  console.log(`app: ${info.title} at ${info.address} (${info.size}, ${info.fullscreen ? 'full screen' : 'windowed'})`);
  console.log(`desktop bridge: ${info.desktop ? 'yes' : 'NO'}; saves: ${info.saves ? 'ok' : 'NOT WORKING'}`);
  console.log(`screenshot: ${shot}`);
  console.log(problems.length ? `console errors: ${problems.length}\n  ${problems.slice(0, 5).join('\n  ')}` : 'console errors: none');
  process.exit(info.desktop && info.saves && !problems.length ? 0 : 1);
})().catch((e) => { console.log(`package test: the app didn't start (${e.message.split('\n')[0]})`); process.exit(1); });
NODE
    ;;

  *) die "usage: package.sh build <windows|linux|both> \"<Game name>\" [version] [\"<author>\"] | test <dist/linux/<Game name>> <screenshot.png>" ;;
esac
