const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosSuscripciones.controller');

// Obtener todas las suscripciones (solo admin)
router.get('/', auth, adminAuth, pagosController.getAllSuscripciones);

// Por cliente específico
router.get('/:id_cliente', auth, pagosController.getPagosByCliente);

// Suscripción activa de un profesor
router.get('/:id_cliente/activa', auth, pagosController.getSuscripcionActiva);

// CRUD
router.post('/', auth, adminAuth, pagosController.createPagoSuscripcion);
router.put('/:id', auth, adminAuth, pagosController.updatePagoSuscripcion);
router.delete('/:id', auth, adminAuth, pagosController.deletePagoSuscripcion);

module.exports = router;
