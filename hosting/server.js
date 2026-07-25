require('dotenv').config({ path: __dirname + '/.env' });
const path = require('path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');

const app = express();

// ---- Configuration ----
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000';
const BUILD_PATH = path.resolve(__dirname, process.env.BUILD_PATH || 'build');

// ---- Security Middleware ----
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for easier CRA compatibility; tune as needed
  crossOriginEmbedderPolicy: false,
}));

// ---- Compression (gzip) ----
app.use(compression());

// ---- Logging ----
app.use(morgan('combined'));

// ---- CORS (for any direct API calls from front-end to this server) ----
app.use(cors());

// ---- Body Parsing ----
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---- PDF Preview Endpoint ----
// Cache PDFs in memory keyed by a short UUID, then serve via GET for CSP-safe iframe embedding
const pdfCache = new Map();
const PDF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pdfCache) {
    if (now - entry.timestamp > PDF_CACHE_TTL) pdfCache.delete(key);
  }
}, 60 * 1000);

app.post('/api/pdf-preview', (req, res) => {
  const { pdfBase64 } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: 'Missing pdfBase64' });
  const id = require('crypto').randomUUID();
  pdfCache.set(id, { buffer: Buffer.from(pdfBase64, 'base64'), timestamp: Date.now() });
  res.json({ url: `/api/pdf-preview/${id}` });
});

app.get('/api/pdf-preview/:id', (req, res) => {
  const entry = pdfCache.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'PDF not found or expired' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Content-Length', entry.buffer.length);
  res.send(entry.buffer);
});

// ---- API Proxy ----
// Forward /api/* requests to the backend server
const { createProxyMiddleware } = (() => {
  try {
    return { createProxyMiddleware: require('http-proxy-middleware').createProxyMiddleware };
  } catch {
    // Fallback: manual proxy using http.request
    return { createProxyMiddleware: null };
  }
})();

if (createProxyMiddleware) {
  // Use http-proxy-middleware v4
  app.use(createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathFilter: '/api',
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward request body for POST/PUT/PATCH
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
      },
      error: (err, req, res) => {
        console.error('[proxy] Error:', err.message);
        if (res && !res.headersSent) {
          res.status(502).json({ error: 'Bad Gateway', message: 'Cannot reach backend API' });
        }
      },
    },
  }));
  console.log(`[proxy] /api/* -> ${API_URL}/api`);

  // Proxy /uploads/* to backend (for company logos, etc.)
  app.use(createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathFilter: '/uploads',
    on: {
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
      },
      error: (err, req, res) => {
        console.error('[proxy] Upload error:', err.message);
        if (res && !res.headersSent) {
          res.status(502).json({ error: 'Bad Gateway', message: 'Cannot reach backend' });
        }
      },
    },
  }));
  console.log(`[proxy] /uploads/* -> ${API_URL}/uploads`);
} else {
  // Fallback simple proxy using raw http.request
  const http = require('http');
  const proxyHandler = (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) return next();
    const backendUrl = new URL(API_URL);
    const options = {
      hostname: backendUrl.hostname,
      port: backendUrl.port || 5000,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers, host: backendUrl.host, 'accept-encoding': 'identity' },
    };
    const proxyReq = http.request(options, (proxyRes) => {
      // Remove chunked encoding for compatibility
      delete proxyRes.headers['transfer-encoding'];
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error('[proxy] Error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Bad Gateway', message: 'Cannot reach backend API' });
      }
    });
    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway Timeout' });
      }
    });
    req.pipe(proxyReq);
  };
  app.use(proxyHandler);
  console.log(`[proxy] /api/* and /uploads/* -> ${API_URL} (raw proxy)`);
}

// ---- Serve Static Frontend Build ----
if (fs.existsSync(BUILD_PATH)) {
  app.use(express.static(BUILD_PATH, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      // HTML files should not be cached aggressively
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // ---- SPA Fallback ----
  // For any non-API route, serve index.html (React Router handles the rest)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(BUILD_PATH, 'index.html'));
    }
  });

  console.log(`[static] Serving: ${BUILD_PATH}`);
} else {
  console.warn(`[static] WARNING: Build folder not found at: ${BUILD_PATH}`);
  console.warn(`[static] Run "npm run build" in the front-end folder first.`);
  app.get('/', (req, res) => {
    res.send(`
      <h1>ERP MT Suite - Frontend Not Built</h1>
      <p>The production build was not found.</p>
      <p>Expected at: <code>${BUILD_PATH}</code></p>
      <p>Please run <code>cd ../front-end && npm run build</code> first.</p>
    `);
  });
}

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    frontend: fs.existsSync(BUILD_PATH) ? 'ready' : 'not-built',
    api: API_URL,
  });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error('[error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ---- Start Server ----
const server = app.listen(PORT, () => {
  console.log('══════════════════════════════════════════════');
  console.log('  ERP MT Suite - Hosting Server');
  console.log('══════════════════════════════════════════════');
  console.log(`  Frontend  : http://localhost:${PORT}`);
  console.log(`  API Proxy : http://localhost:${PORT}/api -> ${API_URL}/api`);
  console.log(`  Health    : http://localhost:${PORT}/health`);
  console.log(`  Build     : ${BUILD_PATH}`);
  console.log(`  Env       : ${process.env.NODE_ENV || 'production'}`);
  console.log('══════════════════════════════════════════════');
});

// ---- Graceful Shutdown ----
process.on('SIGINT', () => {
  console.log('\n[shutdown] Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('[shutdown] Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('[shutdown] Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('[shutdown] Server closed.');
    process.exit(0);
  });
});

// Export for testing / programmatic use
module.exports = app;
