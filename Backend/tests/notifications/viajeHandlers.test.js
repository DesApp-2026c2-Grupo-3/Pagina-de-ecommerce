'use strict';

jest.mock('../../src/notifications', () => ({
    fabrica: { publicarPorTipo: jest.fn() },
}));
jest.mock('../../src/notifications/handlers/pedidoHandlers', () => ({
    notificarEstadoPedido: jest.fn(),
}));
jest.mock('../../src/notifications/adminRefresco', () => ({
    emitirRefrescoAdmin: jest.fn(),
}));
jest.mock('../../src/notifications/repartidorRefresco', () => ({
    emitirRefrescoRepartidor: jest.fn(),
}));

const { fabrica } = require('../../src/notifications');
const { notificarEstadoPedido } = require('../../src/notifications/handlers/pedidoHandlers');
const { emitirRefrescoAdmin } = require('../../src/notifications/adminRefresco');
const { emitirRefrescoRepartidor } = require('../../src/notifications/repartidorRefresco');
const handlers = require('../../src/notifications/handlers/viajeHandlers');

const PEDIDO = { id: 45, sucursalId: 2, viajeId: 4, estado: 'Entregado' };

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    fabrica.publicarPorTipo.mockResolvedValue({ id: 1 });
    notificarEstadoPedido.mockResolvedValue({ id: 1 });
    emitirRefrescoAdmin.mockResolvedValue(true);
    emitirRefrescoRepartidor.mockReturnValue(true);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function dominiosAdmin() {
    return emitirRefrescoAdmin.mock.calls.map(([evento]) => evento.dominio);
}

test('tomar pedidos los saca de los disponibles y refresca pedidos y viajes del panel', async () => {
    await handlers.notificarPedidosTomados({ viajeId: 4, sucursalId: 2 });

    expect(emitirRefrescoRepartidor).toHaveBeenCalledWith({
        dominio: 'pedidos_disponibles', accion: 'eliminado', sucursalId: 2,
    });
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
});

test('retirar un pedido no avisa al cliente', async () => {
    await handlers.notificarPedidoRetirado({ pedido: { ...PEDIDO, estado: 'Listo para retirar' } });

    expect(notificarEstadoPedido).not.toHaveBeenCalled();
    expect(fabrica.publicarPorTipo).not.toHaveBeenCalled();
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
});

test('quitar un pedido lo vuelve a ofrecer a la sucursal e indica quién lo quitó (D-21)', async () => {
    await handlers.notificarPedidoQuitado({ pedido: PEDIDO, viajeId: 4, repartidorId: 3 });

    expect(emitirRefrescoRepartidor).toHaveBeenCalledWith({
        dominio: 'pedidos_disponibles',
        accion: 'creado',
        sucursalId: 2,
        origenRepartidorId: 3,
        recursos: { pedidoId: 45 },
    });
    expect(fabrica.publicarPorTipo).not.toHaveBeenCalled();
    expect(dominiosAdmin()).toEqual(['viajes']);
});

test('iniciar el viaje avisa "En camino" a cada cliente desde "Listo para retirar"', async () => {
    const pedidos = [{ id: 1, estado: 'En camino' }, { id: 2, estado: 'En camino' }];

    await handlers.notificarViajeIniciado({ viaje: { id: 4 }, pedidos, sucursalId: 2 });

    expect(notificarEstadoPedido).toHaveBeenCalledTimes(2);
    expect(notificarEstadoPedido).toHaveBeenCalledWith(pedidos[0], 'Listo para retirar');
    expect(notificarEstadoPedido).toHaveBeenCalledWith(pedidos[1], 'Listo para retirar');
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
});

test('entregar avisa al cliente y refresca el panel', async () => {
    await handlers.notificarPedidoEntregado({ pedido: PEDIDO, estadoAnterior: 'En camino' });

    expect(notificarEstadoPedido).toHaveBeenCalledWith(PEDIDO, 'En camino');
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
});

test('pedir asistencia publica la notificación para el panel', async () => {
    const viaje = {
        id: 4,
        motivoAsistencia: 'Accidente',
        comentarioAsistencia: null,
        fechaSolicitudAsistencia: '2026-11-17T03:00:00.000Z',
    };

    await handlers.notificarAsistenciaSolicitada({
        viaje,
        repartidor: { id: 7, nombre: 'Juan Pérez', sucursalId: 2 },
    });

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('viaje.requiere_asistencia', {
        viajeId: 4,
        repartidorId: 7,
        repartidorNombre: 'Juan Pérez',
        sucursalId: 2,
        motivo: 'Accidente',
        comentario: null,
        solicitadaEn: '2026-11-17T03:00:00.000Z',
    });
    expect(dominiosAdmin()).toEqual(['viajes']);
});

