const express = require('express');
const userCtrl = require('../controllers/UserController');
const { createUser, updateUser, validateId } = require('../validators/userValidator');

const router = express.Router();
router.get('/', userCtrl.getAll);
router.post('/', createUser, userCtrl.create);
router.get('/:id', validateId, userCtrl.getById);
router.put('/:id', validateId, updateUser, userCtrl.update);
router.delete('/:id', validateId, userCtrl.delete);
router.post('/:id/lock', validateId, userCtrl.lock);
router.post('/:id/unlock', validateId, userCtrl.unlock);
router.post('/:id/reset-password', validateId, userCtrl.resetPassword);

module.exports = router;
