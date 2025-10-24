const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const medicionesController = require('../controllers/mediciones.controller');

router.get('/:id_alumno', auth, medicionesController.getMedicionesByAlumno);
router.post('/', auth, medicionesController.createMedicion);
router.put('/:id', auth, medicionesController.updateMedicion);
router.delete('/:id', auth, medicionesController.deleteMedicion);

module.exports = router;

