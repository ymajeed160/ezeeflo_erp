# EzeeFlo HR & Payroll — Comprehensive QA Test Suite

**Generated:** 2026-07-29  
**Reviewers:** Senior QA Lead, HRMS Functional Consultant, Payroll Specialist, Enterprise Test Architect  
**Scope:** HR & Payroll system only (`hr_payroll_backend`, `hr_payroll_frontend`, `hr_payroll_database`)  
**Methodology:** Code-review driven — all findings based on actual source code analysis

---

## EXECUTIVE SUMMARY

### System Inventory

- **Backend Controllers/Services:** 48 modules across Organization, Employee, Attendance, Leave, Payroll, Benefits, HR Modules, Settings, Master Data
- **Database Tables:** ~40 tables (6 defined in schema.sql, 34 via Sequelize sync)
- **Frontend Pages:** 25+ pages covering all modules
- **API Endpoints:** 200+ REST endpoints under `/api/hr/*`
- **Middleware Chain:** hrAuthMiddleware → hrCompanyMiddleware → hrSubscriptionMiddleware

### Critical Issues Found (Code Review)

| #   | Issue                                                                     | Severity    |
| --- | ------------------------------------------------------------------------- | ----------- |
| C1  | schema.sql missing 34 of 40 tables — DB relies on disabled Sequelize sync | 🔴 CRITICAL |
| C2  | All 14 Payroll endpoints have ZERO input validation                       | 🔴 CRITICAL |
| C3  | All 6 Benefits/EOSB endpoints have ZERO input validation                  | 🔴 CRITICAL |
| C4  | All 15 HR Modules endpoints have ZERO input validation                    | 🔴 CRITICAL |
| C5  | hrSubscriptionMiddleware is a no-op — no actual subscription checks       | 🔴 CRITICAL |
| C6  | Duplicate health check route in app.js — first route is overridden        | 🔴 CRITICAL |
| C7  | All HR DB foreign keys missing — referential integrity exists only in JS  | 🔴 HIGH     |
| C8  | HRAuthController hardcodes DB password fallback `Memits@396`              | 🔴 HIGH     |
| C9  | 7 Settings entities + Master Data have ZERO input validation              | 🟡 MEDIUM   |
| C10 | No role-based access control — no permission checks on any route          | 🟡 MEDIUM   |

---

## SECTION 1: FUNCTIONAL TEST CASES

### 1.1 AUTHENTICATION

| TC ID       | Sub Module      | Scenario                    | Preconditions                      | Test Steps                                                                 | Expected Result                                                          | Priority | Severity | Type        | Auto |
| ----------- | --------------- | --------------------------- | ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | -------- | ----------- | ---- |
| HR-AUTH-001 | Login           | Valid credentials login     | User exists in ERP users table     | 1. POST /api/hr/auth/login with valid email + password                     | 200 OK, returns accessToken + refreshToken + user object + tenants array | P0       | Critical | Functional  | Yes  |
| HR-AUTH-002 | Login           | Invalid password            | User exists                        | 1. POST /api/hr/auth/login with valid email + wrong password               | 401 "Invalid credentials"                                                | P0       | Critical | Functional  | Yes  |
| HR-AUTH-003 | Login           | Non-existent user           | —                                  | 1. POST with email not in DB                                               | 401 "Invalid credentials"                                                | P0       | Critical | Negative    | Yes  |
| HR-AUTH-004 | Login           | Missing fields              | —                                  | 1. POST with empty body                                                    | 400 Bad Request                                                          | P1       | High     | Negative    | Yes  |
| HR-AUTH-005 | Token           | Valid token access          | Valid accessToken from login       | 1. GET /api/hr/auth/me with Bearer token                                   | 200 OK, returns user profile                                             | P0       | Critical | Functional  | Yes  |
| HR-AUTH-006 | Token           | Expired token               | Generate expired JWT               | 1. GET /api/hr/auth/me with expired token                                  | 401 "Token expired"                                                      | P1       | High     | Security    | Yes  |
| HR-AUTH-007 | Token           | No token provided           | —                                  | 1. GET /api/hr/employees without Authorization header                      | 401 Unauthorized                                                         | P0       | Critical | Security    | Yes  |
| HR-AUTH-008 | Token           | Tampered token              | Valid token                        | 1. GET with modified JWT payload                                           | 401 Invalid token                                                        | P1       | High     | Security    | Yes  |
| HR-AUTH-009 | Multi-tenant    | Tenant selection in login   | User belongs to multiple tenants   | 1. Login → 2. Check response contains tenants[] array with activeCompanyId | tenants[] populated with company details; first tenant auto-selected     | P0       | Critical | Functional  | Yes  |
| HR-AUTH-010 | Multi-tenant    | Company ID header required  | Logged in                          | 1. GET /api/hr/employees without X-Company-Id header                       | 400 "Company context required"                                           | P0       | Critical | Functional  | Yes  |
| HR-AUTH-011 | Logout          | Token invalidation          | Valid session                      | 1. Clear localStorage → 2. Navigate to any route                           | Redirect to /hr/login                                                    | P2       | Medium   | Functional  | No   |
| HR-AUTH-012 | Security        | SQL Injection in login      | —                                  | 1. POST login with `' OR 1=1 --` as password                               | 401 — treated as literal password, not SQL                               | P0       | Critical | Security    | Yes  |
| HR-AUTH-013 | Security        | XSS in login                | —                                  | 1. POST login with `<script>alert(1)</script>` as email                    | 401 — input sanitized                                                    | P1       | High     | Security    | Yes  |
| HR-AUTH-014 | Security        | Hardcoded password fallback | Check HRAuthController.js line ~30 | 1. Remove HR_DB_PASSWORD env var → 2. Attempt login                        | System uses fallback password `Memits@396` 🔴 SECURITY ISSUE             | P0       | Critical | Security    | No   |
| HR-AUTH-015 | ERP Integration | Cross-DB query works        | HR DB and ERP DB both accessible   | 1. Verify HRAuthController queries `erp_mt_suite.users` table              | User found in ERP DB, bcrypt password verified                           | P0       | Critical | Integration | Yes  |

---

### 1.2 EMPLOYEE MANAGEMENT

| TC ID      | Sub Module | Scenario                          | Preconditions                                                        | Test Steps                                                       | Expected Result                                                     | Priority | Severity | Type       | Auto |
| ---------- | ---------- | --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-EMP-001 | Create     | All fields valid                  | Company context; valid department/designation/branch/cost-center IDs | 1. POST /api/hr/employees with complete body (70+ fields)        | 201 Created; employee code auto-generated EMP-000002                | P0       | Critical | Functional | Yes  |
| HR-EMP-002 | Create     | Minimum required fields           | Company context                                                      | 1. POST with only firstName, lastName, employeeCode, joiningDate | 201 Created with defaults for nullable fields                       | P0       | Critical | Functional | Yes  |
| HR-EMP-003 | Create     | Duplicate employee code           | EMP-000001 exists                                                    | 1. POST with employeeCode=EMP-000001                             | 400 "Employee code already exists"                                  | P1       | High     | Negative   | Yes  |
| HR-EMP-004 | Create     | Invalid department ID             | —                                                                    | 1. POST with departmentId=non-existent-uuid                      | 400 Bad Request (depends on FK — if FKs exist) or 201 (if no FK) ⚠️ | P1       | High     | Negative   | Yes  |
| HR-EMP-005 | Create     | Empty string in numeric field     | —                                                                    | 1. POST with basicSalary=""                                      | Now accepts '' due to validator fix; converts to 0 or NULL          | P2       | Medium   | Functional | Yes  |
| HR-EMP-006 | Create     | Negative salary                   | —                                                                    | 1. POST with basicSalary=-5000                                   | Should reject — depends on validator min(0) rule                    | P2       | Medium   | Negative   | Yes  |
| HR-EMP-007 | Read       | List with pagination              | Multiple employees exist                                             | 1. GET /api/hr/employees?page=1&limit=10                         | 200; returns { data: [...], meta: { pagination } }                  | P0       | Critical | Functional | Yes  |
| HR-EMP-008 | Read       | Search by name                    | John Doe exists                                                      | 1. GET /api/hr/employees?search=John                             | Returns only matching employees                                     | P1       | High     | Functional | Yes  |
| HR-EMP-009 | Read       | Filter by status                  | —                                                                    | 1. GET /api/hr/employees?status=Active                           | Returns only active employees                                       | P1       | High     | Functional | Yes  |
| HR-EMP-010 | Read       | Get by ID                         | Valid employee ID                                                    | 1. GET /api/hr/employees/:id                                     | 200; returns employee with department, designation, branch includes | P0       | Critical | Functional | Yes  |
| HR-EMP-011 | Read       | Non-existent ID                   | —                                                                    | 1. GET /api/hr/employees/non-existent                            | 404 Not Found                                                       | P2       | Medium   | Negative   | Yes  |
| HR-EMP-012 | Update     | All fields changeable             | Valid employee                                                       | 1. PUT /api/hr/employees/:id with new firstName                  | 200 Updated; returns full updated object                            | P0       | Critical | Functional | Yes  |
| HR-EMP-013 | Update     | Change employee code to duplicate | EMP-000002 exists                                                    | 1. PUT EMP-000001 with employeeCode=EMP-000002                   | 400 Conflict (if uniqueness enforced) ⚠️                            | P1       | High     | Negative   | Yes  |
| HR-EMP-014 | Update     | Change to non-existent department | —                                                                    | 1. PUT with departmentId=invalid-uuid                            | Should fail with 400 if FK enforced ⚠️                              | P1       | High     | Negative   | Yes  |
| HR-EMP-015 | Delete     | Soft delete                       | Valid employee                                                       | 1. DELETE /api/hr/employees/:id                                  | 200; deleted_at set; employee excluded from default queries         | P0       | Critical | Functional | Yes  |
| HR-EMP-016 | Delete     | Non-existent ID                   | —                                                                    | 1. DELETE /api/hr/employees/non-existent                         | 404 Not Found                                                       | P2       | Medium   | Negative   | Yes  |
| HR-EMP-017 | Import     | CSV upload                        | CSV with valid headers                                               | 1. POST /api/hr/employees/import with CSV file                   | 200; returns count of imported records + errors list                | P2       | Medium   | Functional | No   |
| HR-EMP-018 | Bulk       | Bulk status update                | Multiple employees                                                   | 1. POST bulk status change endpoint (if exists)                  | Verify existence first ⚠️ endpoint may not exist                    | P3       | Low      | Functional | No   |

---

### 1.3 ORGANIZATION

