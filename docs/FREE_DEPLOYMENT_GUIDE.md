# Receiptly 100% Free Production Deployment Guide

A step-by-step guide to deploy Receiptly for **100% FREE** using modern, production-grade cloud services (Neon, Render, Vercel, Cloudinary, and Groq).

---

## 🛠️ Free Tech Stack Overview

| Component | Service | Free Tier Limits |
| :--- | :--- | :--- |
| **Database** | [Neon PostgreSQL](https://neon.tech) | 0.5 GiB storage, 100% free forever |
| **Backend API** | [Render](https://render.com) | Free Web Service (Node.js 18+), HTTPS |
| **Frontend App** | [Vercel](https://vercel.com) | Unlimited deployments, fast global CDN |
| **Media Storage** | [Cloudinary](https://cloudinary.com) | 25 GB storage / transformations |
| **AI OCR Extraction** | [Groq Cloud](https://console.groq.com) | Free API key for Llama 3.3 70B |

---

## Step 1: Create Free PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and click **Sign Up** (Sign in with your GitHub account).
2. Click **Create Project**.
   - Project Name: `receiptly-db`
   - Database Name: `receiptly`
3. Copy your **Pooled Connection String** from the Neon dashboard. It looks like:
   ```text
   postgresql://alex_owner:abc123xyz@ep-example-12345.ap-southeast-1.aws.neon.tech/receiptly?sslmode=require
   ```
4. Save this URL for Step 3.

---

## Step 2: Get Free API Keys (Cloudinary & Groq)

### A. Cloudinary (File & PDF Storage)
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. On your Dashboard, copy these 3 credentials:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

### B. Groq AI (Receipt Parsing)
1. Sign up for a free account at [console.groq.com](https://console.groq.com).
2. Go to **API Keys** -> Click **Create API Key**.
3. Copy your key (`gsk_...`).

---

## Step 3: Deploy Backend API for Free (Render)

1. Sign up at [render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: **`tanmoy7272/receiptly`**.
4. Configure the Web Service:
   - **Name:** `receiptly-backend`
   - **Region:** Choose the region closest to you (e.g. Singapore / Frankfurt / Oregon)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

5. Scroll down to **Environment Variables** and click **Add Environment Variable** for each:

   | Key | Example / Recommended Value |
   | :--- | :--- |
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Your Neon PostgreSQL URL from Step 1)* |
   | `JWT_SECRET` | `super_secret_jwt_key_receiptly_2026_xyz999` |
   | `CLIENT_URL` | `https://receiptly-frontend.vercel.app` *(or `*`)* |
   | `CLOUDINARY_CLOUD_NAME` | *(Your Cloudinary Cloud Name)* |
   | `CLOUDINARY_API_KEY` | *(Your Cloudinary API Key)* |
   | `CLOUDINARY_API_SECRET` | *(Your Cloudinary API Secret)* |
   | `GROQ_API_KEY` | *(Your Groq API Key `gsk_...`)* |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for Render to build and start your server.
8. Copy your backend URL from Render top-left header. It looks like:
   ```text
   https://receiptly-backend-xyz.onrender.com
   ```

---

## Step 4: Deploy Frontend Web App for Free (Vercel)

1. Sign up at [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select **`tanmoy7272/receiptly`** and click **Import**.
4. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and set to `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Expand **Environment Variables** and add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://receiptly-backend-xyz.onrender.com/api/v1` |

   *(Replace `receiptly-backend-xyz.onrender.com` with your real Render backend domain from Step 3).*

6. Click **Deploy**.
7. In ~45 seconds, Vercel will give you a live production domain URL like:
   ```text
   https://receiptly-frontend.vercel.app
   ```

---

## Step 5: Final Check & Setup Update

1. Open your Render backend dashboard -> Environment Variables.
2. Ensure `CLIENT_URL` is updated to your exact Vercel frontend domain:
   ```text
   CLIENT_URL=https://receiptly-frontend.vercel.app
   ```
3. Save changes in Render (Render will automatically restart the service).
4. Open your live app URL `https://receiptly-frontend.vercel.app`:
   - Register a new user account.
   - Upload a test receipt (PNG, JPG, or PDF).
   - Verify AI extraction and dashboard chart rendering!

---

## 🎉 Success!

Your Receiptly app is now 100% deployed and live in production for **$0 / month**!
