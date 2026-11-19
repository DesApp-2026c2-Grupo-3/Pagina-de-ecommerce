// D-07: retirar y entregar reemplazan a PATCH /:pedidoId/estado, todo detrás de esRepartidorJwt.

jest.mock('express', () => {
    const registros = [];
    const registrar = (metodo) => (...args) => registros.push({ metodo, args });
    const router = { get: registrar('GET'), patch: registrar('PATCH') };
    return { Router: () => router, __registros: registros };
});

jest.mock('../../src/middleware/repartidor/esRepartidorJwt', () => ({
    esRepartidorJwt: function esRepartidorJwt() {},
}));

jest.mock('../../src/controllers/repartidor/pedidoRepartidorController', () => ({
    obtenerPedidosDisponibles: function obtenerPedidosDisponibles() {},
    retirarPedido: function retirarPedido() {},
    entregarPedido: function entregarPedido() {},
}));

const { __registros: registros } = require('express');
const { esRepartidorJwt } = require('../../src/middleware/repartidor/esRepartidorJwt');
const controller = require('../../src/controllers/repartidor/pedidoRepartidorController');
require('../../src/routes/repartidor/pedidoRepartidorRoutes');

test.each([
    ['GET', '/disponibles', 'obtenerPedidosDisponibles'],
    ['PATCH', '/:pedidoId/retirar', 'retirarPedido'],
    ['PATCH', '/:pedidoId/entregar', 'entregarPedido'],
])('%s %s exige sesión de repartidor y usa %s', (metodo, path, nombre) => {
    const registro = registros.find((r) => r.metodo === metodo && r.args[0] === path);

    expect(registro).toBeDefined();
    expect(registro.args).toEqual([path, esRepartidorJwt, controller[nombre]]);
});

test('ya no existe PATCH /:pedidoId/estado', () => {
    expect(registros.some((r) => r.args[0] === '/:pedidoId/estado')).toBe(false);
});
