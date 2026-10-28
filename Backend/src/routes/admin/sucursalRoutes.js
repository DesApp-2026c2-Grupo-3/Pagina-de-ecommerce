const { Router } = require('express');
const router = Router();

const sucursalController = require('../../controllers/admin/sucursalController');
const { validarSucursal } = require('../../middleware/admin/validarSucursal');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { deSuSucursalJwt, sucursalDeLaUrl } = require('../../middleware/admin/deSuSucursalJwt');
const { esPersonalJwt } = require('../../middleware/admin/autenticarRoles');

router.get('/', esMasterJwt, sucursalController.obtenerSucursales);
// Antes no pedía sesión. Ahora: el master ve cualquiera; encargado y empleado, solo su sucursal
router.get('/:id', esIdValido, esPersonalJwt, deSuSucursalJwt(sucursalDeLaUrl), sucursalController.obtenerSucursalPorId);
router.post('/nueva', esMasterJwt, validarSucursal, sucursalController.crearSucursal);
router.patch('/editar/:id', esAdminJwt, esIdValido, deSuSucursalJwt(sucursalDeLaUrl), validarSucursal, sucursalController.editarSucursal);
router.patch('/estado/:id', esMasterJwt, esIdValido, sucursalController.cambiarEstadoSucursal);

module.exports = router;