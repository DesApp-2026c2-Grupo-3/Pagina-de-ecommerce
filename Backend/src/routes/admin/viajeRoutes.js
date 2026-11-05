const { Router } = require('express');
const router = Router();

const viajeController = require('../../controllers/admin/viajeController');
const { esIdValido } = require('../../middleware/esIdValido');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/sucursal/:id', esIdValido, esAdminJwt, viajeController.obtenerViajesPorSucursal);

module.exports = router;