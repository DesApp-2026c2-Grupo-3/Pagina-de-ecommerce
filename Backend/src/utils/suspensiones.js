const { SuspensionProducto } = require('../models');

// Ids de los productos con una suspensión activa (de cualquier origen) en esa sucursal
async function productosSuspendidos(sucursalId, transaction) {
    if (!sucursalId) return new Set();
    const filas = (await SuspensionProducto.findAll({
        where: { sucursalId, rehabilitadaEn: null },
        attributes: ['productoId'],
        transaction,
    })) ?? [];
    return new Set(filas.map((f) => f.productoId));
}

module.exports = { productosSuspendidos };
