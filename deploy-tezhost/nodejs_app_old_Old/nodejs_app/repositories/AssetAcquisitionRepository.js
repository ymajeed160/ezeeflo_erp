const BaseRepository = require('./BaseRepository');
const { AssetAcquisition, AssetAcquisitionLine, AssetCategory, Asset, Supplier, JournalEntry, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class AssetAcquisitionRepository extends BaseRepository {
  constructor() {
    super(AssetAcquisition);
  }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { acquisitionNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name'],
          required: false,
        },
        {
          model: AssetAcquisitionLine,
          as: 'lines',
          required: false,
          include: [
            {
              model: AssetCategory,
              as: 'category',
              attributes: ['id', 'categoryCode', 'categoryName'],
              required: false,
            },
            {
              model: Asset,
              as: 'asset',
              attributes: ['id', 'assetCode', 'assetName', 'status'],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { acquisitionNumber: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name'],
          required: false,
        },
        {
          model: AssetAcquisitionLine,
          as: 'lines',
          required: false,
          attributes: ['id', 'assetName', 'purchaseCost', 'lineNumber'],
        },
      ],
    });
    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
        hasNext: page * limit < result.count,
        hasPrev: page > 1,
      },
    };
  }

  async findLastNumber(tenantId) {
    return await this.model.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });
  }

  async getNextAcquisitionNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'ACQ-000001';
    const numStr = last.acquisitionNumber.replace('ACQ-', '');
    const num = parseInt(numStr, 10);
    const next = num + 1;
    return `ACQ-${String(next).padStart(6, '0')}`;
  }

  async createWithLines(acquisitionData, linesData, tenantId, userId, transaction) {
    const t = transaction || (await sequelize.transaction());
    try {
      const acq = await AssetAcquisition.create(
        { ...acquisitionData, tenantId, createdBy: userId, updatedBy: userId },
        { transaction: t }
      );

      const lines = [];
      for (let i = 0; i < linesData.length; i++) {
        const line = await AssetAcquisitionLine.create(
          {
            ...linesData[i],
            acquisitionId: acq.id,
            tenantId,
            lineNumber: i + 1,
            createdBy: userId,
            updatedBy: userId,
          },
          { transaction: t }
        );
        lines.push(line);
      }

      if (!transaction) await t.commit();
      return { acquisition: acq, lines };
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  async deleteWithLines(id, tenantId, transaction) {
    const t = transaction || (await sequelize.transaction());
    try {
      await AssetAcquisitionLine.destroy({ where: { acquisitionId: id, tenantId }, transaction: t });
      await AssetAcquisition.destroy({ where: { id, tenantId }, transaction: t });
      if (!transaction) await t.commit();
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }
}

module.exports = new AssetAcquisitionRepository();
