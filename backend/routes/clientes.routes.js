const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

//listar clientes
router.get('/', clientesController.getClientes);

//crear cliente
router.post('/', clientesController.createCliente);

//editar cliente
router.put('/:id', clientesController.updateCliente);

//borrar cliente
router.delete('/:id',clientesController.deleteCliente);

module.exports = router;