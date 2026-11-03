const { Router } = require('express');
const router = Router();

const calificacionController = require('../../controllers/admin/calificacionController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

// El master ve todas las sucursales; el admin de sucursal, solo la suya (lo resuelve el controlador)
router.get('/filtros', esAdminJwt, calificacionController.obtenerFiltros);
router.get('/resumen', esAdminJwt, calificacionController.obtenerResumen);
router.get('/', esAdminJwt, calificacionController.obtenerCalificaciones);

module.exports = router;
