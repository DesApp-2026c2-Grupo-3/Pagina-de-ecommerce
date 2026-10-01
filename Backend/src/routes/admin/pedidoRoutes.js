const { Router } = require('express');
const router = Router();

const pedidoController = require('../../controllers/admin/pedidoController');
const { esIdValido } = require('../../middleware/esIdValido');

router.get('/sucursal/:id', esIdValido, pedidoController.obtenerPedidosPorSucursal);
router.get('/:id', esIdValido, pedidoController.obtenerPedidoPorId);

module.exports = router;