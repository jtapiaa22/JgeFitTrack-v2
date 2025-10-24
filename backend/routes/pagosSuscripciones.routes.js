const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosSuscripciones.controller');


router.get('/:id_cliente', pagosController.getPagosByCliente);

router.post('/', pagosController.createPagoSuscripcion);

router.put('/:id', pagosController.updatePagoSuscripcion);

router.delete('/:id', pagosController.deletePagoSuscripcion);


module.exports = router;
