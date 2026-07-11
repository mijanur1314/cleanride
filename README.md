# 🚗 CleanRide

![CleanRide Banner](https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2070&auto=format&fit=crop)

**CleanRide** is a premium, modern, and production-ready vehicle washing platform. It enables customers to effortlessly book online car and bike wash services. The platform supports both doorstep services (where washing partners visit customer locations) and offline store appointments. 

Designed with a high-end UI/UX and a robust microservice-inspired monolithic backend, CleanRide connects Customers, Washing Partners, and Platform Administrators in a single, seamless ecosystem.

---

## ✨ Key Features

- **Multi-Role Dashboards**: Dedicated and secure portals for Users, Partners, and Admins.
- **Dynamic Booking System**: Multi-step booking flow (Service ➔ Vehicle ➔ Schedule ➔ Payment).
- **Partner Assignments**: Admins can route and assign specific bookings to available Washing Partners.
- **Service Verification**: Partners can upload Before & After images to prove service completion.
- **Integrated Payments**: Secure, instant online payment processing powered by Razorpay.
- **Premium UI/UX**: Stunning animations using Framer Motion, sleek components via ShadCN, and dynamic theming.
- **Robust Security**: Role-based Access Control (RBAC), JWT Authentication, and bcrypt password hashing.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: [React.js](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Form Handling**: React Hook Form + Zod

### Backend (Server)
- **Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Powered by Supabase / Neon)
- **Payments**: Razorpay Node SDK

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Make sure you have the following installed on your local machine:
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- A **PostgreSQL** database (e.g., Supabase, Neon, or local Docker container)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/cleanride.git
cd cleanride
```

### 2. Environment Variables Setup

You will need to configure environment variables for both the Client and the Server.

**Backend (`server/.env`)**
Create a `.env` file in the `server` directory and add the following variables:

```env
PORT=5000
NODE_ENV=development

# Database URLs (e.g., from Supabase or Neon)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID="rzp_test_your_key_here"
RAZORPAY_KEY_SECRET="your_razorpay_secret_here"
```

**Frontend (`client/.env.local`)**
Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 3. Install Dependencies

You need to install packages for both the server and the client.

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 4. Database Setup (Prisma)

Navigate to the server directory and sync your Prisma schema with your PostgreSQL database:

```bash
cd server
npx prisma db push
npx prisma generate
```

*(Optional)* If you have seed data configured, run:
```bash
npx prisma db seed
```

### 5. Start the Development Servers

You will need to run both the frontend and backend servers concurrently. Open two separate terminal windows:

**Terminal 1 (Backend)**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend)**
```bash
cd client
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API at [http://localhost:5000](http://localhost:5000).

---

## 🏗 Project Structure

```text
cleanride/
├── client/                     # Next.js Frontend App
│   ├── src/
│   │   ├── app/                # Next.js 15 App Router pages (auth, book, dashboard)
│   │   ├── components/         # Reusable UI components (ShadCN, Custom)
│   │   ├── lib/                # Utility functions, Axios instances
│   │   └── store/              # Zustand state stores (useAuthStore, useBookingStore)
│   └── tailwind.config.ts      # Tailwind CSS v4 configurations
│
└── server/                     # Node.js + Express Backend App
    ├── prisma/                 # Prisma ORM Schema and Migrations
    ├── src/
    │   ├── controllers/        # Business logic for routes
    │   ├── middlewares/        # Custom middlewares (auth, error handling)
    │   ├── routes/             # Express API routes
    │   └── utils/              # Helper functions, AppError class
    └── prisma.config.ts        # Prisma configuration
```

---

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing

Contributions are always welcome! 
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
