'use strict';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readdirSync: jest.fn(),
}));

const fs = require('fs');
const path = require('path');

const directorio = path.resolve(__dirname, '../../src/notifications/estrategias');

function cargarRegistroCon(nombreArchivo, estrategia) {
    fs.readdirSync.mockReturnValue([nombreArchivo]);
    jest.doMock(path.join(directorio, nombreArchivo), () => estrategia, { virtual: true });

    let registro;
    jest.isolateModules(() => {
        registro = require('../../src/notifications/registroEstrategias');
    });
    return registro;
}

const construir = () => ({ datos: {}, destinos: {} });

test('acepta estrategias con audiencia repartidor y arma su bandeja', () => {
    const registro = cargarRegistroCon('viajeDePrueba.strategy.js', {
        tipo: 'viaje.de_prueba',
        version: 1,
        audiencias: ['repartidor'],
        construir,
    });

    expect(registro.tiposInbox('repartidor')).toEqual(['viaje.de_prueba']);
    expect(registro.tiposInbox('admin')).toEqual([]);
    expect(registro.audienciasDe('viaje.de_prueba')).toEqual(['repartidor']);
});

test('rechaza una audiencia desconocida', () => {
    expect(() => cargarRegistroCon('audienciaRara.strategy.js', {
        tipo: 'otro.tipo',
        version: 1,
        audiencias: ['proveedor'],
        construir,
    })).toThrow(/audiencia desconocida/);
});
