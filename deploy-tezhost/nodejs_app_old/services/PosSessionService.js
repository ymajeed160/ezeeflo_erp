'use strict';
const { PosSession, PosTerminal, PosTerminalUser, Warehouse, User } = require('../models');
const { sequelize } = require('../models');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');

class PosSessionService {
  /**
   * List sessions for a tenant
   */
  static async list(tenantId, query = {}) {
    const { page = 1, limit = 50, status, terminalId, userId, startDate, endDate } = query;
    const where = { tenantId };
    if (status) where.status = status;
    if (terminalId) where.terminalId = terminalId;
    if (userId) where.userId = userId;
    if (startDate) where.openingDate = { ...where.openingDate, [require('sequelize').Op.gte]: new Date(startDate) };
    if (endDate) where.openingDate = { ...where.openingDate, [require('sequelize').Op.lte]: new Date(endDate) };

    const { rows, count } = await PosSession.findAndCountAll({
      where,
      include: [
        { model: PosTerminal, as: 'terminal', required: false },
        { model: User, as: 'cashier', required: false },
        { model: Warehouse, as: 'warehouse', required: false },
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
   * Get current active session at a terminal (any user)
   */
  static async getActiveSession(tenantId, userId, terminalId) {
    return PosSession.findOne({
      where: { tenantId, terminalId, status: 'open' },
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'cashier' },
      ],
    });
  }

  /**
   * Get session by ID
   */
  static async getById(tenantId, id) {
    const session = await PosSession.findOne({
      where: { tenantId, id },
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'cashier' },
        { model: User, as: 'manager' },
      ],
    });
    if (!session) {
      const error = new Error('POS Session not found');
      error.status = 404;
      throw error;
    }
    return session;
  }

