# Plan

## How did you break the work into sessions?

1st session (30 mins) for schema and decisions.

## What order did you build in, and why that order?

1. **Schema and auth foundation first** (Session 1) — every other route depends on the data model being
   right, and role-based access gates every subsequent endpoint. Getting this wrong would mean
   redesigning everything built on top of it.
2. **Core CRUD before any business rules** (Session 2) — programs, membership, and shift CRUD, with no
   lifecycle logic yet, since there's nothing to enforce a lifecycle on until shifts can actually be
   created and viewed. Frontend auth flow and basic screens followed immediately after, so the API
   could be exercised through a real UI rather than only Postman from this point forward.
3. **The shift lifecycle and search together** (Session 3) — deliberately tackled early, with the most
   schedule slack still remaining, because Goal 4 has the most exact rules in the brief and the highest
   cost if the design needed a redo. Fill-state derivation was built and unit-tested as a pure function
   before being wired into any route, so the core rule was provably correct in isolation first.
4. **Dashboard, recurring generator, and CSV export** (Session 4) — these all read off signup/shift data
   that only existed once the lifecycle was solid, so building them earlier would have meant working
   against incomplete or unstable data.
5. **Frontend for everything from Session 4, plus the shift timeline** (Session 5) — backend-first,
   frontend-second was the pattern throughout, since a backend endpoint is independently testable in
   Postman the moment it exists, while a frontend page needs a working API underneath it to be
   meaningful to build against.
6. **Alerts last among the 10 goals** (Session 6) — it was the most conceptually dependent piece,
   needing ShiftEvent (Session 3) and the fill-state lifecycle (Session 3) both fully working first,
   since alert dismissal is scoped against a shift's state-transition history, not the shift alone.
   Deployment came last, once there was a complete system worth putting online.

The consistent thread across every session: whatever the next feature depended on had to already exist
and be tested, not just written — several of the bugs logged in ai-prompts.md were only caught because
each layer was manually verified before building the next one on top of it.

## What did you estimate versus what it actually took?

Session 1 (planned 2h): scaffolding + models + auth took longer than the original plan of 2 hours. It took about 2.5 hours mainly becuase of designing the schema. Actual auth logic took less time once started.

Session 2 (planned 3h, covering program CRUD, membership, shift CRUD, and frontend scaffold): backend CRUD (programs, membership, shifts) went below estimate. Frontend auth flow + basic UI + Tailwind styling ended up spilling past the original Day 2 slot and into a later session, since the original 3h block only budgeted for a bare scaffold, not a full auth context + protected routing + styled pages. Total it took around 3 hours

Session 3 (planned as lifecycle + search, 2h): this session ended up covering the major part — fill-state derivation with unit tests, signup/cancel with the cross-program overlap check, manual shift close, immutable history (timeline view + coordinator notes), cross-program search with pagination, plus frontend for shift signups. Took around 2.5 hours, mainly due to search testing.

Session 4 (backend: dashboard, recurring generator, CSV export, planned 1.5h): built the dashboard's four aggregation queries, and the recurring shift generator + CSV roster export. All backend endpoints tested directly via Postman before moving to their frontends. Took what was estimated

Session 5 (frontend: search, dashboard, recurring generator, CSV, shift timeline, planned 2h): built the corresponding UI for everything from Session 4, plus the shift timeline view that had been backend-only since earlier. Took a little more than 2 hours because of a dashboard bug due to a local-time-vs-UTC mismatch between how JS computed week boundaries and how MongoDB's $dateTrunc truncated them by default — fixed by anchoring both sides to UTC explicitly.

Session 6 (alerts, deployment, planned 1.5 hours): built the understaffed-alerts service and its
dismiss/reappear logic (the last of the 10 required goals), plus its frontend page and the nav badge.
Also completed deployment: MongoDB Atlas (already provisioned from Day 1), backend to Render, frontend
to Vercel, plus a cron job pinging /health every 10 minutes to reduce Render's free-tier cold start. Took 2 hours due to alert testing, and production testing after deployment.

Session 7 (frontend coverage audit and gaps): triggered by manually testing the deployed app and
finding archiving a program didn't work from the UI — traced back to the API route existing and being
Postman-tested, but no frontend button ever built for it. That prompted a systematic audit of every
coordinator-only backend route against the frontend, which surfaced three more real gaps in required-
goal actions: managing program membership (add/remove a volunteer — a core Goal 5 action) had no UI at
all, and editing/deleting/closing a shift (Goal 4's own "close shift" action, explicitly named in the
brief) also had no UI, despite all of these routes being tested and working via Postman. Also found and
fixed a genuine backend bug in the same pass: the recurring shift generator created shifts through a
different code path than the regular create-shift route, and that path never logged a "created"
ShiftEvent — a case of two routes doing the same underlying thing drifting out of sync. Took 40 mins.

## What did you cut when you ran short?

Nothing from the 10 required goals — all ten are fully implemented, backend and frontend, and tested.
The one thing deliberately left API-only rather than given a UI: coordinators signing up a volunteer
on their behalf (the signup route supports a `volunteerId` param and was tested via Postman, but no
frontend picker exists for a coordinator to choose which volunteer). No stretch goals were attempted —
time went entirely into the 10 required goals plus the documentation, rather than partially into a
stretch goal on top of an incomplete core.