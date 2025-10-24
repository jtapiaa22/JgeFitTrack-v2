const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// Listar
router.get('/', clientesController.getClientes);

// Registro (crear cliente con bcrypt)
router.post('/', clientesController.registroCliente);

// loguear
router.post('/login', clientesController.loginCliente);

// Editar y borrar (protegidos)
router.put('/:id', auth, clientesController.updateCliente);
router.delete('/:id', auth, clientesController.deleteCliente);

module.exports = router;
