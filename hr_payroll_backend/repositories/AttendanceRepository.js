const { Op } = require('sequelize');
const { Attendance, Employee, Shift } = require('../models');

class AttendanceRepository {

  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, search = '', employeeId, status, dateFrom, dateTo, departmentId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (dateFrom && dateTo) {
      where.attendanceDate = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.attendanceDate = dateFrom;
    }

    const empWhere = {};
    if (search) { empWhere[Op.or] = [{ firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } }, { employeeCode: { [Op.like]: `%${search}%` } }]; }
    if (departmentId) empWhere.departmentId = departmentId;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], where: Object.keys(empWhere).length > 0 ? empWhere : undefined, required: true },
        { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime'], required: false },
      ],
      order: [['attendanceDate', 'DESC'], ['checkInTime', 'ASC']],
      offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }

  async findById(id, tenantId) {
    return Attendance.findOne({
      where: { id, tenantId },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
        { model: Shift, as: 'shift', attributes: ['id', 'code', 'name', 'startTime', 'endTime'], required: false },
      ],
    });
  }

  async findByDate(employeeId, attendanceDate, tenantId) {
    return Attendance.findOne({ where: { employeeId, attendanceDate, tenantId } });
  }

  async create(data) { return Attendance.create(data); }
  async update(id, tenantId, data) { const a = await Attendance.findOne({ where: { id, tenantId } }); if (!a) return null; return a.update(data); }
  async delete(id, tenantId) { const a = await Attendance.findOne({ where: { id, tenantId } }); if (!a) return null; return a.destroy(); }

  /**
   * Get today's attendance summary for dashboard.
   */
  async getTodaySummary(tenantId) {
    const today = new Date().toISOString().split('T')[0];
    const { sequelize } = Attendance;

    const [statusRows] = await sequelize.query(
      `SELECT status, COUNT(*) as count FROM attendances
       WHERE tenant_id = :tenantId AND attendance_date = :today AND deleted_at IS NULL
       GROUP BY status`,
      { replacements: { tenantId, today } }
    );

    const summary = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
    statusRows.forEach(r => {
      summary.total += r.count;
      if (r.status === 'Present') summary.present = r.count;
      if (r.status === 'Absent') summary.absent = r.count;
      if (r.status === 'Late') summary.late = r.count;
      if (r.status === 'Half Day') summary.halfDay = r.count;
    });

    const [lateEmployees] = await sequelize.query(
      `SELECT e.id, e.employee_code as employeeCode, e.first_name as firstName, e.last_name as lastName, a.late_minutes as lateMinutes
       FROM attendances a JOIN employees e ON e.id = a.employee_id
       WHERE a.tenant_id = :tenantId AND a.attendance_date = :today AND a.status = 'Late' AND a.deleted_at IS NULL
       LIMIT 10`,
      { replacements: { tenantId, today } }
    );

    return { ...summary, lateEmployees };
  }

  /**
   * Bulk create attendance for multiple employees.
   */
  async bulkCreate(records) {
    return Attendance.bulkCreate(records, { updateOnDuplicate: ['check_in_time', 'check_out_time', 'status', 'late_minutes', 'total_worked_minutes', 'overtime_minutes', 'updated_at'] });
  }
}

module.exports = new AttendanceRepository();
