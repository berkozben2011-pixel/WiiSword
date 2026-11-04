const { app, BrowserWindow } = require('electron');
const path = require('path');
let mainWindow;
let rawInputModule = null;
try { rawInputModule = require('./native/build/Release/raw_input.node'); }
catch (error) { console.warn('Raw Input modülü yüklenemedi; klavye/gamepad/tek mouse modları kullanılabilir.', error.message); }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  mainWindow.loadFile('index.html');
  mainWindow.webContents.once('did-finish-load', () => {
    let enabled = false;
    if (rawInputModule) {
      try { rawInputModule.startListening(data => mainWindow?.webContents.send('raw-mouse-input', data)); enabled = true; }
      catch (e) { console.error('Raw Input başlatılamadı:', e); }
    }
    mainWindow.webContents.send('raw-input-status', enabled);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { try { rawInputModule?.stopListening(); } catch (_) {} if (process.platform !== 'darwin') app.quit(); });
