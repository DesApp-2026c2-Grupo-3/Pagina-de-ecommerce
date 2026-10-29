const {
    validarCargaStock,
    validarBajaStock,
    validarMinimoStock,
} = require('../../src/middleware/admin/validarStock');

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
            code: 'La cantidad debe ser un valor positivo',        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('validarBajaStock', () => {
    test('deja pasar una baja válida', () => {
        const req = { body: { cantidad: '1.5', motivo: 'merma' } };
        const next = jest.fn();

        validarBajaStock(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toMatchObject({ cantidad: 1.5, motivo: 'merma' });
    });

    test('exige un motivo válido', () => {
        const res = crearRes();
        const next = jest.fn();

        validarBajaStock({ body: { cantidad: 1, motivo: 'robo' } }, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Elegí un motivo válido' });
        expect(next).not.toHaveBeenCalled();
    });

    test('exige detalle cuando el motivo es "otro"', () => {
        const res = crearRes();

        validarBajaStock({ body: { cantidad: 1, motivo: 'otro', detalle: '' } }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('validarMinimoStock', () => {
    test('deja pasar un mínimo entero y lo convierte a número', () => {
        const req = { body: { stockMinimo: '5' } };
        const next = jest.fn();

        validarMinimoStock(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.stockMinimo).toBe(5);
    });

    test('permite null para quitar la alerta', () => {
        const req = { body: { stockMinimo: null } };
        const next = jest.fn();

        validarMinimoStock(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.stockMinimo).toBeNull();
    });

    test('rechaza un mínimo negativo', () => {
        const res = crearRes();

        validarMinimoStock({ body: { stockMinimo: -1 } }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'El mínimo no puede ser negativo' });
    });
});