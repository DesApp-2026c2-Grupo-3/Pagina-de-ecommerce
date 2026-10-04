const { Router } = require('express');
const router = Router();
const { validarPedido } = require('../middleware/validarPedido')
const pedidoController = require('../controllers/pedidoController');
const { repetirPedido } = require('../controllers/repetirPedidoController');
const { esIdValido } = require('../middleware/esIdValido');

router.get('/', pedidoController.obtenerPedidos);
router.post('/', validarPedido, pedidoController.crearPedido);
router.get('/:id', pedidoController.obtenerPedidoId);
router.get('/usuario/:usuarioId', pedidoController.obtenerPedidosPorUsuario);
router.get('/:id/repetir', esIdValido, repetirPedido);

module.exports = router;