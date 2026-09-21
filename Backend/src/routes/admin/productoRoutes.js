const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/productoController');


router.get('/', adminController.obtenerProductos);
router.get('/:id', adminController.obtenerProductoPorId);
router.post('/nuevo', adminController.crearProducto);
router.patch('/editar/:id', adminController.editarProductoPorId);
router.delete('/eliminar/:id', adminController.eliminarProducto);

module.exports = router;