const reportService = require('../services/ReportService');
const ApiResponse = require('../utils/apiResponse');

const reportNames = [
  { key: 'employee', method: 'getEmployeeReport', label: 'Employee Report' },
  { key: 'attendance', method: 'getAttendanceReport', label: 'Attendance Report' },
  { key: 'payroll', method: 'getPayrollRegister', label: 'Payroll Register' },
  { key: 'leaveBalance', method: 'getLeaveBalanceReport', label: 'Leave Balance' },
  { key: 'overtime', method: 'getOvertimeReport', label: 'Overtime Report' },
  { key: 'department', method: 'getDepartmentSummary', label: 'Department Summary' },
  { key: 'headcount', method: 'getHeadcountReport', label: 'Headcount' },
  { key: 'eosb', method: 'getEosbReport', label: 'EOSB Report' },
  { key: 'loan', method: 'getLoanReport', label: 'Loan Report' },
  { key: 'performance', method: 'getPerformanceReport', label: 'Performance Report' },
  { key: 'training', method: 'getTrainingReport', label: 'Training Report' },
];

class ReportController {
  async generate(req, res, next) {
    try {
      const { reportType } = req.params;
      const report = reportNames.find(r => r.key === reportType);
      if (!report) return ApiResponse.badRequest(res, { message: `Unknown report type: ${reportType}. Available: ${reportNames.map(r => r.key).join(', ')}` });

      const data = await reportService[report.method](req.tenantId, req.query);
      const rows = data || [];
      return ApiResponse.success(res, { data: rows, message: `${report.label} generated successfully`, meta: { reportType, totalRows: rows.length } });
    } catch (e) { next(e); }
  }

  async listReports(req, res, next) {
    try {
      return ApiResponse.success(res, { data: reportNames.map(r => ({ key: r.key, label: r.label })) });
    } catch (e) { next(e); }
  }
}

module.exports = new ReportController();
