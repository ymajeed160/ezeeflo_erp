const { Op } = require('sequelize');
const { EmployeeAsset, Employee } = require('../models');

class EmployeeAssetRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 10, employeeId, assetType, status, search } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (assetType) where.assetType = assetType;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { assetName: { [Op.like]: `%${search}%` } },
        { assetCode: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await EmployeeAsset.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
      ],
      order: [['assignedDate', 'DESC']],
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

  async findById(id, tenantId) {
    return EmployeeAsset.findOne({
      where: { id, tenantId },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'departmentId'], required: false },
      ],
    });
  }

  async create(data) {
    return EmployeeAsset.create(data);
  }

  async update(id, tenantId, data) {
    const [affected] = await EmployeeAsset.update(data, { where: { id, tenantId } });
    return affected > 0;
  }

  async delete(id, tenantId) {
    const asset = await EmployeeAsset.findOne({ where: { id, tenantId } });
    if (asset) {
      await asset.destroy();
      return true;
    }
    return false;
  }

  async getNextAssetCode(tenantId) {
    const last = await EmployeeAsset.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });
    if (!last?.assetCode) return 'AST-000001';
    const match = last.assetCode.match(/AST-(\d+)/);
    return match ? `AST-${String(parseInt(match[1]) + 1).padStart(6, '0')}` : 'AST-000001';
  }
}

module.exports = new EmployeeAssetRepository();
