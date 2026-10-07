# Copilot instructions

## Build, test, and lint

Run commands from the repository root. The project requires Node.js 24 or newer.

```powershell
npm install
npm run dev                 # Start the API and Vite frontend
npm run dev:frontend        # Start only Vite; useful for browser-only demo mode
npm run dev:api             # Start only the Express API
npm run build               # Build frontend into frontend/dist
npm run preview             # Preview the production frontend build
npm run lint                # TypeScript check for the frontend (not a style linter)
npm run typecheck:backend   # TypeScript check for backend/server.ts
node scripts/test-backend.mjs
```

`scripts/test-backend.mjs` runs the backend integration checks together on port
3055; it does not support selecting a test by name. It starts a real API process
and writes test data to the ignored JSON database, so use a disposable database
when data preservation matters. For one focused API smoke check, start
`npm run dev:api` in one terminal and run this in another:

```powershell
Invoke-RestMethod http://localhost:3000/api/bootstrap
```

## Architecture

- `frontend/` is a React single-page app built by Vite. `src/App.tsx` owns the
  route selection, shared application data, and cross-view actions; focused
  public and admin views live in `src/components/`.
- `frontend/src/types/realestate.ts` defines the domain models used by both
  frontend and backend. `frontend/src/data/seedData.ts` supplies the initial
  records and is imported by the Express server as well as the frontend.
- `backend/server.ts` implements the REST API and admin session handling.
  Persistent records are read from and written to
  `backend/data/realestate-db.json`; if the database is absent or unusable, the
  server initializes it from the frontend seed data. Public project routes
  expose published projects, while admin management routes require an API
  session.
- `frontend/src/services/api.ts` is the frontend API boundary. With
  `VITE_DEMO_MODE=true`, it dynamically routes requests to `demoAuth.ts` and
  `demoApi.ts` and never sends them to the network. Demo mutations are
  browser-local; otherwise requests go to the Express API, via Vite's `/api`
  proxy in development or `VITE_API_BASE_URL` in production.

## Connecting the frontend and backend

- For local real-API development, copy `.env.example` to `.env`, set
  `VITE_DEMO_MODE=false`, and set private `ADMIN_EMAIL` and `ADMIN_PASSWORD`
  values. Start `npm run dev:api` and `npm run dev:frontend` in separate
  terminals. Vite forwards `/api` requests to `VITE_API_PROXY` (default
  `http://localhost:3000`); leave `VITE_API_BASE_URL` empty locally. Restart
  the processes after changing environment variables. Alternatively,
  `npm run dev` starts both processes together.
- For a deployed real-API frontend, set `VITE_DEMO_MODE=false` and
  `VITE_API_BASE_URL` to the API's HTTPS origin at frontend build time. Set the
  backend's `FRONTEND_ORIGIN` to the exact deployed frontend origin so its CORS
  middleware allows browser requests. The backend is deployed separately from
  Netlify's static frontend and needs persistent writable storage for its JSON
  database.
- `VITE_DEMO_MODE=true` bypasses the API entirely, so it is not a way to test
  frontend/backend connectivity.

## Repository-specific conventions

- Keep frontend API calls behind `apiFetch` (and use `readApiJson` for JSON
  responses). This preserves the demo/real API switch, API base URL handling,
  and admin authorization behavior.
- When adding or changing API behavior or domain data, keep the real server,
  browser demo implementation, shared types, and seed records aligned. The
  demo is an alternate implementation of the API contract, not a backend
  connection.
- `VITE_` environment variables are embedded in the frontend build and are
  public. Keep admin credentials in backend-only variables such as
  `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Frontend import alias `@/` resolves to `frontend/src/`. Tailwind CSS 4 is
  integrated through the Vite plugin configured in `frontend/vite.config.ts`.
