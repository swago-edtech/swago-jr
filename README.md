# Swago Jr. - Monorepo

Welcome to the **Swago Jr.** official repository. This is a full-stack, high-performance e-commerce platform designed for children, featuring a unique Ambassador Program, Lottery mechanics, and a secure shopping experience.

---

## 🏗️ Architecture at a Glance
This project is architected as a **pnpm monorepo** using **Next.js 14+** and **TypeScript**. 

- **Frontend**: Next.js App Router, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Serverless API Routes.
- **Database**: MongoDB Atlas with Mongoose ORM.
- **Payments**: Razorpay Integration.
- **Communication**: MSG91 for Email & OTP.
- **Workspaces**:
  - `apps/web`: The main customer-facing store.
  - `apps/admin`: Corporate management dashboard.
  - `packages/database`: Shared data models and connection logic.

> 📖 **Deep Dive**: For a detailed technical breakdown, please refer to the [**ARCHITECTURE.md**](./ARCHITECTURE.md) file.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher
- **MongoDB**: Access to a MongoDB Atlas cluster

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd swago-jr

# Install all dependencies (Monorepo)
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the root and in the respective apps:
```bash
# Essential Variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_RAZORPAY_KEY=your_razorpay_key
MSG91_AUTH_KEY=your_msg91_key
```

### 4. Local Development
```bash
# Run everything (Web + Admin)
pnpm dev

# Run specific app
pnpm dev:web    # Runs web only (localhost:3000)
pnpm dev:admin  # Runs admin only (localhost:3001)
```

---

## 📁 Repository Structure
```text
swago-jr/
├── apps/
│   ├── web/           # E-commerce Shop
│   └── admin/         # Admin Dashboard
├── packages/
│   ├── database/      # Mongoose Models & Connection
│   └── types/         # Shared TypeScript Types
└── scripts/           # Automation and maintenance scripts
```

---

## 🚢 Deployment Context
The application is designed to be hosted on **Serverless** or **Containerized** environments.
- **Primary Hosting**: AWS Amplify (Recommended for Next.js Monorepos).
- **Secondary Hosting**: Vercel / AWS EC2.

---

## 🛠️ Key Modules
- **Ambassador Program**: Integrated reward system with "Swago Dollars" wallet.
- **Lottery Engine**: Automated raffle and winner selection system.
- **Payment Verification**: Robust webhook-based payment confirmation.
- **Kid Profiles**: Persona-based access for games and activities.

---

© 2025-2026 Swago Jr. All rights reserved...
