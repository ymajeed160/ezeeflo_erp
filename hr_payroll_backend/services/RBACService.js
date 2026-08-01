const { Role, Permission, RolePermission, UserRole } = require('../models');
const { Op } = require('sequelize');

// ── Role Service ──
class RoleService {
  async getAll(query) {
    const { page = 1, limit = 10, search = '' } = query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    const { count, rows } = await Role.findAndCountAll({
      where, include: [{ model: Permission, as: 'permissions', through: { attributes: [] }, required: false }],
      order: [['sortOrder', 'ASC']], offset: (page - 1) * limit, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } };
  }
  async getById(id) { return Role.findByPk(id, { include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }] }); }
  async create(data, userId) { return Role.create({ ...data, createdBy: userId, updatedBy: userId }); }
  async update(id, data, userId) { const r = await Role.findByPk(id); if (!r) return null; return r.update({ ...data, updatedBy: userId }); }
  async delete(id) { const r = await Role.findByPk(id); if (!r) return null; if (r.isSystem) throw new Error('Cannot delete system roles'); return r.destroy(); }
  async assignPermissions(roleId, permissionIds) {
    await RolePermission.destroy({ where: { roleId }, force: true });
    if (permissionIds.length > 0) {
      await RolePermission.bulkCreate(permissionIds.map(pid => ({ roleId, permissionId: pid })));
    }
    return this.getById(roleId);
  }
}

// ── Permission Service ──
class PermissionService {
  async getAll(query) {
    const { search = '' } = query;
    const where = {};
    if (search) where[Op.or] = [{ code: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }];
    const rows = await Permission.findAll({ where, order: [['group', 'ASC'], ['code', 'ASC']] });
    // Group by group
    const groups = {};
    rows.forEach(p => {
      const g = p.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return { groups, total: rows.length };
  }
}

module.exports = { RoleService: new RoleService(), PermissionService: new PermissionService() };
