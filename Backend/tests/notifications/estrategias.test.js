'use strict';

const registro = require('../../src/notifications/registroEstrategias');

const FECHA = '2026-11-02T15:00:00.000Z';
const PEDIDO = {
    id: 45,
    usuarioId: 8,
    sucursalId: 2,
    estado: 'pendiente',
    total: 15400,
    fecha: FECHA,
};

test('la estrategia de pedido creado construye datos y destinos', () => {
    const estrategia = registro.obtenerEstrategia('pedido.creado');

    expect(estrategia.construir({ pedido: PEDIDO })).toEqual({
        datos: {
            pedidoId: 45,
            usuarioId: 8,
            sucursalId: 2,
            estadoAnterior: null,
            estado: 'pendiente',
            total: 15400,
            fecha: FECHA,
        },
        destinos: {
            clientes: [8],
            administradoresSucursal: [2],
            pedidos: [45],
        },
    });
});

test('la estrategia de cambio de estado conserva el estado anterior', () => {
    const estrategia = registro.obtenerEstrategia('pedido.estado_cambiado');
    const resultado = estrategia.construir({
        pedido: { ...PEDIDO, estado: 'en proceso' },
        estadoAnterior: 'pendiente',
    });

    expect(resultado.datos).toEqual(expect.objectContaining({
        estadoAnterior: 'pendiente',
        estado: 'en proceso',
    }));
    expect(resultado.destinos).toEqual({
        clientes: [8],
        pedidos: [45],
    });
});

test('la estrategia de sucursal cerrada normaliza ids y nombre', () => {
    const estrategia = registro.obtenerEstrategia('sucursal.cerrada');

    expect(estrategia.construir({ sucursalId: '2', sucursalNombre: 'Centro' })).toEqual({
        datos: { sucursalId: 2, sucursalNombre: 'Centro' },
        destinos: {
            clientesSucursal: [2],
            administradoresSucursal: [2],
        },
    });
});

test('la estrategia de stock bajo normaliza cantidades', () => {
    const estrategia = registro.obtenerEstrategia('stock.bajo');

    expect(estrategia.construir({
        sucursalId: '2',
        sucursalNombre: 'Centro',
        insumoId: '7',
        insumoNombre: 'Queso',
        cantidad: '0.500',
        stockMinimo: '1',
    })).toEqual({
        datos: {
            sucursalId: 2,
            sucursalNombre: 'Centro',
            insumoId: 7,
            insumoNombre: 'Queso',
            cantidad: 0.5,
            stockMinimo: 1,
        },
        destinos: { administradoresSucursal: [2] },
    });
});

test('la estrategia de modificación por admin apunta al rol MASTER', () => {
    const estrategia = registro.obtenerEstrategia('sucursal.modificada_por_admin');

    expect(estrategia.construir({
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: ['horarios', 'entrega', 'horarios'],
    })).toEqual({
        datos: {
            sucursalId: 2,
            sucursalNombre: 'Centro',
            adminId: 7,
            adminNombre: 'Ana',
            cambios: ['horarios', 'entrega'],
        },
        destinos: { roles: ['MASTER'] },
    });
});

test('la estrategia rechaza bloques inválidos o vacíos', () => {
    const estrategia = registro.obtenerEstrategia('sucursal.modificada_por_admin');

    expect(() => estrategia.construir({
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: [],
    })).toThrow(/al menos un bloque/);

    expect(() => estrategia.construir({
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: ['inventado'],
    })).toThrow(/Bloque de sucursal inválido/);
});
