const assetService = require('../services/EmployeeAssetService');
const ApiResponse = require('../utils/apiResponse');

class EmployeeAssetController {
  async getAll(req, res, next) {
    try {
      const r = await assetService.getAll(req.tenantId, req.query);
      return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination });
    } catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const d = await assetService.getById(req.params.id, req.tenantId);
      return ApiResponse.success(res, { data: d });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const d = await assetService.create(req.body, req.tenantId, req.userId);
      return ApiResponse.created(res, { data: d, message: 'Asset assigned successfully' });
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const d = await assetService.update(req.params.id, req.body, req.tenantId, req.userId);
      return ApiResponse.success(res, { data: d, message: 'Asset updated successfully' });
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      const r = await assetService.delete(req.params.id, req.tenantId);
      return ApiResponse.success(res, { data: r, message: 'Asset deleted successfully' });
    } catch (e) { next(e); }
  }

  async getByEmployee(req, res, next) {
    try {
      const r = await assetService.getByEmployee(req.params.employeeId, req.tenantId);
      return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination });
    } catch (e) { next(e); }
  }

  // GET /api/hr/employee-assets/me — for mobile app
  async getMyAssets(req, res, next) {
    try {
      const { Employee, User, UserCompany } = require('../models');

      // Find the employee linked to the authenticated user
      const user = await User.findByPk(req.userId, { attributes: ['id', 'email', 'firstName', 'lastName'] });
      if (!user) return ApiResponse.success(res, { data: [], message: 'User not found' });

      // Match employee by email (workEmail or personalEmail) or by name fallback
      let emp = null;
      if (user.email) {
        emp = await Employee.findOne({
          where: {
            tenantId: req.tenantId,
            [require('sequelize').Op.or]: [{ workEmail: user.email }, { personalEmail: user.email }],
          },
        });
      }

      // Fallback: match by name
      if (!emp && user.firstName && user.lastName) {
        emp = await Employee.findOne({
          where: {
            tenantId: req.tenantId,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      }

      if (!emp) return ApiResponse.success(res, { data: [], message: 'No employee profile found' });

      const r = await assetService.getByEmployee(emp.id, req.tenantId);
      return ApiResponse.success(res, { data: r.data });
    } catch (e) { next(e); }
  }
}

module.exports = new EmployeeAssetController();
