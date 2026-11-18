'use strict';

const registro = require('../../src/notifications/registroEstrategias');

test('descubre todas las estrategias del directorio', () => {
    expect(registro.tiposRegistrados()).toEqual([
        'pedido.cancelado_en_viaje',
        'pedido.creado',
        'pedido.estado_cambiado',
        'stock.bajo',
        'sucursal.cerrada',
        'sucursal.modificada_por_admin',
        'viaje.asignado',
        'viaje.asistencia_tomada',
        'viaje.reasignado',
        'viaje.requiere_asistencia',
    ]);
});

test('deriva la bandeja de administradores', () => {
    expect(registro.tiposInbox('admin')).toEqual([
        'pedido.creado',
        'stock.bajo',
        'sucursal.cerrada',
        'sucursal.modificada_por_admin',
        'viaje.asistencia_tomada',
        'viaje.requiere_asistencia',
    ]);
});

test('deriva la bandeja de clientes', () => {
    expect(registro.tiposInbox('cliente')).toEqual([
        'pedido.creado',
        'pedido.estado_cambiado',
        'sucursal.cerrada',
    ]);
});

test('expone las audiencias de cada tipo', () => {
    expect(registro.audienciasDe('pedido.creado')).toEqual(['admin', 'cliente']);
    expect(registro.audienciasDe('sucursal.modificada_por_admin')).toEqual(['admin']);
    expect(registro.audienciasDe('pedido.estado_cambiado')).toEqual(['cliente']);
    expect(registro.audienciasDe('desconocido')).toEqual([]);
});

test('ninguna estrategia declara la propiedad paraAdministradores', () => {
    for (const tipo of registro.tiposRegistrados()) {
        expect(registro.obtenerEstrategia(tipo)).not.toHaveProperty('paraAdministradores');
    }
});

test('deriva la bandeja del repartidor', () => {
    expect(registro.tiposInbox('repartidor')).toEqual([
        'pedido.cancelado_en_viaje',
        'viaje.asignado',
        'viaje.reasignado',
    ]);
});

test('una audiencia desconocida no tiene bandeja', () => {
    expect(registro.tiposInbox('otra')).toEqual([]);
});

test('devuelve null para tipos no registrados', () => {
    expect(registro.obtenerEstrategia('desconocido')).toBeNull();
    expect(registro.esTipoRegistrado('stock.bajo')).toBe(true);
});
