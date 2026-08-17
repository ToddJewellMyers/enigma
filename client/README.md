# Sweet Mahogany Boards Kanban client

React, TypeScript, Vite, and Tailwind frontend for Sweet Mahogany Boards Kanban.

## API configuration

The client reads its API base URL from `VITE_API_URL`.

- Local development uses `.env.development` and `http://localhost:5273/api`.
- A separately hosted production frontend should set `VITE_API_URL` in its
  hosting provider.
- If the variable is omitted, the client uses same-origin `/api`.

Copy `.env.example` when creating another environment. Do not place secrets in
Vite variables because they are embedded into the browser bundle.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

`npm run test:a11y` runs the focused automated axe accessibility checks.
