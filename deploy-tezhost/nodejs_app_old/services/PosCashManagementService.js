'use strict';
const { PosCashMovement, PosSession, PosTerminal } = require('../models');
const AuditService = require('./AuditService');

class PosCashManagementService {
  /**
   * List cash movements for a session/terminal
   */
  static async list(tenantId, query = {}) {
    const { page = 1, limit = 50, sessionId, terminalId, movementType } = query;
    const where = { tenantId };
    if (sessionId) where.sessionId = sessionId;
    if (terminalId) where.terminalId = terminalId;
    if (movementType) where.movementType = movementType;

    const { rows, count } = await PosCashMovement.findAndCountAll({
      where,
      include: [
        { model: PosTerminal, as: 'terminal' },
        { model: require('../models').User, as: 'cashier' },
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
   * Record a cash movement (cash in / cash out)
   */
  static async recordMovement(tenantId, body, userId) {
    const { terminalId, sessionId, movementType, amount, referenceType, reference, reason } = body;

    if (!reason || reason.trim() === '') {
      throw Object.assign(new Error('Reason is required for cash movements'), { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      throw Object.assign(new Error('Amount must be greater than zero'), { status: 400 });
    }

    // Validate session
    const session = await PosSession.findOne({
      where: { tenantId, id: sessionId, status: 'open' },
    });
    if (!session) {
      throw Object.assign(new Error('POS Session not found or not open'), { status: 400 });
    }

    const movement = await PosCashMovement.create({
      tenantId,
      terminalId,
      sessionId,
      userId,
      movementType,
      amount: amountNum,
      referenceType: referenceType || 'other',
      reference: reference || null,
      reason,
    });

    // Update session cash totals
    const incrementField = movementType === 'cash_in' ? 'cashInTotal' : 'cashOutTotal';
    await PosSession.increment(
      { [incrementField]: amountNum },
      { where: { id: sessionId } }
    );

    await AuditService.log({
      tenantId,
      userId,
      action: movementType === 'cash_in' ? 'POS_CASH_IN' : 'POS_CASH_OUT',
      module: 'POS',
      entity: 'PosCashMovement',
      entityId: movement.id,
      newValues: { movementType, amount: amountNum, reason },
      description: `POS ${movementType}: ${amountNum} - ${reason}`,
    });

    return movement;
  }
}

module.exports = PosCashManagementService;
