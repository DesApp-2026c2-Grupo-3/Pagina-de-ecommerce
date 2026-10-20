const { Router } = require('express');
const router = Router();

const stockController = require('../../controllers/admin/stockController');
const { validarCargaStock, validarBajaStock } = require('../../middleware/admin/validarStock');
const { esIdValido } = require('../../middleware/esIdValido');
const { validarMinimoStock } = require('../../middleware/admin/validarStock');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/sucursal/:id', esIdValido, esAdminJwt, stockController.obtenerStockPorSucursal);
router.get('/sucursal/:id/movimientos', esIdValido, esAdminJwt, stockController.obtenerMovimientos);
router.patch('/:id/aumentar', esIdValido, esAdminJwt, validarCargaStock, stockController.cargarAumento);
router.patch('/:id/bajar', esIdValido, esAdminJwt, validarBajaStock, stockController.registrarBaja);
router.patch('/:id/minimo', esIdValido, esAdminJwt, validarMinimoStock, stockController.definirMinimo);

module.exports = router;