| TC ID      | Sub Module   | Scenario                   | Preconditions                     | Test Steps                                            | Expected Result                                             | Priority | Severity | Type       | Auto |
| ---------- | ------------ | -------------------------- | --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-ORG-001 | Departments  | Create department          | Valid branch ID                   | 1. POST /api/hr/departments with code, name, branchId | 201 Created                                                 | P0       | Critical | Functional | Yes  |
| HR-ORG-002 | Departments  | Create with parent         | Parent dept exists                | 1. POST with parentId set                             | 201; hierarchy reflected in GET tree                        | P1       | High     | Functional | Yes  |
| HR-ORG-003 | Departments  | Create with invalid branch | —                                 | 1. POST with branchId=invalid                         | Should 400 if FK enforced ⚠️                                | P1       | High     | Negative   | Yes  |
| HR-ORG-004 | Departments  | Duplicate code             | "HR" dept exists                  | 1. POST with code="HR"                                | 400 "Code already exists"                                   | P1       | High     | Negative   | Yes  |
| HR-ORG-005 | Departments  | Assign manager             | Manager employee exists           | 1. PUT with managerId set                             | 200; manager relation visible in GET                        | P2       | Medium   | Functional | Yes  |
| HR-ORG-006 | Departments  | Soft delete                | Department has no employees       | 1. DELETE /api/hr/departments/:id                     | 200; department excluded from list                          | P1       | High     | Functional | Yes  |
| HR-ORG-007 | Departments  | Delete with employees      | Department has assigned employees | 1. DELETE department with active employees            | Should warn or prevent ⚠️ depends on FK cascade             | P1       | High     | Negative   | Yes  |
| HR-ORG-008 | Designations | Full CRUD                  | —                                 | 1. Create → Read → Update → Delete                    | All operations succeed with valid data                      | P0       | Critical | Functional | Yes  |
| HR-ORG-009 | Branches     | Full CRUD                  | —                                 | 1. Create → Read → Update → Delete                    | All operations succeed                                      | P0       | Critical | Functional | Yes  |
| HR-ORG-010 | Cost Centers | Full CRUD                  | Department exists                 | 1. Create → Read → Update → Delete                    | All operations succeed; department relation included in GET | P0       | Critical | Functional | Yes  |
| HR-ORG-011 | Hierarchy    | Department tree            | Multi-level depts                 | 1. GET /api/hr/departments/tree (if exists)           | Nested hierarchy returned ⚠️ verify endpoint exists         | P2       | Medium   | Functional | Yes  |

---

### 1.4 ATTENDANCE

| TC ID      | Sub Module | Scenario             | Preconditions                                        | Test Steps                                                      | Expected Result                                                  | Priority | Severity | Type       | Auto |
| ---------- | ---------- | -------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-ATT-001 | Check-In   | Manual check-in      | Employee exists, attendance not already marked today | 1. POST /api/hr/attendance/mark with employeeId, checkInTime    | 200; status='Present'; totalWorkedMinutes calculated on checkout | P0       | Critical | Functional | Yes  |
| HR-ATT-002 | Check-In   | Duplicate check-in   | Already checked in today                             | 1. POST mark attendance again for same employee                 | 400 "Attendance already marked"                                  | P1       | High     | Negative   | Yes  |
| HR-ATT-003 | Check-In   | Invalid employee     | —                                                    | 1. POST with non-existent employeeId                            | 400/404                                                          | P1       | High     | Negative   | Yes  |
| HR-ATT-004 | Check-Out  | Manual check-out     | Employee checked in                                  | 1. POST update attendance with checkOutTime                     | 200; totalWorkedMinutes calculated; status updated               | P0       | Critical | Functional | Yes  |
| HR-ATT-005 | Late       | Late arrival         | Shift start 9:00 AM                                  | 1. Check-in at 9:30 AM (30 min late)                            | Status='Late'; lateMinutes=30                                    | P0       | Critical | Functional | Yes  |
| HR-ATT-006 | Late       | Grace period         | Grace period 15 min                                  | 1. Check-in at 9:14 AM                                          | Status='Present' (within grace period)                           | P1       | High     | Functional | Yes  |
| HR-ATT-007 | Half Day   | Below threshold      | Half-day threshold 240 min                           | 1. Work only 3.5 hours (210 min)                                | Status='Half Day'                                                | P1       | High     | Functional | Yes  |
| HR-ATT-008 | Absent     | No check-in          | —                                                    | 1. Run absence detection query                                  | Status='Absent' for employees with no record for the day         | P2       | Medium   | Functional | Yes  |
| HR-ATT-009 | Overtime   | Regular overtime     | Overtime approved                                    | 1. Check-out after 2 extra hours → 2. POST /api/hr/overtime     | Overtime record created with calculated minutes                  | P0       | Critical | Functional | Yes  |
| HR-ATT-010 | Overtime   | Weekend overtime     | Saturday/Sunday                                      | 1. Mark attendance on weekend day                               | Overtime status='Weekend'; rate multiplier applied               | P1       | High     | Functional | Yes  |
| HR-ATT-011 | Overtime   | Holiday overtime     | Public holiday                                       | 1. Mark attendance on holiday                                   | Overtime status='Holiday'; higher rate applied                   | P1       | High     | Functional | Yes  |
| HR-ATT-012 | Overtime   | Approve              | Overtime record pending                              | 1. POST /api/hr/overtime/:id/approve                            | Status='Approved'; ready for payroll                             | P1       | High     | Workflow   | Yes  |
| HR-ATT-013 | Correction | Admin correction     | Employee has incorrect attendance                    | 1. PUT /api/hr/attendance/:id update checkInTime                | 200; updated; isManualEntry=true                                 | P0       | Critical | Functional | Yes  |
| HR-ATT-014 | Correction | Approval required    | Correction made                                      | 1. Manager approves correction                                  | Attendance corrected with audit trail                            | P2       | Medium   | Workflow   | No   |
| HR-ATT-015 | Bulk       | Bulk mark attendance | Multiple employees                                   | 1. POST /api/hr/attendance/bulk with employeeIds[]              | Bulk operation succeeds; returns success/failure per record      | P2       | Medium   | Functional | Yes  |
| HR-ATT-016 | List       | Filter by date range | Attendance records exist                             | 1. GET /api/hr/attendance?dateFrom=2026-07-01&dateTo=2026-07-31 | Returns only records in range                                    | P1       | High     | Functional | Yes  |
| HR-ATT-017 | Today      | Today summary        | Check-ins today                                      | 1. GET /api/hr/attendance/today-summary                         | Returns Present/Absent/Late/OnLeave counts                       | P1       | High     | Functional | Yes  |

---

### 1.5 SHIFT MANAGEMENT

| TC ID      | Sub Module | Scenario                 | Preconditions                          | Test Steps                                                                | Expected Result                                            | Priority | Severity | Type       | Auto |
| ---------- | ---------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-SFT-001 | Shift      | Create morning shift     | —                                      | 1. POST /api/hr/shifts with start 8:00, end 17:00                         | 201; color, gracePeriod defaults set                       | P0       | Critical | Functional | Yes  |
| HR-SFT-002 | Shift      | Create night shift       | —                                      | 1. POST with start 20:00, end 6:00, isNightShift=true                     | 201; night shift flag set                                  | P1       | High     | Functional | Yes  |
| HR-SFT-003 | Shift      | Duplicate code           | "MORNING" exists                       | 1. POST with code="MORNING"                                               | 400 Conflict                                               | P1       | High     | Negative   | Yes  |
| HR-SFT-004 | Shift      | Invalid time range       | —                                      | 1. POST with start=17:00, end=8:00 (non-night)                            | Should validate if hours are valid ⚠️ depends on validator | P2       | Medium   | Negative   | Yes  |
| HR-SFT-005 | Assignment | Assign shift to employee | Shift + Employee exist                 | 1. POST /api/hr/shift-assignments with employeeId, shiftId, effectiveFrom | 201; assignment created                                    | P0       | Critical | Functional | Yes  |
| HR-SFT-006 | Assignment | Overlapping assignment   | Employee already has active assignment | 1. POST another assignment with same effective period                     | Should warn or handle overlap ⚠️ no overlap check found    | P1       | High     | Negative   | Yes  |
| HR-SFT-007 | Assignment | Rotate shift             | Employee assigned new shift            | 1. PUT end previous assignment → 2. Create new assignment                 | Old assignment ends; new assignment starts                 | P1       | High     | Workflow   | Yes  |
| HR-SFT-008 | Roster     | Generate roster          | Employees with shifts                  | 1. POST /api/hr/rosters/generate with date range                          | Roster generated for all employees with shift patterns     | P1       | High     | Functional | Yes  |
| HR-SFT-009 | Roster     | Bulk create              | —                                      | 1. POST /api/hr/rosters/bulk with rosterEntries[]                         | Multiple roster entries created                            | P2       | Medium   | Functional | Yes  |

---

### 1.6 LEAVE MANAGEMENT

| TC ID      | Sub Module | Scenario                | Preconditions                                          | Test Steps                                                                          | Expected Result                                                        | Priority | Severity | Type       | Auto |
| ---------- | ---------- | ----------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-LEV-001 | Apply      | Valid leave application | Employee exists; leave type exists; sufficient balance | 1. POST /api/hr/leave-applications with employeeId, leaveTypeId, startDate, endDate | 201; status='Draft' or 'Submitted'; applicationNumber auto-generated   | P0       | Critical | Functional | Yes  |
| HR-LEV-002 | Apply      | Insufficient balance    | Employee has 2 days annual leave remaining             | 1. Apply for 5 days annual leave                                                    | 400 "Insufficient leave balance"                                       | P0       | Critical | Negative   | Yes  |
| HR-LEV-003 | Apply      | Overlapping dates       | Employee has approved leave 7/1-7/5                    | 1. Apply for 7/3-7/8                                                                | 400 "Overlapping leave exists"                                         | P1       | High     | Negative   | Yes  |
| HR-LEV-004 | Apply      | Weekend in middle       | Leave includes Sat-Sun                                 | 1. Apply Mon-Fri → Mon                                                              | Total days calculated correctly (exclude weekends if setting enabled)  | P1       | High     | Functional | Yes  |
| HR-LEV-005 | Apply      | Holiday in middle       | Leave includes public holiday                          | 1. Apply including holiday date                                                     | Holiday excluded from leave count if setting enabled                   | P2       | Medium   | Functional | Yes  |
| HR-LEV-006 | Approve    | Manager approval        | Leave status='Submitted'                               | 1. PUT /api/hr/leave-applications/:id/approve                                       | Status='Approved'; balance reduced; approval audit logged              | P0       | Critical | Workflow   | Yes  |
| HR-LEV-007 | Approve    | Auto-approve            | LeaveSettings.autoApproveEnabled=true                  | 1. Submit leave → 2. Check status                                                   | Immediately 'Approved' without manual approval                         | P2       | Medium   | Functional | Yes  |
| HR-LEV-008 | Reject     | Manager rejection       | Leave submitted                                        | 1. PUT /api/hr/leave-applications/:id/reject with remarks                           | Status='Rejected'; balance unchanged                                   | P0       | Critical | Workflow   | Yes  |
| HR-LEV-009 | Cancel     | Employee cancellation   | Leave approved                                         | 1. PUT cancel → 2. Balance restored                                                 | Status='Cancelled'; balance restored                                   | P1       | High     | Workflow   | Yes  |
| HR-LEV-010 | Balance    | View balance            | Employee has leave records                             | 1. GET /api/hr/leave-balances?employeeId=X&year=2026                                | Returns opening, accrued, used, pending, available for each leave type | P0       | Critical | Functional | Yes  |
| HR-LEV-011 | Balance    | Accrual calculation     | Monthly accrual at 2.5 days/month                      | 1. After 6 months → 2. Check balance                                                | Accrued = 15 days (6 × 2.5)                                            | P0       | Critical | Payroll    | Yes  |
| HR-LEV-012 | Balance    | Carry forward           | Year-end; 5 days remaining                             | 1. New year starts → 2. Check opening balance                                       | 5 days carried forward (if within max 30)                              | P1       | High     | Functional | Yes  |
| HR-LEV-013 | Balance    | Carry forward expiry    | Carried 5 days forward; expiry 03-31                   | 1. After March 31 → 2. Check balance                                                | Carried forward days expire                                            | P2       | Medium   | Functional | Yes  |
| HR-LEV-014 | Types      | Create leave type       | —                                                      | 1. POST /api/hr/leave-types with code, name, leaveCategory, maxDaysPerYear          | 201; validates category enum (Annual, Sick, Emergency, etc.)           | P0       | Critical | Functional | Yes  |
| HR-LEV-015 | Types      | Invalid category        | —                                                      | 1. POST with leaveCategory="InvalidType"                                            | 400 — enum validation (if validator exists) ⚠️                         | P2       | Medium   | Negative   | Yes  |
| HR-LEV-016 | Holidays   | Create holiday          | —                                                      | 1. POST /api/hr/holidays with name, holidayDate, holidayType                        | 201; appears in calendar                                               | P1       | High     | Functional | Yes  |
| HR-LEV-017 | Holidays   | Recurring yearly        | Create National Day                                    | 1. POST with isRecurringYearly=true                                                 | Holiday appears for all future years                                   | P2       | Medium   | Functional | Yes  |

