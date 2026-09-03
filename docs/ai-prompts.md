# AI prompts

## Schema and architecture design

### Prompt

Provided the full assignment brief (all 10 goals, with exact attention to Goal 4's shift-lifecycle
rules and Goal 10's alert dismiss/reappear rule) and asked: monolith vs microservices given a time
budget, then asked for a complete folder structure, then asked for help sketching the data model.

### What you got

A recommendation for a monolith with a layered folder structure (routes/controllers/services/models),
a 7-entity schema (User, Program, ProgramMember, Shift, Signup, ShiftEvent, AlertDismissal) with an ER
diagram, and reasoning for three specific modeling choices: ProgramMember as a join collection instead
of an embedded array, ShiftEvent as a separate append-only collection instead of a nested array, and
AlertDismissal tracking a state-transition timestamp instead of a boolean flag.

### What you corrected

Nothing wrong yet — this was design-stage discussion, not generated code. Will update this section
once implementation surfaces a bad suggestion; the likely candidate is the overlap-check query logic.

## Mongoose model implementation

### Prompt

Asked for all 7 Mongoose models generated in ES6 module syntax, matching schema.md's field list and
planned indexes exactly.

### What you got

7 model files (User, Program, ProgramMember, Shift, Signup, ShiftEvent, AlertDismissal) with validation,
enums matching Goal 4's exact fill-state values, and the planned indexes (program+date+status and a
text index on Shift, volunteer+status and shift+status on Signup, a unique compound index on
ProgramMember).

### What you corrected

Nothing wrong in the generated code — verified each file against schema.md field-by-field before
committing.

## Auth implementation and testing

### Prompt

Asked for register/login controllers (bcrypt hashing, JWT issuing), a requireAuth middleware to verify
the token, and a requireRole(...roles) middleware factory for coordinator-only routes — matching the
brief's requirement that role enforcement happen server-side, not just in the UI.

### What you got

auth.controller.js (register/login, never returns passwordHash in responses), auth.middleware.js,
role.middleware.js, wired into app.js under /api/auth.

### What you corrected

Nothing wrong in the generated code. Tested both register and login in Postman before committing —
confirmed passwordHash never appears in any response, and both role types can register and receive a
valid token.

## Program CRUD

### Prompt

Asked for program create/read/update/archive/restore routes, coordinator-only for writes, with
visibility scoped by role (coordinators see all programs, volunteers see only ones they belong to
via ProgramMember).

### What you got

program.controller.js with 6 handlers and program.routes.js wiring them with requireAuth/requireRole.

### What you corrected

Nothing wrong in the code, but had to decide an ambiguity the brief doesn't address: whether coordinators
should be scoped to programs they created, or see all programs. Went with "all programs" since Goal 1
only restricts volunteer visibility, not coordinator visibility — logged as Decision 8.

Tested all 8 flows in Postman: create (coordinator success, volunteer 403), list (role-scoped correctly,
volunteer sees empty array pre-membership), get-by-id (volunteer correctly blocked from a non-member
program), archive/restore (correctly hidden/shown from default list). All passed on first implementation.

## Program membership

### Prompt

Asked for add/remove/list member routes, coordinator-only, nested under a program (e.g.
/api/programs/:id/members), matching Goal 5's membership rules.

### What you got

programMember.controller.js (addMember, removeMember, getProgramMembers) and a nested Express router
using mergeParams: true to access the parent route's :id param.

### What you corrected

Nothing wrong in the code. Learned the mergeParams pattern for nested routers, since Express routers
don't inherit parent params by default.

Tested: add (success, duplicate correctly rejected with 409, volunteer correctly blocked with 403),
list with populated volunteer name/email, and the actual end-to-end proof — GET /api/programs as that
volunteer went from empty to showing the program after being added, then back to empty after removal.
Also independently tested that archiving a program hides it from an already-added volunteer's view too,
not just the coordinator's — confirms the isArchived filter is applied consistently across both role
branches in getPrograms.

