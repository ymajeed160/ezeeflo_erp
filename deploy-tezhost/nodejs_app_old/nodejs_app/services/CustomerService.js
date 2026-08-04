const customerRepository = require('../repositories/CustomerRepository');
const { ConflictError } = require('../utils/appError');
const CustomerDTO = require('../dto/CustomerDTO');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class CustomerService {
  async getAll(tenantId, query) {
    const result = await customerRepository.findAll({ tenantId, query });
    result.data = CustomerDTO.toListResponse(result.data);
    return result;
  }

  async getById(id, tenantId) {
    const customer = await customerRepository.findById(id, tenantId);
    return CustomerDTO.toResponse(customer);
  }

  async getForSelect(tenantId, search = '') {
    const customers = await customerRepository.findPaginatedForSelect(tenantId, search);
    return CustomerDTO.toCompactListResponse(customers);
  }

  async create(data, tenantId, userId) {
    // Check code uniqueness
    const existing = await customerRepository.findByCode(data.code, tenantId);
    if (existing) {
      throw new ConflictError(`Customer with code '${data.code}' already exists`);
    }

    // Convert empty strings to null to avoid validation/FK constraint errors
    const sanitizedData = { ...data };
    ['arAccountId', 'apAccountId', 'salesAccountId', 'discountAccountId', 'paymentTermId', 'priceListId', 'salesPersonId', 'email', 'contactEmail', 'phone', 'mobile', 'website'].forEach((field) => {
      if (sanitizedData[field] === '' || sanitizedData[field] === undefined) {
        sanitizedData[field] = null;
      }
    });

    const createData = {
      ...sanitizedData,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    };

    const customer = await customerRepository.create(createData);

    // Audit log
    await AuditLog.create({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      newValues: { code: customer.code, name: customer.name },
      description: `Customer ${customer.code} - ${customer.name} created`,
    });

    logger.info(`Customer created: ${customer.code} by user ${userId} in tenant ${tenantId}`);
    return CustomerDTO.toResponse(await customerRepository.findById(customer.id, tenantId));
  }

  async update(id, data, tenantId, userId) {
    // Check code uniqueness if code is being changed
    if (data.code) {
      const existing = await customerRepository.findByCode(data.code, tenantId, id);
      if (existing) {
        throw new ConflictError(`Customer with code '${data.code}' already exists`);
      }
    }

    // Convert empty strings to null to avoid validation/FK constraint errors
    const sanitizedData = { ...data };
    ['arAccountId', 'apAccountId', 'salesAccountId', 'discountAccountId', 'paymentTermId', 'priceListId', 'salesPersonId', 'email', 'contactEmail', 'phone', 'mobile', 'website'].forEach((field) => {
      if (sanitizedData[field] === '' || sanitizedData[field] === undefined) {
        sanitizedData[field] = null;
      }
    });

    // Get old values for audit
    const oldCustomer = await customerRepository.findById(id, tenantId);

    const updatedData = { ...sanitizedData, updatedBy: userId };
    const customer = await customerRepository.update(id, updatedData, tenantId);

    // Audit log
    const changes = {};
    if (data.name && data.name !== oldCustomer.name) changes.name = { from: oldCustomer.name, to: data.name };
    if (data.status && data.status !== oldCustomer.status) changes.status = { from: oldCustomer.status, to: data.status };
    if (data.creditLimit !== undefined && Number(data.creditLimit) !== Number(oldCustomer.creditLimit)) {
      changes.creditLimit = { from: oldCustomer.creditLimit, to: data.creditLimit };
    }

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: id,
        oldValues: { code: oldCustomer.code, name: oldCustomer.name },
        newValues: changes,
        description: `Customer ${oldCustomer.code} updated`,
      });
    }

    logger.info(`Customer updated: ${customer.code} by user ${userId} in tenant ${tenantId}`);
    return CustomerDTO.toResponse(customer);
  }

  async delete(id, tenantId, userId) {
    const customer = await customerRepository.findById(id, tenantId);

    await customerRepository.delete(id, tenantId);

    await AuditLog.create({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
      oldValues: { code: customer.code, name: customer.name },
      description: `Customer ${customer.code} - ${customer.name} deleted`,
    });

    logger.info(`Customer deleted: ${customer.code} by user ${userId} in tenant ${tenantId}`);
    return { id, deleted: true };
  }

  async toggleStatus(id, tenantId, userId) {
    const customer = await customerRepository.toggleStatus(id, tenantId, userId);

    await AuditLog.create({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      description: `Customer ${customer.code} status toggled to ${customer.isActive ? 'Active' : 'Inactive'}`,
    });

    return CustomerDTO.toResponse(await customerRepository.findById(id, tenantId));
  }
}

module.exports = new CustomerService();