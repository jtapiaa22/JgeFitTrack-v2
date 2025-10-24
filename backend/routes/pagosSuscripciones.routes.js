const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosSuscripciones.controller');

// Listar
router.get('/:id_cliente', auth, pagosController.getPagosByCliente);

// Crear
router.post('/', auth, pagosController.createPagoSuscripcion);

// Editar
router.put('/:id', auth, pagosController.updatePagoSuscripcion);

// Borrar
router.delete('/:id', auth, pagosController.deletePagoSuscripcion);

module.exports = router;
