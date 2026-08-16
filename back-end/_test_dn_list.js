const DebitNoteService = require('./services/DebitNoteService');
(async () => {
  try {
    const result = await DebitNoteService.findAll('11111111-1111-1111-1111-111111111111', {
      page: 1, limit: 10, search: '', status: '', supplierId: ''
    });
    console.log('OK rows:', result.rows.length, 'count:', result.count);
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
})();
