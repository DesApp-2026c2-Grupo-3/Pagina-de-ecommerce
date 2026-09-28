const { Router } = require('express');
const router = Router();

const stockController = require('../../controllers/admin/stockController');
const { validarCargaStock } = require('../../middleware/admin/validarStock');
const { esIdValido } = require('../../middleware/esIdValido');

router.get('/sucursal/:id', esIdValido, stockController.obtenerStockPorSucursal);
router.patch('/:id/aumentar', esIdValido, validarCargaStock, stockController.cargarAumento);

module.exports = router;