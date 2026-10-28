const mockAdmin = { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() };
const mockSucursal = { findByPk: jest.fn() };

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hash'), compare: jest.fn() }));
jest.mock('../../../src/models', () => ({ Admin: mockAdmin, Sucursal: mockSucursal }));

const { crearAdmin, reactivarAdmin, actualizarAdmin } = require('../../../src/controllers/admin/adminController');

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const body = (extra = {}) => ({ nombre: 'Lucía Fernández', email: 'lucia.fernandez@burgerfast.com', password: 'Burger1234', sucursalId: 7, ...extra });
const master = { rol: 'MASTER', sucursalId: null };
const encargado = { rol: 'ADMIN', sucursalId: 2 };

describe('cupos por sucursal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAdmin.findOne.mockResolvedValue(null);
        mockAdmin.count.mockResolvedValue(0);
        mockSucursal.findByPk.mockImplementation(async (id) => ({ id, activa: true, maxEmpleados: 3 }));
        mockAdmin.create.mockImplementation(async (datos) => ({ ...datos, id: 99, reload: async () => {}, Sucursal: null }));
    });

    it('una sucursal con 1 encargado activo admite el segundo', async () => {
        mockAdmin.count.mockResolvedValue(1);
        const res = crearRes();
        await crearAdmin({ usuario: master, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('una sucursal con 2 encargados activos rechaza al tercero (409)', async () => {
        mockAdmin.count.mockResolvedValue(2);
        const res = crearRes();
        await crearAdmin({ usuario: master, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(mockAdmin.create).not.toHaveBeenCalled();
    });

    it('el encargado crea empleados mientras haya cupo', async () => {
        mockAdmin.count.mockResolvedValue(2);
        const res = crearRes();
        await crearAdmin({ usuario: encargado, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('el encargado no puede pasarse del cupo de empleados (409)', async () => {
        mockAdmin.count.mockResolvedValue(3);
        const res = crearRes();
        await crearAdmin({ usuario: encargado, body: body() }, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(mockAdmin.create).not.toHaveBeenCalled();
    });

    it('reactivar a un encargado en una sucursal completa responde 409', async () => {
        mockAdmin.findByPk.mockResolvedValue({ id: 5, rol: 'ADMIN', sucursalId: 7, activo: false, save: jest.fn() });
        mockAdmin.count.mockResolvedValue(2);
        const res = crearRes();
        await reactivarAdmin({ usuario: master, params: { id: 5 } }, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('reactivar con lugar disponible funciona', async () => {
        const admin = { id: 5, rol: 'ADMIN', sucursalId: 7, activo: false, save: jest.fn() };
        mockAdmin.findByPk.mockResolvedValue(admin);
        mockAdmin.count.mockResolvedValue(1);
        const res = crearRes();
        await reactivarAdmin({ usuario: master, params: { id: 5 } }, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(admin.activo).toBe(true);
    });

    it('mover a un encargado a una sucursal completa responde 409', async () => {
        mockAdmin.findByPk.mockResolvedValue({ id: 5, rol: 'ADMIN', sucursalId: 1, activo: true, email: 'x@burgerfast.com', nombre: 'X', update: jest.fn(), reload: jest.fn() });
        mockAdmin.count.mockResolvedValue(2);
        const res = crearRes();
        await actualizarAdmin({ usuario: master, params: { id: 5 }, body: { sucursalId: 7 } }, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('editar a un empleado con un mail que no es del personal responde 400', async () => {
        mockAdmin.findByPk.mockResolvedValue({ id: 6, rol: 'EMPLEADO', sucursalId: 2, activo: true, email: 'a@burgerfast.com', nombre: 'A', update: jest.fn(), reload: jest.fn() });
        const res = crearRes();
        await actualizarAdmin({ usuario: encargado, params: { id: 6 }, body: { email: 'a@gmail.com' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
