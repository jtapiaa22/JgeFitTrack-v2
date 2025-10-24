const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnos.controller');

//listar alumnos por profespr
router.get('/:id_cliente', alumnosController.getAlumnosByProfesor);

//crear alumno
router.post('/', alumnosController.createAlumno);

//editar alumno
router.put('/:id', alumnosController.updateAlumno);

//borrar alumno
router.delete('/:id', alumnosController.deleteAlumno);


module.exports = router;