'use strict';
/**
 * Validation middleware barrel / alias file.
 * Used by routes that do: require('../middleware/validate')
 * Returns a function that runs express-validator style validations,
 * or passes through if no validators are provided.
 * Also re-exports from our validators if needed.
 */
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware factory that accepts validation rules and returns
 * an error-handling middleware.
 * Usage: validate(validator.createPurchaseOrder)
 */
const validate = (...rules) => {
  const allRules = rules.flat();
  return async (req, res, next) => {
    // If there are no rules, just pass through
    if (allRules.length === 0) {
      return next();
    }

    // Run validation
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formatted = errors.array().map(e => ({
          field: e.path || e.param,
          message: e.msg,
        }));
        return ApiResponse.validationError(res, { errors: formatted });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = validate;
module.exports.validate = validate;