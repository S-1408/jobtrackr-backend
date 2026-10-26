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

The process listens on `0.0.0.0` and the port from `PORT`. It initializes the refresh-token table and verifies PostgreSQL before accepting requests. Configure the host's health-check path as `/health`; this endpoint returns 200 only when PostgreSQL is reachable.

## Connect the frontend

Set the frontend's API base URL to `https://<backend-host>` and redeploy it. Set backend `CORS_ORIGIN` to the frontend's deployed origin, then restart or redeploy the backend. Browser requests that use refresh-token cookies must send credentials.

Refresh cookies are HttpOnly, Secure in production, and use SameSite=Strict. For the most reliable browser behavior, host the frontend and API on the same site, such as `app.example.com` and `api.example.com`. Unrelated hosting domains may be treated as third-party-cookie contexts by browsers.

## Current data persistence limitation

Only refresh-token state is persisted in PostgreSQL. User accounts and job applications are currently held in in-memory arrays, so changes to them are lost on restart and are not shared reliably across multiple instances. Migrate those records to PostgreSQL before using the service for real users or horizontal scaling.
