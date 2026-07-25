# Receiptly

Store all your receipts, bills, and invoices in one searchable place. Never lose a warranty proof or tax receipt again.

---

## What is Receiptly?

Receiptly is a web app for organizing purchase receipts, utility bills, travel invoices, and fee receipts. It uses AI to automatically scan and extract key details like merchant name, date, total amount, category, and warranty details so you don't have to type them manually.

---

## Core Features

- **Secure Authentication:** Cookie-based JWT auth with HTTP-Only flags, password hashing with `bcryptjs`, and session expiry handling.
- **Receipt Management:** Upload receipts as images (JPEG, PNG, WebP), PDFs, or Word docs (`.docx`). Edit, view, and delete anytime.
- **AI Extraction Pipeline:** Uses Groq (`llama-3.3-70b-versatile`) to extract receipt title, vendor, amount, purchase date, invoice number, and category.
- **Smart Filtering & Search:** Search by merchant, item title, or notes. Filter by category, currency, date range, or amount.
- **Spending Dashboard:** Visual breakdown of monthly spending trends (Chart.js) and top expense categories.
- **Warranty Tracking:** Tracks remaining warranty days and highlights expiring warranties with clear status badges.

---

## Tech Stack

| Layer | Tech |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Chart.js, Lucide Icons |
| **Backend** | Node.js, Express.js, Multer, Helmet, Express-Rate-Limit, Compression |
| **Database** | PostgreSQL / SQLite (via Prisma ORM) |
| **Storage & AI** | Cloudinary (Files/PDFs), Groq SDK (Llama 70B Vision/Text) |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |

---

## Project Structure

```text
rec/
├── backend/
│   ├── prisma/          # Prisma schema & seed script
│   ├── src/
│   │   ├── config/      # Env & security setup
│   │   ├── controllers/ # HTTP route handlers
│   │   ├── middlewares/ # Auth, rate limit, upload, error handling
│   │   ├── routes/      # Express API routers
│   │   ├── services/    # Business logic & DB access
│   │   ├── utils/       # OCR & logger utilities
│   │   └── validators/  # Zod request validation
│   └── tests/           # Vitest unit & integration tests
├── frontend/
│   ├── src/
│   │   ├── components/  # Forms, cards, UI elements
│   │   ├── context/     # Auth & Toast context providers
│   │   ├── hooks/       # Custom React hooks (debounce, title)
│   │   ├── pages/       # Lazy-loaded route pages
│   │   └── services/    # apiClient & API wrappers
│   └── src/__tests__/   # Vitest frontend tests
└── docs/                # Architecture, API & deployment docs
```

---

## Local Setup

### 1. Prerequisites
- Node.js `v18` or higher
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
npx prisma migrate dev --name init

# (Optional) Seed demo user data
npx prisma db seed

# Run backend dev server (Port 5000)
npm run dev
```

> **Demo Login:**  
> Email: `demo@receiptly.app`  
> Password: `Password123!`

### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Run frontend dev server (Port 5173)
npm run dev
```

---

## Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Documentation

For technical details and deployment guides, see:
- [🚀 100% Free Deployment Guide](docs/FREE_DEPLOYMENT_GUIDE.md)
- [API Reference](docs/API.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [OCR & Text Extraction Guide](docs/OCR.md)
- [Changelog](CHANGELOG.md)

---

## License

[MIT](LICENSE)
