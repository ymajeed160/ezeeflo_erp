const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'c28.eelserver.com',
    user: 'ezeefloc_erp',
    password: 'Memits@396',
    database: 'ezeefloc_erp',
    port: 3306
  });

  const companyId = '11111111-1111-1111-1111-111111111111';

  console.log('=== COMPANY ===');
  const [tenants] = await conn.query('SELECT id, company_name FROM tenants WHERE id = ?', [companyId]);
  console.log(tenants);

  console.log('\n=== SUBSCRIPTIONS for company ===');
  const [subs] = await conn.query(
    `SELECT cs.id, cs.subscription_number, cs.status, cs.start_date, cs.end_date, 
            sp.id as plan_id, sp.plan_name, sp.plan_code
     FROM company_subscriptions cs
     LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
     WHERE cs.tenant_id = ?`, [companyId]
  );
  console.log(JSON.stringify(subs, null, 2));

  if (subs.length > 0) {
    // For each subscription, check the company_subscription_modules
    for (const sub of subs) {
      console.log(`\n=== SUBSCRIPTION MODULES for subscription ${sub.id} (${sub.subscription_number}) ===`);
      const [csModules] = await conn.query(
        `SELECT csm.id, csm.module_id, csm.is_enabled, sm.module_name, sm.module_code
         FROM company_subscription_modules csm
         JOIN subscription_modules sm ON csm.module_id = sm.id
         WHERE csm.subscription_id = ?`, [sub.id]
      );
      console.log(JSON.stringify(csModules, null, 2));
    }

    // Also check what the enabled-modules endpoint would return
    console.log('\n=== ENABLED MODULES (via endpoint logic) ===');
    const [enabledModules] = await conn.query(
      `SELECT DISTINCT sm.module_code, sm.module_name
       FROM company_subscriptions cs
       JOIN company_subscription_modules csm ON csm.subscription_id = cs.id
       JOIN subscription_modules sm ON csm.module_id = sm.id
       WHERE cs.tenant_id = ?
         AND cs.status IN ('active', 'trial')
         AND csm.is_enabled = 1`, [companyId]
    );
    console.log(JSON.stringify(enabledModules, null, 2));
  }

  // Check the user
  console.log('\n=== USER ===');
  const [users] = await conn.query(
    `SELECT id, email, tenant_id, role_id FROM users WHERE email = ?`, ['yasir@me-mits.com']
  );
  console.log(JSON.stringify(users, null, 2));

  if (users.length > 0) {
    console.log(`\n=== USER's TENANTS ===`);
    const [userTenants] = await conn.query(
      `SELECT ut.tenant_id, t.company_name 
       FROM user_tenants ut
       JOIN tenants t ON ut.tenant_id = t.id
       WHERE ut.user_id = ?`, [users[0].id]
    );
    console.log(JSON.stringify(userTenants, null, 2));
  }

  await conn.end();
}

main().catch(console.error);
