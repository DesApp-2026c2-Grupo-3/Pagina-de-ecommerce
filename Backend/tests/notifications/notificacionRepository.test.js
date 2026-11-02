jest.mock('../../src/models', () => {
  const transaction = jest.fn((callback) => callback('tx'));

  return {
    sequelize: { transaction },
    Notificacion: { create: jest.fn() },
    NotificacionDestinatario: {
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    Admin: { findAll: jest.fn() },
    Usuario: { findAll: jest.fn() },
  };
});

const { Op } = require('sequelize');
const {
  sequelize,
  Notificacion,
  NotificacionDestinatario,
  Admin,
  Usuario,
} = require('../../src/models');
const notificacionRepository = require('../../src/notifications/notificacionRepository');

const FECHA = new Date('2026-11-02T15:00:00.000Z');

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.transaction.mockImplementation((callback) => callback('tx'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('guardar', () => {
  test('persiste la notificacion y hace fan-out a clientes y admins de sucursal', async () => {
    const destinos = {
      clientes: [8, 8],
      administradoresSucursal: [2],
      pedidos: [45],
    };

    Notificacion.create.mockResolvedValue({
      id: '9',
      tipo: 'pedido.estado_cambiado',
      version: 1,
      datos: { pedidoId: 45, estado: 'en proceso' },
      destinos,
      ocurridoEn: FECHA,
    });
    Admin.findAll.mockResolvedValue([{ id: 3 }, { id: 3 }]);
    NotificacionDestinatario.bulkCreate.mockResolvedValue([]);

    const resultado = await notificacionRepository.guardar({
      tipo: 'pedido.estado_cambiado',
      datos: { pedidoId: 45, estado: 'en proceso' },
      destinos,
      ocurridoEn: FECHA,
    });

    expect(Notificacion.create).toHaveBeenCalledWith({
      tipo: 'pedido.estado_cambiado',
      datos: { pedidoId: 45, estado: 'en proceso' },
      destinos,
      version: 1,
      ocurridoEn: FECHA,
    }, { transaction: 'tx' });

    expect(Admin.findAll).toHaveBeenCalledWith({
      where: {
        sucursalId: { [Op.in]: [2] },
        activo: true,
      },
      attributes: ['id'],
      transaction: 'tx',
    });

    expect(NotificacionDestinatario.bulkCreate).toHaveBeenCalledWith([
      { destinatarioTipo: 'cliente', destinatarioId: 8, notificacionId: '9' },
      { destinatarioTipo: 'admin', destinatarioId: 3, notificacionId: '9' },
    ], { transaction: 'tx' });

    expect(resultado).toEqual({
      id: 9,
      tipo: 'pedido.estado_cambiado',
      version: 1,
      ocurridoEn: FECHA.toISOString(),
      datos: { pedidoId: 45, estado: 'en proceso' },
      destinos,
    });
    expect(Usuario.findAll).not.toHaveBeenCalled();
  });

  test('resuelve clientes de una sucursal y deduplica destinatarios', async () => {
    Notificacion.create.mockResolvedValue({
      id: '10',
      tipo: 'sucursal.cerrada',
      version: 1,
      datos: { sucursalId: 2 },
      destinos: { clientesSucursal: [2], clientes: [7] },
      ocurridoEn: FECHA,
    });
    Usuario.findAll.mockResolvedValue([{ id: 7 }, { id: 8 }]);
    NotificacionDestinatario.bulkCreate.mockResolvedValue([]);

    await notificacionRepository.guardar({
      tipo: 'sucursal.cerrada',
      datos: { sucursalId: 2 },
      destinos: { clientesSucursal: [2], clientes: [7] },
      ocurridoEn: FECHA,
    });

    expect(Usuario.findAll).toHaveBeenCalledWith({
      where: { sucursalId: { [Op.in]: [2] } },
      attributes: ['id'],
      transaction: 'tx',
    });

    const filas = NotificacionDestinatario.bulkCreate.mock.calls[0][0];
    expect(filas).toHaveLength(2);
    expect(filas).toEqual(expect.arrayContaining([
      { destinatarioTipo: 'cliente', destinatarioId: 7, notificacionId: '10' },
      { destinatarioTipo: 'cliente', destinatarioId: 8, notificacionId: '10' },
    ]));
  });

  test('guarda la notificacion aunque no tenga destinatarios', async () => {
    Notificacion.create.mockResolvedValue({
      id: '11',
      tipo: 'pedido.creado',
      version: 1,
      datos: { pedidoId: 50 },
      destinos: {},
      ocurridoEn: FECHA,
    });

    await notificacionRepository.guardar({
      tipo: 'pedido.creado',
      datos: { pedidoId: 50 },
      ocurridoEn: FECHA,
    });

    expect(Notificacion.create).toHaveBeenCalledWith(expect.objectContaining({
      destinos: {},
    }), { transaction: 'tx' });
    expect(NotificacionDestinatario.bulkCreate).not.toHaveBeenCalled();
  });
});

describe('listar', () => {
  test('devuelve notificaciones planas del destinatario con su estado de lectura', async () => {
    const leidaEn = new Date('2026-11-02T16:00:00.000Z');
    NotificacionDestinatario.findAll.mockResolvedValue([{
      leida: true,
      leidaEn,
      notificacion: {
        id: '12',
        tipo: 'pedido.estado_cambiado',
        version: '1',
        ocurridoEn: FECHA,
        datos: { pedidoId: 45 },
        destinos: { clientes: [8] },
      },
    }]);

    const resultado = await notificacionRepository.listar({
      tipo: 'cliente',
      id: 8,
      leida: true,
      limite: 10,
      offset: 2,
    });

    expect(NotificacionDestinatario.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        destinatarioTipo: 'cliente',
        destinatarioId: 8,
        leida: true,
      },
      limit: 10,
      offset: 2,
    }));

    expect(resultado).toEqual([{
      id: 12,
      tipo: 'pedido.estado_cambiado',
      version: 1,
      ocurridoEn: FECHA.toISOString(),
      datos: { pedidoId: 45 },
      destinos: { clientes: [8] },
      leida: true,
      leidaEn: leidaEn.toISOString(),
    }]);
  });

  test('usa paginacion por defecto y no filtra por leida si no se indica', async () => {
    NotificacionDestinatario.findAll.mockResolvedValue([]);

    await notificacionRepository.listar({
      destinatarioTipo: 'admin',
      destinatarioId: 3,
    });

    expect(NotificacionDestinatario.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        destinatarioTipo: 'admin',
        destinatarioId: 3,
      },
      limit: 50,
      offset: 0,
    }));
  });
});