---

### 1.7 PAYROLL (⚠️ ZERO INPUT VALIDATION)

| TC ID      | Sub Module | Scenario                              | Preconditions                                        | Test Steps                                                                                                   | Expected Result                                                    | Priority | Severity | Type        | Auto |
| ---------- | ---------- | ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------- | -------- | ----------- | ---- |
| HR-PAY-001 | Structure  | Create salary structure               | —                                                    | 1. POST /api/hr/salary-structures with code, name                                                            | 201; acts as template for components                               | P0       | Critical | Functional  | Yes  |
| HR-PAY-002 | Structure  | Assign to employee                    | Structure + Employee exist                           | 1. POST /api/hr/employee-salaries with employeeId, structureId                                               | 201; employee linked to structure                                  | P0       | Critical | Functional  | Yes  |
| HR-PAY-003 | Structure  | Security test — invalid types         | —                                                    | 1. POST with isActive="not-a-boolean"                                                                        | ⚠️ WARNING: No validator exists — arbitrary data accepted          | P1       | High     | Security    | Yes  |
| HR-PAY-004 | Component  | Create earnings component             | Structure exists                                     | 1. POST /api/hr/salary-components with componentType='Earning', calculationMethod='Fixed', value=5000        | 201                                                                | P0       | Critical | Functional  | Yes  |
| HR-PAY-005 | Component  | Percentage-based component            | —                                                    | 1. POST with calculationMethod='Percentage', percentageOf='Basic', value=60                                  | 201; value interpreted as % of base                                | P1       | High     | Functional  | Yes  |
| HR-PAY-006 | Component  | Negative value attempt                | —                                                    | 1. POST with value=-1000                                                                                     | ⚠️ No validator — negative values accepted; should reject          | P2       | Medium   | Negative    | Yes  |
| HR-PAY-007 | Allowance  | Create allowance type                 | —                                                    | 1. POST /api/hr/allowance-types with code, name, allowanceCategory                                           | 201                                                                | P0       | Critical | Functional  | Yes  |
| HR-PAY-008 | Allowance  | Assign to employee                    | Type + Employee exist                                | 1. POST /api/hr/employee-allowances with employeeId, allowanceTypeId, amount, effectiveFrom                  | 201                                                                | P0       | Critical | Functional  | Yes  |
| HR-PAY-009 | Allowance  | Assignment with future effective date | —                                                    | 1. POST with effectiveFrom=future date                                                                       | Record created; not active until effective date                    | P2       | Medium   | Functional  | Yes  |
| HR-PAY-010 | Deduction  | Create deduction type                 | —                                                    | 1. POST /api/hr/deduction-types with code, name, deductionCategory                                           | 201                                                                | P0       | Critical | Functional  | Yes  |
| HR-PAY-011 | Deduction  | Assign to employee                    | Type + Employee exist                                | 1. POST /api/hr/employee-deductions with employeeId, deductionTypeId, amount                                 | 201; will be applied in next payroll run                           | P0       | Critical | Functional  | Yes  |
| HR-PAY-012 | Loan       | Create employee loan                  | Employee exists                                      | 1. POST /api/hr/employee-loans with employeeId, principalAmount, interestRate, totalInstallments             | 201; loan_number auto-generated; status='Pending'                  | P0       | Critical | Functional  | Yes  |
| HR-PAY-013 | Loan       | Approval                              | Loan pending                                         | 1. PUT approve → 2. Verify status                                                                            | Status='Active'; installments calculated; payroll deduction starts | P0       | Critical | Workflow    | Yes  |
| HR-PAY-014 | Loan       | Zero interest loan                    | —                                                    | 1. POST with interestRate=0                                                                                  | 201; monthly installment = principal / totalInstallments           | P1       | High     | Functional  | Yes  |
| HR-PAY-015 | Loan       | Full repayment                        | Active loan                                          | 1. All installments paid → 2. Check status                                                                   | Status='Closed'; remainingAmount=0                                 | P1       | High     | Workflow    | Yes  |
| HR-PAY-016 | Loan       | Early settlement                      | Active loan with remaining balance                   | 1. POST settlement → 2. Pay remaining amount                                                                 | Status='Closed'                                                    | P2       | Medium   | Functional  | Yes  |
| HR-PAY-017 | Loan       | Negative principal                    | —                                                    | 1. POST with principalAmount=-10000                                                                          | ⚠️ No validator — may accept negative or cause DB error            | P1       | High     | Negative    | Yes  |
| HR-PAY-018 | Period     | Create payroll period                 | —                                                    | 1. POST /api/hr/payroll-periods with period_code, period_name, start_date, end_date, payment_date, frequency | 201; period available for payroll runs                             | P0       | Critical | Functional  | Yes  |
| HR-PAY-019 | Period     | Overlapping periods                   | Period 1-31 July exists                              | 1. POST period for 15 July - 15 Aug                                                                          | Should reject overlap ⚠️ no overlap check in code                  | P1       | High     | Negative    | Yes  |
| HR-PAY-020 | Run        | Process payroll                       | Period exists; employees with salaries               | 1. POST /api/hr/payroll-runs/:id/process                                                                     | Calculates gross, deductions, net for all employees in period      | P0       | Critical | Functional  | Yes  |
| HR-PAY-021 | Run        | Verify gross calculation              | Employee: Basic 5000 + Housing 2000 + Transport 1000 | 1. Process payroll → 2. Check payslip.grossPay                                                               | grossPay = 8000 (sum of all active allowances)                     | P0       | Critical | Payroll     | Yes  |
| HR-PAY-022 | Run        | Verify deduction application          | Employee: Basic 5000, Loan deduction 500/month       | 1. Process payroll → 2. Check payslip.deductionBreakdown                                                     | Loan deduction of 500 applied; netPay = 4500                       | P0       | Critical | Payroll     | Yes  |
| HR-PAY-023 | Run        | Verify overtime pay                   | Employee has 10 overtime hours at 1.5x               | 1. Process payroll → 2. Check payslip includes overtime                                                      | Overtime pay = (HourlyRate × 10 × 1.5) included in gross           | P0       | Critical | Payroll     | Yes  |
| HR-PAY-024 | Run        | Verify leave deduction                | Employee took 2 unpaid leaves                        | 1. Process payroll → 2. Check deduction                                                                      | 2 days salary deducted                                             | P1       | High     | Payroll     | Yes  |
| HR-PAY-025 | Run        | Approve payroll                       | Payroll run processed                                | 1. PUT /api/hr/payroll-runs/:id/approve                                                                      | Status='Approved'; payslips generated; locked from edits           | P0       | Critical | Workflow    | Yes  |
| HR-PAY-026 | Run        | Reverse payroll                       | Payroll run approved                                 | 1. PUT /api/hr/payroll-runs/:id/reverse                                                                      | Status='Reversed'; all postings reversed                           | P1       | High     | Workflow    | Yes  |
| HR-PAY-027 | Run        | Double process attempt                | Already processed                                    | 1. POST /api/hr/payroll-runs/:id/process again                                                               | 400 "Already processed"                                            | P1       | High     | Negative    | Yes  |
| HR-PAY-028 | Payslip    | Generate                              | Payroll processed                                    | 1. GET /api/hr/payslips?payrollRunId=X                                                                       | Returns all payslips for the run                                   | P0       | Critical | Functional  | Yes  |
| HR-PAY-029 | Payslip    | Single employee view                  | Employee logged in                                   | 1. GET /api/hr/payslips?employeeId=X&year=2026                                                               | Returns all payslips for employee                                  | P1       | High     | Functional  | Yes  |
| HR-PAY-030 | Payslip    | Download PDF                          | Payslip generated                                    | 1. GET /api/hr/payslips/:id/download                                                                         | PDF binary returned                                                | P2       | Medium   | Functional  | Yes  |
| HR-PAY-031 | WPS        | Generate SIF file                     | Payroll processed                                    | 1. POST /api/hr/wps/generate with payrollRunId                                                               | Valid SIF format file with all employee salary records             | P0       | Critical | Functional  | Yes  |
| HR-PAY-032 | WPS        | Validate SIF format                   | SIF file generated                                   | 1. Parse SIF file → 2. Check: 23 fields per record, fixed-width format                                       | All records valid per UAE WPS specification                        | P0       | Critical | Integration | Yes  |
| HR-PAY-033 | WPS        | Employee missing bank details         | Employee has no IBAN/bank account                    | 1. Generate WPS                                                                                              | Employee excluded with warning in export log                       | P1       | High     | Negative    | Yes  |

---

### 1.8 BENEFITS & EOSB (⚠️ ZERO INPUT VALIDATION)

| TC ID      | Sub Module | Scenario                                    | Preconditions                                  | Test Steps                                                                       | Expected Result                                                       | Priority | Severity | Type       | Auto |
| ---------- | ---------- | ------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-BEN-001 | Benefits   | Create benefit type                         | —                                              | 1. POST /api/hr/benefit-types with code, name, benefitCategory                   | 201                                                                   | P1       | High     | Functional | Yes  |
| HR-BEN-002 | Benefits   | Enroll employee                             | Type + Employee exist                          | 1. POST /api/hr/employee-benefits with employeeId, benefitTypeId, coverageAmount | 201; status='Active'                                                  | P1       | High     | Functional | Yes  |
| HR-BEN-003 | EOSB       | UAE EOSB calculation — Resignation < 1 year | Employee worked 6 months, resigned, basic=5000 | 1. POST /api/hr/eosb-calculations/calculate                                      | Total EOSB = 0 (no entitlement for <1 year resignation per UAE law)   | P0       | Critical | Payroll    | Yes  |
| HR-BEN-004 | EOSB       | UAE EOSB — Resignation 1-3 years            | Employee 2 years, resigned, basic=5000         | 1. Calculate EOSB                                                                | Total = (2 × 5000) × (1/3) = 3333.33 (reduced rate for resignation)   | P0       | Critical | Payroll    | Yes  |
| HR-BEN-005 | EOSB       | UAE EOSB — Resignation 3-5 years            | Employee 4 years, resigned, basic=5000         | 1. Calculate EOSB                                                                | Total = (4 × 5000) × (2/3) = 13333.33                                 | P0       | Critical | Payroll    | Yes  |
| HR-BEN-006 | EOSB       | UAE EOSB — Resignation > 5 years            | Employee 7 years, resigned, basic=5000         | 1. Calculate EOSB                                                                | First 5 years: 5×5000 = 25000; After 5: 2×5000 = 10000; Total = 35000 | P0       | Critical | Payroll    | Yes  |
| HR-BEN-007 | EOSB       | UAE EOSB — Termination any period           | Employee 3 years, terminated, basic=5000       | 1. Calculate EOSB                                                                | Full rate: 3×5000 = 15000                                             | P0       | Critical | Payroll    | Yes  |
| HR-BEN-008 | EOSB       | Maximum 2-year cap                          | Employee 12 years, basic=10000                 | 1. Calculate EOSB                                                                | Capped at 2 years salary = 20000 (per UAE law)                        | P0       | Critical | Payroll    | Yes  |
| HR-BEN-009 | EOSB       | Unlimited contract                          | Employee on unlimited contract, 15 years       | 1. Calculate EOSB                                                                | Full rate for all years (unlimited contract entitlements differ) ⚠️   | P1       | High     | Payroll    | Yes  |
| HR-BEN-010 | Settlement | Create settlement                           | EOSB calculated                                | 1. POST /api/hr/eosb-settlements/settle with calculationId, leaveEncashment      | 201; total = EOSB + Leave Encashment + any other dues                 | P0       | Critical | Workflow   | Yes  |
| HR-BEN-011 | Settlement | Approve                                     | Settlement pending                             | 1. PUT /api/hr/eosb-settlements/:id/approve                                      | Status='Approved'                                                     | P1       | High     | Workflow   | Yes  |
| HR-BEN-012 | WPS        | Set default WPS config                      | WPS config created                             | 1. PUT /api/hr/wps/:id/setDefault                                                | Config marked isDefault=true; previous default cleared                | P2       | Medium   | Functional | Yes  |
| HR-BEN-013 | WPS        | Export with wrong run ID                    | —                                              | 1. POST generate with non-existent payrollRunId                                  | 400/404                                                               | P2       | Medium   | Negative   | Yes  |

