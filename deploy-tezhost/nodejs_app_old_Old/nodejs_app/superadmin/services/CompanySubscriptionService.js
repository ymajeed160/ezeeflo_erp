const companySubscriptionRepository = require('../repositories/CompanySubscriptionRepository');
const subscriptionPlanRepository = require('../repositories/SubscriptionPlanRepository');
const { CompanySubscriptionModule, SubscriptionAuditLog, License } = require('../../models');
const logger = require('../../utils/logger');
const dayjs = require('dayjs');

class CompanySubscriptionService {
  async getAllSubscriptions(filters = {}, pagination = {}) {
    return await companySubscriptionRepository.findAllWithDetails({ ...pagination, filters });
  }

  async getSubscriptionById(id) {
    const sub = await companySubscriptionRepository.findByIdWithDetails(id);
    if (!sub) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription not found', 404);
    }
    return sub;
  }

  async getSubscriptionByCompany(companyId) {
    return await companySubscriptionRepository.findByCompanyId(companyId);
  }

  async getActiveSubscription(companyId) {
    return await companySubscriptionRepository.findActiveByCompanyId(companyId);
  }

  async createSubscription(data) {
    const plan = await subscriptionPlanRepository.findById(data.planId);
    if (!plan) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription plan not found', 404);
    }

    // Check if company already has an active subscription
    const existingActive = await companySubscriptionRepository.findActiveByCompanyId(data.companyId);
    if (existingActive) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Company already has an active subscription. Expire or cancel it first.', 409);
    }

    // Generate subscription number
    const subNumber = await this._generateSubscriptionNumber();

    const isTrial = data.isTrial !== false;
    const trialDays = data.trialDays || plan.trialDays || 14;

    const now = dayjs();
    const subscriptionData = {
      companyId: data.companyId,
      planId: data.planId,
      subscriptionNumber: subNumber,
      billingCycle: data.billingCycle || 'monthly',
      startDate: now.format('YYYY-MM-DD'),
      endDate: data.endDate || null,
      status: isTrial ? 'trial' : 'active',
      isTrial,
      trialEndDate: isTrial ? now.add(trialDays, 'day').format('YYYY-MM-DD') : null,
      renewalDate: data.billingCycle === 'yearly'
        ? now.add(1, 'year').format('YYYY-MM-DD')
        : now.add(1, 'month').format('YYYY-MM-DD'),
      priceAtSubscription: data.priceAtSubscription || (data.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice),
      discountPercent: data.discountPercent || 0,
      autoRenew: data.autoRenew !== false,
      createdBy: data.createdBy,
    };

    if (data.gracePeriodEnd) {
      subscriptionData.gracePeriodEnd = data.gracePeriodEnd;
    }

    const subscription = await companySubscriptionRepository.create(subscriptionData);

    // Enable default modules for this plan
    const { SubscriptionPlanModule } = require('../../models');
    const planModules = await SubscriptionPlanModule.findAll({
      where: { planId: data.planId, isDefault: true },
    });

    const enabledModules = [];
    // If specific moduleIds are provided, use those; otherwise use plan defaults
    const moduleIds = data.moduleIds || planModules.map(pm => pm.moduleId);

    for (const moduleId of moduleIds) {
      const enabledModule = await CompanySubscriptionModule.create({
        subscriptionId: subscription.id,
        moduleId,
        isEnabled: true,
      });
      enabledModules.push(enabledModule);
    }

    // Generate license
    await this._generateLicense(subscription, data.createdBy);

    // Log audit
    await SubscriptionAuditLog.create({
      companyId: data.companyId,
      subscriptionId: subscription.id,
      action: isTrial ? 'subscription_trial_created' : 'subscription_created',
      entityType: 'company_subscription',
      entityId: subscription.id,
      newValues: { subscriptionNumber: subNumber, planId: data.planId, billingCycle: data.billingCycle },
      description: `Subscription ${subNumber} created for company`,
      performedBy: data.createdBy,
    });

    return await companySubscriptionRepository.findByIdWithDetails(subscription.id);
  }

  async updateSubscription(id, data) {
    const sub = await companySubscriptionRepository.findById(id);
    if (!sub) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription not found', 404);
    }

    const oldValues = {
      planId: sub.planId,
      status: sub.status,
      billingCycle: sub.billingCycle,
      autoRenew: sub.autoRenew,
    };

    const updated = await companySubscriptionRepository.update(id, {
      ...data,
      updatedBy: data.updatedBy,
    });

    // Update enabled modules if provided
    if (data.moduleIds && Array.isArray(data.moduleIds)) {
      await CompanySubscriptionModule.destroy({ where: { subscriptionId: id } });
      for (const moduleId of data.moduleIds) {
        await CompanySubscriptionModule.create({
          subscriptionId: id,
          moduleId,
          isEnabled: true,
        });
      }
    }

    // Log audit for status changes
    if (data.status && data.status !== sub.status) {
      await SubscriptionAuditLog.create({
        companyId: sub.companyId,
        subscriptionId: id,
        action: `subscription_${data.status}`,
        entityType: 'company_subscription',
        entityId: id,
        oldValues: { status: sub.status },
        newValues: { status: data.status },
        description: `Subscription ${sub.subscriptionNumber} status changed from ${sub.status} to ${data.status}`,
        performedBy: data.updatedBy,
      });

      // Update license status accordingly
      if (data.status === 'cancelled' || data.status === 'expired') {
        await License.update(
          { status: data.status, isActive: false },
          { where: { subscriptionId: id, isActive: true } }
        );
      } else if (data.status === 'active') {
        await License.update(
          { status: 'active', isActive: true },
          { where: { subscriptionId: id } }
        );
      }
    }

    return await companySubscriptionRepository.findByIdWithDetails(id);
  }

  async cancelSubscription(id, reason) {
    return await this.updateSubscription(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      autoRenew: false,
      updatedBy: reason.updatedBy,
    });
  }

  async _generateSubscriptionNumber() {
    const { NumberSeries, Tenant } = require('../../models');
    let series = await NumberSeries.findOne({ where: { seriesName: 'SUBSCRIPTION' } });

    if (!series) {
      // Use a system tenant ID for subscription numbering (super admin context)
      const defaultTenant = await Tenant.findOne({ order: [['createdAt', 'ASC']] });
      series = await NumberSeries.create({
        seriesName: 'SUBSCRIPTION',
        prefix: 'SUB-',
        nextNumber: 1,
        numberLength: 6,
        padZero: true,
        tenantId: defaultTenant?.id || '00000000-0000-0000-0000-000000000000',
      });
    }

    const number = series.nextNumber.toString().padStart(series.numberLength || 6, '0');
    const subNumber = `${series.prefix || 'SUB-'}${number}`;

    await series.increment('nextNumber');

    return subNumber;
  }

  async _generateLicense(subscription, performedBy) {
    const { NumberSeries, Tenant } = require('../../models');
    let series = await NumberSeries.findOne({ where: { seriesName: 'LICENSE' } });

    if (!series) {
      const defaultTenant = await Tenant.findOne({ order: [['createdAt', 'ASC']] });
      series = await NumberSeries.create({
        seriesName: 'LICENSE',
        prefix: 'LIC-',
        nextNumber: 1,
        numberLength: 6,
        padZero: true,
        tenantId: defaultTenant?.id || '00000000-0000-0000-0000-000000000000',
      });
    }

    const number = series.nextNumber.toString().padStart(series.numberLength || 6, '0');
    const licenseNumber = `${series.prefix || 'LIC-'}${number}`;
    await series.increment('nextNumber');

    const plan = await subscriptionPlanRepository.findById(subscription.planId);
    const graceDays = plan ? 7 : 7;

    return await License.create({
      companyId: subscription.companyId,
      subscriptionId: subscription.id,
      licenseNumber,
      licenseKey: `ERP-${licenseNumber}-${require('crypto').randomBytes(8).toString('hex').toUpperCase()}`,
      startDate: subscription.startDate,
      endDate: subscription.endDate || subscription.renewalDate,
      renewalDate: subscription.renewalDate,
      status: 'active',
      gracePeriodDays: graceDays,
      gracePeriodEnd: subscription.endDate
        ? dayjs(subscription.endDate).add(graceDays, 'day').format('YYYY-MM-DD')
        : dayjs(subscription.renewalDate).add(graceDays, 'day').format('YYYY-MM-DD'),
      createdBy: performedBy,
    });
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const { Tenant, User, Payment, BillingInvoice, SubscriptionModule, ModuleUsage } = require('../../models');
    const { Op } = require('sequelize');
    const sequelize = require('../../config/database');

    const totalCustomers = await Tenant.count();
    const totalCompanies = await Tenant.count({ where: { isActive: true } });
    const totalActiveUsers = await User.count({ where: { isActive: true } });

    const activeSubCount = await companySubscriptionRepository.countActive();
    const expiredSubCount = await companySubscriptionRepository.countByStatus('expired');

    const trialCompanies = await companySubscriptionRepository.countByStatus('trial');
    const inactiveCompanies = await Tenant.count({ where: { isActive: false } });

    // Monthly revenue
    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: dayjs().startOf('month').format('YYYY-MM-DD'),
          [Op.lte]: dayjs().endOf('month').format('YYYY-MM-DD'),
        },
      },
    });

    // Annual revenue
    const annualRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: dayjs().startOf('year').format('YYYY-MM-DD'),
          [Op.lte]: dayjs().endOf('year').format('YYYY-MM-DD'),
        },
      },
    });

    // Pending payments
    const pendingPayments = await BillingInvoice.count({
      where: { status: ['draft', 'sent', 'overdue'] },
    });

    // Total modules sold (distinct companies)
    const moduleSoldResult = await CompanySubscriptionModule.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('module_id')), 'moduleId'],
      ],
    });

    // Most used module
    const mostUsedModule = await ModuleUsage.findAll({
      attributes: [
        'moduleId',
        [sequelize.fn('SUM', sequelize.col('access_count')), 'totalAccess'],
      ],
      group: ['moduleId'],
      order: [[sequelize.literal('totalAccess'), 'DESC']],
      limit: 1,
      include: [{
        model: SubscriptionModule,
        as: 'module',
        attributes: ['moduleName', 'moduleCode'],
      }],
    });

    // Recent registrations (last 30 days)
    const recentRegistrations = await Tenant.count({
      where: {
        createdAt: {
          [Op.gte]: dayjs().subtract(30, 'day').toDate(),
        },
      },
    });

    // System health
    const dbStatus = 'healthy';

    return {
      totalCustomers,
      totalCompanies,
      totalActiveUsers,
      activeSubscriptions: activeSubCount || 0,
      monthlyRevenue: monthlyRevenue || 0,
      annualRevenue: annualRevenue || 0,
      expiredSubscriptions: expiredSubCount || 0,
      trialCompanies: trialCompanies || 0,
      inactiveCompanies: inactiveCompanies || 0,
      pendingPayments: pendingPayments || 0,
      modulesSold: moduleSoldResult ? moduleSoldResult.length : 0,
      mostUsedModule: mostUsedModule && mostUsedModule.length > 0
        ? mostUsedModule[0].module?.moduleName || 'N/A'
        : 'N/A',
      systemHealth: dbStatus,
      recentRegistrations: recentRegistrations || 0,
    };
  }
}

module.exports = new CompanySubscriptionService();
