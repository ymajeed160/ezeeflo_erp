const { LoyaltyRule, LoyaltyAccount, PointTransaction, Customer, MembershipTier, Campaign, Coupon } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op, Sequelize } = require('sequelize');

/**
 * Enterprise Loyalty Rule Engine
 * Evaluates configurable rules against transaction context and applies actions.
 * Supports AND/OR condition groups, priority ordering, and usage limits.
 */
class RuleEngineService {
  /**
   * Evaluate all matching earn rules for a transaction context.
   * @param {Object} context - { companyId, customerId, invoiceAmount, invoiceQuantity, productCategories, brand, storeId, branchId, paymentMethod, campaignId, couponId, referralCode, isBirthday, isHoliday, dayOfWeek, customerTier, customerMembership, isFirstPurchase, purchaseCount }
   * @returns {Array} Array of matched rule results with calculated points
   */
  async evaluateEarnRules(context) {
    const { companyId } = context;
    const now = new Date();

    const rules = await LoyaltyRule.findAll({
      where: {
        companyId,
        ruleType: 'earn',
        isActive: true,
        [Op.or]: [
          { startDate: null },
          { startDate: { [Op.lte]: now } },
        ],
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: now } },
        ],
      },
      order: [['priority', 'DESC']],
    });

    const results = [];
    for (const rule of rules) {
      if (!this._isRuleApplicable(rule, context)) continue;
      if (!this._evaluateConditions(rule.conditions, context)) continue;

      const ruleResult = await this._applyActions(rule, context);
      if (ruleResult) {
        results.push({ ruleId: rule.id, ruleName: rule.name, ruleCode: rule.code, ...ruleResult });
        this._incrementRuleCount(rule);
      }
    }
    return results;
  }

  /**
   * Evaluate redeem rules for a redemption request
   */
  async evaluateRedeemRules(context) {
    const { companyId } = context;
    const now = new Date();

    const rules = await LoyaltyRule.findAll({
      where: {
        companyId,
        ruleType: 'redeem',
        isActive: true,
        [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
        [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
      },
      order: [['priority', 'DESC']],
    });

    const results = [];
    for (const rule of rules) {
      if (!this._isRuleApplicable(rule, context)) continue;
      if (!this._evaluateConditions(rule.conditions, context)) continue;

      const ruleResult = await this._applyActions(rule, context);
      if (ruleResult) {
        results.push({ ruleId: rule.id, ruleName: rule.name, ruleCode: rule.code, ...ruleResult });
        this._incrementRuleCount(rule);
      }
    }
    return results;
  }

  /**
   * Calculate total base points from earn rules
   */
  async calculateEarnPoints(context) {
    const results = await this.evaluateEarnRules(context);
    return {
      totalPoints: results.reduce((sum, r) => sum + (r.points || 0), 0),
      ruleResults: results,
    };
  }

  /**
   * Check if rule is applicable to this customer/store context
   */
  _isRuleApplicable(rule, context) {
    // Check max applications
    if (rule.maxApplications && rule.applicationCount >= rule.maxApplications) return false;
    if (rule.maxApplicationsPerCustomer) {
      // Would need a tracking table; simplified for now
    }

    // Check store applicability
    if (rule.applicableStores && rule.applicableStores.length > 0) {
      if (!context.storeId || !rule.applicableStores.includes(context.storeId)) return false;
    }

    // Check branch applicability
    if (rule.applicableBranches && rule.applicableBranches.length > 0) {
      if (!context.branchId || !rule.applicableBranches.includes(context.branchId)) return false;
    }

    // Check segment targeting
    if (rule.targetSegments && rule.targetSegments.length > 0) {
      if (!context.customerSegment || !rule.targetSegments.includes(context.customerSegment)) return false;
    }

    return true;
  }

  /**
   * Evaluate rule conditions with AND/OR logic
   * conditions format: [{ conditions: [...], logic: 'AND'|'OR' }, ...] — groups are OR'd
   */
  _evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) return true; // No conditions = always match

    // Groups are OR'd together
    return conditions.some(group => {
      const groupLogic = (group.logic || 'AND').toUpperCase();
      const conds = group.conditions || [];

      if (conds.length === 0) return true;

      if (groupLogic === 'AND') {
        return conds.every(c => this._evaluateSingleCondition(c, context));
      } else {
        return conds.some(c => this._evaluateSingleCondition(c, context));
      }
    });
  }

  /**
   * Evaluate a single condition against context
   */
  _evaluateSingleCondition(condition, context) {
    const { field, operator, value } = condition;
    const ctxValue = context[field];

    switch (operator) {
      case 'equals': return ctxValue === value;
      case 'not_equals': return ctxValue !== value;
      case 'greater_than': return parseFloat(ctxValue) > parseFloat(value);
      case 'less_than': return parseFloat(ctxValue) < parseFloat(value);
      case 'greater_or_equal': return parseFloat(ctxValue) >= parseFloat(value);
      case 'less_or_equal': return parseFloat(ctxValue) <= parseFloat(value);
      case 'in': return Array.isArray(value) && value.includes(ctxValue);
      case 'not_in': return Array.isArray(value) && !value.includes(ctxValue);
      case 'contains': return String(ctxValue || '').includes(String(value));
      case 'between': return Array.isArray(value) && value.length === 2 && parseFloat(ctxValue) >= parseFloat(value[0]) && parseFloat(ctxValue) <= parseFloat(value[1]);
      case 'is_true': return !!ctxValue;
      case 'is_false': return !ctxValue;
      default: return false;
    }
  }

  /**
   * Apply rule actions and calculate resulting points
   */
  async _applyActions(rule, context) {
    if (!rule.actions || rule.actions.length === 0) return null;

    let totalPoints = 0;
    let multiplier = 1;
    const bonuses = [];

    for (const action of rule.actions) {
      switch (action.actionType) {
        case 'award_points': {
          const points = this._resolvePoints(action.config, context);
          totalPoints += points;
          break;
        }
        case 'multiply_points': {
          const mult = parseFloat(action.config?.multiplier || 1);
          multiplier *= mult;
          break;
        }
        case 'bonus_points': {
          const bonusPoints = this._resolvePoints(action.config, context);
          bonuses.push({ label: action.config?.label || 'Bonus', points: bonusPoints });
          totalPoints += bonusPoints;
          break;
        }
        case 'issue_coupon': {
          bonuses.push({ label: 'Coupon', couponCode: action.config?.couponCode, discountType: action.config?.discountType, discountValue: action.config?.discountValue });
          break;
        }
        case 'send_notification': {
          bonuses.push({ label: 'Notification', template: action.config?.template });
          break;
        }
        default: break;
      }
    }

    const basePoints = Math.floor(totalPoints * multiplier);
    return { points: basePoints, multiplier, bonuses, actions: rule.actions };
  }

  /**
   * Resolve points from config (fixed, percentage of invoice, per-item, tier-based)
   */
  _resolvePoints(config, context) {
    if (!config) return 0;

    switch (config.pointType) {
      case 'fixed': return parseInt(config.value || 0);
      case 'percentage': return Math.floor((parseFloat(context.invoiceAmount || 0) * parseFloat(config.value || 0)) / 100);
      case 'per_item': return parseInt(config.value || 0) * parseInt(context.invoiceQuantity || 1);
      case 'per_amount_spent': {
        // e.g., 1 point per 10 AED spent
        const rate = parseFloat(config.value || 1);
        const perAmount = parseFloat(config.perAmount || 1);
        return Math.floor(parseFloat(context.invoiceAmount || 0) / perAmount) * rate;
      }
      case 'tier_based': {
        // Tier-specific point values: { bronze: 1, silver: 2, gold: 3 }
        const tier = (context.customerTier || 'standard').toLowerCase();
        return parseInt((config.tierValues || {})[tier] || config.value || 0);
      }
      case 'membership_multiplier': {
        const multiplier = parseFloat(context.customerMembershipMultiplier || 1);
        return Math.floor(parseInt(config.value || 0) * multiplier);
      }
      default: return 0;
    }
  }

  async _incrementRuleCount(rule) {
    await LoyaltyRule.increment('applicationCount', { by: 1, where: { id: rule.id } });
  }

  // ===================== CRUD Operations =====================

  async getAll(companyId, { page = 1, limit = 20, ruleType, isActive, search } = {}) {
    const where = { companyId };
    if (ruleType) where.ruleType = ruleType;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await LoyaltyRule.findAndCountAll({
      where, limit: parseInt(limit) || 20, offset,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getById(id, companyId) {
    const rule = await LoyaltyRule.findOne({ where: { id, companyId } });
    if (!rule) throw new (require('../utils/appError').NotFoundError)('Rule not found');
    return rule;
  }

  async create(data, companyId, userId) {
    const { LoyaltyRule } = require('../models');
    const { ConflictError } = require('../utils/appError');
    const existing = await LoyaltyRule.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Rule code already exists');
    if (typeof data.conditions === 'string') { try { data.conditions = JSON.parse(data.conditions); } catch { data.conditions = []; } }
    if (typeof data.actions === 'string') { try { data.actions = JSON.parse(data.actions); } catch { data.actions = []; } }
    return await LoyaltyRule.create({ id: uuidv4(), ...data, companyId, createdBy: userId });
  }

  async update(id, data, companyId) {
    const rule = await LoyaltyRule.findOne({ where: { id, companyId } });
    if (!rule) throw new (require('../utils/appError').NotFoundError)('Rule not found');
    if (typeof data.conditions === 'string') { try { data.conditions = JSON.parse(data.conditions); } catch {} }
    if (typeof data.actions === 'string') { try { data.actions = JSON.parse(data.actions); } catch {} }
    await rule.update(data);
    return rule;
  }

  async delete(id, companyId) {
    const rule = await LoyaltyRule.findOne({ where: { id, companyId } });
    if (!rule) throw new (require('../utils/appError').NotFoundError)('Rule not found');
    await rule.destroy();
  }

  async toggleStatus(id, companyId) {
    const rule = await LoyaltyRule.findOne({ where: { id, companyId } });
    if (!rule) throw new (require('../utils/appError').NotFoundError)('Rule not found');
    rule.isActive = !rule.isActive;
    await rule.save();
    return rule;
  }
}

module.exports = new RuleEngineService();
