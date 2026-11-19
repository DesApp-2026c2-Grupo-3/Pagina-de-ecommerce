'use strict';

jest.mock('../../src/notifications', () => ({
    fabrica: { publicarPorTipo: jest.fn() },
}));

const { fabrica } = require('../../src/notifications');
const { notificarPedidoCreado, notificarEstadoPedido } = require('../../src/notifications/handlers/pedidoHandlers');
const {
    notificarSucursalCerrada,
    notificarSucursalModificadaPorAdmin,
} = require('../../src/notifications/handlers/sucursalHandlers');
const { notificarStockBajo } = require('../../src/notifications/handlers/stockHandlers');

const PEDIDO = {
    id: 45,
    usuarioId: 8,
    sucursalId: 2,
    estado: 'pendiente',
    total: 15400,
    fecha: '2026-11-02T15:00:00.000Z',
};

beforeEach(() => {
    jest.clearAllMocks();
    fabrica.publicarPorTipo.mockResolvedValue({ id: 1 });
});

test('delega el pedido creado a la fábrica', async () => {
    await notificarPedidoCreado(PEDIDO);

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('pedido.creado', {
        pedido: PEDIDO,
    });
});

test('delega el cambio de estado con el estado anterior', async () => {
    await notificarEstadoPedido(PEDIDO, 'pendiente');

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('pedido.estado_cambiado', {
        pedido: PEDIDO,
        estadoAnterior: 'pendiente',
    });
});

test('no avisa al cliente el paso a "Listo para retirar" (estado interno)', async () => {
    const resultado = await notificarEstadoPedido(
        { ...PEDIDO, estado: 'Listo para retirar' },
        'En proceso',
    );

    expect(resultado).toBeNull();
    expect(fabrica.publicarPorTipo).not.toHaveBeenCalled();
});

test('si se cancela desde "Listo para retirar", el cliente ve "En proceso" como anterior', async () => {
    const pedido = { ...PEDIDO, estado: 'Cancelado' };

    await notificarEstadoPedido(pedido, 'Listo para retirar');

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('pedido.estado_cambiado', {
        pedido,
        estadoAnterior: 'En proceso',
    });
});

test('delega el cierre de sucursal', async () => {
    await notificarSucursalCerrada({ sucursalId: 2, sucursalNombre: 'Centro' });

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('sucursal.cerrada', {
        sucursalId: 2,
        sucursalNombre: 'Centro',
    });
});

test('delega el stock bajo', async () => {
    const payload = {
        sucursalId: 2,
        sucursalNombre: 'Centro',
        insumoId: 7,
        insumoNombre: 'Queso',
        cantidad: 0.5,
        stockMinimo: 1,
    };

    await notificarStockBajo(payload);

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith('stock.bajo', payload);
});

test('delega la modificación de sucursal por administrador', async () => {
    const payload = {
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: ['horarios'],
    };

    await notificarSucursalModificadaPorAdmin(payload);

    expect(fabrica.publicarPorTipo).toHaveBeenCalledWith(
        'sucursal.modificada_por_admin',
        payload,
    );
});
