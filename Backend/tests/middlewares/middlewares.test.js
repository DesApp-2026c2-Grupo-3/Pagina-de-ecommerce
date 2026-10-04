const { validarProducto } = require('../../src/middleware/validarProducto');
const {
    validarUsuario,
    validarLogin,
    validarActualizarUsuario,
} = require('../../src/middleware/validarUsuario');
const { validarAdmin } = require('../../src/middleware/admin/validarAdmin');
const { validarLoginAdmin } = require('../../src/middleware/admin/validarLoginAdmin');
const { validarUpdateAdmin } = require('../../src/middleware/admin/validarUpdateAdmin');
const { validarCategoria } = require('../../src/middleware/admin/validarCategoria');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Cada caso: un middleware, un body válido (y cómo debería quedar limpio),
// y un body inválido con el mensaje de error esperado.
const casos = [
    {
        nombre: 'validarProducto',
        middleware: validarProducto,
        valido: { nombre: 'Clásica', descripcion: 'Carne y queso', precio: '5000' },
        verificarLimpio: (body) => expect(body.precio).toBe(5000),
        invalido: {},
        mensaje: 'El nombre del producto es obligatorio',
    },
    {
        nombre: 'validarUsuario',
        middleware: validarUsuario,
        valido: { nombre: 'Juan', email: 'JUAN@mail.com', password: 'secreto123' },
        verificarLimpio: (body) => expect(body.email).toBe('juan@mail.com'),
        invalido: { nombre: 'Juan', email: 'juan@mail.com' },
        mensaje: 'La contraseña es obligatoria',
    },
    {
        nombre: 'validarLogin',
        middleware: validarLogin,
        valido: { email: 'Juan@Mail.com', password: 'secreto123' },
        verificarLimpio: (body) => expect(body.email).toBe('juan@mail.com'),
        invalido: { email: 'juan', password: 'secreto123' },
        mensaje: 'El email no tiene un formato válido',
    },
    {
        nombre: 'validarActualizarUsuario',
        middleware: validarActualizarUsuario,
        valido: { nombre: 'Juan', email: 'juan@mail.com', dni: '30.123.456' },
        verificarLimpio: (body) => expect(body.dni).toBe('30123456'),
        invalido: { nombre: 'Juan', email: 'juan@mail.com', password: 'nueva123' },
        mensaje: 'Ingresá tu contraseña actual para cambiarla',
    },
    {
        nombre: 'validarAdmin',
        middleware: validarAdmin,
        valido: { nombre: 'Admin Central', email: 'Admin@Burger.com', password: 'Segura123', sucursalId: 1, },
        verificarLimpio: (body) => expect(body.email).toBe('admin@burger.com'),
        invalido: { nombre: 'Admin Central', email: 'admin@burger.com', password: 'debil' },
        mensaje: 'La contraseña debe tener al menos 8 caracteres',
    },
    {
        nombre: 'validarLoginAdmin',
        middleware: validarLoginAdmin,
        valido: { email: 'ADMIN@burger.com', password: 'Segura123' },
        verificarLimpio: (body) => expect(body.email).toBe('admin@burger.com'),
        invalido: { email: 'admin@burger.com' },
        mensaje: 'La contraseña es obligatoria',
    },
    {
        nombre: 'validarUpdateAdmin',
        middleware: validarUpdateAdmin,
        valido: { nombre: 'Admin Central', email: 'Admin@Burger.com' },
        verificarLimpio: (body) => expect(body.email).toBe('admin@burger.com'),
        invalido: { nombre: 'Admin_#1', email: 'admin@burger.com' },
        mensaje: 'El nombre solo puede contener letras, números y espacios',
    },
    {
        nombre: 'validarCategoria',
        middleware: validarCategoria,
        valido: { nombre: '  Postres  ' },
        verificarLimpio: (body) => expect(body.nombre).toBe('Postres'),
        invalido: { nombre: 'Ab' },
        mensaje: 'El nombre debe tener al menos 3 caracteres',
    },
];

describe.each(casos)('$nombre', ({ middleware, valido, verificarLimpio, invalido, mensaje }) => {
    test('deja pasar datos válidos y los deja limpios en req.body', () => {
        const req = { body: { ...valido } };
        const next = jest.fn();

        middleware(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        verificarLimpio(req.body);
    });

    test('responde 400 con el mensaje del error', () => {
        const req = { body: { ...invalido } };
        const res = crearRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: mensaje });
        expect(next).not.toHaveBeenCalled();
    });
});