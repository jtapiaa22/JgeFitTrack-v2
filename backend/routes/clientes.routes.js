const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// Login (sin auth)
router.post('/login', clientesController.loginCliente);

// Registro
router.post('/', clientesController.registroCliente);

// Rutas protegidas
router.get('/', auth, clientesController.getClientes);
router.get('/estadisticas', auth, clientesController.getEstadisticas);
router.put('/:id', auth, clientesController.updateCliente);
router.patch('/:id/toggle-activo', auth, adminAuth, clientesController.toggleActivoCliente);
router.patch('/:id/extender-prueba', auth, adminAuth, clientesController.extenderPrueba);
router.delete('/:id', auth, adminAuth, clientesController.deleteCliente);

module.exports = router;
