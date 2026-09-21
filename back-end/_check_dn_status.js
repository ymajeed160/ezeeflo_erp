const db = require('./config/database');
(async () => {
  const [r] = await db.query("SELECT id, debit_note_number, status FROM debit_notes WHERE id='80ffa805-75ec-4e69-a0ab-0b804c116ede'");
  console.log(JSON.stringify(r));
  process.exit(0);
})();
