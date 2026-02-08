# 📘 SwagoJR – Developer Setup Guide

This repository is a **pnpm monorepo** containing multiple applications and shared packages for the SwagoJR platform.

---

## 📁 Project Structure

swago-jr/
├── apps/
│ ├── web → Main user-facing Next.js application
│ └── admin → Admin dashboard
├── packages/
│ └── database → Shared MongoDB connection and models
├── pnpm-workspace.yaml
├── package.json
└── .env.local → Global environment variables

---

## ✅ Prerequisites

Make sure the following are installed on your system:

- **Node.js 20 LTS**
- **pnpm 8+**
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd swago-jr
```

### 2. Install Dependencies
From the project root, run:
```bash
pnpm install
```

This installs dependencies for all apps and shared packages using pnpm workspaces.

### 3 Environment Variables Setup
This project supports environment variables at two levels.
#### 1. Root-Level Environment (Shared)
Create a file in the project root:
```c
.env.local
```
Add shared variables such as:
```plaintext
MONGODB_URI=...
JWT_SECRET=...
```
defaults to shared packages like `packages/database`.
#### 2. App-Level Environment Each app can have its own environment file.
Web App Create the file:
```bash
apps/web/.env.local Example:
razorpay_key_id=... 
rp_secret=... 
sendgrid_api_key=...
```
Admin App Create the file:
```bash
apps/admin/.env.local
```
 Add any admin-specific configuration as required.
 
### ▶ Running the Applications Start Web App 
```bash
pnpm --filter web dev
```
Open in browser:
```bash

http://localhost:3000
```
Start Admin App 
```bash

pnpm --filter admin dev
``` 
