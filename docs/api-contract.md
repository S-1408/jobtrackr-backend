# JobTrackr API Contract — v1

> **Status:** Agreed target design. The backend is being built toward it; the frontend should build against it.
> **Owner:** backend. Any change to this contract must be updated here **first**, then implemented on both sides.
> **Base URL (dev):** `http://localhost:4000/api/v1`

---

## 1. Global rules

### 1.1 Response envelopes

Every success response has `data`. Lists also have `meta`.

```json
{ "data": { } }
{ "data": [ ], "meta": { } }
```

Every error response has `error`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "role", "message": "Role is required" }],
    "requestId": "b3f1c2e4-9a7d-4f1e-8c2b-5d6e7f8a9b0c"
  }
}
```

| Field | Rule |
|---|---|
| `code` | Stable, machine-readable. **Clients branch on `code`, never on `message`.** |
| `message` | Human-readable, safe to show users. May change wording at any time. |
| `details` | Only on `VALIDATION_ERROR`. One entry per invalid field. |
| `requestId` | Also sent as the `X-Request-Id` response header. Quote it when reporting bugs. |

`204 No Content` responses have no body.

### 1.2 Data formats

| Rule | Example |
|---|---|
| Field names are camelCase | `appliedAt` |
| Dates are ISO 8601 strings in UTC | `"2026-09-30T10:30:00.000Z"` |
| IDs are UUID strings | `"7f3c9a2e-4b1d-4e8a-9c3f-1a2b3c4d5e6f"` |
| Optional fields are `null` when empty, never missing | `"notes": null` |

### 1.3 Requests

- Request bodies are JSON with `Content-Type: application/json`. Max body size: 100kb.
- Unknown fields in a request body are **rejected** (400).

---

## 2. Application resource

```json
{
  "id": "7f3c9a2e-4b1d-4e8a-9c3f-1a2b3c4d5e6f",
  "company": "Google",
  "role": "Frontend Developer",
  "status": "interview",
  "appliedAt": "2026-09-30T10:30:00.000Z",
  "location": "Bangalore, India",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": null,
  "createdAt": "2026-09-30T10:31:12.000Z",
  "updatedAt": "2026-10-01T08:15:40.000Z"
}
```

| Field | Type | Writable | Rules |
|---|---|---|---|
| `id` | string (UUID) | No | Server-generated |
| `company` | string | Yes | Required on create. Trimmed, 1–100 chars |
| `role` | string | Yes | Required on create. Trimmed, 1–100 chars |
| `status` | enum | Yes | `applied` \| `interview` \| `offer` \| `rejected`. Default `applied` |
| `appliedAt` | ISO date | Yes | Default: now. Cannot be in the future |
| `location` | string \| null | Yes | Max 100 chars |
| `jobUrl` | string \| null | Yes | Valid `http(s)` URL |
| `notes` | string \| null | Yes | Max 2000 chars |
| `createdAt` | ISO date | No | Server-set |
| `updatedAt` | ISO date | No | Server-set, changes on every update |

---

## 3. Endpoints

| Method | Path | Success |
|---|---|---|
| GET | `/health` | 200 |
| GET | `/applications` | 200 (paginated list) |
| GET | `/applications/stats` | 200 |
| GET | `/applications/:id` | 200 |
| POST | `/applications` | 201 |
| PATCH | `/applications/:id` | 200 |
| DELETE | `/applications/:id` | 204 |

### 3.1 `GET /health`

**200**
```json
{ "data": { "status": "ok", "uptime": 3605.2, "timestamp": "2026-10-01T09:00:00.000Z" } }
```

### 3.2 `GET /applications` — list

| Query param | Default | Rules |
|---|---|---|
| `page` | `1` | Integer ≥ 1 |
| `limit` | `20` | Integer 1–100 |
| `status` | — | One of the 4 statuses |
| `search` | — | Case-insensitive match on `company` or `role`. Trimmed; max 100 chars; blank = no search |
| `sortBy` | `appliedAt` | `appliedAt` \| `company` \| `createdAt` \| `updatedAt` |
| `order` | `desc` | `asc` \| `desc` |

Server applies: **filter → search → sort (with `id` as tie-breaker) → count `total` → slice page.**

**200 — results**
```json
{
  "data": [
    {
      "id": "7f3c9a2e-4b1d-4e8a-9c3f-1a2b3c4d5e6f",
      "company": "Google",
      "role": "Frontend Developer",
      "status": "interview",
      "appliedAt": "2026-09-30T10:30:00.000Z",
      "location": "Bangalore, India",
      "jobUrl": "https://careers.google.com/jobs/123",
      "notes": null,
      "createdAt": "2026-09-30T10:31:12.000Z",
      "updatedAt": "2026-10-01T08:15:40.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

**200 — no results / page past the end** (not an error)
```json
{ "data": [], "meta": { "page": 5, "limit": 20, "total": 57, "totalPages": 3 } }
```
`total: 0` with no filters means the user has no applications yet (empty state); `total: 0` with filters means "no matches".

**400 — invalid query**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "page", "message": "Must be at least 1" },
      { "field": "limit", "message": "Must be at most 100" },
      { "field": "status", "message": "Must be one of: applied, interview, offer, rejected" },
      { "field": "sortBy", "message": "Must be one of: appliedAt, company, createdAt, updatedAt" }
    ],
    "requestId": "..."
  }
}
```

### 3.3 `GET /applications/stats` — dashboard counts

**200** — every status is always present, even when 0.
```json
{
  "data": {
    "total": 57,
    "byStatus": { "applied": 30, "interview": 15, "offer": 2, "rejected": 10 }
  }
}
```

### 3.4 `GET /applications/:id`

**200**
```json
{ "data": { "id": "7f3c9a2e-...", "company": "Google", "...": "full Application object (section 2)" } }
```

**400 — malformed id** (not a UUID)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "id", "message": "Must be a valid UUID" }],
    "requestId": "..."
  }
}
```

