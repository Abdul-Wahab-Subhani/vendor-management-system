# API Reference

Base URL: `http://localhost:5000/api/v1`

All responses use the envelope `{ success, message, data, meta? }`. Paginated list endpoints accept `page` and `limit` query params and return `meta: { page, limit, total, totalPages }`.

Auth: protected routes accept either the `accessToken` httpOnly cookie (set automatically on login) or an `Authorization: Bearer <token>` header. Role requirements are noted per endpoint. `SA` = Super Admin, `A` = Admin, `V` = Vendor.

---

## Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Self-register a vendor-role account (pending email verification) |
| POST | `/login` | Public | Returns user + sets access/refresh cookies |
| POST | `/refresh` | Public (refresh cookie) | Rotates refresh token, issues new access token |
| POST | `/logout` | Any | Clears auth cookies |
| POST | `/forgot-password` | Public | Always returns success-shaped response to avoid email enumeration |
| POST | `/reset-password` | Public | Body: `{ token, password }` |
| POST | `/verify-email` | Public | Body: `{ token }` |
| POST | `/change-password` | Any | Body: `{ currentPassword, newPassword }` |
| GET | `/me` | Any | Current user profile |

## Accounts — `/accounts` (Super Admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/` | List accounts — filters: `search`, `role`, `status` |
| POST | `/` | Create Admin/Vendor account (temp password auto-generated + emailed) |
| PATCH | `/:id/status` | `{ status: ACTIVE \| INACTIVE \| SUSPENDED }` |
| PATCH | `/:id/role` | `{ role }` |
| POST | `/:id/reset-password` | Force-reset; optional `{ newPassword }` else auto-generated |
| DELETE | `/:id` | Delete account |
| GET | `/:id/login-history` | Paginated login attempts |

## Vendors — `/vendors` (SA, A — read access for V on own vendor only via assignment scoping elsewhere)

| Method | Path | Description |
|---|---|---|
| GET | `/` | List — filters: `search`, `status`, `category`, `sortBy`, `sortOrder` |
| GET | `/stats` | Counts by status |
| GET | `/:id` | Full detail incl. notes, documents, linked accounts |
| GET | `/:id/activity` | Vendor-scoped activity log |
| POST | `/` | Create vendor |
| PUT | `/:id` | Update vendor |
| PATCH | `/:id/status` | `{ status }` |
| DELETE | `/:id` | Delete vendor |
| POST | `/:id/notes` | `{ content }` |
| POST | `/:id/documents` | Multipart `file` upload |

## Quotations — `/quotations`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/requests` | SA, A | Create request + assign vendors (notified by email/in-app) |
| GET | `/requests` | Any | Vendors only see their own assignments (server-enforced) |
| GET | `/requests/:id` | Any | Vendors only see their own submissions within it |
| PUT | `/requests/:id` | SA, A | Update title/description/status/dueDate |
| POST | `/requests/:id/cancel` | SA, A | Sets status to `CANCELLED` |
| POST | `/requests/:id/assign-vendors` | SA, A | `{ vendorIds: [] }` |
| POST | `/requests/:id/submit` | V | Submit a bid against an assigned request |
| GET | `/` | Any | List quotations — vendors auto-scoped to their own |
| GET | `/stats` | SA, A | Counts by status |
| GET | `/:id` | Any | Single quotation detail |
| PUT | `/:id` | SA, A | Update a quotation record |
| PATCH | `/:id/status` | SA, A | Approve/Reject/Cancel — triggers notification + email |
| POST | `/:id/attachments` | Any | Multipart `file` upload |

## Comparison — `/comparison` (SA, A)

| Method | Path | Description |
|---|---|---|
| GET | `/:requestId` | Side-by-side comparison: lowest price, best-value score, recommendation |
| GET | `/:requestId/export-pdf` | Branded PDF report download |

## Dashboard — `/dashboard` (SA, A)

| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Top-line counts + total approved value |
| GET | `/monthly-analytics?months=6` | Monthly quotation/vendor trend series |
| GET | `/status-breakdown` | Quotation counts grouped by status |
| GET | `/vendor-category-breakdown` | Vendor counts grouped by category |
| GET | `/top-vendors?limit=5` | Top vendors by approved quotation value |
| GET | `/recent-activity?limit=10` | Latest audit log entries |

## Notifications — `/notifications` (any authenticated user)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated, includes `unreadCount` |
| PATCH | `/:id/read` | Mark one as read |
| PATCH | `/read-all` | Mark all as read |

## Emails — `/emails` (SA, A)

| Method | Path | Description |
|---|---|---|
| POST | `/send` | `{ recipientType, vendorIds?, subject, bodyHtml, scheduledFor? }` |
| GET | `/history` | Paginated send log |
| GET | `/templates` | List DB-backed broadcast templates |
| POST | `/templates` | Create template (`{{variable}}` placeholders) |
| PUT | `/templates/:key` | Update template |
| DELETE | `/templates/:key` | Delete template |
| POST | `/templates/:key/preview` | Render with sample variables |

## Activity Logs — `/activity-logs` (SA, A)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Full audit trail — filters: `userId`, `entityType` |

---

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "path": "email", "message": "Invalid email address" }]
}
```

Validation errors return `422`; auth errors `401`/`403`; not-found `404`; conflicts (duplicate email, etc.) `409`.
