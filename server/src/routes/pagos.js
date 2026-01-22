const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

router.get('/', pagosController.getAll);
router.get('/:id', pagosController.getById);
router.post('/', pagosController.create);
router.post('/batch', pagosController.createBatch);
router.put('/:id', pagosController.update);
router.put('/:id/rebotar', pagosController.marcarChequeRebotado);
router.delete('/:id', pagosController.delete);

module.exports = router;

