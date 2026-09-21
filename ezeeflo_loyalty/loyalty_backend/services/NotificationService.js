const { Notification, NotificationTemplate, Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/appError');
const logger = require('../utils/logger');

class NotificationService {
  // === Templates ===
  async getTemplates(companyId) {
    return await NotificationTemplate.findAll({ where: { companyId }, order: [['createdAt', 'DESC']] });
  }

  async createTemplate(data, companyId) {
    return await NotificationTemplate.create({ id: uuidv4(), ...data, companyId });
  }

  async updateTemplate(id, data, companyId) {
    const t = await NotificationTemplate.findOne({ where: { id, companyId } });
    if (!t) throw new NotFoundError('Template not found');
    return await t.update(data);
  }

  async deleteTemplate(id, companyId) {
    const t = await NotificationTemplate.findOne({ where: { id, companyId } });
    if (t) await t.destroy();
  }

  // === Send Notification ===
  async send({ companyId, customerId, userId, channel, subject, body, templateCode, variables = {} }) {
    // If template code provided, resolve template
    if (templateCode) {
      const template = await NotificationTemplate.findOne({ where: { code: templateCode, companyId, isActive: true } });
      if (!template) throw new NotFoundError('Template not found');
      channel = template.channel;
      subject = this._replaceVars(template.subject, variables);
      body = this._replaceVars(template.body, variables);
    }

    if (!subject && channel === 'email') subject = 'EzeeFlo Loyalty Notification';

    const notification = await Notification.create({
      id: uuidv4(), companyId, customerId, userId, channel, subject, body, status: 'pending',
      metadata: { templateCode, variables },
    });

    // Async send (simulate - in production: nodemailer, Twilio, Firebase)
    try {
      await this._dispatch(notification);
      notification.status = 'sent';
      notification.sentAt = new Date();
    } catch (err) {
      notification.status = 'failed';
      notification.errorMessage = err.message;
      logger.error('Notification dispatch failed:', { id: notification.id, error: err.message });
    }
    await notification.save();

    return notification;
  }

  async _dispatch(notification) {
    // In production, this would connect to:
    // - nodemailer for email
    // - Twilio/Infobip for SMS/WhatsApp
    // - Firebase for push notifications
    logger.info(`[${notification.channel.toUpperCase()}] To: ${notification.customerId||notification.userId} | ${notification.subject}`);
    // Simulate success
    return true;
  }

  _replaceVars(text, vars) {
    if (!text) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  // === History ===
  async getHistory(companyId, { page = 1, limit = 20, customerId, channel, status } = {}) {
    const where = { companyId };
    if (customerId) where.customerId = customerId;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const offset = ((parseInt(page)||1)-1)*(parseInt(limit)||20);
    const { count, rows } = await Notification.findAndCountAll({
      where, include: [{ model: Customer, as: 'customer', attributes: ['id','code','firstName','lastName'], required: false }],
      limit: parseInt(limit)||20, offset, order: [['createdAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page)||1, limit: parseInt(limit)||20, total: count, totalPages: Math.ceil(count/(parseInt(limit)||20)), hasNext: offset+parseInt(limit)<count, hasPrev: (parseInt(page)||1)>1 } };
  }

  /**
   * Send points earned notification
   */
  async notifyPointsEarned(customerId, companyId, points) {
    const customer = await Customer.findByPk(customerId);
    if (!customer?.email) return null;

    return await this.send({
      companyId, customerId, channel: 'email',
      subject: `You've earned ${points} points!`,
      body: `Dear ${customer.firstName},\n\nYou just earned ${points} loyalty points. Keep shopping to unlock more rewards!\n\n- EzeeFlo Loyalty`,
    });
  }

  /**
   * Send reward redeemed notification
   */
  async notifyRewardRedeemed(customerId, companyId, rewardName, points) {
    const customer = await Customer.findByPk(customerId);
    if (!customer?.email) return null;
    return await this.send({
      companyId, customerId, channel: 'email',
      subject: `Reward Redeemed: ${rewardName}`,
      body: `Dear ${customer.firstName},\n\nYou've successfully redeemed "${rewardName}" for ${points} points.\n\nEnjoy your reward!\n\n- EzeeFlo Loyalty`,
    });
  }

  /**
   * Send points expiring warning
   */
  async notifyPointsExpiring(customerId, companyId, points, expiryDate) {
    const customer = await Customer.findByPk(customerId);
    if (!customer?.email) return null;
    return await this.send({
      companyId, customerId, channel: 'email',
      subject: `${points} points expiring soon!`,
      body: `Dear ${customer.firstName},\n\n${points} of your loyalty points will expire on ${new Date(expiryDate).toLocaleDateString()}. Redeem them before they're gone!\n\n- EzeeFlo Loyalty`,
    });
  }

  // ==================== Multi-Channel Support ====================
  async sendSMS(companyId, customerId, message) {
    const customer = await Customer.findByPk(customerId);
    if (!customer?.phone) return null;
    console.log(`[SMS] To: ${customer.phone} | ${message}`);
    return await this.send({ companyId, customerId, channel: 'sms', subject: '', body: message });
  }

  async sendPush(companyId, customerId, title, body, data = {}) {
    console.log(`[PUSH] Customer: ${customerId} | ${title}`);
    return await this.send({ companyId, customerId, channel: 'push', subject: title, body, variables: data });
  }

  async getCustomerNotifications(customerId, { page = 1, limit = 20 } = {}) {
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Notification.findAndCountAll({
      where: { customerId }, limit: parseInt(limit) || 20, offset,
      order: [['createdAt', 'DESC']],
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)) } };
  }

  async markAsRead(notificationId, customerId) {
    await Notification.update({ isRead: true, readAt: new Date() }, { where: { id: notificationId, customerId } });
  }
}

module.exports = new NotificationService();
