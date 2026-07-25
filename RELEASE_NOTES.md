# ERPMTSuite Release Notes

## Version 3.0.0 — July 26, 2026

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
