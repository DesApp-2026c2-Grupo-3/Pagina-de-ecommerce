const { Router } = require('express');
const router = Router();

const productoController = require('../controllers/productoController');
const { obtenerMasPedidos } = require('../controllers/masPedidosController');

router.get('/', productoController.obtenerProductos);
router.get('/mas-pedidos', obtenerMasPedidos);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;