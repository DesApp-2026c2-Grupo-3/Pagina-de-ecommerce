const { Router } = require('express');
const router = Router();

const calificacionController = require('../../controllers/admin/calificacionController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { esIdValido } = require('../../middleware/esIdValido');

// El master ve todas las sucursales; el admin de sucursal, solo la suya (lo resuelve el controlador)
router.get('/', esAdminJwt, calificacionController.obtenerCalificaciones);
router.patch('/:id/estado', esAdminJwt, esIdValido, calificacionController.cambiarEstado);

module.exports = router;