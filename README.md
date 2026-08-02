# FinanceFlow — Full-Stack

A personal finance dashboard: React (Vite + Tailwind) frontend backed by a
Node/Express + MongoDB API with JWT authentication. Every user's
transactions, categories, budgets, and savings goals are stored server-side
and synced on login — no more localStorage-only data trapped in one browser.

```
financeflow-fullstack/
├── backend/     Node/Express + MongoDB API (JWT auth, per-user data)
└── frontend/    React + Vite dashboard (calls the backend over HTTP)
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB instance — either:
  - a local `mongod` (e.g. `brew install mongodb-community` / your distro's package), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (get a connection string)

## 2. Setup

From the `financeflow-fullstack` root:

```bash
npm run install:all
```

This installs dependencies for both `backend/` and `frontend/`. (You can also
`cd` into each folder and run `npm install` separately.)

### Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/financeflow   # or your Atlas connection string
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend environment

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` just needs to point at the backend:

```
VITE_API_URL=http://localhost:5000/api
```

(The default already matches the backend's default port, so this step is
only required if you change `PORT` on the backend.)

## 3. Run it

From the **root** folder, run both servers together:

```bash
npm run dev
```

- Backend API: `http://localhost:5000` (health check at `/api/health`)
- Frontend: `http://localhost:5173`

Or run them separately in two terminals:

```bash
npm run dev:backend    # nodemon, auto-restarts on changes
npm run dev:frontend   # Vite dev server with HMR
```

Open `http://localhost:5173`, click **Create one** to register a new account
(this also seeds the default categories for you), and start using the app.
Every action — adding a transaction, setting a budget, creating a goal —
now hits the real API and persists in MongoDB.

## 4. Production build

```bash
npm run build:frontend
```

Outputs a static build to `frontend/dist/`, which you can serve with any
static host (the backend stays a separate Node process — set
`VITE_API_URL` to your deployed API's URL before building). For the backend,
`npm start --prefix backend` runs it with plain `node` (no nodemon).

## What changed from the original two projects

The frontend was originally a localStorage-only app; the backend was a
separate, unconnected Express/MongoDB API. This merged version adds:

- **`frontend/src/api/`** — a fetch client (`client.js`) plus one module per
  resource (`auth`, `transactions`, `categories`, `budgets`, `goals`) and
  `adapters.js`, which maps the backend's field names (`description`,
  `currentAmount`, `targetDate`, Mongo `_id`, …) to the frontend's original
  shape (`title`, `savedAmount`, `deadline`, `id`, …) so every existing page
  and component kept working unchanged.
- **`frontend/src/context/AuthContext.jsx`** — login/register/logout, session
  restore from a saved JWT, profile updates.
- **`frontend/src/pages/Login.jsx`, `Register.jsx`**, and
  **`frontend/src/components/ProtectedRoute.jsx`** — auth screens and a route
  guard so the dashboard requires sign-in.
- **`frontend/src/context/FinanceContext.jsx`** was rewritten to call the
  backend API instead of `localStorage` for every read/write, while keeping
  the exact same function names and signatures (`addTransaction`,
  `updateBudget`, `addGoal`, CSV import, backup/restore, etc.) it always had.

A few things worth knowing:

- **Budgets** are backend-modeled per month/year/category; the UI still shows
  a simple "this category's budget" view, scoped automatically to the
  current calendar month.
- **Dark mode** stays a device-local preference (it isn't a backend field on
  the user model).
- **"Undo" on a deleted transaction** re-creates it via the API (it gets a
  new id) since the backend doesn't support restoring a specific record.
- **Restore Backup / Clear All Data** (Settings page) now operate on your
  real server-side data, not just this browser's storage.
