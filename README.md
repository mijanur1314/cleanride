# 🚗 CleanRide — Premium Full-Stack Vehicle Washing Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=white)

**An enterprise-grade, PWA-enabled vehicle washing platform built with Next.js 15 App Router, Express, Prisma ORM, Redis, WebSockets, and a complete multi-role dashboard for Customers, Partners, and Admins.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference)

</div>

---

## 📌 Project Overview

CleanRide is a **full-stack, premium vehicle washing and detailing platform** that allows customers to effortlessly book car and bike wash services. The platform supports both doorstep services and offline store appointments. It is built for massive scalability, utilizing a modern decoupled architecture featuring sub-10ms Redis caching, real-time WebSocket notifications, cloud object storage, and a Progressive Web App (PWA) client.

The platform serves **three distinct user roles**:
- 👤 **Users** — book wash services, subscribe to premium memberships, track real-time status, and leave reviews
- 🧽 **Partners (Washers)** — view assigned bookings, update status, and upload before/after service proof images
- 🛡️ **Admins** — oversee the platform, assign bookings to partners, and monitor revenue analytics

---

## ✨ Features

### 🚀 Advanced Tech Capabilities
| Feature | Description |
|---|---|
| 📡 **Real-Time WebSockets** | Powered by `Socket.io`, users receive instant UI updates when a partner is assigned without refreshing the page. |
| ⚡ **Redis Caching** | High-traffic endpoints like services and subscription plans are cached via `ioredis` for lightning-fast sub-10ms responses. |
| 📱 **PWA (Progressive Web App)** | Installable directly to mobile home screens for a native app feel on iOS and Android. |
| 💳 **Razorpay Integration** | Secure payment gateways for standard bookings and tiered Premium Memberships. |
| 📧 **Automated Emails** | `Nodemailer` integration instantly emails customers and partners upon booking confirmations and assignments. |
| ☁️ **Cloud Storage** | `Supabase Storage` and `Multer` securely handle multipart/form-data for image uploads (no local disk bloat). |
| 🐳 **Dockerized CI/CD** | Fully containerized with `docker-compose` and automated GitHub Actions deployment pipelines. |

### 👤 Users
| Feature | Description |
|---|---|
| 📅 **Dynamic Multi-Step Booking** | Seamless flow: Select Service → Vehicle Details → Schedule → Secure Checkout |
| 💎 **Premium Subscriptions** | Purchase multi-tier membership plans via Razorpay for exclusive discounts. |
| 📸 **Service Verification** | View before and after images uploaded by the assigned washing partner |
| ⭐ **Review System** | Leave 5-star ratings and written reviews for completed washes |

### 🧽 Washing Partners
| Feature | Description |
|---|---|
| 📋 **Assignment Dashboard** | View a dedicated feed of all bookings assigned by the Admin |
| 🔄 **Status Updates** | Update live booking statuses (`CONFIRMED`, `EN_ROUTE`, `WASH_IN_PROGRESS`, `COMPLETED`) |
| 🗺️ **Google Maps Integration** | "Accept & Navigate" button instantly opens turn-by-turn driving directions to the customer's vehicle |
| 📷 **Visual Proof Uploads** | Directly upload images to verify wash completion |

### 🛡️ Admins
| Feature | Description |
|---|---|
| 👥 **Manual Dispatching** | Assign unassigned bookings to specific available washing partners |
| 📋 **Service Management** | Beautiful grid-based interface to manage premium wash packages and pricing (₹) |
| 📈 **Platform Analytics** | High-level dashboard showing total revenue, active users, and booking volume |
| 🚘 **Global Management** | Full overview of every customer, partner, and service happening on the platform |

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router) + PWA |
| **Backend Framework** | Node.js + Express.js |
| **Language** | TypeScript (Strict) |
| **Styling** | Tailwind CSS v4 + ShadCN UI + Framer Motion |
| **State Management** | Zustand (Persistent Storage) |
| **Database** | PostgreSQL (Supabase / Neon) |
| **Cache & Real-Time** | Redis + Socket.io |
| **ORM** | Prisma |
| **Payments** | Razorpay SDK |
| **Authentication** | Custom JWT + bcryptjs |
| **DevOps** | Docker + GitHub Actions |

---

## 🏗 Architecture

CleanRide uses a **decoupled monorepo** approach.

```mermaid
graph TD
    UserClient[👤 User / Partner / Admin\nNext.js PWA Client]

    subgraph "Frontend (Next.js 15)"
    NextJS[App Router]
    SocketClient[Socket.io Client]
    end

    subgraph "Backend API (Express.js)"
    Controllers[Route Controllers]
    SocketServer[Socket.io Server]
    RedisCache[Redis Middleware]
    end

    subgraph "Infrastructure"
    PostgreSQL[(PostgreSQL DB)]
    Redis[(Redis Cluster)]
    SupabaseStorage[Cloud Object Storage]
    end

    UserClient <-->|REST API| NextJS
    NextJS <-->|Axios| Controllers
    NextJS <-->|WebSockets| SocketServer
    
    Controllers <--> RedisCache
    RedisCache <--> Redis
    Controllers <--> PostgreSQL
    Controllers --> SupabaseStorage
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Docker Desktop (optional but recommended)
- PostgreSQL Database URL
- Redis URL
- Razorpay API Keys

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/mijanur1314/cleanride.git
cd cleanride
```

---

### Step 2 — Run with Docker (Easiest)

CleanRide is fully dockerized. To spin up the Server, Client, and a local Redis instance simultaneously:
```bash
docker-compose up --build
```
*Frontend will be on `http://localhost:3000` and Backend on `http://localhost:5000`.*

---

### Step 3 — Manual Setup (Alternative)

**Backend Setup:**
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://user:pass@host:6543/postgres"
JWT_SECRET="your_secret_key"
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="xxx"
SMTP_HOST="smtp.ethereal.email"
REDIS_URL="redis://localhost:6379"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="xxx"
```

Start the backend:
```bash
npx prisma db push
npx prisma generate
npm run dev
```

**Frontend Setup:**
```bash
cd ../client
npm install
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx"
```

Start the frontend:
```bash
npm run dev
```

---

## 👨‍💻 Author

**Sk Mijanur Rahaman**
- Email: skmijanurrahaman1314@gmail.com

---

<div align="center">

**Built with Next.js 15 · TypeScript · PostgreSQL · Redis · Socket.io · Docker**

⭐ Star this repository if you found it useful!

</div>
