'use strict';

const fs = require('fs');
const path = require('path');

const AUDIENCIAS_VALIDAS = new Set(['admin', 'cliente']);
const DIRECTORIO_ESTRATEGIAS = path.join(__dirname, 'estrategias');
const SUFIJO_ESTRATEGIA = '.strategy.js';

function errorRegistro(mensaje) {
    const error = new Error(`Registro de notificaciones inválido: ${mensaje}`);
    error.code = 'REGISTRO_NOTIFICACIONES_INVALIDO';
    return error;
}

function validarEstrategia(estrategia, archivo) {
    if (!estrategia || typeof estrategia !== 'object') {
        throw errorRegistro(`${archivo} no exporta un objeto`);
    }

    if (typeof estrategia.tipo !== 'string' || estrategia.tipo.trim() === '') {
        throw errorRegistro(`${archivo} no define un tipo válido`);
    }

    if (!Number.isInteger(estrategia.version) || estrategia.version <= 0) {
        throw errorRegistro(`${archivo} no define una versión válida`);
    }

    if (!Array.isArray(estrategia.audiencias) || estrategia.audiencias.length === 0) {
        throw errorRegistro(`${archivo} no define audiencias`);
    }

    if (estrategia.audiencias.some((audiencia) => !AUDIENCIAS_VALIDAS.has(audiencia))) {
        throw errorRegistro(`${archivo} define una audiencia desconocida`);
    }

    if (typeof estrategia.paraAdministradores !== 'boolean') {
        throw errorRegistro(`${archivo} no define paraAdministradores`);
    }

    if (typeof estrategia.construir !== 'function') {
        throw errorRegistro(`${archivo} no implementa construir`);
    }
}

function descubrirEstrategias() {
    const estrategias = new Map();

    const archivos = fs.readdirSync(DIRECTORIO_ESTRATEGIAS)
        .filter((archivo) => archivo.endsWith(SUFIJO_ESTRATEGIA))
        .sort();

    for (const archivo of archivos) {
        const estrategia = require(path.join(DIRECTORIO_ESTRATEGIAS, archivo));
        validarEstrategia(estrategia, archivo);

        if (estrategias.has(estrategia.tipo)) {
            throw errorRegistro(`tipo duplicado: ${estrategia.tipo}`);
        }

        estrategias.set(estrategia.tipo, estrategia);
    }

    return estrategias;
}

const ESTRATEGIAS = descubrirEstrategias();

function obtenerEstrategia(tipo) {
    if (typeof tipo !== 'string') return null;
    return ESTRATEGIAS.get(tipo) ?? null;
}

function esTipoRegistrado(tipo) {
    return obtenerEstrategia(tipo) !== null;
}

function tiposInbox(audiencia) {
    if (!AUDIENCIAS_VALIDAS.has(audiencia)) return [];

    return [...ESTRATEGIAS.values()]
        .filter((estrategia) => estrategia.audiencias.includes(audiencia))
        .map((estrategia) => estrategia.tipo);
}

function tipoParaAdministradores(tipo) {
    const estrategia = obtenerEstrategia(tipo);
    return estrategia ? estrategia.paraAdministradores : false;
}

function tiposRegistrados() {
    return [...ESTRATEGIAS.keys()];
}

module.exports = {
    ESTRATEGIAS,
    obtenerEstrategia,
    esTipoRegistrado,
    tiposInbox,
    tipoParaAdministradores,
    tiposRegistrados,
};
