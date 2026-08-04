const express = require('express');
const router = express.Router();
const DebitNoteController = require('../controllers/DebitNoteController');
const { authenticate, authorizeTenant } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateCreate, validateUpdate } = require('../validators/debitNoteValidator');

router.use(authenticate);
router.use(authorizeTenant);

router.get('/', checkPermission('debitnote.view'), DebitNoteController.getAll);
router.get('/:id', checkPermission('debitnote.view'), DebitNoteController.getById);
router.post('/', checkPermission('debitnote.create'), validateCreate, DebitNoteController.create);
router.put('/:id', checkPermission('debitnote.edit'), validateUpdate, DebitNoteController.update);
router.delete('/:id', checkPermission('debitnote.delete'), DebitNoteController.delete);
router.post('/:id/approve', checkPermission('debitnote.approve'), DebitNoteController.approve);
router.post('/actions/generate-from-return', checkPermission('debitnote.create'), DebitNoteController.generateFromReturn);

module.exports = router;