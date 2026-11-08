const mockModelos = { Admin: { findByPk: jest.fn(), findAll: jest.fn() }, Sucursal: {} };
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn().mockResolvedValue('HASH_NUEVO') }));
jest.mock('../../../src/models', () => mockModelos);

const bcrypt = require('bcrypt');
const { obtener, cambiarPassword } = require('../../../src/controllers/admin/perfilController');
const { Admin } = mockModelos;

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('perfil', () => {
    beforeEach(() => jest.clearAllMocks());

    it('devuelve los datos y los encargados de la sucursal', async () => {
        Admin.findByPk.mockResolvedValue({ id: 20, nombre: 'Camila Romero', email: 'camila.romero@burgerfast.com', rol: 'EMPLEADO', sucursalId: 2, createdAt: 'fecha', Sucursal: { id: 2, nombre: 'Morón' } });
        Admin.findAll.mockResolvedValue([{ id: 7, nombre: 'Valentina Gómez' }, { id: 8, nombre: 'Nicolás Herrera' }]);
        const res = crearRes();
        await obtener({ usuario: { id: 20 } }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            nombre: 'Camila Romero', sucursal: { id: 2, nombre: 'Morón' }, encargados: [{ id: 7, nombre: 'Valentina Gómez' }, { id: 8, nombre: 'Nicolás Herrera' }],
        }));
    });

    it('el master (sin sucursal) no tiene encargados que listar', async () => {
        Admin.findByPk.mockResolvedValue({ id: 1, nombre: 'Dueño', email: 'admin@master.com', rol: 'MASTER', sucursalId: null, createdAt: 'f', Sucursal: null });
        const res = crearRes();
        await obtener({ usuario: { id: 1 } }, res);
        expect(Admin.findAll).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sucursal: null, encargados: [] }));
    });
});

describe('cambiar la contraseña', () => {
    let admin;
    beforeEach(() => {
        jest.clearAllMocks();
        admin = { id: 20, password: 'HASH_VIEJO', update: jest.fn() };
        Admin.findByPk.mockResolvedValue(admin);
    });

    it('con la actual correcta guarda la nueva encriptada', async () => {
        bcrypt.compare.mockResolvedValue(true);
        const res = crearRes();
        await cambiarPassword({ usuario: { id: 20 }, body: { passwordActual: 'Burger1234', passwordNueva: 'Nueva12345' } }, res);
        expect(admin.update).toHaveBeenCalledWith({ password: 'HASH_NUEVO' });
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Contraseña actualizada' });
    });

    it('con la actual incorrecta responde 400 (no 401) y no cambia nada', async () => {
        bcrypt.compare.mockResolvedValue(false);
        const res = crearRes();
        await cambiarPassword({ usuario: { id: 20 }, body: { passwordActual: 'mala', passwordNueva: 'Nueva12345' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(admin.update).not.toHaveBeenCalled();
    });

    it('rechaza una nueva igual a la actual', async () => {
        bcrypt.compare.mockResolvedValue(true);
        const res = crearRes();
        await cambiarPassword({ usuario: { id: 20 }, body: { passwordActual: 'Burger1234', passwordNueva: 'Burger1234' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(admin.update).not.toHaveBeenCalled();
    });
});
