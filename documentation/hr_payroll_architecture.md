# EzeeFlo HR & Payroll System — Architecture Document

## 1. Overview

The EzeeFlo HR & Payroll system is a completely independent module under the EzeeFlo solution. It resides alongside the ERP system with:

- **Separate Frontend** (`hr_payroll_frontend/`) — React + MUI + Redux
- **Separate Backend** (`hr_payroll_backend/`) — Express + Sequelize + MySQL
- **Separate Database** (`ezeeflo_hr_payroll`) — MySQL
- **Separate API** (`/api/hr`) — All HR & Payroll REST endpoints
- **Shared Integration Layer** (`shared/`) — Cross-cutting concerns

## 2. Architecture Principles

| Principle              | Implementation                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| **Independence**       | No code sharing with ERP; complete deployability separation          |
| **SSO Integration**    | Reuses ERP JWT tokens. HR backend validates against ERP's JWT_SECRET |
| **Company Context**    | Reads company from X-Company-Id header; validates via ERP API        |
| **Subscription**       | Checks `HR_PAYROLL` module in ERP's `company_subscription_modules`   |
| **Audit**              | Sends audit events to ERP's `/api/audit` endpoint                    |
| **Database Isolation** | No HR tables in ERP DB; no ERP tables in HR DB                       |
| **API Integration**    | HR → ERP: Read-only for Companies, Users, Subscriptions, Assets      |

