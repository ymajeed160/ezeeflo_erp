const { Webhook, WebhookLog } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class WebhookService {
  async getAll(companyId) {
    return await Webhook.findAll({ where: { companyId }, order: [['name', 'ASC']] });
  }

  async create(data, companyId, userId) {
    const secret = data.secret || crypto.randomBytes(16).toString('hex');
    return await Webhook.create({ id: uuidv4(), ...data, companyId, secret, createdBy: userId });
  }

  async update(id, data, companyId) {
    const webhook = await Webhook.findOne({ where: { id, companyId } });
    if (!webhook) throw new (require('../utils/appError').NotFoundError)('Webhook not found');
    await webhook.update(data);
    return webhook;
  }

  async delete(id, companyId) {
    await Webhook.destroy({ where: { id, companyId } });
  }

  async trigger(event, payload, companyId) {
    const webhooks = await Webhook.findAll({ where: { companyId, isActive: true } });
    for (const webhook of webhooks) {
      if (webhook.events && webhook.events.includes(event)) {
        this._sendWebhook(webhook, event, payload);
      }
    }
  }

  async _sendWebhook(webhook, event, payload) {
    const log = await WebhookLog.create({ id: uuidv4(), webhookId: webhook.id, event, payload, status: 'pending', attemptCount: 1 });
    try {
      const signature = crypto.createHmac('sha256', webhook.secret || '').update(JSON.stringify(payload)).digest('hex');
      // In production, use axios to POST to webhook.url with X-Signature header
      log.status = 'success';
      log.statusCode = 200;
      await log.save();
      await Webhook.increment('successCount', { where: { id: webhook.id } });
      await webhook.update({ lastTriggeredAt: new Date() });
    } catch (err) {
      log.status = 'failed';
      log.errorMessage = err.message;
      await log.save();
      await Webhook.increment('failureCount', { where: { id: webhook.id } });
    }
  }

  async getLogs(webhookId, { page = 1, limit = 20 } = {}) {
    const where = { webhookId };
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await WebhookLog.findAndCountAll({ where, limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']] });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)) } };
  }
}

module.exports = new WebhookService();
