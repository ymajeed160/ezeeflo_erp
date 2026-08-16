'use strict';
const express = require('express');
const router = express.Router();
const goodsReceiptController = require('../controllers/GoodsReceiptController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const goodsReceiptValidator = require('../validators/goodsReceiptValidator');

router.use(authenticate);

router.get('/', authorize('goodsreceipt.view'), goodsReceiptController.list);
router.get('/:id', authorize('goodsreceipt.view'), goodsReceiptController.getById);
router.post('/', authorize('goodsreceipt.create'), goodsReceiptValidator.createGoodsReceipt, goodsReceiptController.create);
router.put('/:id', authorize('goodsreceipt.edit'), goodsReceiptValidator.updateGoodsReceipt, goodsReceiptController.update);
router.delete('/:id', authorize('goodsreceipt.delete'), goodsReceiptController.delete);
router.patch('/:id/approve', authorize('goodsreceipt.approve'), goodsReceiptController.approve);
router.patch('/:id/cancel', authorize('goodsreceipt.approve'), goodsReceiptController.cancel);
router.post('/:id/send-email', authorize('goodsreceipt.view'), goodsReceiptController.sendEmail);

module.exports = router;