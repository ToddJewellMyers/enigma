# Enigma desktop editions

Enigma has two macOS desktop targets built from the same hosted Kanban application.

| Edition | Distribution | Local terminal | Sandbox |
| --- | --- | --- | --- |
| Enigma Community | GitHub Releases / direct download | Yes | Electron renderer sandbox disabled because of `node-pty` |
| Enigma Mac App Store | Mac App Store | No | Apple App Sandbox and Electron renderer sandbox enabled |

Both editions load `https://enigma-kanban.onrender.com/` by default. Development builds can override this with `ENIGMA_DEV_URL`.

## Development

Start the normal Vite client and API, then run the Community shell:

```bash
cd desktop
npm install
npm run dev
```

The development script sets `ENIGMA_DEV_URL=http://localhost:5173`. Board operations still require the local ASP.NET API.

## Community edition

The Community edition exposes a narrow terminal bridge backed by xterm.js and `node-pty`. It allows only terminal create, input, resize, close, output, and exit operations. Sessions are bound to their owning renderer and closed with the window.

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
- Registered App ID matching `com.enigma.kanban.mas`
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
export ENIGMA_MAS_PROVISIONING_PROFILE='/absolute/path/Enigma.provisionprofile'
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

- Navigation is restricted to the configured Enigma origin.
- New HTTPS links open in the system browser.
- Node integration is disabled in both editions.
- Context isolation is enabled in both editions.
- The App Store edition has no preload bridge and runs sandboxed.
- Only the Community edition contains native terminal access.

The Community terminal is intentionally excluded from the Mac App Store edition because an unrestricted login shell conflicts with the App Sandbox permission model.
