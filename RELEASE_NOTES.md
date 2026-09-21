# ERPMTSuite Release Notes

## Version 3.6.0 — September 15, 2026

---

## 🆕 New Features

### Searchable Dropdowns Across the ERP

Introduced a reusable searchable dropdown (`SearchableSelect`) built on the existing MUI Autocomplete, and applied it to all large-record dropdowns across the ERP:

- **Cash Payment Voucher (CPV)** — Cash Account, Account lines
- **Cash Receipt Voucher (CRV)** — Cash Account, Account lines
- **Purchase Orders** — Supplier filter, Supplier, Warehouse, Item lines
- **Goods Receipts** — Supplier filter, Purchase Order, Supplier, Warehouse, Item lines
- **Stock Adjustments** — Warehouse
- **Stock Transfers** — From/To Warehouse
- **Users** — Role
- **POS Sessions** — Terminal
- **General Ledger Report** — Account filter

Features: case-insensitive partial matching, keyboard navigation, clearable selection, edit-time value restore, and `+ Create New` (Quick Create) preserved next to master-data fields. Static lists (Status, Reason, Payer/Payee Type, etc.) remain unchanged.

**Files:**

- `front-end/src/components/Common/SearchableSelect.jsx` (new)

---

### Quick Create Chart of Account (COA)

Added a dedicated "Quick Create Account" dialog that lets users create a new Chart of Account inline — including a searchable **Parent Account** dropdown to link the new account as a sub-account. Available from the Account lines of CPV and CRV; the newly created account is automatically selected.

**Files:**

- `front-end/src/components/QuickCreate/QuickCreateAccount.jsx` (new)
- `front-end/src/components/QuickCreate/QuickCreate.jsx` (routes `account` entity)

---

## 🔧 Improvements

### CPV / CRV Account Lines

- CPV and CRV Account lines now show the **full Chart of Accounts** (previously filtered by account type).
- Section label updated from "Expense Lines"/"Income Lines" to **"Account Lines"**.
- CPV and CRV dialogs widened (`md` → `lg`) for better readability.

---

## 🛠 Fixes

### CPV Edit & Delete with Accounting Impact

- Posted CPVs can now be edited: the existing journal entry is reversed and a new posted journal entry is recreated from the revised values.
- Deleting a posted CPV now reverses its General Ledger impact and soft-deletes the voucher (no orphaned journal entries).
- Added `CPV_UPDATED` and `CPV_DELETED` audit records (with previous/new values and delete reason).
- Fixed CPV/CRV journal entries being saved as `draft` — they are now **posted**, so they appear in the General Ledger and reports.

### CRV Parity

Brought CRV in line with CPV: posted CRVs can be edited with GL reversal + recreation, deleting a posted CRV reverses GL and soft-deletes, `CRV_UPDATED`/`CRV_DELETED` audit records added, and delete reason is captured.

### Journal Entry Numbering

Made journal-entry number generation transaction-aware so multiple entries created in a single transaction receive unique, sequential numbers (prevents unique-constraint collisions during CPV/CRV edit).

**Backend files:**

- `back-end/services/CashPaymentVoucherService.js`
- `back-end/services/CashReceiptVoucherService.js`
- `back-end/controllers/CashReceiptVoucherController.js`
- `back-end/services/JournalEntryService.js`
- `back-end/repositories/JournalEntryRepository.js`

---

## Version 3.5.0 — August 7, 2026

---

## 🆕 New Features

### Cash Payment Voucher (CPV) — Complete Module

A full Cash Payment Voucher module for recording cash payments against expenses. Integrates with the Chart of Accounts, Journal Entries, and General Ledger.

**Backend (8 files):**

