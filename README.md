# Volunteer Scheduling

A system for community organizations to run volunteer programs and shifts: coordinators create
programs and shifts, volunteers sign up, and every count — spots filled, understaffed shifts,
volunteer hours — is derived live from actual signups rather than tracked by hand.

Built as a take-home assignment. Full design reasoning lives in [`docs/`](docs/) — this README covers
what the system does, how to run it, and the full API surface.

## Table of contents

- [Features](#features)
- [Stack](#stack)
- [Folder structure](#folder-structure)
- [Running locally](#running-locally)
- [Seeding demo data](#seeding-demo-data)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Documentation](#documentation)

## Features

- **Two roles, enforced server-side**: coordinators manage programs/shifts/membership; volunteers
  self-serve signups within programs they belong to. Every restriction is checked in middleware, not
  just hidden in the UI.
- **A real shift lifecycle**: `Open → Partially Filled → Filled → Closed`, always derived from signup
  count vs required headcount — never set by hand. Signups are blocked on Filled/Closed shifts, and on
  any shift whose time window overlaps another shift the volunteer already holds, across all programs.
- **Immutable history**: every shift has an append-only timeline (creation, state changes, signups,
  cancellations, coordinator notes) — no route exists to edit or delete a history entry, by anyone.
- **Server-side search**: cross-program shift search with text search, filters, sorting, and pagination,
  all done in a MongoDB aggregation pipeline — no client-side filtering of a full dataset.
- **Recurring shift generation**: bulk-create shifts from a weekly pattern over a date range, with
  holiday exclusion and duplicate detection, reporting exactly what was created vs skipped and why.
- **Understaffed alerts**: shifts within 3 days that are still Open/Partially Filled surface as alerts;
  dismissing one is scoped to that specific understaffed episode, so a later regression correctly
  brings the alert back.
- **A dashboard**: weekly headline numbers, breakdown by fill state and by program, and an 8-week
  signup trend chart.
- **CSV roster export**: every volunteer's total hours in a program, computed from active signups.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Recharts |
| Backend | Node.js, Express (ES6 modules) |
| Database | MongoDB (Atlas), via Mongoose |
| Auth | JWT (Bearer token) + bcrypt |

Architecture is a monolith by design — see [`docs/decisions.md`](docs/decisions.md#decision-1) for why.

## Folder structure
```
volunteer-scheduling/
├── client/ # React frontend
│ └── src/
│ ├── api/ # one file per resource — axios calls only
│ ├── components/ # NavBar, ProtectedRoute, FillStateBadge, ShiftTimeline, etc.
│ ├── context/ # AuthContext
│ ├── hooks/ # useAuth
│ └── pages/ # Login, Register, ProgramsList, ProgramDetail,
│ # Dashboard, ShiftSearch, Alerts
│
├── server/ # Express backend
│ ├── server.js # entry point — connects DB, starts listening
│ └── src/
│ ├── app.js # Express app + route mounting (no listen())
│ ├── config/ # env loading + validation, DB connection
│ ├── models/ # 7 Mongoose schemas (see docs/schema.md)
│ ├── controllers/ # request/response handling per resource
│ ├── services/ # business logic — fillState, overlap, recurring,
│ │ # csv, alerts, dashboard, shiftSearch
│ ├── middleware/ # requireAuth, requireRole
│ ├── routes/ # route wiring per resource
│ └── seed/ # demo data seed script
│
├── docs/ # architecture, schema, plan, decisions, AI usage log
├── SUBMISSION.md # links, demo credentials, goal checklist
└── README.md # this file
```

## Running locally

**Prerequisites**: Node.js 18+, a MongoDB connection string (Atlas free tier or local).

```bash
git clone https://github.com/PrathamGarg05/Volunteer-Scheduling.git
cd Volunteer-Scheduling

cd server && npm install
cd ../client && npm install
```

**`server/.env`** (copy from `server/.env.example`):
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**`client/.env`**: (copy from `client/.env.example`):
```
VITE_API_URL=http://localhost:5000/api
```


**Run both** (two terminals):
```bash
cd server && npm run dev      # http://localhost:5000
cd client && npm run dev      # http://localhost:5173 (Vite will print the actual port)
```

**Run backend tests**:
```bash
cd server && npm test
```

<!-- ## Seeding demo data

```bash
cd server && node src/seed/seed.js
```

Creates demo coordinators, volunteers, programs, and shifts spanning every fill state — see
`SUBMISSION.md` for the actual demo credentials this produces. -->

## API reference

All routes except `/api/auth/*` and `/health` require `Authorization: Bearer <token>`. Routes marked
🔒 additionally require the `coordinator` role — enforced server-side, returns `403` otherwise.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account (role self-selected — see `decisions.md`) |
| POST | `/api/auth/login` | Log in, returns a JWT |

### Programs
| Method | Path | Description |
|---|---|---|
| POST | `/api/programs` 🔒 | Create a program |
| GET | `/api/programs` | List programs (coordinators: all; volunteers: only ones they belong to) |
| GET | `/api/programs/:id` | Get one program |
| PUT | `/api/programs/:id` 🔒 | Edit a program |
| PATCH | `/api/programs/:id/archive` 🔒 | Archive (hides from default views, keeps data) |
| PATCH | `/api/programs/:id/restore` 🔒 | Restore an archived program |
| GET | `/api/programs/:id/roster.csv` 🔒 | Download CSV of volunteer hours for this program |

### Program membership
| Method | Path | Description |
|---|---|---|
| POST | `/api/programs/:id/members` 🔒 | Add a volunteer to a program |
| GET | `/api/programs/:id/members` 🔒 | List a program's members |
| DELETE | `/api/programs/:id/members/:volunteerId` 🔒 | Remove a volunteer |

### Shifts
| Method | Path | Description |
|---|---|---|
| POST | `/api/programs/:id/shifts` 🔒 | Create a shift |
| GET | `/api/programs/:id/shifts` | List a program's shifts |
| GET | `/api/programs/:id/shifts/:shiftId` | Get one shift |
| PUT | `/api/programs/:id/shifts/:shiftId` 🔒 | Edit a shift (re-derives fill state if headcount changes) |
| DELETE | `/api/programs/:id/shifts/:shiftId` 🔒 | Delete a shift |
| PATCH | `/api/programs/:id/shifts/:shiftId/close` 🔒 | Manually close a shift (locks further changes) |
| POST | `/api/programs/:id/shifts/recurring` 🔒 | Bulk-generate shifts from a weekly pattern |

### Signups
| Method | Path | Description |
|---|---|---|
| POST | `/api/programs/:id/shifts/:shiftId/signups` | Sign up (self, or on behalf of another volunteer if coordinator) |
| PATCH | `/api/programs/:id/shifts/:shiftId/signups/:signupId/cancel` | Cancel a signup |
| GET | `/api/programs/:id/signups/mine` | Get the logged-in volunteer's signups for this program |

### Shift history
| Method | Path | Description |
|---|---|---|
| GET | `/api/programs/:id/shifts/:shiftId/events` | Full timeline for a shift |
| POST | `/api/programs/:id/shifts/:shiftId/events/notes` 🔒 | Add a coordinator note (append-only) |

### Cross-program search
| Method | Path | Description |
|---|---|---|
| GET | `/api/shifts` | Search/filter/sort/paginate shifts across all visible programs. Query params: `search`, `program`, `status`, `dateFrom`, `dateTo`, `sortBy` (`date`\|`startTime`\|`status`), `sortOrder` (`asc`\|`desc`), `page`, `limit`, `includeArchived` |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Headline numbers, breakdown by state/program, 8-week signup trend |

### Alerts
| Method | Path | Description |
|---|---|---|
| GET | `/api/alerts` | List understaffed shifts (date ≤ 3 days out, status Open/Partially Filled) |
| POST | `/api/alerts/:shiftId/dismiss` 🔒 | Dismiss an alert (scoped to the current understaffed episode) |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check — used by the deployment's keep-alive ping |

## Deployment

- **Frontend**: Vercel
- **Backend**: Render (free tier — see `SUBMISSION.md` for cold-start notes)
- **Database**: MongoDB Atlas (free M0)

## Documentation

| File | Contents |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System design, a full request-path trace, what wasn't built and why |
| [`docs/schema.md`](docs/schema.md) | ER diagram, every collection's fields, indexes, and denormalization choices |
| [`docs/plan.md`](docs/plan.md) | How the work was sequenced, estimate vs actual per session |
| [`docs/decisions.md`](docs/decisions.md) | Key design decisions, rejected alternatives, and one reversed decision |
| [`docs/ai-prompts.md`](docs/ai-prompts.md) | AI usage log, including bugs found and corrected |

