const { Router } = require('express');
const router = Router();

const stockController = require('../../controllers/admin/stockController');
const { validarCargaStock, validarBajaStock } = require('../../middleware/admin/validarStock');
const { esIdValido } = require('../../middleware/esIdValido');
const { validarMinimoStock } = require('../../middleware/admin/validarStock');

router.get('/sucursal/:id', esIdValido, stockController.obtenerStockPorSucursal);
router.get('/sucursal/:id/movimientos', esIdValido, stockController.obtenerMovimientos);
router.patch('/:id/aumentar', esIdValido, validarCargaStock, stockController.cargarAumento);
router.patch('/:id/bajar', esIdValido, validarBajaStock, stockController.registrarBaja);
router.patch('/:id/minimo', esIdValido, validarMinimoStock, stockController.definirMinimo);

module.exports = router;