# Swago Jr. Deployment Guide (Vercel)

This project is a monorepo containing two Next.js applications: **Web** (Frontend) and **Admin** (Dashboard).

## 1. Prerequisites
- Vercel Account
- Access to the GitHub repository: `swago-edtech/swago-jr`
- MongoDB Atlas connection string
- Razorpay API Keys (ID & Secret)
- MSG91 Auth Key
- Firebase Configuration

## 2. Vercel Project Setup (Web App)
1. **New Project**: Go to Vercel and import the `swago-jr` repository.
2. **Framework Preset**: Select **Next.js**.
3. **Root Directory**: Select `apps/web`.
4. **Environment Variables**: Add all variables from `.env.production` or matching the list below.
5. **Build Command**: Vercel will auto-detect, but ensure it is `next build`.
6. **Install Command**: `pnpm install`.

## 3. Vercel Project Setup (Admin App)
1. **New Project**: Import the same repository again for a second project.
2. **Project Name**: `swago-jr-admin`.
3. **Root Directory**: Select `apps/admin`.
4. **Environment Variables**: Add mandatory admin variables.
5. **Install Command**: `pnpm install`.

## 4. Required Environment Variables

### Core (Both Apps)
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `NEXTAUTH_SECRET`: A random long string for authentication.

### Web App Specifics
- `RAZORPAY_KEY_ID`: Razorpay public key.
- `RAZORPAY_KEY_SECRET`: Razorpay secret key.
- `RAZORPAY_WEBHOOK_SECRET`: Secret for validating Razorpay webhooks.
- `MSG91_AUTH_KEY`: Auth key for sending emails/OTPs.
- `NEXT_PUBLIC_BASE_URL`: The production URL of your web app (e.g., `https://swago.co`).

### Firebase (For Image Uploads/Reels)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

## 5. Build Optimization
The project is optimized for **Next.js Turbopack** and **pnpm**.
- The `packages/database`, `packages/types`, and `packages/utils` are shared workspaces and will be bundled automatically by Vercel.
- Image optimization is handled by `next/image`.

## 6. Post-Deployment
1. **Razorpay Webhook**: Go to Razorpay Dashboard and add the webhook URL: `https://your-domain.com/api/razorpay/webhook`.
2. **Domain Mapping**: Add your custom domains (`swago.co` and `admin.swago.co`) in Vercel settings.
