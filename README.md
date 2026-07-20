# Enigma Kanban

Enigma is a responsive Kanban application with account-scoped workspaces,
boards, columns, and cards. It uses a React/Vite frontend, an ASP.NET Core API,
JWT authentication, and PostgreSQL.

## Prerequisites

- Node.js 20 or newer and npm
- .NET 10 SDK
- PostgreSQL 15 or newer
- `dotnet-ef` for applying migrations

Install the EF CLI if needed:

```bash
dotnet tool install --global dotnet-ef
```

## Local setup

1. Create a PostgreSQL database named `enigma_kanban`.
2. Export the API configuration, replacing the credentials with your local
   PostgreSQL username and password:

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=enigma_kanban;Username=postgres;Password=postgres'
export Jwt__Key='local-development-key-at-least-32-characters-long'
```

3. Apply the schema and start the API:

```bash
dotnet ef database update --project server/server.csproj
dotnet run --project server/server.csproj
```

The API starts at `http://localhost:5273`. Swagger is available at
`http://localhost:5273/swagger`.

4. In another terminal, install and start the frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The committed `.env.development` points the
frontend to the local API. New accounts receive a clean onboarding board.

## Environment configuration

- Copy `.env.example` values into your deployment provider's API environment.
- Copy `client/.env.example` for a separately hosted frontend and set
  `VITE_API_URL` to the public API URL.
- Never put secrets in `VITE_*` variables; Vite embeds them in browser code.
- Never commit a real database connection string or JWT signing key.

For production, use HTTPS origins in `Cors__AllowedOrigins__0` and a randomly
generated JWT key. `server/appsettings.Production.example.json` provides the
equivalent JSON configuration.

## Verification

```bash
dotnet test server.Tests/server.Tests.csproj
cd client
npm run lint
npm run test
npm run build
```

The backend tests use an isolated in-memory database and never modify PostgreSQL
data.

## macOS desktop app and terminal

The desktop version wraps the same Enigma interface in Electron and adds a real
local shell powered by a native PTY. Terminal access is exposed only through the
desktop preload bridge; the browser build cannot start local processes.

With the API and frontend development server already running:

```bash
cd desktop
npm install
npm run dev
```

Use the **Boards** and **Terminal** controls in the header to switch workspaces.
The terminal starts the user's login shell in their home directory.

Create an unsigned local macOS package with:

```bash
cd desktop
npm run dist
```

Public distribution requires an Apple Developer ID certificate and notarization
credentials. Do not distribute an unsigned build as a trusted production app.

## Production database

Apply migrations as a release step before starting a newly deployed API:

```bash
dotnet ef database update --project server/server.csproj
```

Legacy SQLite files are intentionally ignored and are not required by the
application. PostgreSQL is the only runtime database provider.

## Always-on Render deployment

The root `render.yaml` provisions an Ohio-region paid Starter web service and a
paid Basic PostgreSQL database. The Docker image builds the React client and
ASP.NET API together, serves both from one HTTPS origin, applies EF migrations
at startup, and exposes `/health/ready` to Render.

After merging the deployment configuration into GitHub:

1. In Render, choose **New → Blueprint**.
2. Connect `ToddJewellMyers/enigma` and select `render.yaml`.
3. Review and approve the paid Starter and Basic resources.
4. Wait for `/health/ready` to pass, then open the assigned `onrender.com` URL.

Render generates the JWT secret and injects the private PostgreSQL connection
URL. The database blocks public inbound connections. Add a custom domain later
from the service settings; Render provisions and renews its TLS certificate.

## Production operations

### Monitoring

Configure the hosting provider to poll these unauthenticated endpoints:

- `GET /health/live` confirms the API process is responding.
- `GET /health/ready` confirms the API can connect to PostgreSQL.

Use `/health/ready` for deployment readiness and alerts. A database outage
returns HTTP 503 without exposing connection details.

### HTTPS

The production API enables HSTS and redirects direct HTTP requests to HTTPS.
Set `Proxy__ForwardedHeadersEnabled=true` when TLS terminates at a trusted
hosting proxy so ASP.NET honors the proxy's forwarded protocol. Keep production
CORS origins HTTPS-only. The hosting provider must provision and renew the TLS
certificate for both the frontend and API domains.

### Error logging

Production logs are emitted as structured JSON to standard output for ingestion
by the hosting provider. Unhandled exceptions include the HTTP method, request
path, and trace ID. API problem responses contain the same `traceId` for support
correlation, while exception details remain server-side.

### Database backups

Prefer the PostgreSQL provider's encrypted, automated backups and point-in-time
recovery. The repository also includes a portable logical backup job:

```bash
export DATABASE_URL='postgresql://user:password@host:5432/enigma_kanban?sslmode=require'
export BACKUP_DIR='/secure/offsite/location'
export BACKUP_RETENTION_DAYS=14
./scripts/backup-postgres.sh
```

The script creates a restrictive custom-format `pg_dump`, validates it with
`pg_restore --list`, and removes dumps older than the retention period. Schedule
it daily in the hosting provider and store `BACKUP_DIR` on durable, encrypted
offsite storage—not the API container filesystem. Test a restore regularly:

```bash
createdb enigma_restore_test
pg_restore --no-owner --no-privileges --dbname=enigma_restore_test backup.dump
```
