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
router.get('/clientes-mas-pedidos', esAdminJwt, reporteController.obtenerClientesMasPedidos);
router.get('/clientes-nuevos', esAdminJwt, reporteController.obtenerClientesNuevos);
router.get('/clientes-inactivos', esAdminJwt, reporteController.obtenerClientesInactivos);
router.get('/ventas-por-sucursal', esAdminJwt, reporteController.obtenerVentasPorSucursal);
router.get('/productos-por-sucursal', esAdminJwt, reporteController.obtenerProductosPorSucursal);
router.get('/pedidos-atendidos-por-sucursal', esAdminJwt, reporteController.obtenerPedidosAtendidosPorSucursal);
router.get('/promociones-mas-utilizadas', esAdminJwt, reporteController.obtenerPromocionesMasUtilizadas);
router.get('/impacto-promociones', esAdminJwt, reporteController.obtenerImpactoPromociones);

module.exports = router;