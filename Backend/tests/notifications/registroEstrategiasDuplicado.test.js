'use strict';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readdirSync: jest.fn(),
}));

const fs = require('fs');
const path = require('path');

test('rechaza un tipo de estrategia duplicado', () => {
    const directorio = path.resolve(__dirname, '../../src/notifications/estrategias');
    const archivo = path.join(directorio, 'duplicada.strategy.js');

    fs.readdirSync.mockReturnValue([
        'duplicada.strategy.js',
        'pedidoCreado.strategy.js',
    ]);

    jest.doMock(archivo, () => ({
        tipo: 'pedido.creado',
        version: 1,
        audiencias: ['admin'],
        paraAdministradores: true,
        construir: () => ({ datos: {}, destinos: {} }),
    }), { virtual: true });

    expect(() => {
        jest.isolateModules(() => {
            require('../../src/notifications/registroEstrategias');
        });
    }).toThrow(/tipo duplicado/);
});
