'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const CreditNoteController = require('../controllers/CreditNoteController');
const creditNoteValidator = require('../validators/creditNoteValidator');
const { authenticate, authorize, tenancy } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/:tenantId/credit-notes - List credit notes (with pagination, filtering)
router.get(
  '/',
  authorize('creditnote.view'),
  CreditNoteController.list
);

// POST /api/:tenantId/credit-notes - Create credit note
router.post(
  '/',
  authorize('creditnote.create'),
  creditNoteValidator.create,
  CreditNoteController.create
);

// GET /api/:tenantId/credit-notes/:id - Get credit note by ID
router.get(
  '/:id',
  authorize('creditnote.view'),
  creditNoteValidator.idParam,
  CreditNoteController.getById
);

// PUT /api/:tenantId/credit-notes/:id - Update credit note
router.put(
  '/:id',
  authorize('creditnote.edit'),
  creditNoteValidator.update,
  CreditNoteController.update
);

// DELETE /api/:tenantId/credit-notes/:id - Delete credit note
router.delete(
  '/:id',
  authorize('creditnote.delete'),
  creditNoteValidator.idParam,
  CreditNoteController.delete
);

// POST /api/:tenantId/credit-notes/:id/post - Post credit note (accounting + inventory)
router.post(
  '/:id/post',
  authorize('creditnote.post'),
  creditNoteValidator.updateStatus,
  CreditNoteController.post
);

// POST /api/:tenantId/credit-notes/:id/cancel - Cancel credit note
router.post(
  '/:id/cancel',
  authorize('creditnote.cancel'),
  creditNoteValidator.updateStatus,
  CreditNoteController.cancel
);

module.exports = router;