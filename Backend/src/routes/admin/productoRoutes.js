const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/productoController');
const { validarProducto } = require('../../middleware/validarProducto');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');

router.get('/', esMasterJwt, adminController.obtenerProductos);
router.get('/eliminados', esMasterJwt, adminController.obtenerProductosEliminados);
router.get('/:id', esIdValido, adminController.obtenerProductoPorId);
router.post('/nuevo', esMasterJwt, validarProducto, adminController.crearProducto);
router.patch('/editar/:id', esMasterJwt, validarProducto, esIdValido, adminController.editarProductoPorId);
router.delete('/eliminar/:id', esMasterJwt, esIdValido, adminController.eliminarProducto);
router.get('/:id/stock', esMasterJwt, esIdValido, adminController.verStockProducto);
router.patch('/restaurar/:id', esMasterJwt, esIdValido, adminController.restaurarProducto);


module.exports = router;