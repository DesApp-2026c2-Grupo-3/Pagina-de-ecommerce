const mockModelos = {
    CierreSucursal: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
    Admin: { findAll: jest.fn() },
    sequelize: { transaction: jest.fn() },
};
jest.mock('../../../src/models', () => mockModelos);
jest.mock('../../../src/utils/notificaciones', () => ({
    notificar: jest.fn().mockResolvedValue(0),
    recortar: (texto) => texto,
}));

const { notificar } = require('../../../src/utils/notificaciones');
const { obtenerEstado, cerrar, reabrir, listarActivos } = require('../../../src/controllers/admin/cierreController');
const { CierreSucursal, Sucursal, Admin, sequelize } = mockModelos;

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const encargado = { id: 7, nombre: 'Valentina Gómez', rol: 'ADMIN', sucursalId: 2 };
const master = { id: 1, nombre: 'Dueño', rol: 'MASTER', sucursalId: null };
const empleado = { id: 20, nombre: 'Camila Romero', rol: 'EMPLEADO', sucursalId: 2 };

describe('cierre temporal de la sucursal', () => {
    let t;
    beforeEach(() => {
        jest.clearAllMocks();
        t = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(t);
        Sucursal.findByPk.mockResolvedValue({ id: 2, nombre: 'Morón' });
        Admin.findAll.mockImplementation(async ({ where }) => (where.rol === 'MASTER' ? [{ id: 1 }] : [{ id: 7 }, { id: 8 }, { id: 20 }]));
    });

    it('el encargado cierra con motivo y se avisa al master, al otro encargado y a los empleados (no a él)', async () => {
        CierreSucursal.findOne.mockResolvedValue(null);
        CierreSucursal.create.mockResolvedValue({ id: 5 });
        const res = crearRes();
        await cerrar({ usuario: encargado, params: { id: '2' }, body: { motivo: 'Corte de luz en la zona' } }, res);
        expect(CierreSucursal.create).toHaveBeenCalledWith({ sucursalId: 2, motivo: 'Corte de luz en la zona', cerradoPorId: 7 }, { transaction: t });
        expect(notificar.mock.calls[0][0]).toEqual([1, 8, 20]);
        expect(notificar.mock.calls[0][1]).toEqual(expect.objectContaining({ tipo: 'CIERRE' }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('el master NO puede cerrarla (403)', async () => {
        const res = crearRes();
        await cerrar({ usuario: master, params: { id: '2' }, body: { motivo: 'Corte de luz' } }, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(CierreSucursal.create).not.toHaveBeenCalled();
    });

    it('un encargado de otra sucursal o un empleado tampoco (403)', async () => {
        for (const usuario of [{ ...encargado, sucursalId: 9 }, empleado]) {
            const res = crearRes();
            await cerrar({ usuario, params: { id: '2' }, body: { motivo: 'Corte de luz' } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        }
    });

    it('si ya está cerrada responde 409', async () => {
        CierreSucursal.findOne.mockResolvedValue({ id: 5 });
        const res = crearRes();
        await cerrar({ usuario: encargado, params: { id: '2' }, body: { motivo: 'Corte de luz' } }, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(CierreSucursal.create).not.toHaveBeenCalled();
    });

    it('el encargado reabre: queda quién y cuándo, y se avisa', async () => {
        const cierre = { id: 5, update: jest.fn() };
        CierreSucursal.findOne.mockResolvedValue(cierre);
        const res = crearRes();
        await reabrir({ usuario: encargado, params: { id: '2' } }, res);
        expect(cierre.update).toHaveBeenCalledWith({ reabiertoPorId: 7, reabiertoEn: expect.any(Date) }, { transaction: t });
        expect(notificar.mock.calls[0][1]).toEqual(expect.objectContaining({ tipo: 'REAPERTURA' }));
        expect(res.json).toHaveBeenCalledWith({ cerrada: false });
    });

    it('el master también puede reabrirla: queda que fue él y se avisa al equipo de la sucursal', async () => {
        const cierre = { id: 5, update: jest.fn() };
        CierreSucursal.findOne.mockResolvedValue(cierre);
        const res = crearRes();
        await reabrir({ usuario: master, params: { id: '2' } }, res);
        expect(cierre.update).toHaveBeenCalledWith({ reabiertoPorId: 1, reabiertoEn: expect.any(Date) }, { transaction: t });
        // Se avisa a los encargados y empleados de la sucursal (el master que la reabrió no se avisa a sí mismo)
        expect(notificar.mock.calls[0][0]).toEqual([7, 8, 20]);
        expect(notificar.mock.calls[0][1]).toEqual(expect.objectContaining({
            tipo: 'REAPERTURA',
            mensaje: 'Dueño (administración) la reabrió.',
        }));
        expect(res.json).toHaveBeenCalledWith({ cerrada: false });
    });

    it('un encargado de otra sucursal o un empleado no pueden reabrirla (403)', async () => {
        for (const usuario of [{ ...encargado, sucursalId: 9 }, empleado]) {
            const res = crearRes();
            await reabrir({ usuario, params: { id: '2' } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        }
        expect(CierreSucursal.findOne).not.toHaveBeenCalled();
    });

    it('si no estaba cerrada responde 409', async () => {
        CierreSucursal.findOne.mockResolvedValue(null);
        for (const usuario of [encargado, master]) {
            const res = crearRes();
            await reabrir({ usuario, params: { id: '2' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);
        }
    });
});

describe('consultar los cierres', () => {
    beforeEach(() => jest.clearAllMocks());

    it('el estado dice si está cerrada ahora y trae el historial', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2 });
        CierreSucursal.findAll.mockResolvedValue([
            { id: 5, motivo: 'Sin agua', createdAt: 'hoy', reabiertoEn: null, cerradoPor: { id: 7, nombre: 'Valentina' } },
            { id: 4, motivo: 'Sin luz', createdAt: 'ayer', reabiertoEn: 'ayer 2', cerradoPor: { id: 7, nombre: 'Valentina' }, reabiertoPor: { id: 8, nombre: 'Nicolás' } },
        ]);
        const res = crearRes();
        await obtenerEstado({ usuario: encargado, params: { id: '2' } }, res);
        const cuerpo = res.json.mock.calls[0][0];
        expect(cuerpo.cerrada).toBe(true);
        expect(cuerpo.cierreActual.motivo).toBe('Sin agua');
        expect(cuerpo.historial).toHaveLength(2);
    });

    it('el master ve los cierres activos de todas las sucursales; el encargado, solo el de la suya', async () => {
        CierreSucursal.findAll.mockResolvedValue([]);
        await listarActivos({ usuario: master }, crearRes());
        expect(CierreSucursal.findAll.mock.calls[0][0].where).toEqual({ reabiertoEn: null });
        await listarActivos({ usuario: encargado }, crearRes());
        expect(CierreSucursal.findAll.mock.calls[1][0].where).toEqual({ reabiertoEn: null, sucursalId: 2 });
    });
});
