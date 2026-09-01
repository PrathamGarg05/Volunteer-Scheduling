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