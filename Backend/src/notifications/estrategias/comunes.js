'use strict';

function esObjeto(valor) {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor);
}

function numero(valor, defecto = 0) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : defecto;
}

function enteroPositivo(valor, nombre) {
    const n = Number(valor);

    if (!Number.isInteger(n) || n <= 0) {
        const error = new Error(`${nombre} inválido`);
        error.code = 'NOTIFICACION_INVALIDA';
        throw error;
    }

    return n;
}

function fechaIso(valor) {
    const fecha = valor ? new Date(valor) : new Date();
    return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

function pedidoADto(pedido, estadoAnterior = null) {
    return {
        pedidoId: enteroPositivo(pedido.id, 'pedidoId'),
        usuarioId: enteroPositivo(pedido.usuarioId, 'usuarioId'),
        sucursalId: enteroPositivo(pedido.sucursalId, 'sucursalId'),
        estadoAnterior,
        estado: texto(pedido.estado),
        total: numero(pedido.total),
        fecha: fechaIso(pedido.fecha),
    };
}

module.exports = {
    esObjeto,
    texto,
    numero,
    enteroPositivo,
    fechaIso,
    pedidoADto,
};
