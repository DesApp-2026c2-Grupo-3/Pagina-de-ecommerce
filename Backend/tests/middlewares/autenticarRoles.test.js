const mockVerify = jest.fn();
const mockFindByPk = jest.fn();
const mockLimpiar = jest.fn();

jest.mock('jsonwebtoken', () => ({ verify: (...a) => mockVerify(...a) }));
jest.mock('../../src/models', () => ({ Admin: { findByPk: (...a) => mockFindByPk(...a) } }));
jest.mock('../../src/utils/sesionAdmin', () => ({ limpiarCookieSesion: (...a) => mockLimpiar(...a) }));

const { esPersonalJwt, esEmpleadoJwt } = require('../../src/middleware/admin/autenticarRoles');

const correr = async (middleware, cookies = { access_token: 'token' }) => {
    const req = { cookies };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await middleware(req, res, next);
    return { req, res, next };
};

describe('autenticarRoles', () => {
    beforeEach(() => {
        mockVerify.mockReset();
        mockFindByPk.mockReset();
        mockLimpiar.mockReset();
    });

    it('sin token responde 401', async () => {
        const { res, next } = await correr(esPersonalJwt, {});
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('esEmpleadoJwt rechaza a un encargado con 403', async () => {
        mockVerify.mockReturnValue({ id: 1, rol: 'ADMIN' });
        const { res, next } = await correr(esEmpleadoJwt);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('esEmpleadoJwt rechaza al master con 403', async () => {
        mockVerify.mockReturnValue({ id: 1, rol: 'MASTER' });
        const { res } = await correr(esEmpleadoJwt);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('esEmpleadoJwt deja pasar a un empleado activo y expone su sucursal', async () => {
        mockVerify.mockReturnValue({ id: 7, rol: 'EMPLEADO' });
        mockFindByPk.mockResolvedValue({ id: 7, nombre: 'Ana', rol: 'EMPLEADO', activo: true, sucursalId: 3 });
        const { req, next } = await correr(esEmpleadoJwt);
        expect(next).toHaveBeenCalled();
        expect(req.usuario).toEqual({ id: 7, nombre: 'Ana', rol: 'EMPLEADO', sucursalId: 3 });
    });

    it('esPersonalJwt acepta a los tres roles', async () => {
        for (const rol of ['MASTER', 'ADMIN', 'EMPLEADO']) {
            mockVerify.mockReturnValue({ id: 1, rol });
            mockFindByPk.mockResolvedValue({ id: 1, nombre: 'X', rol, activo: true, sucursalId: null });
            const { next } = await correr(esPersonalJwt);
            expect(next).toHaveBeenCalled();
        }
    });

    it('un admin inactivo recibe 401 y se limpia la cookie', async () => {
        mockVerify.mockReturnValue({ id: 7, rol: 'EMPLEADO' });
        mockFindByPk.mockResolvedValue({ id: 7, rol: 'EMPLEADO', activo: false, sucursalId: 3 });
        const { res, next } = await correr(esEmpleadoJwt);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockLimpiar).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('si el rol cambió en la base desde que se emitió el token, responde 401', async () => {
        mockVerify.mockReturnValue({ id: 7, rol: 'EMPLEADO' });
        mockFindByPk.mockResolvedValue({ id: 7, rol: 'ADMIN', activo: true, sucursalId: 3 });
        const { res, next } = await correr(esEmpleadoJwt);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('un token inválido responde 401', async () => {
        mockVerify.mockImplementation(() => { throw new Error('jwt malformed'); });
        const { res } = await correr(esPersonalJwt);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
