# Deployment Guide

Instructions for deploying **Receiptly** to production infrastructure (e.g. Render / Railway for backend, Vercel / Netlify for frontend, Neon / Supabase for PostgreSQL).

---

## 1. Database Setup (Neon PostgreSQL)

1. Create a PostgreSQL database instance on [Neon](https://neon.tech) or Supabase.
2. Copy your connection URL (`postgresql://user:pass@ep-xyz.neon.tech/receiptly?sslmode=require`).
3. Set `DATABASE_URL` in your backend environment variables.
4. Run migrations on deploy:
   ```bash
   npx prisma migrate deploy
   ```

---

## 2. Backend Deployment (Render / Railway)

1. Deploy the `backend/` folder as a Node.js web service.
2. Set Environment Variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET=your_long_random_jwt_secret_key`
   - `CLIENT_URL=https://your-frontend-app.vercel.app`
   - `CLOUDINARY_CLOUD_NAME=your_cloudinary_name`
   - `CLOUDINARY_API_KEY=your_cloudinary_key`
   - `CLOUDINARY_API_SECRET=your_cloudinary_secret`
   - `GROQ_API_KEY=gsk_your_groq_key`
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `npm start`

---

## 3. Frontend Deployment (Vercel / Netlify)

1. Deploy the `frontend/` folder as a Vite static web app.
2. Build Settings:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Folder: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`
