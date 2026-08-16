'use strict';
const { PosTerminal, PosTerminalUser, User } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');

class PosTerminalService {
  /**
   * List all terminals for a tenant
   */
  static async list(tenantId, query = {}) {
    const { page = 1, limit = 50, status, search } = query;
    const where = { tenantId };
    if (status) where.status = status;
    if (search) {
      where[require('sequelize').Op.or] = [
        { terminalName: { [require('sequelize').Op.like]: `%${search}%` } },
        { terminalCode: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await PosTerminal.findAndCountAll({
      where,
      include: [
        { model: require('../models').Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
        { model: require('../models').Account, as: 'cashAccount', attributes: ['id', 'name', 'code'], required: false },
        { model: require('../models').Account, as: 'bankAccount', attributes: ['id', 'name', 'code'], required: false },
        {
          model: PosTerminalUser,
          as: 'userAssignments',
          required: false,
          include: [{ model: User, as: 'user', required: false }],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      subQuery: false,
    });

    return {
      data: rows,
      count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get terminal by ID
   */
  static async getById(tenantId, id) {
    const terminal = await PosTerminal.findOne({
      where: { tenantId, id },
      include: [
        { model: require('../models').Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
        { model: require('../models').Account, as: 'cashAccount', attributes: ['id', 'name', 'code'], required: false },
        { model: require('../models').Account, as: 'bankAccount', attributes: ['id', 'name', 'code'], required: false },
        {
          model: PosTerminalUser,
          as: 'userAssignments',
          required: false,
          include: [{ model: User, as: 'user', required: false }],
        },
      ],
    });
    if (!terminal) {
      const error = new Error('POS Terminal not found');
      error.status = 404;
      throw error;
    }
    return terminal;
  }

  /**
   * Create a new terminal
   */
  static async create(tenantId, body, userId) {
    const data = {
      tenantId,
      terminalName: body.terminalName,
      terminalCode: body.terminalCode.toUpperCase(),
      warehouseId: body.warehouseId || null,
      defaultCashAccountId: body.defaultCashAccountId || null,
      defaultBankAccountId: body.defaultBankAccountId || null,
      defaultCurrency: body.defaultCurrency || 'AED',
      status: body.status || 'active',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    };

    const terminal = await PosTerminal.create(data);

    // Auto-assign the creating user + any additional users
    const assignedUsers = new Set(body.assignedUserIds || []);
    assignedUsers.add(userId); // Always assign the creator

    const assignments = [...assignedUsers].map(uid => ({
      terminalId: terminal.id,
      userId: uid,
      isActive: true,
    }));
    await PosTerminalUser.bulkCreate(assignments, { ignoreDuplicates: true });

    // Return created terminal
    return this.getById(tenantId, terminal.id);
  }

  /**
   * Update a terminal
   */
  static async update(tenantId, id, body, userId) {
    const terminal = await PosTerminal.findOne({ where: { tenantId, id } });
    if (!terminal) {
      const error = new Error('POS Terminal not found');
      error.status = 404;
      throw error;
    }

    const updateData = {};
    if (body.terminalName !== undefined) updateData.terminalName = body.terminalName;
    if (body.terminalCode !== undefined) updateData.terminalCode = body.terminalCode.toUpperCase();
    if (body.warehouseId !== undefined) updateData.warehouseId = body.warehouseId;
    if (body.defaultCashAccountId !== undefined) updateData.defaultCashAccountId = body.defaultCashAccountId;
    if (body.defaultBankAccountId !== undefined) updateData.defaultBankAccountId = body.defaultBankAccountId;
    if (body.defaultCurrency !== undefined) updateData.defaultCurrency = body.defaultCurrency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    updateData.updatedBy = userId;

    await PosTerminal.update(updateData, { where: { tenantId, id } });

    // Update user assignments if provided
    if (body.assignedUserIds && Array.isArray(body.assignedUserIds)) {
      await PosTerminalUser.destroy({ where: { terminalId: id } });
      const assignments = body.assignedUserIds.map(uid => ({
        terminalId: id,
        userId: uid,
        isActive: true,
      }));
      await PosTerminalUser.bulkCreate(assignments);
    }

    return this.getById(tenantId, id);
  }

  /**
   * Delete a terminal
   */
  static async delete(tenantId, id) {
    const terminal = await PosTerminal.findOne({ where: { tenantId, id } });
    if (!terminal) {
      const error = new Error('POS Terminal not found');
      error.status = 404;
      throw error;
    }
    await PosTerminalUser.destroy({ where: { terminalId: id } });
    await PosTerminal.destroy({ where: { tenantId, id } });
    return { message: 'POS Terminal deleted successfully' };
  }

  /**
   * Get terminals assigned to a user
   */
  static async getUserTerminals(tenantId, userId) {
    const assignments = await PosTerminalUser.findAll({
      where: { userId, isActive: true },
      include: [
        {
          model: PosTerminal,
          as: 'terminal',
          required: true,
          where: { tenantId, isActive: true, status: 'active' },
          include: [
            { model: require('../models').Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
            { model: require('../models').Account, as: 'cashAccount', attributes: ['id', 'name', 'code'], required: false },
            { model: require('../models').Account, as: 'bankAccount', attributes: ['id', 'name', 'code'], required: false },
          ],
        },
      ],
    });
    return assignments.map(a => a.terminal).filter(Boolean);
  }

  /**
   * Validate that a user is assigned to a terminal
   */
  static async validateUserAccess(tenantId, userId, terminalId) {
    const assignment = await PosTerminalUser.findOne({
      where: { userId, terminalId, isActive: true },
      include: [
        {
          model: PosTerminal,
          as: 'terminal',
          where: { tenantId, isActive: true, status: 'active' },
          required: true,
        },
      ],
    });
    return !!assignment;
  }
}

module.exports = PosTerminalService;
