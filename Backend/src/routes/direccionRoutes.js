const { Router } = require('express');
const router = Router();
const { validarCrearDireccion, validarActualizarDireccion } = require('../middleware/validarDireccion');
const { esIdValido } = require('../middleware/esIdValido');

const direccionController = require('../controllers/direccionController');

router.get('/usuario/:usuarioId', direccionController.obtenerDireccionesPorUsuario);
router.post('/', validarCrearDireccion, direccionController.crearDireccion);
router.put('/:id', esIdValido, validarActualizarDireccion, direccionController.actualizarDireccion);
router.delete('/:id', esIdValido, direccionController.eliminarDireccion);
router.patch('/:id/predeterminada', esIdValido, direccionController.marcarPredeterminada);

module.exports = router;