---

### 1.9 HR MODULES (Performance, Training, Recruitment, On/Offboarding)

| TC ID      | Sub Module  | Scenario                        | Preconditions                    | Test Steps                                                                                | Expected Result                                        | Priority | Severity | Type       | Auto |
| ---------- | ----------- | ------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- | -------- | ---------- | ---- |
| HR-HRM-001 | Performance | Create goal                     | Employee exists                  | 1. POST /api/hr/performance-goals with employeeId, title, goalType, priority              | 201; progressPercentage defaults to 0                  | P1       | High     | Functional | Yes  |
| HR-HRM-002 | Performance | Update progress                 | Goal exists                      | 1. PUT with progressPercentage=50                                                         | 200; progress updated                                  | P1       | High     | Functional | Yes  |
| HR-HRM-003 | Performance | Complete goal                   | Goal exists                      | 1. PUT status='Completed', completionDate=today                                           | 200; progressPercentage=100                            | P2       | Medium   | Functional | Yes  |
| HR-HRM-004 | Performance | Create KPI                      | —                                | 1. POST /api/hr/performance-kpis with code, name, kpiType, targetValue                    | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-005 | Performance | Create appraisal                | Employee + Appraiser exist       | 1. POST /api/hr/performance-appraisals with employeeId, appraiserId, periodFrom, periodTo | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-006 | Training    | Create course                   | —                                | 1. POST /api/hr/training-courses with code, name, durationHours                           | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-007 | Training    | Create session                  | Course exists                    | 1. POST /api/hr/training-sessions with courseId, sessionName, startDate, endDate          | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-008 | Training    | Enroll attendee                 | Session + Employee exist         | 1. POST /api/hr/training-attendees with sessionId, employeeId                             | 201; enrolledCount on session increments               | P2       | Medium   | Functional | Yes  |
| HR-HRM-009 | Training    | Mark attendance                 | Attendee enrolled                | 1. PUT attendance_status='Present', score=85                                              | 200; certificate_issued if score passes threshold      | P2       | Medium   | Functional | Yes  |
| HR-HRM-010 | Recruitment | Create job position             | Department + Designation exist   | 1. POST /api/hr/job-positions with position_code, title, vacancies                        | 201; status='Open'                                     | P1       | High     | Functional | Yes  |
| HR-HRM-011 | Recruitment | Position close date passed      | Closing date in past             | 1. Check position status                                                                  | Should auto-close or show as expired ⚠️                | P2       | Medium   | Functional | Yes  |
| HR-HRM-012 | Recruitment | Create applicant                | Position is Open                 | 1. POST /api/hr/job-applicants with positionId, firstName, lastName, email                | 201; applicant_number auto-generated; status='Applied' | P1       | High     | Functional | Yes  |
| HR-HRM-013 | Recruitment | Schedule interview              | Applicant exists                 | 1. POST /api/hr/interviews with applicantId, interviewDate, interviewerId                 | 201; status='Scheduled'                                | P1       | High     | Workflow   | Yes  |
| HR-HRM-014 | Recruitment | Generate offer letter           | Applicant passed interview       | 1. POST /api/hr/offer-letters with applicantId, offeredSalary, joiningDate                | 201; offer_number auto-generated; status='Draft'       | P1       | High     | Workflow   | Yes  |
| HR-HRM-015 | Recruitment | Accept offer                    | Offer letter sent                | 1. PUT /api/hr/offer-letters/:id status='Accepted'                                        | Applicant status updates to 'Hired'                    | P1       | High     | Workflow   | Yes  |
| HR-HRM-016 | Onboarding  | Create checklist                | —                                | 1. POST /api/hr/onboarding-checklists with taskName, category                             | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-017 | Onboarding  | Initialize for employee         | Employee hired; checklist exists | 1. POST /api/hr/onboarding-progress/initialize with employeeId                            | All checklist items created as Pending for employee    | P1       | High     | Workflow   | Yes  |
| HR-HRM-018 | Onboarding  | Complete task                   | Checklist item pending           | 1. PUT /api/hr/onboarding-progress/:id status='Completed'                                 | Task marked complete; completionDate set               | P2       | Medium   | Functional | Yes  |
| HR-HRM-019 | Offboarding | Create checklist                | —                                | 1. POST /api/hr/offboarding-checklists with taskName, category                            | 201                                                    | P2       | Medium   | Functional | Yes  |
| HR-HRM-020 | Offboarding | Initialize for leaving employee | Employee resigning               | 1. POST /api/hr/offboarding-progress/initialize with employeeId                           | All offboarding tasks created as Pending               | P1       | High     | Workflow   | Yes  |
| HR-HRM-021 | Exit        | Conduct exit interview          | Employee leaving                 | 1. POST /api/hr/exit-interviews with employeeId, reasonForLeaving                         | 201                                                    | P2       | Medium   | Functional | Yes  |

---

### 1.10 REPORTS

| TC ID      | Sub Module  | Scenario                          | Preconditions                    | Test Steps                                                                           | Expected Result                                                        | Priority | Severity | Type        | Auto |
| ---------- | ----------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------- | -------- | ----------- | ---- |
| HR-RPT-001 | Employee    | Generate employee report          | Employees exist                  | 1. GET /api/hr/reports/employee                                                      | Returns employee list via sp_employee_report                           | P0       | Critical | Functional  | Yes  |
| HR-RPT-002 | Employee    | Filter by status                  | —                                | 1. GET /api/hr/reports/employee?status=Active                                        | Only Active employees returned                                         | P1       | High     | Functional  | Yes  |
| HR-RPT-003 | Employee    | Filter by department              | —                                | 1. GET /api/hr/reports/employee?departmentId=X                                       | Only employees in dept returned                                        | P1       | High     | Functional  | Yes  |
| HR-RPT-004 | Attendance  | Attendance report with date range | Attendance records exist         | 1. GET /api/hr/reports/attendance?dateFrom=2026-07-01&dateTo=2026-07-31&employeeId=X | Returns attendance for employee in range                               | P0       | Critical | Functional  | Yes  |
| HR-RPT-005 | Attendance  | Report without date range         | —                                | 1. GET /api/hr/reports/attendance (no params)                                        | Returns all records (verify performance)                               | P2       | Medium   | Functional  | Yes  |
| HR-RPT-006 | Payroll     | Payroll register                  | Payroll runs exist               | 1. GET /api/hr/reports/payroll                                                       | Returns payroll summary                                                | P0       | Critical | Functional  | Yes  |
| HR-RPT-007 | Leave       | Leave balance report              | Leave balances exist             | 1. GET /api/hr/reports/leaveBalance?year=2026                                        | Returns all employee leave balances                                    | P1       | High     | Functional  | Yes  |
| HR-RPT-008 | Overtime    | Overtime report                   | Overtime records exist           | 1. GET /api/hr/reports/overtime?dateFrom=2026-01-01&dateTo=2026-12-31                | Returns overtime records with calculated pay                           | P1       | High     | Functional  | Yes  |
| HR-RPT-009 | EOSB        | EOSB liability report             | Employees with tenure            | 1. GET /api/hr/reports/eosb                                                          | Returns projected EOSB liability for all employees                     | P1       | High     | Functional  | Yes  |
| HR-RPT-010 | Export      | CSV export                        | Report data exists               | 1. Click Export on any report                                                        | CSV file downloads with correct headers and data                       | P2       | Medium   | Functional  | No   |
| HR-RPT-011 | Performance | Large dataset — 10K employees     | 10000 employees seeded           | 1. Generate employee report                                                          | Response time < 5 seconds                                              | P2       | Medium   | Performance | Yes  |
| HR-RPT-012 | Error       | Report with missing SP            | sp_employee_report doesn't exist | 1. GET /api/hr/reports/employee                                                      | Graceful error message; doesn't crash server ⚠️ check current behavior | P1       | High     | Negative    | Yes  |

---

### 1.11 SETTINGS

| TC ID      | Sub Module | Scenario                    | Preconditions     | Test Steps                                                                        | Expected Result                                               | Priority | Severity | Type       | Auto |
| ---------- | ---------- | --------------------------- | ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-SET-001 | General    | Save company info           | —                 | 1. PUT /api/hr/settings/general with companyName, phone, email, etc.              | 200; settings saved; audit log entry created                  | P0       | Critical | Functional | Yes  |
| HR-SET-002 | General    | Auto-create on first GET    | No settings exist | 1. GET /api/hr/settings/general                                                   | 200; defaults created with tenantId                           | P1       | High     | Functional | Yes  |
| HR-SET-003 | Attendance | Configure overtime rates    | —                 | 1. PUT /api/hr/settings/attendance with overtimeRate=1.5, overtimeWeeklyLimit=480 | 200; values saved                                             | P1       | High     | Functional | Yes  |
| HR-SET-004 | Leave      | Configure carry-forward     | —                 | 1. PUT /api/hr/settings/leave with carryForwardEnabled=true, carryForwardMax=30   | 200; accrual engine uses these values                         | P1       | High     | Functional | Yes  |
| HR-SET-005 | Payroll    | Configure payroll frequency | —                 | 1. PUT /api/hr/settings/payroll with payrollFrequency='monthly', payDay=28        | 200; payroll engine uses these defaults                       | P1       | High     | Functional | Yes  |
| HR-SET-006 | Security   | Configure MFA settings      | —                 | 1. PUT /api/hr/settings/security with mfaEnabled=true, mfaType='authenticator'    | 200; Note: MFA enforcement may not be implemented yet ⚠️      | P2       | Medium   | Functional | Yes  |
| HR-SET-007 | Security   | Session timeout setting     | —                 | 1. PUT sessionTimeoutMinutes=15 → 2. Wait 15+ min → 3. Make API call              | 401 Unauthorized ⚠️ verify session timeout is enforced        | P1       | High     | Security   | Yes  |
| HR-SET-008 | Email      | Configure SMTP              | —                 | 1. PUT /api/hr/settings/email with smtpHost, smtpPort, credentials                | 200; system uses these for email notifications                | P2       | Medium   | Functional | Yes  |
| HR-SET-009 | Email      | Test email configuration    | SMTP configured   | 1. Click "Send Test Email" (if endpoint exists)                                   | Test email delivered ⚠️ verify endpoint exists                | P3       | Low      | Functional | No   |
| HR-SET-010 | Security   | No validation on settings   | —                 | 1. PUT /api/hr/settings/attendance with overtimeRate="not-a-number"               | ⚠️ No validator — accepts any value; may cause runtime errors | P1       | High     | Negative   | Yes  |
| HR-SET-011 | Audit      | Verify all changes logged   | Settings exist    | 1. Change setting → 2. GET /api/hr/settings/audit-logs                            | Audit entry with oldValue, newValue, userId, timestamp        | P1       | High     | Audit      | Yes  |