| Layer      | File                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| Migration  | `20260807000001-create-cash-payment-vouchers.js`                                    |
| Model      | `CashPaymentVoucher.js`                                                             |
| Model      | `CashPaymentVoucherLine.js`                                                         |
| Repository | `CashPaymentVoucherRepository.js` — `CPV-YYYY-NNNNNN` auto-numbering                |
| Service    | `CashPaymentVoucherService.js` — Create / Update / Post / Reverse / Cancel / Delete |
| Controller | `CashPaymentVoucherController.js` — 8 REST endpoints                                |
| Validator  | `cashPaymentVoucherValidator.js`                                                    |
| DTO        | `CashPaymentVoucherDTO.js`                                                          |

**API Endpoints:**

| Method | Route                                    | Description                                       |
| ------ | ---------------------------------------- | ------------------------------------------------- |
| GET    | `/api/cash-payment-vouchers`             | List CPVs (search, filter by status/date/account) |
| GET    | `/api/cash-payment-vouchers/:id`         | Get CPV detail with lines                         |
| POST   | `/api/cash-payment-vouchers`             | Create new CPV                                    |
| PUT    | `/api/cash-payment-vouchers/:id`         | Update draft CPV                                  |
| DELETE | `/api/cash-payment-vouchers/:id`         | Soft-delete CPV                                   |
| POST   | `/api/cash-payment-vouchers/:id/post`    | Post CPV → creates Journal Entry                  |
| POST   | `/api/cash-payment-vouchers/:id/reverse` | Reverse posted CPV                                |
| POST   | `/api/cash-payment-vouchers/:id/cancel`  | Cancel draft CPV                                  |

**Accounting Logic — Posting:**

```
Dr  Expense Account(s)    (base amount per line)
Dr  VAT Receivable         (tax amount)
    Cr  Cash Account           (total amount = base + tax)
```

**Frontend:**

- `front-end/src/pages/CashPaymentVouchers.js` — Full list/create/edit/view dialogs with multi-line expense entry, tax calculation, auto-calculating totals
- `front-end/src/services/cpvApi.js` — API service layer
- Sidebar: "Cash Payment Voucher" under Purchases menu
- Route: `/app/purchases/cpv`

**CPV Permissions (9):**
| Code | Description |
|------|-------------|
| `cpv.view` | View CPV list and details |
| `cpv.create` | Create new CPV |
| `cpv.edit` | Edit draft CPV |
| `cpv.delete` | Delete draft CPV |
| `cpv.post` | Post CPV to accounting |
| `cpv.reverse` | Reverse posted CPV |
| `cpv.cancel` | Cancel draft CPV |
| `cpv.print` | Print CPV |
| `cpv.export` | Export CPV data |

---

### Cash Receipt Voucher (CRV) — Complete Module

A full Cash Receipt Voucher module for recording cash receipts from customers and other sources. Mirrors CPV architecture with reversed accounting direction.

**Backend (8 files):**

| Layer      | File                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| Migration  | `20260807000002-create-cash-receipt-vouchers.js`                                    |
| Model      | `CashReceiptVoucher.js`                                                             |
| Model      | `CashReceiptVoucherLine.js`                                                         |
| Repository | `CashReceiptVoucherRepository.js` — `CRV-YYYY-NNNNNN` auto-numbering                |
| Service    | `CashReceiptVoucherService.js` — Create / Update / Post / Reverse / Cancel / Delete |
| Controller | `CashReceiptVoucherController.js` — 8 REST endpoints                                |
| Validator  | `cashReceiptVoucherValidator.js`                                                    |
| DTO        | `CashReceiptVoucherDTO.js`                                                          |

**API Endpoints:**

| Method | Route                                    | Description                      |
| ------ | ---------------------------------------- | -------------------------------- |
| GET    | `/api/cash-receipt-vouchers`             | List CRVs                        |
| GET    | `/api/cash-receipt-vouchers/:id`         | Get CRV detail with lines        |
| POST   | `/api/cash-receipt-vouchers`             | Create new CRV                   |
| PUT    | `/api/cash-receipt-vouchers/:id`         | Update draft CRV                 |
| DELETE | `/api/cash-receipt-vouchers/:id`         | Soft-delete CRV                  |
| POST   | `/api/cash-receipt-vouchers/:id/post`    | Post CRV → creates Journal Entry |
| POST   | `/api/cash-receipt-vouchers/:id/reverse` | Reverse posted CRV               |
| POST   | `/api/cash-receipt-vouchers/:id/cancel`  | Cancel draft CRV                 |

