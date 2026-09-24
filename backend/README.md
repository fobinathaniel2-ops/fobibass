# FOBIbass Node App

The Express server serves the frontend and API from one process on port 5000.

## Run

```powershell
cd backend
node server.js
```

Open `http://localhost:5000`.

## Deployment on Vercel with Neon

The project exports the Express API through `api/index.js`, while local development still uses `backend/server.js`.

Deployment steps:
1. Create a Neon project and copy its pooled connection string.
2. Add `DATABASE_URL` and the existing backend secrets to Vercel Environment Variables.
3. Run `npm install` from the repository root.
4. Run `node backend/scripts/migrate-to-neon.js` once before the first production deploy.
5. Deploy the repository to Vercel.

For example:

```js
// frontend config.js
export const API_BASE = "https://your-backend-domain.example";
```

Neon stores the existing `store.json` shape in one `app_state` row, keeping the current booking, auth, content, and admin APIs compatible. Without `DATABASE_URL`, local development falls back to `backend/data/store.json`.

## Environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` with the pooled Neon connection string.
- The existing SMTP, Cloudinary, session, frontend-origin, and app URL variables.


The local JSON file is only a development fallback. Production data should live in Neon because Vercel's filesystem is ephemeral.

