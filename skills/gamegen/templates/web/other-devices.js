// other-devices.js: the notice a game shows on the kind of device it isn't
// made for (gamegen's references/web-target.md, "On other devices"). Copy it
// into the game unchanged, load it before the game's code, and call
// otherDevices.show({...}) as the game starts. The game supplies the words,
// and styles .od-notice, .od-box, .od-main, .od-quiet and .od-link to match.
(() => {
  'use strict';
  const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const remember = (k) => { try { localStorage.setItem(k, '1'); } catch {} };
  const fine = () => matchMedia('(any-pointer: fine)');
  let close = null, onKey = null;
  // Listen from the start, so the notice sees a key before any game listener.
  addEventListener('keydown', (e) => { if (close) onKey(e); }, true);

  // A desktop-only game shows it on touch-only devices: never a touchscreen
  // laptop, never the desktop app. A mobile-only game, on devices with no
  // touch at all. It tests the device, not the window's width.
  const wrongDevice = (kind) => (kind === 'mobile-only'
    ? navigator.maxTouchPoints === 0
    : navigator.maxTouchPoints > 0 && !fine().matches) && !window.desktop;

  window.otherDevices = {
    // kind: 'desktop-only' or 'mobile-only'; heading, text: the design's
    // "On other devices" words; main: the main button ("Send link to
    // yourself"), quiet: the quieter one ("Look around anyway", or "Play
    // anyway" only if the game can really be finished there); copied,
    // shared: what to say after copying or sharing the link; key: the game's
    // save-key prefix; onClose(): resume the game's AudioContext (the
    // dismissing press counts as the first input). Returns false, calling
    // nothing, when the notice isn't needed.
    show(o) {
      const saved = `${o.key || 'game'}-other-devices`;
      if (close || !wrongDevice(o.kind) || stored(saved) === '1') return false;
      const back = document.activeElement;
      const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
      };
      const root = el('div', 'od-notice');
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-labelledby', 'od-heading');
      const box = el('div', 'od-box');
      const h = el('h2', '', o.heading);
      h.id = 'od-heading';
      const p = el('p', '', o.text);
      const say = el('p', 'od-said');
      say.setAttribute('aria-live', 'polite');
      const main = el('button', 'od-main', o.main || 'Send link to yourself');
      const quiet = el('button', 'od-quiet', o.quiet || 'Look around anyway');
      box.append(h, p, main, quiet, say);
      root.append(box);
      const css = el('style');
      // Plain defaults the game's own styles always win over (:where has no
      // weight, and this goes first in <head>).
      css.textContent = ':where(.od-notice){position:fixed;inset:0;z-index:1000;display:flex;'
        + 'align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px}'
        + ':where(.od-box){max-width:28em;font-size:18px;line-height:1.4;text-align:center;'
        + 'background:#fff;color:#111;padding:1em;border-radius:8px}'
        + ':where(.od-box button){min-height:44px;min-width:44px;margin:6px;font:inherit}'
        + ':where(.od-link){width:100%;font:inherit}';
      document.head.prepend(css);

      const url = location.origin + location.pathname;
      main.addEventListener('click', async () => {
        if (navigator.share) {
          try { await navigator.share({ url }); say.textContent = o.shared || 'Link sent'; return; }
          catch (e) { if (e?.name === 'AbortError') return; }
        }
        try { await navigator.clipboard.writeText(url); say.textContent = o.copied || 'Link copied'; return; } catch {}
        const box2 = el('input', 'od-link');
        box2.readOnly = true;
        box2.value = url;
        say.replaceChildren(box2);
        box2.focus();
        box2.select();
      });

      const mq = fine();
      const onPointer = () => { if (mq.matches && o.kind !== 'mobile-only') close(false); };
      // Any key or controller button dismisses it, except Tab and the modifier
      // keys (which move between its buttons) and Enter or Space (which press
      // the focused one). The press that dismisses it never reaches the game.
      onKey = (e) => {
        if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
        if (e.ctrlKey || e.metaKey || e.target?.classList?.contains('od-link')) return; // copying the link
        if ((e.key === 'Enter' || e.key === ' ') && root.contains(document.activeElement)
          && document.activeElement.tagName === 'BUTTON') { e.stopImmediatePropagation(); return; }
        e.preventDefault();
        e.stopImmediatePropagation();
        close(true);
      };
      close = (dismissed) => {
        mq.removeEventListener?.('change', onPointer);
        root.remove();
        css.remove();
        close = null;
        if (dismissed) remember(saved);
        (back && back !== document.body ? back : document.querySelector('canvas'))?.focus?.();
        try { o.onClose?.(); } catch {}
      };
      quiet.addEventListener('click', () => close(true));
      mq.addEventListener?.('change', onPointer);
      document.body.append(root);
      main.focus();
      return true;
    },
    isOpen() { return !!close; },
    // The game's controller layer calls this on a new button press while
    // isOpen(), and does nothing else with that press.
    dismiss() { close?.(true); },
  };
})();
