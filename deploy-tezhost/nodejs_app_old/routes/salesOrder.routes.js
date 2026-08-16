'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/SalesOrderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', authorize('salesorder.view'), (req, res, next) => ctrl.list(req, res, next));
router.get('/:id', authorize('salesorder.view'), (req, res, next) => ctrl.getById(req, res, next));
router.post('/', authorize('salesorder.create'), (req, res, next) => ctrl.create(req, res, next));
router.put('/:id', authorize('salesorder.edit'), (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', authorize('salesorder.delete'), (req, res, next) => ctrl.delete(req, res, next));
router.patch('/:id/approve', authorize('salesorder.approve'), (req, res, next) => ctrl.approve(req, res, next));
router.patch('/:id/close', authorize('salesorder.edit'), (req, res, next) => ctrl.close(req, res, next));
router.post('/:id/send-email', authorize('salesorder.view'), (req, res, next) => ctrl.sendEmail(req, res, next));

module.exports = router;