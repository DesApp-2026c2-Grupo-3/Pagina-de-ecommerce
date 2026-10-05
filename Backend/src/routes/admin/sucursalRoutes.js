const { Router } = require('express');
const router = Router();

const sucursalController = require('../../controllers/admin/sucursalController');
const { validarSucursal } = require('../../middleware/admin/validarSucursal');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');

router.get('/', esMasterJwt, sucursalController.obtenerSucursales);
router.get('/:id', esIdValido, sucursalController.obtenerSucursalPorId);
router.post('/nueva', esMasterJwt, validarSucursal, sucursalController.crearSucursal);
router.patch('/editar/:id', esIdValido, validarSucursal, sucursalController.editarSucursal);
router.patch('/estado/:id', esMasterJwt, esIdValido, sucursalController.cambiarEstadoSucursal);

module.exports = router;