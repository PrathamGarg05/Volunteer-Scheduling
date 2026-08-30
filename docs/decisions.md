# Decisions

## Decision 1

- **Chose:** Monolith — one Express API + one React app + one MongoDB Atlas database.
- **Rejected:** Microservices (e.g. splitting auth, scheduling, and reporting into separate services).
- **Why:** None of the 10 required goals need service isolation — Goal 6 (cross-program search) and
  Goal 8 (dashboard) both read across programs/shifts/signups in single queries, which a service split
  would turn into network calls for no functional benefit.

## Decision 2

- **Chose:** ProgramMember as its own join collection, not an embedded array on User or Program.
- **Rejected:** Embedding a `members: [volunteerId]` array directly on Program.
- **Why:** It's a genuine many-to-many relationship (a volunteer belongs to many programs, a program has
  many volunteers). An array keeps parent documents small at this scale, but a separate collection is
  the honest model of the relationship and keeps membership queries (e.g. "is this volunteer in this
  program") a simple indexed lookup rather than an array-contains check against a document that could
  grow unbounded.

## Decision 3

- **Chose:** ShiftEvent as a fully separate, append-only collection referencing Shift by id.
- **Rejected:** Storing history as a `timeline: []` array nested inside the Shift document.
- **Why:** The brief requires that no history entry can ever be edited or deleted, including by
  coordinators. With history as a separate collection, that guarantee is enforced by simply never
  writing an update or delete route for it — there's no endpoint to misuse. A nested array would need
  every future Shift-editing code path to remember not to touch it, which is a rule that's easy to
  accidentally violate later.

## Decision 4

- **Chose:** AlertDismissal records the timestamp of the specific state-transition into understaffed
  (`stateEnteredAt`), not a boolean `dismissed` flag on the Shift.
- **Rejected:** A simple `dismissed: true/false` field on Shift.
- **Why:** The brief requires the alert to reappear if a cancellation later drops a Filled shift back to
  Open/Partially Filled within the 3-day window. A boolean flag has no way to distinguish "dismissed
  and still valid" from "dismissed, but the shift has since re-entered understaffed" — it would just
  stay permanently dismissed. Scoping the dismissal to the transition timestamp means a new transition
  is simply not covered by the old dismissal.