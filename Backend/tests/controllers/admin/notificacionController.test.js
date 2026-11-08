const mockModelos = {
    Notificacion: { findAll: jest.fn(), count: jest.fn(), findOne: jest.fn(), update: jest.fn() },
    Parte: { update: jest.fn() },
};
jest.mock('../../../src/models', () => mockModelos);

const { listar, marcarLeida, marcarTodas } = require('../../../src/controllers/admin/notificacionController');
const { Notificacion, Parte } = mockModelos;

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const encargado = { id: 7, rol: 'ADMIN', sucursalId: 2 };
const empleado = { id: 20, rol: 'EMPLEADO', sucursalId: 2 };

describe('notificaciones', () => {
    beforeEach(() => jest.clearAllMocks());

    it('lista las propias y cuenta las no leídas', async () => {
        Notificacion.findAll.mockResolvedValue([{ id: 1, tipo: 'PARTE', titulo: 'Nuevo parte', mensaje: 'x', parteId: 50, leidaEn: null, createdAt: 'hoy' }]);
        Notificacion.count.mockResolvedValue(3);
        const res = crearRes();
        await listar({ usuario: encargado }, res);
        expect(Notificacion.findAll.mock.calls[0][0].where).toEqual({ destinatarioId: 7 });
        expect(res.json).toHaveBeenCalledWith({ noLeidas: 3, items: [expect.objectContaining({ id: 1, leida: false, parteId: 50 })] });
    });

    it('al leer el aviso de un parte, el encargado lo pasa a VISTO', async () => {
        const n = { id: 1, parteId: 50, leidaEn: null, update: jest.fn() };
        Notificacion.findOne.mockResolvedValue(n);
        const res = crearRes();
        await marcarLeida({ usuario: encargado, params: { id: '1' } }, res);
        expect(n.update).toHaveBeenCalledWith({ leidaEn: expect.any(Date) });
        expect(Parte.update).toHaveBeenCalledWith(
            expect.objectContaining({ estado: 'VISTO', vistoPorId: 7 }),
            { where: { id: [50], estado: 'ENVIADO', sucursalId: 2 } },
        );
    });

    it('el empleado al leer un aviso no cambia ningún parte', async () => {
        Notificacion.findOne.mockResolvedValue({ id: 2, parteId: 50, leidaEn: null, update: jest.fn() });
        await marcarLeida({ usuario: empleado, params: { id: '2' } }, crearRes());
        expect(Parte.update).not.toHaveBeenCalled();
    });

    it('no se puede leer la notificación de otro (404)', async () => {
        Notificacion.findOne.mockResolvedValue(null);
        const res = crearRes();
        await marcarLeida({ usuario: encargado, params: { id: '99' } }, res);
        expect(Notificacion.findOne.mock.calls[0][0].where).toEqual({ id: '99', destinatarioId: 7 });
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('marcar todas devuelve cuántas eran y pasa los partes a VISTO', async () => {
        Notificacion.findAll.mockResolvedValue([{ id: 1, parteId: 50 }, { id: 2, parteId: null }]);
        const res = crearRes();
        await marcarTodas({ usuario: encargado }, res);
        expect(res.json).toHaveBeenCalledWith({ marcadas: 2 });
        expect(Parte.update).toHaveBeenCalledWith(expect.anything(), { where: { id: [50], estado: 'ENVIADO', sucursalId: 2 } });
    });
});
