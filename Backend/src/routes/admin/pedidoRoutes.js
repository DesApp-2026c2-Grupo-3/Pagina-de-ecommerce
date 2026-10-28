const { Router } = require('express');
const router = Router();

const pedidoController = require('../../controllers/admin/pedidoController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esPersonalJwt, esEmpleadoJwt } = require('../../middleware/admin/autenticarRoles');
const { validarEstadoPedido } = require('../../middleware/admin/validarPedido');

// Master, encargado y empleado pueden VER pedidos (cada uno, dentro de su alcance)
router.get('/sucursal/:id', esIdValido, esPersonalJwt, pedidoController.obtenerPedidosPorSucursal);
router.get('/:id', esIdValido, esPersonalJwt, pedidoController.obtenerPedidoPorId);
// Solo el empleado de la sucursal cambia el estado de un pedido
router.patch('/editar/estado/:id', esIdValido, esEmpleadoJwt, validarEstadoPedido, pedidoController.cambiarEstadoPedidoPorId);

module.exports = router;
