import { clampNumber, escapeAttribute, escapeHtml } from "./terminal-utils.js";

export function createDialogController({ defaultSettings, getSettings, setSettings, getHistory, runCommand, applySettings }) {
  function showSettings() {
    const settings = getSettings();
    showDialog("Terminal settings", `
      <label class="field">Font size<input id="setting-font-size" type="number" min="10" max="28" value="${settings.fontSize}"></label>
      <label class="field">Font family<input id="setting-font-family" value="${escapeAttribute(settings.fontFamily)}"></label>
      <label class="field">Cursor<select id="setting-cursor"><option value="block">Block</option><option value="bar">Bar</option><option value="underline">Underline</option></select></label>
      <label class="field">Theme<select id="setting-theme"><option value="enigma">Sweet Mahogany</option><option value="midnight">Midnight</option><option value="highContrast">High contrast</option></select></label>
      <label class="field">Scrollback lines<input id="setting-scrollback" type="number" min="1000" max="100000" step="1000" value="${settings.scrollback}"></label>`, () => {
        setSettings({
          fontSize: clampNumber(document.querySelector("#setting-font-size").value, 10, 28, 14),
          fontFamily: document.querySelector("#setting-font-family").value.trim() || defaultSettings.fontFamily,
          cursorStyle: document.querySelector("#setting-cursor").value,
          theme: document.querySelector("#setting-theme").value,
          scrollback: clampNumber(document.querySelector("#setting-scrollback").value, 1000, 100000, 10000)
        });
        applySettings();
      }, () => {
        document.querySelector("#setting-cursor").value = settings.cursorStyle;
        document.querySelector("#setting-theme").value = settings.theme;
      });
  }

  function showHistory() {
    const history = getHistory();
    const body = history.length
      ? `<div class="field"><label for="history-select">Recent commands</label><select id="history-select" size="8">${history.map((command) => `<option value="${escapeAttribute(command)}">${escapeHtml(command)}</option>`).join("")}</select></div>`
      : "<p>No commands have been recorded yet.</p>";
    showDialog("Command history", body, () => {
      const command = document.querySelector("#history-select")?.value;
      if (command) runCommand(command);
    }, null, history.length ? "Review and run" : "Close");
  }

  return { showSettings, showHistory };
}

function showDialog(title, body, onConfirm, onReady, confirmLabel = "Save") {
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">${title}</h2>${body}<div class="dialog-actions"><button class="button cancel" type="button">Cancel</button><button class="button primary confirm" type="button">${confirmLabel}</button></div></section>`;
  const close = () => backdrop.remove();
  backdrop.querySelector(".cancel").addEventListener("click", close);
  backdrop.querySelector(".confirm").addEventListener("click", () => { onConfirm(); close(); });
  backdrop.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  document.body.append(backdrop);
  onReady?.();
  backdrop.querySelector("input, select, button")?.focus();
}
