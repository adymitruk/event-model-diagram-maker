const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("emdApi", {
  open: () => ipcRenderer.invoke("emd:open"),
  save: (html) => ipcRenderer.invoke("emd:save", html),
  saveAs: (html) => ipcRenderer.invoke("emd:save-as", html),
  currentPath: () => ipcRenderer.invoke("emd:current-path"),
  onLoaded: (handler) => {
    ipcRenderer.on("emd:loaded", (_event, payload) => handler(payload));
  },
});
