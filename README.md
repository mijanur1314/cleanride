# 🚗 CleanRide — Premium Full-Stack Vehicle Washing Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

**A production-grade vehicle washing platform built with Next.js 15 App Router, Express, Prisma ORM, and a complete multi-role dashboard for Customers, Partners, and Admins.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference)

</div>

---

## 📌 Project Overview

CleanRide is a **full-stack, premium vehicle washing and detailing platform** that allows customers to effortlessly book car and bike wash services. The platform supports both doorstep services (where washing partners visit customer locations) and offline store appointments. It is built for scalability and elegance, utilizing a modern decoupled architecture with a highly responsive frontend and a robust Node.js backend.

The platform serves **three distinct user roles**:
- 👤 **Users** — book wash services, track status, and leave reviews
- 🧽 **Partners (Washers)** — view assigned bookings, update status, and upload before/after service proof images
- 🛡️ **Admins** — oversee the platform, assign bookings to partners, and monitor operations

---

## ✨ Features

### 👤 Users
| Feature | Description |
|---|---|
| 📅 **Dynamic Multi-Step Booking** | Seamless 4-step flow: Select Service → Vehicle Details → Schedule → Confirmation |
| 📸 **Service Verification** | View before and after images uploaded by the assigned washing partner |
| ⭐ **Review System** | Leave 5-star ratings and written reviews for completed washes |
| 📊 **User Dashboard** | Manage profile, view active subscriptions, and track booking history |

### 🧽 Washing Partners
| Feature | Description |
|---|---|
| 📋 **Assignment Dashboard** | View a dedicated feed of all bookings assigned by the Admin |
| 🔄 **Status Updates** | Update live booking statuses (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`) |
| 📷 **Visual Proof Uploads** | Input image URLs for "Before" and "After" the wash to verify completion |
| 📍 **Customer Logistics** | Instantly access the customer's vehicle type, number, and exact address |

### 🛡️ Admins
| Feature | Description |
|---|---|
| 👥 **Manual Dispatching** | Assign unassigned bookings to specific available washing partners |
| 📈 **Platform Analytics** | High-level dashboard showing total bookings, users, and partners |
| 🚘 **Global Management** | Full overview of every customer, partner, and service happening on the platform |

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router) |
| **Backend Framework** | Node.js + Express.js |
| **Language** | TypeScript (Strict) |
| **Styling** | Tailwind CSS v4 + ShadCN UI |
| **Animations** | Framer Motion 12 |
| **State Management** | Zustand (Persistent Storage) |
| **Database** | PostgreSQL (Supabase / Neon) |
| **ORM** | Prisma |
| **Authentication** | Custom JWT + bcryptjs |
| **Form Validation** | React Hook Form + Zod |
| **HTTP Client** | Axios |

---

## 🏗 Architecture

CleanRide uses a **decoupled monorepo** approach — separating the Next.js client application and the Express.js API server to allow independent development and execution.

```mermaid
graph TD
    UserClient[👤 User / Partner / Admin\nNext.js Client]

    subgraph "Frontend (Next.js 15)"
    NextJS[App Router]
    Zod[Zod Validation]
    Zustand[Zustand Stores]
    end

    subgraph "Backend API (Express.js)"
    Controllers[Route Controllers]
    Middlewares[Auth & Error Handlers]
    PrismaORM[Prisma Client]
    end

    subgraph "Core Data"
    PostgreSQL[(PostgreSQL DB)]
    end

    UserClient <-->|HTTPS / REST| NextJS
    NextJS <-->|Axios API Calls| Controllers

    NextJS --> Zod
    NextJS --> Zustand

    Controllers --> Middlewares
    Middlewares --> PrismaORM
    PrismaORM <--> PostgreSQL
```

### Design Principles
- **Separation of Concerns** — Backend logic is strictly handled by Express controllers; Frontend focuses solely on UI/UX and State.
- **Schema-First Database** — Prisma acts as the single source of truth for the PostgreSQL database schema and TypeScript types.
- **Robust Error Handling** — Custom `AppError` class and global error middleware catch unhandled exceptions gracefully.
- **JWT Middleware Guards** — `protect` and `restrictTo` middlewares enforce Role-Based Access Control (RBAC) at the server level.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18 · npm ≥ 9
- PostgreSQL Database (Supabase, Neon, or Local)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/mijanur1314/cleanride.git
cd cleanride
```

---

### Step 2 — Set up the Backend (Server)

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

# Database URLs (e.g. from Supabase)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"
```

Sync your database and start the server:
```bash
npx prisma db push
npx prisma generate
npm run dev     # → http://localhost:5000
```

---

### Step 3 — Set up the Frontend (Client)

Open a new terminal window:
```bash
cd client
npm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

Start the frontend:
```bash
npm run dev     # → http://localhost:3000
```

---

## 📡 API Reference

### Authentication
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user (User/Partner) |
| `POST` | `/api/v1/auth/login` | Login and receive JWT token |
| `GET` | `/api/v1/auth/me` | Get current authenticated user profile |

### Bookings
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/bookings` | Create a new wash booking |
| `GET` | `/api/v1/bookings` | (Admin) Get all platform bookings |
| `GET` | `/api/v1/bookings/my-bookings` | (User) Get personal booking history |
| `GET` | `/api/v1/bookings/partner-bookings` | (Partner) Get assigned bookings |
| `PATCH` | `/api/v1/bookings/:id/status` | (Partner) Update booking status |
| `PATCH` | `/api/v1/bookings/:id/assign` | (Admin) Assign booking to partner |
| `PATCH` | `/api/v1/bookings/:id/images` | (Partner) Upload before/after images |

### Services & Reviews
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/services` | List all available wash services |
| `POST` | `/api/v1/reviews` | (User) Leave a review for a booking |

---

## 🔐 Security

- **Role-Based Access Control (RBAC)** — API routes are strictly guarded by middleware ensuring only Partners can update statuses and only Admins can assign bookings.
- **Password Security** — All passwords are cryptographically hashed using `bcryptjs` with 12 salt rounds before hitting the database.
- **JWT Sessions** — Stateless authentication using HTTP-only standard JSON Web Tokens.

---

## 👨‍💻 Author

**Sk Mijanur Rahaman**
- Email: skmijanurrahaman1314@gmail.com
- GitHub: [mijanur1314](https://github.com/mijanur1314)

---

<div align="center">

**Built with Next.js 15 · TypeScript · PostgreSQL · Prisma · Express**

⭐ Star this repository if you found it useful!

</div>
