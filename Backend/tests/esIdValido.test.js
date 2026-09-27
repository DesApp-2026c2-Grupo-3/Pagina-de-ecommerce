const { esIdValido } = require('../src/middleware/esIdValido');

// Un "res" falso: guarda con qué se llamó a status() y a json()
function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('esIdValido', () => {
    test('deja pasar un id entero positivo', () => {
        const req = { params: { id: '5' } };
        const res = crearRes();
        const next = jest.fn();

        esIdValido(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test.each(['abc', '0', '-3', '2.5', ''])('rechaza el id "%s"', (id) => {
        const req = { params: { id } };
        const res = crearRes();
        const next = jest.fn();

        esIdValido(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'El parámetro ID debe ser un número entero válido',
        });
        expect(next).not.toHaveBeenCalled();
    });
});