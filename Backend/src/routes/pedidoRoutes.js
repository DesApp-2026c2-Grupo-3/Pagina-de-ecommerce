const { Router } = require('express');
const router = Router();
const { validarPedido } = require('../middleware/validarPedido')
const pedidoController = require('../controllers/pedidoController');
const { repetirPedido } = require('../controllers/repetirPedidoController');
const { esIdValido } = require('../middleware/esIdValido');
const { autenticarUsuario } = require('../middleware/autenticacion');

// Plan de clientes, C-2: todas las rutas de pedidos exigen la sesión del cliente.
// El usuario sale siempre del token (req.identidad), nunca del cuerpo, la query ni la URL.
router.get('/mios', autenticarUsuario, pedidoController.obtenerPedidosPorUsuario);
router.get('/cliente/:id', esIdValido, autenticarUsuario, pedidoController.obtenerPedidoClienteId);
router.post('/', autenticarUsuario, validarPedido, pedidoController.crearPedido);
// Antes de confirmar: costo de envío y tiempo estimado
router.post('/cotizar', autenticarUsuario, pedidoController.cotizarEnvio);
router.get('/:id/repetir', esIdValido, autenticarUsuario, repetirPedido);

module.exports = router;