## Shift CRUD

### Prompt

Asked for shift create/read/update/delete routes nested under a program, coordinator-only for writes,
with volunteer access gated by program membership (matching the same pattern used for programs and
membership routes).

### What you got

shift.controller.js with 5 handlers, shift.routes.js using mergeParams to access the parent program id.
Flagged two judgment calls in code comments rather than silently deciding them: (1) editing a Closed
shift is blocked, even though the brief only explicitly locks signups/cancellations on Closed shifts,
not edits; (2) deleteShift currently has no check against existing signups, since Signup doesn't exist
yet — noted as a gap to revisit once it does.

### What you corrected

Nothing wrong in the generated code — the two flagged items above are open judgment calls, not bugs.

Tested: create (coordinator success, volunteer 403), list scoped correctly (member volunteer sees
shifts, non-member volunteer gets 403), update, delete — all as expected.

## Frontend auth flow and basic UI

### Prompt

Asked for a React auth context (login/logout, localStorage-backed), a ProtectedRoute wrapper for
role-gated pages, login/register pages, and basic functional (unstyled) program list + program detail
screens wired to the already-built API.

### What you got

AuthContext.jsx, useAuth hook, ProtectedRoute component, Login/Register pages, ProgramsList and
ProgramDetail pages, an axios instance with an interceptor that auto-attaches the JWT to every request.

### What you corrected

Nothing wrong in the generated code. Confirmed with Claude that ProtectedRoute is a UI convenience only,
not the actual security boundary — the server-side requireRole middleware (already tested with real
403s) is what actually enforces access; the frontend gate just avoids showing a coordinator-only form
to a volunteer.

## Tailwind CSS setup and styling pass

### Prompt

Asked to add Tailwind CSS to the existing Vite/React app and restyle the login, register, program list,
and program detail screens, plus a shared FillStateBadge component for consistent status colors across
what will later also be the dashboard and alerts views.

### What you got

Tailwind v4 setup via @tailwindcss/vite (no separate config file needed, unlike v3), a NavBar component,
a FillStateBadge component, and restyled JSX for the existing pages using utility classes only.

### What you corrected

Flex containers don't wrap by default, so once 5 inputs + a button exceeded the available width, elements got squeezed
and overflowed instead of moving to a new line.
Replaced the flex row with a responsive CSS grid (1 column on mobile, 2 on small screens, 3 on large),
moved the submit button outside the grid as its own full-width element below it, and added labels above
each input. Applied the same fix to the program-creation form.

## Fill-state unit tests

### Prompt

Asked for the fill-state derivation unit tests covering the exact boundary cases (zero
signups, exact match, headcount of 1, over-capacity).

### What you got

8 vitest unit tests, all passing. Function throws on invalid input
(negative count, headcount < 1) rather than silently returning something wrong.

### What you corrected

Nothing wrong in the logic. Understood unit tests.

## Signup, overlap check, and shift lifecycle

### Prompt

Asked for the overlap-check service (cross-program, using interval-overlap math on reconstructed shift
time windows), the signup/cancel controllers enforcing capacity + overlap + membership, a manual
close-shift transition, and append-only ShiftEvent logging on create/signup/cancel/state-change.

### What you got

overlap.service.js, signup.controller.js, an update to shift.controller.js for closeShift and a
"created" event on shift creation, all wired with routes.

### What you corrected

Nothing wrong in the generated overlap logic itself — it was cross-program by design from the start. Tested it specifically by creating two shifts in different programs with overlapping times and confirming the second signup was correctly rejected — this was the actual verification step, not just trusting the code.
Found 2 bugs while testing which were resolved and logged below.

## Bug: cancel didn't validate signup-shift relationship

### Prompt
Reported that cancelling with a mismatched shiftId/signupId pair in the URL still returned "already
cancelled" instead of a not-belonging error, discovered through manual testing, not from an AI-flagged
issue.

