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

## Production database

Apply migrations as a release step before starting a newly deployed API:

```bash
dotnet ef database update --project server/server.csproj
```

Legacy SQLite files are intentionally ignored and are not required by the
application. PostgreSQL is the only runtime database provider.
