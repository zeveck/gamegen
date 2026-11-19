// controls.js: the bindings behind a game's Controls screen (gamegen's
// references/controls.md). Copy it into the game unchanged and load it
// before the game's code. The game lists its actions and their defaults:
//   const controls = gameControls.setup({ key: 'pp3', actions: {
//     jump:  { name: 'Jump', keys: ['Space', 'KeyZ'], pad: [0] },
//     pause: { name: 'Pause', keys: ['Escape', 'KeyP'], pad: [9], fixed: true },
//   } });
// Keys are KeyboardEvent.code values; pad entries are standard button indexes.
// List only gameplay actions, plus pause as `fixed` (shown, never changed), so
// the player can always reach the menus. Menus keep their own keys and read
// them directly, not through this.
(() => {
  'use strict';
  const NAMES = { Space: 'Space', Enter: 'Enter', Escape: 'Esc', Backspace: 'Backspace', Tab: 'Tab',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift', ControlLeft: 'Left Ctrl', ControlRight: 'Right Ctrl',
    AltLeft: 'Left Alt', AltRight: 'Right Alt', Comma: ',', Period: '.', Slash: '/', Semicolon: ';',
    Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backquote: '`', Backslash: '\\',
    IntlBackslash: '\\', CapsLock: 'Caps Lock' };
  // Keys a binding can never use: Escape cancels choosing one, and the meta
  // keys belong to the system.
  const NEVER = ['Escape', 'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'ContextMenu'];

  window.gameControls = {
    setup({ key = 'game', actions }) {
      const saveKey = `${key}-controls`;
      const defaults = JSON.parse(JSON.stringify(actions));
      const now = JSON.parse(JSON.stringify(actions));
      try {
        // Saved choices, for actions that still exist; new actions keep their defaults.
        const saved = JSON.parse(localStorage.getItem(saveKey) || '{}');
        for (const [a, b] of Object.entries(saved)) {
          if (!now[a] || now[a].fixed) continue;
          if (Array.isArray(b.keys)) now[a].keys = b.keys.slice(0, 2);
          if (Array.isArray(b.pad)) now[a].pad = b.pad.slice(0, 2);
        }
      } catch {}
      // A key or button on two actions (a newer version of the game took one
      // a player had chosen), or one never allowed: start from the defaults.
      const used = new Set();
      const clash = Object.values(now).some((b) => [...(b.keys || []).map((k) => 'k' + k), ...(b.pad || []).map((p) => 'p' + p)]
        .some((v) => used.size === used.add(v).size || NEVER.includes(v.slice(1)) && !b.fixed));
      if (clash) for (const a of Object.keys(now)) now[a] = JSON.parse(JSON.stringify(defaults[a]));
      const save = () => {
        const out = {};
        for (const [a, b] of Object.entries(now)) if (!b.fixed) out[a] = { keys: b.keys, pad: b.pad };
        try { localStorage.setItem(saveKey, JSON.stringify(out)); } catch {}
      };
      const find = (kind, value) => Object.keys(now).find((a) => (now[a][kind] || []).includes(value)) ?? null;
      // Put value in slot (0 or 1) of action; if another action had it, it
      // takes this action's old value in its place (a swap). Returns the other
      // action's name, or null; false if it can't be bound (a fixed action's
      // key, Escape, or another action's only one).
      const bind = (kind, action, slot, value) => {
        const a = now[action];
        if (!a || a.fixed || (kind === 'keys' && NEVER.includes(value))) return false;
        const list = a[kind] || (a[kind] = []);
        slot = Math.min(slot, list.length);
        const old = list[slot];
        const other = find(kind, value);
        if (other === action) { list.splice(list.indexOf(value), 1); list.splice(slot, 0, value); save(); return null; }
        if (other && now[other].fixed) return false;
        if (other) {
          const theirs = now[other][kind];
          const i = theirs.indexOf(value);
          // Never leave the other action with nothing on this keyboard or controller.
          if (old === undefined && theirs.length === 1) return false;
          if (old === undefined) theirs.splice(i, 1); else theirs[i] = old;
        }
        list[slot] = value;
        save();
        return other;
      };
      return {
        // The action a key or a controller button does, or null.
        keyAction: (code) => find('keys', code),
        padAction: (button) => find('pad', button),
        keys: (action) => (now[action]?.keys || []).slice(),
        pad: (action) => (now[action]?.pad || []).slice(),
        actions: () => Object.keys(now).map((a) => ({ id: a, ...now[a] })),
        bindKey: (action, slot, code) => bind('keys', action, slot, code),
        bindPad: (action, slot, button) => bind('pad', action, slot, button),
        // Remove a second key (an action always keeps at least one).
        clear: (action, slot) => {
          const a = now[action];
          if (!a || a.fixed || (a.keys || []).length <= 1) return false;
          a.keys.splice(slot, 1); save(); return true;
        },
        reset: () => { for (const a of Object.keys(now)) now[a] = JSON.parse(JSON.stringify(defaults[a])); save(); },
        // What to show for a key: "Space", "Z", "↑". (Draw arrows as icons if
        // the game's font lacks them.)
        label: (code) => NAMES[code] ?? code.replace(/^Key|^Digit/, '').replace(/^Numpad/, 'Num '),
      };
    },
  };
})();
