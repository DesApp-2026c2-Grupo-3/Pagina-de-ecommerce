const { Router } = require('express');
const router = Router();
const { validarCrearDireccion, validarActualizarDireccion } = require('../middleware/validarDireccion');
const { esIdValido } = require('../middleware/esIdValido');

const direccionController = require('../controllers/direccionController');

router.get('/usuario/:usuarioId', direccionController.obtenerDireccionesPorUsuario);
router.post('/', direccionController.crearDireccion);
router.post('/', validarCrearDireccion, crearDireccion);
router.put('/:id', esIdValido, validarActualizarDireccion, actualizarDireccion);
router.put('/:id', direccionController.actualizarDireccion);
router.delete('/:id', direccionController.eliminarDireccion);

module.exports = router;