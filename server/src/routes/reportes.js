const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/cuenta-corriente/:clienteId', reportesController.getCuentaCorriente);
router.get('/resumen-general', reportesController.getResumenGeneral);

module.exports = router;

