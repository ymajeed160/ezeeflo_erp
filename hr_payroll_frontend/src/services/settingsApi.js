import hrApi from './hrApi';

const SettingsApi = {
  // General
  getGeneral: () => hrApi.get('/settings/general'),
  updateGeneral: (data) => hrApi.put('/settings/general', data),

  // Company Profile
  getCompanyProfiles: (type) => hrApi.get('/settings/company-profile', { params: type ? { type } : {} }),
  createCompanyProfile: (data) => hrApi.post('/settings/company-profile', data),
  updateCompanyProfile: (id, data) => hrApi.put(`/settings/company-profile/${id}`, data),
  deleteCompanyProfile: (id) => hrApi.delete(`/settings/company-profile/${id}`),

  // Localization
  getLocalization: () => hrApi.get('/settings/localization'),
  updateLocalization: (data) => hrApi.put('/settings/localization', data),

  // Working Hours
  getWorkingHours: () => hrApi.get('/settings/working-hours'),
  updateWorkingHours: (data) => hrApi.put('/settings/working-hours', data),

  // Audit Logs
  getAuditLogs: (params) => hrApi.get('/settings/audit-logs', { params }),

  // Attendance
  getAttendance: () => hrApi.get('/settings/attendance'),
  updateAttendance: (data) => hrApi.put('/settings/attendance', data),

  // Leave
  getLeave: () => hrApi.get('/settings/leave'),
  updateLeave: (data) => hrApi.put('/settings/leave', data),

  // Payroll
  getPayroll: () => hrApi.get('/settings/payroll'),
  updatePayroll: (data) => hrApi.put('/settings/payroll', data),

  // Security
  getSecurity: () => hrApi.get('/settings/security'),
  updateSecurity: (data) => hrApi.put('/settings/security', data),

  // Email
  getEmail: () => hrApi.get('/settings/email'),
  updateEmail: (data) => hrApi.put('/settings/email', data),

  // SMS
  getSms: () => hrApi.get('/settings/sms'),
  updateSms: (data) => hrApi.put('/settings/sms', data),

  // Notifications
  getNotifications: () => hrApi.get('/settings/notifications'),
  updateNotifications: (data) => hrApi.put('/settings/notifications', data),
};

export default SettingsApi;
