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



## Decision 5

- **Chose:** Store Shift.startTime as a "HH:mm" string field, combined with date + durationMinutes into
real Date objects only at query/comparison time (in the overlap-check service, to be built).
- **Rejected:** Storing a single combined startDateTime field, or startTime as a Date itself.
- **Why:** "HH:mm" is simpler to render/edit in forms and matches how a coordinator naturally thinks
about a shift. The tradeoff is every time-window comparison needs to reconstruct a real Date on the
fly — accepted since that reconstruction will live in one shared service function, not scattered
across routes.



## Decision 6

- **Chose:** Program membership is entirely coordinator-initiated — a coordinator adds an existing
registered user (by searching name/email) to a program directly. No volunteer-facing "join" or
"request to join" action exists anywhere.
- **Rejected:** A self-serve join flow (volunteer browses programs, requests to join, coordinator
approves/rejects).
- **Why:** Goal 5's language is consistently one-directional ("only a coordinator can add or remove a
volunteer") with no mention of a request or approval state, and the brief's own scenario describes a
coordinator who already knows their volunteers personally (replacing a group chat), not a public
marketplace of strangers self-enrolling. A volunteer still self-registers an account (Goal 1) — the
coordinator just needs that account to already exist before they can add them to a program.



## Decision 7

- **Chose:** Registration form includes a role dropdown (coordinator/volunteer) — the user self-selects
their role at signup.
- **Rejected:** Invite-only coordinator creation, or an admin-approval flow for coordinator accounts.
- **Why:** The brief specifies role-based server-side enforcement of actions, but says nothing about how
a coordinator account gets created in the first place. Self-select is a known simplification — in a
real deployment this would be a security gap, and would instead be gated behind an invite link or an
existing coordinator promoting a user. For this assignment, self-select keeps registration simple and
lets a reviewer create test accounts of either role directly, not solely dependent on seeded demo
credentials.
  ## Decision 8
- **Chose:** Dashboard is visible to both roles, and its counts (signups, breakdown by state/program)
aggregate across everyone in the viewer's scoped programs, not just the logged-in user's own activity.
- **Rejected:** Restricting the dashboard to coordinators only, or scoping counts to "my own signups."
- **Why:** Goal 8 doesn't restrict the dashboard by role, and a headline metric like "signups this week"
is describing overall program activity, which is useful to a volunteer too. No individual identity is
exposed in any dashboard response — only counts — so there's no privacy concern in aggregating across
all members of a program the volunteer already belongs to.

## Decision 9

- **Chose:** The Alerts page and nav badge refresh via polling (every 15s / 30s respectively) rather

  than an event-based refresh triggered by the exact action that changes alert-relevant data (a cancel

  or a state change).

- **Rejected:** A shared global state/event system that notifies the Alerts page and badge immediately

  when a relevant action happens elsewhere in the app.

- **Why:** Polling is simple, requires no new architecture, and is accurate within 15-30 seconds, which

  is reasonable for a coordinator checking staffing levels — nothing in this app requires sub-second

  real-time updates. An event-based system would add real complexity (a shared pub/sub mechanism across

  unrelated pages) for a marginal gain given the brief's actual requirements.

