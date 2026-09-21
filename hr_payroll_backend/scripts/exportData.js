const sequelize = require('../config/database');
(async () => {
  await sequelize.authenticate();
  const companyId = '05302d74-0ae1-4aa2-97a4-f9ed2783f175';

  // Audit logs
  const [logs] = await sequelize.query("SELECT id, super_admin_id, action, entity_type, description, ip_address, created_at FROM super_admin_audit_logs ORDER BY created_at DESC LIMIT 5");
  console.log('=== super_admin_audit_logs (' + logs.length + ' rows) ===');
  console.log(JSON.stringify(logs, null, 2));

  // Departments created for company
  const [deps] = await sequelize.query("SELECT id, name, code, tenant_id, is_active FROM departments WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6");
  console.log('=== departments (' + deps.length + ' rows) ===');
  console.log(JSON.stringify(deps, null, 2));

  // Leave types
  const [lts] = await sequelize.query("SELECT id, name, code, leave_category, max_days_per_year, is_paid, tenant_id FROM leave_types WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5");
  console.log('=== leave_types (' + lts.length + ' rows) ===');
  console.log(JSON.stringify(lts, null, 2));

  // Designations
  const [desigs] = await sequelize.query("SELECT id, name, code, tenant_id FROM designations WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5");
  console.log('=== designations (' + desigs.length + ' rows) ===');
  console.log(JSON.stringify(desigs, null, 2));

  // Branches
  const [branches] = await sequelize.query("SELECT id, name, code, tenant_id FROM branches WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 3");
  console.log('=== branches (' + branches.length + ' rows) ===');
  console.log(JSON.stringify(branches, null, 2));

  // Company admin user
  const [admins] = await sequelize.query("SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE role='company_admin' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 3");
  console.log('=== users/company_admins (' + admins.length + ' rows) ===');
  console.log(JSON.stringify(admins, null, 2));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
