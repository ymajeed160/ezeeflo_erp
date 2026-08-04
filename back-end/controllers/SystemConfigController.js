'use strict';

const db = require('../models');
const ApiResponse = require('../utils/apiResponse');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

const { SystemConfig, NumberSeries, EmailSetting, TaxRate, Account, Warehouse, Customer, Supplier, VatCategoryCode, ItemDefinition } = db;

/**
 * SystemConfigController — Manages global system settings grouped by category.
 */
class SystemConfigController {

  // ─── GET all configs grouped ───
  async getAllConfigs(req, res, next) {
    try {
      const { tenantId } = req.user;
      const configs = await SystemConfig.findAll({ where: { tenantId } });
      const emailSettings = await EmailSetting.findOne({ where: { tenantId } });
      const numberSeries = await NumberSeries.findAll({ where: { tenantId } });
      const taxRates = await TaxRate.findAll({ where: { tenantId, isActive: true } });

      // Reference data from other modules
      const accounts = await Account.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'code', 'name', 'type'] });
      const warehouses = await Warehouse.findAll({ where: { tenantId }, attributes: ['id', 'code', 'name'] });
      const customers = await Customer.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'name'] });
      const suppliers = await Supplier.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'name'] });

      // Build config map by category
      const configMap = {};
      configs.forEach(c => {
        if (!configMap[c.category]) configMap[c.category] = {};
        configMap[c.category][c.configKey] = c.configValue;
      });

      return ApiResponse.success(res, {
        data: {
          configs: configMap,
          emailSettings: emailSettings || {},
          numberSeries,
          referenceData: { accounts, warehouses, customers, suppliers, taxRates },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── GET reference/lookup data ───
  async getReferenceData(req, res, next) {
    try {
      const { tenantId } = req.user;
      const accounts = await Account.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'code', 'name', 'type'] });
      const warehouses = await Warehouse.findAll({ where: { tenantId }, attributes: ['id', 'code', 'name'] });
      const customers = await Customer.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'name'] });
      const suppliers = await Supplier.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'name'] });
      const taxRates = await TaxRate.findAll({ where: { tenantId, isActive: true }, attributes: ['id', 'name', 'rate', 'isDefault'] });

      return ApiResponse.success(res, {
        data: { accounts, warehouses, customers, suppliers, taxRates },
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── SAVE/UPDATE all configs ───
  async saveConfigs(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { configs } = req.body; // { category: { key: value, ... }, ... }

      if (!configs || typeof configs !== 'object') {
        return ApiResponse.error(res, { message: 'Invalid config data' });
      }

      const operations = [];
      for (const [category, settings] of Object.entries(configs)) {
        if (typeof settings !== 'object') continue;
        for (const [configKey, configValue] of Object.entries(settings)) {
          operations.push(
            SystemConfig.upsert({
              tenantId,
              configKey,
              configValue: String(configValue ?? ''),
              category,
            })
          );
        }
      }
      await Promise.all(operations);

      logger.info(`System configs updated for tenant ${tenantId}`);
      return ApiResponse.success(res, { message: 'Settings saved successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ─── SAVE email settings ───
  async saveEmailSettings(req, res, next) {
    try {
      const { tenantId } = req.user;
      const data = req.body;
      const [record, created] = await EmailSetting.upsert({
        tenantId,
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        senderEmail: data.senderEmail || '',
        senderName: data.senderName || '',
        username: data.username || '',
        password: data.password || '',
        useSsl: data.useSsl || false,
        useTls: data.useTls ?? true,
      });
      return ApiResponse.success(res, { message: 'Email settings saved', data: record });
    } catch (err) {
      next(err);
    }
  }

  // ─── GET number series ───
  async getNumberSeries(req, res, next) {
    try {
      const { tenantId } = req.user;
      const series = await NumberSeries.findAll({ where: { tenantId } });
      return ApiResponse.success(res, { data: series });
    } catch (err) {
      next(err);
    }
  }

  // ─── SAVE number series ───
  async saveNumberSeries(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { series } = req.body; // Array of series objects
      if (!Array.isArray(series)) {
        return ApiResponse.error(res, { message: 'Invalid series data' });
      }
      const ops = series.map(s =>
        NumberSeries.upsert({
          tenantId,
          seriesName: s.seriesName,
          prefix: s.prefix || '',
          suffix: s.suffix || '',
          nextNumber: s.nextNumber || 1,
          numberLength: s.numberLength || 5,
          padZero: s.padZero ?? true,
          resetPeriod: s.resetPeriod || 'none',
        })
      );
      await Promise.all(ops);
      return ApiResponse.success(res, { message: 'Number series saved' });
    } catch (err) {
      next(err);
    }
  }

  // ─── TEST email ───
  async testEmail(req, res, next) {
    try {
      const { tenantId, email: userEmail } = req.user;
      const emailSettings = await EmailSetting.findOne({ where: { tenantId } });
      if (!emailSettings || !emailSettings.smtpHost) {
        return ApiResponse.error(res, { message: 'Email settings not configured. Save SMTP settings first.' });
      }

      const recipientEmail = req.body.recipientEmail || userEmail || emailSettings.senderEmail;
      if (!recipientEmail) {
        return ApiResponse.error(res, { message: 'No recipient email provided' });
      }

      const result = await EmailService.sendTestEmail(emailSettings, recipientEmail);
      return ApiResponse.success(res, { message: result.message });
    } catch (err) {
      logger.error('Test email failed:', { error: err.message });
      return ApiResponse.error(res, { message: err.message || 'Failed to send test email' });
    }
  }

  // ─── VAT CATEGORY CODES ───
  async getVatCategoryCodes(req, res, next) {
    try {
      const { tenantId } = req.user;
      const codes = await VatCategoryCode.findAll({
        where: { tenantId },
        order: [['code', 'ASC']],
      });
      return ApiResponse.success(res, { data: codes });
    } catch (err) {
      next(err);
    }
  }

  async saveVatCategoryCode(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id, code, name, description, isActive } = req.body;

      if (!code || !name) {
        return ApiResponse.error(res, { message: 'Code and Name are required' });
      }

      let record;
      if (id) {
        // Update existing
        await VatCategoryCode.update(
          { code, name, description, isActive: isActive ?? true, updatedBy: req.user.id },
          { where: { id, tenantId } }
        );
        record = await VatCategoryCode.findByPk(id);
      } else {
        // Create new
        record = await VatCategoryCode.create({
          tenantId,
          code,
          name,
          description,
          isActive: true,
          createdBy: req.user.id,
          updatedBy: req.user.id,
        });
      }

      return ApiResponse.success(res, { data: record, message: id ? 'Code updated' : 'Code created' });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return ApiResponse.error(res, { message: `Code "${req.body.code}" already exists for this tenant` });
      }
      next(err);
    }
  }

  async deleteVatCategoryCode(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      await VatCategoryCode.destroy({ where: { id, tenantId } });
      return ApiResponse.success(res, { message: 'Code deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ─── ITEM DEFINITIONS ───
  async getItemDefinitions(req, res, next) {
    try {
      const { tenantId } = req.user;
      const definitions = await ItemDefinition.findAll({
        where: { tenantId },
        order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']],
      });
      return ApiResponse.success(res, { data: definitions });
    } catch (err) {
      next(err);
    }
  }

  async saveItemDefinition(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id, category, name, sortOrder } = req.body;

      if (!category || !name) {
        return ApiResponse.error(res, { message: 'Category and Name are required' });
      }

      let record;
      if (id) {
        await ItemDefinition.update(
          { category, name, sortOrder: sortOrder ?? 0, updatedBy: req.user.id },
          { where: { id, tenantId } }
        );
        record = await ItemDefinition.findByPk(id);
      } else {
        record = await ItemDefinition.create({
          tenantId,
          category,
          name,
          sortOrder: sortOrder ?? 0,
          isActive: true,
          createdBy: req.user.id,
          updatedBy: req.user.id,
        });
      }

      return ApiResponse.success(res, { data: record, message: id ? 'Definition updated' : 'Definition created' });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return ApiResponse.error(res, { message: `"${req.body.name}" already exists in category "${req.body.category}"` });
      }
      next(err);
    }
  }

  async deleteItemDefinition(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      await ItemDefinition.destroy({ where: { id, tenantId } });
      return ApiResponse.success(res, { message: 'Definition deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ─── RESET to defaults ───
  async resetToDefaults(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { category } = req.query;
      const where = { tenantId };
      if (category) where.category = category;
      await SystemConfig.destroy({ where });
      return ApiResponse.success(res, { message: 'Settings reset to defaults' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SystemConfigController();
