const { GeneralSetting, CompanyProfile, LocalizationSetting, WorkingHourSetting, AttendanceSetting, LeaveSetting, PayrollSetting, SecuritySetting, EmailSetting, SmsSetting, NotificationSetting, SettingsAuditLog } = require('../models/Settings');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Audit Helper ──
const audit = async (req, module, section, action, fieldName, oldValue, newValue) => {
  try {
    await SettingsAuditLog.create({
      tenantId: req.tenantId,
      userId: req.userId,
      username: req.user?.username || 'system',
      module,
      section,
      fieldName: fieldName || null,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      action,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });
  } catch (e) {
    logger.warn('Audit log failed:', e.message);
  }
};

// ═══════════════════════════════════════════
// GENERAL SETTINGS
// ═══════════════════════════════════════════
const getGeneralSettings = async (req, res) => {
  try {
    let settings = await GeneralSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await GeneralSetting.create({ tenantId: req.tenantId, createdBy: req.userId });
    }
    return ApiResponse.success(res, { data: settings });
  } catch (e) {
    logger.error('Get general settings:', e);
    return ApiResponse.error(res, { message: e.message });
  }
};

const updateGeneralSettings = async (req, res) => {
  try {
    let settings = await GeneralSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await GeneralSetting.create({ tenantId: req.tenantId, ...req.body, createdBy: req.userId });
      await audit(req, 'Settings', 'General', 'create', null, null, req.body);
    } else {
      const old = { ...settings.dataValues };
      await settings.update({ ...req.body, updatedBy: req.userId });
      await audit(req, 'Settings', 'General', 'update', null, old, req.body);
    }
    return ApiResponse.success(res, { data: settings, message: 'Settings saved' });
  } catch (e) {
    logger.error('Update general settings:', e);
    return ApiResponse.error(res, { message: e.message });
  }
};

// ═══════════════════════════════════════════
// COMPANY PROFILE
// ═══════════════════════════════════════════
const getCompanyProfiles = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { tenantId: req.tenantId };
    if (type) where.profileType = type;
    const items = await CompanyProfile.findAll({ where, order: [['sortOrder', 'ASC']] });
    return ApiResponse.success(res, { data: items });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

const createCompanyProfile = async (req, res) => {
  try {
    const item = await CompanyProfile.create({ ...req.body, tenantId: req.tenantId, createdBy: req.userId });
    await audit(req, 'Settings', 'CompanyProfile', 'create', null, null, req.body);
    return ApiResponse.created(res, { data: item, message: 'Created' });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const item = await CompanyProfile.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res, { message: 'Not found' });
    const old = { ...item.dataValues };
    await item.update({ ...req.body, updatedBy: req.userId });
    await audit(req, 'Settings', 'CompanyProfile', 'update', null, old, req.body);
    return ApiResponse.success(res, { data: item, message: 'Updated' });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

const deleteCompanyProfile = async (req, res) => {
  try {
    const item = await CompanyProfile.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res, { message: 'Not found' });
    await audit(req, 'Settings', 'CompanyProfile', 'delete', null, item.dataValues, null);
    await item.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

// ═══════════════════════════════════════════
// LOCALIZATION
// ═══════════════════════════════════════════
const getLocalization = async (req, res) => {
  try {
    let settings = await LocalizationSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await LocalizationSetting.create({ tenantId: req.tenantId, createdBy: req.userId });
    }
    return ApiResponse.success(res, { data: settings });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

const updateLocalization = async (req, res) => {
  try {
    let settings = await LocalizationSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await LocalizationSetting.create({ tenantId: req.tenantId, ...req.body, createdBy: req.userId });
      await audit(req, 'Settings', 'Localization', 'create', null, null, req.body);
    } else {
      const old = { ...settings.dataValues };
      await settings.update({ ...req.body, updatedBy: req.userId });
      await audit(req, 'Settings', 'Localization', 'update', null, old, req.body);
    }
    return ApiResponse.success(res, { data: settings, message: 'Saved' });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

// ═══════════════════════════════════════════
// WORKING HOURS
// ═══════════════════════════════════════════
const getWorkingHours = async (req, res) => {
  try {
    let settings = await WorkingHourSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await WorkingHourSetting.create({ tenantId: req.tenantId, createdBy: req.userId });
    }
    return ApiResponse.success(res, { data: settings });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

const updateWorkingHours = async (req, res) => {
  try {
    let settings = await WorkingHourSetting.findOne({ where: { tenantId: req.tenantId } });
    if (!settings) {
      settings = await WorkingHourSetting.create({ tenantId: req.tenantId, ...req.body, createdBy: req.userId });
      await audit(req, 'Settings', 'WorkingHours', 'create', null, null, req.body);
    } else {
      const old = { ...settings.dataValues };
      await settings.update({ ...req.body, updatedBy: req.userId });
      await audit(req, 'Settings', 'WorkingHours', 'update', null, old, req.body);
    }
    return ApiResponse.success(res, { data: settings, message: 'Saved' });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

// ═══════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, module, section } = req.query;
    const where = { tenantId: req.tenantId };
    if (module) where.module = module;
    if (section) where.section = section;
    const { count, rows } = await SettingsAuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) } } });
  } catch (e) {
    return ApiResponse.error(res, { message: e.message });
  }
};

