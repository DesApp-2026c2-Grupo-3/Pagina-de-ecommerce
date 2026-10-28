const mockAdmin = { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() };
const mockSucursal = { findByPk: jest.fn() };

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hash'), compare: jest.fn() }));
jest.mock('../../../src/models', () => ({ Admin: mockAdmin, Sucursal: mockSucursal }));

const { crearAdmin, verAdmins, eliminarAdmin } = require('../../../src/controllers/admin/adminController');

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const body = (extra = {}) => ({ nombre: 'Juan', email: 'juan@burgerfast.com', password: 'Abcdefg1', sucursalId: 7, ...extra });

describe('roles al crear administradores', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAdmin.findOne.mockResolvedValue(null);
        mockSucursal.findByPk.mockImplementation(async (id) => ({ id, activa: true, maxEmpleados: 3 }));
        mockAdmin.count.mockResolvedValue(0);
        mockAdmin.create.mockImplementation(async (datos) => ({ ...datos, id: 99, reload: async () => {}, Sucursal: null }));
    });

    it('el master crea un encargado (ADMIN) en la sucursal elegida', async () => {
        const res = crearRes();
        await crearAdmin({ usuario: { rol: 'MASTER', sucursalId: null }, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(mockAdmin.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ADMIN', sucursalId: 7 }));
    });

    it('el encargado crea un EMPLEADO y siempre en su propia sucursal', async () => {
        const res = crearRes();
        await crearAdmin({ usuario: { rol: 'ADMIN', sucursalId: 2 }, body: body({ sucursalId: 5 }) }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(mockAdmin.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'EMPLEADO', sucursalId: 2 }));
    });

    it('el empleado no puede crear administradores', async () => {
        const res = crearRes();
        await crearAdmin({ usuario: { rol: 'EMPLEADO', sucursalId: 2 }, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockAdmin.create).not.toHaveBeenCalled();
    });
});

describe('alcance de cada rol sobre los administradores', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAdmin.findAll.mockResolvedValue([]);
    });

    it('el encargado lista solo a los empleados de su sucursal', async () => {
        await verAdmins({ usuario: { rol: 'ADMIN', sucursalId: 2 } }, crearRes());
        expect(mockAdmin.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { rol: 'EMPLEADO', sucursalId: 2 } }));
    });

    it('el encargado no puede dar de baja a un empleado de otra sucursal', async () => {
        mockAdmin.findByPk.mockResolvedValue({ id: 2, rol: 'EMPLEADO', sucursalId: 5, save: jest.fn() });
        const res = crearRes();
        await eliminarAdmin({ usuario: { rol: 'ADMIN', sucursalId: 2 }, params: { id: 2 } }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('el encargado da de baja a un empleado de su sucursal', async () => {
        const empleado = { id: 1, rol: 'EMPLEADO', sucursalId: 2, activo: true, save: jest.fn() };
        mockAdmin.findByPk.mockResolvedValue(empleado);
        const res = crearRes();
        await eliminarAdmin({ usuario: { rol: 'ADMIN', sucursalId: 2 }, params: { id: 1 } }, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(empleado.activo).toBe(false);
    });
});