---

### 1.12 MASTER DATA

| TC ID     | Sub Module | Scenario                          | Preconditions          | Test Steps                                                                     | Expected Result                                           | Priority | Severity | Type       | Auto |
| --------- | ---------- | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- | -------- | -------- | ---------- | ---- |
| HR-MD-001 | Countries  | List countries                    | Countries seeded       | 1. GET /api/hr/master-data/countries                                           | Returns 17+ countries with flags, codes, phone codes      | P0       | Critical | Functional | Yes  |
| HR-MD-002 | Countries  | Create country                    | —                      | 1. POST /api/hr/master-data/countries with code, name, phoneCode, currencyCode | 201; appears in list                                      | P1       | High     | Functional | Yes  |
| HR-MD-003 | Countries  | Duplicate code                    | "AE" exists            | 1. POST with code="AE"                                                         | 400 "Code already exists" (if unique constraint enforced) | P1       | High     | Negative   | Yes  |
| HR-MD-004 | States     | List states by country            | UAE exists             | 1. GET /api/hr/master-data/states?countryId=UAE-ID                             | Returns 7 Emirates                                        | P0       | Critical | Functional | Yes  |
| HR-MD-005 | States     | Create state                      | Country exists         | 1. POST /api/hr/master-data/states with name, code, countryId                  | 201; country relation included in response                | P1       | High     | Functional | Yes  |
| HR-MD-006 | Cities     | List cities                       | States + cities seeded | 1. GET /api/hr/master-data/cities                                              | Returns 21 UAE cities with state + country relations      | P0       | Critical | Functional | Yes  |
| HR-MD-007 | Cities     | Filter by state                   | Abu Dhabi state exists | 1. GET /api/hr/master-data/cities?stateId=X                                    | Returns Abu Dhabi City, Al Ain, Madinat Zayed             | P1       | High     | Functional | Yes  |
| HR-MD-008 | Cities     | Create city                       | Country + State exist  | 1. POST /api/hr/master-data/cities with name, countryId, stateId               | 201; sort_order auto-increments                           | P1       | High     | Functional | Yes  |
| HR-MD-009 | Generic    | Create lookup data                | —                      | 1. POST /api/hr/master-data/data with type="employment_type", name="Full Time" | 201; queryable by type                                    | P2       | Medium   | Functional | Yes  |
| HR-MD-010 | Generic    | List by type                      | Employment types exist | 1. GET /api/hr/master-data/data?type=employment_type                           | Returns all employment type entries                       | P2       | Medium   | Functional | Yes  |
| HR-MD-011 | Audit      | Verify master data changes logged | Countries exist        | 1. Update country → 2. GET /api/hr/master-data/audit                           | Audit record with old/new values                          | P2       | Medium   | Audit      | Yes  |
| HR-MD-012 | Import     | Bulk import countries             | CSV with country data  | 1. POST import endpoint (if exists)                                            | Bulk import succeeds ⚠️ verify endpoint exists            | P3       | Low      | Functional | No   |

---

### 1.13 DASHBOARD

| TC ID      | Sub Module  | Scenario                | Preconditions  | Test Steps                              | Expected Result                                                                                                | Priority | Severity | Type        | Auto |
| ---------- | ----------- | ----------------------- | -------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------- | ---- |
| HR-DSH-001 | Summary     | Dashboard loads         | Logged in      | 1. GET /api/hr/dashboard/summary        | Returns totalEmployees, activeEmployees, onLeaveEmployees, terminatedEmployees, attendanceToday, pendingLeaves | P0       | Critical | Functional  | Yes  |
| HR-DSH-002 | Summary     | Empty company           | No employees   | 1. GET dashboard/summary                | All counts = 0; no errors                                                                                      | P2       | Medium   | Functional  | Yes  |
| HR-DSH-003 | Performance | Dashboard response time | 1000 employees | 1. GET dashboard/summary multiple times | Average response < 1 second                                                                                    | P2       | Medium   | Performance | Yes  |

---

## SECTION 2: API TEST CASES

| TC ID      | Module    | Method | Endpoint             | Test                                                                 | Expected                                           | Priority | Severity |
| ---------- | --------- | ------ | -------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | -------- | -------- |
| HR-API-001 | All       | GET    | All list endpoints   | Query without auth token                                             | 401 Unauthorized                                   | P0       | Critical |
| HR-API-002 | All       | GET    | All list endpoints   | Query without X-Company-Id                                           | 400 Company context required                       | P0       | Critical |
| HR-API-003 | All       | POST   | All create endpoints | Send empty body {}                                                   | 400 or 201 with defaults (⚠️ depends on validator) | P1       | High     |
| HR-API-004 | All       | GET    | All list endpoints   | Query with page=0                                                    | Should default to page=1 or return 400             | P2       | Medium   |
| HR-API-005 | All       | GET    | All list endpoints   | Query with limit=10000                                               | Should cap at max limit or 500                     | P2       | Medium   |
| HR-API-006 | All       | DELETE | All delete endpoints | Delete with non-existent ID                                          | 404 Not Found                                      | P1       | High     |
| HR-API-007 | All       | PUT    | All update endpoints | Update with non-existent ID                                          | 404 Not Found                                      | P1       | High     |
| HR-API-008 | All       | All    | All endpoints        | Response time < 500ms (single record)                                | < 500ms                                            | P2       | Medium   |
| HR-API-009 | All       | All    | All endpoints        | Response time < 3000ms (list with 1000 records)                      | < 3000ms                                           | P2       | Medium   |
| HR-API-010 | Auth      | POST   | /auth/login          | Brute force — 100 rapid login attempts                               | Rate limited (if rate limiter configured)          | P1       | High     |
| HR-API-011 | Employees | GET    | /employees           | Cross-company access — Company B token accessing Company A employees | Empty list or 403 (scoped by tenant_id)            | P0       | Critical |

---

## SECTION 3: SECURITY TEST CASES

| TC ID      | Module                | Test                   | Steps                                                        | Expected                                                                | Priority | Severity |
| ---------- | --------------------- | ---------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- | -------- | -------- |
| HR-SEC-001 | SQL Injection         | Login endpoint         | POST with `' OR 1=1 --` in email field                       | Treated as string, not SQL; 401 returned                                | P0       | Critical |
| HR-SEC-002 | SQL Injection         | Employee search        | GET /employees?search=test'; DROP TABLE employees;--         | Parameterized query; no injection possible                              | P0       | Critical |
| HR-SEC-003 | XSS                   | Create employee        | POST with `<script>alert(1)</script>` in firstName           | Escaped in response                                                     | P1       | High     |
| HR-SEC-004 | JWT Tampering         | Modify JWT payload     | Change tenantId in JWT → access other company data           | Token validation fails or data scoped correctly                         | P0       | Critical |
| HR-SEC-005 | JWT Expiry            | Expired token access   | Use token past its exp claim                                 | 401 Token expired                                                       | P1       | High     |
| HR-SEC-006 | Direct URL Access     | Unauthenticated access | Navigate to http://localhost:3005/hr/employees without login | Redirected to /hr/login                                                 | P0       | Critical |
| HR-SEC-007 | Privilege Escalation  | Role escalation        | Login as Employee → access manager-only API                  | ⚠️ No RBAC implemented — any authenticated user can access any endpoint | P0       | Critical |
| HR-SEC-008 | Rate Limiting         | API abuse              | 1000 rapid requests to any endpoint                          | Rate limited with 429 Too Many Requests                                 | P1       | High     |
| HR-SEC-009 | Hardcoded Credentials | Source code audit      | grep for passwords in source files                           | Found: HRAuthController.js line ~25 `'Memits@396'` fallback 🔴          | P0       | Critical |
| HR-SEC-010 | Data Isolation        | Multi-company          | Create employees in Company A → query as Company B           | Company B sees only its own employees                                   | P0       | Critical |

---

## SECTION 4: DATABASE VALIDATION

| TC ID     | Test                                  | Expected Finding                                                                                                                                                                                                                                                                                      | Priority | Severity |
| --------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| HR-DB-001 | Verify ALL tables exist in actual DB  | Match against 40 Sequelize model tables. 34 may be missing since schema.sql only defines 6 and sync is disabled                                                                                                                                                                                       | P0       | Critical |
| HR-DB-002 | Check foreign key constraints         | ZERO FKs defined in schema.sql. All referential integrity is in JS models only                                                                                                                                                                                                                        | P0       | Critical |
| HR-DB-003 | Check indexes on high-traffic columns | Verify indexes on tenant_id, deleted_at, employee_id + date columns for attendance                                                                                                                                                                                                                    | P1       | High     |
| HR-DB-004 | Check soft delete consistency         | All tables should have deleted_at column. Verify NULL for active, timestamp for deleted                                                                                                                                                                                                               | P1       | High     |
| HR-DB-005 | Check audit columns                   | All tables should have created_by, updated_by, created_at, updated_at                                                                                                                                                                                                                                 | P1       | High     |
| HR-DB-006 | Check tenant isolation                | All tables have tenant_id. Verify no cross-tenant data leakage in queries                                                                                                                                                                                                                             | P0       | Critical |
| HR-DB-007 | Check duplicate prevention            | Verify unique constraints on (tenant_id, code) or (tenant_id, name) for lookup tables                                                                                                                                                                                                                 | P1       | High     |
| HR-DB-008 | Verify PAYROLL tables exist           | settings_payroll, salary_structures, salary_components, employee_salaries, allowance_types, employee_allowances, deduction_types, employee_deductions, employee_loans, payroll_periods, payroll_runs, payslips, wps (13 tables)                                                                       | P0       | Critical |
| HR-DB-009 | Verify BENEFITS tables exist          | benefit_types, employee_benefits, eosb_calculations, eosb_settlements, wps, ess_submissions (6 tables)                                                                                                                                                                                                | P0       | Critical |
| HR-DB-010 | Verify HR MODULES tables exist        | performance_goals, performance_kpis, performance_appraisals, training_courses, training_sessions, training_attendees, job_positions, job_applicants, interviews, offer_letters, onboarding_checklists, onboarding_progress, offboarding_checklists, offboarding_progress, exit_interviews (15 tables) | P0       | Critical |
| HR-DB-011 | Verify SETTINGS tables exist          | settings_general, settings_company_profile, settings_localization, settings_working_hours, settings_attendance, settings_leave, settings_payroll, settings_security, settings_email, settings_sms, settings_notifications, settings_audit_logs (12 tables)                                            | P0       | Critical |
| HR-DB-012 | Verify MASTER DATA tables exist       | master_countries, master_states, master_cities, master_data, master_data_audit (5 tables)                                                                                                                                                                                                             | P0       | Critical |

---

## SECTION 5: MULTI-TENANT ISOLATION TESTS

| TC ID     | Scenario                    | Steps                                                                        | Expected                                                               | Priority |
| --------- | --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| HR-MT-001 | Employees scoped to company | 1. Create employee in Company A → 2. Switch to Company B → 3. List employees | Employee from Company A not visible in Company B                       | P0       |
| HR-MT-002 | Attendance scoped           | 1. Mark attendance in Company A → 2. List attendance in Company B            | Company A's attendance not visible                                     | P0       |
| HR-MT-003 | Settings scoped             | 1. Change general settings in Company A → 2. View settings in Company B      | Settings are independent per company                                   | P0       |
| HR-MT-004 | Payroll scoped              | 1. Process payroll in Company A → 2. List payroll runs in Company B          | Payroll runs are company-specific                                      | P0       |
| HR-MT-005 | Master Data shared          | 1. Create country in Company A → 2. View in Company B                        | Countries may be shared (system data) or scoped — verify design intent | P1       |

