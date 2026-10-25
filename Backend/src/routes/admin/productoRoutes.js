const { Router } = require('express');
const router = Router();

const adminController = require('../../controllers/admin/productoController');
const { validarProducto } = require('../../middleware/validarProducto');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { subirImagen } = require('../../middleware/admin/subirImagen');
const imagenController = require('../../controllers/admin/imagenProductoController');

// Imagen del producto en Cloudinary (van antes de las rutas con :id)
router.post('/imagen', esMasterJwt, subirImagen, imagenController.subirImagen);
router.delete('/imagen', esMasterJwt, imagenController.descartarImagen);
router.get('/', esMasterJwt, adminController.obtenerProductos);
router.get('/:id', esIdValido, adminController.obtenerProductoPorId);
router.post('/nuevo', esMasterJwt, validarProducto, adminController.crearProducto);
router.patch('/editar/:id', esMasterJwt, validarProducto, esIdValido, adminController.editarProductoPorId);
router.delete('/eliminar/:id', esMasterJwt, esIdValido, adminController.eliminarProducto);
router.get('/:id/stock', esMasterJwt, esIdValido, adminController.verStockProducto);

module.exports = router;