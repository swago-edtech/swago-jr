# Swago Jr. - Technical Architecture Documentation

This document provides a comprehensive overview of the Swago Jr. e-commerce platform's architecture, technology stack, and service integration.

---

## 🏗️ System Overview
Swago Jr. is built as a **TypeScript Monorepo**, ensuring code reusability and type safety across the entire platform. It consists of a customer-facing portal and a dedicated administration dashboard.

### Core Architecture Patterns
- **Monorepo Management**: Powered by `pnpm` workspaces.
- **Full-Stack Framework**: Next.js (App Router) for both Web and Admin apps.
- **Shared Data Layer**: A central package handles all database interactions and business logic models.
- **Serverless Backend**: API logic is implemented via Next.js API Routes (Edge/Node.js runtime).

---

## 🛠️ Technology Stack

### Frontend & Backend
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router Architecture)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API (`SharedContext`) for cross-application state.

### Infrastructure & Database
- **Primary Database**: [MongoDB](https://www.mongodb.com/) (NoSQL)
- **ORM**: [Mongoose](https://mongoosejs.com/)
- **Database Hosting**: MongoDB Atlas (Shared Cluster)
- **Current Hosting**: Vercel (Serverless)
- **Planned Hosting**: AWS Amplify / AWS EC2

### Authentication & Security
- **Authentication**: Custom Session-based Auth using [Jose (JWT)](https://github.com/panva/jose) and HttpOnly Cookies.
- **Security**: Server-side validation (Zod/Mongoose), Password hashing, and restricted API routes.

---

## 📂 Monorepo Structure

```text
swago-jr/
├── apps/
│   ├── web/           # Customer Portal (Next.js)
│   │   ├── src/app/   # Main pages and API Routes
│   │   └── src/lib/   # Third-party integrations (Razorpay, MSG91)
│   └── admin/         # Admin Dashboard (Next.js)
│       ├── app/       # Management UI for Products, Orders, Banners
│       └── components/# Admin-specific layouts
├── packages/
│   ├── database/      # Shared Mongoose models (User, Product, Order, Lottery)
│   └── types/         # Shared TypeScript interfaces
├── package.json       # Workspace root (pnpm)
└── pnpm-workspace.yaml# Workspace configuration
```

---

## 🔌 API & Third-Party Services

### 1. REST APIs (Next.js Routes)
All APIs are RESTful and return JSON responses. Key modules:
- `/api/auth`: Custom OTP-based login and session management.
- `/api/products`: Catalog management and search.
- `/api/orders`: Order creation, tracking, and management.
- `/api/ambassador`: Ambassador program mechanics (Reels, Rewards, Swago Dollars).
- `/api/lottery`: Lottery code generation and winners selection.

### 2. Payment Gateway (Razorpay)
- **Integration**: [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/) + Webhooks.
- **Flow**: Order created on server → Client receives `order_id` → Razorpay UI opens → Webhook verifies payment and updates DB.

### 3. Communication (MSG91)
- **OTP Verification**: Email-based OTP for secure login.
- **Email Service**: Transactional emails for order confirmation.

---

## 🎒 Key Feature Architectures

### Swago Wallet (Ambassador Program)
A unique reward system where kids can earn "Swago Dollars" (SD).
- **Earning**: Triggered by Reel approval, Brain Gym completion, and Lottery codes.
- **Redemption**: Applied as a discount during the checkout process based on predefined price slabs.
- **Logic**: Managed via the `KidProfile` model in the `@swago/database` package.

### Lottery System
- **Phases**: Selection Phase → Validation Phase → Result/Claim Phase.
- **Architecture**: Cron jobs (via `/api/cron`) handle automatic transitions between lottery states and winner selection.

---

## 🚀 Deployment Strategy

| Component | Service |
| :--- | :--- |
| **Frontend/API** | AWS Amplify (Planned) |
| **Database** | MongoDB Atlas (Cloud) |
| **Media Storage** | Amazon S3 (Planned) |
| **DNS/SSL** | AWS Route 53 |

---

## 🛡️ Best Practices Implemented
- **Type Safety**: End-to-end typing from DB models to Frontend props.
- **Reusable Components**: Modular UI components consistent across Admin and Web.
- **Error Handling**: Standardized API response format `{ success, message, error }`.
- **Performance**: Edge-first API routes where possible and optimized images.
