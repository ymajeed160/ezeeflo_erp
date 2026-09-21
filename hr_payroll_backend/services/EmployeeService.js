const employeeRepository = require('../repositories/EmployeeRepository');
const EmployeeDTO = require('../dto/EmployeeDTO');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');
const erpIntegration = require('../../shared/services/erpIntegration');

class EmployeeService {

  /**
   * List employees with pagination, search, and filters.
   */
  async getAll(tenantId, query) {
    const result = await employeeRepository.findAll({ tenantId, query });
    result.data = EmployeeDTO.toListResponse(result.data);
    return result;
  }

  /**
   * Get employee by ID with full details.
   */
  async getById(id, tenantId) {
    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    return EmployeeDTO.toDetailResponse(employee);
  }

  /**
   * Create a new employee.
   */
  async create(data, tenantId, userId, authToken) {
    const sanitizedData = EmployeeDTO.sanitizeInput(data);

    // Auto-generate employee code if not provided
    if (!sanitizedData.employeeCode) {
      sanitizedData.employeeCode = await employeeRepository.getNextEmployeeCode(tenantId);
    }

    // Check code uniqueness
    const existing = await employeeRepository.findByCode(sanitizedData.employeeCode, tenantId);
    if (existing) {
      throw new ConflictError(`Employee with code '${sanitizedData.employeeCode}' already exists`);
    }

    const createData = {
      ...sanitizedData,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    };

    const employee = await employeeRepository.create(createData);

    // Audit trail via ERP
    await erpIntegration.sendAuditEvent(authToken, {
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Employee',
      entityId: employee.id,
      newValues: {
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      description: `Employee ${employee.employeeCode} - ${employee.firstName} ${employee.lastName} created`,
    });

    logger.info(`Employee created: ${employee.employeeCode} by user ${userId} in tenant ${tenantId}`);
    return EmployeeDTO.toDetailResponse(employee);
  }

  /**
   * Update an existing employee.
   */
  async update(id, data, tenantId, userId, authToken) {
    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const sanitizedData = EmployeeDTO.sanitizeInput(data);

    // Check code uniqueness if changing
    if (sanitizedData.employeeCode && sanitizedData.employeeCode !== employee.employeeCode) {
      const existing = await employeeRepository.findByCode(sanitizedData.employeeCode, tenantId, id);
      if (existing) {
        throw new ConflictError(`Employee with code '${sanitizedData.employeeCode}' already exists`);
      }
    }

    const oldValues = {
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      status: employee.status,
      departmentId: employee.departmentId,
      designationId: employee.designationId,
    };

    const updateData = { ...sanitizedData, updatedBy: userId };
    const updated = await employeeRepository.update(id, tenantId, updateData);

    // Audit trail via ERP
    const newValues = {
      employeeCode: updated.employeeCode,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status,
      departmentId: updated.departmentId,
      designationId: updated.designationId,
    };

    await erpIntegration.sendAuditEvent(authToken, {
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Employee',
      entityId: updated.id,
      oldValues,
      newValues,
      description: `Employee ${updated.employeeCode} updated`,
    });

    logger.info(`Employee updated: ${updated.employeeCode} by user ${userId}`);

    // Re-fetch with associations
    const refreshed = await employeeRepository.findById(id, tenantId);
    return EmployeeDTO.toDetailResponse(refreshed);
  }

  /**
   * Soft delete an employee.
   */
  async delete(id, tenantId, userId, authToken) {
    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    await employeeRepository.delete(id, tenantId);

    // Audit trail via ERP
    await erpIntegration.sendAuditEvent(authToken, {
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Employee',
      entityId: id,
      oldValues: {
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      description: `Employee ${employee.employeeCode} - ${employee.firstName} ${employee.lastName} deleted`,
    });

    logger.info(`Employee deleted: ${employee.employeeCode} by user ${userId}`);
    return { success: true };
  }

  /**
   * Get dashboard summary data.
   */
  async getDashboardSummary(tenantId) {
    const statusCounts = await employeeRepository.countByStatus(tenantId);
    const birthdays = await employeeRepository.getUpcomingBirthdays(tenantId, 7);
    const contractExpiry = await employeeRepository.getUpcomingContractExpiry(tenantId, 30);
    const deptDistribution = await employeeRepository.getDistributionByDepartment(tenantId);

    return {
      totalEmployees: statusCounts.total,
      activeEmployees: statusCounts.active,
      inactiveEmployees: statusCounts.inactive,
      onLeaveEmployees: statusCounts.onLeave,
      terminatedEmployees: statusCounts.terminated,
      upcomingBirthdays: birthdays.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        dateOfBirth: emp.dateOfBirth,
        photo: emp.photo,
      })),
      upcomingContractExpiry: contractExpiry.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        contractEndDate: emp.contractEndDate,
        photo: emp.photo,
      })),
      departmentDistribution: deptDistribution,
    };
  }
}

module.exports = new EmployeeService();
