# EzeeFlo Loyalty

## Enterprise SaaS Loyalty Management Platform

### Overview

EzeeFlo Loyalty is a comprehensive, standalone SaaS loyalty management platform designed for enterprises. It provides complete loyalty program management including points engine, membership tiers, rewards catalog, campaigns, coupons, gift cards, referrals, and advanced analytics.

### Architecture

```
ezeeflo_loyalty/
├── loyalty_backend/          # Node.js REST API Backend
│   ├── app.js                # Express app setup
│   ├── server.js             # Server entry point
│   ├── config/               # Database & Swagger config
│   ├── models/               # Sequelize ORM models
│   ├── middleware/            # Auth, RBAC, Audit, Error handling
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic layer
│   ├── repositories/         # Data access layer
│   ├── routes/               # API route definitions
│   ├── validators/           # Request validation
│   ├── seeders/              # Database seeders
│   └── utils/                # Helpers (ApiResponse, Logger, Errors)
├── loyalty_frontend/         # ReactJS Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── store/            # Redux state management
│   │   └── utils/            # Utilities (api, auth, toast)
│   └── public/
├── loyalty_database/
│   └── schema.sql            # Full MySQL database schema
└── documentation/
    └── README.md             # This file
```

### Technology Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| **Frontend**       | React 18, Material UI 5, Redux Toolkit, Recharts |
| **Backend**        | Node.js, Express, Sequelize ORM                  |
| **Database**       | MySQL 8.0+                                       |
| **Authentication** | JWT (Access + Refresh Tokens)                    |
| **Authorization**  | RBAC (Role-Based Access Control)                 |
| **API Docs**       | Swagger/OpenAPI 3.0                              |

### Getting Started

#### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

#### Backend Setup

```bash
cd loyalty_backend
npm install
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE ezeeflo_loyalty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# Or import schema:
mysql -u root -p ezeeflo_loyalty < ../loyalty_database/schema.sql
# Configure .env file
cp .env.example .env
# Start server
npm run dev
```

The server will auto-seed:

- Super admin user: `superadmin` / `SuperAdmin@123`
- Default permissions, roles, plans, modules, and membership tiers

#### Frontend Setup

```bash
cd loyalty_frontend
npm install
npm start
```

Frontend runs on `http://localhost:3001` and proxies API calls to `http://localhost:5001`.

### API Documentation

When the server is running, visit: `http://localhost:5001/api/docs`

### Phase 1 - Implemented Features

#### Authentication

- JWT-based login with access + refresh tokens
- Super admin separate login
- Password change, forgot/reset password
- Account lockout after 5 failed attempts

#### RBAC (Role-Based Access Control)

- Users, Roles, Permissions CRUD
- Role-Permission assignment
- User-Role assignment
- Middleware-based permission checking (AND/OR logic)
- Super admin bypass

#### Super Admin

- Company management (CRUD + status toggling)
- Subscription plans management
- Module management
- Plan-to-company assignment
- Super admin dashboard

#### User/Company Dashboard

- Dashboard with key metrics (customers, points, transactions)
- Stats cards with real-time data

### Phase 2-5 (Upcoming)

| Phase   | Modules                                                          |
| ------- | ---------------------------------------------------------------- |
| Phase 2 | Customers, Membership Tiers, Customer Segments                   |
| Phase 3 | Points Engine, Transactions, Rewards Catalog                     |
| Phase 4 | Campaigns, Coupons, Gift Cards, Referrals                        |
| Phase 5 | Reports, Analytics, Notifications, API Integrations, Audit Trail |

### API Endpoints (Phase 1)

#### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Users (requires auth)

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-status` - Toggle user status

#### Roles (requires auth)

- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/permissions` - Assign permissions

#### Permissions (requires auth)

- `GET /api/permissions` - List permissions
- `GET /api/permissions/groups` - Get permission groups
- `POST /api/permissions` - Create permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

#### Dashboard (requires auth)

- `GET /api/dashboard/stats` - Company dashboard stats

#### Super Admin (requires super admin)

- `GET /api/superadmin/dashboard/stats` - Platform stats
- `GET/POST /api/superadmin/plans` - Plans CRUD
- `GET/PUT/DELETE /api/superadmin/plans/:id` - Plan operations
- `PATCH /api/superadmin/plans/:id/toggle-status` - Toggle plan
- `GET/POST /api/superadmin/modules` - Modules CRUD
- `GET/POST /api/superadmin/companies` - Companies CRUD
- `PATCH /api/superadmin/companies/:id/status` - Update company status
- `POST /api/superadmin/companies/:companyId/assign-plan` - Assign plan

### Security Features

- JWT with access/refresh token rotation
- Password hashing (bcrypt, 12 rounds)
- Rate limiting (general + auth)
- Helmet security headers
- CORS configuration
- RBAC middleware
- Input validation (express-validator)
- Request body size limits
- Audit logging

### Database Schema

The schema includes 30+ tables covering:

- Platform management (companies, plans, modules, licenses)
- RBAC (users, roles, permissions)
- Loyalty core (customers, accounts, points, membership)
- Commerce (rewards, coupons, gift cards, referrals)
- Communication (notifications, templates)
- Security (audit logs, API keys)
- Billing (invoices, payments, usage tracking)

See `loyalty_database/schema.sql` for the complete DDL.

### Super Admin Default Credentials

- **URL:** `http://localhost:3001/superadmin/login`
- **Username:** `superadmin`
- **Password:** `SuperAdmin@123`

### License

Proprietary - EzeeFlo Technologies