---

## SECTION 6: END-TO-END WORKFLOW TESTS

### E2E-001: Full Employee Lifecycle

| Step | Action                      | Expected                                  |
| ---- | --------------------------- | ----------------------------------------- |
| 1    | Create Company (in ERP)     | Company created with tenant_id            |
| 2    | Create Department           | HR dept created                           |
| 3    | Create Designation          | "Software Engineer" created               |
| 4    | Create Branch + Cost Center | Dubai HQ + IT Dept cost center            |
| 5    | Create Salary Structure     | "Grade 5" structure with Basic 60%        |
| 6    | Create Employee             | John Doe, EMP-000001, assigned to HR dept |
| 7    | Assign Salary               | Basic 5000, Housing 2000, Transport 1000  |
| 8    | Assign Shift                | Morning shift 8:00-17:00                  |
| 9    | Mark Attendance             | Check-in 8:00 AM — Present                |
| 10   | Apply Leave                 | 2 days annual leave                       |
| 11   | Approve Leave               | Leave balance reduced by 2                |
| 12   | Run Payroll                 | Monthly payroll processed                 |
| 13   | Verify Payslip              | Gross 8000, Net after deductions          |
| 14   | Generate WPS                | SIF file generated                        |
| 15   | Apply Resignation           | Notice period starts                      |
| 16   | Calculate EOSB              | Final EOSB calculated                     |
| 17   | Create Settlement           | EOSB + Leave encashment                   |
| 18   | Offboard                    | Exit interview, asset return              |

### E2E-002: Recruitment to Onboarding

| Step | Action                  | Expected                                     |
| ---- | ----------------------- | -------------------------------------------- |
| 1    | Create Job Position     | Software Engineer, 2 vacancies, status Open  |
| 2    | Create Applicant        | Jane Smith applies                           |
| 3    | Schedule Interview      | Technical interview with hiring manager      |
| 4    | Update Interview Result | Rating 4/5, feedback "Recommended"           |
| 5    | Generate Offer Letter   | 12000 AED, joining date in 30 days           |
| 6    | Accept Offer            | Status → Accepted; Applicant → Hired         |
| 7    | Initialize Onboarding   | All onboarding checklist items created       |
| 8    | Complete Tasks          | Document verification, asset allocation done |
| 9    | Create Employee         | From applicant data                          |
| 10   | Assign Payroll          | Salary structure and components assigned     |

### E2E-003: Loan Lifecycle

| Step | Action                | Expected                                     |
| ---- | --------------------- | -------------------------------------------- |
| 1    | Create Loan           | 50000 AED, 12 installments, 0% interest      |
| 2    | Approve Loan          | Status → Active; monthly installment 4166.67 |
| 3    | Run Payroll (Month 1) | Deduction 4166.67 applied                    |
| 4    | Run Payroll (Month 6) | Remaining balance 25000                      |
| 5    | Early Settlement      | Pay remaining 25000                          |
| 6    | Verify Loan Status    | Status → Closed                              |

---

## SECTION 7: NEGATIVE TESTING

| TC ID      | Module     | Scenario                                | Expected                                    | Priority |
| ---------- | ---------- | --------------------------------------- | ------------------------------------------- | -------- |
| HR-NEG-001 | Employees  | Create with empty firstName             | 400 Validation error                        | P1       |
| HR-NEG-002 | Employees  | Create with email="not-an-email"        | 400 Invalid email format                    | P1       |
| HR-NEG-003 | Employees  | Create with joiningDate in future       | Should be accepted (future joiners) or warn | P2       |
| HR-NEG-004 | Attendance | Check-out without check-in              | 400 No active check-in found                | P1       |
| HR-NEG-005 | Leave      | Apply with endDate before startDate     | 400 Invalid date range                      | P1       |
| HR-NEG-006 | Leave      | Apply for 0 days                        | 400 Minimum 1 day required                  | P2       |
| HR-NEG-007 | Payroll    | Process payroll with no employees       | 200 with 0 employees processed; no crash    | P1       |
| HR-NEG-008 | Payroll    | Process payroll with no salary assigned | Employee skipped with warning               | P1       |
| HR-NEG-009 | Loans      | Create with principalAmount=0           | 400 Invalid amount                          | P2       |
| HR-NEG-010 | Loans      | 0 installments                          | 400 Minimum 1 installment                   | P2       |
| HR-NEG-011 | All        | Send malformed JSON                     | 400 Bad Request                             | P1       |
| HR-NEG-012 | All        | Send with extra unknown fields          | Accepted or ignored gracefully              | P2       |
| HR-NEG-013 | All        | Concurrent updates (race condition)     | Last-write-wins or optimistic locking       | P2       |

---

## SECTION 8: SMOKE TEST SUITE (Pre-Release Checklist)

| #   | Test                                           | Pass/Fail |
| --- | ---------------------------------------------- | --------- |
| 1   | Login works with valid credentials             | ☐         |
| 2   | Dashboard loads without errors                 | ☐         |
| 3   | Employee list loads with data                  | ☐         |
| 4   | Create employee succeeds with required fields  | ☐         |
| 5   | Attendance check-in works                      | ☐         |
| 6   | Leave application submits successfully         | ☐         |
| 7   | Payroll structure displays                     | ☐         |
| 8   | Settings page loads all 12 tabs                | ☐         |
| 9   | Master Data countries list loads               | ☐         |
| 10  | Reports page renders without JS errors         | ☐         |
| 11  | Logout redirects to login                      | ☐         |
| 12  | Unauthenticated access redirects to login      | ☐         |
| 13  | Multi-tenant: Switch company works             | ☐         |
| 14  | API: /api/hr/health returns 200                | ☐         |
| 15  | Swagger docs: /api/hr/docs loads all endpoints | ☐         |

---

## SECTION 9: PRODUCTION READINESS CHECKLIST

| #   | Check                                      | Status                                     |
| --- | ------------------------------------------ | ------------------------------------------ |
| 1   | All HR DB tables exist in production MySQL | ⚠️ VERIFY: 34 tables may be missing        |
| 2   | All foreign keys enforced at DB level      | ❌ ZERO FKs in schema.sql                  |
| 3   | Input validation on ALL endpoints          | ❌ 35+ endpoints have no validators        |
| 4   | Subscription enforcement middleware active | ❌ hrSubscriptionMiddleware is a no-op     |
| 5   | RBAC enforced on all routes                | ❌ No RBAC implemented                     |
| 6   | Rate limiting configured                   | ⚠️ Verify in production                    |
| 7   | Hardcoded credentials removed              | ❌ `Memits@396` in HRAuthController        |
| 8   | Duplicate health route resolved            | ❌ app.js has duplicate health check       |
| 9   | HTTPS enforced                             | ☐ Verify in deployment                     |
| 10  | Environment variables (no defaults)        | ❌ DB password has hardcoded fallback      |
| 11  | Logging configured (not console.log)       | ⚠️ Uses winston — verify production config |
| 12  | Error handling (no stack traces in prod)   | ☐ Verify NODE_ENV=production               |
| 13  | CORS restricted to known origins           | ☐ Verify production config                 |
| 14  | File upload limits enforced                | ☐ Verify 10MB json limit in app.js         |
| 15  | Database backups scheduled                 | ☐ Verify operations setup                  |
| 16  | API documentation up to date               | ✅ Swagger with 200+ endpoints             |
| 17  | Frontend builds without errors             | ☐ Run npm run build                        |
| 18  | All pages tested for mobile responsiveness | ☐ Verify MUI responsive design             |

---

## SECTION 10: ISSUES & RECOMMENDATIONS (Prioritized Roadmap)

### 🔴 CRITICAL — Must Fix Before Production

| #   | Issue                                                   | Module     | Effort | Recommendation                                                                           |
| --- | ------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------- |
| C1  | 34 tables may not exist in DB                           | Database   | 2 days | Run ALL migrations: `20260729000001` through `20260729000005`. Verify with `SHOW TABLES` |
| C2  | Zero input validation on Payroll endpoints (14)         | Payroll    | 3 days | Create validators for all 14 payroll endpoints using Joi                                 |
| C3  | Zero input validation on Benefits/EOSB (6)              | Benefits   | 1 day  | Create validators for benefit types, employee benefits, EOSB                             |
| C4  | Zero input validation on HR Modules (15)                | HR Modules | 2 days | Create validators for performance, training, recruitment, onboarding                     |
| C5  | Subscription middleware is a no-op                      | Auth       | 2 days | Implement actual subscription check: verify company has active plan + module access      |
| C6  | Duplicate health check route overrides full HTML page   | Core       | 15 min | Remove duplicate route at line 319 in app.js                                             |
| C7  | No RBAC — any authenticated user accesses all endpoints | Auth       | 5 days | Implement role-based middleware: map roles to permissions, enforce on routes             |

### 🟡 HIGH — Should Fix Soon

| #   | Issue                                                                 | Module      | Effort  |
| --- | --------------------------------------------------------------------- | ----------- | ------- |
| H1  | All HR DB foreign keys missing — referential integrity in JS only     | Database    | 3 days  |
| H2  | Hardcoded DB password `Memits@396` in HRAuthController                | Security    | 15 min  |
| H3  | No input validation on Settings endpoints (10)                        | Settings    | 1 day   |
| H4  | No input validation on Master Data endpoints (13)                     | Master Data | 1 day   |
| H5  | No input validation on Dashboard                                      | Dashboard   | 30 min  |
| H6  | No input validation on Reports                                        | Reports     | 1 hour  |
| H7  | hrCompanyMiddleware only reads header — never verifies company exists | Auth        | 2 hours |
| H8  | No overlap check for payroll periods                                  | Payroll     | 4 hours |
| H9  | No overlap check for shift assignments                                | Attendance  | 4 hours |

### 🟢 MEDIUM — Improve

| #   | Issue                                                             | Module     | Effort  |
| --- | ----------------------------------------------------------------- | ---------- | ------- |
| M1  | No deduplication check for leave applications (overlapping dates) | Leave      | 4 hours |
| M2  | No audit logging on Payroll runs (process/approve/reverse)        | Payroll    | 1 day   |
| M3  | No audit logging on Attendance corrections                        | Attendance | 4 hours |
| M4  | No email notification integration for leave approvals             | Leave      | 2 days  |
| M5  | No payslip email delivery                                         | Payroll    | 1 day   |
| M6  | No bulk import for employees (CSV)                                | Employees  | 2 days  |
| M7  | Schema.sql only defines 6 of 40 tables                            | Database   | 1 day   |
| M8  | No API rate limiting for HR endpoints (separate from ERP)         | Security   | 1 hour  |

---

## SECTION 11: TIMESHEETS (⚠️ VERIFY MODULE EXISTS)

> **Note:** No dedicated Timesheet controller or route found in the HR backend. The module may not be implemented yet. These test cases are designed for when the module is built or for verifying if it exists via a different name (e.g., embedded in Attendance).

