const { FraudRule, FraudAlert, PointTransaction, Customer, LoyaltyAccount } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class FraudDetectionService {
  async getAllRules(companyId) {
    return await FraudRule.findAll({ where: { companyId }, order: [['severity', 'DESC']] });
  }

  async createRule(data, companyId, userId) {
    if (typeof data.conditions === 'string') { try { data.conditions = JSON.parse(data.conditions); } catch {} }
    return await FraudRule.create({ id: uuidv4(), ...data, companyId, createdBy: userId });
  }

  async updateRule(id, data, companyId) {
    const rule = await FraudRule.findOne({ where: { id, companyId } });
    if (!rule) throw new (require('../utils/appError').NotFoundError)('Rule not found');
    await rule.update(data);
    return rule;
  }

  async deleteRule(id, companyId) {
    await FraudRule.destroy({ where: { id, companyId } });
  }

  async scanCustomer(customerId, companyId) {
    const rules = await FraudRule.findAll({ where: { companyId, isActive: true } });
    const alerts = [];

    for (const rule of rules) {
      const triggered = await this._evaluateRule(rule, customerId, companyId);
      if (triggered) {
        const alert = await FraudAlert.create({
          id: uuidv4(), companyId, fraudRuleId: rule.id, customerId,
          severity: rule.severity, title: `Fraud Alert: ${rule.name}`,
          description: triggered.reason, evidence: triggered.evidence,
          status: 'open',
        });
        alerts.push(alert);
      }
    }
    return alerts;
  }

  async _evaluateRule(rule, customerId, companyId) {
    const conditions = rule.conditions || {};
    const checks = [];

    if (conditions.transactions_per_hour) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await PointTransaction.count({ where: { customerId, companyId, createdAt: { [Op.gte]: hourAgo } } });
      if (count > conditions.transactions_per_hour) checks.push(`${count} transactions in last hour (limit: ${conditions.transactions_per_hour})`);
    }

    if (conditions.redemptions_per_day) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await PointTransaction.count({ where: { customerId, companyId, transactionType: 'redeem', createdAt: { [Op.gte]: dayAgo } } });
      if (count > conditions.redemptions_per_day) checks.push(`${count} redemptions in last 24h (limit: ${conditions.redemptions_per_day})`);
    }

    if (checks.length > 0) return { reason: checks.join('; '), evidence: { checks } };
    return null;
  }

  async getAlerts(companyId, { status, page = 1, limit = 20 } = {}) {
    const where = { companyId };
    if (status) where.status = status;
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await FraudAlert.findAndCountAll({
      where,
      include: [{ model: FraudRule, as: 'rule', attributes: ['id', 'name', 'fraudType'] }, { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName'] }],
      limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']],
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)) } };
  }

  async resolveAlert(id, status, userId, notes) {
    const alert = await FraudAlert.findByPk(id);
    if (!alert) throw new (require('../utils/appError').NotFoundError)('Alert not found');
    alert.status = status;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    if (notes) alert.notes = notes;
    await alert.save();
    return alert;
  }
}

module.exports = new FraudDetectionService();
