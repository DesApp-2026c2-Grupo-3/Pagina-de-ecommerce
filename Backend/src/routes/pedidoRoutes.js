const { Router } = require('express');
const router = Router();

const pedidoController = require('../controllers/pedidoController');

router.get('/', pedidoController.obtenerPedidos);
router.post('/', pedidoController.crearPedido);
router.get('/:id', pedidoController.obtenerPedidoId);
router.get('/usuario/:usuarioId', pedidoController.obtenerPedidosPorUsuario);

module.exports = router;