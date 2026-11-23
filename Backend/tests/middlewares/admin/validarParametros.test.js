const { validarParametros } = require('../../../src/middleware/admin/validarParametros');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Parámetros válidos (los valores por defecto), con los cambios que pida cada test
function bodyValido(datos = {}) {
    return {
        maxPedidosEnCurso: 2,
        radioEntregaKm: 10,
        envioBase: 1200,
        envioPorKm: 300,
        preparacionBaseMin: 10,
        preparacionPorProductoMin: 2,
        viajeMinPorKm: 4,
        margenDemoraMin: 5,
        diasParaCalificar: 7,
        opinionesEnInicio: 6,
        maxPromosPorDia: 3,
        ...datos,
    };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarParametros', () => {
    test('deja pasar parámetros válidos', () => {
        const res = crearRes();
        const next = jest.fn();

        validarParametros({ body: bodyValido() }, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('reemplaza el body por los datos convertidos (texto a número y 2 decimales)', () => {
        const req = { body: bodyValido({ radioEntregaKm: '12.5', envioPorKm: 300.456, diasParaCalificar: '10' }) };
        const next = jest.fn();

        validarParametros(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.radioEntregaKm).toBe(12.5);
        expect(req.body.envioPorKm).toBe(300.46);
        expect(req.body.diasParaCalificar).toBe(10);
    });

    test('responde 400 si falta un parámetro y no sigue', () => {
        const { envioBase, ...body } = bodyValido();
        const res = crearRes();
        const next = jest.fn();

        validarParametros({ body }, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El envío base es obligatorio');
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 400 con el mensaje del valor fuera de rango', () => {
        const res = crearRes();
        const next = jest.fn();

        validarParametros({ body: bodyValido({ radioEntregaKm: 50 }) }, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El radio de entrega no puede ser mayor a 30');
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 400 si un entero llega con decimales', () => {
        const res = crearRes();

        validarParametros({ body: bodyValido({ maxPromosPorDia: 2.5 }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El máximo de promos por día debe ser un número entero');
    });

    test('responde 400 si llega un campo que no es un parámetro', () => {
        const res = crearRes();

        validarParametros({ body: bodyValido({ rol: 'MASTER' }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toMatch(/not allowed/);
    });

    test('no modifica el body cuando los datos son inválidos', () => {
        const body = bodyValido({ radioEntregaKm: 50 });
        const req = { body };

        validarParametros(req, crearRes(), jest.fn());

        expect(req.body).toBe(body);
    });
});