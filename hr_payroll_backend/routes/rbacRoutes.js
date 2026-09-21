const express = require('express');
const { roleCtrl, permissionCtrl } = require('../controllers/RBACController');

const roleRoutes = express.Router();
roleRoutes.get('/', roleCtrl.getAll);
roleRoutes.post('/', roleCtrl.create);
roleRoutes.get('/:id', roleCtrl.getById);
roleRoutes.put('/:id', roleCtrl.update);
roleRoutes.delete('/:id', roleCtrl.delete);
roleRoutes.post('/:id/permissions', roleCtrl.assignPermissions);

const permRoutes = express.Router();
permRoutes.get('/', permissionCtrl.getAll);

module.exports = { roleRoutes, permRoutes };
