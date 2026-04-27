# Restaurant Management System (RMS)

A full-stack restaurant management system built with React, Express, TypeScript, and Prisma.

## Features

- **Dashboard** - Real-time overview of restaurant operations
- **Table Management** - Track table status (Available/Reserved/Occupied), merge/unmerge tables
- **Order Management** - Create and track orders through complete lifecycle (Pending → Preparing → Ready → Served → Billed → Completed)
- **Kitchen Display** - Real-time kitchen queue with order preparation tracking
- **Billing** - Generate bills, apply discounts, process payments (Cash/Card/UPI)
- **Menu Management** - Categories and menu items with pricing and availability
- **Inventory** - Stock tracking with low-stock alerts
- **Reservations** - Table reservation management
- **Delivery** - Delivery order tracking with driver assignment
- **Reports** - Revenue analytics, popular items, order statistics
- **User Management** - Role-based access control (RBAC)

## Role-Based Access Control (RBAC)

| Role     | Tables | Menu | Orders | Kitchen | Billing | Inventory | Reports | Users | Delivery |
|----------|--------|------|--------|---------|---------|-----------|---------|-------|----------|
| Admin    | Full   | Full | Full   | Full    | Full    | Full      | Full    | Full  | Full     |
| Manager  | Full   | Full | Full   | Full    | Full    | Full      | Full    | -     | Full     |
| Waiter   | View   | View | Create | -       | -       | -         | -       | -     | -        |
| Kitchen  | -      | View | View   | Full    | -       | -         | -       | -     | -        |
| Cashier  | View   | -    | View   | -       | Full    | -         | -       | -     | -        |
| Delivery | -      | -    | Own    | -       | -       | -         | -       | -     | Own      |

## Workflow

```
Customer Seating → Order Creation → Kitchen Processing → Order Serving → Billing → Order Closure
```

### Order Status Flow
```
PENDING → PREPARING → READY → SERVED → BILLED → COMPLETED
```

### Table Status Flow
```
AVAILABLE ↔ RESERVED → OCCUPIED → AVAILABLE
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM, SQLite
- **Auth**: JWT-based authentication with role-based access control

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed   # Seeds demo data
npm run dev       # Starts on port 3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on port 5173
```

### Demo Credentials

| Role     | Email              | Password  |
|----------|--------------------|-----------|
| Admin    | admin@rms.com      | admin123  |
| Manager  | manager@rms.com    | staff123  |
| Waiter   | waiter@rms.com     | staff123  |
| Kitchen  | kitchen@rms.com    | staff123  |
| Cashier  | cashier@rms.com    | staff123  |
| Delivery | delivery@rms.com   | staff123  |

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── src/
│   │   ├── index.ts             # Express server entry
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT auth & RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── tables.ts        # Table management
│   │   │   ├── menu.ts          # Menu & categories
│   │   │   ├── orders.ts        # Order lifecycle
│   │   │   ├── kitchen.ts       # Kitchen display
│   │   │   ├── billing.ts       # Billing & payments
│   │   │   ├── inventory.ts     # Stock management
│   │   │   ├── reservations.ts  # Reservations
│   │   │   ├── delivery.ts      # Delivery tracking
│   │   │   ├── reports.ts       # Analytics
│   │   │   ├── users.ts         # User management
│   │   │   └── dashboard.ts     # Dashboard stats
│   │   ├── utils/
│   │   │   ├── prisma.ts        # Prisma client
│   │   │   ├── rbac.ts          # RBAC matrix
│   │   │   └── workflow.ts      # State machine transitions
│   │   └── seed/
│   │       └── seed.ts          # Demo data seeder
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Routes
│   │   ├── components/
│   │   │   └── Layout.tsx       # Sidebar navigation
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance
│   │   │   └── utils.ts         # Helpers
│   │   ├── pages/               # All page components
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   └── package.json
└── README.md
```
