'use strict';

const { SALAS, salasDeIdentidad } = require('../../src/sockets/salas');

test('un administrador de sucursal entra a sus salas personal, de tipo, de rol y de sucursal', () => {
    expect(salasDeIdentidad({
        tipo: 'admin',
        id: 3,
        rol: 'ADMIN',
        sucursalId: 2,
    })).toEqual([
        'user:admin:3',
        'role:admin',
        'role:ADMIN',
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

test('un master sin sucursal entra a la sala global y a la sala de su rol', () => {
    expect(salasDeIdentidad({
        tipo: 'admin',
        id: 1,
        rol: 'MASTER',
        sucursalId: null,
    })).toEqual([
        'user:admin:1',
        'role:admin',
        'role:MASTER',
        'admin:global',
    ]);
});

test('expone los nombres de sala usados por el backend', () => {
    expect(SALAS.pedido(45)).toBe('pedido:45');
    expect(SALAS.sucursal(2)).toBe('sucursal:2');
    expect(SALAS.rol('MASTER')).toBe('role:MASTER');
    expect(SALAS.adminGlobal()).toBe('admin:global');
});
