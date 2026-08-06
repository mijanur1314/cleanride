# 🚗 CleanRide — Premium AI-Powered Full-Stack Vehicle Washing Platform

<div align="center">

<h3>🌍 <a href="https://cleanride.vercel.app/">Live Demo: cleanride.vercel.app</a></h3>

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

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started)

</div>

---

## 📌 Project Overview

CleanRide is a **full-stack, premium AI-powered vehicle washing and detailing platform** that allows customers to effortlessly book car and bike wash services. The platform supports both doorstep services and offline physical store appointments across multiple branch locations. 

It is built for massive scalability, utilizing a modern decoupled architecture featuring sub-10ms Redis caching, real-time WebSocket notifications, server-to-server Razorpay webhooks, and a Progressive Web App (PWA) client with native Web Push Notifications. Additionally, a built-in **Generative AI Assistant** (powered by Google Gemini) provides users with instant, context-aware customer support.

The platform serves **three distinct user roles**:
- 👤 **Users** — book wash services, purchase premium subscriptions, redeem loyalty points, apply coupons, track real-time status, and leave reviews.
- 🧽 **Partners (Washers)** — view assigned bookings, update status, and upload before/after service visual proof.
- 🛡️ **Admins** — oversee the platform, assign bookings, manage subscriptions, create add-ons, distribute coupons, and monitor revenue analytics.

---

## ✨ Features

### 🚀 Advanced Tech Capabilities
| Feature | Description |
|---|---|
| 📡 **Real-Time WebSockets** | Powered by `Socket.io`, users receive instant UI updates when a partner is assigned or a booking status changes. |
| 🤖 **Autonomous AI Agents** | Integrated Google Gemini Generative AI provides intelligent, context-aware 24/7 customer support via streaming chat and can autonomously issue wallet refunds. |
| 👁️ **AI Vision Quality Control** | Uses Gemini Vision to automatically inspect Partner's after-wash photos, preventing job completion if the vehicle is still dirty. |
| ⚡ **Redis Caching** | High-traffic endpoints like services, subscription plans, and stores are cached via `ioredis` for lightning-fast sub-10ms responses. |
| 📱 **Offline-First PWA** | Installable directly to mobile home screens with native Web Push Notifications and robust IndexedDB offline syncing for underground operations. |
| 🛡️ **Secure Webhooks** | Automated server-to-server Razorpay webhooks guarantee payments are captured and subscriptions renewed securely in the background. |
| 🔄 **BullMQ Background Jobs** | Robust Redis-backed message queues process asynchronous tasks like smart auto-dispatching, automated daily partner payouts, and email notifications without blocking the main event loop. |
| 📧 **Asynchronous Emails** | Non-blocking `Nodemailer` integration instantly emails customers and partners. |
| ☁️ **Cloud Storage** | Securely handle multipart/form-data for image uploads without local disk bloat. |
| 📍 **Smart Geolocation** | One-click GPS coordinate extraction and reverse geocoding via OpenStreetMap Nominatim API for automatic address resolution. |
| ⛈️ **Weather-Aware Scheduling** | Automatically checks real-time weather forecasts (Open-Meteo) during booking, warning users about severe rain or storms. |
| 🐳 **Dockerized CI/CD** | Fully containerized with `docker-compose` and automated deployment pipelines. |

### 👤 Users
| Feature | Description |
|---|---|
| 📅 **Dynamic Checkout Flow** | Seamless booking flow: Select Service → Choose Location/Doorstep → Apply Add-ons → Secure Checkout. |
| 💎 **Premium Subscriptions** | Purchase multi-tier membership plans (Weekly, Monthly, Yearly) via Razorpay for exclusive discounts. |
| 🪙 **CleanCoins (Loyalty System)** | Automatically earn loyalty points for every completed booking and redeem them for discounts at checkout. |
| 🎟️ **Promotional Coupons** | Apply percentage or flat-rate discount codes directly at checkout. |
| ➕ **Service Add-ons** | Dynamically attach optional extras (e.g., "Engine Bay Cleaning", "Odor Removal") to a primary booking. |
| 💬 **Autonomous AI Support** | Chat with a smart AI assistant or submit support tickets. The AI agent can autonomously resolve disputes and instantly issue refunds to the user's wallet. |
| 🏢 **B2B Fleet Dashboard** | A dedicated workspace for corporate users to manage a roster of multiple fleet vehicles in one place. |

