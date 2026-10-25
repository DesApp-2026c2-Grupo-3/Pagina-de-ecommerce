const { Router } = require('express');
const router = Router();

const reporteController = require('../../controllers/admin/reporteController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');

router.get('/productos-mas-vendidos', esAdminJwt, reporteController.obtenerProductosMasVendidos);

router.get('/productos-menos-vendidos', esAdminJwt,reporteController.obtenerProductosMenosVendidos);

router.get('/productos-mayor-facturacion', esAdminJwt, reporteController.obtenerProductosMayorFacturacion);

router.get('/productos-sin-stock', esAdminJwt, reporteController.obtenerProductosSinStock);

router.get('/pedidos-por-estado', esAdminJwt, reporteController.obtenerPedidosPorEstado);

router.get('/pedidos-por-dia', esAdminJwt, reporteController.obtenerPedidosPorDia);

router.get('/pedidos-por-sucursal', esAdminJwt, reporteController.obtenerPedidosPorSucursal);

router.get('/cancelaciones-por-dia', esAdminJwt, reporteController.obtenerCancelacionesPorDia);

router.get('/tiempo-promedio-entrega', esAdminJwt, reporteController.obtenerTiempoPromedioEntrega);

module.exports = router;