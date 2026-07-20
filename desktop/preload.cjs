const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enigmaTerminal", {
  create: (dimensions) => ipcRenderer.invoke("terminal:create", dimensions),
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
