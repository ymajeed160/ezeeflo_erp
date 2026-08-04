'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/PurchaseReturnController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.use(auth);

router.get('/', rbac('purchasereturn.view'), controller.getAll);
router.get('/:id', rbac('purchasereturn.view'), controller.getById);
router.post('/', rbac('purchasereturn.create'), controller.create);
router.put('/:id', rbac('purchasereturn.create'), controller.update);
router.patch('/:id/approve', rbac('purchasereturn.approve'), controller.approve);
router.patch('/:id/reject', rbac('purchasereturn.approve'), controller.reject);
router.delete('/:id', rbac('purchasereturn.create'), controller.delete);

module.exports = router;