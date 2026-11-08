const { Router } = require('express');
const router = Router();

const sucursalController = require('../../controllers/admin/sucursalController');
const { validarSucursal } = require('../../middleware/admin/validarSucursal');
const { validarHorarioSucursal, validarPermisoHorario } = require('../../middleware/admin/validarHorarioSucursal');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { deSuSucursalJwt, sucursalDeLaUrl } = require('../../middleware/admin/deSuSucursalJwt');
const { esPersonalJwt } = require('../../middleware/admin/autenticarRoles');

router.get('/', esMasterJwt, sucursalController.obtenerSucursales);
// Antes no pedía sesión. Ahora: el master ve cualquiera; encargado y empleado, solo su sucursal
router.get('/:id', esIdValido, esPersonalJwt, deSuSucursalJwt(sucursalDeLaUrl), sucursalController.obtenerSucursalPorId);
router.post('/nueva', esMasterJwt, validarSucursal, sucursalController.crearSucursal);
// Editar los datos de una sucursal es solo del master. El encargado ve los suyos (GET /:id)
router.patch('/editar/:id', esMasterJwt, esIdValido, validarSucursal, sucursalController.editarSucursal);
// El horario lo edita el master, o el encargado de esa sucursal si el master lo habilitó (perilla)
router.patch('/horario/:id', esAdminJwt, esIdValido, deSuSucursalJwt(sucursalDeLaUrl), validarHorarioSucursal, sucursalController.editarHorarioSucursal);
router.patch('/permiso-horario/:id', esMasterJwt, esIdValido, validarPermisoHorario, sucursalController.cambiarPermisoHorario);
router.patch('/estado/:id', esMasterJwt, esIdValido, sucursalController.cambiarEstadoSucursal);

module.exports = router;