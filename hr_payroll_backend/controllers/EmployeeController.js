const employeeService = require('../services/EmployeeService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class EmployeeController {

  /**
   * GET /api/hr/employees
   * List employees with pagination and filters.
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const result = await employeeService.getAll(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.data,
        pagination: result.pagination,
        message: 'Employees retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/employees/:id
   * Get employee detail by ID.
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const employee = await employeeService.getById(id, tenantId);
      return ApiResponse.success(res, {
        data: employee,
        message: 'Employee retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/hr/employees
   * Create a new employee.
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const authToken = req.headers.authorization;
      const employee = await employeeService.create(req.body, tenantId, userId, authToken);
      return ApiResponse.created(res, {
        data: employee,
        message: 'Employee created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/hr/employees/:id
   * Update an existing employee.
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const authToken = req.headers.authorization;
      const employee = await employeeService.update(id, req.body, tenantId, userId, authToken);
      return ApiResponse.success(res, {
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/hr/employees/:id
   * Soft delete an employee.
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const authToken = req.headers.authorization;
      const result = await employeeService.delete(id, tenantId, userId, authToken);
      return ApiResponse.success(res, {
        data: result,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/employees/me
   * Get current user's employee profile — matched by email or name.
   */
  async getMe(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { User, Employee } = require('../models');
      const { Op } = require('sequelize');

      const user = await User.findByPk(req.userId, { attributes: ['id', 'email', 'firstName', 'lastName'] });
      if (!user) return ApiResponse.success(res, { data: null, message: 'User not found' });

      // Match employee by email
      let emp = null;
      if (user.email) {
        emp = await employeeService.getAll(tenantId, {
          limit: 1,
          search: user.email,
        });
        // The service's search may not hit email, so also try direct lookup
        if (!emp?.data?.length) {
          emp = await Employee.findOne({
            where: {
              tenantId,
              [Op.or]: [{ workEmail: user.email }, { personalEmail: user.email }],
            },
          });
          if (emp) emp = { data: [emp] };
        }
      }

      // Fallback: match by name
      if ((!emp || !emp.data?.length) && user.firstName && user.lastName) {
        emp = await Employee.findOne({
          where: { tenantId, firstName: user.firstName, lastName: user.lastName },
        });
        if (emp) emp = { data: [emp] };
      }

      const employees = emp?.data || [];
      return ApiResponse.success(res, {
        data: employees[0] || null,
        message: employees.length ? 'Employee found' : 'No employee profile linked',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/employees/directory
   * Get company directory (all active employees).
   */
  async getDirectory(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const result = await employeeService.getAll(tenantId, { limit: 200, ...req.query });
      return ApiResponse.paginated(res, {
        data: result.data,
        pagination: result.pagination,
        message: 'Directory retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new EmployeeController();
