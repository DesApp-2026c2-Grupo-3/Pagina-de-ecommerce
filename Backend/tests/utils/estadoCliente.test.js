const { adaptarPedidoParaCliente } = require('../../src/utils/estadoCliente');

const HISTORIAL = [
    { estado: 'Pendiente', fecha: '2026-11-12T10:00:00.000Z' },
    { estado: 'En proceso', fecha: '2026-11-12T10:05:00.000Z' },
    { estado: 'Listo para retirar', fecha: '2026-11-12T10:20:00.000Z' },
    { estado: 'En camino', fecha: '2026-11-12T10:25:00.000Z' },
];

describe('adaptarPedidoParaCliente', () => {
    test('retirado pero con el viaje en preparación: el cliente todavía no lo ve en camino', () => {
        const resultado = adaptarPedidoParaCliente({
            id: 1,
            estado: 'En camino',
            historialDeTiemposPedidos: HISTORIAL,
            Viaje: { estado: 'preparando', fechaInicio: null },
        });

        expect(resultado.estado).toBe('Listo para retirar');
        expect(resultado.historialDeTiemposPedidos.map((h) => h.estado)).not.toContain('En camino');
        expect(resultado).not.toHaveProperty('Viaje');
    });

    test('con el viaje iniciado: "En camino" desde la hora de salida del repartidor', () => {
        const resultado = adaptarPedidoParaCliente({
            id: 1,
            estado: 'En camino',
            historialDeTiemposPedidos: HISTORIAL,
            Viaje: { estado: 'activo', fechaInicio: '2026-11-12T10:40:00.000Z' },
        });

        expect(resultado.estado).toBe('En camino');
        expect(resultado.historialDeTiemposPedidos.at(-1)).toEqual({
            estado: 'En camino',
            fecha: '2026-11-12T10:40:00.000Z',
        });
        expect(resultado).not.toHaveProperty('Viaje');
    });

    test('un viaje con asistencia sigue "En camino" para el cliente', () => {
        const resultado = adaptarPedidoParaCliente({
            estado: 'En camino',
            Viaje: { estado: 'requiere asistencia', fechaInicio: '2026-11-12T10:40:00.000Z' },
        });

        expect(resultado.estado).toBe('En camino');
    });

    test('no toca los demás estados ni los pedidos sin viaje', () => {
        const pedido = { id: 2, estado: 'En proceso', historialDeTiemposPedidos: HISTORIAL.slice(0, 2) };

        expect(adaptarPedidoParaCliente(pedido)).toEqual(pedido);
        expect(adaptarPedidoParaCliente({ ...pedido, Viaje: null })).toEqual(pedido);
        expect(adaptarPedidoParaCliente({ id: 3, estado: 'Entregado', Viaje: { estado: 'finalizado' } }))
            .toEqual({ id: 3, estado: 'Entregado' });
    });
});
