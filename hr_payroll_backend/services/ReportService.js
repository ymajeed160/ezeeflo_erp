const { sequelize } = require('../models');
const { NotFoundError } = require('../utils/appError');

class ReportService {
  async execute(procedureName, params) {
    const paramMap = {
      'sp_employee_report': ['p_tenant_id', 'p_status', 'p_department_id'],
      'sp_attendance_report': ['p_tenant_id', 'p_date_from', 'p_date_to', 'p_employee_id'],
      'sp_payroll_register': ['p_tenant_id', 'p_payroll_run_id'],
      'sp_leave_balance_report': ['p_tenant_id', 'p_year', 'p_employee_id'],
      'sp_overtime_report': ['p_tenant_id', 'p_date_from', 'p_date_to', 'p_employee_id'],
      'sp_department_summary': ['p_tenant_id'],
      'sp_headcount_report': ['p_tenant_id', 'p_as_of_date'],
      'sp_eosb_report': ['p_tenant_id', 'p_date_from', 'p_date_to'],
      'sp_loan_report': ['p_tenant_id', 'p_status'],
      'sp_performance_report': ['p_tenant_id', 'p_employee_id'],
      'sp_training_report': ['p_tenant_id', 'p_course_id'],
    };

    const paramNames = paramMap[procedureName];
    if (!paramNames) throw new NotFoundError(`Unknown report: ${procedureName}`);

    const replacements = {};
    paramNames.forEach(name => {
      // First check if it was passed directly (like p_tenant_id)
      let val = params[name];
      if (val === undefined || val === '') {
        // Try camelCase conversion: employee_id -> employeeId
        const key = name.replace('p_', '');
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        val = params[camelKey];
      }
      replacements[name] = (val === undefined || val === '') ? null : val;
    });

    const results = await sequelize.query(`CALL ${procedureName}(${paramNames.map(n => `:${n}`).join(', ')})`, { replacements });
    return Array.isArray(results) ? results : [];
  }

  async getEmployeeReport(tenantId, params) { return this.execute('sp_employee_report', { ...params, p_tenant_id: tenantId }); }
  async getAttendanceReport(tenantId, params) { return this.execute('sp_attendance_report', { ...params, p_tenant_id: tenantId }); }
  async getPayrollRegister(tenantId, params) { return this.execute('sp_payroll_register', { ...params, p_tenant_id: tenantId }); }
  async getLeaveBalanceReport(tenantId, params) { return this.execute('sp_leave_balance_report', { ...params, p_tenant_id: tenantId }); }
  async getOvertimeReport(tenantId, params) { return this.execute('sp_overtime_report', { ...params, p_tenant_id: tenantId }); }
  async getDepartmentSummary(tenantId, params) { return this.execute('sp_department_summary', { ...params, p_tenant_id: tenantId }); }
  async getHeadcountReport(tenantId, params) { return this.execute('sp_headcount_report', { ...params, p_tenant_id: tenantId }); }
  async getEosbReport(tenantId, params) { return this.execute('sp_eosb_report', { ...params, p_tenant_id: tenantId }); }
  async getLoanReport(tenantId, params) { return this.execute('sp_loan_report', { ...params, p_tenant_id: tenantId }); }
  async getPerformanceReport(tenantId, params) { return this.execute('sp_performance_report', { ...params, p_tenant_id: tenantId }); }
  async getTrainingReport(tenantId, params) { return this.execute('sp_training_report', { ...params, p_tenant_id: tenantId }); }
}

module.exports = new ReportService();
