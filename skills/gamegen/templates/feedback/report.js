// report.js: the plumbing for a gamegen game's "Report a bug" (the
// gh-feedback form). Copy it into game/vendor/ unchanged and load it as a
// plain script before the game's code, so an error in the game can't stop it:
//   <script src="vendor/report.js"></script>
// The game then calls gameReport.setup({...}) with its own hooks (see
// gamegen's references/feedback.md).
(() => {
  'use strict';
  const form = () => document.getElementById('report');
  const hooks = {};
  let pauseShot = null;

  const flat = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
  const call = (f, ...a) => { try { return f?.(...a); } catch { return undefined; } };
  const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

  // The last few errors, sent with the report.
  const errors = [];
  const keep = (m) => { errors.push(flat(m).slice(0, 200)); errors.splice(0, errors.length - 5); };
  addEventListener('error', (e) => keep(e.message));
  addEventListener('unhandledrejection', (e) => keep(e.reason?.message ?? e.reason));

  // Ctrl+Shift+F (or the game's own letter) opens the report from anywhere,
  // even when the game is stuck. e.code follows the key's position, so it
  // works on any keyboard layout; F alone never opens it.
  addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
    if (e.code !== 'Key' + String(hooks.letter || 'F').toUpperCase()) return;
    const fb = form();
    if (!fb?.getAttribute('repo') || fb.isOpen) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    call(hooks.pause);          // the game pauses, if it still can
    fb.open?.();
  }, true);

  let wired = false;
  function wire() {
    const fb = form();
    if (!fb || wired) return;
    wired = true;
    fb.getScreenshot = () => pauseShot ?? call(hooks.grab);
    fb.getContext = () => {
      const s = call(hooks.state) ?? {};
      return {
        game: flat(hooks.game),
        address: location.origin + location.pathname,
        updated: document.lastModified,
        build: window.desktop ? `desktop app (${window.desktop.platform})` : 'web',
        browser: navigator.userAgent,
        screen: `${innerWidth}x${innerHeight} @${devicePixelRatio}x`,
        input: flat(s.input),
        state: flat(JSON.stringify(s)),
        errors: errors.join(' | ') || 'none',
      };
    };
    // In the desktop app window.open returns nothing, which would read as blocked.
    if (window.desktop) fb.openLink = (url) => { window.open(url, '_blank'); return true; };
    fb.addEventListener('gh-feedback:open', () => call(hooks.releaseAll));
    // iPhones won't type into a box the page's no-select styles reach.
    const css = document.createElement('style');
    css.textContent = 'gh-feedback { -webkit-user-select: text; user-select: text; touch-action: auto; }';
    document.head.append(css);
  }

  window.gameReport = {
    // game: its name; key: its save-key prefix; visibility: 'on' or 'hidden';
    // letter: the shortcut's letter if not F; state(): the debug hook's state;
    // pause(): pause the usual way (taking the snapshot); grab(): a Promise of
    // the play canvas as a PNG Blob; releaseAll(): let go of held input.
    setup(o = {}) {
      Object.assign(hooks, o);
      const key = `${hooks.key || 'game'}-feedback`;
      const q = new URLSearchParams(location.search);
      if (q.has('feedback')) {
        try {
          if (q.get('feedback') === 'off') localStorage.removeItem(key);
          else localStorage.setItem(key, '1');
        } catch {}
      }
      hooks.remembered = () => stored(key) === '1';
      if (wired) return;
      // The game may start before the <gh-feedback> element is in the page.
      if (!form()) { addEventListener('DOMContentLoaded', () => wire(), { once: true }); return; }
      wire();
    },
    // Whether the menus show "Report a bug": call it each time they draw.
    shown() {
      if (!form()?.getAttribute('repo')) return false;
      if (hooks.visibility !== 'hidden') return true;
      return !window.desktop && !!call(hooks.remembered);
    },
    open() { form()?.open?.(); },
    close() { form()?.close?.(); },
    isOpen() { return !!form()?.isOpen; },
    // Call as the game pauses, right after its last frame is drawn, so the
    // report shows the game, not the pause menu; and resumed() as it resumes.
    snapshot() { pauseShot = call(hooks.grab) ?? null; },
    resumed() { pauseShot = null; },
  };
})();
