const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/productoController');
const { validarProducto } = require('../../middleware/validarProducto');
const { esIdValido } = require('../../middleware/esIdValido');

router.get('/', adminController.obtenerProductos);
router.get('/:id', esIdValido, adminController.obtenerProductoPorId);
router.post('/nuevo', validarProducto, adminController.crearProducto);
router.patch('/editar/:id', validarProducto, esIdValido, adminController.editarProductoPorId);
router.delete('/eliminar/:id', esIdValido, adminController.eliminarProducto);

module.exports = router;