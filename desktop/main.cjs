const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const os = require("node:os");
const { randomUUID } = require("node:crypto");
const pty = require("node-pty");

const sessions = new Map();
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
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
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

  window.on("closed", () => closeSessionsForWindow(window.webContents.id));
}

function closeSessionsForWindow(ownerId) {
  for (const [sessionId, session] of sessions) {
    if (session.ownerId === ownerId) {
      session.process.kill();
      sessions.delete(sessionId);
    }
  }
}

ipcMain.handle("terminal:create", (event, dimensions = {}) => {
  const shellPath = process.env.SHELL || "/bin/zsh";
  const sessionId = randomUUID();
  const processInstance = pty.spawn(shellPath, ["-l"], {
    name: "xterm-256color",
    cols: clampDimension(dimensions.cols, 20, 400, 100),
    rows: clampDimension(dimensions.rows, 5, 200, 30),
    cwd: os.homedir(),
    env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" }
  });

  sessions.set(sessionId, { ownerId: event.sender.id, process: processInstance });
  processInstance.onData((data) => {
    if (!event.sender.isDestroyed()) event.sender.send("terminal:data", sessionId, data);
  });
  processInstance.onExit(({ exitCode }) => {
    sessions.delete(sessionId);
    if (!event.sender.isDestroyed()) event.sender.send("terminal:exit", sessionId, exitCode);
  });
  return sessionId;
});

ipcMain.on("terminal:input", (event, sessionId, data) => {
  const session = ownedSession(event.sender.id, sessionId);
  if (session && typeof data === "string" && data.length <= 65536) session.process.write(data);
});

ipcMain.on("terminal:resize", (event, sessionId, cols, rows) => {
  const session = ownedSession(event.sender.id, sessionId);
  if (session) session.process.resize(clampDimension(cols, 20, 400, 100), clampDimension(rows, 5, 200, 30));
});

ipcMain.on("terminal:close", (event, sessionId) => {
  const session = ownedSession(event.sender.id, sessionId);
  if (session) {
    session.process.kill();
    sessions.delete(sessionId);
  }
});

function ownedSession(ownerId, sessionId) {
  if (typeof sessionId !== "string") return undefined;
  const session = sessions.get(sessionId);
  return session?.ownerId === ownerId ? session : undefined;
}

function clampDimension(value, minimum, maximum, fallback) {
  return Number.isInteger(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
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