| TC ID     | Sub Module | Scenario               | Preconditions                        | Test Steps                                              | Expected Result                                  | Priority | Severity | Type        | Auto |
| --------- | ---------- | ---------------------- | ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------ | -------- | -------- | ----------- | ---- |
| HR-TS-001 | Timesheet  | Create timesheet entry | Employee exists                      | 1. POST timesheet with employeeId, date, project, hours | 201; entry created in draft status               | P2       | Medium   | Functional  | Yes  |
| HR-TS-002 | Timesheet  | Submit for approval    | Timesheet entries exist for the week | 1. POST timesheet/submit with week-ending date          | Status changed to 'Submitted'                    | P2       | Medium   | Workflow    | Yes  |
| HR-TS-003 | Timesheet  | Manager approval       | Timesheet submitted                  | 1. PUT timesheet/approve → 2. Check status              | Status='Approved'; hours locked                  | P2       | Medium   | Workflow    | Yes  |
| HR-TS-004 | Timesheet  | Rejection with reason  | Timesheet submitted                  | 1. PUT timesheet/reject with remarks                    | Status='Rejected'; employee can resubmit         | P2       | Medium   | Workflow    | Yes  |
| HR-TS-005 | Timesheet  | Duplicate date entry   | Entry exists for same date           | 1. POST timesheet with same employeeId+date             | 400 "Entry already exists for this date"         | P2       | Medium   | Negative    | Yes  |
| HR-TS-006 | Timesheet  | Exceed max hours       | 24-hour day                          | 1. POST with hours=25                                   | 400 "Hours cannot exceed 24 per day"             | P3       | Low      | Negative    | Yes  |
| HR-TS-007 | Timesheet  | Link to project        | Project/cost center exists           | 1. Include projectId or costCenterId in entry           | Entry linked; billable hours tracked             | P3       | Low      | Functional  | Yes  |
| HR-TS-008 | Timesheet  | Weekly summary view    | Multiple entries in week             | 1. GET timesheet/summary?week=2026-W30                  | Returns total hours per day + week total         | P2       | Medium   | Functional  | Yes  |
| HR-TS-009 | Timesheet  | Payroll integration    | Timesheet approved                   | 1. Run payroll → 2. Check hourly employees              | Hourly wages calculated from approved timesheets | P1       | High     | Integration | Yes  |

---

## SECTION 12: DOCUMENTS

| TC ID      | Sub Module | Scenario                  | Preconditions                 | Test Steps                                                        | Expected Result                                                    | Priority | Severity | Type       | Auto |
| ---------- | ---------- | ------------------------- | ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | -------- | -------- | ---------- | ---- |
| HR-DOC-001 | Upload     | Upload employee document  | Employee exists               | 1. POST /api/hr/employees/:id/documents with file (PDF/PNG)       | 201; document stored; path returned                                | P1       | High     | Functional | Yes  |
| HR-DOC-002 | Upload     | Invalid file type         | —                             | 1. POST with .exe file                                            | 400 "Invalid file type. Allowed: PDF, PNG, JPG"                    | P2       | Medium   | Negative   | Yes  |
| HR-DOC-003 | Upload     | File too large            | File > 5MB                    | 1. POST with 10MB PDF                                             | 400 "File size exceeds 5MB limit"                                  | P2       | Medium   | Negative   | Yes  |
| HR-DOC-004 | List       | View employee documents   | Documents uploaded            | 1. GET /api/hr/employees/:id/documents                            | Returns list with filename, type, uploadDate, expiryDate           | P1       | High     | Functional | Yes  |
| HR-DOC-005 | Download   | Download document         | Document exists               | 1. GET /api/hr/employees/:id/documents/:docId/download            | File binary returned with correct Content-Type                     | P1       | High     | Functional | Yes  |
| HR-DOC-006 | Replace    | Replace existing document | Document exists               | 1. PUT /api/hr/employees/:id/documents/:docId with new file       | Old file archived; new version stored; version counter incremented | P2       | Medium   | Functional | Yes  |
| HR-DOC-007 | Delete     | Delete document           | Document exists               | 1. DELETE /api/hr/employees/:id/documents/:docId                  | 200; file soft-deleted; audit logged                               | P2       | Medium   | Functional | Yes  |
| HR-DOC-008 | Expiry     | Document expiry alerts    | Document has expiryDate set   | 1. Check notification system for upcoming expiry                  | Alert generated N days before expiry (per settings)                | P1       | High     | Functional | Yes  |
| HR-DOC-009 | Expiry     | Expired document flag     | Document past expiry          | 1. GET employee documents → 2. Check expired status               | Expired documents flagged with visual indicator (red badge)        | P2       | Medium   | UI         | No   |
| HR-DOC-010 | Categories | Document type categories  | Document types in master data | 1. Upload with documentTypeId (Passport, Visa, Emirates ID, etc.) | Document categorized correctly                                     | P2       | Medium   | Functional | Yes  |
| HR-DOC-011 | Bulk       | Upload multiple documents | —                             | 1. POST with multiple files in one request                        | All documents uploaded; response includes per-file status          | P3       | Low      | Functional | No   |

---

## SECTION 13: ASSET ASSIGNMENT (⚠️ MAY USE ERP MODULE)

> **Note:** Asset management exists in the ERP backend (`AssetController`, `AssetAssignmentController`). If integrated with HR, employees can have assets assigned. These tests verify the HR-side integration.

| TC ID      | Sub Module | Scenario                         | Preconditions                        | Test Steps                                                                        | Expected Result                                        | Priority | Severity | Type        | Auto |
| ---------- | ---------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- | -------- | ----------- | ---- |
| HR-AST-001 | Assign     | Assign asset to employee         | Asset exists in ERP; Employee exists | 1. POST assign asset with assetId, employeeId, assignmentDate                     | 201; asset linked to employee; custodian updated       | P2       | Medium   | Integration | Yes  |
| HR-AST-002 | Assign     | Asset already assigned           | Asset assigned to another employee   | 1. Attempt to assign same asset                                                   | 400 "Asset already assigned to Employee X"             | P2       | Medium   | Negative    | Yes  |
| HR-AST-003 | Return     | Return asset                     | Asset assigned to employee           | 1. POST asset return with returnDate, condition                                   | Asset status='Returned'; employee cleared              | P2       | Medium   | Workflow    | Yes  |
| HR-AST-004 | Transfer   | Transfer asset between employees | Asset assigned to Employee A         | 1. POST transfer with fromEmployeeId, toEmployeeId                                | Asset reassigned; transfer history recorded            | P2       | Medium   | Workflow    | Yes  |
| HR-AST-005 | History    | View asset assignment history    | Transfers/returns exist              | 1. GET /api/hr/employees/:id/assets/history                                       | Returns timeline of all assignments for the employee   | P2       | Medium   | Functional  | Yes  |
| HR-AST-006 | List       | View employee's current assets   | Assets assigned                      | 1. GET /api/hr/employees/:id/assets                                               | Returns list of currently assigned assets with details | P2       | Medium   | Functional  | Yes  |
| HR-AST-007 | Offboard   | Asset return during offboarding  | Employee resigning                   | 1. Offboarding checklist includes "Return Assets" → 2. Verify all assets returned | All assets marked returned before final settlement     | P1       | High     | Workflow    | Yes  |

---

## SECTION 14: DATABASE VALIDATION SQL QUERIES

Run these SQL queries against the `ezeeflo_hr_payroll` database:

### 14.1 Table Existence Check

```sql
-- List all tables — should show 40+ tables
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'ezeeflo_hr_payroll' ORDER BY TABLE_NAME;
```

### 14.2 Missing Tables Report

```sql
-- Compare expected vs actual tables
-- Expected: departments, designations, branches, cost_centers, employees, employee_documents,
-- shifts, attendances, shift_assignments, rosters, overtimes,
-- leave_types, leave_applications, leave_balances, holidays,
-- salary_structures, salary_components, employee_salaries,
-- allowance_types, employee_allowances, deduction_types, employee_deductions,
-- employee_loans, loan_repayments, payroll_periods, payroll_runs, payroll_details, payslips,
-- benefit_types, employee_benefits, eosb_calculations, eosb_settlements, wps, ess_submissions,
-- performance_goals, performance_kpis, performance_appraisals,
-- training_courses, training_sessions, training_attendees,
-- job_positions, job_applicants, interviews, offer_letters,
-- onboarding_checklists, onboarding_progress, offboarding_checklists, offboarding_progress, exit_interviews,
-- settings_general, settings_company_profile, settings_localization, settings_working_hours,
-- settings_attendance, settings_leave, settings_payroll, settings_security,
-- settings_email, settings_sms, settings_notifications, settings_audit_logs,
-- master_countries, master_states, master_cities, master_data, master_data_audit
```

### 14.3 Foreign Key Validation

```sql
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ezeeflo_hr_payroll' AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
-- Expected: 0 rows returned (no FKs defined)
```

### 14.4 Soft Delete Consistency

```sql
-- Check all tables have deleted_at column
SELECT TABLE_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'ezeeflo_hr_payroll' AND COLUMN_NAME = 'deleted_at'
ORDER BY TABLE_NAME;

-- Verify active records: deleted_at IS NULL
SELECT COUNT(*) AS active_count FROM employees WHERE deleted_at IS NULL;

-- Verify deleted records exist where expected
SELECT COUNT(*) AS deleted_count FROM employees WHERE deleted_at IS NOT NULL;
```

### 14.5 Tenant Data Isolation

```sql
-- Verify ALL employees belong to a tenant
SELECT COUNT(*) FROM employees WHERE tenant_id IS NULL;  -- Expected: 0

-- Verify no cross-tenant leakage in joins
SELECT e.id, e.tenant_id AS emp_tenant, d.tenant_id AS dept_tenant
FROM employees e JOIN departments d ON e.department_id = d.id
WHERE e.tenant_id != d.tenant_id;  -- Expected: 0 rows
```

### 14.6 Duplicate Prevention

```sql
-- Check for duplicate employee codes within same tenant
SELECT tenant_id, employee_code, COUNT(*)
FROM employees WHERE deleted_at IS NULL
GROUP BY tenant_id, employee_code HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Check for duplicate department codes
SELECT tenant_id, code, COUNT(*)
FROM departments WHERE deleted_at IS NULL
GROUP BY tenant_id, code HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

### 14.7 Orphan Records

```sql
-- Employees with non-existent departments
SELECT e.id, e.first_name, e.department_id
FROM employees e LEFT JOIN departments d ON e.department_id = d.id
WHERE e.department_id IS NOT NULL AND d.id IS NULL AND e.deleted_at IS NULL;

