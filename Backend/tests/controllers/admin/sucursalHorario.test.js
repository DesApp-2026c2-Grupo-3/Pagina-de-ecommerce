jest.mock('../../../src/models', () => ({
    Sucursal: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    Admin: {},
    Insumo: { findAll: jest.fn() },
    StockSucursal: { bulkCreate: jest.fn() },
    sequelize: { transaction: jest.fn() },
}));

const { Sucursal } = require('../../../src/models');
const {
    editarHorarioSucursal,
    cambiarPermisoHorario,
} = require('../../../src/controllers/admin/sucursalController');

const MASTER = { id: 1, rol: 'MASTER', sucursalId: null };
const ENCARGADO = { id: 9, rol: 'ADMIN', sucursalId: 2 };

const horarioNuevo = {
    lunes: { apertura: '10:00', cierre: '22:00', abierto: true },
    domingo: { apertura: '10:00', cierre: '22:00', abierto: false },
};

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function sucursalDeLaBase(datos = {}) {
    return { id: 2, nombre: 'Morón', activa: true, encargadoEditaHorario: true, update: jest.fn(), ...datos };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('editarHorarioSucursal', () => {
    const req = (usuario, id = '2') => ({ usuario, params: { id }, body: { horario: horarioNuevo } });

    test('responde 404 si la sucursal no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarHorarioSucursal(req(MASTER, '99'), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('el encargado edita el horario si el master lo habilitó', async () => {
        const sucursal = sucursalDeLaBase({ encargadoEditaHorario: true });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await editarHorarioSucursal(req(ENCARGADO), res);

        expect(sucursal.update).toHaveBeenCalledWith({ horario: horarioNuevo });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('el encargado no puede si el master apagó la perilla (403) y no se guarda nada', async () => {
        const sucursal = sucursalDeLaBase({ encargadoEditaHorario: false });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await editarHorarioSucursal(req(ENCARGADO), res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(sucursal.update).not.toHaveBeenCalled();
    });

    test('el master edita el horario aunque la perilla esté apagada', async () => {
        const sucursal = sucursalDeLaBase({ encargadoEditaHorario: false });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await editarHorarioSucursal(req(MASTER), res);

        expect(sucursal.update).toHaveBeenCalledWith({ horario: horarioNuevo });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('solo cambia el horario: no toca ningún otro dato de la sucursal', async () => {
        const sucursal = sucursalDeLaBase();
        Sucursal.findByPk.mockResolvedValue(sucursal);

        await editarHorarioSucursal({ ...req(ENCARGADO), body: { horario: horarioNuevo, nombre: 'Otro', maxEmpleados: 20 } }, crearRes());

        expect(sucursal.update).toHaveBeenCalledWith({ horario: horarioNuevo });
    });

    test('responde 500 si falla la base', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('caída'));
        const res = crearRes();

        await editarHorarioSucursal(req(MASTER), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('cambiarPermisoHorario', () => {
    test('responde 404 si la sucursal no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cambiarPermisoHorario({ params: { id: '99' }, body: { encargadoEditaHorario: false } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('apaga la perilla: el horario queda en solo lectura para los encargados', async () => {
        const sucursal = sucursalDeLaBase();
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await cambiarPermisoHorario({ params: { id: '2' }, body: { encargadoEditaHorario: false } }, res);

        expect(sucursal.update).toHaveBeenCalledWith({ encargadoEditaHorario: false });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            mensaje: 'El horario quedó en solo lectura para los encargados',
        }));
    });

    test('enciende la perilla: los encargados vuelven a poder editar', async () => {
        const sucursal = sucursalDeLaBase({ encargadoEditaHorario: false });
        Sucursal.findByPk.mockResolvedValue(sucursal);
        const res = crearRes();

        await cambiarPermisoHorario({ params: { id: '2' }, body: { encargadoEditaHorario: true } }, res);

        expect(sucursal.update).toHaveBeenCalledWith({ encargadoEditaHorario: true });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            mensaje: 'Los encargados ya pueden editar el horario',
        }));
    });

    test('responde 500 si falla la base', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('caída'));
        const res = crearRes();

        await cambiarPermisoHorario({ params: { id: '2' }, body: { encargadoEditaHorario: true } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
