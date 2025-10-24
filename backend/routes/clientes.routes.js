const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// Listar
router.get('/', auth, clientesController.getClientes);
// Crear, editar, borrar (opcional proteger el registro si lo usará el público)
router.post('/', clientesController.registroCliente);
router.put('/:id', auth, clientesController.updateCliente);
router.delete('/:id', auth, clientesController.deleteCliente);

module.exports = router;
