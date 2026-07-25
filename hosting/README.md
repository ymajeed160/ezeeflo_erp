# ERP MT Suite - Frontend Hosting Server

This folder contains a production-ready static file server for serving the ERP MT Suite frontend build.

## Folder Structure

```
hosting/
├── server.js         # Production Express server
├── stop.js           # Utility to stop the server
├── package.json      # Dependencies
├── .env              # Environment configuration
├── start.bat         # Quick start script (Windows)
├── stop.bat          # Quick stop script (Windows)
└── README.md         # This file
```

## Quick Start

### Prerequisites

1. **Node.js** (v16 or later) installed
2. **Backend server** running on port 5000 (or configured elsewhere)
3. **Frontend built** — production files in `front-end/build/`

### Build the Frontend (if not already built)

```bash
cd front-end
npm install
npm run build
```

### Start the Hosting Server

```bash
# From the hosting folder
cd hosting
npm install
npm start
```

Or double-click `start.bat`.

The frontend will be available at: **http://localhost:3000**

## Configuration

Edit `.env` to customize:

| Variable     | Default                 | Description                        |
| ------------ | ----------------------- | ---------------------------------- |
| `PORT`       | `3000`                  | Port the hosting server listens on |
| `API_URL`    | `http://localhost:5000` | URL of the running backend API     |
| `BUILD_PATH` | `../front-end/build`    | Path to the built frontend files   |
| `NODE_ENV`   | `production`            | Environment mode                   |

## How It Works

1. **Static File Serving** — Serves all files from `front-end/build/` with optimal caching headers.
2. **SPA Fallback** — Any non-API route returns `index.html` so React Router handles client-side routing.
3. **API Proxy** — Requests to `/api/*` are forwarded to the backend server (e.g., `http://localhost:5000/api`). This avoids CORS issues in production.

## Deployment Options

### Option 1: Standalone Node Server (this folder)

Use this folder as-is. It's the simplest approach for production on a single machine.

### Option 2: IIS / IIS Node

1. Copy the contents of `front-end/build/` to your IIS web root.
2. Configure URL Rewrite rules to redirect all requests to `index.html` (for SPA routing).
3. Point your API calls directly to the backend server.

### Option 3: Nginx / Apache

1. Copy `front-end/build/` files to the web server's document root.
2. Configure reverse proxy for `/api/*` to point to the backend.
3. Configure fallback to `index.html` for SPA routing.

### Option 4: Docker

Build a Docker image using a lightweight web server (Nginx) to serve the static build files.

## Stopping the Server

```bash
# From the hosting folder
npm stop
```

Or double-click `stop.bat`.

Or press `Ctrl + C` in the terminal where the server is running.
