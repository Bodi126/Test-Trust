const { app, BrowserWindow } = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');

// Initialize Electron Remote
remoteMain.initialize();

// Configure environment variables
require('dotenv').config();

// Global reference to mainWindow to prevent garbage collection
let mainWindow;

function createWindow() {
    // Create the browser window with improved security settings
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Note: Should be true in production
            enableRemoteModule: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js') // Add a preload script
        }
    });

    // Enable remote module for this window
    remoteMain.enable(mainWindow.webContents);

    // Load the app URL with better error handling
    const startUrl = process.env.DEV_URL || 'http://localhost:3000';
    
    mainWindow.loadURL(startUrl).catch(err => {
        console.error('Failed to load URL:', err);
        mainWindow.loadFile(path.join(__dirname, 'fallback.html'));
    });

    // Show window when content is loaded
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Open DevTools in development
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    });

    // Window event handlers
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle navigation events
    mainWindow.webContents.on('will-navigate', (event, url) => {
        // Optional: Add URL validation logic here
        console.log('Navigating to:', url);
    });

    // Handle unresponsive app
    mainWindow.on('unresponsive', () => {
        console.log('Window is unresponsive');
    });
}

// App event handlers
app.on('ready', () => {
    createWindow();
    
    // Additional initialization can go here
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.yourcompany.testtrust');
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Optional: Handle second instance launches (for single-instance apps)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}