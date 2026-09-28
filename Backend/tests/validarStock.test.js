const { validarCargaStock } = require('../src/middleware/admin/validarStock');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('validarCargaStock', () => {
    test('deja pasar una carga válida y convierte la cantidad a número', () => {
        const req = { body: { cantidad: '2.5' } };
        const next = jest.fn();

        validarCargaStock(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.cantidad).toBe(2.5);
    });

    test('responde 400 con el mensaje del error', () => {
        const req = { body: { cantidad: 0 } };
        const res = crearRes();
        const next = jest.fn();

        validarCargaStock(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            code: 'La cantidad a cargar debe ser un valor positivo',
        });
        expect(next).not.toHaveBeenCalled();
    });
});