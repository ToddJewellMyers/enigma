const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enigmaTerminal", {
  environment: () => ipcRenderer.invoke("terminal:get-environment"),
  chooseDirectory: (initialDirectory) => ipcRenderer.invoke("terminal:choose-directory", initialDirectory),
  readClipboard: () => ipcRenderer.invoke("terminal:clipboard-read"),
  writeClipboard: (text) => ipcRenderer.invoke("terminal:clipboard-write", text),
  create: (options) => ipcRenderer.invoke("terminal:create", options),
  status: (sessionId) => ipcRenderer.invoke("terminal:status", sessionId),
  write: (sessionId, data) => ipcRenderer.send("terminal:input", sessionId, data),
  resize: (sessionId, cols, rows) => ipcRenderer.send("terminal:resize", sessionId, cols, rows),
  close: (sessionId) => ipcRenderer.send("terminal:close", sessionId),
  onData: (callback) => {
    const listener = (_event, sessionId, data) => callback(sessionId, data);
    ipcRenderer.on("terminal:data", listener);
    return () => ipcRenderer.removeListener("terminal:data", listener);
  },
  onExit: (callback) => {
    const listener = (_event, sessionId, exitCode) => callback(sessionId, exitCode);
    ipcRenderer.on("terminal:exit", listener);
    return () => ipcRenderer.removeListener("terminal:exit", listener);
  }
});
