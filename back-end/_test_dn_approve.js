const DebitNoteService = require('./services/DebitNoteService');
(async () => {
  try {
    const r = await DebitNoteService.approve(
      '11111111-1111-1111-1111-111111111111',
      '00000000-0000-0000-0000-000000000001',
      '80ffa805-75ec-4e69-a0ab-0b804c116ede',
      {}
    );
    console.log('APPROVED:', r.debitNoteNumber, r.status, 'journalEntryId:', r.journalEntryId);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
