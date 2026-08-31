const { Router } = require('express');
const router = Router();

const productoController = require('../controllers/productoController');

router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;