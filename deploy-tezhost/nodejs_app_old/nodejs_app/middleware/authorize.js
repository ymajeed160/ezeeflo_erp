'use strict';
/**
 * Alias for rbacMiddleware.requirePermission.
 * Used by goodsReceipt.routes.js which does:
 *   const { authorize } = require('../middleware/authorize');
 */
const { requirePermission } = require('./rbacMiddleware');
module.exports = { authorize: requirePermission };