const { validarPedido } = require('../src/middleware/validarPedido');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('validarPedido', () => {
    test('deja en req.body los datos ya limpios', () => {
        const req = {
            body: {
                usuarioId: '1',
                direccionId: '3',
                sucursalId: '2',
                productos: [{ productoId: '10', cantidad: '2' }],
            },
        };
        const next = jest.fn();

        validarPedido(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        // Los textos se convierten a número
        expect(req.body.sucursalId).toBe(2);
        expect(req.body.productos[0].cantidad).toBe(2);
        // Y el producto sin personalizar recibe la lista vacía por defecto
        expect(req.body.productos[0].personalizaciones).toEqual([]);
    });

    test('responde 400 con el mensaje del error', () => {
        const req = {
            body: {
                usuarioId: 1,
                direccionId: 3,
                productos: [{ productoId: 10, cantidad: 1 }],
            },
        };
        const res = crearRes();
        const next = jest.fn();

        validarPedido(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Tenés que seleccionar una sucursal' });
        expect(next).not.toHaveBeenCalled();
    });
});