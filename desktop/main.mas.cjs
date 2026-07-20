const { app, BrowserWindow, shell } = require("electron");
const productionUrl = "https://enigma-kanban.onrender.com/";

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 520,
    title: "Enigma",
    backgroundColor: "#020617",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const appUrl = process.env.ENIGMA_DEV_URL || productionUrl;
  window.loadURL(appUrl);

  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== new URL(appUrl).origin) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
