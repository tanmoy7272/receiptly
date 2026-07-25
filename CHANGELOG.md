# Changelog

All notable changes to Receiptly will be documented here.

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
