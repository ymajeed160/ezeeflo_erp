const repo = require('../repositories/EmployeeAssetRepository');
const { NotFoundError } = require('../utils/appError');

const assetToDTO = (a) => a ? {
  id: a.id,
  tenantId: a.tenantId,
  employeeId: a.employeeId,
  assetCode: a.assetCode,
  assetName: a.assetName,
  assetType: a.assetType,
  serialNumber: a.serialNumber,
  brand: a.brand,
  model: a.model,
  assignedDate: a.assignedDate,
  returnDate: a.returnDate,
  status: a.status,
  remarks: a.remarks,
  employee: a.employee ? {
    id: a.employee.id,
    employeeCode: a.employee.employeeCode,
    name: `${a.employee.firstName} ${a.employee.lastName}`,
  } : null,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
} : null;

class EmployeeAssetService {
  async getAll(tenantId, query) {
    const r = await repo.findAll({ tenantId, query });
    r.data = r.data.map(assetToDTO);
    return r;
  }

  async getById(id, tenantId) {
    const d = await repo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Asset not found');
    return assetToDTO(d);
  }

  async create(data, tenantId, userId) {
    // Auto-generate asset code if not provided
    if (!data.assetCode) {
      data.assetCode = await repo.getNextAssetCode(tenantId);
    }
    const created = await repo.create({
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    return assetToDTO(await repo.findById(created.id, tenantId));
  }

  async update(id, data, tenantId, userId) {
    const d = await repo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Asset not found');
    await repo.update(id, tenantId, { ...data, updatedBy: userId });
    return assetToDTO(await repo.findById(id, tenantId));
  }

  async delete(id, tenantId) {
    const d = await repo.findById(id, tenantId);
    if (!d) throw new NotFoundError('Asset not found');
    await repo.delete(id, tenantId);
    return { success: true };
  }

  async getByEmployee(employeeId, tenantId) {
    const r = await repo.findAll({ tenantId, query: { employeeId, limit: 100 } });
    r.data = r.data.map(assetToDTO);
    return r;
  }
}

module.exports = new EmployeeAssetService();
