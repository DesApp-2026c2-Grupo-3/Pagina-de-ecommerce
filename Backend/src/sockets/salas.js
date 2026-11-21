const SALAS = Object.freeze({
    usuario: (tipo, id) => `user:${tipo}:${id}`,
    rol: (rol) => `role:${rol}`,
    sucursal: (id) => `sucursal:${id}`,
    adminSucursal: (id) => `admin:sucursal:${id}`,
    adminGlobal: () => 'admin:global',
    pedido: (id) => `pedido:${id}`,
    repartidorSucursal: (id) => `repartidor:sucursal:${id}`,
});

function salasDeIdentidad(identidad) {
    if (!identidad?.tipo || !identidad?.id) return [];

    const salas = [
        SALAS.usuario(identidad.tipo, identidad.id),
        SALAS.rol(identidad.tipo),
    ];

    // role:REPARTIDOR, role:ADMIN, role:MASTER (el rol 'cliente' coincide con su tipo y se deduplica)
    if (typeof identidad.rol === 'string' && identidad.rol) {
        salas.push(SALAS.rol(identidad.rol));
    }

    // Cada tipo tiene su propia sala de sucursal: un repartidor nunca entra a la de clientes
    const salaSucursal = {
        admin: SALAS.adminSucursal,
        cliente: SALAS.sucursal,
        repartidor: SALAS.repartidorSucursal,
    }[identidad.tipo];

    if (identidad.sucursalId && salaSucursal) {
        salas.push(salaSucursal(identidad.sucursalId));
    } else if (identidad.tipo === 'admin') {
        salas.push(SALAS.adminGlobal());
    }

    return [...new Set(salas)];
}

module.exports = { SALAS, salasDeIdentidad };
