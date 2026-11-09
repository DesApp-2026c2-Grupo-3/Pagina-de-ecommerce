'use strict';

jest.mock('../../src/notifications', () => ({
    notificacionService: { publicar: jest.fn() },
}));

const { notificacionService } = require('../../src/notifications');
const { notificarPedidoCreado, notificarEstadoPedido } = require('../../src/notifications/handlers/pedidoHandlers');
const { notificarSucursalCerrada } = require('../../src/notifications/handlers/sucursalHandlers');
const { notificarStockBajo } = require('../../src/notifications/handlers/stockHandlers');
const { TIPOS } = require('../../src/notifications/events');

const FECHA = '2026-11-02T15:00:00.000Z';
const PEDIDO = {
    id: 45,
    usuarioId: 8,
    sucursalId: 2,
    estado: 'pendiente',
    total: 15400,
    fecha: FECHA,
};

beforeEach(() => {
    jest.clearAllMocks();
    notificacionService.publicar.mockResolvedValue({ id: 1 });
});

describe('handlers de pedidos', () => {
    test('publica pedido.creado con destinatarios y DTO plano', async () => {
        await notificarPedidoCreado(PEDIDO);

        expect(notificacionService.publicar).toHaveBeenCalledWith({
            tipo: TIPOS.PEDIDO_CREADO,
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

    test('publica el estado anterior solo al cliente y a la sala del pedido', async () => {
        await notificarEstadoPedido({ ...PEDIDO, estado: 'en proceso' }, 'pendiente');

        expect(notificacionService.publicar).toHaveBeenCalledWith(expect.objectContaining({
            tipo: TIPOS.PEDIDO_ESTADO_CAMBIADO,
            datos: expect.objectContaining({
                estadoAnterior: 'pendiente',
                estado: 'en proceso',
            }),
            destinos: {
                clientes: [8],
                pedidos: [45],
            },
        }));
    });
});

test('publica el cierre de sucursal', async () => {
    await notificarSucursalCerrada({ sucursalId: '2', sucursalNombre: 'Centro' });

    expect(notificacionService.publicar).toHaveBeenCalledWith({
        tipo: TIPOS.SUCURSAL_CERRADA,
        datos: { sucursalId: 2, sucursalNombre: 'Centro' },
        destinos: {
            clientesSucursal: [2],
            administradoresSucursal: [2],
        },
    });
});

test('publica stock bajo con el contrato requerido', async () => {
    await notificarStockBajo({
        sucursalId: '2',
        sucursalNombre: 'Centro',
        insumoId: '7',
        insumoNombre: 'Queso',
        cantidad: '0.500',
        stockMinimo: '1',
    });

    expect(notificacionService.publicar).toHaveBeenCalledWith({
        tipo: TIPOS.STOCK_BAJO,
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
