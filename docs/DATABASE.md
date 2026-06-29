# Database Design

Engine: **PostgreSQL**, accessed via **Prisma ORM**. Authoritative source: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

## Entity Relationship Overview

```
                 ┌──────────────┐
                 │     User     │  (SUPER_ADMIN / ADMIN / VENDOR)
                 └──────┬───────┘
           ┌────────────┼───────────────┬───────────────┐
           │            │               │               │
     RefreshToken  LoginHistory   ActivityLog      Notification
                          (createdBy / reviewedBy FKs also
                           point from QuotationRequest /
                           Quotation back to User)
                 │
                 │ vendorId (nullable — vendor portal login)
                 ▼
            ┌─────────┐        ┌────────────────┐
            │ Vendor  │◄───────┤  VendorNote     │
            └────┬────┘        └────────────────┘
                 │              ┌────────────────┐
                 ├─────────────►│ VendorDocument  │
                 │              └────────────────┘
                 │
                 │ (via join table)
                 ▼
     ┌─────────────────────────┐
     │ QuotationRequestVendor  │  (who was assigned, + their status)
     └────────────┬────────────┘
                  │
                  ▼
          ┌────────────────────┐
          │  QuotationRequest  │
          └─────────┬──────────┘
                     │ 1-to-many
                     ▼
               ┌───────────┐        ┌──────────────────────┐
               │ Quotation │◄───────┤ QuotationAttachment  │
               └───────────┘        └──────────────────────┘

          ┌────────────────┐      ┌────────────┐
          │  EmailTemplate │      │  EmailLog  │
          └────────────────┘      └────────────┘
```

## Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | Auth + RBAC | `email` (unique), `passwordHash`, `role`, `status`, `vendorId` (nullable FK) |
| `refresh_tokens` | Rotating JWT refresh tokens | `tokenHash` (unique), `expiresAt`, `revokedAt` |
| `login_history` | Every login attempt | `success`, `ipAddress`, `userAgent` |
| `activity_logs` | Full audit trail | `action`, `entityType`, `entityId`, `description`, `metadata` (JSON) |
| `notifications` | In-app notification center | `type`, `isRead`, `link` |
| `vendors` | Company/supplier record | `vendorName`, `companyName`, `email` (unique), `status`, `rating` |
| `vendor_notes` | Internal notes per vendor | `content`, `authorId` |
| `vendor_documents` | Uploaded vendor files | `fileUrl`, `fileType` |
| `quotation_requests` | An RFQ raised by an admin | `title`, `description`, `status`, `dueDate` |
| `quotation_request_vendors` | Join table: who was asked | unique on `(quotationRequestId, vendorId)` |
| `quotations` | A vendor's actual bid | `amount` (`Decimal(14,2)`), `currency`, `status`, `reviewedById` |
| `quotation_attachments` | Files attached to a bid | `fileUrl`, `fileType` |
| `email_templates` | Admin-editable broadcast templates | `key` (unique), `subject`, `htmlBody`, `variables` (JSON) |
| `email_logs` | Every email sent/queued/scheduled | `status`, `scheduledFor`, `sentAt` |

## Design Decisions

1. **`Vendor` vs `User` are separate models.** A vendor company can exist purely as a record an admin manages (no login yet), or be linked to one or more portal `User` accounts (`role = VENDOR`). This mirrors how procurement actually works — vendors get onboarded as records before anyone logs in on their behalf.

2. **`QuotationRequestVendor` is an explicit join table**, not just a many-to-many, because it carries its own state (`PENDING` / `SUBMITTED` / `DECLINED`) — i.e. *which* assigned vendors have actually responded.

3. **Quotations are scoped server-side, not just hidden in the UI.** A vendor's `GET /quotations/requests/:id` strips out every other vendor's bid before the response leaves the server — this can't be bypassed by inspecting network traffic.

4. **`Decimal(14,2)` for money**, never `Float`, to avoid floating-point rounding issues on financial amounts.

5. **Soft audit trail via `ActivityLog`**, separate from hard deletes — vendor/account deletion still leaves a permanent log entry (`entityId` may point to a now-deleted row, which is intentional).

## Migrations

```bash
cd backend
npx prisma migrate dev --name init   # first run: creates all tables
npx prisma studio                    # optional: visual DB browser
```
