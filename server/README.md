# Enigma Kanban API

## Automated tests

The integration suite runs the real HTTP controllers with JWT authentication and an isolated in-memory database. It does not require PostgreSQL and never touches production or legacy data.

Run it from the repository root:

```bash
dotnet test server.Tests/server.Tests.csproj
```

The suite covers workspace, board, column, and card creation, listing, validation, updates, movement, ordering, deletion, cascade behavior, authentication, and ownership boundaries.

## PostgreSQL

The API uses PostgreSQL through the Npgsql EF Core provider. Configure the hosted connection string as an API environment variable:

```text
ConnectionStrings__DefaultConnection=Host=your-postgres-host;Port=5432;Database=enigma_kanban;Username=your-user;Password=your-password;SSL Mode=Require
```

Do not commit the real connection string. The API fails at startup when it is missing.

Apply the schema to a new hosted database with:

```bash
dotnet ef database update
```

The previous SQLite database and migrations are retained only as legacy migration sources. They are excluded from the application build.

## Production onboarding data

Every newly registered account receives an isolated `My Workspace` containing a
`Getting Started` board, three workflow columns, and four instructional cards.
The seed runs only during registration, so it is safe to deploy repeatedly and
never overwrites or adds records to an existing account.

Legacy unowned SQLite workspaces are no longer assigned to the first registered
user. This prevents development records from leaking into a production account.

## Production CORS

The API accepts browser requests only from exact origins listed under `Cors:AllowedOrigins`. Production startup fails when no origin is configured.

For a single deployed frontend, configure this environment variable in the API host:

```text
Cors__AllowedOrigins__0=https://kanban.example.com
```

For additional frontend domains, add sequential entries:

```text
Cors__AllowedOrigins__1=https://www.kanban.example.com
```

Use the origin only: scheme, hostname, and optional port. Do not include a path, trailing slash, or wildcard. Use HTTPS in production.

`appsettings.Production.example.json` shows the equivalent JSON structure. Do not copy development JWT keys into production configuration.
