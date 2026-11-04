const { Router } = require('express');
const router = Router();

const calificacionController = require('../controllers/calificacionController');
const { validarCrearCalificacion, validarEditarCalificacion } = require('../middleware/validarCalificacion');
const { esIdValido } = require('../middleware/esIdValido');

router.get('/pendiente', calificacionController.obtenerPendiente);
router.post('/', validarCrearCalificacion, calificacionController.crearCalificacion);
router.patch('/:id', esIdValido, validarEditarCalificacion, calificacionController.editarCalificacion);

module.exports = router;
