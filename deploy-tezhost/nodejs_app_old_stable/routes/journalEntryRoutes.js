const express = require('express');
const router = express.Router();
const journalEntryController = require('../controllers/JournalEntryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createEntryValidation,
  updateEntryValidation,
  idParam,
} = require('../validators/journalEntryValidation');

// All routes require authentication
router.use(authMiddleware);

// GET /api/journal-entries - List all entries (with optional filters)
router.get('/', requirePermission('journal-entries.read'), journalEntryController.getAllEntries);

// GET /api/journal-entries/next-reference - Get next reference number
router.get('/next-reference', requirePermission('journal-entries.create'), journalEntryController.getNextReference);

// GET /api/journal-entries/number/:entryNumber - Get entry by entry number
router.get('/number/:entryNumber', requirePermission('journal-entries.read'), journalEntryController.getEntryByNumber);

// GET /api/journal-entries/:id - Get entry by ID
router.get('/:id', requirePermission('journal-entries.read'), idParam, journalEntryController.getEntryById);

// POST /api/journal-entries - Create new journal entry
router.post('/', requirePermission('journal-entries.create'), createEntryValidation, journalEntryController.createEntry);

// PUT /api/journal-entries/:id - Update journal entry
router.put('/:id', requirePermission('journal-entries.update'), idParam.concat(updateEntryValidation), journalEntryController.updateEntry);

// DELETE /api/journal-entries/:id - Delete journal entry
router.delete('/:id', requirePermission('journal-entries.delete'), idParam, journalEntryController.deleteEntry);

// POST /api/journal-entries/:id/post - Post journal entry
router.post('/:id/post', requirePermission('journal-entries.update'), idParam, journalEntryController.postEntry);

// POST /api/journal-entries/:id/reverse - Reverse journal entry
router.post('/:id/reverse', requirePermission('journal-entries.create'), idParam, journalEntryController.reverseEntry);

module.exports = router;