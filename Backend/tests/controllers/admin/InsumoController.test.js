jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    return {
        Insumo: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
        Sucursal: { findAll: jest.fn() },
        StockSucursal: { bulkCreate: jest.fn(), destroy: jest.fn() },
        RecetaInsumo: { count: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

const models = require('../../../src/models');
const {
    obtenerInsumos,
    crearInsumo,
    editarInsumo,
    eliminarInsumo,
} = require('../../../src/controllers/admin/InsumoController');

const { Insumo, Sucursal, StockSucursal, RecetaInsumo } = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function insumoDeLaBase(datos = {}) {
    return {
        id: 1,
        nombre: 'Pan',
        unidadMedida: 'unidad',
        precioComercial: '0',
        update: jest.fn(),
        destroy: jest.fn(),
        ...datos,
    };
}

const bodyInsumo = { nombre: 'Pan', unidadMedida: 'unidad', precioComercial: 50 };

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerInsumos', () => {
    test('devuelve los insumos ordenados por nombre', async () => {
        const insumos = [{ id: 1, nombre: 'Pan' }];
        Insumo.findAll.mockResolvedValue(insumos);
        const res = crearRes();

        await obtenerInsumos({}, res);

        expect(Insumo.findAll).toHaveBeenCalledWith(expect.objectContaining({
            attributes: ['id', 'nombre', 'unidadMedida', 'precioComercial', 'activo'],
            order: [['nombre', 'ASC']],
        }));
        expect(res.json).toHaveBeenCalledWith(insumos);
    });

    test('responde 500 si falla la base de datos', async () => {
        Insumo.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerInsumos({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los insumos' });
    });
});

describe('crearInsumo', () => {
    test('rechaza un nombre ya usado sin abrir la transacción', async () => {
        Insumo.findOne.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await crearInsumo({ body: bodyInsumo }, res);

        expect(models.sequelize.transaction).not.toHaveBeenCalled();
        expect(Insumo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Ya existe un insumo con ese nombre' });
    });

    test('crea el insumo y su stock en 0 en todas las sucursales', async () => {
        Insumo.findOne.mockResolvedValue(null);
        Insumo.create.mockResolvedValue({ id: 5 });
        Sucursal.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = crearRes();

        await crearInsumo({ body: bodyInsumo }, res);

        expect(Insumo.create).toHaveBeenCalledWith(bodyInsumo, { transaction: t });
        expect(Sucursal.findAll).toHaveBeenCalledWith(expect.objectContaining({ transaction: t }));
        expect(StockSucursal.bulkCreate).toHaveBeenCalledWith([
            { insumoId: 5, sucursalId: 1, cantidad: 0 },
            { insumoId: 5, sucursalId: 2, cantidad: 0 },
        ], { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(t.rollback).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Insumo creado con éxito', insumo: { id: 5 } });
    });

    test('si falla al guardar, deshace todo y responde 500', async () => {
        Insumo.findOne.mockResolvedValue(null);
        Insumo.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearInsumo({ body: bodyInsumo }, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al crear el insumo' });
    });
});

describe('editarInsumo', () => {
    test('responde 404 si no existe', async () => {
        Insumo.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarInsumo({ params: { id: '99' }, body: bodyInsumo }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Insumo no encontrado' });
    });

    test('rechaza el nombre de otro insumo', async () => {
        Insumo.findByPk.mockResolvedValue(insumoDeLaBase());
        Insumo.findOne.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await editarInsumo({ params: { id: '1' }, body: bodyInsumo }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Ya existe un insumo con ese nombre' });
    });

    test('permite conservar el propio nombre y editar el resto', async () => {
        const insumo = insumoDeLaBase();
        Insumo.findByPk.mockResolvedValue(insumo);
        Insumo.findOne.mockResolvedValue({ id: 1 });
        const res = crearRes();

        await editarInsumo({ params: { id: '1' }, body: { ...bodyInsumo, precioComercial: 75 } }, res);

        expect(insumo.update).toHaveBeenCalledWith({ ...bodyInsumo, precioComercial: 75 });
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Insumo editado con éxito', insumo });
    });

    test('responde 500 si falla la base de datos', async () => {
        Insumo.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarInsumo({ params: { id: '1' }, body: bodyInsumo }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al editar el insumo' });
    });
});

describe('eliminarInsumo', () => {
    test('responde 404 si no existe', async () => {
        Insumo.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarInsumo({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('no elimina un insumo usado en una receta', async () => {
        Insumo.findByPk.mockResolvedValue(insumoDeLaBase());
        RecetaInsumo.count.mockResolvedValue(1);
        const res = crearRes();

        await eliminarInsumo({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].mensaje).toContain('se usa en 1 producto');
    });

    test('informa en plural cuando se usa en varias recetas', async () => {
        Insumo.findByPk.mockResolvedValue(insumoDeLaBase());
        RecetaInsumo.count.mockResolvedValue(3);
        const res = crearRes();

        await eliminarInsumo({ params: { id: '1' } }, res);

        expect(res.json.mock.calls[0][0].mensaje).toContain('se usa en 3 productos');
    });

    test('elimina el stock y el insumo en una transacción', async () => {
        const insumo = insumoDeLaBase();
        Insumo.findByPk.mockResolvedValue(insumo);
        RecetaInsumo.count.mockResolvedValue(0);
        const res = crearRes();

        await eliminarInsumo({ params: { id: '1' } }, res);

        expect(StockSucursal.destroy).toHaveBeenCalledWith({
            where: { insumoId: 1 },
            transaction: t,
        });
        expect(insumo.destroy).toHaveBeenCalledWith({ transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(t.rollback).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Insumo eliminado con éxito' });
    });

    test('si falla al eliminar, deshace todo y responde 500', async () => {
        const insumo = insumoDeLaBase();
        Insumo.findByPk.mockResolvedValue(insumo);
        RecetaInsumo.count.mockResolvedValue(0);
        StockSucursal.destroy.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await eliminarInsumo({ params: { id: '1' } }, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al eliminar el insumo' });
    });
});
