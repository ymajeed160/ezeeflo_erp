const companyService = require('../services/CompanyService');
const { CompanySubscription, CompanySubscriptionModule, SubscriptionModule } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class CompanyController {
  /**
   * GET /api/companies
   * Returns all companies assigned to the logged-in user
   */
  async getUserCompanies(req, res, next) {
    try {
      const companies = await companyService.getUserCompanies(req.user.id);
      return ApiResponse.success(res, { data: companies });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/current
   * Returns the current active company info
   */
  async getCurrentCompany(req, res, next) {
    try {
      const { companyId } = req;
      if (!companyId) {
        return ApiResponse.badRequest(res, { message: 'No active company selected' });
      }
      const company = await companyService.getCompanyById(companyId, req.user.id);
      return ApiResponse.success(res, { data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/:id
   * Returns a specific company (user must have access)
   */
  async getCompanyById(req, res, next) {
    try {
      const company = await companyService.getCompanyById(req.params.id, req.user.id);
      return ApiResponse.success(res, { data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/companies
   * Create a new company
   */
  async createCompany(req, res, next) {
    try {
      const company = await companyService.createCompany(req.body, req.user.id);
      return ApiResponse.success(res, {
        data: company,
        message: 'Company created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/companies/:id
   * Update a company
   */
  async updateCompany(req, res, next) {
    try {
      const company = await companyService.updateCompany(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, {
        data: company,
        message: 'Company updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies/enabled-modules
   * Returns enabled subscription module codes for the active company
   */
  async getEnabledModules(req, res, next) {
    try {
      const { companyId } = req;
      if (!companyId) {
        return ApiResponse.badRequest(res, { message: 'No active company' });
      }

      const subscription = await CompanySubscription.findOne({
        where: { companyId, status: ['active', 'trial'] },
        include: [{
          model: CompanySubscriptionModule,
          as: 'enabledModules',
          where: { isEnabled: true },
          required: false,
          include: [{ model: SubscriptionModule, as: 'module' }],
        }],
        order: [['createdAt', 'DESC']],
      });

      if (!subscription) {
        const allModules = await SubscriptionModule.findAll({
          where: { status: 'enabled' },
          attributes: ['moduleCode'],
          order: [['sortOrder', 'ASC']],
        });
        return ApiResponse.success(res, { data: allModules.map(m => m.moduleCode) });
      }

      const enabledCodes = (subscription.enabledModules || [])
        .filter(em => em.module)
        .map(em => em.module.moduleCode);

      return ApiResponse.success(res, { data: enabledCodes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/companies/select
   * Select/switch active company
   */
  async selectCompany(req, res, next) {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        return ApiResponse.badRequest(res, { message: 'Company ID is required' });
      }
      const company = await companyService.selectCompany(companyId, req.user.id);
      return ApiResponse.success(res, {
        data: company,
        message: 'Company selected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/companies/switch
   * Switch to a different company (alias for select)
   */
  async switchCompany(req, res, next) {
    try {
      // Read companyId from body first, fall back to query param (proxy-safe)
      const companyId = req.body.companyId || req.query.companyId;
      if (!companyId) {
        return ApiResponse.badRequest(res, { message: 'Company ID is required' });
      }
      const company = await companyService.selectCompany(companyId, req.user.id);
      logger.info(`[SWITCH] User ${req.user.id} switched to company ${companyId}`);
      return ApiResponse.success(res, {
        data: company,
        message: 'Company switched successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();
