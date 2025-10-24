const express = require('express');
const router = express.Router();
const pagosAlumnosController = require('../controllers/pagosAlumnos.controller');

router.get('/:id_alumno', pagosAlumnosController.getPagosByAlumno);
router.post('/', pagosAlumnosController.createPagoAlumno);

module.exports = router;
