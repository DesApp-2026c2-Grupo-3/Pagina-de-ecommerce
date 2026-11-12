'use strict';

const { fabrica } = require('../index');

function notificarSucursalCerrada(payload) {
    return fabrica.publicarPorTipo('sucursal.cerrada', payload);
}

function notificarSucursalModificadaPorAdmin(payload) {
    return fabrica.publicarPorTipo('sucursal.modificada_por_admin', payload);
}

module.exports = {
    notificarSucursalCerrada,
    notificarSucursalModificadaPorAdmin,
};
