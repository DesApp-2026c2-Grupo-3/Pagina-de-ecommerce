const { Router } = require('express');
const router = Router();

const viajeController = require('../../controllers/admin/viajeController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/sucursal/:id', esIdValido, esAdminJwt, viajeController.obtenerViajesPorSucursal);

router.patch('/:id/reasignar', esAdminJwt, viajeController.reasignarViaje);

module.exports = router;