# Sweet Mahogany Boards

Sweet Mahogany Boards is a full-stack Kanban application for organizing work into account-scoped workspaces, boards, columns, and cards. It includes a responsive browser interface, a secured ASP.NET Core API, PostgreSQL persistence, and an optional macOS desktop wrapper with a real local terminal.

Production application (legacy deployment URL): [https://enigma-kanban.onrender.com](https://enigma-kanban.onrender.com)

## What Sweet Mahogany Boards can do

- Register with email verification, log in securely, and reset forgotten passwords by email.
- Download a complete JSON account export or permanently delete an account and its data.
- Keep every user's workspaces and project data isolated from other accounts.
- Create and delete workspaces.
- Create and delete boards inside a workspace.
- Automatically create `Backlog`, `Ready`, `In Progress`, `Testing`, and `Done` columns for a new board.
- Create, edit, move, prioritize, schedule, and delete cards.
- Reorder cards and drag them between columns.
- Display useful validation and API error messages.
- Work across desktop and mobile screen sizes.
- Provide an onboarding workspace and starter board for every new account.
- Run as a hosted web application or an optional Electron desktop application.
- Open a native local shell from the desktop application.
- Use multiple terminal tabs, project folders, reviewed shortcuts, output search, persistent settings, and session restoration in the Community edition.

Sweet Mahogany Boards currently provides private, account-scoped project management. Real-time multi-user editing, workspace invitations, comments, notifications, file attachments, and role-based team permissions are not yet implemented.

## Technology

| Area | Technology |
| --- | --- |
| Web client | React 19, TypeScript, Vite, Tailwind CSS |
| Data fetching | Axios |
| Drag and drop | dnd-kit |
| API | ASP.NET Core 10 |
| Authentication | JWT bearer tokens and ASP.NET password hashing |
| Database | PostgreSQL and Entity Framework Core |
| Testing | Vitest, Testing Library, jest-axe, xUnit |
| Desktop | Electron, xterm.js, node-pty |
| Hosting | Docker and Render Blueprint |

## Application structure

```text
Kanban Board/
├── client/                 React web application
│   ├── public/             Static icons and brand assets
│   └── src/
│       ├── api/            Axios setup and error handling
│       ├── components/     Board, layout, UI, and terminal components
│       ├── pages/          Authentication and dashboard pages
│       ├── services/       Typed API calls
│       └── types/          Client-side domain types
├── server/                 ASP.NET Core API
│   ├── Auth/               Authenticated-user helpers
│   ├── Controllers/        Authentication and Kanban endpoints
│   ├── Data/               EF Core context and onboarding seed
│   ├── Migrations/         PostgreSQL schema migrations
│   ├── Middleware/         Structured request error logging
│   ├── Models/             Database entities and validation
│   └── Monitoring/         Database health check
├── server.Tests/           API integration and workflow tests
├── desktop/                Electron wrapper and terminal bridge
├── scripts/                PostgreSQL backup tooling
├── Dockerfile              Production multi-stage image
└── render.yaml             Render web service and database Blueprint
```

## How the data is organized

```text
User
└── Workspace
    └── Board
        └── Column
            └── Card
```

Deleting a workspace removes its boards, columns, and cards. Deleting a board removes its columns and cards. The interface asks for confirmation before these destructive actions.

Each authenticated API query verifies ownership through this hierarchy. Knowing another record's UUID does not grant access to it.

## New-account experience

Registration automatically creates:

- `My Workspace`
- `Getting Started` board
- `To Do`, `In Progress`, and `Done` columns
- Four instructional starter cards

These records belong only to the new user. They can be edited, moved, or deleted like normal project data.

## Prerequisites

For local web development:

- Node.js 20 or newer
- npm
- .NET 10 SDK
- PostgreSQL 15 or newer
- Entity Framework Core CLI (`dotnet-ef`)

Install the EF Core CLI if it is not already available:

```bash
dotnet tool install --global dotnet-ef
```

The desktop application additionally requires the macOS build tools needed to compile `node-pty`.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/ToddJewellMyers/enigma.git
cd enigma
```

### 2. Create PostgreSQL database configuration

Create a local PostgreSQL database named `enigma_kanban`, then export the API configuration. Replace the sample database credentials with your own values.

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=enigma_kanban;Username=postgres;Password=postgres'
export Jwt__Key='replace-with-a-random-secret-at-least-32-characters-long'
export PublicAppUrl='http://localhost:5173'
export Email__FromAddress='no-reply@your-domain.example'
export Email__Smtp__Host='smtp.your-provider.example'
export Email__Smtp__Port='587'
export Email__Smtp__Username='your-smtp-user'
export Email__Smtp__Password='your-smtp-password'
export Email__Smtp__EnableSsl='true'
```

Development CORS origins are already defined in `server/appsettings.Development.json` for Vite's usual local ports.

### 3. Apply the database schema

```bash
dotnet ef database update --project server/server.csproj
```

### 4. Start the API

```bash
dotnet run --project server/server.csproj
```

The development API runs at `http://localhost:5273`. Swagger is available only in development at `http://localhost:5273/swagger`.

### 5. Start the web client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The committed `client/.env.development` sends API requests to `http://localhost:5273/api`.

### 6. Create an account

Choose **Need an account? Register**, enter a valid email address and a password containing at least eight characters, and submit the form. Open the verification link sent by email to activate the account and log in. Existing accounts created before this feature are treated as verified during migration.

If a password is forgotten, choose **Forgot your password?** on the login screen. Reset links expire after one hour, verification links expire after 24 hours, and the server stores only hashes of both token types.

## Environment variables

### API variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ConnectionStrings__DefaultConnection` | Yes | PostgreSQL connection string or `postgresql://` URL |
| `Jwt__Key` | Yes | JWT signing secret; must contain at least 32 bytes |
| `Cors__AllowedOrigins__0` | Outside same-origin Render deployment | Exact permitted frontend origin |
| `Database__ApplyMigrationsOnStartup` | No | Applies EF migrations during API startup when `true` |
| `Proxy__ForwardedHeadersEnabled` | Behind trusted hosting proxy | Honors forwarded client IP and HTTPS protocol |
| `ASPNETCORE_ENVIRONMENT` | Recommended | `Development`, `Testing`, or `Production` |
| `ASPNETCORE_URLS` | Hosting dependent | HTTP address and port used by Kestrel |

Additional CORS origins use increasing indexes such as `Cors__AllowedOrigins__1`. Origins must be exact HTTP or HTTPS URLs without wildcards.

### Client variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | API base URL; defaults to same-origin `/api` |

Never put a password, database URL, JWT secret, or private API key in a `VITE_*` variable. Vite embeds these values in browser-delivered JavaScript.

Example files are provided at `.env.example`, `client/.env.example`, and `server/appsettings.Production.example.json`.

## Using Sweet Mahogany Boards

### Workspaces

Use the left sidebar to select a workspace. Enter a name at the bottom of the sidebar and select **+ Workspace** to create one. Use the delete control beside a workspace to remove it and everything inside it.

### Boards

Select a workspace, enter a board name, and select **+ Board**. New boards receive five workflow columns automatically. Use the board tabs to switch boards or the delete control to remove a board.

### Cards

Enter a title at the top of a column and select **+** to create a card. A card can contain:

- A title up to 200 characters
- A description up to 4,000 characters
- `Low`, `Normal`, `High`, or `Urgent` priority
- An optional due date

Drag cards to reorder them or move them to another column. Open a card to edit its details, or use its delete action to remove it.

### Signing out

Use the logout control in the application header. The browser removes the locally stored JWT and returns to the login page.

## API reference

All resource endpoints require this header:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and receive a JWT |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET` | `/api/workspaces` | List the current user's workspaces |
| `POST` | `/api/workspaces` | Create a workspace |
| `DELETE` | `/api/workspaces/{workspaceId}` | Delete a workspace and descendants |
| `GET` | `/api/boards/{workspaceId}` | List boards in an owned workspace |
| `POST` | `/api/boards` | Create a board |
| `DELETE` | `/api/boards/{boardId}` | Delete a board and descendants |
| `GET` | `/api/columns/{boardId}` | List a board's ordered columns |
| `POST` | `/api/columns` | Create a column |
| `GET` | `/api/cards/{columnId}` | List a column's ordered cards |
| `POST` | `/api/cards` | Create a card |
| `PUT` | `/api/cards/{cardId}` | Edit card details |
| `PUT` | `/api/cards/{cardId}/move` | Move or reorder a card |
| `DELETE` | `/api/cards/{cardId}` | Delete a card |
| `GET` | `/health/live` | Confirm the API process is responding |
| `GET` | `/health/ready` | Confirm the API can reach PostgreSQL |

Authentication endpoints are limited to ten requests per minute per client IP. Validation errors use standard ASP.NET problem responses where applicable, and production exception details are not returned to clients.

## Validation limits

| Value | Rule |
| --- | --- |
| Email | Required and must be a valid email address |
| Password | Required; 8–128 characters |
| Workspace name | Required; maximum 100 characters |
| Board name | Required; maximum 100 characters |
| Column name | Required; maximum 100 characters |
| Card title | Required; maximum 200 characters |
| Card description | Optional; maximum 4,000 characters |
| Card priority | `Low`, `Normal`, `High`, or `Urgent` |
| Card/column position | Positive integer |

## Automated verification

Run the complete project checks:

```bash
dotnet test server.Tests/server.Tests.csproj

cd client
npm run lint
npm test
npm run build
```

The API integration suite covers health, authentication, onboarding data, workspace lifecycle, board lifecycle, ordered columns, card creation, editing, movement, and deletion. It uses an isolated in-memory database and never changes PostgreSQL data.

The client suite includes automated accessibility checks using Testing Library and `jest-axe`.

## Production build

Build the web client:

```bash
cd client
npm ci
npm run build
```

Publish the API:

```bash
dotnet publish server/server.csproj --configuration Release
```

The repository's multi-stage `Dockerfile` performs both operations and copies the compiled React application into ASP.NET's `wwwroot`. The final container serves the UI and API from the same origin on port `10000`.

## Deploying to Render

The root `render.yaml` defines:

- `enigma-kanban`: paid Starter Docker web service in Ohio
- `enigma-postgres`: paid Basic PostgreSQL database in Ohio
- Automatic deployment after commits reach the configured GitHub branch
- Automatic EF Core migrations during startup
- A generated JWT signing secret
- A private PostgreSQL connection string
- `/health/ready` as the deployment health check
- SMTP-backed verification and password-reset email configuration through secret environment variables

To create the deployment:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint**.
3. Connect `ToddJewellMyers/enigma`.
4. Select the repository's `render.yaml` Blueprint.
5. Review the paid service and database resources.
6. Apply the Blueprint and wait for `/health/ready` to pass.
7. Open the assigned `onrender.com` address.

Before enabling registration, set `Email__FromAddress`, `Email__Smtp__Host`, `Email__Smtp__Username`, and `Email__Smtp__Password` in Render. Without valid SMTP settings, the service remains available to existing accounts but returns a clear temporary-unavailability response for registration and password-reset email requests.

Render terminates HTTPS and injects its public hostname into the API's allowed same-origin configuration. Add a custom domain from the Render service settings when one is available; Render can then provision its TLS certificate.

## Desktop editions

Sweet Mahogany Boards has two macOS desktop targets:

- **Sweet Mahogany Boards Community** is intended for open-source distribution through GitHub Releases. It includes a real local login shell through xterm.js and `node-pty`.
- **Sweet Mahogany Boards for the Mac App Store** excludes the terminal, enables Apple App Sandbox and Electron renderer sandboxing, and requests only outbound network access.

Both editions load the production Sweet Mahogany Boards service by default. The terminal runs only on the user's computer and is never exposed by the hosted browser or App Store edition.

Install desktop dependencies:

```bash
cd desktop
npm install
```

For desktop development, start PostgreSQL and the API, start the Vite client, then run:

```bash
cd desktop
npm run dev
```

Build unsigned Community DMG and ZIP packages:

```bash
cd desktop
npm run dist:community:unsigned
```

Verify the Mac App Store package structure up to Apple's required signing step:

```bash
cd desktop
npm run verify:mas-structure
```

Community artifacts appear under `desktop/dist/community`; App Store artifacts appear under `desktop/dist/mas`. Public direct distribution still requires Developer ID signing and notarization. App Store submission requires Apple Distribution signing, a provisioning profile, an App Store Connect record, listing assets, and review.

See [`desktop/README.md`](desktop/README.md) for build instructions and [`desktop/APP_STORE_CHECKLIST.md`](desktop/APP_STORE_CHECKLIST.md) for the submission checklist.

## Security

Sweet Mahogany Boards currently includes:

- Password hashing through ASP.NET Core Identity's password hasher
- Seven-day signed JWT authentication
- Minimum 32-byte JWT signing keys
- Per-user ownership checks on every Kanban resource query
- Rate limiting on registration and login
- Exact-origin CORS validation
- HTTPS redirection and HSTS in production
- Content Security Policy and defensive browser headers
- Structured error logging without returning exception details
- PostgreSQL isolated from public inbound connections on Render
- Secrets supplied through environment variables instead of source control

For a commercial launch, also establish a vulnerability-update routine, terms of service, incident-response process, dedicated support contact, finalized data-retention policy, and independent security review. The repository includes the initial [`PRIVACY.md`](PRIVACY.md) notice, which must be published at a stable public URL and reviewed whenever data handling changes.

## Monitoring and health checks

- `GET /health/live` confirms that Kestrel is responding.
- `GET /health/ready` confirms that the API can connect to PostgreSQL.

Use readiness for deployment health checks and external uptime alerts. A database outage returns HTTP 503 without exposing database details.

Production logs are emitted as structured JSON to standard output. Unhandled request errors include the HTTP method, request path, and trace ID. Problem responses expose the same trace ID for support correlation.

## Database backups

Prefer the database provider's encrypted automated backups and point-in-time recovery. Sweet Mahogany Boards also includes a portable logical backup script:

```bash
export DATABASE_URL='postgresql://user:password@host:5432/enigma?sslmode=require'
export BACKUP_DIR='/secure/offsite/location'
export BACKUP_RETENTION_DAYS=14
./scripts/backup-postgres.sh
```

The script creates a restrictive custom-format `pg_dump`, validates it with `pg_restore --list`, and deletes dumps older than the configured retention period. Schedule it on durable encrypted storage outside the API container and test restoration regularly.

Example restore test:

```bash
createdb enigma_restore_test
pg_restore --no-owner --no-privileges --dbname=enigma_restore_test backup.dump
```

## Troubleshooting

### The client loads but requests fail

- Confirm the API is running at `http://localhost:5273`.
- Confirm `client/.env.development` contains `VITE_API_URL=http://localhost:5273/api`.
- Restart Vite after changing an environment file.
- Check that the frontend origin exactly matches an allowed CORS origin.

### The API stops during startup

- Verify `ConnectionStrings__DefaultConnection` is present and PostgreSQL is reachable.
- Verify `Jwt__Key` is at least 32 bytes.
- Verify at least one CORS origin is configured, unless Render supplies `RENDER_EXTERNAL_HOSTNAME`.
- Apply pending migrations with `dotnet ef database update --project server/server.csproj`.

### Login suddenly returns unauthorized

JWTs expire after seven days. Signing out and logging in obtains a fresh token. Changing `Jwt__Key` immediately invalidates every existing token.

### Render reports an unhealthy deployment

- Open `/health/live`. If it fails, inspect application startup logs.
- Open `/health/ready`. If only readiness fails, inspect the PostgreSQL connection and migration logs.
- Confirm the web service and database are in the same configured region.
- Confirm Render injected `ConnectionStrings__DefaultConnection` from `enigma-postgres`.

### The desktop terminal does not open

- Confirm Sweet Mahogany Boards is running inside Electron rather than a normal web browser.
- Reinstall desktop dependencies so `node-pty` is compiled for the current Electron version.
- On macOS, ensure command-line developer tools are installed.

## Current release considerations

Before presenting Sweet Mahogany Boards as a finished multi-user commercial service, consider adding:

- Refresh-token or secure cookie session strategy
- Workspace invitations and member roles
- Real-time updates for simultaneous users
- Audit history and activity feeds
- Card comments and file attachments
- Search, filters, and notifications
- End-to-end browser tests
- Automated dependency and container scanning
- Signed and notarized desktop releases

## License

Sweet Mahogany Boards is open-source software released under the [MIT License](LICENSE). You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies subject to the license's copyright-notice and permission-notice requirements.
