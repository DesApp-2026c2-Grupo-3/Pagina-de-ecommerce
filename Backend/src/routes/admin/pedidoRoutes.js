const { Router } = require('express');
const router = Router();

const pedidoController = require('../../controllers/admin/pedidoController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/sucursal/:id', esIdValido, esAdminJwt, pedidoController.obtenerPedidosPorSucursal);
router.get('/:id', esIdValido, esAdminJwt, pedidoController.obtenerPedidoPorId);
router.patch('/editar/estado/:id', esIdValido, esAdminJwt, pedidoController.cambiarEstadoPedidoPorId);

module.exports = router;