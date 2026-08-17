const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, session, shell } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const pty = require("node-pty");

const execFileAsync = promisify(execFile);

const productionUrl = "https://enigma-kanban.onrender.com/";
const sessions = new Map();
let mainWindow;
let terminalWindow;
let isQuitting = false;

function createMainWindow() {
  const appUrl = process.env.SWEET_MAHOGANY_DEV_URL || process.env.ENIGMA_DEV_URL || productionUrl;
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 520,
    title: "Sweet Mahogany Boards Community",
    backgroundColor: "#020617",
    webPreferences: {
      preload: path.join(__dirname, "desktop-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadURL(appUrl);
  lockNavigation(mainWindow, new URL(appUrl).origin);
  mainWindow.on("closed", () => {
    mainWindow = undefined;
    if (terminalWindow && !terminalWindow.isDestroyed()) terminalWindow.close();
  });
}

function installApplicationMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Sweet Mahogany Boards Community",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { label: "Open Terminal", accelerator: "CommandOrControl+Shift+T", click: openTerminalWindow },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    { role: "help", submenu: [{ label: "Sweet Mahogany Boards on GitHub", click: () => shell.openExternal("https://github.com/ToddJewellMyers/enigma") }] }
  ]);
  Menu.setApplicationMenu(menu);
}

