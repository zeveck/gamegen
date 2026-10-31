#!/usr/bin/env bash
# Films the game's first load on a slow connection, the way a player on a
# phone sees it, as one filmstrip picture:
#
#   first-load.sh <session> <address> <filmstrip.png>
#
# <session> is a playwright-cli session already open at the size to test
# (run from the folder playwright-cli was started in). The browser cache is
# off while filming, so nothing loads from an earlier visit. It prints when
# each frame was taken, when the fonts finished, and when the picture
# changed; once the title is up, nothing should change.
#
# It uses the browser's own screen capture, because Playwright's screenshots
# wait for web fonts first, which hides exactly the flicker this looks for.
set -u
session="${1:?usage: first-load.sh <session> <address> <filmstrip.png>}"
url="${2:?usage: first-load.sh <session> <address> <filmstrip.png>}"
out="${3:?usage: first-load.sh <session> <address> <filmstrip.png>}"
case "$url" in http://*|https://*) ;; *) echo "first-load: the address must start with http:// or https://"; exit 1 ;; esac
here="$(cd "$(dirname "$0")" && pwd)"
raw="$(mktemp)"; trap 'rm -f "$raw"' EXIT
url_js="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$url")"

playwright-cli -s="$session" run-code "async page => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // About a slow 4G phone connection.
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 90000 });
  const frames = [];
  const t0 = Date.now();
  let settledAt = 0;
  try {
    await page.goto($url_js, { waitUntil: 'commit' });
    // Keep filming until the page has loaded and its fonts are in, plus two
    // seconds to catch anything that moves after that (at most 25 seconds).
    while (Date.now() - t0 < 25000) {
      const t = Date.now() - t0;
      const s = await page.evaluate(() => [document.readyState, document.fonts.status]).catch(() => ['loading', 'loading']);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
      frames.push({ t, ready: s[0], fonts: s[1], data });
      if (!settledAt && s[0] === 'complete' && s[1] === 'loaded') settledAt = t;
      if (settledAt && t - settledAt > 2000) break;
      await page.waitForTimeout(100);
    }
  } finally {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  }
  return frames;
}" > "$raw" || { cat "$raw"; exit 1; }

python3 "$here/filmstrip.py" "$raw" "$out"
