const BaseRepository = require('./BaseRepository');
const { Tenant, UserTenant, User } = require('../models');

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Tenant);
  }

  async findUserCompanies(userId) {
    return await Tenant.findAll({
      include: [
        {
          model: UserTenant,
          where: { userId },
          attributes: ['isDefault'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findUserCompanyIds(userId) {
    const userTenants = await UserTenant.findAll({
      where: { userId },
      attributes: ['tenantId'],
    });
    return userTenants.map(ut => ut.tenantId);
  }

  async userHasCompanyAccess(userId, tenantId) {
    const count = await UserTenant.count({
      where: { userId, tenantId },
    });
    return count > 0;
  }

  async assignUserToCompany(userId, tenantId, createdBy = null) {
    const [record, created] = await UserTenant.findOrCreate({
      where: { userId, tenantId },
      defaults: {
        userId,
        tenantId,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Check if this is the user's first company — if so, set as default
    const count = await UserTenant.count({ where: { userId } });
    if (count === 1) {
      await record.update({ isDefault: true });
    }

    return record;
  }

  async removeUserFromCompany(userId, tenantId) {
    return await UserTenant.destroy({
      where: { userId, tenantId },
    });
  }

  async setDefaultCompany(userId, tenantId) {
    // Unset all defaults for this user
    await UserTenant.update(
      { isDefault: false },
      { where: { userId } }
    );
    // Set the new default
    await UserTenant.update(
      { isDefault: true },
      { where: { userId, tenantId } }
    );
  }

  async getDefaultCompany(userId) {
    return await Tenant.findOne({
      include: [
        {
          model: UserTenant,
          where: { userId, isDefault: true },
          required: true,
        },
      ],
    });
  }

  async findByIdWithDetails(id) {
    return await Tenant.findByPk(id);
  }

  async findBySubdomain(subdomain) {
    return await Tenant.findOne({ where: { subdomain } });
  }
}

module.exports = new CompanyRepository();
