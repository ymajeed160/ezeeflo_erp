const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');

const routesDir = path.join(__dirname, '..', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EzeeFlo HR & Payroll API',
      version: '1.0.0',
      description: 'Independent HR & Payroll system.\n\n## Auth\nJWT via ERP SSO. Include Authorization: Bearer <token> and X-Company-Id headers.',
      contact: { name: 'EzeeFlo' },
    },
    servers: [{ url: 'http://localhost:5001', description: 'Dev' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Dashboard' }, { name: 'Employees' }, { name: 'Organization' },
      { name: 'Attendance' }, { name: 'Leave' }, { name: 'Payroll' },
      { name: 'Benefits & EOSB' }, { name: 'HR Modules' }, { name: 'Reports' },
    ],
  },
  apis: files.map(f => path.join(routesDir, f)),
};

module.exports = swaggerJsdoc(options);
