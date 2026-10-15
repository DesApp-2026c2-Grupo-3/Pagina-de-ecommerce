const { Router } = require('express');
const router = Router();

const reporteController = require('../../controllers/admin/reporteController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/productos-mas-vendidos', esAdminJwt, reporteController.obtenerProductosMasVendidos);

router.get('/productos-menos-vendidos', esAdminJwt,reporteController.obtenerProductosMenosVendidos);

router.get('/productos-mayor-facturacion', esAdminJwt, reporteController.obtenerProductosMayorFacturacion);

router.get('/productos-sin-stock', esAdminJwt, reporteController.obtenerProductosSinStock);

module.exports = router;