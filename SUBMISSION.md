# Submission

## Links

- **GitHub repository:** [https://github.com/PrathamGarg05/Volunteer-Scheduling](https://github.com/PrathamGarg05/Volunteer-Scheduling)
- **Live application:**  [https://volunteer-scheduling-eight.vercel.app/](https://volunteer-scheduling-eight.vercel.app/)

## Notes for the reviewer

- The backend runs on Render's free tier, which sleeps after 15 minutes of inactivity — a cold start
can take 30-60 seconds. A cron job pings `/health` every 10 minutes to reduce how often this is hit,
but if the app has been idle longer than that, the first request may still be slow. Please wait a
moment on first load rather than assuming it's broken.
- Dashboard and Alerts are noticeably slower than other pages — partly Render's cold start, but also
because Alerts currently runs a small sequence of queries per understaffed shift rather than one 
batched query, and Dashboard runs four separate aggregations per load. Fine at demo
scale; flagged in architecture.md as a real optimization target, not swept under "just hosting."
- All 10 required goals are implemented and tested (see checklist below).



## Demo credentials


| Role        | Email                                                      | Password  |
| ----------- | ---------------------------------------------------------- | --------- |
| Coordinator | alice@demo.com                                             | Demo1234! |
| Volunteer   | bob@demo.com, carol@demo.com, dave@demo.com,emma@demo.com | Demo1234! |




## Stack


| Layer    | What you used                                                 | Why                                                                    |
| -------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend | React (Vite) + Tailwind CSS + React Router                    | Familiar stack, fast to build with, no unnecessary UI library overhead |
| Backend  | Node.js + Express (ES6 modules)                               | Familiar stack; monolith architecture (see decisions.md #1)            |
| Database | MongoDB Atlas (free M0)                                       | Familiar stack, flexible schema fit the varied entity shapes well      |
| Hosting  | Vercel (frontend), Render (backend), MongoDB Atlas (database) | All free-tier; see notes above on Render cold starts                   |




## Goal checklist


| #   | Goal                            | Status | Notes                                                                                          |
| --- | ------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | Accounts and roles              | Done   | Server-side enforced via requireAuth/requireRole middleware, tested with real 403s throughout  |
| 2   | Programs                        | Done   | CRUD + archive/restore                                                                         |
| 3   | Shifts inside programs          | Done   | CRUD nested under programs                                                                     |
| 4   | Shift lifecycle with rules      | Done   | Fill-state derivation, overlap check (cross-program), capacity check, manual close, all tested |
| 5   | Program membership              | Done   | Coordinator-initiated only (see decisions.md #6)                                               |
| 6   | Finding shifts                  | Done   | Server-side aggregation pipeline: search, filter, sort, pagination                             |
| 7   | Recurring schedule + CSV export | Done   | Weekly pattern generator with holiday exclusion + duplicate detection; CSV roster export       |
| 8   | Dashboard                       | Done   | Headline numbers, breakdown by state/program, 8-week signup chart                              |
| 9   | Immutable history               | Done   | Append-only ShiftEvent collection, no update/delete route exists for it                        |
| 10  | Understaffed alerts             | Done   | 3-day window, dismiss + reappear via AlertDismissal.stateEnteredAt scoping                     |




## How much time did you actually spend?

About 15 hours

## What would you do next, with another 12 hours?

- Add a coordinator-facing UI for signing a volunteer up on someone else's behalf (the API supports it
via a `volunteerId` param, but only the volunteer's own self-signup flow has a UI right now).
- Add transaction-level locking on the signup write path to close the theoretical race condition noted
in architecture.md (two simultaneous signups for the last open spot).
- Replace the location search's regex match with a proper `$text` index once the schema no longer needs
to join across `Program` for it — noted in schema.md as the first thing to break at 100x data.
- <add anything else genuinely true once Day 4/5 wrap up>



## What are you least happy with in this codebase, and why?

The gap between "backend tested via Postman" and "actually usable end-to-end" turned out to be bigger
than I expected, and it showed up twice in different forms. First, several coordinator-only actions
(archiving a program, managing membership, editing/deleting/closing a shift) had fully working, tested
API routes but no frontend for a while — I'd verified correctness at the API layer and mentally marked
the feature "done" without checking the UI actually exposed it.

I'm also not happy with some inconsistency in coding patterns that crept in over several sessions:
updateShift uses a fetch-then-save pattern while archiveShift/restoreShift use findByIdAndUpdate, and a
few file names (ProgramList.jsx, ProgramDetails.jsx, ProgramMember.jsx for a component that manages
plural members) don't match the naming I'd originally planned. None of these are bugs, but they're the
kind of small friction a future maintainer — or me, in three weeks — would trip over, and I'd clean
them up first with any additional time.

