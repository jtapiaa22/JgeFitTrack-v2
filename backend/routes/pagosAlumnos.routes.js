const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const pagosAlumnosController = require('../controllers/pagosAlumnos.controller');

router.get('/:id_alumno', auth, pagosAlumnosController.getPagosByAlumno);
router.post('/', auth, pagosAlumnosController.createPagoAlumno);
router.put('/:id', auth, pagosAlumnosController.updatePagoAlumno);
router.delete('/:id', auth, pagosAlumnosController.deletePagoAlumno);

module.exports = router;
