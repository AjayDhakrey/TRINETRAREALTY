# Trinetra Realty platform

React 19, TypeScript, Vite 8 and Tailwind CSS 4 frontend with an Express 4 API and JSON file storage.

## Structure

- `frontend/` - Vite app, source, public media and generated `dist/`
- `backend/` - Express API and local JSON database
- `netlify.toml` - Netlify build, publish and SPA route fallback

## Temporary client demo (no backend required)

Set `VITE_DEMO_MODE=true` at build time. Admin sign-in, sample data and admin changes then run entirely in the browser. This is a temporary demonstration, not production authentication.

- Email: `demo@trinetrarealty.com`
- Password: `Demo@2026`

**These credentials are public and embedded in the demo frontend. Never reuse them for production admin credentials.**

The demo session survives refresh in the same browser tab. Sign Out clears authentication. Sample projects, properties, leads, media attachments, valuations and mutations are simulated. Changes stay in sessionStorage in that tab; they do not update a server, send inquiries to staff, or change live records. Large image uploads may exceed browser storage and then persist only until refresh. A new browser session starts with sample data.

### Enable the Netlify demo

After publishing the updated source to your connected repository:

1. Open the Netlify project for `trinetrarealtyy.netlify.app`.
2. Under **Project configuration > Environment variables**, add `VITE_DEMO_MODE=true` for the Production deploy context, with Builds scope (or all scopes).
3. Trigger a new production deploy from the updated branch in **Deploys**. Vite reads this variable during the build, so saving it alone does not change an existing deploy.
4. Open `https://trinetrarealtyy.netlify.app/admin` and use the public demo credentials above. Confirm sign-in, page refresh, admin tabs and Sign Out.

No `VITE_API_BASE_URL` or Express hosting is required in demo mode. Existing API settings are ignored by demo requests. Netlify uses `npm run build`, publishes `frontend/dist`, and rewrites page routes to `index.html`.

## Local setup

Requires Node.js 24 or newer. Run commands from the project root:

```powershell
npm install
Copy-Item .env.example .env
```

For a local demo, set `VITE_DEMO_MODE=true` in `.env`, then run `npm run dev`. No backend process is needed. Restart Vite after changing environment variables.

For real API development, set `VITE_DEMO_MODE=false`, choose a unique `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` in `.env`, and start these in separate terminals:

```powershell
npm run dev:api
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Vite proxies `/api` to `http://localhost:3000` in development. A separate `VITE_API_BASE_URL` is optional locally.

`npm run build` builds the frontend; `npm run preview` previews it. `npm run lint` typechecks the frontend; `npm run typecheck:backend` typechecks the API.

## Real production API mode

Set `VITE_DEMO_MODE=false` (or remove it) and rebuild. Demo authentication and demo records are disabled. The Netlify frontend needs a separately deployed Express API and `VITE_API_BASE_URL` set to its actual HTTPS origin. No backend URL is provided by this repository.

The frontend sends `POST /api/admin/login` to that API. The backend verifies environment credentials and issues an expiring bearer session. Sessions are stored in the browser tab; logout revokes the backend token. A demo session cannot be used as a real API session. Unavailable admin services show a friendly message to visitors.

### Environment variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `VITE_DEMO_MODE` | Frontend build | Exactly `true` enables public browser-only demo; false/missing uses real API |
| `VITE_API_BASE_URL` | Frontend build | Actual deployed API origin, required for real production login |
| `VITE_API_PROXY` | Local frontend dev | Optional API proxy target; default `http://localhost:3000` |
| `ADMIN_EMAIL` | Backend only | Unique production admin email |
| `ADMIN_PASSWORD` | Backend only | Strong private production password |
| `FRONTEND_ORIGIN` | Backend only | `https://trinetrarealtyy.netlify.app` |
| `PORT` | Backend only | API listening port; default `3000`, or the host-assigned port |

Never put server credentials in `VITE_` variables. Netlify static hosting does not run `backend/server.ts`. Previously published hardcoded production credentials should be rotated before enabling the real API.

The JSON database is written to `backend/data/realestate-db.json` and ignored by Git. Real hosting requires persistent writable storage. Admin sessions expire after eight hours or when the API restarts. The API has no login rate limiting; production deployment still needs rate limiting and persistent database/session controls appropriate to its use.
