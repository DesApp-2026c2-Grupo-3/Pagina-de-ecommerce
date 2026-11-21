// Plan de clientes, C-2: todas las rutas de pedidos exigen la sesión del cliente,
// y ya no existen las que listaban pedidos ajenos.

jest.mock('express', () => {
    const registros = [];
    const registrar = (metodo) => (...args) => registros.push({ metodo, args });
    const router = { get: registrar('GET'), post: registrar('POST'), patch: registrar('PATCH') };
    return { Router: () => router, __registros: registros };
});

jest.mock('../../src/middleware/autenticacion', () => ({
    autenticarUsuario: function autenticarUsuario() {},
}));

jest.mock('../../src/middleware/esIdValido', () => ({
    esIdValido: function esIdValido() {},
}));

jest.mock('../../src/middleware/validarPedido', () => ({
    validarPedido: function validarPedido() {},
}));

jest.mock('../../src/controllers/pedidoController', () => ({
    obtenerPedidosPorUsuario: function obtenerPedidosPorUsuario() {},
    obtenerPedidoClienteId: function obtenerPedidoClienteId() {},
    crearPedido: function crearPedido() {},
    cotizarEnvio: function cotizarEnvio() {},
}));

jest.mock('../../src/controllers/repetirPedidoController', () => ({
    repetirPedido: function repetirPedido() {},
}));

const { __registros: registros } = require('express');
const { autenticarUsuario } = require('../../src/middleware/autenticacion');
require('../../src/routes/pedidoRoutes');

const buscar = (metodo, path) => registros.find((r) => r.metodo === metodo && r.args[0] === path);

test.each([
    ['GET', '/mios', 'obtenerPedidosPorUsuario'],
    ['GET', '/cliente/:id', 'obtenerPedidoClienteId'],
    ['POST', '/', 'crearPedido'],
    ['POST', '/cotizar', 'cotizarEnvio'],
    ['GET', '/:id/repetir', 'repetirPedido'],
])('%s %s exige la sesión del cliente antes de %s', (metodo, path, nombre) => {
    const registro = buscar(metodo, path);

    expect(registro).toBeDefined();
    expect(registro.args).toContain(autenticarUsuario);
    // La sesión se valida antes del controlador
    expect(registro.args.indexOf(autenticarUsuario)).toBeLessThan(registro.args.length - 1);
    expect(registro.args[registro.args.length - 1].name).toBe(nombre);
});

test('crear un pedido valida la sesión antes que el cuerpo', () => {
    const nombres = buscar('POST', '/').args.slice(1).map((f) => f.name);
    expect(nombres).toEqual(['autenticarUsuario', 'validarPedido', 'crearPedido']);
});

test.each([
    ['GET', '/'],
    ['GET', '/:id'],
    ['GET', '/usuario/:usuarioId'],
])('ya no existe %s %s', (metodo, path) => {
    expect(buscar(metodo, path)).toBeUndefined();
});

test('solo están las cinco rutas del cliente', () => {
    expect(registros).toHaveLength(5);
});
