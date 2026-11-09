'use strict';

const TIPOS = Object.freeze({
    PEDIDO_CREADO: 'pedido.creado',
    PEDIDO_ESTADO_CAMBIADO: 'pedido.estado_cambiado',
    SUCURSAL_CERRADA: 'sucursal.cerrada',
    STOCK_BAJO: 'stock.bajo',
});

module.exports = { TIPOS };
