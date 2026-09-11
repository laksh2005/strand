# Strand

A privacy-aware event timeline. Events (conversations, locations, physiological readings, notes) are stored per user, shown on a timeline, and gated behind per-category ON/OFF permissions that are enforced **on the backend** — disabling a category makes the API stop returning that data, not just the UI.

## Stack

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, Postgres (Supabase)
- **Frontend**: React + Vite
- **Tests**: Vitest + Supertest, run against a real Postgres database
- **Docs**: OpenAPI spec at [`openapi.yaml`](openapi.yaml)

## Setup

### 1. Database

Create a Supabase project (or use any Postgres instance) and copy its connection string.

```bash
cp .env.example .env
# edit .env and set DATABASE_URL to your Postgres connection string
```

### 2. Server

```bash
cd server
npm install
npx prisma migrate dev --name init   # creates the schema
npm run seed                         # creates the demo user, default permissions, sample events
npm run dev                          # http://localhost:4000
```

### 3. Frontend

```bash
cd web
npm install
npm run dev                          # http://localhost:5173, proxies API calls to :4000
```

### 4. Tests

```bash
cd server
npm test
```

Tests run against the same database as `DATABASE_URL` and reset the demo user's events/audit log/permissions before each test — safe to run repeatedly.

## Architecture

```
server/
  prisma/schema.prisma   User, Event, Permission, AuditLog models
  src/
    routes/               HTTP layer only — parses/validates, calls services
    services/
      eventService.ts     privacy filtering + audit logging live here
      permissionService.ts
    lib/
      audit.ts             writeAuditLog() helper
      currentUser.ts        resolves the single demo user (no auth in scope)
    middleware/             error handling, async wrapper
web/
  src/
    api.ts                  thin fetch wrapper around the API
    components/              Timeline, TypeFilter, PrivacyToggles, AuditLogView
```

Privacy enforcement is centralized in `eventService.ts`: every read (`GET /events`, `GET /events/{id}`) loads the caller's enabled categories from the database and filters against them before any event data leaves the service layer. Routes never touch Prisma directly for events — they only call the service.

## API

See [`openapi.yaml`](openapi.yaml) for the full spec, or import it into Postman/Swagger UI. Summary:

| Method | Path                | Notes |
|--------|---------------------|-------|
| GET    | `/events`           | `?type=`, `?limit=`, `?offset=` — filtered by permissions |
| GET    | `/events/{id}`      | 403 if the event's category is disabled, 404 if it doesn't exist |
| POST   | `/events`           | Creates an event (writes are not permission-gated) |
| DELETE | `/events/{id}`      | Deletes an event |
| GET    | `/permissions`      | Lists the four category toggles |
| PUT    | `/permissions/{type}` | Body `{ "enabled": boolean }` |
| GET    | `/audit-log`        | Read-only, paginated |

## Assumptions

- Single seeded demo user, no authentication — every request acts as that user (`DEMO_USER_EMAIL` in `.env`). This keeps the assignment focused on data/privacy logic per the brief.
- Permissions gate **reads only**. Writing (POST) and deleting your own event is always allowed — a category being "OFF" means "don't surface this to me," not "don't let me record it."
- Date-range filtering was left out (explicitly optional in the brief).

## Engineering notes

**Where is authorization enforced, and why?**
Entirely in the backend service layer (`eventService.ts`), never in the frontend. The frontend hides toggled-off categories for UX, but the API independently re-checks permissions on every request. This matters because the brief is explicit that the API will be tested directly — a frontend-only check would be trivially bypassed with `curl`.

**What happens when a user requests data they're not allowed to see?**
`GET /events` silently omits disabled categories from the result (so the timeline just doesn't show them — no error, no partial leak). `GET /events/{id}` on a specific event whose category is disabled returns `403 Forbidden` with no event data in the body, and an `EVENT_ACCESS_DENIED` row is written to the audit log. It intentionally returns 403, not 404, because the resource exists — access is denied, not absent — which is honest and auditable without leaking category-off timing side channels beyond what the design already exposes.

**One weakness that still exists:**
There's a single hardcoded demo user and no session concept, so "permissions" are really global settings rather than scoped to an authenticated identity. In a real system, swapping in auth would need permission and audit rows to be scoped by a verified session, not just a user id resolved by a static email lookup.

**How would this change at 1M events per user?**
Offset pagination (`skip`/`take`) degrades badly at that scale — switch to cursor-based pagination keyed on `(timestamp, id)`. The existing `(user_id, type)` and `(user_id, timestamp)` indexes stay useful, but I'd add table partitioning by time range (e.g. monthly) so both queries and any eventual retention/archival policy stay cheap. The audit log would move to an append-only, possibly separate store (it's insert-heavy and read-rarely, so it doesn't need to share hot storage with events).

**What would one more additional day add?**
Real authentication (so `currentUser` resolution is session-based, not a static email), date-range filtering on `/events`, and a few more edge-case tests (concurrent permission toggles, malformed pagination values, empty-body POSTs).
