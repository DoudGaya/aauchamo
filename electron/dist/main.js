"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const isDev = process.env.NODE_ENV !== 'production' && !electron_1.app.isPackaged;
const PROD_URL = 'https://aauchamo.vercel.app';
const DEV_URL = 'http://localhost:3000';
function createWindow() {
    const iconPath = path.join(__dirname, '../../public/company-icon.png');
    // Create the main window, initially hidden
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        backgroundColor: '#050505',
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Create a frameless splash window
    const splash = new electron_1.BrowserWindow({
        width: 500,
        height: 350,
        transparent: false,
        backgroundColor: '#050505',
        frame: false,
        alwaysOnTop: true,
        icon: iconPath,
    });
    splash.loadFile(path.join(__dirname, '../splash.html'));
    // Open external links in default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http') && !url.includes('localhost:3000') && !url.includes('erp.aauchamo.com')) {
            electron_1.shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
    const loadUrl = isDev ? DEV_URL : PROD_URL;
    const loadWithRetry = () => {
        win.loadURL(loadUrl).catch((err) => {
            console.error('Failed to load URL:', err);
            // If it fails to load, show a simple error message and retry
            win.loadURL(`data:text/html;charset=utf-8,
        <body style="background:#050505;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
          <h2>Connection Failed</h2>
          <p>Could not connect to ${loadUrl}</p>
          <p>Retrying in 5 seconds...</p>
        </body>
      `);
            setTimeout(loadWithRetry, 5000);
        });
    };
    loadWithRetry();
    // Hide splash and show main window only when the page has successfully loaded
    win.webContents.once('did-finish-load', () => {
        if (!splash.isDestroyed())
            splash.close();
        win.show();
    });
    // Fallback: if it's taking too long to load (e.g. 15 seconds), force show the window anyway so it's not stuck on splash
    setTimeout(() => {
        if (!win.isVisible()) {
            if (!splash.isDestroyed())
                splash.close();
            win.show();
        }
    }, 15000);
    if (isDev) {
        // Optionally open dev tools
        // win.webContents.openDevTools();
    }
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.on('app-notify', (event, { title, body }) => {
    // Custom IPC handling
});
