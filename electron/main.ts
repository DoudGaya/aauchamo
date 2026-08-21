import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
const PROD_URL = 'https://erp.aauchamo.com'; // Change this to actual production URL
const DEV_URL = 'http://localhost:3000';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('localhost:3000') && !url.includes('erp.aauchamo.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const loadUrl = isDev ? DEV_URL : PROD_URL;
  
  const loadWithRetry = () => {
    win.loadURL(loadUrl).catch((err) => {
      console.error('Failed to load URL:', err);
      if (isDev) {
        console.log('Retrying in 3 seconds...');
        setTimeout(loadWithRetry, 3000);
      }
    });
  };
  
  loadWithRetry();

  if (isDev) {
    // Optionally open dev tools
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('app-notify', (event, { title, body }) => {
  // Custom IPC handling
});
