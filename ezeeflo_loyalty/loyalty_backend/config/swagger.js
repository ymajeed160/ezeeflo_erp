const API_URL = process.env.API_URL || 'http://localhost:5002';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EzeeFlo Loyalty API',
    version: '1.0.0',
    description: 'Enterprise SaaS Loyalty Management Platform — Complete REST API reference',
    contact: { name: 'EzeeFlo Support', email: 'support@ezeeflo.com' },
  },
  servers: [{ url: API_URL, description: 'Local Development' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT access token from /api/auth/login' },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Login, tokens, password management' },
    { name: 'Users', description: 'User CRUD and status' },
    { name: 'Roles', description: 'Role management and permissions' },
    { name: 'Permissions', description: 'Permission groups' },
    { name: 'Dashboard', description: 'Stats and KPIs' },
    { name: 'Customers', description: 'Customer profiles, segments, tags' },
    { name: 'Membership', description: 'Tier management and assignment' },
    { name: 'Points', description: 'Points engine and transactions' },
    { name: 'Rewards', description: 'Reward catalog and redemption' },
    { name: 'Campaigns', description: 'Marketing campaigns' },
    { name: 'Coupons', description: 'Discount coupons' },
    { name: 'Gift Cards', description: 'Gift card purchase and redeem' },
    { name: 'Referrals', description: 'Referral program' },
    { name: 'Reports', description: 'Business reports' },
    { name: 'Analytics', description: 'Charts and trends' },
    { name: 'Notifications', description: 'Templates and sending' },
    { name: 'Integrations', description: 'API keys, POS, audit trail' },
    { name: 'Loyalty Rules', description: 'Configurable earn/redeem rule engine' },
    { name: 'Wallet', description: 'Customer digital wallet' },
    { name: 'Segments', description: 'Dynamic customer segmentation' },
    { name: 'Stores', description: 'Store and branch management' },
    { name: 'Gamification', description: 'Badges, achievements, streaks' },
    { name: 'Fraud Detection', description: 'Fraud rules and alerts' },
    { name: 'Webhooks', description: 'Event-driven webhook integrations' },
    { name: 'Enterprise', description: 'Enterprise hub operations' },
  ],
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', example: 'superadmin' }, password: { type: 'string', example: 'SuperAdmin@123' } } } } } }, responses: { '200': { description: 'Returns user, accessToken, refreshToken' }, '401': { description: 'Invalid credentials' } } } },
    '/api/auth/refresh-token': { post: { tags: ['Auth'], summary: 'Refresh Token', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } }, responses: { '200': { description: 'New token pair' } } } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', responses: { '200': { description: 'Logged out' } } } },
    '/api/auth/me': { get: { tags: ['Auth'], summary: 'Current User', responses: { '200': { description: 'User profile' } } } },
    '/api/auth/change-password': { post: { tags: ['Auth'], summary: 'Change Password', responses: { '200': { description: 'Password changed' } } } },
    '/api/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Forgot Password', responses: { '200': { description: 'Email sent' } } } },
    '/api/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset Password', responses: { '200': { description: 'Reset complete' } } } },

    '/api/dashboard/stats': { get: { tags: ['Dashboard'], summary: 'Get Stats', responses: { '200': { description: 'Dashboard KPIs' } } } },

    '/api/users': {
      get: { tags: ['Users'], summary: 'List Users', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Paginated user list' } } },
      post: { tags: ['Users'], summary: 'Create User', responses: { '201': { description: 'User created' } } },
    },
    '/api/users/{id}': {
      get: { tags: ['Users'], summary: 'Get User', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User detail' } } },
      put: { tags: ['Users'], summary: 'Update User', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Users'], summary: 'Delete User', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/users/{id}/toggle-status': { patch: { tags: ['Users'], summary: 'Toggle Status', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Status toggled' } } } },

    '/api/roles': {
      get: { tags: ['Roles'], summary: 'List Roles', responses: { '200': { description: 'Role list' } } },
      post: { tags: ['Roles'], summary: 'Create Role', responses: { '201': { description: 'Created' } } },
    },
    '/api/roles/{id}': {
      get: { tags: ['Roles'], summary: 'Get Role', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Role detail' } } },
      put: { tags: ['Roles'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Roles'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/roles/{id}/permissions': { post: { tags: ['Roles'], summary: 'Assign Permissions', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { permissionIds: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '200': { description: 'Assigned' } } } },

    '/api/permissions': {
      get: { tags: ['Permissions'], summary: 'List Permissions', responses: { '200': { description: 'Permission list' } } },
      post: { tags: ['Permissions'], summary: 'Create Permission', responses: { '201': { description: 'Created' } } },
    },
    '/api/permissions/groups': { get: { tags: ['Permissions'], summary: 'Get Groups', responses: { '200': { description: 'Permission groups' } } } },

    '/api/customers': {
      get: { tags: ['Customers'], summary: 'List Customers', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'segment', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Paginated list' } } },
      post: { tags: ['Customers'], summary: 'Create Customer', description: 'Auto-creates loyalty account + Standard tier', responses: { '201': { description: 'Customer created' } } },
    },
    '/api/customers/{id}': {
      get: { tags: ['Customers'], summary: 'Get Customer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Detail with loyalty account' } } },
      put: { tags: ['Customers'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Customers'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/customers/{id}/toggle-status': { patch: { tags: ['Customers'], summary: 'Toggle Status', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Toggled' } } } },
    '/api/customers/{id}/wallet': { get: { tags: ['Customers'], summary: 'Get Wallet', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Wallet summary' } } } },
    '/api/customers/segments': { get: { tags: ['Customers'], summary: 'Get Segments', responses: { '200': { description: 'Segment list with counts' } } } },
    '/api/customers/tags': { get: { tags: ['Customers'], summary: 'Get Tags', responses: { '200': { description: 'All tags' } } } },
    '/api/customers/merge': { post: { tags: ['Customers'], summary: 'Merge Customers', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { primaryId: { type: 'string' }, secondaryId: { type: 'string' } } } } } }, responses: { '200': { description: 'Merged' } } } },

    '/api/membership/tiers': {
      get: { tags: ['Membership'], summary: 'List Tiers', responses: { '200': { description: 'Tier list' } } },
      post: { tags: ['Membership'], summary: 'Create Tier', responses: { '201': { description: 'Created' } } },
    },
    '/api/membership/tiers/{id}': {
      get: { tags: ['Membership'], summary: 'Get Tier', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Detail' } } },
      put: { tags: ['Membership'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Membership'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/membership/tiers/{id}/toggle-status': { patch: { tags: ['Membership'], summary: 'Toggle', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Toggled' } } } },
    '/api/membership/tiers/stats': { get: { tags: ['Membership'], summary: 'Tier Stats', responses: { '200': { description: 'Distribution stats' } } } },
    '/api/membership/customers/{customerId}/history': { get: { tags: ['Membership'], summary: 'History', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Membership history' } } } },
    '/api/membership/customers/{customerId}/evaluate': { post: { tags: ['Membership'], summary: 'Evaluate Tier', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Auto-upgrade/downgrade' } } } },
    '/api/membership/customers/{customerId}/assign': { post: { tags: ['Membership'], summary: 'Assign Tier', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { tierId: { type: 'string' }, notes: { type: 'string' } } } } } }, responses: { '200': { description: 'Assigned' } } } },

    '/api/points/earn': { post: { tags: ['Points'], summary: 'Earn Points', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { customerId: { type: 'string' }, points: { type: 'integer' }, source: { type: 'string' } } } } } }, responses: { '201': { description: 'Points earned' } } } },
    '/api/points/redeem': { post: { tags: ['Points'], summary: 'Redeem Points', responses: { '200': { description: 'Points redeemed' } } } },
    '/api/points/reverse': { post: { tags: ['Points'], summary: 'Reverse Transaction', responses: { '200': { description: 'Reversed' } } } },
    '/api/points/adjust': { post: { tags: ['Points'], summary: 'Adjust Points', responses: { '200': { description: 'Adjusted' } } } },
    '/api/points/transfer': { post: { tags: ['Points'], summary: 'Transfer Points', responses: { '200': { description: 'Transferred' } } } },
    '/api/points/expire': { post: { tags: ['Points'], summary: 'Expire Points', responses: { '200': { description: 'Expired' } } } },
    '/api/points/welcome-bonus': { post: { tags: ['Points'], summary: 'Welcome Bonus', responses: { '200': { description: 'Granted' } } } },
    '/api/points/birthday-bonus': { post: { tags: ['Points'], summary: 'Birthday Bonus', responses: { '200': { description: 'Granted' } } } },
    '/api/points/calculate': { get: { tags: ['Points'], summary: 'Calculate Points', parameters: [{ name: 'customerId', in: 'query', schema: { type: 'string' } }, { name: 'purchaseAmount', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'Points estimation' } } } },
    '/api/points/transactions': { get: { tags: ['Points'], summary: 'Transaction List', responses: { '200': { description: 'Paginated' } } } },
    '/api/points/transactions/summary': { get: { tags: ['Points'], summary: 'Transaction Summary', responses: { '200': { description: 'Earned/Redeemed/Expired totals' } } } },

    '/api/rewards': {
      get: { tags: ['Rewards'], summary: 'List Rewards', responses: { '200': { description: 'Reward list' } } },
      post: { tags: ['Rewards'], summary: 'Create Reward', responses: { '201': { description: 'Created' } } },
    },
    '/api/rewards/{id}': {
      get: { tags: ['Rewards'], summary: 'Get Reward', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Detail' } } },
      put: { tags: ['Rewards'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Rewards'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/rewards/{id}/toggle-status': { patch: { tags: ['Rewards'], summary: 'Toggle', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Toggled' } } } },
    '/api/rewards/redeem': { post: { tags: ['Rewards'], summary: 'Redeem Reward', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { rewardId: { type: 'string' }, customerId: { type: 'string' } } } } } }, responses: { '200': { description: 'Redeemed' } } } },
    '/api/rewards/redemptions': { get: { tags: ['Rewards'], summary: 'Redemption History', responses: { '200': { description: 'History' } } } },
    '/api/rewards/redemptions/{id}/cancel': { post: { tags: ['Rewards'], summary: 'Cancel Redemption', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Canceled' } } } },

    '/api/campaigns': {
      get: { tags: ['Campaigns'], summary: 'List Campaigns', responses: { '200': { description: 'List' } } },
      post: { tags: ['Campaigns'], summary: 'Create Campaign', responses: { '201': { description: 'Created' } } },
    },
    '/api/campaigns/{id}': {
      get: { tags: ['Campaigns'], summary: 'Get', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Detail' } } },
      put: { tags: ['Campaigns'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Campaigns'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/campaigns/{id}/status': { patch: { tags: ['Campaigns'], summary: 'Update Status', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'active', 'paused', 'ended', 'canceled'] } } } } } }, responses: { '200': { description: 'Updated' } } } },
    '/api/campaigns/active': { get: { tags: ['Campaigns'], summary: 'Active Campaigns', responses: { '200': { description: 'Currently running' } } } },

    '/api/coupons': { get: { tags: ['Coupons'], summary: 'List Coupons', responses: { '200': { description: 'List' } } } },
    '/api/coupons/generate': { post: { tags: ['Coupons'], summary: 'Generate Coupons', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer', example: 1 }, prefix: { type: 'string', example: 'CPN' }, discountType: { type: 'string', example: 'percentage' }, discountValue: { type: 'number', example: 10 } } } } } }, responses: { '201': { description: 'Generated' } } } },
    '/api/coupons/validate': { post: { tags: ['Coupons'], summary: 'Validate Coupon', responses: { '200': { description: 'Validation result' } } } },
    '/api/coupons/redeem': { post: { tags: ['Coupons'], summary: 'Redeem Coupon', responses: { '200': { description: 'Redeemed' } } } },
    '/api/coupons/usage': { get: { tags: ['Coupons'], summary: 'Usage History', responses: { '200': { description: 'History' } } } },

    '/api/giftcards': { get: { tags: ['Gift Cards'], summary: 'List Gift Cards', responses: { '200': { description: 'List' } } } },
    '/api/giftcards/purchase': { post: { tags: ['Gift Cards'], summary: 'Purchase Card', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { initialBalance: { type: 'number', example: 100 } } } } } }, responses: { '201': { description: 'Created - returns cardNumber + PIN' } } } },
    '/api/giftcards/redeem': { post: { tags: ['Gift Cards'], summary: 'Redeem Card', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { cardNumber: { type: 'string' }, amount: { type: 'number' } } } } } }, responses: { '200': { description: 'Redeemed' } } } },
    '/api/giftcards/recharge': { post: { tags: ['Gift Cards'], summary: 'Recharge Card', responses: { '200': { description: 'Recharged' } } } },
    '/api/giftcards/cancel': { post: { tags: ['Gift Cards'], summary: 'Cancel Card', responses: { '200': { description: 'Canceled' } } } },
    '/api/giftcards/{id}/transactions': { get: { tags: ['Gift Cards'], summary: 'Card Transactions', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'History' } } } },

    '/api/referrals': { get: { tags: ['Referrals'], summary: 'List Referrals', responses: { '200': { description: 'List' } } } },
    '/api/referrals/generate-code': { post: { tags: ['Referrals'], summary: 'Generate Code', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { customerId: { type: 'string' } } } } } }, responses: { '201': { description: 'Code generated' } } } },
    '/api/referrals/register': { post: { tags: ['Referrals'], summary: 'Register Referral', description: 'Auto-creates customer + loyalty account', responses: { '201': { description: 'Registered' } } } },
    '/api/referrals/{id}/grant-rewards': { post: { tags: ['Referrals'], summary: 'Grant Rewards', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Rewards granted' } } } },
    '/api/referrals/stats': { get: { tags: ['Referrals'], summary: 'Referral Stats', responses: { '200': { description: 'Stats + conversion rate' } } } },

    '/api/reports/customer-ledger': { get: { tags: ['Reports'], summary: 'Customer Ledger', parameters: [{ name: 'customerId', in: 'query', schema: { type: 'string' } }, { name: 'startDate', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Point transactions' } } } },
    '/api/reports/points-expiry': { get: { tags: ['Reports'], summary: 'Points Expiry', parameters: [{ name: 'days', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Expiring points' } } } },
    '/api/reports/redeemed-rewards': { get: { tags: ['Reports'], summary: 'Redeemed Rewards', responses: { '200': { description: 'Redemption report' } } } },
    '/api/reports/campaign-performance': { get: { tags: ['Reports'], summary: 'Campaign Performance', responses: { '200': { description: 'Campaign ROI' } } } },
    '/api/reports/top-customers': { get: { tags: ['Reports'], summary: 'Top Customers', parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Top by points' } } } },
    '/api/reports/inactive-customers': { get: { tags: ['Reports'], summary: 'Inactive Customers', parameters: [{ name: 'days', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Dormant accounts' } } } },
    '/api/reports/membership': { get: { tags: ['Reports'], summary: 'Membership Report', responses: { '200': { description: 'Tier distribution' } } } },
    '/api/reports/revenue-impact': { get: { tags: ['Reports'], summary: 'Revenue Impact', responses: { '200': { description: 'Points-to-revenue' } } } },

    '/api/analytics/dashboard': { get: { tags: ['Analytics'], summary: 'Dashboard', responses: { '200': { description: 'Full KPIs' } } } },
    '/api/analytics/monthly-trends': { get: { tags: ['Analytics'], summary: 'Monthly Trends', parameters: [{ name: 'months', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: '12-month data' } } } },
    '/api/analytics/top-campaigns': { get: { tags: ['Analytics'], summary: 'Top Campaigns', responses: { '200': { description: 'Best performing' } } } },
    '/api/analytics/customer-growth': { get: { tags: ['Analytics'], summary: 'Customer Growth', responses: { '200': { description: 'Cumulative over time' } } } },

    '/api/notifications/templates': {
      get: { tags: ['Notifications'], summary: 'List Templates', responses: { '200': { description: 'Templates' } } },
      post: { tags: ['Notifications'], summary: 'Create Template', responses: { '201': { description: 'Created' } } },
    },
    '/api/notifications/templates/{id}': {
      put: { tags: ['Notifications'], summary: 'Update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Notifications'], summary: 'Delete', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/notifications/send': { post: { tags: ['Notifications'], summary: 'Send Notification', responses: { '201': { description: 'Sent' } } } },
    '/api/notifications/history': { get: { tags: ['Notifications'], summary: 'History', responses: { '200': { description: 'Sent history' } } } },

    '/api/integrations/keys': {
      get: { tags: ['Integrations'], summary: 'List API Keys', responses: { '200': { description: 'Keys' } } },
      post: { tags: ['Integrations'], summary: 'Create API Key', responses: { '201': { description: 'Key created' } } },
    },
    '/api/integrations/keys/{id}': { delete: { tags: ['Integrations'], summary: 'Delete Key', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/integrations/keys/{id}/revoke': { patch: { tags: ['Integrations'], summary: 'Revoke Key', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Revoked' } } } },
    '/api/integrations/pos/earn': { post: { tags: ['Integrations'], summary: 'POS: Earn Points', responses: { '200': { description: 'Earned' } } } },
    '/api/integrations/pos/balance/{customerId}': { get: { tags: ['Integrations'], summary: 'POS: Get Balance', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Balance' } } } },
    '/api/integrations/pos/redeem': { post: { tags: ['Integrations'], summary: 'POS: Redeem Points', responses: { '200': { description: 'Redeemed' } } } },
    '/api/integrations/audit/logs': { get: { tags: ['Integrations'], summary: 'Audit Logs', parameters: [{ name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'entityType', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Paginated logs' } } } },
    '/api/integrations/audit/actions': { get: { tags: ['Integrations'], summary: 'Audit Actions', responses: { '200': { description: 'Distinct actions' } } } },
    '/api/integrations/audit/entity-types': { get: { tags: ['Integrations'], summary: 'Audit Entities', responses: { '200': { description: 'Distinct entity types' } } } },
    // ==================== Enterprise Phase 1-5 ====================
    '/api/loyalty-rules': {
      get: { tags: ['Loyalty Rules'], summary: 'List Rules', parameters: [{ name: 'ruleType', in: 'query', schema: { type: 'string' } }, { name: 'isActive', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Rules' } } },
      post: { tags: ['Loyalty Rules'], summary: 'Create Rule', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/loyalty-rules/{id}': {
      get: { tags: ['Loyalty Rules'], summary: 'Get Rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Rule' } } },
      put: { tags: ['Loyalty Rules'], summary: 'Update Rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Loyalty Rules'], summary: 'Delete Rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/loyalty-rules/{id}/toggle': { patch: { tags: ['Loyalty Rules'], summary: 'Toggle Rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Toggled' } } } },
    '/api/loyalty-rules/evaluate': { post: { tags: ['Loyalty Rules'], summary: 'Evaluate Rules', responses: { '200': { description: 'Result' } } } },
    '/api/wallet/customer/{customerId}': { get: { tags: ['Wallet'], summary: 'Customer Wallet', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Wallet data' } } } },
    '/api/wallet': { get: { tags: ['Wallet'], summary: 'Wallets Summary', responses: { '200': { description: 'Paginated wallets' } } } },
    '/api/enterprise/segments': {
      get: { tags: ['Segments'], summary: 'List Segments', responses: { '200': { description: 'Segments' } } },
      post: { tags: ['Segments'], summary: 'Create Segment', responses: { '201': { description: 'Created' } } },
    },
    '/api/enterprise/segments/{id}': {
      get: { tags: ['Segments'], summary: 'Get Segment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Segment' } } },
      put: { tags: ['Segments'], summary: 'Update Segment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Segments'], summary: 'Delete Segment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/enterprise/segments/{id}/refresh': { post: { tags: ['Segments'], summary: 'Refresh Segment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Refreshed' } } } },
    '/api/enterprise/stores': {
      get: { tags: ['Stores'], summary: 'List Stores', responses: { '200': { description: 'Paginated stores' } } },
      post: { tags: ['Stores'], summary: 'Create Store', responses: { '201': { description: 'Created' } } },
    },
    '/api/enterprise/stores/{id}': {
      get: { tags: ['Stores'], summary: 'Get Store', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Store' } } },
      put: { tags: ['Stores'], summary: 'Update Store', responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Stores'], summary: 'Delete Store', responses: { '200': { description: 'Deleted' } } },
    },
    '/api/enterprise/stores/regions': { get: { tags: ['Stores'], summary: 'Store Regions', responses: { '200': { description: 'Regions' } } } },
    '/api/enterprise/badges': {
      get: { tags: ['Gamification'], summary: 'List Badges', responses: { '200': { description: 'Badges' } } },
      post: { tags: ['Gamification'], summary: 'Create Badge', responses: { '201': { description: 'Created' } } },
    },
    '/api/enterprise/badges/{id}': {
      put: { tags: ['Gamification'], summary: 'Update Badge', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Gamification'], summary: 'Delete Badge', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/enterprise/customers/{customerId}/badges': { get: { tags: ['Gamification'], summary: 'Customer Badges', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Badges' } } } },
    '/api/enterprise/fraud/rules': {
      get: { tags: ['Fraud Detection'], summary: 'List Fraud Rules', responses: { '200': { description: 'Rules' } } },
      post: { tags: ['Fraud Detection'], summary: 'Create Fraud Rule', responses: { '201': { description: 'Created' } } },
    },
    '/api/enterprise/fraud/alerts': { get: { tags: ['Fraud Detection'], summary: 'Fraud Alerts', parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Paginated alerts' } } } },
    '/api/enterprise/fraud/scan/{customerId}': { post: { tags: ['Fraud Detection'], summary: 'Scan Customer', parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Scan result' } } } },
    '/api/enterprise/webhooks': {
      get: { tags: ['Webhooks'], summary: 'List Webhooks', responses: { '200': { description: 'Webhooks' } } },
      post: { tags: ['Webhooks'], summary: 'Create Webhook', responses: { '201': { description: 'Created' } } },
    },
    '/api/enterprise/webhooks/{id}': {
      put: { tags: ['Webhooks'], summary: 'Update Webhook', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Webhooks'], summary: 'Delete Webhook', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/membership/tiers/batch-evaluate': { post: { tags: ['Membership'], summary: 'Batch Evaluate Tiers', responses: { '200': { description: 'Result' } } } },
    '/api/company/profile': {
      get: { tags: ['Enterprise'], summary: 'Get Company Profile', responses: { '200': { description: 'Company' } } },
      put: { tags: ['Enterprise'], summary: 'Update Company Profile', responses: { '200': { description: 'Updated' } } },
    },
  },
};

module.exports = swaggerSpec;
