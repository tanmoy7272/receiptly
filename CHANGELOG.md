# Changelog

All notable changes to Receiptly will be documented here.

---

## [1.1.0] - 2026-07-27

### Ask Receiptly AI Assistant
- **Modular Intent Query Engine:** Built a 3-tier Ask Receiptly AI pipeline (`classifyIntent` -> `executeIntent` -> `generateNaturalAnswer`).
- **Multi-Merchant & Category Filtering:** Engineered dynamic PostgreSQL `OR` condition builders supporting queries like *"Swiggy and Amazon"* or *"Food and Electronics"*.
- **Flexible Amount & Period Bounds:** Added regex extraction and Zod validation for price bounds (`minAmount`/`maxAmount`), specific 4-digit years (`2026`, `2025`), month names (`January`), and relative days (`LAST_30_DAYS`).
- **Full Database Field Exposure:** Exposed all receipt schema properties (`title`, `merchant`, `merchantNormalized`, `amount`, `currency`, `category`, `purchaseDate`, `invoiceNumber`, `notes`, `tags`, `hasWarranty`, `warrantyExpiryDate`, `warrantyMonths`, `warrantyStatus`).
- **Universal Answering & Zero Hardcoded Mentions:** Configured system prompts and fallbacks to answer strictly what was asked, removing any unasked mentions of missing warranties or vault terms.

### UI & Quality Engineering
- **Redesigned Light Glassmorphic UI:** Refactored Ask Receiptly component to a sleek light card (`from-indigo-50/70 via-white to-purple-50/40`) matching the dashboard aesthetic.
- **Inline Markdown Bold Renderer:** Added custom React bold parser (`<strong className="font-semibold">`) to render AI highlights without displaying raw `**` asterisks.
- **Expanded Test Coverage:** Expanded backend test suite to **118 unit & route tests across 24 files** and frontend test suite to **18 unit tests across 9 files**.
- **100-Question Live Stress Test:** Validated 100 random real-world questions against local PostgreSQL database with a 100% pass rate.

---

## [1.0.0] - 2026-07-25

### Core Features
- **User Auth:** Secure cookie-based JWT authentication with bcrypt password hashing and session expiry handling.
- **Receipt Management:** Full CRUD operations supporting images, PDFs, and Word documents (`.docx`). Integrates Cloudinary for media uploads.
- **AI Extractions:** Automated document parsing using Groq SDK (`llama-3.3-70b-versatile`) with user review & edit flow before saving.
- **Search & Filters:** Search by merchant, title, or notes. Filter by category, currency, date range, and amount.
- **Dashboard Analytics:** Monthly spending trend line charts (Chart.js) and category expense breakdown.
- **Warranty Tracking:** Data-driven warranty fields, tracking remaining coverage days with visual status badges.

### Quality & Engineering
- Helmet security header configuration and rate limiting on auth, AI, and API routes.
- React lazy loading for route chunks and debounced search inputs.
- Comprehensive Vitest unit and route integration test coverage.