describe('marcarLeidas', () => {
  test('marca solo las notificaciones indicadas como leidas', async () => {
    NotificacionDestinatario.update.mockResolvedValue([2]);

    const cantidad = await notificacionRepository.marcarLeidas({
      destinatarioTipo: 'cliente',
      destinatarioId: 8,
      notificacionIds: [1, 2, 2],
    });

    expect(NotificacionDestinatario.update).toHaveBeenCalledWith({
      leida: true,
      leidaEn: expect.any(Date),
    }, {
      where: {
        destinatarioTipo: 'cliente',
        destinatarioId: 8,
        leida: false,
        notificacionId: { [Op.in]: [1, 2] },
      },
    });
    expect(cantidad).toBe(2);
  });

  test('marca todas las notificaciones no leidas cuando no recibe ids', async () => {
    NotificacionDestinatario.update.mockResolvedValue([5]);

    const cantidad = await notificacionRepository.marcarLeidas({
      destinatarioTipo: 'admin',
      destinatarioId: 3,
    });

    expect(NotificacionDestinatario.update).toHaveBeenCalledWith(expect.any(Object), {
      where: {
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        leida: false,
      },
    });
    expect(cantidad).toBe(5);
  });

  test('no actualiza nada si la lista de ids esta vacia', async () => {
    const cantidad = await notificacionRepository.marcarLeidas({
      destinatarioTipo: 'cliente',
      destinatarioId: 8,
      notificacionIds: [],
    });

    expect(cantidad).toBe(0);
    expect(NotificacionDestinatario.update).not.toHaveBeenCalled();
  });
});

describe('contarNoLeidas', () => {
  test('cuenta las notificaciones no leidas del destinatario', async () => {
    NotificacionDestinatario.count.mockResolvedValue(4);

    const cantidad = await notificacionRepository.contarNoLeidas({
      tipo: 'cliente',
      id: 8,
    });

    expect(NotificacionDestinatario.count).toHaveBeenCalledWith({
      where: {
        destinatarioTipo: 'cliente',
        destinatarioId: 8,
        leida: false,
      },
    });
    expect(cantidad).toBe(4);
  });
});
