const express = require('express');
const ctrl = require('../controllers/MasterDataController');
const router = express.Router();

// Countries
router.get('/countries', ctrl.getCountries);
router.get('/countries/:id', ctrl.getCountry);
router.post('/countries', ctrl.createCountry);
router.put('/countries/:id', ctrl.updateCountry);
router.delete('/countries/:id', ctrl.deleteCountry);

// States
router.get('/states', ctrl.getStates);
router.post('/states', ctrl.createState);
router.put('/states/:id', ctrl.updateState);
router.delete('/states/:id', ctrl.deleteState);

// Cities
router.get('/cities', ctrl.getCities);
router.post('/cities', ctrl.createCity);
router.put('/cities/:id', ctrl.updateCity);
router.delete('/cities/:id', ctrl.deleteCity);

// Generic master data (type-based)
router.get('/data', ctrl.getMasterData);
router.post('/data', ctrl.createMasterData);
router.put('/data/:id', ctrl.updateMasterData);
router.delete('/data/:id', ctrl.deleteMasterData);

// Audit
router.get('/audit', ctrl.getAuditLogs);

module.exports = router;