// ═══ GENERIC SETTINGS HELPER ═══
const makeSettingHandlers = (Model, section) => {
  const getter = async (req, res) => {
    try {
      let settings = await Model.findOne({ where: { tenantId: req.tenantId } });
      if (!settings) settings = await Model.create({ tenantId: req.tenantId, createdBy: req.userId });
      return ApiResponse.success(res, { data: settings });
    } catch (e) { return ApiResponse.error(res, { message: e.message }); }
  };
  const setter = async (req, res) => {
    try {
      let settings = await Model.findOne({ where: { tenantId: req.tenantId } });
      if (!settings) {
        settings = await Model.create({ tenantId: req.tenantId, ...req.body, createdBy: req.userId });
        await audit(req, 'Settings', section, 'create', null, null, req.body);
      } else {
        const old = { ...settings.dataValues };
        await settings.update({ ...req.body, updatedBy: req.userId });
        await audit(req, 'Settings', section, 'update', null, old, req.body);
      }
      return ApiResponse.success(res, { data: settings, message: 'Saved' });
    } catch (e) { return ApiResponse.error(res, { message: e.message }); }
  };
  return { getter, setter };
};

const att = makeSettingHandlers(AttendanceSetting, 'Attendance');
const lv = makeSettingHandlers(LeaveSetting, 'Leave');
const pr = makeSettingHandlers(PayrollSetting, 'Payroll');
const sec = makeSettingHandlers(SecuritySetting, 'Security');
const em = makeSettingHandlers(EmailSetting, 'Email');
const sm = makeSettingHandlers(SmsSetting, 'SMS');
const nf = makeSettingHandlers(NotificationSetting, 'Notifications');

module.exports = {
  getGeneralSettings, updateGeneralSettings,
  getCompanyProfiles, createCompanyProfile, updateCompanyProfile, deleteCompanyProfile,
  getLocalization, updateLocalization,
  getWorkingHours, updateWorkingHours,
  getAttendanceSettings: att.getter, updateAttendanceSettings: att.setter,
  getLeaveSettings: lv.getter, updateLeaveSettings: lv.setter,
  getPayrollSettings: pr.getter, updatePayrollSettings: pr.setter,
  getSecuritySettings: sec.getter, updateSecuritySettings: sec.setter,
  getEmailSettings: em.getter, updateEmailSettings: em.setter,
  getSmsSettings: sm.getter, updateSmsSettings: sm.setter,
  getNotificationSettings: nf.getter, updateNotificationSettings: nf.setter,
  getAuditLogs,
};
