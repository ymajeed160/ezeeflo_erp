const { Op } = require('sequelize');
const { LeaveApplication, Employee, LeaveType, LeaveApproval } = require('../models');

class LeaveApplicationRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', employeeId, status, leaveTypeId, dateFrom, dateTo } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (dateFrom && dateTo) { where.startDate = { [Op.lte]: dateTo }; where.endDate = { [Op.gte]: dateFrom }; }
    const empWhere = {};
    if (search) empWhere[Op.or] = [{ firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } }, { employeeCode: { [Op.like]: `%${search}%` } }];
    const { count, rows } = await LeaveApplication.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], where: Object.keys(empWhere).length > 0 ? empWhere : undefined, required: true },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'code', 'name', 'leaveCategory', 'isPaid'], required: false },
        { model: LeaveApproval, as: 'approvals', attributes: ['id', 'approverId', 'approvalLevel', 'status', 'comments', 'decidedAt'], required: false, separate: true },
      ],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) {
    return LeaveApplication.findOne({
      where: { id, tenantId },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
        { model: LeaveType, as: 'leaveType', required: false },
        { model: LeaveApproval, as: 'approvals', required: false, separate: true, order: [['approvalLevel', 'ASC']] },
      ],
    });
  }
  async create(data) { return LeaveApplication.create(data); }
  async update(id, tenantId, data) { const l = await LeaveApplication.findOne({ where: { id, tenantId } }); if (!l) return null; return l.update(data); }
  async delete(id, tenantId) { const l = await LeaveApplication.findOne({ where: { id, tenantId } }); if (!l) return null; return l.destroy(); }

  async getNextApplicationNumber(tenantId) {
    const last = await LeaveApplication.findOne({ where: { tenantId }, order: [['createdAt', 'DESC']], paranoid: false });
    if (!last?.applicationNumber) return 'LA-000001';
    const match = last.applicationNumber.match(/LA-(\d+)/);
    return match ? `LA-${String(parseInt(match[1]) + 1).padStart(6, '0')}` : 'LA-000001';
  }

  async countByStatus(tenantId, employeeId = null) {
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    const rows = await LeaveApplication.findAll({ where, attributes: ['status', [LeaveApplication.sequelize.fn('COUNT', 'id'), 'count']], group: ['status'], raw: true });
    const result = { submitted: 0, approved: 0, rejected: 0, total: 0 };
    rows.forEach(r => { result.total += parseInt(r.count); if (r.status === 'Submitted') result.submitted = parseInt(r.count); if (r.status === 'Approved') result.approved = parseInt(r.count); if (r.status === 'Rejected') result.rejected = parseInt(r.count); });
    return result;
  }
}

module.exports = new LeaveApplicationRepository();
