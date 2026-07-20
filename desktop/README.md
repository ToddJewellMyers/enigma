# Enigma desktop

Electron container for Enigma Kanban with an integrated xterm.js and node-pty
terminal. It keeps `nodeIntegration` disabled and exposes only create, write,
resize, close, data, and exit operations through the preload bridge.

```bash
# Terminal 1
cd client && npm run dev

# Terminal 2
cd desktop && npm run dev
```

The Kanban API must also be running for board operations. The terminal itself is
local and does not depend on the API.
