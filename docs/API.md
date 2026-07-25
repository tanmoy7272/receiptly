# Receiptly API Reference

**Base URL**: `/api/v1`  
**Authentication**: HTTP-Only Cookie (`receiptly_token` containing JWT).

---

## Health

### `GET /health`
Returns service status. Excluded from rate limits for monitoring.

- **Auth Required**: No
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-07-25T12:00:00.000Z"
}
```

---

## Auth Endpoints

### `POST /auth/register`
Registers a new user and sets an HTTP-only auth cookie.

- **Auth Required**: No
- **Body**: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123!" }`
- **Response `201 Created`**:
```json
{
  "message": "Registration successful.",
  "user": {
    "id": "usr_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-07-25T12:00:00.000Z"
  }
}
```

### `POST /auth/login`
Authenticates email & password, sets HTTP-only auth cookie.

- **Auth Required**: No
- **Body**: `{ "email": "jane@example.com", "password": "Password123!" }`
- **Response `200 OK`**:
```json
{
  "message": "Login successful.",
  "user": { "id": "usr_123", "name": "Jane Doe", "email": "jane@example.com" }
}
```

### `POST /auth/logout`
Clears auth cookie.

- **Auth Required**: Yes
- **Response `200 OK`**: `{ "message": "Logout successful." }`

### `GET /auth/me`
Fetches current logged-in user profile.

- **Auth Required**: Yes
- **Response `200 OK`**: `{ "user": { "id": "usr_123", "name": "Jane Doe", "email": "jane@example.com" } }`

---

## Receipt Endpoints

### `GET /receipts`
Get paginated receipts with optional filters.

- **Auth Required**: Yes
- **Query Params**:
  - `search`: Text query (matches title, merchant, notes, invoice number)
  - `category`: Category string (`Groceries`, `Food`, `Travel`, etc.)
  - `currency`: Currency code (`INR`)
  - `fromDate` / `toDate`: ISO date strings (`YYYY-MM-DD`)
  - `minAmount` / `maxAmount`: Numeric range bounds
  - `sortBy`: `newest`, `oldest`, `amount_desc`, `amount_asc`, `merchant_asc`, `merchant_desc`
  - `page`: Page number (default `1`)
  - `limit`: Items per page (default `10`)
- **Response `200 OK`**:
```json
{
  "message": "Receipts retrieved successfully.",
  "receipts": [ ... ],
  "pagination": {
    "totalItems": 12,
    "currentPage": 1,
    "totalPages": 2,
    "pageSize": 10
  }
}
```

### `POST /receipts`
Upload a new receipt document.

- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (binary), `title`, `merchant`, `amount`, `currency`, `purchaseDate`, `category`, `notes`, `invoiceNumber`, `hasWarranty`, `warrantyMonths`, `warrantyExpiryDate`.
- **Response `201 Created`**:
```json
{
  "message": "Receipt uploaded successfully.",
  "receipt": { "id": "rec_123", "title": "Headphones", "amount": 2499, ... }
}
```

### `GET /receipts/:id`
Fetch details for a single receipt.

- **Auth Required**: Yes
- **Response `200 OK`**:
```json
{
  "message": "Receipt retrieved successfully.",
  "receipt": { "id": "rec_123", ... }
}
```

### `PUT /receipts/:id`
Update an existing receipt or replace its file asset.

- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data` or `application/json`
- **Response `200 OK`**: `{ "message": "Receipt updated successfully.", "receipt": { ... } }`

### `DELETE /receipts/:id`
Delete receipt record and remove file asset from Cloudinary.

- **Auth Required**: Yes
- **Response `200 OK`**: `{ "message": "Receipt deleted successfully." }`

---

## AI Extraction Endpoints

### `POST /ai/extract-file`
Extracts receipt fields from an uploaded file buffer using Groq AI.

- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Response `200 OK`**:
```json
{
  "message": "File extracted with AI successfully.",
  "extraction": {
    "version": 1,
    "success": true,
    "data": {
      "title": { "value": "Wireless Earbuds", "confidence": 0.95 },
      "merchant": { "value": "Amazon India", "confidence": 0.98 },
      "amount": { "value": 1999, "confidence": 0.99 },
      "category": { "value": "Shopping", "confidence": 0.9 }
    }
  }
}
```

---

## Dashboard Endpoint

### `GET /dashboard`
Returns spend totals, rolling 6-month chart trends, category spend, and recent uploads.

- **Auth Required**: Yes
- **Response `200 OK`**:
```json
{
  "message": "Dashboard data retrieved successfully.",
  "generatedAt": "2026-07-25T12:00:00.000Z",
  "overview": {
    "totalReceipts": 8,
    "totalSpent": 14500,
    "averageSpend": 1812.5,
    "thisMonthSpent": 3200,
    "thisMonthReceipts": 2
  },
  "recentReceipts": [ ... ],
  "categoryBreakdown": [ ... ],
  "monthlySpending": [ ... ]
}
```
