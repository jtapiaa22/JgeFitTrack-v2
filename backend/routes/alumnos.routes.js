const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnos.controller');

// Solo usuarios autenticados pueden listar alumnos
router.get('/:id_cliente', auth, alumnosController.getAlumnosByProfesor);

//listar alumnos por profespr
router.get('/:id_cliente', auth, alumnosController.getAlumnosByProfesor);

//crear alumno
router.post('/', auth, alumnosController.createAlumno);

//editar alumno
router.put('/:id', auth, alumnosController.updateAlumno);

//borrar alumno
router.delete('/:id', auth, alumnosController.deleteAlumno);



module.exports = router;