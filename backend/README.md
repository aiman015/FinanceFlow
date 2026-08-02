# FinanceFlow Backend

A Node/Express + MongoDB API that replaces FinanceFlow's `localStorage` persistence with
real server-side storage, per-user accounts, and JWT authentication.

## Stack
- Express 4
- MongoDB via Mongoose 8
- JWT auth (bcryptjs + jsonwebtoken)
- express-validator for request validation
- helmet + express-rate-limit for basic hardening

## Features implemented
- **Auth**: register / login / get & update profile (JWT, bcrypt-hashed passwords)
- **Transactions**: full CRUD, pagination, and advanced search/filtering
  (text search, type, multi-category, date range, amount range, sorting)
- **Recurring transactions**: mark a transaction as recurring (daily/weekly/monthly/yearly);
  a background job generates the next real transaction when it's due and notifies the user
- **Budgets**: monthly/yearly limits per category, with live "spent" totals
- **Budget alerts**: automatic notifications at 50% / 90% / 100% of a budget, fired once per
  threshold per period
- **Goals**: CRUD with automatic "goal reached" notification
- **Categories**: CRUD, seeded automatically on signup to match the current frontend defaults
- **Notifications**: list / mark read / mark all read / delete — real backend-driven data
  instead of the static panel

Every resource is scoped to `req.user`, so users only ever see their own data — this is what
enables multi-device sync: log in from any device, hit the same API, see the same data.

## Getting started

```bash
npm install
cp .env.example .env
# edit .env: set MONGO_URI (local mongod or a free MongoDB Atlas cluster) and JWT_SECRET
npm run dev   # nodemon, or `npm start` for plain node
```

Health check: `GET http://localhost:5000/api/health`

## API overview

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/register | — | name, email, password |
| POST | /api/auth/login | — | email, password |
| GET  | /api/auth/me | ✓ | current user |
| PUT  | /api/auth/me | ✓ | update name/currency |
| GET  | /api/transactions | ✓ | query: page, limit, search, type, category, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder |
| POST | /api/transactions | ✓ | supports isRecurring + recurrence |
| PUT/DELETE | /api/transactions/:id | ✓ | |
| POST | /api/transactions/bulk-delete | ✓ | { ids: [...] } |
| GET/POST/PUT/DELETE | /api/budgets | ✓ | |
| GET/POST/PUT/DELETE | /api/goals | ✓ | |
| GET/POST/PUT/DELETE | /api/categories | ✓ | |
| GET | /api/notifications | ✓ | |
| PUT | /api/notifications/:id/read | ✓ | |
| PUT | /api/notifications/read-all | ✓ | |
| DELETE | /api/notifications/:id | ✓ | |

All protected routes expect `Authorization: Bearer <token>`.

## Connecting the existing frontend

The frontend currently reads/writes everything through `src/hooks/useLocalStorage.js`.
The lowest-effort migration path:

1. Add an `AuthContext` (login/register screens, store the JWT — e.g. in memory + a cookie
   or localStorage just for the token, not the data).
2. Add an `api.js` helper that wraps `fetch`, attaches the `Authorization` header, and points
   at this server's base URL.
3. Replace each `useLocalStorage('transactions', ...)`-style hook with a hook that calls the
   matching API endpoint (e.g. `useTransactions()` calling `GET/POST/PUT/DELETE /api/transactions`),
   keeping the same shape your components already expect so `TransactionTable.jsx`,
   `Dashboard.jsx`, etc. need minimal changes.
4. Keep `backup.js` (export/import) working against the API instead of localStorage — it's a
   nice "download my data" feature either way.
5. Notifications: point `NotificationPanel.jsx` at `GET /api/notifications` and poll or use a
   simple interval; a websocket/SSE push is a good future upgrade but not required to ship this.

## Production notes
- Swap the `setInterval` recurring-transaction job in `server.js` for a proper scheduler
  (e.g. `node-cron`) or an external cron hitting a protected endpoint — `setInterval` resets
  on every restart/deploy.
- Set `NODE_ENV=production` and a strong, unique `JWT_SECRET`.
- Point `CLIENT_ORIGIN` at your deployed frontend URL(s) (comma-separated for multiple).
