const { Op } = require('sequelize');
const { Employee, Department, Designation, Branch, CostCenter, EmployeeDocument } = require('../models');

class EmployeeRepository {

  /**
   * Find all employees with pagination, filters, and search.
   */
  async findAll({ tenantId, query = {} }) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      departmentId,
      designationId,
      branchId,
      costCenterId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId, deletedAt: null };

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (branchId) where.branchId = branchId;
    if (costCenterId) where.costCenterId = costCenterId;

    if (search) {
      where[Op.or] = [
        { employeeCode: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { workEmail: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
        { passportNumber: { [Op.like]: `%${search}%` } },
        { emiratesId: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'code', 'name'], required: false },
        { model: Designation, as: 'designation', attributes: ['id', 'code', 'name'], required: false },
        { model: Branch, as: 'branch', attributes: ['id', 'code', 'name'], required: false },
        { model: CostCenter, as: 'costCenter', attributes: ['id', 'code', 'name'], required: false },
        { model: Employee, as: 'reportingManager', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit: parseInt(limit),
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  /**
   * Find employee by ID with all associations.
   */
  async findById(id, tenantId) {
    return Employee.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Department, as: 'department',
          attributes: ['id', 'code', 'name', 'nameAr'],
          required: false,
        },
        {
          model: Designation, as: 'designation',
          attributes: ['id', 'code', 'name', 'nameAr'],
          required: false,
        },
        {
          model: Branch, as: 'branch',
          attributes: ['id', 'code', 'name', 'nameAr'],
          required: false,
        },
        {
          model: CostCenter, as: 'costCenter',
          attributes: ['id', 'code', 'name'],
          required: false,
        },
        {
          model: Employee, as: 'reportingManager',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: Employee, as: 'subordinates',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: EmployeeDocument, as: 'documents',
          attributes: ['id', 'documentType', 'title', 'fileName', 'filePath', 'issueDate', 'expiryDate'],
          required: false,
          separate: true,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
  }

  /**
   * Find employee by code for uniqueness check.
   */
  async findByCode(employeeCode, tenantId, excludeId = null) {
    const where = { employeeCode, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Employee.findOne({ where, paranoid: false });
  }

  /**
   * Create a new employee.
   */
  async create(data) {
    return Employee.create(data);
  }

  /**
   * Update an employee.
   */
  async update(id, tenantId, data) {
    const employee = await Employee.findOne({ where: { id, tenantId } });
    if (!employee) return null;
    return employee.update(data);
  }

  /**
   * Soft delete an employee.
   */
  async delete(id, tenantId) {
    const employee = await Employee.findOne({ where: { id, tenantId } });
    if (!employee) return null;
    return employee.destroy();
  }

  /**
   * Get next employee code (auto-numbering).
   */
  async getNextEmployeeCode(tenantId) {
    const lastEmployee = await Employee.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC'], ['employeeCode', 'DESC']],
      paranoid: false,
    });

    if (!lastEmployee || !lastEmployee.employeeCode) {
      return 'EMP-000001';
    }

    const match = lastEmployee.employeeCode.match(/EMP-(\d+)/);
    if (!match) return 'EMP-000001';

    const nextNum = parseInt(match[1]) + 1;
    return `EMP-${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Count employees by status for dashboard.
   */
  async countByStatus(tenantId) {
    const counts = await Employee.findAll({
      where: { tenantId },
      attributes: ['status', [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      onLeave: 0,
      terminated: 0,
    };

    counts.forEach(item => {
      result.total += parseInt(item.count);
      switch (item.status) {
        case 'Active': result.active = parseInt(item.count); break;
        case 'Inactive': result.inactive = parseInt(item.count); break;
        case 'On Leave': result.onLeave = parseInt(item.count); break;
        case 'Terminated':
        case 'Resigned':
        case 'Retired':
          result.terminated += parseInt(item.count);
          break;
      }
    });

    return result;
  }

  /**
   * Get employees with upcoming birthday within N days.
   */
  async getUpcomingBirthdays(tenantId, days = 7) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;
    const futureStr = `${future.getMonth() + 1}-${future.getDate()}`;

    return Employee.findAll({
      where: {
        tenantId,
        status: 'Active',
        dateOfBirth: { [Op.ne]: null },
      },
      attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'dateOfBirth', 'photo'],
      order: [['dateOfBirth', 'ASC']],
    }).then(employees => {
      return employees.filter(emp => {
        if (!emp.dateOfBirth) return false;
        const dob = new Date(emp.dateOfBirth);
        const dobStr = `${dob.getMonth() + 1}-${dob.getDate()}`;
        return dobStr >= todayStr && dobStr <= futureStr;
      });
    });
  }

  /**
   * Get employees with upcoming contract expiry within N days.
   */
  async getUpcomingContractExpiry(tenantId, days = 30) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    return Employee.findAll({
      where: {
        tenantId,
        status: 'Active',
        contractEndDate: {
          [Op.between]: [today.toISOString().split('T')[0], future.toISOString().split('T')[0]],
        },
      },
      attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'contractEndDate', 'photo'],
      order: [['contractEndDate', 'ASC']],
    });
  }

  /**
   * Get employee distribution by department for charts.
   */
  async getDistributionByDepartment(tenantId) {
    const { sequelize } = Employee;
    const [results] = await sequelize.query(
      `SELECT d.name as department, COUNT(e.id) as count
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL
       WHERE e.tenant_id = :tenantId AND e.deleted_at IS NULL AND e.status = 'Active'
       GROUP BY d.id, d.name
       ORDER BY count DESC`,
      { replacements: { tenantId } }
    );
    return results;
  }
}

module.exports = new EmployeeRepository();
