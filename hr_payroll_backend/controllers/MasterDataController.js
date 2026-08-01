const { MasterCountry, MasterState, MasterCity, MasterData, MasterDataAudit } = require('../models/MasterData');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const audit = async (req, recordId, recordType, action, oldVal, newVal) => {
  try {
    await MasterDataAudit.create({
      tenantId: req.tenantId, recordId, recordType, action,
      userId: req.userId, username: req.user?.username || 'system',
      oldValue: oldVal ? JSON.stringify(oldVal) : null,
      newValue: newVal ? JSON.stringify(newVal) : null,
      ipAddress: req.ip,
    });
  } catch (e) { logger.warn('Master audit failed:', e.message); }
};

// ═══════ COUNTRIES ═══════
const getCountries = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const where = { tenantId: req.tenantId };
    if (search) where.name = { [require('sequelize').Op.like]: `%${search}%` };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const { count, rows } = await MasterCountry.findAndCountAll({ where, order: [['sortOrder', 'ASC']], limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit) });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count/limit) } } });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const getCountry = async (req, res) => {
  try {
    const item = await MasterCountry.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    return item ? ApiResponse.success(res, { data: item }) : ApiResponse.notFound(res);
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const createCountry = async (req, res) => {
  try {
    const item = await MasterCountry.create({ ...req.body, tenantId: req.tenantId, createdBy: req.userId });
    await audit(req, item.id, 'country', 'create', null, req.body);
    return ApiResponse.created(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const updateCountry = async (req, res) => {
  try {
    const item = await MasterCountry.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    const old = { ...item.dataValues };
    await item.update({ ...req.body, updatedBy: req.userId });
    await audit(req, item.id, 'country', 'update', old, req.body);
    return ApiResponse.success(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const deleteCountry = async (req, res) => {
  try {
    const item = await MasterCountry.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    await audit(req, item.id, 'country', 'delete', item.dataValues, null);
    await item.update({ deletedBy: req.userId });
    await item.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

// ═══════ STATES ═══════
const getStates = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, countryId } = req.query;
    const where = { tenantId: req.tenantId };
    if (search) where.name = { [require('sequelize').Op.like]: `%${search}%` };
    if (countryId) where.countryId = countryId;
    const { count, rows } = await MasterState.findAndCountAll({
      where, include: [{ model: MasterCountry, as: 'country', attributes: ['id', 'code', 'name'] }],
      order: [['sortOrder', 'ASC']], limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
    });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count/limit) } } });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const createState = async (req, res) => {
  try {
    const item = await MasterState.create({ ...req.body, tenantId: req.tenantId, createdBy: req.userId });
    await audit(req, item.id, 'state', 'create', null, req.body);
    return ApiResponse.created(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const updateState = async (req, res) => {
  try {
    const item = await MasterState.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    const old = { ...item.dataValues };
    await item.update({ ...req.body, updatedBy: req.userId });
    await audit(req, item.id, 'state', 'update', old, req.body);
    return ApiResponse.success(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const deleteState = async (req, res) => {
  try {
    const item = await MasterState.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    await audit(req, item.id, 'state', 'delete', item.dataValues, null);
    await item.update({ deletedBy: req.userId });
    await item.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

// ═══════ CITIES ═══════
const getCities = async (req, res) => {
  try {
    const { page = 1, limit = 200, search, countryId, stateId } = req.query;
    const where = { tenantId: req.tenantId };
    if (search) where.name = { [require('sequelize').Op.like]: `%${search}%` };
    if (countryId) where.countryId = countryId;
    if (stateId) where.stateId = stateId;
    const { count, rows } = await MasterCity.findAndCountAll({
      where, include: [
        { model: MasterCountry, as: 'country', attributes: ['id', 'code', 'name'] },
        { model: MasterState, as: 'state', attributes: ['id', 'code', 'name'] },
      ], order: [['sortOrder', 'ASC']], limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
    });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count/limit) } } });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const createCity = async (req, res) => {
  try {
    const item = await MasterCity.create({ ...req.body, tenantId: req.tenantId, createdBy: req.userId });
    await audit(req, item.id, 'city', 'create', null, req.body);
    return ApiResponse.created(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const updateCity = async (req, res) => {
  try {
    const item = await MasterCity.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    const old = { ...item.dataValues };
    await item.update({ ...req.body, updatedBy: req.userId });
    await audit(req, item.id, 'city', 'update', old, req.body);
    return ApiResponse.success(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const deleteCity = async (req, res) => {
  try {
    const item = await MasterCity.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    await audit(req, item.id, 'city', 'delete', item.dataValues, null);
    await item.update({ deletedBy: req.userId });
    await item.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

// ═══════ GENERIC MASTER DATA ═══════
const getMasterData = async (req, res) => {
  try {
    const { type, page = 1, limit = 50, search } = req.query;
    if (!type) return ApiResponse.badRequest(res, { message: 'Type parameter required' });
    const where = { tenantId: req.tenantId, type };
    if (search) where.name = { [require('sequelize').Op.like]: `%${search}%` };
    const { count, rows } = await MasterData.findAndCountAll({ where, order: [['sortOrder', 'ASC']], limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit) });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count/limit) } } });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const createMasterData = async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) return ApiResponse.badRequest(res, { message: 'Type required' });
    const item = await MasterData.create({ ...req.body, tenantId: req.tenantId, createdBy: req.userId });
    await audit(req, item.id, type, 'create', null, req.body);
    return ApiResponse.created(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const updateMasterData = async (req, res) => {
  try {
    const item = await MasterData.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    const old = { ...item.dataValues };
    await item.update({ ...req.body, updatedBy: req.userId });
    await audit(req, item.id, item.type, 'update', old, req.body);
    return ApiResponse.success(res, { data: item });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const deleteMasterData = async (req, res) => {
  try {
    const item = await MasterData.findOne({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return ApiResponse.notFound(res);
    await audit(req, item.id, item.type, 'delete', item.dataValues, null);
    await item.update({ deletedBy: req.userId });
    await item.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, recordId } = req.query;
    const where = { tenantId: req.tenantId };
    if (recordId) where.recordId = recordId;
    const { count, rows } = await MasterDataAudit.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit) });
    return ApiResponse.success(res, { data: rows, meta: { pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count/limit) } } });
  } catch (e) { return ApiResponse.error(res, { message: e.message }); }
};

module.exports = { getCountries, getCountry, createCountry, updateCountry, deleteCountry, getStates, createState, updateState, deleteState, getCities, createCity, updateCity, deleteCity, getMasterData, createMasterData, updateMasterData, deleteMasterData, getAuditLogs };
