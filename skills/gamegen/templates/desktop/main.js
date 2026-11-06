// The desktop app around a gamegen web game (Electron), made by
// scripts/package.sh. The game itself is unchanged in game/: it's served
// from a private app:// address, so its modules, fetches and saves work
// exactly as they do on the web, and nothing is loaded from the internet.
'use strict';
const { app, BrowserWindow, Menu, ipcMain, net, protocol, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const GAME = path.join(__dirname, 'game');
const ORIGIN = 'app://game';

// On Linux (and Steam Deck), Chromium's sandbox helper needs setuid root,
// which a Steam download doesn't keep, so Electron would refuse to start.
// The app only ever runs its own bundled game, never web pages, so it runs
// without that sandbox there.
if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox');

// A real origin for the game: saves (localStorage) stay put between updates.
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true, allowServiceWorkers: true },
}]);

// The offline service worker isn't needed in a desktop app: everything is
// already local. A do-nothing one keeps the game's own registration happy.
const NO_SW = "self.addEventListener('install', () => self.skipWaiting());\n" +
  "self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));\n";

// Remember whether the player chose a window or full screen.
const settingsFile = () => path.join(app.getPath('userData'), 'window.json');
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch { return { fullscreen: true }; }
}
function saveSettings(s) {
  try { fs.writeFileSync(settingsFile(), JSON.stringify(s)); } catch { /* not important */ }
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let file = decodeURIComponent(url.pathname);
    if (file.endsWith('/')) file += 'index.html';
    if (file === '/sw.js') return new Response(NO_SW, { headers: { 'content-type': 'text/javascript' } });
    const full = path.normalize(path.join(GAME, file));
    if (full !== GAME && !full.startsWith(GAME + path.sep)) return new Response('', { status: 403 });
    return net.fetch(pathToFileURL(full).toString());
  });

  Menu.setApplicationMenu(null);
  const settings = loadSettings();
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    fullscreen: settings.fullscreen !== false,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), sandbox: true },
  });
  win.once('ready-to-show', () => win.show());

  const setFullscreen = (on) => {
    win.setFullScreen(on);
    saveSettings({ ...loadSettings(), fullscreen: on });
  };
  // F11, or Alt+Enter, switches between full screen and a window.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
      setFullscreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  // Links out of the game (the gallery, GitHub) open in the player's browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(ORIGIN)) {
      event.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });

  ipcMain.on('desktop:quit', () => app.quit());
  ipcMain.on('desktop:fullscreen', (_event, on) => setFullscreen(typeof on === 'boolean' ? on : !win.isFullScreen()));
  ipcMain.handle('desktop:isFullscreen', () => win.isFullScreen());

  win.loadURL(ORIGIN + '/');
});

app.on('window-all-closed', () => app.quit());
