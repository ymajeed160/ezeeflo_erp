const db = require('./config/database');
(async () => {
  const [dn] = await db.query("SELECT id, debit_note_number, status, journal_entry_id FROM debit_notes WHERE id='80ffa805-75ec-4e69-a0ab-0b804c116ede'");
  console.log('debit note:', JSON.stringify(dn));
  if (dn.length && dn[0].journal_entry_id) {
    const [je] = await db.query("SELECT id, reference, description, status FROM journal_entries WHERE id='" + dn[0].journal_entry_id + "'");
    console.log('journal entry:', JSON.stringify(je));
    const [lines] = await db.query("SELECT account_id, debit, credit, description FROM journal_entry_lines WHERE journal_entry_id='" + dn[0].journal_entry_id + "'");
    console.log('lines:', JSON.stringify(lines, null, 2));
  }
  process.exit(0);
})();
