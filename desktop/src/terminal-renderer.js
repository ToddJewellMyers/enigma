import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { defaultSettings, shortcuts, storageKeys, themes } from "./terminal-config.js";
import { readJson } from "./terminal-utils.js";
import { renderTerminalShell } from "./terminal-shell.js";
import { createDialogController } from "./terminal-dialogs.js";

const api = window.enigmaTerminal;
const sessions = new Map();
let activeId = "";
let environment;
let settings = readJson(storageKeys.settings, defaultSettings);
let commandHistory = readJson(storageKeys.history, []);

document.querySelector("#app").innerHTML = renderTerminalShell(shortcuts);

const tabsElement = document.querySelector("#tabs");
const stageElement = document.querySelector("#terminal-stage");
const statusElement = document.querySelector("#status-primary");
const searchbar = document.querySelector("#searchbar");
const searchInput = document.querySelector("#search-input");

const removeDataListener = api.onData((id, data) => sessions.get(id)?.terminal.write(data));
const removeExitListener = api.onExit((id, exitCode) => {
  const state = sessions.get(id);
  if (!state) return;
  state.running = false;
  state.exitCode = exitCode;
  state.terminal.writeln(`\r\n[Shell exited with code ${exitCode}]`);
  renderTabs();
  renderStatus();
});

async function initialize() {
  environment = await api.environment();
  const restoredTabs = readJson(storageKeys.tabs, []);
  const definitions = restoredTabs.length ? restoredTabs : [{ name: "Terminal 1", cwd: environment.homeDirectory }];
  for (const definition of definitions.slice(0, 8)) await createTab(definition.cwd, definition.name, false);
  switchTab([...sessions.keys()][0]);
  persistTabs();
}

async function createTab(cwd = environment.homeDirectory, name, activate = true) {
  const pane = document.createElement("div");
  pane.className = "terminal-pane";
  stageElement.append(pane);

  const terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: settings.cursorStyle,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    scrollback: settings.scrollback,
    theme: themes[settings.theme] || themes.enigma
  });
  const fitAddon = new FitAddon();
  const searchAddon = new SearchAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(searchAddon);
  terminal.open(pane);
  fitAddon.fit();
  const created = await api.create({ cwd, cols: terminal.cols, rows: terminal.rows });
  const state = {
    ...created,
    name: name || `Terminal ${sessions.size + 1}`,
    terminal,
    fitAddon,
    searchAddon,
    pane,
    running: true,
    exitCode: null,
    command: created.shell,
    pendingCommand: "",
    disposables: []
  };
  sessions.set(created.id, state);
  state.disposables.push(terminal.onData((data) => handleTerminalInput(state, data)));
  const observer = new ResizeObserver(() => {
    if (!state.pane.classList.contains("active")) return;
    fitAddon.fit();
    api.resize(state.id, terminal.cols, terminal.rows);
  });
  observer.observe(pane);
  state.observer = observer;
  renderTabs();
  persistTabs();
  if (activate) switchTab(created.id);
  return state;
}

function handleTerminalInput(state, data) {
  api.write(state.id, data);
  if (data === "\r") {
    const command = state.pendingCommand.trim();
    if (command) rememberCommand(command);
    state.pendingCommand = "";
  } else if (data === "\u007f") {
    state.pendingCommand = state.pendingCommand.slice(0, -1);
  } else if (!/[\u0000-\u001f]/.test(data)) {
    state.pendingCommand += data;
  }
}

function switchTab(id) {
  if (!sessions.has(id)) return;
  activeId = id;
  for (const [candidateId, state] of sessions) state.pane.classList.toggle("active", candidateId === id);
  renderTabs();
  requestAnimationFrame(() => {
    const state = sessions.get(id);
    state.fitAddon.fit();
    api.resize(id, state.terminal.cols, state.terminal.rows);
    state.terminal.focus();
  });
  renderStatus();
}

function closeTab(id) {
  const state = sessions.get(id);
  if (!state) return;
  if (state.running && !window.confirm(`Close ${state.name} and stop its shell?`)) return;
  api.close(id);
  disposeState(state);
  sessions.delete(id);
  if (activeId === id) switchTab([...sessions.keys()][0] || "");
  renderTabs();
  renderStatus();
  persistTabs();
}

async function restartActiveTab() {
  const state = sessions.get(activeId);
  if (!state) return;
  if (state.running && !window.confirm(`Restart ${state.name} and stop its current shell?`)) return;
  const { cwd, name, id } = state;
  api.close(id);
  disposeState(state);
  sessions.delete(id);
  await createTab(cwd, name, true);
}

function disposeState(state) {
  state.observer.disconnect();
  state.disposables.forEach((disposable) => disposable.dispose());
  state.terminal.dispose();
  state.pane.remove();
}

function renderTabs() {
  tabsElement.innerHTML = "";
  for (const [id, state] of sessions) {
    const wrapper = document.createElement("div");
    wrapper.className = `tab${id === activeId ? " active" : ""}`;
    const select = document.createElement("button");
    select.type = "button";
    select.className = "tab-select";
    select.textContent = `${state.running ? "●" : "○"} ${state.name}`;
    select.title = state.cwd;
    select.setAttribute("aria-current", id === activeId ? "page" : "false");
    select.addEventListener("click", () => switchTab(id));
    select.addEventListener("dblclick", () => renameTab(id));
    const close = document.createElement("button");
    close.type = "button";
    close.className = "tab-close";
    close.textContent = "×";
    close.setAttribute("aria-label", `Close ${state.name}`);
    close.addEventListener("click", () => closeTab(id));
    wrapper.append(select, close);
    tabsElement.append(wrapper);
  }
}

