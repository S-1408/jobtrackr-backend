# Backend deployment

## Before deploying

- Deploy this backend as a Node.js web service with the repository's backend directory as its root.
- Use Node.js 20 or newer.
- Create a managed PostgreSQL database and configure `DATABASE_URL` in the hosting provider's secret environment settings.
- Set `NODE_ENV=production`.
- Set `PORT` only if the provider does not supply it.
- Set `CORS_ORIGIN` to the exact HTTPS origin(s) of the frontend, comma-separated with no paths or trailing slashes. Local development origins are not valid in production.
- Set distinct, randomly generated `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values, each at least 32 characters long.
- Set `JWT_ACCESS_EXPIRES_IN=15m` and `JWT_REFRESH_EXPIRES_IN=7d` (or the values the product requires).
- Never commit `.env` or put production secrets in source control.

The database connection string may require provider-specific SSL options. Use the connection string and TLS instructions supplied by the PostgreSQL host.

## Build and start

From the backend directory:

```text
npm ci
npm run build
npm start
```

For a host that supports separate build and start commands, use:

- Build: `npm ci && npm run build`
- Start: `npm start`

The process listens on `0.0.0.0` and the port from `PORT`. On startup, it creates the users, applications, and refresh-token tables and indexes if they do not exist, then waits for PostgreSQL before accepting requests. Configure the host's health-check path as `/health`; this endpoint returns 200 only when PostgreSQL is reachable.

Production does not create a default account or demo application records. Create an account using `POST /api/auth/register` or the frontend registration screen.

## Connect the frontend

Set the frontend's API base URL to `https://<backend-host>` and redeploy it. Set backend `CORS_ORIGIN` to the frontend's deployed origin, then restart or redeploy the backend. Browser requests that use refresh-token cookies must send credentials.

Refresh cookies are HttpOnly and Secure in production. Production uses SameSite=None so the browser can send the cookie between a separately hosted frontend and API; refresh and logout also validate a supplied Origin against `CORS_ORIGIN`. Browser requests must include credentials. Some browsers or privacy settings block third-party cookies regardless; a custom frontend/API pair under one site (such as `app.example.com` and `api.example.com`) is preferable for reliable sessions.

## Data persistence and migration

User accounts, job applications, and refresh-token state are stored in PostgreSQL. Applications are scoped to the authenticated user. Development mode seeds the existing sample user and sample applications if they are not already present; production does not seed demo credentials.

The former runtime arrays were never persisted, so data that existed only in a stopped backend process cannot be recovered automatically. Any records held in another database or export must be imported separately before switching the frontend to this API.
