const express = require('express');
const router = express.Router();
const medicionesController = require('../controllers/mediciones.controller');

// Listar mediciones de un alumno
router.get('/:id_alumno', medicionesController.getMedicionesByAlumno);

// Crear medición
router.post('/', medicionesController.createMedicion);

//editar medicion
router.put('/:id', medicionesController.updateMedicion);

//borrar mediciones
router.delete('/:id', medicionesController.deleteMedicion);


module.exports = router;
