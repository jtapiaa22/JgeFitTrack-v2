const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const pagosAlumnosController = require('../controllers/pagosAlumnos.controller');

//por alumno
router.get('/alumno/:id_alumno', auth, pagosAlumnosController.getPagosByAlumno);

//por profesor
router.get('/profesor/:id_profesor', auth, pagosAlumnosController.getPagosByProfesor);

router.post('/', auth, pagosAlumnosController.createPagoAlumno);
router.put('/:id', auth, pagosAlumnosController.updatePagoAlumno);
router.delete('/:id', auth, pagosAlumnosController.deletePagoAlumno);

module.exports = router;