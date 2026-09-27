# Trinetra Realty platform

React 19, TypeScript, Vite 8 and Tailwind CSS 4 frontend with an Express 4 API and JSON file storage. Netlify hosts the static frontend; the Node API must be hosted separately.

## Structure

- `frontend/` — Vite app, source, public media and generated `dist/`
- `backend/` — Express API and local JSON database
- `netlify.toml` — Netlify build, publish and SPA fallback configuration

## Local setup

Requires Node.js 24 or newer.

```powershell
npm install
Copy-Item .env.example .env
```

Set a unique `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` in `.env`. Start API and frontend in separate terminals at the project root:

```powershell
npm run dev:api
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Vite proxies `/api` to `http://localhost:3000` in development. `npm run build` builds the frontend; `npm run preview` previews it. `npm run lint` typechecks the frontend; `npm run typecheck:backend` typechecks the API.

The JSON database is written to `backend/data/realestate-db.json` and ignored by Git. Back it up before removing local data.

## Environment variables

- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — required API admin credentials.
- `PORT` — optional API port (default `3000`).
- `FRONTEND_ORIGIN` — exact deployed frontend origin allowed by API CORS.
- `VITE_API_BASE_URL` — deployed API origin for Netlify builds, e.g. `https://api.example.com`.
- `VITE_API_PROXY` — optional local Vite proxy target (default `http://localhost:3000`).

Never put server credentials in `VITE_` variables; Vite embeds them into browser assets.

## Netlify and production limitations

Netlify runs `npm run build` and publishes `frontend/dist`; `netlify.toml` sends SPA paths to `index.html`. Set `VITE_API_BASE_URL` in Netlify and `FRONTEND_ORIGIN` on the separately hosted API. Netlify static hosting does not run `backend/server.ts`.

The API currently stores data in a local JSON file, which needs persistent writable storage. Admin bearer sessions are in memory, expire when the API restarts, and have no rate limiting. Use a persistent database and production-grade authentication/session controls before public production use.
