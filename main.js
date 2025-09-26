const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');

let mainWindow;
let server = null;
let sharedFiles = new Map();
let port = 50001;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function startServer() {
  if (server) {
    return Promise.resolve(port);
  }

  const expressApp = express();

  expressApp.get('/file/:id', (req, res) => {
    const fileId = req.params.id;
    const fileInfo = sharedFiles.get(fileId);

    if (!fileInfo) {
      return res.status(404).send('Archivo no encontrado');
    }

    res.download(fileInfo.path, fileInfo.name, (err) => {
      if (err) {
        console.log('Error al descargar archivo:', err.message);
      }
    });
  });

  expressApp.get('/files', (req, res) => {
    const filesList = Array.from(sharedFiles.entries()).map(([id, info]) => ({
      id: id,
      name: info.name,
      size: info.size,
      type: info.type
    }));
    res.json(filesList);
  });

  return new Promise((resolve, reject) => {
    server = expressApp.listen(port, '0.0.0.0', () => {
      console.log(`Servidor iniciado en puerto ${port}`);
      resolve(port);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Puerto ${port} ocupado, intentando con ${port + 1}`);
        port++;
        server = null;
        startServer().then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName of Object.keys(interfaces)) {
    for (const interface of interfaces[interfaceName]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      type: path.extname(filePath)
    };
  }
  
  return null;
});

ipcMain.handle('share-file', async (event, fileInfo) => {
  const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  
  sharedFiles.set(fileId, {
    path: fileInfo.path,
    name: fileInfo.name,
    size: fileInfo.size,
    type: fileInfo.type
  });

  try {
    const currentPort = await startServer();
    const ip = getLocalIP();
    const fileUrl = `http://${ip}:${currentPort}/file/${fileId}`;

    return {
      id: fileId,
      url: fileUrl,
      ip: ip,
      port: currentPort
    };
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    throw error;
  }
});

ipcMain.handle('remove-file', async (event, fileId) => {
  sharedFiles.delete(fileId);
  
  if (sharedFiles.size === 0 && server) {
    server.close();
    server = null;
    console.log('Servidor detenido - no hay archivos para compartir');
  }
  
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});