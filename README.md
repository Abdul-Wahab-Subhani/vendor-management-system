# Vendor Management & Quotation System (VMS)

A production-grade, full-stack **Vendor Management & Quotation System** — built as a procurement platform that lets organizations onboard vendors, run quotation requests, collect and compare vendor bids, and manage the entire approval workflow from a single dashboard.

Built for the Teyzix Core Full-Stack Internship (Task FS-2), implemented at an enterprise scope: complete RBAC auth, vendor & account management, the full quotation lifecycle, a comparison/recommendation engine, analytics dashboard, branded PDF reports, a transactional + broadcast HTML email system, real-time notifications, and a full audit trail.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query + Table, React Hook Form + Zod, Recharts, Socket.io client, Zustand |
| Backend | Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL |
| Auth | JWT (access + rotating refresh tokens), httpOnly cookies, bcrypt, RBAC |
| Real-time | Socket.io (per-user & per-role rooms) |
| Files | Cloudinary (with automatic local-disk fallback) |
| Email | Nodemailer / Resend (with a console-logging fallback for local dev) |
| PDF | PDFKit (custom branded report generator — no external service) |
| Infra | Docker, Docker Compose |

**Architecture**: the backend follows a clean, layered structure — `routes → controllers → services → Prisma` — with Zod validation middleware, centralized error handling, and a repository-light service layer (Prisma already encapsulates data access cleanly, so service modules own all business logic per domain).

---

## 2. Monorepo Structure

```
vms/
├── backend/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # Full data model (see "Database Design" below)
│   │   └── seed.ts          # Creates the Super Admin + default email templates
│   ├── src/
│   │   ├── config/          # env, logger, prisma client
│   │   ├── controllers/     # HTTP layer
│   │   ├── services/        # business logic (one file per domain)
│   │   ├── middleware/      # auth, RBAC, validation, rate limiting, errors, uploads
│   │   ├── routes/          # Express routers
│   │   ├── validators/      # Zod schemas
│   │   ├── emails/          # branded HTML email layout + templates
│   │   ├── sockets/         # Socket.io server + auth
│   │   ├── jobs/            # scheduled-email background worker
│   │   └── utils/           # jwt, password hashing, API response helpers, errors
│   └── Dockerfile
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── (auth)/           # login, register, forgot/reset password, verify email
│   │   ├── (dashboard)/      # Super Admin / Admin: dashboard, vendors, quotations,
│   │   │                     # comparison, accounts, emails, activity logs, settings
│   │   └── (vendor)/         # Vendor portal: overview, my quotations, settings
│   ├── components/           # ui/ primitives, layout/, domain-specific dialogs
│   ├── hooks/                 # React Query hooks per domain
│   ├── lib/                   # axios client, zustand store, utils
│   └── Dockerfile
└── docker-compose.yml
```

---

## 3. Getting Started

### Option A — Docker Compose (fastest)

```bash
cp backend/.env.example backend/.env   # optional, compose provides sane defaults
docker compose up --build
```

This starts Postgres, runs migrations + seeds a Super Admin, starts the API on `:5000`, and the web app on `:3000`.

**Default Super Admin login:** `superadmin@vms.app` / `ChangeMe123!` (override via `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` env vars before first run — **change this password immediately in any real deployment**).

### Option B — Manual local setup

