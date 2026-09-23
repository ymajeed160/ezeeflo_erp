const { Op } = require('sequelize');
const { ResourceIncome } = require('../models');

/**
 * ResourceIncomeRepository — persistence for the analytical
 * resource-income attribution snapshot. Read + upsert only.
 * This repository NEVER touches journal entries or ledgers.
 */
class ResourceIncomeRepository {
  async findByInvoiceAndResource(salesInvoiceId, resourceId, tenantId) {
    return ResourceIncome.findOne({
      where: { tenantId, salesInvoiceId, resourceId },
    });
  }

  async upsertForInvoice(data, transaction) {
    const existing = await ResourceIncome.findOne({
      where: {
        tenantId: data.tenantId,
        salesInvoiceId: data.salesInvoiceId,
        resourceId: data.resourceId,
      },
      transaction,
    });

    if (existing) {
      await existing.update(data, { transaction });
      return existing;
    }

    return ResourceIncome.create(data, { transaction });
  }

  async markCancelled(salesInvoiceId, tenantId, updatedBy, transaction) {
    return ResourceIncome.update(
      { status: 'cancelled', updatedBy },
      { where: { tenantId, salesInvoiceId }, transaction }
    );
  }

  async findByInvoice(salesInvoiceId, tenantId) {
    return ResourceIncome.findOne({ where: { tenantId, salesInvoiceId } });
  }

  async countByResource(resourceId, tenantId) {
    return ResourceIncome.count({ where: { tenantId, resourceId } });
  }
}

module.exports = new ResourceIncomeRepository();
