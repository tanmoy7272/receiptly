# Receiptly

> **Store, extract, search, and track purchase receipts, invoices, and warranties forever.**

Receiptly is a full-stack, single-tenant SaaS application built with **React (Vite)**, **Node.js (Express)**, **Prisma ORM**, and **Neon PostgreSQL**. It uses AI document parsing to extract merchant details, total amounts, dates, and warranty terms automatically from images, PDFs, and Word documents.

---

## 🌐 Live Production Demo

- 🚀 **Live Web Application:** [https://receiptly-eta.vercel.app](https://receiptly-eta.vercel.app)
- ⚙️ **Production API Endpoint:** [https://receiptly-8amx.onrender.com/api/v1](https://receiptly-8amx.onrender.com/api/v1)

---

## ✨ Core Features

- **💬 Ask Receiptly Natural Language AI:** Ask natural financial questions about your receipts, spending totals, merchants, categories, price bounds (*"over 5000"*), and warranties (*"Do I have active warranty on my laptop?"*). Supports multi-merchant queries (*"Swiggy and Amazon"*), flexible date ranges (*"last 3 months"*, *"in 2026"*), zero hardcoded templates, and automated model failovers.
- **🔒 Secure Authentication & Recovery:** Cross-site HTTP-Only JWT cookies with configurable `SameSite` options, bcrypt password hashing, 6-digit email OTP verification via Brevo REST API, self-service password resets, and automatic 401 session expiry handling.
- **📄 Universal Document Support:** Upload images (JPEG, PNG, WebP), digital PDFs, scanned PDFs, or Word documents (`.docx`). Inline image previews & full asset deletion via Cloudinary.
- **🤖 AI-Assisted OCR Pipeline:** Groq SDK (`llama-3.3-70b-versatile`) + Tesseract.js WASM worker pool extracts title, vendor, amount, purchase date, invoice number, and category with lazy worker reuse for high performance.
- **🔍 Smart Search & Discovery:** Debounced text query search across title, merchant, notes, and invoice numbers with composite database indexes (`userId` + `purchaseDate`). Dynamic filtering by category, currency, date range, and amount bounds.
- **📊 Analytics Dashboard:** Overview spending statistic cards, AI spending summaries, category spend breakdown (with mobile-responsive cards), and rolling 6-month spending trend line charts via Chart.js.
- **🛡️ Warranty Lifecycle Tracking:** Data-driven warranty coverage tracking with remaining days calculation and static status badges (`Active`, `Expiring Soon`, `Expired`).
- **📱 Mobile Responsive & Accessible:** Scoped 44px tap targets, iOS Safari focus zoom prevention (`text-base sm:text-sm`), native OS file/camera pickers, and `safe-area-inset` support for iPhone notches.

---

## 🛠️ Production Tech Stack

| Layer | Technology | Infrastructure |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Chart.js | Vercel (Global CDN) |
| **Backend** | Node.js, Express.js, Multer, Helmet, Rate-Limit, Compression | Render Web Service |
| **Database** | PostgreSQL (Prisma ORM) | Neon PostgreSQL Cloud |
| **Storage & AI** | Cloudinary SDK (Media & PDFs), Groq SDK (Llama 3.3 70B & 3.1 8B) | Cloudinary & Groq Cloud |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom | Local & CI Pipeline |

---

## 📁 Repository Structure

```text
receiptly/
├── backend/
│   ├── prisma/          # Database schema & seed scripts
│   ├── src/
│   │   ├── ai/          # Ask Receiptly AI Query Engine, intent classification, handlers & prompts
│   │   ├── config/      # Env config & boot validation
│   │   ├── controllers/ # Express route controllers
│   │   ├── middlewares/ # Auth, rate limit, upload & error handlers
│   │   ├── routes/      # API routers
│   │   ├── services/    # Business logic, Prisma & AI pipelines
│   │   ├── utils/       # OCR & logger utilities
│   │   └── validators/  # Zod request validation schemas
│   └── tests/           # Vitest unit & route integration tests
├── frontend/
│   ├── src/
│   │   ├── components/  # Forms, cards, Ask Receiptly UI, layouts, UI primitives
│   │   ├── context/     # AuthContext & ToastContext providers
│   │   ├── hooks/       # Custom React hooks (useDebounce, useDocumentTitle)
│   │   ├── pages/       # Lazy-loaded route pages
│   │   └── services/    # apiClient & API wrappers
│   └── src/__tests__/   # Vitest & React Testing Library tests
└── docs/                # API, Architecture, Deployment & OCR guides
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js `v18+`
- PostgreSQL or SQLite

### 2. Environment Configuration
Copy environment templates:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push

# (Optional) Seed development demo data
npx prisma db seed

# Start backend dev server (Port 5000)
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Start frontend dev server (Port 5173)
npm run dev
```

---

## 🧪 Running Automated Test Suite

```bash
# Backend unit & route integration tests (118 tests passing across 24 test files)
cd backend && npm test

# Frontend component & interceptor tests (18 tests passing across 9 test files)
cd frontend && npm test
```

---

## 📖 Technical Documentation

- 🚀 [100% Free Production Deployment Guide](docs/FREE_DEPLOYMENT_GUIDE.md)
- 🗄️ [Database Schema & Production SQL Query Guide](docs/DATABASE_AND_SQL_GUIDE.md)
- 📑 [API Reference](docs/API.md)
- 🏗️ [System Architecture & Data Flow](docs/ARCHITECTURE.md)
- 🚀 [Production Deployment Guide](docs/DEPLOYMENT.md)
- 📄 [OCR & Document Text Extraction Guide](docs/OCR.md)
- 📜 [Changelog & Release History](CHANGELOG.md)

---

## 📜 License

Licensed under the [MIT License](LICENSE).
