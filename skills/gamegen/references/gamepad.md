# Controllers (`--gamepad`)

Read this when the game has controller support: with `--gamepad`, when the
request asks for it in words ("play it with my PS5 controller", "gamepad
support"), and for `--package steam` (Steam Deck is a controller). Write
`Gamepad: yes` in the settings in `design/STATUS.md`, so `--change` and
`--continue` keep it.

The aim: someone plugs a PlayStation 5 controller (DualSense) into their
computer, by USB or Bluetooth, and plays the whole game with it, from the
title screen to the credits, without touching the keyboard. Xbox, Switch Pro,
8BitDo and other controllers work the same way, each with its own button
names.

## Where it works

Browsers read controllers through the Gamepad API. Chrome and Edge (and the
desktop app, which is built on Chrome) give a DualSense the standard layout
on Windows, macOS and Linux, over USB or Bluetooth, and so does Safari on a
Mac. Firefox's layout for some controllers isn't standard, so the game's
controls screen says "Controllers work best in Chrome or Edge" when the
controller it sees doesn't report `mapping === 'standard'`. Nothing to
install, and no permission prompt.

What a web page can't use: the DualSense's adaptive triggers, light bar,
speaker and touchpad gestures (they need WebHID, which asks the player's
permission). Rumble is fine (see below).

## The design

The controls table gets a full Gamepad column: every action, every menu.
Name buttons by position in the design (bottom, right, left, top face
button), and let the game show each controller's own names:

| Position | PlayStation | Xbox | Nintendo |
|---|---|---|---|
| bottom (button 0) | ✕ (cross) | A | B |
| right (1) | ○ (circle) | B | A |
| left (2) | □ (square) | X | Y |
| top (3) | △ (triangle) | Y | X |
| 4, 5 / 6, 7 | L1, R1 / L2, R2 | LB, RB / LT, RT | L, R / ZL, ZR |
| 8 / 9 | Create / Options | View / Menu | − / + |

- The left stick and the d-pad move (and move through menus); the right stick
  aims or turns the camera, if the game has either.
- Bottom (✕) confirms, jumps or does the main action; right (○) goes back or
  cancels; Options (9) pauses. Keep to these: players expect them.
- L2/R2 are analog (`value` 0 to 1), good for accelerating or charging.

## Building it

Add the controller to the input layer that already turns keys and touches
into game actions (see "Input" in web-target.md), so the game code still only
asks "is jump pressed?".

- **Read it every update.** Call `navigator.getGamepads()` each update and
  use the first connected controller. Don't keep the `Gamepad` object
  between updates: some browsers give a fresh copy each time, and a kept one
  never changes.
- **Edges, like keys.** Compare each button with the last update to get
  "just pressed" and "just released", exactly as the keyboard does.
- **Dead zone.** Ignore the stick within 0.25 of the center (measure the
  length of `(x, y)`, not each axis alone), so a resting stick never drifts.
- **Menus by stick.** In menus, the stick and d-pad move the focus once, then
  repeat after 350 ms, every 120 ms while held. The focused button is
  clearly marked (a bright outline or a pointer), and every screen,
  including settings, credits and the pause menu, can be used with the
  controller alone.
- **"Press any button."** Browsers only reveal a controller after one of its
  buttons is pressed. On the title screen, when nothing has been seen yet,
  show "Press any button" alongside "Press any key" (or "Press Enter").
- **The right names.** Show the names of the controller the player last
  used, from its `id`:
  - PlayStation: `/054c|dualsense|dualshock|playstation|wireless controller/i`
    (a DualSense calls itself "DualSense Wireless Controller", or just
    "Wireless Controller").
  - Xbox: `/045e|xbox|xinput/i`. Nintendo: `/057e|pro controller|joy-con/i`.
  - Anything else: the Xbox names.

  Draw the PlayStation symbols as shapes in code (a cross, circle, square and
  triangle, in white or the game's UI color), not as text: many game fonts
  have no ✕ or △. Prompts ("✕ Jump", "Press ○ to go back") switch to
  keyboard keys the moment a key is pressed, and back when the controller is
  used: whatever the player touched last.
- **Unplugged mid-game.** On `gamepaddisconnected`, pause, with "Controller
  disconnected" on the pause screen, until it's back or a key is pressed.
- **Rumble (optional, small):** on a hit or a landing,
  `pad.vibrationActuator?.playEffect('dual-rumble', { duration: 120, strongMagnitude: 0.6, weakMagnitude: 0.3 })`,
  inside `try`. A "Vibration" toggle in settings, remembered with the other
  settings. Never rumble constantly.
- **Two controllers** are only for games designed for two players; otherwise
  the first connected one plays.
- **The debug hook** reports the last input used: add
  `input: 'keyboard' | 'touch' | 'gamepad'` and the controller `id` to
  `__game.state()`.

## Play-testing it

There's no controller in the play-test's browser, so give it a pretend one:
replace `navigator.getGamepads` before the game loads, with a controller the
test can press. In `playwright-cli`, add it with `run-code` and reload
(`playwright-cli -s=desktop run-code "async page => { await page.addInitScript(…); await page.reload(); }"`),
then press with `eval` (`playwright-cli -s=desktop eval "() => __pad.connect()"`).
The script, for `addInitScript`:

```js
await page.addInitScript(() => {
  const blank = () => ({ pressed: false, touched: false, value: 0 });
  const pad = { id: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
    index: 0, connected: false, mapping: 'standard', timestamp: 0,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, blank) };
  const fire = (type) => {
    const e = new Event(type);
    Object.defineProperty(e, 'gamepad', { value: pad });
    window.dispatchEvent(e);
  };
  window.__pad = {
    connect(id) { if (id) pad.id = id; pad.connected = true; fire('gamepadconnected'); },
    disconnect() { pad.connected = false; fire('gamepaddisconnected'); },
    button(i, down) { pad.buttons[i] = down ? { pressed: true, touched: true, value: 1 } : blank(); pad.timestamp = performance.now(); },
    stick(x, y) { pad.axes[0] = x; pad.axes[1] = y; pad.timestamp = performance.now(); },
  };
  navigator.getGamepads = () => [pad.connected ? pad : null, null, null, null];
});
```

It needs a real page load (`page.goto`), not `setContent`. The game polls,
so hold each press for at least 50 ms (three frames) before releasing it,
or the game may never see it. A 3D game frozen for the play-test (`step` in
3d.md) doesn't update while you wait, so there, press the button, call
`step(0.1)`, release it, and call `step(0.1)` again. Then, as well as the usual
play-test:

1. **PlayStation:** `__pad.connect()`, and play from the title screen through
   the first level and back to the title, controller only: start, pause
   (Options, button 9), every menu and setting, back (○, button 1). Take a
   screenshot of each screen with button names, and look at them: ✕ ○ □ △
   drawn clearly, never as empty boxes.
2. **Xbox:** reload, `__pad.connect('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')`,
   and check the prompts say A, B, X, Y.
3. **Switching:** press a key: prompts show keys. Press a button: they show
   the controller again.
4. **Unplugged:** `__pad.disconnect()` mid-level pauses the game and says so.
5. **Recorded solutions** keep working by keyboard; also replay the first
   level's solution with the pretend controller, translated from its keys.

## In the report and README

The controls section lists the controller buttons beside the keys, and the
report says plainly: "Plug in a PS5 controller (USB or Bluetooth) and press
any button; it works best in Chrome or Edge."
