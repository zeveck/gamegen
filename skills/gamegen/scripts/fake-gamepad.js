// fake-gamepad.js: a pretend controller for play-tests, since the play-test's
// browser has none. gamepad.md says how to load it (addInitScript with this
// file's path, then a reload). Press with eval: __pad.connect(id?),
// __pad.disconnect(), __pad.button(i, down), __pad.stick(x, y).
(() => {
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
})();
