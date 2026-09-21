'use strict';
/**
 * Alias for authMiddleware.
 * Used by goodsReceipt.routes.js which does:
 *   const authenticate = require('../middleware/authenticate');
 */
const { authMiddleware } = require('./authMiddleware');
module.exports = authMiddleware;