# ERP MT Suite - Backend Production Hosting

This folder contains the production deployment setup for the ERP MT Suite backend API server.

## Folder Structure

```
hosting/backend/
├── ecosystem.config.js    # PM2 process manager configuration
├── .env.production        # Production environment variables template
├── start.bat              # Start the backend in production mode
├── stop.bat               # Stop the backend
├── restart.bat            # Zero-downtime restart
├── logs.bat               # Tail live logs
└── README.md              # This file
```

## Prerequisites

| Requirement        | Version | Check                                  |
| ------------------ | ------- | -------------------------------------- |
| **Node.js**        | v16+    | `node -v`                              |
| **MySQL**          | 8.0+    | `mysql --version`                      |
| **PM2** (optional) | latest  | Installed automatically by `start.bat` |

## Quick Start

### 1. Configure Production Database

Edit `back-end/config/config.json` and update the `production` section with your production MySQL credentials:

```json
"production": {
  "username": "root",
  "password": "your_secure_password",
  "database": "erp_mt_suite_prod",
  "host": "localhost",
  "port": 3306,
  "dialect": "mysql",
  "define": { "underscored": true },
  "timezone": "+04:00",
  "logging": false
}
```

### 2. Configure Environment Variables

Copy the production environment template:

```bash
copy hosting\backend\.env.production back-end\.env
```

Then edit `back-end\.env` and set:

- **`DB_PASSWORD`** — your MySQL password
- **`JWT_SECRET`** — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **`JWT_REFRESH_SECRET`** — same as above, use a different value
- **`CORS_ORIGIN`** — the URL where your frontend is hosted (e.g., `http://localhost:3000`)
- **`APP_URL`** — same as CORS_ORIGIN
- **`SMTP_PASS`** — your email SMTP password

### 3. Run Database Migrations

```bash
cd back-end
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 4. Start the Backend

```bash
cd hosting\backend
start.bat
```

Or double-click `start.bat`.

The API will be available at: **http://localhost:5000/api**

### 5. Verify

Check the health endpoint:

```
http://localhost:5000/api/health
```

## PM2 Management Commands

The backend uses **PM2** — a production-grade process manager for Node.js.

| Action             | Command                                           | Batch File    |
| ------------------ | ------------------------------------------------- | ------------- |
| Start              | `pm2 start ecosystem.config.js --env production`  | `start.bat`   |
| Stop               | `pm2 stop ERP-Backend`                            | `stop.bat`    |
| Restart            | `pm2 reload ecosystem.config.js --env production` | `restart.bat` |
| View Status        | `pm2 status`                                      | —             |
| View Logs          | `pm2 logs ERP-Backend`                            | `logs.bat`    |
| Monitor            | `pm2 monit`                                       | —             |
| Auto-start on boot | `pm2 startup`                                     | —             |

### PM2 Features

- **Auto-restart** — If the app crashes, PM2 restarts it automatically
- **Log management** — Logs are saved to `hosting/backend/logs/`
- **Memory limit** — Auto-restarts if memory exceeds 1GB
- **Graceful shutdown** — Waits for active requests to finish
- **Startup on boot** — Run `pm2 startup` to enable

## Production Checklist

- [ ] **Database** — Use a dedicated production MySQL instance with proper backups
- [ ] **Secrets** — Generate strong JWT secrets; never use defaults
- [ ] **SSL/TLS** — Use a reverse proxy (Nginx, IIS, Caddy) for HTTPS termination
- [ ] **Environment** — Set `NODE_ENV=production` (already done via PM2)
- [ ] **CORS** — Set `CORS_ORIGIN` to your actual frontend URL
- [ ] **Monitoring** — Use `pm2 monit` or integrate with APM tools
- [ ] **Logs** — Set up log rotation: `pm2 install pm2-logrotate`

## Architecture

```
┌─────────────┐        ┌──────────────┐        ┌─────────┐
│  Browser /   │  HTTP  │  Hosting      │  Proxy  │  Backend │
│  Frontend    │ ─────> │  Server       │ ─────> │  API     │
│  (port 3000) │        │  (port 3000)  │  /api/* │ (port 5000)│
└─────────────┘        └──────────────┘        └─────────┘
                                                    │
                                                    ▼
                                              ┌─────────┐
                                              │  MySQL   │
                                              │  DB      │
                                              └─────────┘
```
