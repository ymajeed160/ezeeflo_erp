const db = require('./config/database');
(async () => {
  const [pr] = await db.query(
    "SELECT id, return_number, status, journal_entry_id FROM purchasereturns WHERE return_number='PRET-2026-00001'"
  );
  console.log('return:', JSON.stringify(pr));

  const [it] = await db.query(
    "SELECT transaction_type, quantity, unit_cost, total_cost, reference_number FROM inventory_transactions WHERE reference_number='PRET-2026-00001'"
  );
  console.log('inventory:', JSON.stringify(it));

  const [je] = await db.query(
    "SELECT id, reference, description FROM journal_entries WHERE reference LIKE '%PRET-2026-00001%'"
  );
  console.log('journal:', JSON.stringify(je));

  process.exit(0);
})();
