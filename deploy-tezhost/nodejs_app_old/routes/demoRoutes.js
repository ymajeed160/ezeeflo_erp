'use strict';

const express = require('express');
const router = express.Router();
const demoRequestController = require('../controllers/DemoRequestController');

// POST /api/demo-request — Public endpoint, no auth required
router.post('/', demoRequestController.submitRequest.bind(demoRequestController));

module.exports = router;
