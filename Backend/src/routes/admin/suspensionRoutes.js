const { Router } = require('express');
const router = Router();

const suspensionController = require('../../controllers/admin/suspensionController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { deSuSucursalJwt, sucursalDeLaUrl } = require('../../middleware/admin/deSuSucursalJwt');
const { validarSuspension, validarRehabilitacion } = require('../../middleware/admin/validarSuspension');

// Master y encargado (el encargado, solo en su sucursal). El empleado no tiene acceso.
router.get('/', esAdminJwt, suspensionController.listar);
router.get('/sucursal/:id/productos', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), suspensionController.productosDeSucursal);
router.post('/sucursal/:id/suspender', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), validarSuspension, suspensionController.suspender);
router.post('/sucursal/:id/rehabilitar', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), validarRehabilitacion, suspensionController.rehabilitar);

module.exports = router;
