const mockFindByPk = jest.fn();
jest.mock('../../src/models', () => ({
    StockSucursal: { findByPk: (...args) => mockFindByPk(...args) },
}));

const { deSuSucursalJwt, sucursalDeLaUrl, sucursalDelStock } = require('../../src/middleware/admin/deSuSucursalJwt');

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const correr = async (middleware, req) => {
    const res = crearRes();
    const next = jest.fn();
    await middleware(req, res, next);
    return { res, next };
};

describe('deSuSucursalJwt', () => {
    beforeEach(() => mockFindByPk.mockReset());

    it('el MASTER pasa sin consultar nada', async () => {
        const obtener = jest.fn();
        const { next } = await correr(deSuSucursalJwt(obtener), { usuario: { rol: 'MASTER', sucursalId: null }, params: { id: '9' } });
        expect(next).toHaveBeenCalled();
        expect(obtener).not.toHaveBeenCalled();
    });

    it('el ADMIN pasa en su propia sucursal', async () => {
        const { next } = await correr(deSuSucursalJwt(sucursalDeLaUrl), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '3' } });
        expect(next).toHaveBeenCalled();
    });

    it('el ADMIN recibe 403 en otra sucursal', async () => {
        const { res, next } = await correr(deSuSucursalJwt(sucursalDeLaUrl), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '5' } });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('un ADMIN sin sucursal asignada recibe 403', async () => {
        const { res, next } = await correr(deSuSucursalJwt(sucursalDeLaUrl), { usuario: { rol: 'ADMIN', sucursalId: null }, params: { id: '3' } });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('recibe 404 si el recurso no existe', async () => {
        mockFindByPk.mockResolvedValue(null);
        const { res, next } = await correr(deSuSucursalJwt(sucursalDelStock), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '77' } });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('con una fila de stock, usa la sucursal de esa fila', async () => {
        mockFindByPk.mockResolvedValue({ sucursalId: 3 });
        const propia = await correr(deSuSucursalJwt(sucursalDelStock), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '12' } });
        expect(propia.next).toHaveBeenCalled();

        mockFindByPk.mockResolvedValue({ sucursalId: 4 });
        const ajena = await correr(deSuSucursalJwt(sucursalDelStock), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '12' } });
        expect(ajena.res.status).toHaveBeenCalledWith(403);
    });

    it('responde 500 si falla la consulta', async () => {
        mockFindByPk.mockRejectedValue(new Error('db caída'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const { res } = await correr(deSuSucursalJwt(sucursalDelStock), { usuario: { rol: 'ADMIN', sucursalId: 3 }, params: { id: '12' } });
        expect(res.status).toHaveBeenCalledWith(500);
        console.error.mockRestore();
    });
});
