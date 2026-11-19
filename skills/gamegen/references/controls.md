# Controls players can change (`--controls`)

Read this for `--controls`. It lets players change which keys (and, with
`--gamepad`, which controller buttons) do what, from a **Controls** screen.
It's for web games and web exports. Write `Controls: changeable` in
`design/STATUS.md`'s settings, so later runs keep it.

Given alone on a finished game, it's a small change: follow "Changing a
finished game" in change.md, with no design review. **The game's default
controls stay exactly as they are:** this adds a way to change them, and
never changes them itself.

## The design

List every gameplay action, with its default keys (up to two) and, with
`--gamepad`, its default button, plus pause, marked fixed: shown on the
Controls screen but never changed, so the player can always reach the menus
to put things right. Menus aren't actions: they keep their own keys
(Enter, Space or ✕ to confirm; Escape or ○ to go back) and read them
directly.

## Building it

Copy `${CLAUDE_SKILL_DIR}/templates/web/controls.js` into the game unchanged,
load it before the game's code, and give it the actions:

```js
const controls = gameControls.setup({ key: 'pp3', actions: {
  jump:  { name: 'Jump', keys: ['Space', 'KeyZ'], pad: [0] },
  pause: { name: 'Pause', keys: ['Escape', 'KeyP'], pad: [9], fixed: true },
} });
```

It keeps the bindings, saves them with the game's other settings, swaps
when a key is taken ("Z was Jump's; Jump now has Space"), refuses one that
would leave another action with nothing, and names keys ("Space", "Z",
"↑"). Then:

- **The input layer asks it:** `controls.keyAction(e.code)` and
  `controls.padAction(i)`, never a hard-coded key.
- **Everything that names a control asks it too:** prompts, hints, key caps,
  How to Play, tutorial signs and the controls list, through one label
  function (`controls.label(code)` for keys; the controller's own names from
  gamepad.md for buttons). Never a hard-coded "Press Z".
- **The Controls screen** (from Settings, in the game's own style, usable by
  mouse, touch, keyboard and controller): each action with its keys and
  button. Choosing one says "Press a key" (or "Press a button"), and starts
  listening only once the press that chose it is released; a controller
  button binds when it's released, so holding ○/B for a second cancels
  instead (so does Escape). Say what a swap changed. Arrows show in the
  game's font only if it has them; otherwise draw them as icons. "Reset to defaults" (`controls.reset()`) asks first.
- The "Report a bug" shortcut (feedback.md) isn't an action and can't be
  bound.

Touch controls aren't remapped.

## Play-testing it

1. Change two actions' keys, one onto a key another action had: the swap is
   shown, and both actions work with their new keys in a level.
2. Every prompt, hint and the How to Play screen show the new keys.
3. Reload: the new keys are still there. Reset: the defaults are back.
4. The fixed actions can't be changed, and Escape always reaches the pause
   menu, whatever else was changed.
5. With a controller: the same, with `__pad` (gamepad.md).
