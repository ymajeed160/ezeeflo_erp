const db = require('./config/database');
(async () => {
  const [supplier] = await db.query(
    "SELECT id, name, ap_account_id FROM suppliers WHERE id='80559037-24ad-4fc9-b409-e8dabde65844'"
  );
  console.log('supplier:', JSON.stringify(supplier));

  const [item] = await db.query(
    "SELECT id, name, item_type, inventory_account_id, expense_account_id FROM items WHERE id='344edaf4-ada4-41dc-9d50-936d1516ed12'"
  );
  console.log('item:', JSON.stringify(item));

  const [apAcct] = await db.query(
    "SELECT id, name, account_type FROM accounts WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND account_type='liability' AND name LIKE '%Accounts Payable%' LIMIT 3"
  );
  console.log('AP accounts:', JSON.stringify(apAcct));

  process.exit(0);
})();