**Accounting Logic — Posting:**

```
Dr  Cash Account            (total amount = base + tax)
    Cr  Income Account(s)       (base amount per line)
    Cr  VAT Payable             (tax amount)
```

**Frontend:**

- `front-end/src/pages/CashReceiptVouchers.js` — Full list/create/edit/view dialogs with multi-line income entry, payer type selection (Customer/Supplier/Employee/Other), tax calculation, auto-calculating totals
- `front-end/src/services/crvApi.js` — API service layer
- Sidebar: "Cash Receipt Voucher" under Sales menu
- Route: `/app/sales/crv`

**CRV Permissions (9):**
| Code | Description |
|------|-------------|
| `crv.view` | View CRV list and details |
| `crv.create` | Create new CRV |
| `crv.edit` | Edit draft CRV |
| `crv.delete` | Delete draft CRV |
| `crv.post` | Post CRV to accounting |
| `crv.reverse` | Reverse posted CRV |
| `crv.cancel` | Cancel draft CRV |
| `crv.print` | Print CRV |
| `crv.export` | Export CRV data |

---

### VAT Integration — VAT Payable & VAT Receivable

Both CPV and CRV now integrate with the centralized VAT configuration in System Settings.

| Voucher               | VAT Account         | Direction                   | Config Key                      |
| --------------------- | ------------------- | --------------------------- | ------------------------------- |
| **CPV** (payment out) | VAT Receivable (Dr) | `accounting.vat_receivable` | `1202 - VAT Receivable - Input` |
| **CRV** (receipt in)  | VAT Payable (Cr)    | `accounting.vat_payable`    | `2501 - VAT Account`            |

**Files Updated:**

- `back-end/services/CashPaymentVoucherService.js` — post() and reverse() now use `vat_receivable`
- `back-end/services/CashReceiptVoucherService.js` — post() and reverse() now use `vat_payable`

VAT accounts are configured at **Settings → Accounting** and read dynamically per tenant at posting time.

---

### System Configuration — Default Cash Account

- **Settings → Purchase** tab: "Default Cash Account" dropdown — auto-selects in New CPV and New CRV dialogs
- Config key: `purchase.default_cash_account`
- Both CPV and CRV frontends read this config and pre-populate the Cash Account field

---

## 🐛 Bug Fixes

| Issue                                                               | Fix                                                                                                                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CPV `findById` returns null inside transaction                      | `CashPaymentVoucherRepository.findById()` now accepts optional `transaction` parameter; `create()` and `update()` pass the active transaction so uncommitted data is visible |
| CPV save fails with "Cannot read properties of null (reading 'id')" | Same transaction fix — repository `create()` now correctly returns the created voucher with all includes                                                                     |
| CRV post unbalanced — tax not credited                              | post() now reads `vat_payable` from system config and creates a separate VAT Payable credit line; reverse() mirrors this                                                     |
| CPV tax not posted to proper VAT account                            | post() and reverse() now read `vat_receivable` from system config instead of relying on optional `line.taxId`                                                                |
| Settings API response format mismatch                               | Frontend `loadAccounts()` now correctly parses nested `data.configs` structure: `cfgRes.data?.data?.configs`                                                                 |
| CRV permissions not assigned to Admin role                          | Seed script updated to assign CRV permissions to both `super_admin` and `admin` roles across all tenants                                                                     |

---

## 🚀 Deployment Instructions

### 1. Database Migrations

```bash
cd back-end
npx sequelize-cli db:migrate --name 20260807000001-create-cash-payment-vouchers.js
npx sequelize-cli db:migrate --name 20260807000002-create-cash-receipt-vouchers.js
```

