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

*To be filled in once actually deployed on Day 5 — not writing this from a plan I haven't executed yet.*

## What is the request path for one representative user action, end to end?

*To be filled in once the signup route exists.*

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