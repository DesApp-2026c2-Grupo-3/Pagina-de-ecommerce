// Verifica que toda la bandeja del repartidor queda detrás de esRepartidorJwt.

jest.mock('express', () => {
    const registros = [];
    const registrar = (metodo) => (...args) => registros.push({ metodo, args });
    const router = { use: registrar('USE'), get: registrar('GET'), patch: registrar('PATCH') };
    return { Router: () => router, __registros: registros };
});

jest.mock('../../src/middleware/repartidor/esRepartidorJwt', () => ({
    esRepartidorJwt: function esRepartidorJwt() {},
}));

jest.mock('../../src/controllers/repartidor/notificacionRepartidorController', () => ({
    listar: function listar() {},
    contarNoLeidas: function contarNoLeidas() {},
    marcarTodasLeidas: function marcarTodasLeidas() {},
    marcarLeida: function marcarLeida() {},
}));

const { __registros: registros } = require('express');
const { esRepartidorJwt } = require('../../src/middleware/repartidor/esRepartidorJwt');
const controller = require('../../src/controllers/repartidor/notificacionRepartidorController');
require('../../src/routes/repartidor/notificacionRepartidorRoutes');

test('el primer middleware del router es esRepartidorJwt', () => {
    expect(registros[0]).toEqual({ metodo: 'USE', args: [esRepartidorJwt] });
});

test.each([
    ['GET', '/', 'listar'],
    ['GET', '/no-leidas/count', 'contarNoLeidas'],
    ['PATCH', '/leer-todas', 'marcarTodasLeidas'],
    ['PATCH', '/:id/leida', 'marcarLeida'],
])('%s %s usa el controlador %s', (metodo, path, nombre) => {
    const registro = registros.find((r) => r.metodo === metodo && r.args[0] === path);

    expect(registro).toBeDefined();
    expect(registro.args[registro.args.length - 1]).toBe(controller[nombre]);
});
