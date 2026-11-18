'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const registro = require('../../src/notifications/registroEstrategias');
const { salasDeNotificacion } = require('../../src/notifications/canales/socketChannel');

const construir = (tipo, payload) => registro.obtenerEstrategia(tipo).construir(payload);

describe('viaje.asignado', () => {
    test('va solo al repartidor nuevo con el viaje y la cantidad de pedidos', () => {
        expect(construir('viaje.asignado', { viajeId: '4', repartidorId: 7, cantidadPedidos: 3 })).toEqual({
            datos: { viajeId: 4, cantidadPedidos: 3 },
            destinos: { repartidores: [7] },
        });
    });

    test('rechaza un payload sin repartidor', () => {
        expect(() => construir('viaje.asignado', { viajeId: 4 })).toThrow(/repartidorId/);
    });
});

describe('viaje.reasignado', () => {
    test('va solo al repartidor anterior', () => {
        expect(construir('viaje.reasignado', { viajeId: 4, repartidorId: 9 })).toEqual({
            datos: { viajeId: 4 },
            destinos: { repartidores: [9] },
        });
    });
});

describe('pedido.cancelado_en_viaje', () => {
    test('va al dueño del viaje e indica si el viaje quedó vacío', () => {
        expect(construir('pedido.cancelado_en_viaje', {
            pedidoId: 45, viajeId: 4, repartidorId: 7, viajeEliminado: true,
        })).toEqual({
            datos: { pedidoId: 45, viajeId: 4, viajeEliminado: true },
            destinos: { repartidores: [7] },
        });
    });

    test('rechaza un payload que no es un objeto', () => {
        expect(() => construir('pedido.cancelado_en_viaje', null)).toThrow();
    });
});

describe('viaje.requiere_asistencia', () => {
    test('va a los admins de la sucursal y al MASTER', () => {
        const resultado = construir('viaje.requiere_asistencia', {
            viajeId: 4,
            repartidorId: 7,
            repartidorNombre: 'Juan Pérez',
            sucursalId: 2,
            motivo: 'Accidente',
            comentario: '',
            solicitadaEn: '2026-11-17T03:00:00.000Z',
        });

        expect(resultado).toEqual({
            datos: {
                viajeId: 4,
                repartidorId: 7,
                repartidorNombre: 'Juan Pérez',
                sucursalId: 2,
                motivo: 'Accidente',
                comentario: null,
                solicitadaEn: '2026-11-17T03:00:00.000Z',
            },
            destinos: { administradoresSucursal: [2], roles: ['MASTER'] },
        });
    });
});

describe('viaje.asistencia_tomada (D-19)', () => {
    const PAYLOAD = {
        viajeId: '4',
        repartidorId: 8,
        repartidorNombre: 'Ana Gómez',
        sucursalId: 2,
        cantidadPedidos: 3,
        tomadaEn: '2026-11-17T05:00:00.000Z',
    };

    test('va a los admins de la sucursal y al MASTER', () => {
        expect(construir('viaje.asistencia_tomada', PAYLOAD)).toEqual({
            datos: {
                viajeId: 4,
                repartidorId: 8,
                repartidorNombre: 'Ana Gómez',
                sucursalId: 2,
                cantidadPedidos: 3,
                tomadaEn: '2026-11-17T05:00:00.000Z',
            },
            destinos: { administradoresSucursal: [2], roles: ['MASTER'] },
        });
    });

    test.each(['viajeId', 'repartidorId', 'sucursalId'])('rechaza un payload sin %s', (clave) => {
        expect(() => construir('viaje.asistencia_tomada', { ...PAYLOAD, [clave]: undefined }))
            .toThrow(new RegExp(clave));
    });

    test('rechaza un payload que no es un objeto', () => {
        expect(() => construir('viaje.asistencia_tomada', null)).toThrow();
    });

    test('es solo para administradores', () => {
        expect(registro.audienciasDe('viaje.asistencia_tomada')).toEqual(['admin']);
    });
});

describe('cada estrategia del repartidor solo emite a salas de repartidores', () => {
    test.each(['viaje.asignado', 'viaje.reasignado', 'pedido.cancelado_en_viaje'])('%s', (tipo) => {
        const salas = salasDeNotificacion({
            repartidores: [7],
            clientes: [8],
            administradoresSucursal: [2],
            roles: ['MASTER'],
        }, tipo);

        expect(salas).toEqual(['user:repartidor:7']);
    });

    test.each(['viaje.requiere_asistencia', 'viaje.asistencia_tomada'])('%s no llega a repartidores ni a clientes', (tipo) => {
        const salas = salasDeNotificacion({
            administradoresSucursal: [2],
            roles: ['MASTER'],
            repartidores: [7],
            clientes: [8],
        }, tipo);

        expect(salas).toEqual(['admin:sucursal:2', 'role:MASTER']);
    });
});
