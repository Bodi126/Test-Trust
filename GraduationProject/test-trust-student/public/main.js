const { app, BrowserWindow } = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');
const net = require('net');
const { exec } = require('child_process');

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

    const port = process.env.PORT || 3001;
    const startUrl = process.env.REACT_APP_ELECTRON_START_URL || `http://localhost:${port}`;
    
    // Function to check if port is available
    const isPortTaken = (port, fn) => {
        const tester = net.createServer()
            .once('error', err => {
                if (err.code !== 'EADDRINUSE') return fn(err);
                fn(null, true);
            })
            .once('listening', () => {
                tester.once('close', () => {
                    fn(null, false);
                }).close();
            })
            .listen(port);
    };

    // Function to load the URL with retries
    const loadApp = (retries = 5, delay = 1000) => {
        const tryLoad = (attempt) => {
            mainWindow.loadURL(startUrl)
                .catch(err => {
                    console.error(`Attempt ${attempt} failed:`, err.message);
                    if (attempt < retries) {
                        console.log(`Retrying in ${delay}ms...`);
                        setTimeout(() => tryLoad(attempt + 1), delay);
                    } else {
                        console.error('All retries failed. Please make sure the development server is running.');
                        mainWindow.loadFile(path.join(__dirname, 'fallback.html'));
                    }
                });
        };
        tryLoad(1);
    };

    // Check if port is available before loading
    isPortTaken(port, (err, taken) => {
        if (err) {
            console.error('Error checking port:', err);
            return;
        }
        if (taken) {
            console.log(`Port ${port} is in use, attempting to load app...`);
            loadApp();
        } else {
            console.log(`Port ${port} is not in use. Make sure the development server is running.`);
        }
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