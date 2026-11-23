'use strict';

const { isDeepStrictEqual } = require('node:util');

const BLOQUES = Object.freeze({
    DATOS_GENERALES: 'datos_generales',
    HORARIOS: 'horarios',
    UBICACION: 'ubicacion',
    ENTREGA: 'entrega',
});

function normalizarTexto(valor) {
    if (valor === null || valor === undefined) return null;

    const texto = String(valor).trim();
    return texto === '' ? null : texto;
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === '') return null;

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

const COMPARADORES = Object.freeze({
    texto: (anterior, siguiente) => normalizarTexto(anterior) !== normalizarTexto(siguiente),
    numero: (anterior, siguiente) => normalizarNumero(anterior) !== normalizarNumero(siguiente),
    estructura: (anterior, siguiente) => !isDeepStrictEqual(anterior ?? null, siguiente ?? null),
});

const CAMPOS_POR_BLOQUE = Object.freeze({
    [BLOQUES.DATOS_GENERALES]: [
        { campo: 'nombre', tipo: 'texto' },
        { campo: 'telefono', tipo: 'texto' },
    ],
    [BLOQUES.HORARIOS]: [
        { campo: 'horario', tipo: 'estructura' },
        { campo: 'zona_horaria', tipo: 'texto' },
    ],
    [BLOQUES.UBICACION]: [
        { campo: 'calle', tipo: 'texto' },
        { campo: 'numero', tipo: 'texto' },
        { campo: 'localidad', tipo: 'texto' },
        { campo: 'provincia', tipo: 'texto' },
        { campo: 'codigoPostal', tipo: 'texto' },
        { campo: 'latitud', tipo: 'numero' },
        { campo: 'longitud', tipo: 'numero' },
    ],
    [BLOQUES.ENTREGA]: [
        { campo: 'radioEntregaKm', tipo: 'numero' },
    ],
});

function tieneCampo(objeto, campo) {
    return Boolean(objeto) && Object.prototype.hasOwnProperty.call(objeto, campo);
}

function detectarBloquesModificados(anterior = {}, siguiente = {}) {
    if (!anterior || !siguiente) return [];

    const cambios = [];

    for (const [bloque, campos] of Object.entries(CAMPOS_POR_BLOQUE)) {
        const modificado = campos.some(({ campo, tipo }) => (
            tieneCampo(siguiente, campo)
            && COMPARADORES[tipo](anterior[campo], siguiente[campo])
        ));

        if (modificado) cambios.push(bloque);
    }

    return cambios;
}

module.exports = {
    BLOQUES,
    CAMPOS_POR_BLOQUE,
    detectarBloquesModificados,
};
