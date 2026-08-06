'use strict';
const { v4: uuidv4 } = require('uuid');

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roleId = uuidv4();
    const adminRoleId = uuidv4();

    // Create roles
    await queryInterface.bulkInsert('roles', [
      { id: roleId, company_id: COMPANY_ID, name: 'Manager', code: 'manager', description: 'Full access manager role', is_active: true, is_system: true, created_at: now, updated_at: now },
      { id: adminRoleId, company_id: COMPANY_ID, name: 'Administrator', code: 'admin', description: 'System administrator', is_active: true, is_system: true, created_at: now, updated_at: now },
    ]);

    // Fetch all permissions
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE company_id = '${COMPANY_ID}'`
    );

    // Assign all permissions to admin role
    const rolePermissionRecords = permissions.map(p => ({
      id: uuidv4(),
      role_id: adminRoleId,
      permission_id: p.id,
      company_id: COMPANY_ID,
      created_at: now,
    }));

    // Assign view permissions to manager role
    const viewPermissions = ['dashboard.view', 'users.view', 'roles.view', 'customers.view', 'loyalty.view', 'transactions.view', 'membership.view', 'rewards.view', 'campaigns.view', 'coupons.view', 'giftcards.view', 'referrals.view', 'reports.view', 'settings.view', 'audit.view'];
    const [viewPermRows] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE company_id = '${COMPANY_ID}' AND code IN ('${viewPermissions.join("','")}')`
    );
    viewPermRows.forEach(p => {
      rolePermissionRecords.push({
        id: uuidv4(),
        role_id: roleId,
        permission_id: p.id,
        company_id: COMPANY_ID,
        created_at: now,
      });
    });

    if (rolePermissionRecords.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissionRecords);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', { company_id: COMPANY_ID });
    await queryInterface.bulkDelete('roles', { company_id: COMPANY_ID });
  },
};
