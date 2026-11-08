const { Router } = require('express');
const router = Router();

const cierreController = require('../../controllers/admin/cierreController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { deSuSucursalJwt, sucursalDeLaUrl } = require('../../middleware/admin/deSuSucursalJwt');
const { validarCierre } = require('../../middleware/admin/validarCierre');

// Master y encargado (el encargado, solo su sucursal). Cerrar es solo del encargado de esa sucursal;
// reabrir, del encargado o del master (que puede levantar cualquier cierre).
router.get('/', esAdminJwt, cierreController.listarActivos);
router.get('/sucursal/:id', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), cierreController.obtenerEstado);
router.post('/sucursal/:id/cerrar', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), validarCierre, cierreController.cerrar);
router.post('/sucursal/:id/reabrir', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), cierreController.reabrir);

module.exports = router;
