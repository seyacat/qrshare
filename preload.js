const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  shareFile: (fileInfo) => ipcRenderer.invoke('share-file', fileInfo),
  removeFile: (fileId) => ipcRenderer.invoke('remove-file', fileId)
});