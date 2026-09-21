const { Router } = require('express');
const router = Router();

const direccionController = require('../controllers/direccionController');

router.get('/usuario/:usuarioId', direccionController.obtenerDireccionesPorUsuario);
router.post('/', direccionController.crearDireccion);
router.put('/:id', direccionController.actualizarDireccion);
router.delete('/:id', direccionController.eliminarDireccion);

module.exports = router;