### 🧽 Washing Partners
| Feature | Description |
|---|---|
| 📋 **Assignment Dashboard** | View a dedicated feed of all bookings assigned by the Admin. |
| 🔄 **Live Status Updates** | Update live booking statuses (`EN_ROUTE`, `WASH_IN_PROGRESS`, `COMPLETED`). |
| 📷 **Visual Proof & AI Verification** | Auto-upload Before & After images to cloud storage. The Gemini AI actively inspects after-wash photos to ensure quality standards are met. |
| 📶 **Offline Mode (IndexedDB)** | Work seamlessly in underground garages with zero signal. Actions and photos queue locally and auto-sync when cellular connection is restored. |
| 💰 **Automated Daily Payouts** | Earnings (70% cut) are automatically calculated and processed via cron-scheduled BullMQ background workers every night at 11:59 PM. |

### 🛡️ Admins
| Feature | Description |
|---|---|
| 🏪 **Location Management** | Manage physical washing store branches, enabling users to book in-store rather than at their doorstep. |
| 🎁 **Coupon & Promotion Engine** | Create, manage, and expire custom discount codes with minimum order values and total usage limits. |
| 🛍️ **Up-sell Management** | Build and manage Service Add-ons and Premium Subscription Plans directly synced to Razorpay. |
| 👥 **Smart Auto-Dispatching** | Bookings are automatically matched and dispatched to the best available partner via BullMQ workers, with manual overrides available in the dashboard. |
| 📈 **Advanced Analytics** | High-level dashboard showing total revenue, active users, service distribution graphs, and dynamic 7-day/30-day/1-year/All-Time revenue trends. |

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router) + PWA + Service Workers |
| **Backend Framework** | Node.js + Express.js |
| **Language** | TypeScript (Strict) |
| **Styling** | Tailwind CSS v4 + ShadCN UI + Framer Motion |
| **State Management** | Zustand (Persistent Storage) + React Query |
| **Database** | PostgreSQL |
| **Cache & Real-Time** | Redis + Socket.io |
| **Message Queue** | BullMQ (Redis-backed Job Queues) |
| **Artificial Intelligence** | @ai-sdk/google (Gemini 2.5 Flash) |
| **ORM** | Prisma |
| **Payments** | Razorpay SDK + Server-to-Server Webhooks |

---

## 🏗 Architecture

CleanRide uses a **decoupled monorepo** approach.

```mermaid
graph TD
    UserClient[👤 User / Partner / Admin\nNext.js PWA Client]

    subgraph "Frontend (Next.js 15)"
    NextJS[App Router]
    SocketClient[Socket.io Client]
    ServiceWorker[Web Push SW]
    end

    subgraph "Backend API (Express.js)"
    Controllers[Route Controllers]
    Webhooks[Razorpay Webhook Handlers]
    SocketServer[Socket.io Server]
    RedisCache[Redis Middleware]
    end

    subgraph "Infrastructure"
    PostgreSQL[(PostgreSQL DB)]
    Redis[(Redis Cluster)]
    External[Razorpay APIs]
    end

    UserClient <-->|REST API| NextJS
    NextJS <-->|Axios| Controllers
    NextJS <-->|WebSockets| SocketServer
    
    Controllers <--> RedisCache
    RedisCache <--> Redis
    Controllers <--> PostgreSQL
    
    Webhooks <--> External
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Docker Desktop (optional but recommended)
- PostgreSQL Database URL
- Redis URL
- Razorpay API Keys & Webhook Secret
- VAPID Keys (for push notifications)

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
RAZORPAY_WEBHOOK_SECRET="xxx"
SMTP_HOST="smtp.ethereal.email"
REDIS_URL="redis://localhost:6379"
VAPID_PUBLIC_KEY="xxx"
VAPID_PRIVATE_KEY="xxx"
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
NEXT_PUBLIC_VAPID_PUBLIC_KEY="xxx"
GEMINI_API_KEY="xxx"
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
