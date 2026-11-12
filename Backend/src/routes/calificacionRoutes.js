const { Router } = require('express');
const router = Router();

const calificacionController = require('../controllers/calificacionController');
const { validarCrearCalificacion } = require('../middleware/validarCalificacion');

router.get('/recientes', calificacionController.obtenerRecientes);
router.post('/', validarCrearCalificacion, calificacionController.crearCalificacion);

module.exports = router;