const inventoryBalanceRepository = require('../repositories/InventoryBalanceRepository');
const inventoryTransactionRepository = require('../repositories/InventoryTransactionRepository');
const { NotFoundError } = require('../utils/appError');

class InventoryReportService {
  /**
   * Get inventory balances by warehouse and/or item
   */
  async getInventoryBalances(tenantId, query = {}) {
    const { page = 1, limit = 20, warehouseId, itemId, search, lowStock } = query;
    const filters = {};

    if (warehouseId) filters.warehouseId = warehouseId;
    if (itemId) filters.itemId = itemId;

    const result = await inventoryBalanceRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      lowStock: lowStock === 'true',
      order: [['itemId', 'ASC']],
    });

    return result;
  }

  /**
   * Get inventory balance for a specific warehouse and item
   */
  async getBalanceByWarehouseAndItem(warehouseId, itemId, tenantId) {
    const balance = await inventoryBalanceRepository.findByWarehouseAndItem(warehouseId, itemId, tenantId);
    if (!balance) {
      throw new NotFoundError('No inventory balance found for this warehouse and item');
    }
    return balance;
  }

  /**
   * Get inventory transaction history
   */
  async getTransactionHistory(tenantId, query = {}) {
    const {
      page = 1,
      limit = 20,
      itemId,
      warehouseId,
      transactionType,
      startDate,
      endDate,
      referenceType,
      search,
    } = query;

    const filters = {};
    if (itemId) filters.itemId = itemId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (transactionType) filters.transactionType = transactionType;
    if (referenceType) filters.referenceType = referenceType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await inventoryTransactionRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['transactionDate', 'DESC']],
    });

    return result;
  }

  /**
   * Get item movement summary for a specific item
   */
  async getItemMovementSummary(itemId, tenantId, query = {}) {
    const { startDate, endDate, warehouseId } = query;

    const filters = { itemId };
    if (warehouseId) filters.warehouseId = warehouseId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const transactions = await inventoryTransactionRepository.findAll(tenantId, {
      filters,
      order: [['transactionDate', 'ASC']],
    });

    // Calculate summary
    const summary = {
      itemId,
      totalIn: 0,
      totalOut: 0,
      netMovement: 0,
      transactions: transactions.rows || transactions,
    };

    const txs = transactions.rows || transactions;
    for (const tx of txs) {
      summary.totalIn += parseFloat(tx.quantityIn || 0);
      summary.totalOut += parseFloat(tx.quantityOut || 0);
    }
    summary.netMovement = summary.totalIn - summary.totalOut;

    return summary;
  }
}

module.exports = new InventoryReportService();