### 2. Seed Permissions

```bash
cd back-end
node seed-cpv-permissions.js
node seed-crv-permissions.js
```

### 3. Front-end Build

```bash
cd front-end
npm run build
```

---

## 📋 Files Changed

| File                                                                 | Change                                         |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| `back-end/models/CashPaymentVoucher.js`                              | New — CPV header model                         |
| `back-end/models/CashPaymentVoucherLine.js`                          | New — CPV line model                           |
| `back-end/models/CashReceiptVoucher.js`                              | New — CRV header model                         |
| `back-end/models/CashReceiptVoucherLine.js`                          | New — CRV line model                           |
| `back-end/models/index.js`                                           | Added CRV model registrations + associations   |
| `back-end/migrations/20260807000001-create-cash-payment-vouchers.js` | New — CPV tables with indexes                  |
| `back-end/migrations/20260807000002-create-cash-receipt-vouchers.js` | New — CRV tables with indexes                  |
| `back-end/repositories/CashPaymentVoucherRepository.js`              | New — CPV CRUD + auto-numbering                |
| `back-end/repositories/CashReceiptVoucherRepository.js`              | New — CRV CRUD + auto-numbering                |
| `back-end/services/CashPaymentVoucherService.js`                     | New — CPV business logic + posting             |
| `back-end/services/CashReceiptVoucherService.js`                     | New — CRV business logic + posting             |
| `back-end/controllers/CashPaymentVoucherController.js`               | New — CPV REST endpoints                       |
| `back-end/controllers/CashReceiptVoucherController.js`               | New — CRV REST endpoints                       |
| `back-end/validators/cashPaymentVoucherValidator.js`                 | New — CPV validation rules                     |
| `back-end/validators/cashReceiptVoucherValidator.js`                 | New — CRV validation rules                     |
| `back-end/dto/CashPaymentVoucherDTO.js`                              | New — CPV data transforms                      |
| `back-end/dto/CashReceiptVoucherDTO.js`                              | New — CRV data transforms                      |
| `back-end/routes/cashPaymentVoucher.routes.js`                       | New — CPV route definitions                    |
| `back-end/routes/cashReceiptVoucher.routes.js`                       | New — CRV route definitions                    |
| `back-end/app.js`                                                    | Added CPV + CRV route mounts                   |
| `back-end/seed-cpv-permissions.js`                                   | New — CPV permission seeder                    |
| `back-end/seed-crv-permissions.js`                                   | New — CRV permission seeder                    |
| `front-end/src/pages/CashPaymentVouchers.js`                         | New — CPV list/create/edit/view page           |
| `front-end/src/pages/CashReceiptVouchers.js`                         | New — CRV list/create/edit/view page           |
| `front-end/src/services/cpvApi.js`                                   | New — CPV API service                          |
| `front-end/src/services/crvApi.js`                                   | New — CRV API service                          |
| `front-end/src/App.js`                                               | Added CPV + CRV route definitions              |
| `front-end/src/components/Layout/Sidebar.js`                         | Added CPV (Purchases) + CRV (Sales) menu items |
| `front-end/src/pages/SystemConfig.js`                                | Added "Default Cash Account" dropdown          |

---

## Version 1.5.0 — August 4, 2026

---

## 🆕 New Features

### Employee Asset Management

- Assign assets (laptops, phones, vehicles, equipment, etc.) to employees with full tracking
- Asset tracking with codes, serial numbers, brand, model, assigned/return dates, and status
- Backend: Model, Repository, Service, Controller, Routes at `/api/hr/employee-assets`
- Web app: Asset assignment form on Employees page with employee selector
- Mobile app: My Assets screen showing only the logged-in user's assigned assets

### Notification System — Full Infrastructure

