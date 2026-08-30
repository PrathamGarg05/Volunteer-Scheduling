# AI prompts

## Schema and architecture design

### Prompt
Provided the full assignment brief (all 10 goals, with exact attention to Goal 4's shift-lifecycle
rules and Goal 10's alert dismiss/reappear rule) and asked: monolith vs microservices given a 12-hour
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