# Plan

## How did you break the work into sessions?

1st session (30 mins) for schema and decisions.

## What order did you build in, and why that order?

1. Schema — every route depends on the data model being right.

## What did you estimate versus what it actually took?

Session 1 (planned 2h): scaffolding + models + auth took longer than the original plan of 2 hours. It took about 2.5 hours mainly becuase of designing the schema. Actual auth logic took less time once started.

Session 2 (planned 3h, covering program CRUD, membership, shift CRUD, and frontend scaffold): backend CRUD (programs, membership, shifts) went below estimate. Frontend auth flow + basic UI + Tailwind styling ended up spilling past the original Day 2 slot and into a later session, since the original 3h block only budgeted for a bare scaffold, not a full auth context + protected routing + styled pages. Total it took around 3 hours

Session 3 (planned as lifecycle + search, 2h): this session ended up covering the major part — fill-state derivation with unit tests, signup/cancel with the cross-program overlap check, manual shift close, immutable history (timeline view + coordinator notes), cross-program search with pagination, plus frontend for shift signups. Took around 2.5 hours, mainly due to search testing.

Session 4 (backend: dashboard, recurring generator, CSV export, planned 1.5h): built the dashboard's four aggregation queries, and the recurring shift generator + CSV roster export. All backend endpoints tested directly via Postman before moving to their frontends. Took what was estimated

Session 5 (frontend: search, dashboard, recurring generator, CSV, shift timeline, planned 2h): built the corresponding UI for everything from Session 4, plus the shift timeline view that had been backend-only since earlier. Took a little more than 2 hours because of a dashboard bug due to a local-time-vs-UTC mismatch between how JS computed week boundaries and how MongoDB's $dateTrunc truncated them by default — fixed by anchoring both sides to UTC explicitly.

## What did you cut when you ran short?

*To be filled in on last day, once it's known whether anything actually needed cutting.*