const RECEPCION = {
    viaje: { id: 4 },
    repartidor: { id: 8, nombre: 'Ana Gómez', sucursalId: 2 },
    cantidadPedidos: 3,
};

test('confirmar la recepción avisa a los admins (D-19) y refresca los viajes del panel', async () => {
    await handlers.notificarRecepcionConfirmada(RECEPCION);

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('viaje.asistencia_tomada', {
        viajeId: 4,
        repartidorId: 8,
        repartidorNombre: 'Ana Gómez',
        sucursalId: 2,
        cantidadPedidos: 3,
        tomadaEn: expect.any(String),
    });
    const { tomadaEn } = fabrica.publicarPorTipo.mock.calls[0][1];
    expect(Number.isNaN(Date.parse(tomadaEn))).toBe(false);
    expect(emitirRefrescoAdmin).toHaveBeenCalledWith(expect.objectContaining({
        dominio: 'viajes', sucursalId: 2, recursos: { viajeId: 4 },
    }));
});

test('si la notificación falla, el refresco igual sale y no lanza', async () => {
    fabrica.publicarPorTipo.mockRejectedValue(new Error('base caída'));

    await expect(handlers.notificarRecepcionConfirmada(RECEPCION)).resolves.toBeUndefined();

    expect(dominiosAdmin()).toEqual(['viajes']);
    expect(console.error).toHaveBeenCalled();
});

test('reasignar avisa al nuevo y al anterior, y refresca la app de cada uno', async () => {
    await handlers.notificarViajeReasignado({
        viaje: { id: 4 }, anteriorId: 9, nuevoId: 7, sucursalId: 2, cantidadPedidos: 3,
    });

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('viaje.asignado', {
        viajeId: 4, repartidorId: 7, cantidadPedidos: 3,
    });
    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('viaje.reasignado', {
        viajeId: 4, repartidorId: 9,
    });
    const destinatarios = emitirRefrescoRepartidor.mock.calls.map(([evento]) => evento.repartidorId);
    expect(destinatarios).toEqual([7, 9]);
    expect(dominiosAdmin()).toEqual(['viajes']);
});

test('cancelar un pedido en un viaje avisa al dueño del viaje', async () => {
    await handlers.notificarPedidoCanceladoEnViaje({
        pedido: PEDIDO, viaje: { id: 4, repartidorId: 7 }, viajeEliminado: false,
    });

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('pedido.cancelado_en_viaje', {
        pedidoId: 45, viajeId: 4, repartidorId: 7, viajeEliminado: false,
    });
    expect(emitirRefrescoRepartidor).toHaveBeenCalledWith(expect.objectContaining({
        dominio: 'viaje', accion: 'actualizado', repartidorId: 7,
    }));
});

test.each(['creado', 'eliminado'])('un cambio de disponibilidad "%s" va a los repartidores de la sucursal', async (accion) => {
    await handlers.notificarDisponibilidad({ pedido: PEDIDO, accion });

    expect(emitirRefrescoRepartidor).toHaveBeenCalledWith({
        dominio: 'pedidos_disponibles', accion, sucursalId: 2, recursos: { pedidoId: 45 },
    });
});

test('un aviso que falla no lanza ni frena a los demás', async () => {
    notificarEstadoPedido.mockRejectedValueOnce(new Error('base caída'));
    const pedidos = [{ id: 1 }, { id: 2 }];

    await expect(handlers.notificarViajeIniciado({ viaje: { id: 4 }, pedidos, sucursalId: 2 }))
        .resolves.toBeUndefined();

    expect(notificarEstadoPedido).toHaveBeenCalledTimes(2);
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
    expect(console.error).toHaveBeenCalled();
});

test('un refresco que lanza tampoco rompe la Fachada', async () => {
    emitirRefrescoRepartidor.mockImplementation(() => { throw new Error('socket roto'); });

    await expect(handlers.notificarPedidosTomados({ viajeId: 4, sucursalId: 2 })).resolves.toBeUndefined();
    expect(dominiosAdmin()).toEqual(['pedidos', 'viajes']);
});
