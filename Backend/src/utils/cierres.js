const { CierreSucursal } = require('../models');

// ¿La sucursal tiene un cierre temporal activo? Es aparte del horario semanal (que la app calcula sola)
// y de Sucursal.activa (que es del master).
async function sucursalCerrada(sucursalId, transaction) {
    if (!sucursalId) return false;
    const cierre = await CierreSucursal.findOne({
        where: { sucursalId, reabiertoEn: null },
        attributes: ['id'],
        transaction,
    });
    return Boolean(cierre);
}

module.exports = { sucursalCerrada };
