'use strict';

jest.mock('../../src/models', () => ({
    sequelize: { transaction: jest.fn() },
    Notificacion: {},
    NotificacionDestinatario: {
        findAll: jest.fn(),
        update: jest.fn(),
    },
    Admin: { findAll: jest.fn() },
    Usuario: { findAll: jest.fn() },
}));

const { Op } = require('sequelize');
const { NotificacionDestinatario } = require('../../src/models');
const repository = require('../../src/notifications/notificacionRepository');
const { decodificarCursor } = require('../../src/notifications/cursor');

const FECHA = new Date('2026-11-02T15:00:00.000Z');

function fila(id, minutos) {
    return {
        leida: false,
        leidaEn: null,
        notificacion: {
            id,
            tipo: 'pedido.creado',
            version: 1,
            datos: { pedidoId: id },
            destinos: { administradoresSucursal: [2] },
            ocurridoEn: new Date(FECHA.getTime() - minutos * 60000),
        },
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

test('devuelve una página y un cursor keyset cuando hay más resultados', async () => {
    NotificacionDestinatario.findAll.mockResolvedValue([
        fila(50, 0),
        fila(49, 1),
        fila(48, 2),
    ]);

    const pagina = await repository.listarPagina({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        limite: 2,
    });

    expect(pagina.items.map((item) => item.id)).toEqual([50, 49]);
    expect(decodificarCursor(pagina.siguienteCursor)).toEqual({
        ocurridoEn: new Date(FECHA.getTime() - 60000),
        id: 49,
    });
    expect(NotificacionDestinatario.findAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 3,
        where: { destinatarioTipo: 'admin', destinatarioId: 3 },
    }));
});

test('usa el cursor para pedir la siguiente página', async () => {
    NotificacionDestinatario.findAll.mockResolvedValue([fila(48, 2)]);

    const pagina = await repository.listarPagina({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        limite: 2,
        cursor: Buffer.from(JSON.stringify({
            ocurridoEn: new Date(FECHA.getTime() - 60000).toISOString(),
            id: 49,
        })).toString('base64url'),
    });

    const opciones = NotificacionDestinatario.findAll.mock.calls[0][0];
    expect(opciones.include[0].where).toEqual({
        [Op.or]: [
            { ocurridoEn: { [Op.lt]: new Date(FECHA.getTime() - 60000) } },
            {
                ocurridoEn: new Date(FECHA.getTime() - 60000),
                id: { [Op.lt]: 49 },
            },
        ],
    });
    expect(pagina).toEqual({
        items: [expect.objectContaining({ id: 48 })],
        siguienteCursor: null,
    });
});

test('rechaza un cursor inválido', async () => {
    await expect(repository.listarPagina({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        cursor: 'invalido',
    })).rejects.toMatchObject({ code: 'CURSOR_INVALIDO' });
});

test('usa la misma fecha al marcar leídas', async () => {
    const leidaEn = new Date('2026-11-02T16:00:00.000Z');
    NotificacionDestinatario.update.mockResolvedValue([2]);

    const cantidad = await repository.marcarLeidas({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        leidaEn,
    });

    expect(NotificacionDestinatario.update).toHaveBeenCalledWith({
        leida: true,
        leidaEn,
    }, {
        where: {
            destinatarioTipo: 'admin',
            destinatarioId: 3,
            leida: false,
        },
    });
    expect(cantidad).toBe(2);
});