**Backend**
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL at minimum
npm install
npx prisma migrate dev      # creates tables
npm run prisma:seed         # creates the Super Admin account
npm run dev                 # http://localhost:5000
```

**Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Optional integrations
The app runs fully **without** any third-party keys:
- No `CLOUDINARY_*` keys → file uploads are written to local disk and served from `/uploads`.
- `EMAIL_PROVIDER=console` (default) → emails are logged to the server console instead of sent.

To go live, just set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, and either `EMAIL_PROVIDER=smtp` (+ `SMTP_*`) or `EMAIL_PROVIDER=resend` (+ `RESEND_API_KEY`) in `backend/.env`.

---

## 4. Feature Overview

### Authentication & Authorization
Register/login/logout, forgot/reset password, email verification, JWT access + rotating refresh tokens (httpOnly cookies), protected routes, full RBAC across **Super Admin / Admin / Vendor**, login history, and an activity log of every sensitive action.

### Vendor Management
Full CRUD, search/filter/pagination, vendor profile with notes, document uploads, status (Active/Inactive/Pending/Blacklisted), linked portal accounts, and a per-vendor activity timeline.

### Admin & Vendor Account Management (Super Admin)
Create Admin/Vendor accounts (auto-generated temp password emailed to the user), activate/deactivate, change roles, force-reset passwords, delete accounts, and view login history.

### Quotation Lifecycle
Create a quotation request → assign vendors (each notified by email + in-app) → vendor submits a quotation → Admin reviews → Approve/Reject/Cancel, with full status tracking and history.

### Quotation Comparison Engine
Side-by-side comparison per request: lowest price, a **best-value score** (60% price competitiveness / 40% vendor rating — not just "cheapest wins"), savings potential, a recommendation narrative, and a one-click **branded PDF export** of the whole comparison.

### Analytics Dashboard
Vendor/quotation counts by status, monthly trends, status breakdowns, top vendors by approved value, and a live recent-activity feed.

### Professional Data Tables
Every list view: search, filters, sorting, pagination, CSV/Excel export, sticky header, responsive layout, status badges, and row action menus.

### PDF Reports
Custom-built branded report generator (no external PDF service) — header/footer, page numbers, summary stat cards, styled tables, recommendation block, and a signature section.

### Email System
Branded, responsive HTML templates for every lifecycle event (welcome, verification, password reset, account created, request assigned, quotation submitted/approved/rejected, etc.), plus an admin **broadcast tool** (single vendor / multiple vendors / all vendors / all admins), a DB-backed **template manager** with `{{variable}}` substitution, scheduled sending, and full send history.

### Real-Time Notifications
Socket.io pushes new-notification events live to the right user; a notification center tracks read/unread state.

### Security
Helmet, CORS allowlist, rate limiting (global + tighter auth-route limiting), Zod validation on every input, Prisma parameterized queries (SQL-injection safe by construction), bcrypt password hashing, httpOnly/SameSite cookies, and centralized error handling that never leaks internals in production.

---

## 5. Database Design

See [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) for the full, authoritative schema. Core entities:

- **User** — auth + RBAC (`SUPER_ADMIN` / `ADMIN` / `VENDOR`), optionally linked to a `Vendor`
- **Vendor** — company record (independent of login accounts) with notes, documents, rating
- **QuotationRequest** ↔ **QuotationRequestVendor** (join) ↔ **Vendor** — who was asked
- **Quotation** — a vendor's actual bid against a request, with attachments and review metadata
- **Notification**, **ActivityLog**, **LoginHistory**, **RefreshToken** — supporting auth/audit tables
- **EmailTemplate**, **EmailLog** — the broadcast template manager + send history

A short design note worth calling out: **Vendor** (the company) and **User** (a login account) are deliberately separate models. A vendor can exist purely as a record an Admin manages, exist with a portal login, or have multiple portal users — mirroring how procurement teams actually onboard suppliers before any login ever gets created.

---

## 6. API Reference

Base URL: `/api/v1`. All protected routes require a valid access token (sent automatically via httpOnly cookie, or `Authorization: Bearer <token>`).

| Group | Base Path | Notes |
|---|---|---|
| Auth | `/auth` | register, login, refresh, logout, forgot/reset-password, verify-email, change-password, me |
| Accounts | `/accounts` | Super Admin only — create/list/update/delete admin & vendor accounts |
| Vendors | `/vendors` | CRUD, notes, documents, stats, activity history |
| Quotations | `/quotations` | `/requests` (create/list/assign/cancel), submissions, status updates, attachments |
| Comparison | `/comparison/:requestId` | comparison data + `/export-pdf` |
| Dashboard | `/dashboard` | overview, monthly analytics, breakdowns, top vendors, recent activity |
| Notifications | `/notifications` | list, mark read / mark all read |
| Emails | `/emails` | send (broadcast), history, template manager (CRUD + preview) |
| Activity Logs | `/activity-logs` | full audit trail (Admin/Super Admin) |

Every endpoint returns the same envelope: `{ success, message, data, meta? }`. Validation failures return `422` with a field-level `errors` array.

---

## 7. Roles at a Glance

| Capability | Super Admin | Admin | Vendor |
|---|---|---|---|
| Manage vendors | ✅ | ✅ | — |
| Create quotation requests | ✅ | ✅ | — |
| Submit quotations | — | — | ✅ (own company only) |
| Approve/reject quotations | ✅ | ✅ | — |
| View comparison & export PDF | ✅ | ✅ | — |
| Manage admin/vendor accounts | ✅ | — | — |
| Send broadcast emails | ✅ | ✅ | — |
| View activity logs | ✅ | ✅ | — |

Vendors only ever see quotation requests they've been assigned to, and only their own submissions — enforced server-side, not just hidden in the UI.

---

## 8. Production Notes

- This sandbox's network policy blocks Prisma's engine-binary CDN, so `prisma generate`/`migrate` couldn't be executed *inside the build environment that produced this code*. Run `npx prisma generate && npx prisma migrate dev` yourself the first time — this is completely normal in any real machine with open internet access.
- Swap `EMAIL_PROVIDER` and `CLOUDINARY_*` to real credentials before going live; until then the app degrades gracefully (console-logged emails, local-disk file storage).
- Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `COOKIE_SECRET` and the seeded Super Admin password before deploying anywhere reachable by the public internet.