- New `notifications` table with model, repository, service, controller, and routes
- Web app: Bell icon in top navigation bar with unread badge count
- Popover dropdown showing last 10 notifications with click-to-read
- Auto-polls every 30 seconds for new notifications
- Click notification to navigate to relevant page (Leave, Payroll, Attendance)
- **Leave workflow notifications:**
  - Employee submits leave → notifies employee + manager/approver
  - Leave approved → notifies employee: "Your leave has been approved ✅"
  - Leave rejected → notifies employee with reason
- Smart user-to-employee matching via email (primary) and name (fallback)
- When no distinct manager exists, notifies all other company users

### Mobile App — Dashboard Redesign

- Completely redesigned dashboard with layered gradient header and decorative circles
- Circular progress indicators for leave usage with green/yellow/red color coding
- Refined attendance status card with pulse indicator and live elapsed time
- Enhanced quick actions, leave balances, upcoming holidays, and payroll status cards
- Dashboard auto-refreshes every time the tab gains focus (`useFocusEffect`)

### Mobile App — UX Improvements

- Back buttons added to Attendance, Leave, Payroll, and Apply Leave screens
- Calendar date picker on Apply Leave with range highlighting and day count
- After check-in/check-out, auto-navigates to Dashboard with refresh
- Bottom tab bar with filled/outline icon toggle and elevated shadow

### Master Data — Countries & Nationalities

- Seeded 195 ISO 3166-1 countries with Alpha-2/Alpha-3 codes, flag emojis, nationalities, phone codes, and currencies
- Flag emoji column charset fixed to `utf8mb4` for proper Unicode storage
- Country/nationality dropdowns on Add/Edit Employee forms with flag + name
- Nationality column added to Employees list table

---

## 🐛 Bug Fixes

| Issue                                       | Fix                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Leave balance creation validation error     | Year field now properly initialized with current year                      |
| My Assets showing wrong employee's assets   | Now filters by authenticated user via email/name matching                  |
| Dashboard showing wrong attendance status   | `getMe` endpoint now matches employee to logged-in user                    |
| Payroll net salary mismatch                 | Now computed as `basicSalary + allowances - deductions`                    |
| Leave balance showing 0 on dashboard        | Fixed to use correct backend fields (`availableBalance`, `openingBalance`) |
| Holiday "New Year" showing `?` icon         | Improved date parsing for recurring holidays + calendar-star fallback icon |
| Leave application missing `employeeId`      | Mobile app now fetches employee profile and includes ID in request         |
| `getMyAssets` returning first employee only | Now matches authenticated user to their employee record                    |
| `getMe` returning first employee only       | Same fix — matched by email or name                                        |

---

## Version 1.0.0 — July 2026

---

## 🆕 New Features

### POS (Point of Sale) Module — Complete

A full Point of Sale module with 11 database tables, backend APIs, and 10 front-end screens.

**Backend:**
| Layer | Files |
|---|---|
| Migration | `20260725000001-create-pos-tables.js` |
| Models | `PosTerminal`, `PosTerminalUser`, `PosSession`, `PosSale`, `PosSaleLine`, `PosPayment`, `PosHeldOrder`, `PosCashMovement`, `PosReturn`, `PosReturnLine`, `PosSubscriptionUsage` |
| Controllers | `PosTerminalController`, `PosSessionController`, `PosSaleController`, `PosReturnController`, `PosCashManagementController` |
| Services | `PosTerminalService`, `PosSessionService`, `PosSaleService`, `PosReturnService`, `PosCashManagementService` |
| Repositories | `PosSessionRepository`, `PosSaleRepository` |
| Routes | `posTerminalRoutes`, `posSessionRoutes`, `posSaleRoutes`, `posReturnRoutes`, `posCashManagementRoutes` |

**Frontend Pages:**

