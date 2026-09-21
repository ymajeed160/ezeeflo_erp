const purchaseRequestRepo = require('../repositories/PurchaseRequestRepository');
const { PurchaseRequestDTO } = require('../dto/PurchaseRequestDTO');
const AuditLogService = require('./AuditLogService');

class PurchaseRequestService {
  async list(tenantId, query) {
    const result = await purchaseRequestRepo.findAll(tenantId, query);
    return {
      data: PurchaseRequestDTO.toList(result.rows),
      total: result.count,
      page: result.page,
      limit: result.limit,
    };
  }

  async getById(tenantId, id) {
    const request = await purchaseRequestRepo.findById(tenantId, id);
    if (!request) return null;
    return PurchaseRequestDTO.toDetail(request);
  }

  async create(tenantId, data, userId) {
    this._validateLines(data.details);

    // Generate the initial number outside the loop
    let requestNumber = await purchaseRequestRepo.getNextNumber(tenantId);
    data.requestNumber = requestNumber;

    // Retry with next number if unique constraint is violated (race condition)
    let lastError;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const request = await purchaseRequestRepo.create(tenantId, data, userId);
        const result = await purchaseRequestRepo.findById(tenantId, request.id);

        await AuditLogService.log(tenantId, userId, 'PurchaseRequest', request.id, 'Created', data);

        return PurchaseRequestDTO.toDetail(result);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          lastError = error;
          // Increment and retry — do NOT call getNextNumber again (it returns the same unused number)
          const parts = data.requestNumber.split('-');
          const num = parseInt(parts[2], 10) + 1;
          data.requestNumber = `${parts[0]}-${parts[1]}-${String(num).padStart(5, '0')}`;
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('Failed to create purchase request after multiple attempts');
  }

  async update(tenantId, id, data, userId) {
    if (data.details) {
      this._validateLines(data.details);
    }

    const request = await purchaseRequestRepo.update(tenantId, id, data, userId);
    if (!request) throw new Error('Purchase Request not found');

    const result = await purchaseRequestRepo.findById(tenantId, id);

    await AuditLogService.log(tenantId, userId, 'PurchaseRequest', id, 'Updated', data);

    return PurchaseRequestDTO.toDetail(result);
  }

  async delete(tenantId, id, userId) {
    const rows = await purchaseRequestRepo.delete(tenantId, id);
    if (rows === 0) throw new Error('Purchase Request not found');
    await AuditLogService.log(tenantId, userId, 'PurchaseRequest', id, 'Deleted');
    return true;
  }

  async updateStatus(tenantId, id, status, userId) {
    const request = await purchaseRequestRepo.findById(tenantId, id);
    if (!request) throw new Error('Purchase Request not found');

    const validTransitions = {
      draft: ['submitted'],
      submitted: ['approved', 'rejected'],
      approved: ['converted'],
    };

    const currentStatus = request.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
    }

    await purchaseRequestRepo.updateStatus(tenantId, id, status, userId);
    await AuditLogService.log(tenantId, userId, 'PurchaseRequest', id, 'Status changed', { from: currentStatus, to: status });

    return await this.getById(tenantId, id);
  }

  async submit(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'submitted', userId);
  }

  async approve(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'approved', userId);
  }

  async reject(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'rejected', userId);
  }

  async markConverted(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'converted', userId);
  }

  _validateLines(details) {
    if (!details || details.length === 0) {
      throw new Error('At least one detail line is required');
    }
    for (const line of details) {
      if (!line.itemId) throw new Error('Item is required for each detail line');
      if (!line.quantity || parseFloat(line.quantity) <= 0) throw new Error('Quantity must be greater than zero for each detail line');
    }
  }
}

module.exports = new PurchaseRequestService();