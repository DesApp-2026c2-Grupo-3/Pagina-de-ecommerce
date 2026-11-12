'use strict';

const {
    BLOQUES,
    detectarBloquesModificados,
} = require('../../src/utils/sucursalCambios');

const BASE = {
    nombre: 'Centro',
    telefono: '1234',
    horario: { lunes: { apertura: '09:00', cierre: '18:00', abierto: true } },
    zona_horaria: 'America/Argentina/Buenos_Aires',
    calle: 'Rivadavia',
    numero: '1234',
    localidad: 'Morón',
    provincia: 'Buenos Aires',
    codigoPostal: '1708',
    latitud: -34.65,
    longitud: -58.62,
    radioEntregaKm: '5.00',
};

test('no detecta cambios cuando los valores son equivalentes', () => {
    expect(detectarBloquesModificados(BASE, {
        ...BASE,
        latitud: -34.65,
        longitud: -58.62,
        radioEntregaKm: 5,
    })).toEqual([]);
});

test('detecta cada bloque por separado', () => {
    expect(detectarBloquesModificados(BASE, { nombre: 'Centro 2' })).toEqual([
        BLOQUES.DATOS_GENERALES,
    ]);

    expect(detectarBloquesModificados(BASE, {
        horario: { lunes: { apertura: '10:00', cierre: '18:00', abierto: true } },
    })).toEqual([BLOQUES.HORARIOS]);

    expect(detectarBloquesModificados(BASE, { calle: 'San Martín' })).toEqual([
        BLOQUES.UBICACION,
    ]);

    expect(detectarBloquesModificados(BASE, { radioEntregaKm: 8 })).toEqual([
        BLOQUES.ENTREGA,
    ]);
});

test('devuelve los bloques en orden estable', () => {
    expect(detectarBloquesModificados(BASE, {
        radioEntregaKm: 8,
        nombre: 'Centro 2',
        horario: { lunes: { apertura: '10:00', cierre: '18:00', abierto: true } },
    })).toEqual([
        BLOQUES.DATOS_GENERALES,
        BLOQUES.HORARIOS,
        BLOQUES.ENTREGA,
    ]);
});

test('ignora campos ausentes en actualizaciones parciales', () => {
    expect(detectarBloquesModificados(BASE, { telefono: '9999' })).toEqual([
        BLOQUES.DATOS_GENERALES,
    ]);
});

test('tolera nulos y strings vacíos como equivalentes', () => {
    const anterior = { ...BASE, telefono: null, codigoPostal: '' };

    expect(detectarBloquesModificados(anterior, {
        telefono: '',
        codigoPostal: null,
    })).toEqual([]);
});
