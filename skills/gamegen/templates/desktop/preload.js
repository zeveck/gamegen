// What a packaged game can ask of its desktop app. The game checks for
// window.desktop: it's there only in the desktop app, never on the web, so
// the same game folder works in both.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  quit: () => ipcRenderer.send('desktop:quit'),
  setFullscreen: (on) => ipcRenderer.send('desktop:fullscreen', on),
  isFullscreen: () => ipcRenderer.invoke('desktop:isFullscreen'),
  platform: process.platform,
});
