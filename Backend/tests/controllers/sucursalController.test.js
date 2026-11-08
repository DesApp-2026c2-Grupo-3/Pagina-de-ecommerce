jest.mock('../../src/models', () => ({
    Sucursal: { findAll: jest.fn() },
    CierreSucursal: { findAll: jest.fn().mockResolvedValue([]) },
}));

const { Sucursal, CierreSucursal } = require('../../src/models');
const { obtenerSucursales } = require('../../src/controllers/sucursalController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerSucursales', () => {
    test('devuelve solo las sucursales activas, ordenadas por nombre', async () => {
        const sucursales = [{ id: 1, nombre: 'Centro' }];
        Sucursal.findAll.mockResolvedValue(sucursales);
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(Sucursal.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { activa: true }, order: [['nombre', 'ASC']] })
        );
        expect(res.json).toHaveBeenCalledWith([{ id: 1, nombre: 'Centro', cierreTemporal: false }]);
    });

    test('marca como cerrada temporalmente a la sucursal con un cierre activo', async () => {
        Sucursal.findAll.mockResolvedValue([{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Morón' }]);
        CierreSucursal.findAll.mockResolvedValue([{ sucursalId: 2 }]);
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(CierreSucursal.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { reabiertoEn: null } }));
        expect(res.json).toHaveBeenCalledWith([
            { id: 1, nombre: 'Centro', cierreTemporal: false },
            { id: 2, nombre: 'Morón', cierreTemporal: true },
        ]);
    });

    test('no expone datos internos (es un endpoint público)', async () => {
        Sucursal.findAll.mockResolvedValue([]);

        await obtenerSucursales({}, crearRes());

        const { attributes } = Sucursal.findAll.mock.calls[0][0];
        expect(attributes).not.toContain('activa');
        expect(attributes).not.toContain('createdAt');
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerSucursales({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});