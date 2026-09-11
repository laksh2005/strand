# Strand

A privacy-aware event timeline. Events are stored per user and shown on a timeline. Each category (conversation, location, physiological, note) can be turned ON/OFF. When OFF, the backend stops returning that data, not just the UI.

Claude Code was used to assist with this assignment. All code and decisions were reviewed and are understood by me.

## Engineering notes

**Where is authorization enforced, and why?**

In the backend, in `eventService.ts`. Never in the frontend. Even if the UI hides something, the API checks permissions again on every request, so it can't be bypassed with a direct API call.

**What happens if a user requests data they can't see?**

`GET /events` just leaves out disabled categories. `GET /events/{id}` on a specific event returns `403` (not `404`, since the event exists, access is just denied). Both cases are logged to the audit log.

**One weakness:**

There's no real auth, just one hardcoded demo user. Permissions aren't tied to a verified identity, they're global settings. Adding real login would need permissions and audit logs scoped per authenticated user, not a static email lookup.

**At 1 million events per user, what changes?**

Switch from offset pagination to cursor-based pagination (it gets slow at scale). Keep the existing indexes on `(user_id, type)` and `(user_id, timestamp)`. Consider partitioning the events table by time, and moving the audit log to its own storage since it's write-heavy and rarely read.

**With one more day:**

Add real authentication, date-range filtering, and a few more edge-case tests (bad pagination values, concurrent permission changes).

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL (Supabase)
- **Frontend**: React + Vite
- **Tests**: Vitest + Supertest
- **Docs**: OpenAPI spec at [`openapi.yaml`](openapi.yaml)

## Setup

### 1. Database

```bash
cp .env.example .env
# set DATABASE_URL to your Postgres connection string
```

### 2. Server

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev   # http://localhost:4000
```

### 3. Frontend

```bash
cd web
npm install
npm run dev   # http://localhost:5173
```

### 4. Tests

```bash
cd server
npm test
```

## Architecture

```
server/
  prisma/schema.prisma     User, Event, Permission, AuditLog models
  src/
    routes/                 parses requests, calls services
    services/
      eventService.ts       privacy filtering + audit logging
      permissionService.ts
    lib/
      audit.ts              writes audit log entries
      currentUser.ts        resolves the single demo user
web/
  src/
    api.ts                  API client
    components/              Timeline, TypeFilter, PrivacyToggles, AuditLogView
```

All privacy filtering happens in `eventService.ts`. Every read checks the user's enabled categories before returning data. Routes never query events directly, only through this service.

## API

Full spec: [`openapi.yaml`](openapi.yaml).

| Method | Path                  | Notes |
|--------|-----------------------|-------|
| GET    | `/events`             | `?type=`, `?limit=`, `?offset=` |
| GET    | `/events/{id}`        | 403 if category is disabled, 404 if not found |
| POST   | `/events`             | Create an event |
| DELETE | `/events/{id}`        | Delete an event |
| GET    | `/permissions`        | List the 4 category toggles |
| PUT    | `/permissions/{type}` | Body: `{ "enabled": boolean }` |
| GET    | `/audit-log`          | Read-only, paginated |

## Assumptions

- One seeded demo user, no login. Every request acts as that user.
- Permissions gate reads only. Creating or deleting an event is always allowed.
- Date-range filtering was skipped (marked optional in the brief).