  /**
   * Generate session number
   */
  static async generateSessionNumber(tenantId, terminalCode) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SES-${terminalCode}-${dateStr}`;

    const lastSession = await PosSession.findOne({
      where: { tenantId, sessionNumber: { [require('sequelize').Op.like]: `${prefix}%` } },
      order: [['sessionNumber', 'DESC']],
    });

    let seq = 1;
    if (lastSession) {
      const parts = lastSession.sessionNumber.split('-');
      seq = parseInt(parts[parts.length - 1] || 0) + 1;
    }

    return `${prefix}-${String(seq).padStart(3, '0')}`;
  }

  /**
   * Open a new POS session
   */
  static async openSession(tenantId, body, userId) {
    const { terminalId, openingCash = 0, openingNotes } = body;

    // Validate terminal exists and is active
    const terminal = await PosTerminal.findOne({
      where: { tenantId, id: terminalId, isActive: true, status: 'active' },
    });
    if (!terminal) {
      const error = new Error('POS Terminal not found or inactive');
      error.status = 404;
      throw error;
    }

    // Validate user is assigned to this terminal
    const assignment = await PosTerminalUser.findOne({
      where: { userId, terminalId, isActive: true },
    });
    if (!assignment) {
      const error = new Error('You are not assigned to this POS terminal');
      error.status = 403;
      throw error;
    }

    // Check no other open session on this terminal
    const existingOpen = await this.getActiveSession(tenantId, userId, terminalId);
    if (existingOpen) {
      const error = new Error('This terminal already has an open session');
      error.status = 409;
      throw error;
    }

    const sessionNumber = await this.generateSessionNumber(tenantId, terminal.terminalCode);

    // Use terminal's warehouse, or find any warehouse for this tenant as fallback
    let warehouseId = terminal.warehouseId;
    if (!warehouseId) {
      const defaultWarehouse = await Warehouse.findOne({ where: { tenantId }, order: [['createdAt', 'ASC']] });
      warehouseId = defaultWarehouse ? defaultWarehouse.id : null;
    }

    const session = await PosSession.create({
      tenantId,
      terminalId,
      userId,
      warehouseId,
      sessionNumber,
      openingDate: new Date(),
      openingCash: parseFloat(openingCash) || 0,
      openingNotes: openingNotes || null,
      status: 'open',
      createdBy: userId,
    });

    await AuditService.log({
      tenantId,
      userId,
      action: 'POS_SESSION_OPENED',
      module: 'POS',
      entity: 'PosSession',
      entityId: session.id,
      newValues: { sessionNumber, terminalId, openingCash },
      description: `POS Session ${sessionNumber} opened on terminal ${terminal.terminalCode}`,
    });

    return this.getById(tenantId, session.id);
  }

  /**
   * Close a POS session with end-of-day calculations
   */
  static async closeSession(tenantId, id, body, userId) {
    const session = await PosSession.findOne({ where: { tenantId, id, status: 'open' } });
    if (!session) {
      const error = new Error('POS Session not found or already closed');
      error.status = 404;
      throw error;
    }

    const { actualCash = 0, closingNotes } = body;

    // Calculate expected cash
    const openingCash = parseFloat(session.openingCash);
    const cashSales = parseFloat(session.cashSalesTotal || 0);
    const cashIn = parseFloat(session.cashInTotal || 0);
    const cashOut = parseFloat(session.cashOutTotal || 0);
    const refunds = parseFloat(session.refundTotal || 0);

    const expectedCash = openingCash + cashSales + cashIn - cashOut - refunds;
    const cashDifference = parseFloat(actualCash) - expectedCash;

    const updateData = {
      closingDate: new Date(),
      closingCash: parseFloat(actualCash),
      expectedCash: Math.max(0, expectedCash),
      actualCash: parseFloat(actualCash),
      cashDifference,
      status: 'closed',
      closingNotes: closingNotes || null,
    };

    // Manager approval if variance exceeds threshold
    const varianceThreshold = body.varianceThreshold || 50; // Default $50
    if (Math.abs(cashDifference) > varianceThreshold) {
      if (!body.managerApprovedBy) {
        updateData.status = 'suspended';
        updateData.closingNotes = (closingNotes || '') + ' [PENDING MANAGER APPROVAL]';
      } else {
        updateData.managerApproved = true;
        updateData.managerApprovedBy = body.managerApprovedBy;
      }
    }

    await PosSession.update(updateData, { where: { tenantId, id } });

    await AuditService.log({
      tenantId,
      userId,
      action: 'POS_SESSION_CLOSED',
      module: 'POS',
      entity: 'PosSession',
      entityId: id,
      oldValues: { status: 'open' },
      newValues: { status: updateData.status, expectedCash, actualCash, cashDifference },
      description: `POS Session ${session.sessionNumber} closed. Expected: ${expectedCash}, Actual: ${actualCash}, Difference: ${cashDifference}`,
    });

    return this.getById(tenantId, id);
  }

  /**
   * Get session summary for EOD report
   */
  static async getSessionSummary(tenantId, id) {
    const session = await this.getById(tenantId, id);
    return {
      sessionNumber: session.sessionNumber,
      terminal: session.terminal?.terminalName,
      cashier: session.cashier?.name,
      warehouse: session.warehouse?.name,
      openingDate: session.openingDate,
      closingDate: session.closingDate,
      openingCash: parseFloat(session.openingCash),
      summary: {
        cashSales: parseFloat(session.cashSalesTotal || 0),
        cardSales: parseFloat(session.cardSalesTotal || 0),
        bankSales: parseFloat(session.bankSalesTotal || 0),
        creditSales: parseFloat(session.creditSalesTotal || 0),
        totalSales: parseFloat(session.cashSalesTotal || 0) + parseFloat(session.cardSalesTotal || 0) +
          parseFloat(session.bankSalesTotal || 0) + parseFloat(session.creditSalesTotal || 0),
        cashIn: parseFloat(session.cashInTotal || 0),
        cashOut: parseFloat(session.cashOutTotal || 0),
        refunds: parseFloat(session.refundTotal || 0),
      },
      expectedCash: parseFloat(session.expectedCash),
      actualCash: parseFloat(session.actualCash),
      cashDifference: parseFloat(session.cashDifference),
      totalTransactions: session.totalSalesCount,
      status: session.status,
    };
  }
}

module.exports = PosSessionService;