- `PosDashboard` — POS overview and KPIs
- `PosRegister` — Main cash register / sales screen
- `PosTerminals` — Terminal management CRUD
- `PosSessions` — Session open/close management
- `PosHeldOrders` — Parked orders management
- `PosCashManagement` — Cash in/out/adjustment movements
- `PosReturnsPage` — Sale returns and refunds
- `PosEndOfDay` — End-of-day reconciliation
- `PosReports` — POS sales and cash reports
- `posApi.js` — API service layer

**Key Features:**

- Multi-payment support (cash, card, bank transfer, credit — split tenders)
- Cart snapshot (item name/sku preserved historically)
- Held/Parked orders with JSON cart state
- Session auditing with expected vs actual cash reconciliation
- Daily usage tracking per tenant (`pos_subscription_usage`)
- Accounting integration via journal entries

**Database Schema (11 Tables):**
| # | Table | Purpose |
|---|---|---|
| 1 | `pos_terminals` | POS terminal/register definitions |
| 2 | `pos_terminal_users` | User-to-terminal assignments |
| 3 | `pos_sessions` | Cash register sessions (open/close) |
| 4 | `pos_sales` | POS sale transactions |
| 5 | `pos_sale_lines` | Sale line items |
| 6 | `pos_payments` | Payment tenders per sale |
| 7 | `pos_held_orders` | Parked/on-hold orders |
| 8 | `pos_cash_movements` | Cash in/out register movements |
| 9 | `pos_returns` | Sale returns/refunds |
| 10 | `pos_return_lines` | Return line items |
| 11 | `pos_subscription_usage` | Daily POS usage tracking |

**POS Permissions (10 new):**
| Code | Description |
|---|---|
| `pos.view` | View POS data |
| `pos.manage_terminals` | Create/Edit/Delete terminals |
| `pos.open_session` | Open register sessions |
| `pos.close_session` | Close register sessions |
| `pos.create_sale` | Complete sales |
| `pos.cancel_sale` | Cancel sales |
| `pos.hold_sale` | Hold/retrieve orders |
| `pos.return` | Process returns |
| `pos.cash_in` | Cash management |
| `pos.view_reports` | View reports |

> **⚠️ PROD Setup Required:** Run the POS schema SQL and permission seed SQL in phpMyAdmin (see deployment section below).

---

### Journal Entry — Enhanced Quick-Add Account Form

The "+" quick-add account button in Journal Entries now includes all fields from the full Chart of Accounts form:

**Before (4 fields):** Account Name, Account Code, Account Type, Description

**After (7 fields):**

