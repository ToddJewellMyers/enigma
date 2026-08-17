# Sweet Mahogany Boards desktop editions

Sweet Mahogany Boards has two macOS desktop targets built from the same hosted Kanban application.

| Edition | Distribution | Local terminal | Sandbox |
| --- | --- | --- | --- |
| Sweet Mahogany Boards Community | GitHub Releases / direct download | Yes | Electron renderer sandbox enabled; shell runs in the main process |
| Sweet Mahogany Boards Mac App Store | Mac App Store | No | Apple App Sandbox and Electron renderer sandbox enabled |

Both editions load the legacy deployment URL, `https://enigma-kanban.onrender.com/`, by default. Development builds can override this with `SWEET_MAHOGANY_DEV_URL`.

## Development

Start the normal Vite client and API, then run the Community shell:

```bash
cd desktop
npm install
npm run dev
```

The development script sets `SWEET_MAHOGANY_DEV_URL=http://localhost:5173`. Board operations still require the local ASP.NET API.

## Community edition

The Community edition opens its terminal in a separate trusted local window backed by xterm.js and `node-pty`. The remotely hosted Kanban window can request only that this local window be opened; it never receives shell input, output, process identifiers, or terminal session controls.

Terminal features include:

- Multiple named terminal tabs
- Project-folder selection and one-click terminal creation in that folder
- Restored tab names, folders, settings, and command history after reopening
- Reviewed shortcuts for Git status, development servers, tests, and builds
- Output search with next and previous navigation
- Clear output and searchable command history
- Font size, font family, cursor, theme, and scrollback settings
- Directory, shell, PID, and running/exited status information
- `Command/Ctrl+T` for a new tab, `Command/Ctrl+F` for search, and `Command/Ctrl+W` to close a tab
- Keyboard focus indicators, accessible labels, a high-contrast theme, and reduced-motion support
- Confirmation before toolbar/history commands run and before active shells close

The **Explain error (AI)** control is deliberately disabled. No API key is stored and no terminal output is transmitted. It marks the future integration boundary for an opt-in assistant that must present proposed commands for review before execution.

Create an unsigned development package:

```bash
cd desktop
npm run dist:community:unsigned
```

Create a signed package after installing a Developer ID Application certificate in the macOS keychain:

```bash
cd desktop
npm run dist:community
```

Artifacts are written to `desktop/dist/community`.

The `Desktop Community Release` GitHub Actions workflow builds DMG and ZIP artifacts for manually dispatched runs and version tags. Tagged runs also create a GitHub Release. The current workflow produces unsigned packages until Apple signing and notarization secrets are configured.

## Mac App Store edition

The App Store build uses `main.mas.cjs`, does not ship `node-pty` or the terminal preload bridge, enables Electron renderer sandboxing, and requests only outbound network access.

Required Apple assets:

- Active Apple Developer Program membership
- Registered App ID matching `com.sweetmahogany.boards.mas`
- Apple Distribution certificate exported as a password-protected `.p12`
- Mac App Store distribution provisioning profile
- App record in App Store Connect

Verify the MAS package structure up to Apple's required signing step:

```bash
cd desktop
npm run verify:mas-structure
```

Electron Builder will finish assembling the bundle and then report that signing is required. A MAS application cannot be completed or launched unsigned; this command exists to catch configuration and packaging problems before credentials are installed.

Build the signed submission package:

```bash
export SWEET_MAHOGANY_MAS_PROVISIONING_PROFILE='/absolute/path/SweetMahoganyBoards.provisionprofile'
cd desktop
npm run dist:mas
```

The `Desktop Mac App Store Build` workflow expects these protected environment secrets:

| Secret | Value |
| --- | --- |
| `APPLE_DISTRIBUTION_CERTIFICATE_BASE64` | Base64-encoded Apple Distribution `.p12` |
| `APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `MAC_APP_STORE_PROVISIONING_PROFILE_BASE64` | Base64-encoded `.provisionprofile` |

The resulting `.pkg` is placed in `desktop/dist/mas` and uploaded as a private workflow artifact. Upload it to App Store Connect with Transporter after completing the listing and privacy information.

## Security boundaries

- Navigation is restricted to the configured Sweet Mahogany Boards origin.
- New HTTPS links open in the system browser.
- Node integration is disabled in both editions.
- Context isolation is enabled in both editions.
- Renderer sandboxing is enabled in both editions.
- Browser permission requests are denied by default.
- The hosted window can only request that the trusted local terminal window open.
- Terminal IPC is available only inside the trusted local terminal window.
- The App Store edition has no preload bridge and runs sandboxed.
- Only the Community edition contains native terminal access.

The Community terminal is intentionally excluded from the Mac App Store edition because an unrestricted login shell conflicts with the App Sandbox permission model.