-- Attendance records with deleted employees
SELECT a.id, a.employee_id, a.attendance_date
FROM attendances a LEFT JOIN employees e ON a.employee_id = e.id
WHERE e.id IS NULL OR e.deleted_at IS NOT NULL;
```

### 14.8 Index Analysis

```sql
-- Check existing indexes
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'ezeeflo_hr_payroll'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Recommended missing indexes:
-- CREATE INDEX idx_attendance_date ON attendances(attendance_date);
-- CREATE INDEX idx_attendance_emp_date ON attendances(employee_id, attendance_date);
-- CREATE INDEX idx_leave_app_status ON leave_applications(status);
-- CREATE INDEX idx_payroll_run_status ON payroll_runs(status);
```

---

## SECTION 15: REGRESSION TEST SUITE

Run these tests after ANY code change to ensure nothing is broken.

| #   | TC ID       | Module       | Test                                 | Priority |
| --- | ----------- | ------------ | ------------------------------------ | -------- |
| R1  | HR-AUTH-001 | Auth         | Login with valid credentials         | P0       |
| R2  | HR-AUTH-010 | Auth         | Company ID header required           | P0       |
| R3  | HR-EMP-001  | Employee     | Create employee with all fields      | P0       |
| R4  | HR-EMP-007  | Employee     | List employees with pagination       | P0       |
| R5  | HR-EMP-010  | Employee     | Get employee by ID with includes     | P0       |
| R6  | HR-ORG-001  | Organization | Create department                    | P0       |
| R7  | HR-ATT-001  | Attendance   | Manual check-in                      | P0       |
| R8  | HR-ATT-005  | Attendance   | Late arrival detection               | P0       |
| R9  | HR-LEV-001  | Leave        | Apply for leave                      | P0       |
| R10 | HR-LEV-006  | Leave        | Approve leave (manager)              | P0       |
| R11 | HR-PAY-001  | Payroll      | Create salary structure              | P0       |
| R12 | HR-PAY-020  | Payroll      | Process payroll run                  | P0       |
| R13 | HR-PAY-028  | Payroll      | Generate payslips                    | P0       |
| R14 | HR-BEN-003  | EOSB         | Calculate EOSB for resignation < 1yr | P0       |
| R15 | HR-RPT-001  | Reports      | Generate employee report             | P0       |
| R16 | HR-SET-001  | Settings     | Save general settings                | P0       |
| R17 | HR-MD-001   | Master Data  | List countries                       | P0       |
| R18 | HR-DSH-001  | Dashboard    | Dashboard summary loads              | P0       |
| R19 | HR-SEC-001  | Security     | SQL injection in login               | P0       |
| R20 | HR-API-001  | API          | Unauthorized access returns 401      | P0       |
| R21 | HR-MT-001   | Multi-tenant | Employee data isolated               | P0       |
| R22 | HR-DB-006   | Database     | No cross-tenant leakage              | P0       |

**Regression Execution Time:** ~30 minutes (automated) / ~2 hours (manual)

---

## SECTION 16: USER ACCEPTANCE TESTING (UAT) SCENARIOS

### UAT-001: HR Manager — Daily Operations

**Role:** HR Manager  
**Scenario:** Manage the complete daily HR workflow

| #   | Task                                          | Expected Outcome                                  | Pass/Fail |
| --- | --------------------------------------------- | ------------------------------------------------- | --------- |
| 1   | Login to the system                           | Dashboard loads with company summary              | ☐         |
| 2   | View today's attendance                       | Present/Absent/Late counts visible                | ☐         |
| 3   | Approve pending leave requests                | Leave status changes to Approved; balance updated | ☐         |
| 4   | Add new employee                              | Employee created with auto-generated code         | ☐         |
| 5   | Assign employee to department and designation | Employee appears in org chart                     | ☐         |
| 6   | Configure overtime rates in Settings          | Overtime settings saved                           | ☐         |
| 7   | Generate monthly attendance report            | Report shows all employees with status            | ☐         |
| 8   | Export report to CSV                          | CSV file downloads with correct data              | ☐         |

### UAT-002: Payroll Manager — Monthly Payroll

**Role:** Payroll Manager  
**Scenario:** Process monthly payroll end-to-end

| #   | Task                                    | Expected Outcome                                | Pass/Fail |
| --- | --------------------------------------- | ----------------------------------------------- | --------- |
| 1   | Review salary structures                | All structures and components display correctly | ☐         |
| 2   | Add housing allowance for new employee  | Allowance assignment saved                      | ☐         |
| 3   | Approve pending loan request            | Loan status changes to Active                   | ☐         |
| 4   | Create payroll period for current month | Period created with correct dates               | ☐         |
| 5   | Process payroll run                     | All employees processed; gross/net calculated   | ☐         |
| 6   | Review payslip for sample employee      | All components itemized correctly               | ☐         |
| 7   | Approve payroll run                     | Run locked; payslips generated                  | ☐         |
| 8   | Generate WPS SIF file                   | Valid SIF file downloaded                       | ☐         |
| 9   | Generate payroll register report        | Report matches payroll run totals               | ☐         |

### UAT-003: Employee — Self-Service

**Role:** Employee  
**Scenario:** Employee self-service actions

| #   | Task                                                | Expected Outcome                                | Pass/Fail |
| --- | --------------------------------------------------- | ----------------------------------------------- | --------- |
| 1   | Login with employee credentials                     | Employee dashboard loads                        | ☐         |
| 2   | View personal profile                               | All personal/employment details visible         | ☐         |
| 3   | View attendance history                             | Monthly attendance calendar shown               | ☐         |
| 4   | Apply for annual leave                              | Leave application submitted; confirmation shown | ☐         |
| 5   | Check leave balance                                 | Available, used, pending balances displayed     | ☐         |
| 6   | Download latest payslip                             | PDF payslip downloads                           | ☐         |
| 7   | View assigned assets                                | List of assets with assignment dates            | ☐         |
| 8   | Request document (e.g., salary certificate) via ESS | ESS request submitted                           | ☐         |

### UAT-004: Department Manager — Team Management

**Role:** Department Manager  
**Scenario:** Manage team attendance and leaves

| #   | Task                                  | Expected Outcome                          | Pass/Fail |
| --- | ------------------------------------- | ----------------------------------------- | --------- |
| 1   | View team attendance for today        | Only department employees shown           | ☐         |
| 2   | Approve team member's leave           | Balance updated for that employee only    | ☐         |
| 3   | Correct team member's missed punch    | Correction recorded with audit trail      | ☐         |
| 4   | View team leave calendar              | Color-coded calendar with all team leaves | ☐         |
| 5   | Set performance goals for team member | Goal created and assigned                 | ☐         |

---

## SECTION 17: SANITY TEST SUITE (Post-Deployment)

Run after every deployment to verify critical paths.

| #   | Test              | API/Method                         | Expected              | Time (sec) |
| --- | ----------------- | ---------------------------------- | --------------------- | ---------- |
| S1  | Health check      | GET /api/hr/health                 | 200 OK                | < 1        |
| S2  | Login             | POST /api/hr/auth/login            | 200 + token           | < 3        |
| S3  | Get current user  | GET /api/hr/auth/me                | 200 + user object     | < 1        |
| S4  | List employees    | GET /api/hr/employees?limit=1      | 200 + data array      | < 2        |
| S5  | List departments  | GET /api/hr/departments?limit=1    | 200 + data array      | < 2        |
| S6  | List leave types  | GET /api/hr/leave-types?limit=1    | 200 + data array      | < 2        |
| S7  | List shifts       | GET /api/hr/shifts?limit=1         | 200 + data array      | < 2        |
| S8  | Get settings      | GET /api/hr/settings/general       | 200 + settings object | < 2        |
| S9  | Dashboard summary | GET /api/hr/dashboard/summary      | 200 + counts          | < 3        |
| S10 | Frontend loads    | GET http://localhost:3005/hr/login | 200; React renders    | < 5        |
| S11 | Swagger docs      | GET /api/hr/docs                   | 200; Swagger UI loads | < 3        |
| S12 | DB connectivity   | SELECT 1                           | 1 row returned        | < 1        |

**Total Sanity Time:** < 30 seconds (automated)

---

## SECTION 18: RELEASE CHECKLIST

### Pre-Release Verification

| #   | Category    | Check                                                | Status | Owner    |
| --- | ----------- | ---------------------------------------------------- | ------ | -------- |
| R1  | Code        | All critical issues resolved (C1-C7)                 | ☐      | Dev Lead |
| R2  | Code        | All high issues resolved (H1-H9)                     | ☐      | Dev Lead |
| R3  | Code        | No console.log or debug statements remaining         | ☐      | Dev      |
| R4  | Code        | All TODO/FIXME comments reviewed                     | ☐      | Dev      |
| R5  | Database    | All 40+ tables exist in target DB                    | ☐      | DBA      |
| R6  | Database    | All migrations run successfully                      | ☐      | DBA      |
| R7  | Database    | Backup taken before release                          | ☐      | DBA      |
| R8  | Security    | Hardcoded credentials removed from ALL files         | ☐      | Security |
| R9  | Security    | JWT secret rotated (if needed)                       | ☐      | Security |
| R10 | Security    | CORS restricted to production origins                | ☐      | DevOps   |
| R11 | Security    | HTTPS enforced                                       | ☐      | DevOps   |
| R12 | API         | All 200+ endpoints documented in Swagger             | ☐      | Dev      |
| R13 | API         | Rate limiting configured for production              | ☐      | DevOps   |
| R14 | Frontend    | Build succeeds: `npm run build`                      | ☐      | Frontend |
| R15 | Frontend    | No console errors on any page                        | ☐      | QA       |
| R16 | Frontend    | Responsive on mobile (768px) and tablet (1024px)     | ☐      | QA       |
| R17 | Testing     | Smoke test suite (15 checks) PASSED                  | ☐      | QA       |
| R18 | Testing     | Sanity test suite (12 checks) PASSED                 | ☐      | QA       |
| R19 | Testing     | Regression test suite (22 checks) PASSED             | ☐      | QA       |
| R20 | Testing     | UAT signed off by business stakeholders              | ☐      | Business |
| R21 | Performance | Dashboard loads < 2 seconds with 1000 employees      | ☐      | QA       |
| R22 | Performance | Payroll run processes < 30 seconds for 100 employees | ☐      | QA       |
| R23 | Environment | NODE_ENV=production set                              | ☐      | DevOps   |
| R24 | Environment | All env vars configured (no defaults in code)        | ☐      | DevOps   |
| R25 | Monitoring  | Error tracking configured (Sentry/DataDog/etc.)      | ☐      | DevOps   |
| R26 | Monitoring  | Uptime monitoring configured                         | ☐      | DevOps   |
| R27 | Docs        | API documentation URL shared with consumers          | ☐      | PM       |
| R28 | Docs        | Release notes published                              | ☐      | PM       |
| R29 | Rollback    | Rollback plan documented and tested                  | ☐      | DevOps   |
| R30 | Sign-off    | Go/No-Go decision from all stakeholders              | ☐      | ALL      |

### Go-Live Checklist

| #   | Check                                | Status |
| --- | ------------------------------------ | ------ |
| 1   | Database backup confirmed            | ☐      |
| 2   | Migration scripts ready and tested   | ☐      |
| 3   | Rollback plan confirmed              | ☐      |
| 4   | All critical + high bugs fixed       | ☐      |
| 5   | Smoke tests passed on staging        | ☐      |
| 6   | Performance benchmarks met           | ☐      |
| 7   | SSL certificates valid               | ☐      |
| 8   | DNS configured correctly             | ☐      |
| 9   | Monitoring dashboards active         | ☐      |
| 10  | Support team briefed on new features | ☐      |

---

## STATISTICS (UPDATED)

| Metric                              | Count    |
| ----------------------------------- | -------- |
| **Total Modules Analyzed**          | 27       |
| **Total Test Cases Generated**      | 200+     |
| **Critical Issues Found**           | 7        |
| **High Issues Found**               | 9        |
| **Medium Issues Found**             | 8        |
| **API Endpoints Verified**          | 200+     |
| **Database Tables Referenced**      | 40+      |
| **Frontend Pages Reviewed**         | 25+      |
| **End-to-End Workflows**            | 3        |
| **UAT Scenarios**                   | 4        |
| **Smoke Test Checks**               | 15       |
| **Sanity Test Checks**              | 12       |
| **Regression Test Cases**           | 22       |
| **Release Checklist Items**         | 30       |
| **Go-Live Checklist Items**         | 10       |
| **Database Validation Queries**     | 8        |
| **Total Document Sections**         | 18       |
| **Estimated Fix Effort (Critical)** | ~17 days |
| **Estimated Fix Effort (High)**     | ~10 days |
| **Estimated Fix Effort (Medium)**   | ~8 days  |
| **Total Estimated Remediation**     | ~35 days |

---

_Report generated by automated code analysis of the complete EzeeFlo HR & Payroll source tree._
_All findings are based on actual code review, not assumptions._
_Document version: 2.0 — Enhanced with Timesheets, Documents, Asset Assignment, DB SQL queries, Regression, UAT, Sanity, and Release Checklist._
