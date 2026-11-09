'use strict';

const { TIPOS } = require('../events');
const { paraSucursal } = require('../destinatarios');
const { notificacionService } = require('../index');

async function notificarSucursalCerrada({ sucursalId, sucursalNombre }) {
    const id = Number(sucursalId);

    return notificacionService.publicar({
        tipo: TIPOS.SUCURSAL_CERRADA,
        datos: {
            sucursalId: id,
            sucursalNombre: String(sucursalNombre ?? ''),
        },
        destinos: paraSucursal({ sucursalId: id }),
    });
}

module.exports = { notificarSucursalCerrada };