## 3. Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **ORM**: Sequelize 6.x
- **Database**: MySQL 8.0
- **Auth**: JWT (validated against ERP's JWT_SECRET)
- **Validation**: Joi 17.x
- **Logging**: Winston
- **API Docs**: Swagger (OpenAPI 3.0)

### Frontend

- **Framework**: React 18
- **UI Library**: MUI 5.x
- **State**: Redux Toolkit + Redux Persist
- **Routing**: React Router 6
- **Forms**: React Hook Form
- **HTTP**: Axios
- **Charts**: MUI X Charts

## 4. Database Design

**Database Name**: `ezeeflo_hr_payroll`

### 4.1 Core HR Tables

```
employees                    — Employee master
employee_emergency_contacts  — Emergency contacts
employee_dependents          — Dependents
employee_documents           — Document management
employee_education           — Education history
employee_experience          — Work experience
employee_assets              — Asset assignments
```

### 4.2 Organization Tables

```
departments                  — Department master
designations                 — Designation/Job title master
branches                     — Branch master
cost_centers                 — Cost center master
organization_structures      — Org hierarchy / reporting lines
```

### 4.3 Attendance Tables

```
shifts                       — Shift definitions
shift_assignments            — Employee shift assignments
rosters                      — Employee rosters
attendances                  — Daily attendance records
attendance_logs              — Raw attendance logs (biometric/GPS)
overtime_entries             — Overtime records
```

### 4.4 Leave Management Tables

```
leave_types                  — Leave type definitions
leave_policies               — Leave accrual policies
leave_balances               — Per-employee leave balances
leave_applications           — Leave requests
leave_approvals              — Approval workflow
holidays                     — Public holidays
```

### 4.5 Payroll Tables

```
salary_structures            — Salary structure templates
salary_components            — Salary component definitions
employee_salaries            — Employee salary assignments
payroll_periods              — Payroll periods
payroll_runs                 — Payroll processing runs
payroll_details              — Payroll line items per employee
payslips                     — Generated payslips
```

### 4.6 Allowances & Deductions Tables

```
allowance_types              — Allowance type definitions
employee_allowances          — Employee allowances (fixed/variable)
deduction_types              — Deduction type definitions
employee_deductions          — Employee deductions
```

### 4.7 Loans & Benefits Tables

```
employee_loans               — Loan master
loan_repayments              — Repayment schedule & history
benefit_types                — Benefit type definitions
employee_benefits            — Employee benefit assignments
eosb_calculations            — End of Service Benefit calculations
eosb_settlements             — EOSB final settlements
```

### 4.8 Performance Tables

```
performance_goals            — Goals & objectives
performance_kpis             — KPI definitions
performance_appraisals       — Appraisal records
performance_ratings          — Rating scales
performance_reviews          — 360-degree reviews
```

### 4.9 Training Tables

```
training_courses             — Course catalog
training_sessions            — Training sessions
training_attendees           — Session attendance
training_certificates        — Issued certificates
```

### 4.10 Recruitment Tables

```
job_positions                — Open positions
job_applicants               — Applicants
interviews                   — Interview schedules
offer_letters                — Offer letters
```

### 4.11 Onboarding/Offboarding Tables

```
onboarding_checklists        — Onboarding task templates
onboarding_progress          — Per-employee onboarding progress
offboarding_checklists       — Offboarding task templates
offboarding_progress         — Per-employee offboarding progress
exit_interviews              — Exit interview records
```

### 4.12 WPS Tables

```
wps_configurations           — WPS bank format configurations
wps_exports                  — WPS/SIF export history
```

### 4.13 Employee Self Service Tables

```
ess_requests                 — ESS request types
ess_submissions              — ESS submissions
```

## 5. API Design

All endpoints are prefixed with `/api/hr`.

### Authentication Flow

1. User logs in via ERP (`POST /api/auth/login`)
2. ERP returns JWT access_token + refresh_token
3. HR frontend sends JWT in `Authorization: Bearer <token>` header
4. HR backend validates JWT against ERP's `JWT_SECRET`
5. HR backend validates company via `X-Company-Id` header
6. HR backend checks subscription for `HR_PAYROLL` module

### API Endpoints (Phase 1)

```
GET    /api/hr/dashboard/summary        — Dashboard statistics
GET    /api/hr/employees                 — List employees
POST   /api/hr/employees                 — Create employee
GET    /api/hr/employees/:id             — Get employee detail
PUT    /api/hr/employees/:id             — Update employee
DELETE /api/hr/employees/:id             — Delete employee
GET    /api/hr/employees/:id/documents   — Employee documents
POST   /api/hr/employees/:id/documents   — Upload document
```

## 6. Integration Points

| From HR → ERP                                      | Purpose                    |
| -------------------------------------------------- | -------------------------- |
| `GET /api/auth/me`                                 | Validate JWT token         |
| `GET /api/companies`                               | List companies for context |
| `GET /api/superadmin/subscriptions/by-company/:id` | Check HR module access     |
| `GET /api/assets`                                  | Read assigned assets       |
| `POST /api/audit`                                  | Send HR audit events       |

## 7. Coding Standards

- **Controllers**: Thin — delegate to services
- **Services**: Business logic — one service per domain
- **Repositories**: Data access — one repository per model
- **DTOs**: Data transformation layer
- **Validators**: Joi schemas — one validator per domain
- **UUIDs**: All primary keys are UUIDv4
- **Timestamps**: `createdAt`, `updatedAt`, `deletedAt` (paranoid)
- **Tenant Isolation**: All queries scoped to `tenantId`
- **Error Handling**: Centralized error handler middleware
- **API Response**: Standard `{ success, message, data, meta }` format

## 8. Implementation Phases

| Phase | Modules                                     | Status      |
| ----- | ------------------------------------------- | ----------- |
| 1     | Architecture + Auth + Dashboard + Employees | In Progress |
| 2     | Organization + Departments + Designations   | Pending     |
| 3     | Attendance + Shifts + Roster                | Pending     |
| 4     | Leave Management + Holidays                 | Pending     |
| 5     | Payroll + Salary Structure                  | Pending     |
| 6     | Allowances + Deductions                     | Pending     |
| 7     | Loans + Benefits + EOSB                     | Pending     |
| 8     | WPS + ESS                                   | Pending     |
| 9     | Performance + Training                      | Pending     |
| 10    | Recruitment + Onboarding + Offboarding      | Pending     |
| 11    | Reports + Documents                         | Pending     |
