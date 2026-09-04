// =============================================================================
// PROJECT JULIE — ELECTRON PRELOAD SCRIPT (SECURE IPC BRIDGE)
// Exposes controlled, sanitized ERP integration methods to the renderer
// without leaking passwords, tokens, or raw Node.js/Electron APIs.
// =============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  uuerp: {
    openLogin: () => ipcRenderer.invoke('uuerp:open-login'),
    fetchPage: (url) => ipcRenderer.invoke('uuerp:fetch-page', url),
    checkSession: () => ipcRenderer.invoke('uuerp:check-session'),
    clearSession: () => ipcRenderer.invoke('uuerp:clear-session'),
    onLoginSuccess: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('uuerp:login-success', handler);
      return () => {
        ipcRenderer.removeListener('uuerp:login-success', handler);
      };
    },
  },
});