function openTerminalWindow() {
  if (terminalWindow && !terminalWindow.isDestroyed()) {
    terminalWindow.show();
    terminalWindow.focus();
    return;
  }

  terminalWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    title: "Sweet Mahogany Boards Terminal",
    backgroundColor: "#020617",
    webPreferences: {
      preload: path.join(__dirname, "terminal-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  terminalWindow.loadFile(path.join(__dirname, "terminal.html"));
  lockNavigation(terminalWindow, "file://");
  const terminalOwnerId = terminalWindow.webContents.id;
  terminalWindow.on("close", (event) => {
    if (isQuitting || !hasSessionsForOwner(terminalOwnerId)) return;
    const choice = dialog.showMessageBoxSync(terminalWindow, {
      type: "warning",
      buttons: ["Keep terminals open", "Close terminals"],
      defaultId: 0,
      cancelId: 0,
      title: "Close active terminals?",
      message: "Closing this window will stop every running terminal session."
    });
    if (choice === 0) event.preventDefault();
  });
  terminalWindow.on("closed", () => {
    closeSessionsForOwner(terminalOwnerId);
    terminalWindow = undefined;
  });
}

function lockNavigation(window, allowedOrigin) {
  window.webContents.on("will-navigate", (event, url) => {
    const nextOrigin = url.startsWith("file:") ? "file://" : new URL(url).origin;
    if (nextOrigin !== allowedOrigin) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("desktop:open-terminal", (event) => {
  if (event.sender.id !== mainWindow?.webContents.id) return false;
  openTerminalWindow();
  return true;
});

ipcMain.handle("terminal:get-environment", (event) => {
  assertTerminalOwner(event.sender.id);
  return {
    homeDirectory: os.homedir(),
    shell: process.env.SHELL || "/bin/zsh",
    aiAvailable: false
  };
});

ipcMain.handle("terminal:choose-directory", async (event, initialDirectory) => {
  assertTerminalOwner(event.sender.id);
  const defaultPath = validDirectory(initialDirectory) ? initialDirectory : os.homedir();
  const result = await dialog.showOpenDialog(terminalWindow, {
    title: "Choose a terminal project folder",
    defaultPath,
    properties: ["openDirectory", "createDirectory"]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("terminal:clipboard-read", (event) => {
  assertTerminalOwner(event.sender.id);
  return clipboard.readText().slice(0, 65536);
});

ipcMain.handle("terminal:clipboard-write", (event, text) => {
  assertTerminalOwner(event.sender.id);
  if (typeof text !== "string" || text.length > 65536) return false;
  clipboard.writeText(text);
  return true;
});

ipcMain.handle("terminal:create", (event, options = {}) => {
  assertTerminalOwner(event.sender.id);
  const shellPath = process.env.SHELL || "/bin/zsh";
  const cwd = validDirectory(options.cwd) ? options.cwd : os.homedir();
  const sessionId = randomUUID();
  const processInstance = pty.spawn(shellPath, ["-l"], {
    name: "xterm-256color",
    cols: clampDimension(options.cols, 20, 400, 100),
    rows: clampDimension(options.rows, 5, 200, 30),
    cwd,
    env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" }
  });

  sessions.set(sessionId, { ownerId: event.sender.id, process: processInstance, cwd });
  processInstance.onData((data) => {
    if (!event.sender.isDestroyed()) event.sender.send("terminal:data", sessionId, data);
  });
  processInstance.onExit(({ exitCode }) => {
    sessions.delete(sessionId);
    if (!event.sender.isDestroyed()) event.sender.send("terminal:exit", sessionId, exitCode);
  });
  return { id: sessionId, cwd, shell: path.basename(shellPath), pid: processInstance.pid };
});

ipcMain.handle("terminal:status", async (event, sessionId) => {
  const owned = ownedSession(event.sender.id, sessionId);
  if (!owned) throw new Error("Terminal session not found.");
  const cwd = await readProcessDirectory(owned.process.pid, owned.cwd);
  const command = await readForegroundCommand(owned.process.pid, owned.process.process);
  owned.cwd = cwd;
  return { cwd, command };
});

ipcMain.on("terminal:input", (event, sessionId, data) => {
  const owned = ownedSession(event.sender.id, sessionId);
  if (owned && typeof data === "string" && data.length <= 65536) owned.process.write(data);
});

ipcMain.on("terminal:resize", (event, sessionId, cols, rows) => {
  const owned = ownedSession(event.sender.id, sessionId);
  if (owned) owned.process.resize(clampDimension(cols, 20, 400, 100), clampDimension(rows, 5, 200, 30));
});

ipcMain.on("terminal:close", (event, sessionId) => {
  const owned = ownedSession(event.sender.id, sessionId);
  if (owned) {
    owned.process.kill();
    sessions.delete(sessionId);
  }
});

function assertTerminalOwner(ownerId) {
  if (!terminalWindow || terminalWindow.isDestroyed() || terminalWindow.webContents.id !== ownerId) {
    throw new Error("Terminal access denied.");
  }
}

function validDirectory(candidate) {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function ownedSession(ownerId, sessionId) {
  if (typeof sessionId !== "string") return undefined;
  const candidate = sessions.get(sessionId);
  return candidate?.ownerId === ownerId ? candidate : undefined;
}

function hasSessionsForOwner(ownerId) {
  return [...sessions.values()].some((candidate) => candidate.ownerId === ownerId);
}

function closeSessionsForOwner(ownerId) {
  for (const [sessionId, candidate] of sessions) {
    if (candidate.ownerId === ownerId) {
      candidate.process.kill();
      sessions.delete(sessionId);
    }
  }
}

function clampDimension(value, minimum, maximum, fallback) {
  return Number.isInteger(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

async function readProcessDirectory(pid, fallback) {
  try {
    const { stdout } = await execFileAsync("/usr/sbin/lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], { timeout: 1000, maxBuffer: 32768 });
    return stdout.split("\n").find((line) => line.startsWith("n"))?.slice(1) || fallback;
  } catch {
    return fallback;
  }
}

async function readForegroundCommand(shellPid, fallback) {
  try {
    const { stdout: children } = await execFileAsync("/usr/bin/pgrep", ["-P", String(shellPid)], { timeout: 1000, maxBuffer: 32768 });
    const childPid = children.trim().split("\n").filter(Boolean).at(-1);
    if (!childPid) return fallback;
    const { stdout: command } = await execFileAsync("/bin/ps", ["-o", "command=", "-p", childPid], { timeout: 1000, maxBuffer: 32768 });
    return command.trim() || fallback;
  } catch {
    return fallback;
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  installApplicationMenu();
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  for (const candidate of sessions.values()) candidate.process.kill();
  sessions.clear();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
