const SALAS = Object.freeze({
    usuario: (tipo, id) => `user:${tipo}:${id}`,
    rol: (rol) => `role:${rol}`,
    sucursal: (id) => `sucursal:${id}`,
    adminSucursal: (id) => `admin:sucursal:${id}`,
    pedido: (id) => `pedido:${id}`,
});

module.exports = { SALAS };
