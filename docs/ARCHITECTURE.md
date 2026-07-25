# System Architecture

Receiptly is designed as a single-tenant, full-stack application built to store and search purchase receipts, utility bills, and warranty proofs.

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React (Vite) Frontend                    │
│  - Tailwind CSS                                             │
│  - React Router v6 (Lazy Route Loading)                     │
│  - AuthContext & ToastContext Providers                     │
│  - apiClient Fetch Wrapper (Auto 401 Session Expiry)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP-Only JWT Cookie
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Express Backend                  │
│  - Helmet Security Headers & CORS Whitelist                 │
│  - Express Rate Limiters (Auth, AI, General API)            │
│  - Request Logger (req.id correlation)                      │
│  - Route -> Controller -> Service Architecture              │
└───────────────┬──────────────┬───────────────┬──────────────┘
                │              │               │
                ▼              ▼               ▼
         PostgreSQL / SQLite  Cloudinary    Groq AI SDK
           (Prisma ORM)     (File Assets)  (Llama 70B Vision/Text)
```

---

## Architectural Principles

1. **User Isolation:** All DB queries strictly filter by `where: { userId }` to ensure zero cross-tenant data leaks.
2. **Database-Level Aggregation:** Dashboard totals, monthly trends, and pagination queries execute inside the database via Prisma `aggregate`, `groupBy`, and indexed queries.
3. **Non-Blocking AI Pipeline:** AI extractions are an optional assistant. If Groq API is slow or offline, a 10-second timeout promise race cancels the AI call and allows manual entry.
4. **Transient AI Suggestions:** AI extractions populate form fields in the browser state; data is persisted to the database only when the user clicks Save.
5. **Data Provenance:** Receipt fields track origin (`MANUAL`, `AI`, `AI_EDITED`) to record how data was entered.
6. **Data-Driven Warranty UI:** Warranty status widgets and badges display whenever warranty data exists (`hasWarranty = true`), regardless of receipt category.

---

## Database Models (Prisma ORM)

- **`User`**: `id`, `name`, `email` (unique), `password` (bcrypt hash), timestamps.
- **`Receipt`**: `id`, `title`, `merchant`, `merchantNormalized`, `amount`, `currency`, `purchaseDate`, `category`, `notes`, `fileUrl`, `filePublicId`, `fileType`, `invoiceNumber`, `hasWarranty`, `warrantyExpiryDate`, `warrantyMonths`, `warrantySource`, `userId`, timestamps.
  - **Indexes**: `userId`, `merchantNormalized`, `category`, `purchaseDate`, `createdAt`, `invoiceNumber`, `warrantyExpiryDate`.

---

## Warranty Status Calculation

Remaining warranty coverage days are calculated dynamically in `ReceiptCard.jsx`:

- **Expired:** Coverage date is in the past (`diffDays < 0`) → Muted grey badge.
- **Expiring Soon:** Coverage expires within 30 days (`0 <= diffDays <= 30`) → Static amber warning badge with remaining days count.
- **Active:** Coverage extends beyond 30 days (`diffDays > 30`) → Green badge with remaining coverage days.
