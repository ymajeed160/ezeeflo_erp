# ═══════════════════════════════════════════════════════

# ERP MT Suite — TezHost Deluxe Pro Deployment

# ═══════════════════════════════════════════════════════

# This is the SINGLE folder you upload to cPanel as

# your Node.js App. It contains BOTH the frontend

# (React SPA) and backend (Express API).

# ═══════════════════════════════════════════════════════

## 📋 What's Inside

```
nodejs_app/                     ← Upload this whole folder
│
├── server.js                   ← 🚀 STARTUP FILE (set in cPanel)
├── app.js                      ← Backend Express app (all API routes)
├── package.json                ← All dependencies
├── .env                        ← Configuration (or set in cPanel UI)
│
├── build/                      ← 🌐 Frontend (React SPA)
│   ├── index.html
│   ├── static/js/main.xxx.js
│   └── static/css/main.xxx.css
│
├── config/                     ← Database configuration
├── controllers/                ← API controllers (47 modules)
├── models/                     ← Sequelize models
├── migrations/                 ← Database migrations
├── seeders/                    ← Initial data
├── routes/                     ← API route definitions
├── services/                   ← Business logic
├── repositories/               ← Data access layer
├── middleware/                  ← Auth, validation
├── utils/                      ← Helpers, logger
├── validators/                 ← Request validation
├── dto/                        ← Data transfer objects
└── views/                      ← Email templates
```

## 🚀 Deployment Steps

### Step 1: Create Database

1. cPanel → **MySQL Databases**
2. Create database: `youruser_erp_mt_suite`
3. Create user: `youruser_erp_user` with a strong password
4. Add user to database with **ALL PRIVILEGES**

### Step 2: Update Database Config

Edit **`config/config.json`** → update the `production` section:

```json
"production": {
  "username": "your_cpanel_user_erp_user",
  "password": "your_password",
  "database": "your_cpanel_user_erp_mt_suite",
  "host": "localhost",
  "port": 3306,
  "dialect": "mysql",
  "define": { "underscored": true },
  "timezone": "+04:00",
  "logging": false
}
```

### Step 3: Upload to cPanel

1. **Compress** the `nodejs_app` folder into a `.zip`
2. cPanel → **File Manager** → Navigate to where you want the app
3. **Upload** the `.zip` and **Extract**
4. Or use **FTP** to upload the entire folder

### Step 4: Set Up Node.js App in cPanel

1. cPanel → **Setup Node.js App** (search "node" in search bar)
2. Click **Create Application**
3. Fill in:

   | Field                          | Value                           |
   | ------------------------------ | ------------------------------- |
   | **Node.js version**            | 18.x or 20.x (latest)           |
   | **Application mode**           | Production                      |
   | **Application root**           | Path to the `nodejs_app` folder |
   | **Application URL**            | `yourdomain.com`                |
   | **Application startup file**   | `server.js`                     |
   | **Pass environment variables** | ✅ Check                        |

4. Add **Environment Variables** (or edit `.env` directly):

   | Variable             | Value                                                              |
   | -------------------- | ------------------------------------------------------------------ |
   | `NODE_ENV`           | `production`                                                       |
   | `DB_HOST`            | `c28.eelserver.com`                                                |
   | `DB_NAME`            | `ezeefloc_erp`                                                     |
   | `DB_USER`            | `ezeefloc_erp`                                                     |
   | `DB_PASSWORD`        | `Memits@396`                                                       |
   | `JWT_SECRET`         | `1e94259d8cf4146c849a1192f5f7460fa024b58fbda0b47015487dd21bb7fd87` |
   | `JWT_REFRESH_SECRET` | `bdb378df10a0479efbdea3aa152cd78d8b3dfc8ac61412c389c52cf317de41c`  |
   | `CORS_ORIGIN`        | `https://www.ezeeflo.com,https://ezeeflo.com`                      |
   | `APP_URL`            | `https://www.ezeeflo.com`                                          |

5. Click **Create**

### Step 5: Install & Run

> ⚠️ **IMPORTANT:** The app will NOT start until you install dependencies!

1. **Click "Run npm install"** — this installs all 24+ npm packages (Express, Sequelize, MySQL2, etc.)
   - Wait for it to complete (may take 1-2 minutes)
   - You'll see "Dependencies installed successfully" when done

2. Click **Start** or **Restart**

3. Your app is now live at `https://www.ezeeflo.com`

### Step 6: Run Database Migrations

If available, use **cPanel → Terminal**:

```bash
cd /path/to/nodejs_app
NODE_ENV=production npx sequelize-cli db:migrate
NODE_ENV=production npx sequelize-cli db:seed:all
```

Or use **SSH** if you have shell access.

## 🔄 Updating

```bash
# 1. Build new frontend locally
cd front-end && npm run build

# 2. Upload new build/ folder to server
#    Overwrite the build/ folder in nodejs_app/

# 3. Update backend files if needed
#    Upload changed files to the server

# 4. Restart the Node.js app
#    cPanel → Setup Node.js App → Restart

# 5. Run new migrations
#    NODE_ENV=production npx sequelize-cli db:migrate
```

## ✅ Verification

| Check | URL                                 | Expected         |
| ----- | ----------------------------------- | ---------------- |
| App   | `https://yourdomain.com`            | Login page loads |
| API   | `https://yourdomain.com/api/health` | JSON status "ok" |
| Docs  | `https://yourdomain.com/api/docs`   | Swagger UI       |

## ❓ Troubleshooting

| `DB_NAME` | `ezeefloc_erp` |
| `DB_USER` | `ezeefloc_erp` |
| `DB_PASSWORD` | `Memits@396` |
| `JWT_SECRET` | `1e94259d8cf4146c849a1192f5f7460fa024b58fbda0b47015487dd21bb7fd87` |
| `JWT_REFRESH_SECRET` | `bdb378df10a0479efbdea3aa152cd78d8b3dfc8ac61412c389c52cf317de41c` |
| `CORS_ORIGIN` | `https://www.ezeeflo.com,https://ezeeflo.com` |
| `APP_URL` | `https://www.ezeeflo.com` |

**App won't start:**

- Check npm install completed successfully
- Verify env vars are set correctly in cPanel
- Check database credentials
- View logs: cPanel → Setup Node.js App → your app → Logs

**Blank page:**

- Check `build/index.html` exists
- Open browser console (F12) for errors
- Ensure the app is running (check Node.js app status)

**API returns 404:**

- The `app.js` mounts all routes under `/api/`
- Verify the backend is running: `https://yourdomain.com/api/health`
