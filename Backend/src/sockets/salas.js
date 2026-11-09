const SALAS = Object.freeze({
    usuario: (tipo, id) => `user:${tipo}:${id}`,
    rol: (rol) => `role:${rol}`,
    sucursal: (id) => `sucursal:${id}`,
    adminSucursal: (id) => `admin:sucursal:${id}`,
    adminGlobal: () => 'admin:global',
    pedido: (id) => `pedido:${id}`,
});

function salasDeIdentidad(identidad) {
    if (!identidad?.tipo || !identidad?.id) return [];

    const salas = [
        SALAS.usuario(identidad.tipo, identidad.id),
        SALAS.rol(identidad.tipo),
    ];

    if (identidad.sucursalId) {
        salas.push(
            identidad.tipo === 'admin'
                ? SALAS.adminSucursal(identidad.sucursalId)
                : SALAS.sucursal(identidad.sucursalId)
        );
    } else if (identidad.tipo === 'admin') {
        salas.push(SALAS.adminGlobal());
    }

    return [...new Set(salas)];
}

module.exports = { SALAS, salasDeIdentidad };
