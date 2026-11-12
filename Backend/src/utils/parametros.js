const { Parametro } = require('../models');

// Los DECIMAL de Postgres llegan como texto ("10.00"): se pasan a número
const DECIMALES = ['radioEntregaKm', 'envioBase', 'envioPorKm', 'viajeMinPorKm'];

/**
 * Los parámetros del negocio, como objeto plano con números.
 * Si la fila no existe (base vieja), se crea con los valores por defecto.
 */
async function obtenerParametros(transaction) {
    const [fila] = await Parametro.findOrCreate({ where: { id: 1 }, defaults: { id: 1 }, transaction });
    const p = fila.get({ plain: true });
    for (const campo of DECIMALES) p[campo] = Number(p[campo]);
    return p;
}

module.exports = { obtenerParametros };