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