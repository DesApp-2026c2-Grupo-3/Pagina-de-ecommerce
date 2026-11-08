const mockModelos = {
    Parte: { create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
    Notificacion: { bulkCreate: jest.fn(), update: jest.fn() },
    Admin: { findAll: jest.fn() },
    Producto: { findAll: jest.fn() },
    Pedido: { findByPk: jest.fn() },
    sequelize: { transaction: jest.fn() },
};
jest.mock('../../../src/models', () => mockModelos);

const { crear, listar, resolver } = require('../../../src/controllers/admin/parteController');
const { Parte, Notificacion, Admin, Producto, Pedido, sequelize } = mockModelos;

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const empleado = { id: 20, nombre: 'Camila Romero', rol: 'EMPLEADO', sucursalId: 2 };
const encargado = { id: 7, nombre: 'Valentina Gómez', rol: 'ADMIN', sucursalId: 2 };
const master = { id: 1, nombre: 'Dueño', rol: 'MASTER', sucursalId: null };

describe('crear un parte', () => {
    let t;
    beforeEach(() => {
        jest.clearAllMocks();
        t = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(t);
        Parte.create.mockResolvedValue({ id: 50 });
        Admin.findAll.mockResolvedValue([{ id: 7 }, { id: 8 }]);
        Producto.findAll.mockImplementation(async ({ where }) => where.id.map((id) => ({ id })));
    });

    it('avisa a los dos encargados de la sucursal con un aviso por cada uno', async () => {
        const res = crearRes();
        await crear({ usuario: empleado, body: { tipo: 'EQUIPO', descripcion: 'Se rompió la máquina de café', urgencia: 'URGENTE', productoIds: [3, 4] } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 50, avisados: 2 });
        expect(Parte.create).toHaveBeenCalledWith(expect.objectContaining({ sucursalId: 2, creadoPorId: 20, tipo: 'EQUIPO', productoIds: [3, 4] }), { transaction: t });
        const avisos = Notificacion.bulkCreate.mock.calls[0][0];
        expect(avisos.map((a) => a.destinatarioId)).toEqual([7, 8]);
        expect(avisos[0]).toEqual(expect.objectContaining({ tipo: 'PARTE', titulo: '¡Parte urgente!', parteId: 50 }));
    });

    it('si no hay encargados activos igual guarda el parte (avisados 0)', async () => {
        Admin.findAll.mockResolvedValue([]);
        const res = crearRes();
        await crear({ usuario: empleado, body: { tipo: 'OTRO', descripcion: 'Aviso general', urgencia: 'NORMAL', productoIds: [] } }, res);
        expect(res.json).toHaveBeenCalledWith({ id: 50, avisados: 0 });
        expect(Notificacion.bulkCreate).not.toHaveBeenCalled();
    });

    it('rechaza un pedido de otra sucursal', async () => {
        Pedido.findByPk.mockResolvedValue({ id: 9, sucursalId: 5 });
        const res = crearRes();
        await crear({ usuario: empleado, body: { tipo: 'PEDIDO', descripcion: 'Falta una bebida', urgencia: 'NORMAL', productoIds: [], pedidoId: 9 } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(Parte.create).not.toHaveBeenCalled();
    });

    it('rechaza productos que no existen', async () => {
        Producto.findAll.mockResolvedValue([{ id: 3 }]);
        const res = crearRes();
        await crear({ usuario: empleado, body: { tipo: 'EQUIPO', descripcion: 'Se rompió la máquina', urgencia: 'NORMAL', productoIds: [3, 99] } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('listar partes: cada rol ve lo suyo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Parte.findAll.mockResolvedValue([]);
    });

    it('el empleado ve los que creó', async () => {
        await listar({ usuario: empleado, query: {} }, crearRes());
        expect(Parte.findAll.mock.calls[0][0].where).toEqual({ creadoPorId: 20 });
    });

    it('el encargado ve los de su sucursal y puede filtrar pendientes', async () => {
        await listar({ usuario: encargado, query: { estado: 'pendientes' } }, crearRes());
        expect(Parte.findAll.mock.calls[0][0].where).toEqual({ sucursalId: 2, estado: ['ENVIADO', 'VISTO'] });
    });
});

describe('resolver un parte', () => {
    let t, parte;
    beforeEach(() => {
        jest.clearAllMocks();
        t = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(t);
        parte = { id: 50, sucursalId: 2, creadoPorId: 20, estado: 'ENVIADO', vistoPorId: null, update: jest.fn() };
        Parte.findByPk.mockResolvedValue(parte);
    });

    it('el encargado de la sucursal lo resuelve, apaga los avisos y le avisa al empleado', async () => {
        const res = crearRes();
        await resolver({ usuario: encargado, params: { id: '50' }, body: { nota: 'Ya vino el técnico' } }, res);
        expect(parte.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'RESUELTO', resueltoPorId: 7, nota: 'Ya vino el técnico', vistoPorId: 7 }), { transaction: t });
        expect(Notificacion.update).toHaveBeenCalledWith({ leidaEn: expect.any(Date) }, expect.objectContaining({ where: { parteId: 50, tipo: 'PARTE', leidaEn: null } }));
        expect(Notificacion.bulkCreate.mock.calls[0][0][0]).toEqual(expect.objectContaining({ destinatarioId: 20, tipo: 'PARTE_RESUELTO' }));
        expect(res.json).toHaveBeenCalledWith({ estado: 'RESUELTO' });
    });

    it('el master no puede resolverlo (403)', async () => {
        const res = crearRes();
        await resolver({ usuario: master, params: { id: '50' }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(parte.update).not.toHaveBeenCalled();
    });

    it('un encargado de otra sucursal tampoco (403)', async () => {
        const res = crearRes();
        await resolver({ usuario: { ...encargado, sucursalId: 9 }, params: { id: '50' }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('un parte ya resuelto responde 409', async () => {
        parte.estado = 'RESUELTO';
        const res = crearRes();
        await resolver({ usuario: encargado, params: { id: '50' }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });
});
