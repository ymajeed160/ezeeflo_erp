# Tezhost Deployment Package — 2026-10-31

Post-cleanup release: Purchases, Sales and Inventory transactions removed for both companies.
Master data, users, roles, chart of accounts, assets, banking and cash vouchers are intact.

## Package contents

| File | Size | Purpose |
|---|---:|---|
| `ezeefloc_erp_tezhost_2026-10-31.sql` | 2.14 MB | Database import (plain SQL) |
| `ezeefloc_erp_tezhost_2026-10-31.sql.gz` | 0.33 MB | Same file, gzipped for faster upload |
| `nodejs_app.zip` | 7.46 MB | Application package (backend + built React frontend) |

> **Note:** the database dump is **not** committed to the repository. It contains live user
> password hashes, bank account details and customer data, and is excluded by `.gitignore`
> (`deploy-tezhost/ezeefloc_erp_tezhost_*.sql*`). Transfer it to the server over a secure channel.

## 1. Database import

Target is **MariaDB 10.11** on Tezhost. The export was adjusted for it:

- no `CREATE DATABASE` / `USE` statements — you pick the target database in cPanel
- `DEFINER=` clauses stripped from all 59 stored procedures (any DB user can own them)
- `utf8mb4_0900_*` collations mapped to `utf8mb4_unicode_ci` (the `0900` collation is MySQL-8 only and does not exist on MariaDB)

### Steps
1. cPanel → **MySQL Databases** → create a database and a user, then attach the user to the database with **All Privileges**. Note the full names, e.g. `cpuser_ezeefloc_erp`.
2. cPanel → **phpMyAdmin** → select that database.
3. **Import** tab → choose `ezeefloc_erp_tezhost_2026-10-31.sql` → Go.
   - If phpMyAdmin rejects the 2.14 MB upload, import the `.gz` file instead, or upload the `.sql` via **File Manager** and use `mysql` over SSH.
4. Expect: **118 tables** and **59 stored procedures**.

### Verify after import (phpMyAdmin → SQL)
```sql
SELECT COUNT(*) FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE();                      -- 118
SELECT COUNT(*) FROM information_schema.ROUTINES
 WHERE ROUTINE_SCHEMA = DATABASE();                     -- 59
SELECT COUNT(*) FROM tenants;                           -- 2
SELECT COUNT(*) FROM purchaseinvoices;                  -- 0
SELECT COUNT(*) FROM sales_invoices;                    -- 0
SELECT COUNT(*) FROM inventory_transactions;            -- 0
```
Import was tested end-to-end: restored into a scratch database, row counts matched the source exactly
(4,946 rows / 118 tables, 0 differences), and `sp_Report_TrialBalance` plus `sp_Report_StockSummary` executed successfully.

## 2. Application deployment

`nodejs_app.zip` layout: **root = backend**, **`front-end/build/` = compiled React app**.
The backend serves the built frontend itself — no separate web root is required.

### Steps
1. cPanel → **Setup Node.js App** → create an application:
   - Application root: e.g. `ezeefloc_erp`
   - Application URL: your domain
   - Application startup file: `server.js`
   - Node.js version: **18 or 20**
2. Upload `nodejs_app.zip` into that application root and **Extract** (File Manager).
3. In cPanel's Node.js App panel, click **Run NPM Install** (the zip intentionally excludes `node_modules`).
4. Create the `.env` file in the application root (see below), then **Restart** the app.
5. Point the domain/document root at the application root so `/` reaches Node.

### Required `.env`
```ini
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpuser_ezeefloc_erp
DB_USER=cpuser_ezeefloc
DB_PASSWORD=<the password you set in cPanel>

CORS_ORIGIN=https://your-domain.com

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@erpmtsuite.com
SMTP_PASS=<app password>

API_URL=https://your-domain.com
APP_URL=https://your-domain.com
```
`config/database.js` reads these variables; the runtime never uses `config/config.json`
(that file is only for `sequelize-cli` migrations).

### Verify
- `https://your-domain.com/api/health` → `{"success":true,...,"environment":"production"}`
- `https://your-domain.com/` → EzeeFlo login page
- Sign in with `admin@erp.com` (superadmin)

**Note on `uploads/`:** the backend writes logos and attachments there. The folder is not in the
zip (it is excluded like `node_modules`) — create it inside the application root and make it writable.

## 3. Known items / cautions

1. **Hardcoded database password in the repo.** `config/config.json` and 14 other shipped `.js` files
   (15 files total) contain the old development password in plaintext — notably `config/database.js`
   where it is a fallback default. Runtime uses `.env`, so those values are inert, but they travel with
   the zip. Use a **different** password on Tezhost, and consider having these stripped.
2. **Document numbering restarts at 1.** `number_series` counters were reset during the cleanup, so new
   invoices/orders begin at `00001` and will repeat numbers previously printed on deleted documents.
3. **Purchases / Sales / Inventory screens will be empty** — that is the intended post-cleanup state.
4. **`erp_mt_suite` is a different local database** with 18 purchase invoices. It is not part of this export.
5. The old package is preserved as `nodejs_app-previous-20261031.zip` for rollback.

## 4. Rollback

- Application: restore `nodejs_app-previous-20261031.zip`.
- Database: drop and re-import the previous export `ezeefloc_erp.sql.gz`, or the pre-cleanup backup
  `ezeefloc_erp-backup-20261031-161021.sql` if you need the deleted transactions back.
