const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enigmaDesktop", {
  openTerminal: () => ipcRenderer.invoke("desktop:open-terminal")
});
