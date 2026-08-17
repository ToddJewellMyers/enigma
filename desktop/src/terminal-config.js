export const storageKeys = {
  tabs: "enigma_terminal_tabs_v1",
  settings: "enigma_terminal_settings_v1",
  history: "enigma_terminal_history_v1"
};

export const themes = {
  enigma: { background: "#1b100c", foreground: "#f5e7d8", cursor: "#f6c453", selectionBackground: "#7a3e2080" },
  midnight: { background: "#030712", foreground: "#dbeafe", cursor: "#60a5fa", selectionBackground: "#1e40af88" },
  highContrast: { background: "#000000", foreground: "#ffffff", cursor: "#ffff00", selectionBackground: "#ffffff55" }
};

export const defaultSettings = {
  fontSize: 14,
  fontFamily: '"SFMono-Regular", Menlo, Monaco, Consolas, monospace',
  cursorStyle: "block",
  theme: "enigma",
  scrollback: 10000
};

export const shortcuts = [
  ["Git status", "git status"],
  ["Start frontend", "npm run dev"],
  ["Start API", "dotnet run --project server/server.csproj"],
  ["Run client tests", "npm test"],
  ["Run API tests", "dotnet test server.Tests/server.Tests.csproj"],
  ["Build client", "npm run build"]
];
