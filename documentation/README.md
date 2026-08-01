# EzeeFlo HR & Payroll System

## Project Structure

```
ezeeflo/
├── erp_frontend/          # ERP Frontend (existing — unchanged)
├── erp_backend/           # ERP Backend (existing — unchanged)
├── erp_database/          # ERP Database (existing — unchanged)
├── hr_payroll_frontend/   # NEW: HR & Payroll Frontend
├── hr_payroll_backend/    # NEW: HR & Payroll Backend
├── hr_payroll_database/   # NEW: HR & Payroll Database
├── shared/                # NEW: Shared integration layer
├── documentation/         # NEW: Architecture documentation
```

## Quick Start

### 1. Create Database

```bash
mysql -u root -p < hr_payroll_database/schema.sql
```

### 2. Install Backend Dependencies

```bash
cd hr_payroll_backend
npm install
```

### 3. Start Backend

```bash
cd hr_payroll_backend
npm run dev
# Runs on http://localhost:5001
# API Docs: http://localhost:5001/api/hr/docs
```

### 4. Install Frontend Dependencies

```bash
cd hr_payroll_frontend
npm install
```

### 5. Start Frontend

```bash
cd hr_payroll_frontend
npm start
# Runs on http://localhost:3000
```

## Architecture

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 18, MUI 5, Redux Toolkit, React Router 6 |
| Backend  | Node.js, Express 4, Sequelize 6                |
| Database | MySQL 8.0 (ezeeflo_hr_payroll)                 |
| Auth     | JWT SSO (validates against ERP's JWT_SECRET)   |
| API Docs | Swagger / OpenAPI 3.0                          |

## Authentication Flow

1. User logs in via ERP (`/api/auth/login`)
2. ERP returns JWT tokens
3. HR frontend reads tokens from ERP's persisted Redux store
4. HR backend validates JWT against ERP's `JWT_SECRET`
5. HR backend validates company via `X-Company-Id` header
6. HR backend checks subscription for `HR_PAYROLL` module

## Implemented Modules (Phase 1)

✅ Architecture & Folder Structure
✅ Database Schema (6 tables: branches, departments, designations, cost_centers, employees, employee_documents)
✅ Backend (Express + Sequelize + JWT auth + ERP integration)
✅ Frontend (React + MUI + Redux + Protected Routes)
✅ SSO Authentication (JWT validation against ERP)
✅ Company Context Validation
✅ Subscription Validation
✅ Shared Integration Layer (ERP API Service)
✅ Dashboard (stat cards, birthdays, contract expiry, department distribution)
✅ Employees Module (CRUD, full profile, filters, search, pagination)

## Backend API Endpoints

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | /api/hr/health            | Health check               |
| GET    | /api/hr/dashboard/summary | Dashboard statistics       |
| GET    | /api/hr/employees         | List employees (paginated) |
| POST   | /api/hr/employees         | Create employee            |
| GET    | /api/hr/employees/:id     | Get employee detail        |
| PUT    | /api/hr/employees/:id     | Update employee            |
| DELETE | /api/hr/employees/:id     | Delete employee            |

## Integration Points

HR communicates with ERP through the shared integration service:

- `validateUser(token)` — Validates JWT via `/api/auth/me`
- `validateCompanyAccess(userId, companyId, token)` — Validates company access
- `checkSubscriptionModule(companyId, 'HR_PAYROLL', token)` — Checks subscription
- `sendAuditEvent(token, auditData)` — Sends audit events to ERP
- `getCompany(companyId, token)` — Reads company details from ERP

## Next Phase (Pending Approval)

The following modules are designed and ready for implementation:

- Organization Structure (Departments, Designations, Branches, Cost Centers)
- Attendance & Shift Management
- Leave Management & Holidays
- Payroll Processing
- Salary Structure & Components
- Allowances & Deductions
- Loans & Benefits
- EOSB
- WPS/SIF Export
- Employee Self Service
- Performance Management
- Training
- Recruitment
- Onboarding & Offboarding
- Reports (Stored Procedures)