### What you got (the original, wrong version)
cancelSignup fetched the Signup by signupId alone and never cross-checked it against the shiftId also
present in the nested route path, so an inconsistent URL silently "worked" as long as the signupId
itself was valid.

### What you corrected
Added an explicit check that signup.shift matches the shiftId param before proceeding, returning 400
if not. Generalized takeaway: any route with multiple related ids in its path needs an explicit
consistency check between them — the nesting implies a relationship the code has to actually verify.

## Bug: updating headcount didn't re-derive fill state

### Prompt
Reported that reducing/increasing a shift's requiredHeadcount after it was already Filled didn't
change its status, even with the signup count now below the new headcount.

### What you got (the original, wrong version)
updateShift's original code (written on Day 2, before Signup or fillState.service.js existed) had a
comment flagging this exact gap as something to revisit once those existed — and it was never revisited
until this manual test surfaced it as a live bug.

### What you corrected
Added a re-derivation step inside updateShift: when requiredHeadcount changes, recount active signups,
call deriveFillState, and log a state_change ShiftEvent if the status actually changed. This closes a
gap that was flagged in a code comment weeks earlier but not acted on until testing caught it.

## Signup/cancel frontend

### Prompt
Asked for the frontend signup and cancel flow for shifts, including how to track whether the logged-in
volunteer already holds a signup for each shift shown in the list.

### What you got
A small new backend endpoint (getMySignupsForProgram) since the existing shift list had no way to
convey a viewer's own signup status, plus signups.api.js and updated ProgramDetail.jsx with a
mySignups state map, sign up / cancel buttons conditionally rendered based on role, signup status,
and shift fill-state.

### What you corrected
Realized mid-build that the shift list endpoint alone was insufficient for the UI to know "have I
already signed up for this" — needed a dedicated small endpoint rather than trying to infer it
client-side. Not a wrong output, but a gap surfaced only once actually building the UI against the
existing API.

## Cross-program shift search

### Prompt
Asked for server-side search across all shifts a viewer can see, with text search over program name +
location, filters for program/status/date range, sort by date/startTime/fill-state, and pagination with
total count — explicitly no in-memory filtering.

### What you got
An aggregation-pipeline-based service using $lookup (to join Program for name search and archived
filtering), $match, a computed statusRank field for defined fill-state ordering, and $facet to get
paginated results + total count in one query.

### What you corrected
Nothing wrong in the logic. Tested the filtering using Postman to check the aggregated filtering.

## Recurring generator and CSV export

### Prompt
Asked for a bulk shift generator from a weekly pattern (day, time, duration, location, headcount) over
a date range with holiday exclusion, reporting created vs skipped dates with reasons, plus a CSV roster
export of volunteer hours per program.

### What you got
recurring.service.js (date-stepping loop, holiday-set lookup, duplicate detection via an existing-shift
query) and csv.service.js (aggregates active signups per member, sums shift duration into hours, uses
json2csv to format output).

### What you corrected
Nothing wrong in the logic. Confirmed the roster export correctly excludes cancelled signups from hour
totals by filtering status: "active" — tested by cancelling a signup and re-exporting to confirm the
hours dropped.

## Dashboard aggregation and chart

### Prompt
Asked for headline counts (shifts/open shifts/signups/closed shifts this week), breakdown by fill
state and by program, and an 8-week signups trend — all as MongoDB aggregation pipelines scoped by
role (volunteer sees only their programs), plus a React dashboard page using recharts for the bar chart.

### What you got
dashboard.service.js with four aggregation functions, a controller running them concurrently via
Promise.all, and Dashboard.jsx with stat cards, a fill-state breakdown, a per-program breakdown, and
a bar chart.

### What you corrected
Found a bug where the bar chart didn't show any signups. Found out it maybe due to timezone difference between MongoDB's operator(time in UTC), and JS operator which operatoes in the machine's timezone(IST). Working towards resolving it.