const db = require('./config/database');
(async () => {
  const [bal] = await db.query(
    "SELECT item_id, warehouse_id, quantity_on_hand FROM inventory_balances WHERE item_id='344edaf4-ada4-41dc-9d50-936d1516ed12' AND warehouse_id='5e87abc8-973c-4e73-8b25-e0860dd2a4cf'"
  );
  console.log('balance:', JSON.stringify(bal));

  const [txn] = await db.query(
    "SELECT transaction_type, quantity_in, quantity_out, running_balance, unit_cost FROM inventory_transactions WHERE item_id='344edaf4-ada4-41dc-9d50-936d1516ed12' ORDER BY transaction_date DESC LIMIT 3"
  );
  console.log('transactions:', JSON.stringify(txn));

  process.exit(0);
})();
