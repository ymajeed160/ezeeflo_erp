'use strict';
const { CustomerPayment, CustomerPaymentAllocation, Customer, Account, SalesInvoice, User } = require('../models');

class CustomerPaymentRepository {
  /**
   * Find all customer payments with filtering, searching, sorting, pagination
   */
  static async findAll(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.paymentDate[Op.lte] = filters.endDate;
    }

    const { Op } = require('sequelize');
    // Search across paymentNumber, customer name, reference
    if (filters.search) {
      where[Op.or] = [
        { paymentNumber: { [Op.like]: `%${filters.search}%` } },
        { reference: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 25;
    const offset = (page - 1) * limit;
    const order = filters.order
      ? [[filters.order, filters.dir || 'DESC']]
      : [['createdAt', 'DESC']];

    const customerWhere = filters.search ? { name: { [Op.like]: `%${filters.search}%` } } : undefined;

    const { count, rows } = await CustomerPayment.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'], where: customerWhere, required: !!customerWhere },
        { model: Account, as: 'bankAccount', attributes: ['id', 'name', 'code'], required: false },
        { model: Account, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
      ],
      order,
      limit,
      offset,
      distinct: true,
    });

    return {
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Find customer payment by ID with all associations
   */
  static async findById(tenantId, id) {
    return CustomerPayment.findOne({
      where: { tenantId, id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code', 'email', 'phone', 'mobile', 'taxNumber', 'arAccountId'] },
        { model: Account, as: 'bankAccount', attributes: ['id', 'name', 'code'], required: false },
        { model: Account, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] },
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            { model: SalesInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'grandTotal'] },
          ],
        },
      ],
    });
  }

  /**
   * Create customer payment with allocations in a transaction
   */
  static async create(data, transaction) {
    const { allocations, ...headerData } = data;
    const payment = await CustomerPayment.create(headerData, { transaction });

    if (allocations && allocations.length > 0) {
      const allocationRecords = allocations.map((a) => ({
        tenantId: headerData.tenantId,
        customerPaymentId: payment.id,
        ...a,
      }));
      await CustomerPaymentAllocation.bulkCreate(allocationRecords, { transaction });
    }

    return CustomerPayment.findByPk(payment.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'] },
        { model: Account, as: 'bankAccount', attributes: ['id', 'name'], required: false },
        { model: Account, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: Account, as: 'customerAccount', attributes: ['id', 'code', 'name'], required: false },
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            { model: SalesInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber'] },
          ],
        },
      ],
      transaction,
    });
  }

  /**
   * Update customer payment header and allocations in a transaction
   */
  static async update(tenantId, id, data, transaction) {
    const { allocations, ...headerData } = data;

    // Update header
    await CustomerPayment.update(headerData, {
      where: { tenantId, id },
      transaction,
    });

    if (allocations) {
      // Remove existing allocations not in the new list
      const newIds = allocations.filter((a) => a.id).map((a) => a.id);
      await CustomerPaymentAllocation.destroy({
        where: {
          tenantId,
          customerPaymentId: id,
          ...(newIds.length > 0 ? { id: { [require('sequelize').Op.notIn]: newIds } } : {}),
        },
        transaction,
      });

      // Upsert allocations
      for (const alloc of allocations) {
        if (alloc.id) {
          await CustomerPaymentAllocation.update(
            {
              salesInvoiceId: alloc.salesInvoiceId,
              allocatedAmount: alloc.allocatedAmount,
            },
            { where: { id: alloc.id, tenantId, customerPaymentId: id }, transaction }
          );
        } else {
          await CustomerPaymentAllocation.create(
            {
              tenantId,
              customerPaymentId: id,
              salesInvoiceId: alloc.salesInvoiceId,
              allocatedAmount: alloc.allocatedAmount,
            },
            { transaction }
          );
        }
      }
    }

    return CustomerPaymentRepository.findById(tenantId, id);
  }

  /**
   * Delete customer payment and its allocations in a transaction
   */
  static async delete(tenantId, id, transaction) {
    await CustomerPaymentAllocation.destroy({
      where: { tenantId, customerPaymentId: id },
      transaction,
    });
    return CustomerPayment.destroy({
      where: { tenantId, id },
      transaction,
    });
  }

  /**
   * Update customer payment status
   */
  static async updateStatus(tenantId, id, status, userId, transaction) {
    return CustomerPayment.update(
      { status, updatedBy: userId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Set journalEntryId on customer payment
   */
  static async setJournalEntry(tenantId, id, journalEntryId, transaction) {
    return CustomerPayment.update(
      { journalEntryId },
      { where: { tenantId, id }, transaction }
    );
  }

  /**
   * Get customer payment allocations only
   */
  static async getAllocationsOnly(tenantId, id) {
    return CustomerPaymentAllocation.findAll({
      where: { tenantId, customerPaymentId: id },
      include: [{ model: SalesInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'grandTotal'] }],
    });
  }
}

module.exports = CustomerPaymentRepository;