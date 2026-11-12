'use strict';

const registro = require('../../src/notifications/registroEstrategias');

test('descubre todas las estrategias del directorio', () => {
    expect(registro.tiposRegistrados()).toEqual([
        'pedido.creado',
        'pedido.estado_cambiado',
        'stock.bajo',
        'sucursal.cerrada',
        'sucursal.modificada_por_admin',
    ]);
});

test('deriva la bandeja de administradores', () => {
    expect(registro.tiposInbox('admin')).toEqual([
        'pedido.creado',
        'stock.bajo',
        'sucursal.cerrada',
        'sucursal.modificada_por_admin',
    ]);
});

test('deriva la bandeja de clientes', () => {
    expect(registro.tiposInbox('cliente')).toEqual([
        'pedido.creado',
        'pedido.estado_cambiado',
        'sucursal.cerrada',
    ]);
});

test('expone la audiencia de administradores por tipo', () => {
    expect(registro.tipoParaAdministradores('pedido.creado')).toBe(true);
    expect(registro.tipoParaAdministradores('sucursal.modificada_por_admin')).toBe(true);
    expect(registro.tipoParaAdministradores('pedido.estado_cambiado')).toBe(false);
    expect(registro.tipoParaAdministradores('desconocido')).toBe(false);
});

test('devuelve null para tipos no registrados', () => {
    expect(registro.obtenerEstrategia('desconocido')).toBeNull();
    expect(registro.esTipoRegistrado('stock.bajo')).toBe(true);
});
