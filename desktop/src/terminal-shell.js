import { escapeAttribute } from "./terminal-utils.js";

export function renderTerminalShell(shortcuts) {
  return `<main class="app">
    <header class="titlebar">
      <h1>SWEET MAHOGANY BOARDS TERMINAL</h1>
      <div class="titlebar-actions">
        <button id="choose-folder" class="button" type="button">Choose folder</button>
        <button id="new-tab" class="button primary" type="button">+ New tab</button>
        <button id="settings" class="button" type="button" aria-haspopup="dialog">Settings</button>
      </div>
    </header>
    <nav id="tabs" class="tabs" aria-label="Terminal tabs"></nav>
    <section class="toolbar" aria-label="Terminal commands">
      ${shortcuts.map(([label, command]) => `<button class="button command" type="button" data-command="${escapeAttribute(command)}">${label}</button>`).join("")}
      <span class="spacer"></span>
      <button id="search-toggle" class="button" type="button" aria-expanded="false">Search</button>
      <button id="copy" class="button" type="button">Copy</button>
      <button id="paste" class="button" type="button">Paste</button>
      <button id="clear" class="button" type="button">Clear</button>
      <button id="restart" class="button" type="button">Restart</button>
      <button id="history" class="button" type="button" aria-haspopup="dialog">History</button>
      <button id="ai-explain" class="button" type="button" disabled title="AI is not configured">Explain error (AI)</button>
    </section>
    <section id="searchbar" class="searchbar" aria-label="Search terminal output">
      <label class="sr-only" for="search-input">Search terminal output</label>
      <input id="search-input" type="search" placeholder="Search output" />
      <button id="search-previous" class="button" type="button">Previous</button>
      <button id="search-next" class="button" type="button">Next</button>
      <button id="search-close" class="button" type="button" aria-label="Close search">×</button>
    </section>
    <section id="terminal-stage" class="terminal-stage" aria-label="Active terminal"></section>
    <footer class="statusbar" aria-live="polite">
      <span id="status-primary" class="status-primary">Starting terminal…</span>
      <span id="status-badge" class="status-badge">Local only</span>
    </footer>
  </main>`;
}
