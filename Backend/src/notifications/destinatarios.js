'use strict';

function ids(valor) {
    if (!Array.isArray(valor)) return [];
    return [...new Set(
        valor
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
    )];
}

function paraPedidoCreado({ pedidoId, usuarioId, sucursalId }) {
    return {
        clientes: ids([usuarioId]),
        administradoresSucursal: ids([sucursalId]),
        pedidos: ids([pedidoId]),
    };
}

function paraEstadoPedido({ pedidoId, usuarioId }) {
    return {
        clientes: ids([usuarioId]),
        pedidos: ids([pedidoId]),
    };
}

function paraSucursal({ sucursalId }) {
    return {
        clientesSucursal: ids([sucursalId]),
        administradoresSucursal: ids([sucursalId]),
    };
}

function paraStock({ sucursalId }) {
    return {
        administradoresSucursal: ids([sucursalId]),
    };
}

function paraRepartidor({ repartidorId }) {
    return {
        repartidores: ids([repartidorId]),
    };
}

// Una asistencia la atienden los admins de la sucursal del repartidor y el MASTER
function paraAsistencia({ sucursalId }) {
    return {
        administradoresSucursal: ids([sucursalId]),
        roles: ['MASTER'],
    };
}

module.exports = {
    paraRepartidor,
    paraAsistencia,
    paraPedidoCreado,
    paraEstadoPedido,
    paraSucursal,
    paraStock,
};
