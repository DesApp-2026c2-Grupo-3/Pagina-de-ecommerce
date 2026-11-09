'use strict';

const { SALAS, salasDeIdentidad } = require('../../src/sockets/salas');

test('un administrador entra a su sala personal, de rol y de sucursal', () => {
    expect(salasDeIdentidad({
        tipo: 'admin',
        id: 3,
        sucursalId: 2,
    })).toEqual([
        'user:admin:3',
        'role:admin',
        'admin:sucursal:2',
    ]);
});

test('un cliente entra a su sala personal, de rol y de sucursal', () => {
    expect(salasDeIdentidad({
        tipo: 'cliente',
        id: 8,
        sucursalId: 2,
    })).toEqual([
        'user:cliente:8',
        'role:cliente',
        'sucursal:2',
    ]);
});

test('un master sin sucursal entra a la sala global', () => {
    expect(salasDeIdentidad({
        tipo: 'admin',
        id: 1,
        sucursalId: null,
    })).toEqual([
        'user:admin:1',
        'role:admin',
        'admin:global',
    ]);
});

test('expone los nombres de sala usados por el backend', () => {
    expect(SALAS.pedido(45)).toBe('pedido:45');
    expect(SALAS.sucursal(2)).toBe('sucursal:2');
    expect(SALAS.adminGlobal()).toBe('admin:global');
});