**404 — not found**
```json
{ "error": { "code": "NOT_FOUND", "message": "Application not found", "requestId": "..." } }
```

### 3.5 `POST /applications`

**Request** — only `company` and `role` are required.
```json
{
  "company": "Google",
  "role": "Frontend Developer",
  "status": "applied",
  "appliedAt": "2026-09-28T00:00:00.000Z",
  "location": "Bangalore, India",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": null
}
```

**201** — header `Location: /api/v1/applications/<id>`. Body is the full created object.
```json
{
  "data": {
    "id": "7f3c9a2e-4b1d-4e8a-9c3f-1a2b3c4d5e6f",
    "company": "Google",
    "role": "Frontend Developer",
    "status": "applied",
    "appliedAt": "2026-09-28T00:00:00.000Z",
    "location": "Bangalore, India",
    "jobUrl": "https://careers.google.com/jobs/123",
    "notes": null,
    "createdAt": "2026-10-01T09:00:00.000Z",
    "updatedAt": "2026-10-01T09:00:00.000Z"
  }
}
```

**400 — validation** (all problems reported at once)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "role", "message": "Role is required" },
      { "field": "company", "message": "Must be at most 100 characters" },
      { "field": "status", "message": "Must be one of: applied, interview, offer, rejected" },
      { "field": "appliedAt", "message": "Cannot be in the future" },
      { "field": "jobUrl", "message": "Must be a valid URL" },
      { "field": "isAdmin", "message": "Unknown field" }
    ],
    "requestId": "..."
  }
}
```

**400 — invalid JSON**
```json
{ "error": { "code": "INVALID_JSON", "message": "Request body is not valid JSON", "requestId": "..." } }
```

**409 — duplicate** (same `company` + `role` already tracked)
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "You already have an application for Frontend Developer at Google",
    "requestId": "..."
  }
}
```

**413 — body too large**
```json
{ "error": { "code": "PAYLOAD_TOO_LARGE", "message": "Request body is too large", "requestId": "..." } }
```

### 3.6 `PATCH /applications/:id`

**Request** — send only the fields to change.
- Field **omitted** → unchanged.
- Field set to **`null`** → cleared (only for nullable fields: `location`, `jobUrl`, `notes`).

```json
{ "status": "offer", "notes": "Offer received! 25 LPA" }
```

**200** — the full updated object (new `updatedAt`).
```json
{ "data": { "id": "7f3c9a2e-...", "status": "offer", "notes": "Offer received! 25 LPA", "...": "full Application object" } }
```

**400 — empty body**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "body", "message": "At least one field must be provided" }],
    "requestId": "..."
  }
}
```

**400 — read-only or unknown fields** (`id`, `createdAt`, `updatedAt`, anything else) → `VALIDATION_ERROR` with `"Unknown field"` per field.

**404** — same as 3.4.

### 3.7 `DELETE /applications/:id`

**204** — no body.

**404** — not found or already deleted. Clients should treat this as "already gone".
```json
{ "error": { "code": "NOT_FOUND", "message": "Application not found", "requestId": "..." } }
```

---

## 4. Error codes (any endpoint)

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body, query, or path params. See `details` |
| 400 | `INVALID_JSON` | Body is not valid JSON |
| 401 | `UNAUTHORIZED` | *(future)* Not logged in / token expired |
| 403 | `FORBIDDEN` | *(future)* Logged in but not allowed |
| 404 | `NOT_FOUND` | Resource does not exist |
| 404 | `ROUTE_NOT_FOUND` | Unknown URL or method |
| 409 | `CONFLICT` | Duplicate, or edit conflict |
| 413 | `PAYLOAD_TOO_LARGE` | Body exceeds 100kb |
| 429 | `RATE_LIMITED` | Too many requests. See `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Unexpected server error. Message is always generic |

In development only, a 500 may include `error.stack`. Never in production.

---

## 5. TypeScript types (shared shape for both sides)

```ts
export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
  location: string | null;
  jobUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  location?: string | null;
  jobUrl?: string | null;
  notes?: string | null;
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export interface ListApplicationsQuery {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  search?: string;
  sortBy?: "appliedAt" | "company" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ROUTE_NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: { field: string; message: string }[];
    requestId: string;
  };
}
```

---

## 6. Planned (not yet in v1 scope)

These are designed so they **do not change** any response shape above.

- **Auth:** `POST /auth/register`, `POST /auth/login` (returns `{ data: { user, accessToken } }`, refresh token in httpOnly cookie), `POST /auth/refresh`, `POST /auth/logout` (204), `GET /auth/me`. After auth, all application endpoints return only the current user's data; another user's application returns **404** (not 403).
- **Edit conflicts:** PATCH may return `409 CONFLICT` if the record changed since the client loaded it.
- **Archive / soft delete:** `archivedAt` field + `?archived=true` filter.
- **Rate limiting:** `429` + `RateLimit-*` and `Retry-After` headers.
- **Cursor pagination:** `meta.nextCursor` may be added for infinite scroll (additive, non-breaking).

---

## 7. Implementation status (backend)

| Item | Status |
|---|---|
| `/api/v1` prefix | Not yet — currently `/api` |
| Response envelopes `{ data }` / `{ data, meta }` | Not yet — currently bare arrays/objects |
| Error shape `{ error: { code, ... } }` | Not yet — currently `{ message }` |
| `GET /applications/:id` | Missing — being restored |
| `DELETE` | Bug: does not remove — being fixed |
| Validation (zod), pagination, filters, stats, new fields, requestId | Not started |

Update this table as each item ships so the frontend knows what it can rely on.
