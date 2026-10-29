jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    return {
        Sucursal: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
        Admin: {},
        Insumo: { findAll: jest.fn() },
        StockSucursal: { bulkCreate: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

const models = require('../../../src/models');
const {
    obtenerSucursales,
    obtenerSucursalPorId,
    crearSucursal,
    editarSucursal,
    cambiarEstadoSucursal,
} = require('../../../src/controllers/admin/sucursalController');

const { Sucursal, Insumo, StockSucursal } = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function sucursalDeLaBase(datos = {}) {
    const sucursal = {
        id: 2,
        nombre: 'Morón',
        activa: true,
        Admins: [{ id: 7, nombre: 'Ana', email: 'ana@burger.com' }],
        update: jest.fn(),
        ...datos,
    };
    sucursal.toJSON = () => ({ ...sucursal });
    return sucursal;
}

const bodySucursal = {
    nombre: 'Morón',
    calle: 'Rivadavia',
    numero: '1234',
    localidad: 'Morón',
    provincia: 'Buenos Aires',
    latitud: -34.65,
    longitud: -58.62,
    radioEntregaKm: 5,
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerSucursales', () => {
    test('devuelve todas las sucursales con sus administradores', async () => {
        Sucursal.findAll.mockResolvedValue([sucursalDeLaBase()]);
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(Sucursal.findAll).toHaveBeenCalledWith(expect.objectContaining({
            order: [['activa', 'DESC'], ['nombre', 'ASC']],
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        const sucursales = res.json.mock.calls[0][0];
        expect(sucursales[0].admins).toEqual([{ id: 7, nombre: 'Ana', email: 'ana@burger.com' }]);
        expect(sucursales[0]).not.toHaveProperty('Admins');
    });

    test('si no tiene administradores, devuelve una lista vacía', async () => {
        Sucursal.findAll.mockResolvedValue([sucursalDeLaBase({ Admins: null })]);
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(res.json.mock.calls[0][0][0].admins).toEqual([]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener las sucursales' });
    });
});

describe('obtenerSucursalPorId', () => {
    test('devuelve la sucursal con sus administradores', async () => {
        Sucursal.findByPk.mockResolvedValue(sucursalDeLaBase());
        const res = crearRes();

        await obtenerSucursalPorId({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toMatchObject({
            id: 2,
            nombre: 'Morón',
            admins: [{ id: 7 }],
        });
    });

    test('responde 404 si no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerSucursalPorId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal no encontrada' });
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerSucursalPorId({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearSucursal', () => {
    test('rechaza un nombre ya usado y deshace la transacción', async () => {
        Sucursal.findOne.mockResolvedValue({ id: 9, nombre: 'Morón' });
        const res = crearRes();

        await crearSucursal({ body: bodySucursal }, res);

        expect(Sucursal.create).not.toHaveBeenCalled();
        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Ya existe una sucursal con ese nombre' });
    });

    test('crea la sucursal y el stock en 0 de cada insumo', async () => {
        Sucursal.findOne.mockResolvedValue(null);
        Sucursal.create.mockResolvedValue({ id: 5 });
        Insumo.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = crearRes();

        await crearSucursal({ body: bodySucursal }, res);

        expect(Sucursal.create).toHaveBeenCalledWith({ ...bodySucursal, activa: true }, { transaction: t });
        expect(StockSucursal.bulkCreate).toHaveBeenCalledWith([
            { insumoId: 1, sucursalId: 5, cantidad: 0 },
            { insumoId: 2, sucursalId: 5, cantidad: 0 },
        ], { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(t.rollback).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal creada con éxito', sucursal: { id: 5 } });
    });

    test('si falla al guardar, deshace todo y responde 500', async () => {
        Sucursal.findOne.mockResolvedValue(null);
        Sucursal.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearSucursal({ body: bodySucursal }, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al crear la sucursal' });
    });
});

describe('editarSucursal', () => {
    test('responde 404 si no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarSucursal({ params: { id: '99' }, body: bodySucursal }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('rechaza el nombre de otra sucursal', async () => {
        Sucursal.findByPk.mockResolvedValue(sucursalDeLaBase());
        Sucursal.findOne.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await editarSucursal({ params: { id: '2' }, body: bodySucursal }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Ya existe una sucursal con ese nombre' });
    });

    test('permite conservar el propio nombre', async () => {
        const sucursal = sucursalDeLaBase();
        Sucursal.findByPk.mockResolvedValue(sucursal);
        Sucursal.findOne.mockResolvedValue({ id: 2 });
        const res = crearRes();

        await editarSucursal({ params: { id: '2' }, body: bodySucursal }, res);

        expect(sucursal.update).toHaveBeenCalledWith(bodySucursal);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('edita los datos y responde 200', async () => {
        const sucursal = sucursalDeLaBase();
        Sucursal.findByPk.mockResolvedValue(sucursal);
        Sucursal.findOne.mockResolvedValue(null);
        const res = crearRes();

        await editarSucursal({ params: { id: '2' }, body: { nombre: 'Morón Centro' } }, res);

        expect(sucursal.update).toHaveBeenCalledWith({ nombre: 'Morón Centro' });
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal editada con éxito', sucursal });
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarSucursal({ params: { id: '2' }, body: bodySucursal }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('cambiarEstadoSucursal', () => {
    test('exige un booleano en "activa"', async () => {
        const res = crearRes();

        await cambiarEstadoSucursal({ params: { id: '2' }, body: { activa: 'no' } }, res);

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Indicá si la sucursal queda activa o no' });
    });

    test('responde 404 si no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cambiarEstadoSucursal({ params: { id: '99' }, body: { activa: true } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('desactiva la sucursal', async () => {
        const sucursal = sucursalDeLaBase({ activa: true });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await cambiarEstadoSucursal({ params: { id: '2' }, body: { activa: false } }, res);

        expect(sucursal.update).toHaveBeenCalledWith({ activa: false });
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal desactivada', sucursal });
    });

    test('activa la sucursal', async () => {
        const sucursal = sucursalDeLaBase({ activa: false });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await cambiarEstadoSucursal({ params: { id: '2' }, body: { activa: true } }, res);

        expect(sucursal.update).toHaveBeenCalledWith({ activa: true });
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal activada', sucursal });
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await cambiarEstadoSucursal({ params: { id: '2' }, body: { activa: true } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