- Account Name & Account Code (side-by-side)
- Account Type (dropdown: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- Description (multiline)
- **Parent Account** (searchable autocomplete with code/name/type chips)
- **Opening Balance** (number with step 0.01)
- **Active** (toggle switch)

**Files Changed:** `front-end/src/pages/JournalEntries.js`

---

## 🐛 Bug Fixes

### Node.js Compatibility Fix

- Switched from Node.js v24 to **v20.19.0** for `react-scripts@5.0.1` compatibility
- Node.js v24 hangs during React compilation; v20 works correctly
- Command to switch: `$env:PATH = "$env:LOCALAPPDATA\nvm\v20.19.0;$env:PATH"`

### PDF Invoice Popup — Button Cleanup

- Removed text labels from PDF preview dialog buttons (icons only)
- Buttons: Envelope, Printer, Download, Close
- Applied to Sales Invoices, Sales Orders, and Purchase Orders PDF previews

### Front-end Build Restored

- Fresh production build from latest July 24 source code
- Copied to `deploy-tezhost/nodejs_app/build/`
- All source changes now reflected in served build

---

## 🚀 Deployment Instructions

### 1. Database Schema (phpMyAdmin)

Run the POS CREATE TABLE statements in order. All UUID columns use `CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin` to match existing tables.

Execution order:

```
1. pos_terminals → 2. pos_terminal_users → 3. pos_sessions
→ 4. pos_sales → 5. pos_sale_lines → 6. pos_payments
→ 7. pos_held_orders → 8. pos_cash_movements
→ 9. pos_returns → 10. pos_return_lines → 11. pos_subscription_usage
```

### 2. POS Permissions

After tables are created, seed permissions and assign to roles:

```sql
-- Insert POS permissions for ALL tenants
INSERT INTO `permissions` (`id`, `code`, `name`, `module`, `group`, `tenant_id`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`)
SELECT UUID(), perm.code, perm.name, perm.module, perm.group, t.id, 1, NULL, NULL, NOW(), NOW()
FROM `tenants` t
CROSS JOIN (
  SELECT 'pos.view' AS code, 'POS - View' AS name, 'pos' AS module, 'view' AS `group`
  UNION ALL SELECT 'pos.manage_terminals', 'POS - Manage Terminals', 'pos', 'manage_terminals'
  UNION ALL SELECT 'pos.open_session', 'POS - Open Session', 'pos', 'open_session'
  UNION ALL SELECT 'pos.close_session', 'POS - Close Session', 'pos', 'close_session'
  UNION ALL SELECT 'pos.create_sale', 'POS - Create Sale', 'pos', 'create_sale'
  UNION ALL SELECT 'pos.cancel_sale', 'POS - Cancel Sale', 'pos', 'cancel_sale'
  UNION ALL SELECT 'pos.hold_sale', 'POS - Hold/Retrieve', 'pos', 'hold_sale'
  UNION ALL SELECT 'pos.return', 'POS - Returns', 'pos', 'return'
  UNION ALL SELECT 'pos.cash_in', 'POS - Cash Management', 'pos', 'cash_in'
  UNION ALL SELECT 'pos.view_reports', 'POS - View Reports', 'pos', 'view_reports'
) perm
WHERE NOT EXISTS (
  SELECT 1 FROM `permissions` ex WHERE ex.code = perm.code AND ex.tenant_id = t.id
);

-- Assign POS permissions to ALL existing roles across all tenants
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `tenant_id`, `created_by`, `updated_by`, `created_at`, `updated_at`)
SELECT UUID(), rp.role_id, p.id, p.tenant_id, NULL, NULL, NOW(), NOW()
FROM `permissions` p
INNER JOIN (SELECT DISTINCT role_id, tenant_id FROM `role_permissions`) rp ON rp.tenant_id = p.tenant_id
WHERE p.module = 'pos'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` ex WHERE ex.role_id = rp.role_id AND ex.permission_id = p.id
  );
```

### 3. Front-end Build

```bash
cd front-end
npm run build
# Copy build output to hosting directory
```

---

## 📋 Files Changed

| File                                                      | Change                                     |
| --------------------------------------------------------- | ------------------------------------------ |
| `front-end/src/pages/JournalEntries.js`                   | Enhanced quick-add account form (7 fields) |
| `front-end/src/pages/PosDashboard.js`                     | New                                        |
| `front-end/src/pages/PosRegister.js`                      | New                                        |
| `front-end/src/pages/PosTerminals.js`                     | New                                        |
| `front-end/src/pages/PosSessions.js`                      | New                                        |
| `front-end/src/pages/PosHeldOrders.js`                    | New                                        |
| `front-end/src/pages/PosCashManagement.js`                | New                                        |
| `front-end/src/pages/PosReturnsPage.js`                   | New                                        |
| `front-end/src/pages/PosEndOfDay.js`                      | New                                        |
| `front-end/src/pages/PosReports.js`                       | New                                        |
| `front-end/src/services/posApi.js`                        | New                                        |
| `back-end/migrations/20260725000001-create-pos-tables.js` | New                                        |
| `back-end/models/Pos*.js` (11 files)                      | New                                        |
| `back-end/controllers/Pos*.js` (5 files)                  | New                                        |
| `back-end/services/Pos*.js` (5 files)                     | New                                        |
| `back-end/repositories/Pos*.js` (2 files)                 | New                                        |
| `back-end/routes/pos*.js` (5 files)                       | New                                        |
