'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets');
const { emitirRefrescoCliente } = require('../../src/notifications/clienteRefresco');

function crearIo() {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    return { to, emit };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

test('el refresco de un pedido va solo a su cliente, con el id del pedido', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    const emitido = emitirRefrescoCliente({ dominio: 'pedido', accion: 'estado_cambiado', usuarioId: 8, pedidoId: 45 });

    expect(emitido).toBe(true);
    expect(io.to).toHaveBeenCalledWith('user:cliente:8');
    expect(io.emit).toHaveBeenCalledWith('cliente:refresco', {
        version: 1,
        eventoId: expect.any(String),
        dominio: 'pedido',
        accion: 'estado_cambiado',
        ocurridoEn: expect.any(String),
        recursos: { pedidoId: 45 },
    });
});

test('el refresco de una sucursal va a todos los clientes, con el id de la sucursal', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    emitirRefrescoCliente({ dominio: 'sucursal', accion: 'estado_cambiado', sucursalId: 2 });

    expect(io.to).toHaveBeenCalledWith('role:cliente');
    expect(io.emit).toHaveBeenCalledWith('cliente:refresco', expect.objectContaining({
        dominio: 'sucursal',
        sucursalId: 2,
    }));
});

test.each([
    ['dominio desconocido', { dominio: 'stock', accion: 'actualizado', sucursalId: 2 }],
    ['acción desconocida', { dominio: 'pedido', accion: 'borrado', usuarioId: 8, pedidoId: 45 }],
    ['pedido sin cliente', { dominio: 'pedido', accion: 'creado', pedidoId: 45 }],
    ['pedido sin id', { dominio: 'pedido', accion: 'creado', usuarioId: 8 }],
    ['sucursal sin id', { dominio: 'sucursal', accion: 'actualizado' }],
])('no emite con %s', (_, datos) => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    expect(emitirRefrescoCliente(datos)).toBe(false);
    expect(io.emit).not.toHaveBeenCalled();
});

test('sin servidor de sockets no emite ni lanza', () => {
    getIo.mockReturnValue(null);
    expect(emitirRefrescoCliente({ dominio: 'sucursal', accion: 'actualizado', sucursalId: 2 })).toBe(false);
});

test('si el socket falla, no lanza', () => {
    getIo.mockReturnValue({ to: () => { throw new Error('caído'); } });
    expect(emitirRefrescoCliente({ dominio: 'sucursal', accion: 'actualizado', sucursalId: 2 })).toBe(false);
});
