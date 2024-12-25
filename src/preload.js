const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchFinances: () => ipcRenderer.invoke('fetch-finances'),
  addFinance: (data) => ipcRenderer.invoke('add-finance', data),
  deleteFinance: (id) => ipcRenderer.invoke('delete-finance', id),
  updateFinance: (data) => ipcRenderer.invoke('update-finance', data)
});
