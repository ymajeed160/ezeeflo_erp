'use strict';
const BaseRepository = require('./BaseRepository');
const { PosSession } = require('../models');

class PosSessionRepository extends BaseRepository {
  constructor() {
    super(PosSession);
  }

  async findActiveByUser(tenantId, userId, terminalId) {
    return PosSession.findOne({
      where: { tenantId, userId, terminalId, status: 'open' },
    });
  }

  async findOpenSessions(tenantId) {
    return PosSession.findAll({
      where: { tenantId, status: 'open' },
      include: ['terminal', 'cashier', 'warehouse'],
    });
  }
}

module.exports = new PosSessionRepository();
