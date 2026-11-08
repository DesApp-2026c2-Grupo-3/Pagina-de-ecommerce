const { Router } = require('express');
const router = Router();

const stockController = require('../../controllers/admin/stockController');
const { validarCargaStock, validarBajaStock } = require('../../middleware/admin/validarStock');
const { esIdValido } = require('../../middleware/esIdValido');
const { validarMinimoStock } = require('../../middleware/admin/validarStock');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { deSuSucursalJwt, sucursalDeLaUrl, sucursalDelStock } = require('../../middleware/admin/deSuSucursalJwt');

// :id = sucursal
router.get('/sucursal/:id', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), stockController.obtenerStockPorSucursal);
router.get('/sucursal/:id/movimientos', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDeLaUrl), stockController.obtenerMovimientos);
// :id = fila de stock (la sucursal se saca de esa fila)
router.patch('/:id/aumentar', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDelStock), validarCargaStock, stockController.cargarAumento);
router.patch('/:id/bajar', esIdValido, esAdminJwt, deSuSucursalJwt(sucursalDelStock), validarBajaStock, stockController.registrarBaja);
// El stock mínimo lo define solo el master
router.patch('/:id/minimo', esIdValido, esMasterJwt, validarMinimoStock, stockController.definirMinimo);

module.exports = router;
