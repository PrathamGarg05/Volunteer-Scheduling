# Architecture

## What are the moving pieces, and how do they talk to each other?

- **Client**: React (Vite) SPA, will talk to the API over HTTPS/JSON via axios.
- **Server**: Single Express app (monolith — see decisions.md #1), exposes a REST API, talks to
  MongoDB via Mongoose.
- **Database**: MongoDB Atlas, single cluster, 7 collections (see schema.md for the full ER diagram
  and field-level design).

No message queue, no separate services, no websockets — plain request/response, since nothing in the
10 required goals needs real-time push.

## Where does each piece run?

- **Client**: Vercel (static build, deployed from `client/`)
- **Server**: Render free-tier web service (deployed from `server/`)
- **Database**: MongoDB Atlas, free M0 cluster

The client talks to the server's public Render URL over HTTPS; the server connects to Atlas via a
connection string in an environment variable, never committed. Render's free tier sleeps after 15
minutes of inactivity; a cron job (cron-job.org) pings a `/health` endpoint every 10 minutes to reduce
how often a cold start is actually hit.

## What is the request path for one representative user action, end to end?

**Volunteer signs up for a shift:**

1. Client sends `POST /api/programs/:id/shifts/:shiftId/signups` with a Bearer JWT.
2. `requireAuth` middleware verifies the JWT, attaches `req.user = { id, role }`.
3. `createSignup` controller fetches the Shift, rejects if its status is Filled or Closed.
4. Checks `ProgramMember` to confirm the volunteer belongs to the shift's program — rejects with 403
   if not.
5. Checks for an existing active `Signup` on this exact shift — rejects with 409 if a duplicate.
6. Calls `hasOverlappingSignup`, which fetches every other active `Signup` this volunteer holds
   (across all programs), reconstructs each shift's time window from `date + startTime + durationMinutes`,
   and checks for interval overlap — rejects with 400 if any overlap is found.
7. Creates the `Signup` document, then appends a `signup`-type `ShiftEvent`.
8. Recomputes the shift's fill state via `deriveFillState` against the new active signup count; if the
   state changed, persists it and appends a `state_change` `ShiftEvent` with old and new state.
9. Responds 201 with the created signup.

## What did you decide not to build, and why?

- No microservices (decisions.md #1).
- No real-time websocket layer for alerts/dashboard — refresh-on-navigation is sufficient for what
  the brief actually asks for.
- deleteShift currently has no guard against deleting a shift with active signups (no Signup model
  existed yet when this route was built). Flagged to revisit once Signup exists — orphaning active
  signups on delete would be a real data-integrity gap if left unaddressed.
- No transaction-level locking on the signup write path — two simultaneous signup requests for the
  last open spot on a shift could theoretically both succeed, over-filling it. deriveFillState's
  defensive >= comparison prevents the fill-state from breaking in that case, but doesn't prevent the
  over-signup itself. Acceptable risk for a demo app's realistic concurrency levels; a production
  system would need a DB-level unique constraint or transaction around the count-check-and-insert.