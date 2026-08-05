const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const ApiResponse = require('./utils/apiResponse');
const logger = require('./utils/logger');

const app = express();

// Trust proxy for rate limiter (needed behind React dev proxy)
app.set('trust proxy', 1);

// ── Security ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'", 'blob:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:3000'],
  credentials: true,
}));

// ── Rate Limiting ──
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/hr', generalLimiter);

// ── Super Admin Rate Limiting ──
const superAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/superadmin', superAdminLimiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb', parameterLimit: 1000 }));

// ── Compression ──
app.use(compression());

// ── Static Files ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// ── Swagger ──
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui .info .title { font-size: 28px }',
  customSiteTitle: 'EzeeFlo HR & Payroll API Docs',
  customfavIcon: '/api/hr/health/favicon',
};
app.use('/api/hr/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.get('/api/hr/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Root redirect to Login ──
app.get('/', (req, res) => {
  res.redirect('/login');
});

// ── API Root ──
app.get('/api/hr', (req, res) => {
  return ApiResponse.success(res, {
    message: 'EzeeFlo HR & Payroll API',
    data: {
      version: '1.0.0',
      swagger: '/api/hr/docs',
      endpoints: {
        health: '/api/hr/health',
        dashboard: '/api/hr/dashboard',
        employees: '/api/hr/employees',
        departments: '/api/hr/departments',
        designations: '/api/hr/designations',
        branches: '/api/hr/branches',
        costCenters: '/api/hr/cost-centers',
      },
    },
  });
});

// ── Beautiful Health Check Page ──
app.get('/api/hr/health', async (req, res) => {
  let dbStatus = 'Checking...';
  let dbColor = '#f59e0b';
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    dbStatus = 'Connected';
    dbColor = '#10b981';
  } catch (e) {
    dbStatus = 'Disconnected';
    dbColor = '#ef4444';
  }

  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EzeeFlo HR & Payroll — Health</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      color: #e2e8f0;
    }
    .container {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 24px;
      padding: 48px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 25px 80px rgba(0,0,0,0.4);
      text-align: center;
    }
    .logo {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: #64748b;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 32px;
    }
    .status-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 40px;
    }
    .pulse {
      width: 16px; height: 16px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
      box-shadow: 0 0 0 0 rgba(16,185,129,0.4);
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      70% { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .status-text {
      font-size: 20px;
      font-weight: 600;
      color: #10b981;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 40px;
    }
    .metric {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.08);
      border-radius: 16px;
      padding: 20px 16px;
    }
    .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: #e2e8f0;
    }
    .db-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .db-dot {
      width: 10px; height: 10px;
      background: ${dbColor};
      border-radius: 50%;
      display: inline-block;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59,130,246,0.4);
    }
    .btn-outline {
      border-color: rgba(148,163,184,0.2);
      color: #94a3b8;
    }
    .btn-outline:hover {
      border-color: #3b82f6;
      color: #e2e8f0;
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #475569;
    }
    .footer span {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">EzeeFlo Suite</div>
    <h1>HR &amp; Payroll</h1>

    <div class="status-row">
      <div class="pulse"></div>
      <span class="status-text">All Systems Operational</span>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Uptime</div>
        <div class="metric-value">${uptimeStr}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Environment</div>
        <div class="metric-value">${process.env.NODE_ENV || 'development'}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Database</div>
        <div class="metric-value db-indicator">
          <span class="db-dot"></span> ${dbStatus}
        </div>
      </div>
      <div class="metric">
        <div class="metric-label">Version</div>
        <div class="metric-value">v1.0.0</div>
      </div>
    </div>

    <div class="actions">
      <a href="/api/hr/docs" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        API Docs
      </a>
      <a href="/api/hr" class="btn btn-outline">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        API Root
      </a>
    </div>

    <div class="footer">
      <span>Port ${process.env.PORT || 5001}</span> &middot; <span>${new Date().toISOString()}</span>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── Health Check ──
app.get('/api/hr/health', async (req, res) => {
  let dbStatus = 'Checking...';
  let dbColor = '#f59e0b';
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    dbStatus = 'Connected';
    dbColor = '#10b981';
  } catch (e) {
    dbStatus = 'Disconnected';
    dbColor = '#ef4444';
  }

  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EzeeFlo HR & Payroll — Health</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      color: #e2e8f0;
    }
    .container {
      background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 24px;
      padding: 48px; max-width: 600px; width: 90%;
      box-shadow: 0 25px 80px rgba(0,0,0,0.4); text-align: center;
    }
    .logo { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 4px; color: #64748b; margin-bottom: 8px; }
    h1 { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 32px; }
    .status-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 40px; }
    .pulse { width: 16px; height: 16px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 14px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
    .status-text { font-size: 20px; font-weight: 600; color: #10b981; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
    .metric { background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(148, 163, 184, 0.08); border-radius: 16px; padding: 20px 16px; }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px; }
    .metric-value { font-size: 22px; font-weight: 700; color: #e2e8f0; }
    .db-indicator { display: inline-flex; align-items: center; gap: 6px; }
    .db-dot { width: 10px; height: 10px; background: ${dbColor}; border-radius: 50%; display: inline-block; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s; border: 1px solid transparent; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59,130,246,0.4); }
    .btn-outline { border-color: rgba(148,163,184,0.2); color: #94a3b8; }
    .btn-outline:hover { border-color: #3b82f6; color: #e2e8f0; }
    .footer { margin-top: 32px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">EzeeFlo Suite</div>
    <h1>HR &amp; Payroll</h1>
    <div class="status-row"><div class="pulse"></div><span class="status-text">All Systems Operational</span></div>
    <div class="metrics">
      <div class="metric"><div class="metric-label">Uptime</div><div class="metric-value">${uptimeStr}</div></div>
      <div class="metric"><div class="metric-label">Environment</div><div class="metric-value">${process.env.NODE_ENV || 'development'}</div></div>
      <div class="metric"><div class="metric-label">Database</div><div class="metric-value db-indicator"><span class="db-dot"></span> ${dbStatus}</div></div>
      <div class="metric"><div class="metric-label">Version</div><div class="metric-value">v1.0.0</div></div>
    </div>
    <div class="actions">
      <a href="/api/hr/docs" class="btn btn-primary">📄 API Docs</a>
      <a href="/api/hr" class="btn btn-outline">⏱ API Root</a>
    </div>
    <div class="footer">Port ${process.env.PORT || 5001} &middot; ${new Date().toISOString()}</div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── Auth Routes (no middleware required) ──
const { login, me } = require('./controllers/HRAuthController');
app.post('/api/hr/auth/login', login);
app.get('/api/hr/auth/me', me);

// ── Super Admin Auth Routes (no middleware required for login/refresh) ──
const superAdminAuthRoutes = require('./routes/superAdminAuthRoutes');
const superAdminDashboardRoutes = require('./routes/superAdminDashboardRoutes');
const superAdminCompanyRoutes = require('./routes/superAdminCompanyRoutes');
app.use('/api/superadmin/auth', superAdminAuthRoutes);
app.use('/api/superadmin/dashboard', superAdminDashboardRoutes);
app.use('/api/superadmin/companies', superAdminCompanyRoutes);
app.use('/api/superadmin/subscriptions', require('./routes/superAdminSubscriptionRoutes'));
app.use('/api/superadmin', require('./routes/superAdminPhase4Routes'));
app.use('/api/superadmin', require('./routes/superAdminPhase5Routes'));

// ── Routes ──
const dashboardRoutes = require('./routes/dashboardRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const designationRoutes = require('./routes/designationRoutes');
const branchRoutes = require('./routes/branchRoutes');
const costCenterRoutes = require('./routes/costCenterRoutes');
const { shiftRoutes, attendanceRoutes, saRoutes, rosterRoutes, overtimeRoutes } = require('./routes/attendanceRoutes');
const { ltRoutes, laRoutes, lbRoutes, holidayRoutes } = require('./routes/leaveRoutes');
const {
  salaryStructureRoutes, salaryComponentRoutes, employeeSalaryRoutes,
  allowanceTypeRoutes, empAllowanceRoutes, deductionTypeRoutes, empDeductionRoutes,
  employeeLoanRoutes, loanRepaymentRoutes,
  payrollPeriodRoutes, payrollRunRoutes, payrollDetailRoutes, payslipRoutes,
} = require('./routes/payrollRoutes');
const { btRoutes, ebRoutes, eosbCalcRoutes, eosbSettleRoutes, wpsRoutes, essRoutes } = require('./routes/benefitsRoutes');
const { pgRoutes, pkRoutes, paRoutes, tcRoutes, tsRoutes, taRoutes, jpRoutes, jaRoutes, ivRoutes, olRoutes, oncRoutes, onpRoutes, ofcRoutes, ofpRoutes, eiRoutes } = require('./routes/hrModulesRoutes');
const userRoutes = require('./routes/userRoutes');
const { roleRoutes, permRoutes } = require('./routes/rbacRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { hrAuthMiddleware } = require('./middleware/hrAuthMiddleware');
const { hrCompanyMiddleware } = require('./middleware/hrCompanyMiddleware');
const { hrSubscriptionMiddleware } = require('./middleware/hrSubscriptionMiddleware');

// All HR routes require: Auth → Company → Subscription
const hrMiddlewareChain = [hrAuthMiddleware, hrCompanyMiddleware, hrSubscriptionMiddleware];

app.use('/api/hr/dashboard', hrMiddlewareChain, dashboardRoutes);
app.use('/api/hr/employees', hrMiddlewareChain, employeeRoutes);
app.use('/api/hr/departments', hrMiddlewareChain, departmentRoutes);
app.use('/api/hr/designations', hrMiddlewareChain, designationRoutes);
app.use('/api/hr/branches', hrMiddlewareChain, branchRoutes);
app.use('/api/hr/cost-centers', hrMiddlewareChain, costCenterRoutes);
app.use('/api/hr/shifts', hrMiddlewareChain, shiftRoutes);
app.use('/api/hr/attendance', hrMiddlewareChain, attendanceRoutes);
app.use('/api/hr/shift-assignments', hrMiddlewareChain, saRoutes);
app.use('/api/hr/rosters', hrMiddlewareChain, rosterRoutes);
app.use('/api/hr/overtime', hrMiddlewareChain, overtimeRoutes);
app.use('/api/hr/leave-types', hrMiddlewareChain, ltRoutes);
app.use('/api/hr/leave-applications', hrMiddlewareChain, laRoutes);
app.use('/api/hr/leave-balances', hrMiddlewareChain, lbRoutes);
app.use('/api/hr/holidays', hrMiddlewareChain, holidayRoutes);
app.use('/api/hr/salary-structures', hrMiddlewareChain, salaryStructureRoutes);
app.use('/api/hr/salary-components', hrMiddlewareChain, salaryComponentRoutes);
app.use('/api/hr/employee-salaries', hrMiddlewareChain, employeeSalaryRoutes);
app.use('/api/hr/allowance-types', hrMiddlewareChain, allowanceTypeRoutes);
app.use('/api/hr/employee-allowances', hrMiddlewareChain, empAllowanceRoutes);
app.use('/api/hr/deduction-types', hrMiddlewareChain, deductionTypeRoutes);
app.use('/api/hr/employee-deductions', hrMiddlewareChain, empDeductionRoutes);
app.use('/api/hr/employee-loans', hrMiddlewareChain, employeeLoanRoutes);
app.use('/api/hr/loan-repayments', hrMiddlewareChain, loanRepaymentRoutes);
app.use('/api/hr/payroll-periods', hrMiddlewareChain, payrollPeriodRoutes);
app.use('/api/hr/payroll-runs', hrMiddlewareChain, payrollRunRoutes);
app.use('/api/hr/payroll-details', hrMiddlewareChain, payrollDetailRoutes);
app.use('/api/hr/payslips', hrMiddlewareChain, payslipRoutes);
app.use('/api/hr/benefit-types', hrMiddlewareChain, btRoutes);
app.use('/api/hr/employee-benefits', hrMiddlewareChain, ebRoutes);
app.use('/api/hr/eosb-calculations', hrMiddlewareChain, eosbCalcRoutes);
app.use('/api/hr/eosb-settlements', hrMiddlewareChain, eosbSettleRoutes);
app.use('/api/hr/wps', hrMiddlewareChain, wpsRoutes);
app.use('/api/hr/ess-submissions', hrMiddlewareChain, essRoutes);
app.use('/api/hr/performance-goals', hrMiddlewareChain, pgRoutes);
app.use('/api/hr/performance-kpis', hrMiddlewareChain, pkRoutes);
app.use('/api/hr/performance-appraisals', hrMiddlewareChain, paRoutes);
app.use('/api/hr/training-courses', hrMiddlewareChain, tcRoutes);
app.use('/api/hr/training-sessions', hrMiddlewareChain, tsRoutes);
app.use('/api/hr/training-attendees', hrMiddlewareChain, taRoutes);
app.use('/api/hr/job-positions', hrMiddlewareChain, jpRoutes);
app.use('/api/hr/job-applicants', hrMiddlewareChain, jaRoutes);
app.use('/api/hr/interviews', hrMiddlewareChain, ivRoutes);
app.use('/api/hr/offer-letters', hrMiddlewareChain, olRoutes);
app.use('/api/hr/onboarding-checklists', hrMiddlewareChain, oncRoutes);
app.use('/api/hr/onboarding-progress', hrMiddlewareChain, onpRoutes);
app.use('/api/hr/offboarding-checklists', hrMiddlewareChain, ofcRoutes);
app.use('/api/hr/offboarding-progress', hrMiddlewareChain, ofpRoutes);
app.use('/api/hr/exit-interviews', hrMiddlewareChain, eiRoutes);
app.use('/api/hr/reports', hrMiddlewareChain, reportRoutes);
app.use('/api/hr/employee-assets', hrMiddlewareChain, require('./routes/employeeAssetRoutes'));
app.use('/api/hr/users', hrMiddlewareChain, userRoutes);
app.use('/api/hr/roles', hrMiddlewareChain, roleRoutes);
app.use('/api/hr/permissions', hrMiddlewareChain, permRoutes);
app.use('/api/hr/settings', hrMiddlewareChain, require('./routes/settingsRoutes'));
app.use('/api/hr/master-data', hrMiddlewareChain, require('./routes/masterDataRoutes'));
app.use('/api/hr/notifications', hrMiddlewareChain, require('./routes/notificationRoutes'));

// ── 404 Handler ──
app.use('/api/hr/*', (req, res) => {
  return ApiResponse.notFound(res, { message: `Route ${req.originalUrl} not found` });
});

// ═══════════════════════════════════════════════════════
// Serve React frontend build (production only)
// The build folder is expected at ./front-end/build
// ═══════════════════════════════════════════════════════
const fs = require('fs');
const BUILD_PATH = path.resolve(__dirname, './front-end/build');
if (fs.existsSync(BUILD_PATH)) {
  app.use(express.static(BUILD_PATH, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // SPA fallback — any non-API route serves index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(BUILD_PATH, 'index.html'));
    }
  });

  logger.info(`HR Frontend build served from: ${BUILD_PATH}`);
} else {
  logger.info('HR Frontend build not found — API-only mode');
}

// ── Error Handler ──
app.use(errorHandler);

module.exports = app;
