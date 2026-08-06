const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const ApiResponse = require('./utils/apiResponse');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const pointsRoutes = require('./routes/pointsRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const couponRoutes = require('./routes/couponRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes');
const referralRoutes = require('./routes/referralRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const companyRoutes = require('./routes/companyRoutes');
const loyaltyRuleRoutes = require('./routes/LoyaltyRuleRoutes');
const walletRoutes = require('./routes/walletRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const enterpriseRoutes2 = require('./routes/enterpriseRoutes2');
const mobileApiRoutes = require('./routes/mobileApiRoutes');
const superadminAuthRoutes = require('./routes/superadminAuthRoutes');
const superadminRoutes = require('./routes/superadminRoutes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-company-id'],
}));

// Rate limiting
app.use('/api/', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb', parameterLimit: 1000 }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger - Self-contained API documentation

// Serve the swagger JSON spec directly
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EzeeFlo Loyalty API Docs',
  swaggerOptions: {
    url: '/api/docs.json',
  },
}));

// Health check - Beautiful HTML page
app.get('/api/health', (req, res) => {
  const uptime = Math.floor(process.uptime());
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  const uptimeStr = `${h}h ${m}m ${s}s`;
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EzeeFlo Loyalty — System Health</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%); min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 48px; max-width: 600px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
  .logo { width: 72px; height: 72px; background: linear-gradient(135deg, #4F46E5, #818CF8); border-radius: 18px; display:flex; align-items:center; justify-content:center; margin: 0 auto 24px; font-size: 36px; }
  h1 { color: #F1F5F9; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .version { color: #94A3B8; font-size: 14px; margin-bottom: 32px; }
  .status { display: inline-flex; align-items:center; gap: 8px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 100px; padding: 8px 20px; margin-bottom: 32px; }
  .status-dot { width: 10px; height: 10px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite; box-shadow: 0 0 10px #10B981; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  .status-text { color: #10B981; font-weight: 600; font-size: 14px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom: 24px; }
  .stat { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: left; }
  .stat-label { color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .stat-value { color: #F1F5F9; font-size: 18px; font-weight: 700; }
  .footer { color: #64748B; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
  .footer a { color: #818CF8; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">🪙</div>
  <h1>EzeeFlo Loyalty</h1>
  <div class="version">Enterprise SaaS Loyalty Platform v1.0.0</div>
  <div class="status">
    <div class="status-dot"></div>
    <span class="status-text">All Systems Operational</span>
  </div>
  <div class="grid">
    <div class="stat">
      <div class="stat-label">Environment</div>
      <div class="stat-value">${process.env.NODE_ENV || 'development'}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Uptime</div>
      <div class="stat-value">${uptimeStr}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Memory Usage</div>
      <div class="stat-value">${memUsage} MB</div>
    </div>
    <div class="stat">
      <div class="stat-label">Node.js</div>
      <div class="stat-value">${process.version}</div>
    </div>
  </div>
  <div class="footer">
    <a href="/api/docs">📖 API Documentation</a> &nbsp;·&nbsp; EzeeFlo Technologies © ${new Date().getFullYear()}
  </div>
</div>
</body>
</html>`);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/giftcards', giftCardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/loyalty-rules', loyaltyRuleRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/enterprise', enterpriseRoutes2);
app.use('/api/mobile', mobileApiRoutes);

// Super Admin Routes
app.use('/api/superadmin/auth', superadminAuthRoutes);
app.use('/api/superadmin', superadminRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  ApiResponse.notFound(res, { message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
