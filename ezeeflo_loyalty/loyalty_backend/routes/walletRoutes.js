const express = require('express');
const router = express.Router();
const walletController = require('../controllers/WalletController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/customer/:customerId', requirePermission('wallet.view'), walletController.getCustomerWallet);
router.get('/customer', requirePermission('wallet.view'), walletController.getCustomerWallet);
router.get('/', requirePermission('wallet.view'), walletController.getWalletsSummary);

module.exports = router;