function renderStatus() {
  const state = sessions.get(activeId);
  if (!state) {
    statusElement.textContent = "No terminal open";
    return;
  }
  const status = state.running ? "running" : `exited ${state.exitCode}`;
  statusElement.textContent = `${state.cwd}  •  ${state.command || state.shell}  •  PID ${state.pid}  •  ${status}`;
}

function renameTab(id) {
  const state = sessions.get(id);
  if (!state) return;
  const nextName = window.prompt("Terminal tab name", state.name)?.trim();
  if (!nextName) return;
  state.name = nextName.slice(0, 40);
  renderTabs();
  persistTabs();
}

function runReviewedCommand(command) {
  const state = sessions.get(activeId);
  if (!state?.running) return;
  if (!window.confirm(`Run this command in ${state.name}?\n\n${command}`)) return;
  api.write(state.id, `${command}\r`);
  rememberCommand(command);
  state.terminal.focus();
}

function rememberCommand(command) {
  commandHistory = [command, ...commandHistory.filter((item) => item !== command)].slice(0, 100);
  localStorage.setItem(storageKeys.history, JSON.stringify(commandHistory));
}

function persistTabs() {
  const definitions = [...sessions.values()].map(({ name, cwd }) => ({ name, cwd }));
  localStorage.setItem(storageKeys.tabs, JSON.stringify(definitions));
}

function applySettings() {
  for (const state of sessions.values()) {
    state.terminal.options.fontSize = settings.fontSize;
    state.terminal.options.fontFamily = settings.fontFamily;
    state.terminal.options.cursorStyle = settings.cursorStyle;
    state.terminal.options.scrollback = settings.scrollback;
    state.terminal.options.theme = themes[settings.theme] || themes.enigma;
    if (state.pane.classList.contains("active")) state.fitAddon.fit();
  }
  localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
}

const dialogs = createDialogController({
  defaultSettings,
  getSettings: () => settings,
  setSettings: (nextSettings) => { settings = nextSettings; },
  getHistory: () => commandHistory,
  runCommand: runReviewedCommand,
  applySettings
});

document.querySelector("#new-tab").addEventListener("click", () => createTab(sessions.get(activeId)?.cwd));
document.querySelector("#choose-folder").addEventListener("click", async () => {
  const selected = await api.chooseDirectory(sessions.get(activeId)?.cwd);
  if (selected) await createTab(selected, selected.split("/").filter(Boolean).pop() || "Project");
});
document.querySelectorAll(".command").forEach((button) => button.addEventListener("click", () => runReviewedCommand(button.dataset.command)));
document.querySelector("#clear").addEventListener("click", () => sessions.get(activeId)?.terminal.clear());
document.querySelector("#restart").addEventListener("click", restartActiveTab);
document.querySelector("#copy").addEventListener("click", async () => {
  const selection = sessions.get(activeId)?.terminal.getSelection();
  if (selection) await api.writeClipboard(selection);
});
document.querySelector("#paste").addEventListener("click", async () => {
  const state = sessions.get(activeId);
  if (!state?.running) return;
  const text = await api.readClipboard();
  if (text) {
    api.write(state.id, text);
    state.terminal.focus();
  }
});
document.querySelector("#history").addEventListener("click", dialogs.showHistory);
document.querySelector("#settings").addEventListener("click", dialogs.showSettings);
document.querySelector("#search-toggle").addEventListener("click", () => toggleSearch(true));
document.querySelector("#search-close").addEventListener("click", () => toggleSearch(false));
document.querySelector("#search-next").addEventListener("click", () => sessions.get(activeId)?.searchAddon.findNext(searchInput.value));
document.querySelector("#search-previous").addEventListener("click", () => sessions.get(activeId)?.searchAddon.findPrevious(searchInput.value));
searchInput.addEventListener("input", () => sessions.get(activeId)?.searchAddon.findNext(searchInput.value, { incremental: true }));
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") { event.preventDefault(); createTab(sessions.get(activeId)?.cwd); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") { event.preventDefault(); toggleSearch(true); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") { event.preventDefault(); if (activeId) closeTab(activeId); }
});
window.addEventListener("beforeunload", () => {
  removeDataListener();
  removeExitListener();
  for (const [id, state] of sessions) { api.close(id); disposeState(state); }
});

const statusTimer = window.setInterval(async () => {
  const state = sessions.get(activeId);
  if (!state?.running) return;
  try {
    const nextStatus = await api.status(state.id);
    state.cwd = nextStatus.cwd;
    state.command = nextStatus.command;
    renderStatus();
    persistTabs();
  } catch {
    // The exit event owns terminal failure reporting.
  }
}, 2000);
window.addEventListener("beforeunload", () => window.clearInterval(statusTimer));

function toggleSearch(open) {
  searchbar.classList.toggle("open", open);
  document.querySelector("#search-toggle").setAttribute("aria-expanded", String(open));
  if (open) searchInput.focus();
  else sessions.get(activeId)?.terminal.focus();
}

initialize().catch((error) => {
  statusElement.textContent = `Terminal failed to start: ${error.message}`;
  document.querySelector("#status-badge").textContent = "Unavailable";
});
