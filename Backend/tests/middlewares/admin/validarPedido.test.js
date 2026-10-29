const { validarPedido, validarEstadoPedido } = require('../../../src/middleware/admin/validarPedido');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function bodyValido(datos = {}) {
    return {
        usuarioId: 1,
        fecha: '2026-10-27',
        total: 1500,
        direccionId: 3,
        sucursalId: 2,
        estado: 'Pendiente',
        ...datos,
    };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarPedido', () => {
    test('deja pasar un pedido válido y limpia los datos', () => {
        const req = { body: bodyValido({ usuarioId: '1', total: '1500', direccionId: '3', sucursalId: '2' }) };
        const next = jest.fn();

        validarPedido(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.usuarioId).toBe(1);
        expect(req.body.total).toBe(1500);
        expect(req.body.direccionId).toBe(3);
        expect(req.body.sucursalId).toBe(2);
    });

    test('exige el usuario', () => {
        const { usuarioId, ...body } = bodyValido();
        const res = crearRes();

        validarPedido({ body }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El id de usuario es obligatorio');
    });

    test('exige la fecha', () => {
        const { fecha, ...body } = bodyValido();
        const res = crearRes();

        validarPedido({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('La fecha es obligatoria');
    });

    test('exige el total', () => {
        const { total, ...body } = bodyValido();
        const res = crearRes();

        validarPedido({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('El total es obligatorio');
    });

    test('rechaza un total que no es positivo', () => {
        const res = crearRes();

        validarPedido({ body: bodyValido({ total: 0 }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El total debe ser mayor a 0');
    });

    test('exige la dirección de entrega', () => {
        const { direccionId, ...body } = bodyValido();
        const res = crearRes();

        validarPedido({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('Tenés que seleccionar una dirección de entrega');
    });

    test('exige la sucursal', () => {
        const { sucursalId, ...body } = bodyValido();
        const res = crearRes();

        validarPedido({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('Tenés que seleccionar una sucursal');
    });

    test('rechaza un estado que no existe', () => {
        const res = crearRes();

        validarPedido({ body: bodyValido({ estado: 'Volando' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El estado debe ser uno de: Pendiente, En proceso, En camino, Entregado o Cancelado'
        );
    });

    test('rechaza campos desconocidos', () => {
        const res = crearRes();

        validarPedido({ body: bodyValido({ esAdmin: true }) }, res, jest.fn());

        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});

describe('validarEstadoPedido', () => {
    test.each(['Pendiente', 'En proceso', 'En camino', 'Entregado', 'Cancelado'])(
        'acepta el estado "%s"',
        (estado) => {
            const req = { body: { estado } };
            const next = jest.fn();

            validarEstadoPedido(req, crearRes(), next);

            expect(next).toHaveBeenCalled();
            expect(req.body).toEqual({ estado });
        }
    );

    test('exige el estado', () => {
        const res = crearRes();

        validarEstadoPedido({ body: {} }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El estado es obligatorio');
    });

    test('rechaza un estado inválido', () => {
        const res = crearRes();

        validarEstadoPedido({ body: { estado: 'Perdido' } }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El estado debe ser uno de: Pendiente, En proceso, En camino, Entregado o Cancelado'
        );
    });

    test('no permite cambiar otros datos del pedido', () => {
        const res = crearRes();

        validarEstadoPedido({ body: { estado: 'Entregado', total: 1 } }, res, jest.fn());

        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});
