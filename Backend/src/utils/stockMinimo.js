'use strict';

function normalizarMinimo(valor) {
    if (valor === null || valor === undefined || valor === '') return null;

    const minimo = Number(valor);
    return Number.isFinite(minimo) && minimo >= 0 ? minimo : null;
}

function cruzaMinimo(antes, despues, minimo) {
    const cantidadAnterior = Number(antes);
    const cantidadNueva = Number(despues);
    const umbral = normalizarMinimo(minimo);

    if (umbral === null) return false;
    if (!Number.isFinite(cantidadAnterior) || !Number.isFinite(cantidadNueva)) return false;

    return cantidadAnterior > umbral && cantidadNueva <= umbral;
}

module.exports = { cruzaMinimo, normalizarMinimo };
